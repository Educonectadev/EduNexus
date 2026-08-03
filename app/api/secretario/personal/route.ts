import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload, resolveInstId } from '@/lib/resolveInstId'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'Sin institucion' }, { status: 400 })

    const [rows] = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.dni, u.phone, u.subject, u.grade_level,
              u.specialization, u.contract_type, u.status, u.created_at,
              t.id as teacher_id
       FROM users u
       LEFT JOIN teachers t ON t.user_id = u.id AND t.institution_id = u.institution_id
       WHERE u.role IN ('docente', 'secretario') AND u.institution_id = ?
       ORDER BY u.created_at DESC`,
      [instId]
    )

    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching personal' }, { status: 500 })
  }
}
