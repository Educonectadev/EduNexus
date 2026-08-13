import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getPadreUserId, getPadreChildrenIds, getPadreInstitutionId } from '@/lib/getPadreInfo'

// Registro/ficha de matrícula del(os) hijo(s) del padre, con todos los detalles:
// alumno, grado, sección, año, estado, fecha y pagos asociados (matrícula/mensualidad).
export async function GET(request: NextRequest) {
  try {
    const userId = await getPadreUserId(request)
    if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const instId = await getPadreInstitutionId(request)
    const childIds = await getPadreChildrenIds(userId)
    if (childIds.length === 0) return NextResponse.json({ children: [], institution: null })

    const [enrollments] = await pool.query(
      `SELECT e.id, e.grade, e.section, e.year, e.status,
              e.created_at AS enrolled_at,
              s.id AS student_id, s.code AS student_code,
              s.first_name, s.last_name, s.document_number, s.birth_date, s.gender
       FROM enrollments e
       JOIN students s ON e.student_id = s.id
       WHERE s.institution_id = ? AND e.student_id = ANY(?::text[])
       ORDER BY e.year DESC, e.created_at DESC`,
      [instId, childIds]
    ) as any[]

    const [payments] = await pool.query(
      `SELECT p.student_id, pc.name AS concept_name, p.amount, p.paid_amount,
              p.status AS payment_status, p.due_date, p.paid_date
       FROM payments p
       LEFT JOIN payment_concepts pc ON p.concept_id = pc.id
       WHERE p.student_id = ANY(?::text[]) AND p.deleted_at IS NULL
       ORDER BY p.due_date`,
      [childIds]
    ) as any[]

    const feesByStudent: Record<string, any[]> = {}
    for (const p of payments as any[]) {
      ;(feesByStudent[p.student_id] = feesByStudent[p.student_id] || []).push(p)
    }

    let institution: { name: string } | null = null
    if (instId) {
      const [instRows] = await pool.query(
        `SELECT name, code FROM institutions WHERE id = ?`,
        [instId]
      ) as any[]
      const inst = (instRows as any[])[0]
      if (inst) institution = { name: inst.name }
    }

    const children = (enrollments as any[]).map(e => ({
      enrollment_id: e.id,
      grade: e.grade,
      section: e.section,
      year: e.year,
      status: e.status,
      enrolled_at: e.enrolled_at,
      student: {
        id: e.student_id,
        code: e.student_code,
        first_name: e.first_name,
        last_name: e.last_name,
        full_name: `${e.first_name} ${e.last_name}`.trim(),
        document_number: e.document_number,
        birth_date: e.birth_date,
        gender: e.gender,
      },
      fees: feesByStudent[e.student_id] || [],
    }))

    return NextResponse.json({ children, institution })
  } catch (error) {
    console.error('Error fetching matricula:', error)
    return NextResponse.json({ error: 'Error al cargar la ficha de matrícula' }, { status: 500 })
  }
}