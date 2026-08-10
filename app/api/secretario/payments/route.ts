import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
import crypto from 'crypto'
import { notifyParentsOfStudents } from '@/lib/notify'

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ payments: [], summary: {} })

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id') || ''
    const status = searchParams.get('status') || ''

    let query = `
      SELECT p.*, CONCAT(s.first_name, ' ', s.last_name) AS student_name,
             s.document_number AS student_dni, s.grade, s.section,
             pc.name AS concept_name,
             (p.amount - p.paid_amount) AS balance
      FROM payments p
      JOIN students s ON p.student_id = s.id
      LEFT JOIN payment_concepts pc ON p.concept_id = pc.id
      WHERE p.institution_id = ? AND p.deleted_at IS NULL
    `
    const params: any[] = [instId]

    if (studentId) { query += ` AND p.student_id = ?`; params.push(studentId) }
    if (status) { query += ` AND p.status = ?`; params.push(status) }

    query += ` ORDER BY p.created_at DESC LIMIT 100`

    const [payments] = await pool.query(query, params)

    const [summaryRows] = await pool.query(
      `SELECT status, COUNT(*) as count, SUM(paid_amount) as total
       FROM payments WHERE institution_id = ? AND deleted_at IS NULL GROUP BY status`,
      [instId]
    )

    const [debtTotal] = await pool.query(
      `SELECT COALESCE(SUM(amount - paid_amount), 0) as total FROM payments WHERE institution_id = ? AND status IN ('pending','partial','overdue') AND deleted_at IS NULL`,
      [instId]
    )

    return NextResponse.json({
      payments,
      summary: (summaryRows as any[]).reduce((acc: any, r: any) => ({ ...acc, [r.status]: { count: r.count, total: r.total } }), {}),
      total_debt: (debtTotal as any[])[0]?.total || 0,
    })
  } catch (error) {
    return NextResponse.json({ payments: [], summary: {}, total_debt: 0 })
  }
}

export async function POST(request: NextRequest) {
  let conn: any = null
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const body = await request.json()
    const { student_id, concept_id, amount, paid_amount, due_date, paid_date, status } = body

    if (!student_id || !amount) return NextResponse.json({ error: 'Estudiante y monto requeridos' }, { status: 400 })

    const conceptId = concept_id ? String(concept_id) : null

    // Validate the student belongs to the institution and the concept exists
    const [studentRows] = await pool.query(
      'SELECT id FROM students WHERE id = ? AND institution_id = ?',
      [student_id, instId]
    ) as any[]
    if (!(studentRows as any[])?.length) {
      return NextResponse.json({ error: 'Estudiante no encontrado en la institución' }, { status: 400 })
    }

    if (conceptId) {
      const [conceptRows] = await pool.query(
        'SELECT id FROM payment_concepts WHERE id = ? AND institution_id = ?',
        [conceptId, instId]
      ) as any[]
      if (!(conceptRows as any[])?.length) {
        return NextResponse.json({ error: 'Concepto no encontrado' }, { status: 400 })
      }
    }

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO payments (id, institution_id, student_id, concept_id, amount, paid_amount, due_date, paid_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, instId, student_id, conceptId, Number(amount), Number(paid_amount || 0),
        due_date || null, paid_date || null, status || 'pending',
      ]
    )

    try {
      const [info] = await pool.query(
        `SELECT CONCAT(s.first_name, ' ', s.last_name) AS student_name, pc.name AS concept_name
         FROM students s
         LEFT JOIN payment_concepts pc ON pc.id = ?
         WHERE s.id = ?`,
        [conceptId, student_id]
      ) as any[]
      const row = (info as any[])[0]
      const conceptName = row?.concept_name || 'cuota'
      const studentName = row?.student_name || 'tu hijo(a)'
      const isPaid = status === 'paid' || Number(paid_amount || 0) > 0
      notifyParentsOfStudents(
        instId,
        [student_id],
        isPaid ? 'Pago procesado' : 'Nuevo pago registrado',
        isPaid
          ? `Se procesó el pago de ${conceptName} de ${studentName} por S/ ${Number(amount).toFixed(2)}.`
          : `Se registró una ${conceptName} de S/ ${Number(amount).toFixed(2)} para ${studentName}${due_date ? ` con vencimiento el ${due_date}` : ''}.`,
        'payment', 'pagos', isPaid ? 'alta' : 'media'
      )
    } catch { /* el aviso es opcional */ }

    return NextResponse.json({ success: true, id })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error creating payment', details: error.message, code: error.code }, { status: 500 })
  } finally {
    if (conn) { try { conn.release() } catch {} }
  }
}
