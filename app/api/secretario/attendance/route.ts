import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
import { checkPlanFeature } from '@/lib/checkPlanLimit'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ attendance: [], summary: {} })

    const allowed = await checkPlanFeature(instId, 'can_attendance')
    if (!allowed) {
      return NextResponse.json({ error: 'Asistencia no disponible en tu plan' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10)
    const grade = searchParams.get('grade') || ''
    const section = searchParams.get('section') || ''

    let query = `
      SELECT a.id, a.student_id, a.date, a.status, a.notes, a.created_at,
             CONCAT(s.first_name, ' ', s.last_name) AS student_name,
             s.document_number AS student_dni, s.grade, s.section
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE a.institution_id = ? AND a.date = ?
    `
    const params: any[] = [instId, date]

    if (grade) { query += ` AND s.grade = ?`; params.push(grade) }
    if (section) { query += ` AND s.section = ?`; params.push(section) }

    query += ` ORDER BY s.grade, s.section, s.first_name`

    const [attendance] = await pool.query(query, params)

    const [summary] = await pool.query(
      `SELECT status, COUNT(*) as count FROM attendance WHERE institution_id = ? AND date = ? GROUP BY status`,
      [instId, date]
    )

    const summaryObj: Record<string, number> = { present: 0, absent: 0, late: 0, justified: 0 }
    ;(summary as any[]).forEach((r: any) => { summaryObj[r.status] = r.count })

    return NextResponse.json({ attendance, summary: summaryObj })
  } catch (error) {
    return NextResponse.json({ attendance: [], summary: {} }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const allowed = await checkPlanFeature(instId, 'can_attendance')
    if (!allowed) {
      return NextResponse.json({ error: 'Asistencia no disponible en tu plan' }, { status: 403 })
    }

    const body = await request.json()
    const { student_id, date, status, notes } = body

    if (!student_id || !date || !status) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO attendance (id, institution_id, student_id, date, status, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status), notes = VALUES(notes)`,
      [id, instId, student_id, date, status, notes || null, null]
    )

    return NextResponse.json({ success: true, id })
  } catch (error) {
    return NextResponse.json({ error: 'Error al registrar asistencia' }, { status: 500 })
  }
}
