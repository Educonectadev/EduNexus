import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload, resolveInstId } from '@/lib/resolveInstId'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'Sin institucion' }, { status: 400 })

    const [staff] = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.dni, u.phone, u.subject, u.status, u.created_at
       FROM users u
       WHERE u.role IN ('director', 'secretario', 'docente', 'padre') AND u.institution_id = ?
       ORDER BY u.role, u.full_name`,
      [instId]
    )

const [students] = await pool.query(
      `SELECT s.id, s.code, s.first_name, s.last_name, s.document_number, s.grade, s.section, s.shift,
               s.status, s.gender, s.birth_date
        FROM students s
        JOIN enrollments e ON e.student_id = s.id
        WHERE e.institution_id = ?
        GROUP BY s.id
        ORDER BY s.grade, s.section, s.first_name`,
      [instId]
    )

    const grouped = {
      director: (staff as any[]).filter(s => s.role === 'director'),
      secretario: (staff as any[]).filter(s => s.role === 'secretario'),
      docente: (staff as any[]).filter(s => s.role === 'docente'),
      padre: (staff as any[]).filter(s => s.role === 'padre'),
    }

    return NextResponse.json({ staff: grouped, students })
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching plantel data' }, { status: 500 })
  }
}
