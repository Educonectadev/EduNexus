import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload } from '@/lib/resolveInstId'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'docente') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const userId = user.id as string

    const [rows] = await pool.query(
      `SELECT h.id, h.institution_id, h.course_id, h.day_of_week, h.start_time, h.end_time,
              h.classroom, h.status,
              c.name as course_name, c.code as course_code, c.grade, c.section
       FROM horarios h
       JOIN courses c ON h.course_id = c.id
       JOIN teachers t ON c.teacher_id = t.id
       WHERE t.user_id = ? AND h.status = 'active'
       ORDER BY h.day_of_week, h.start_time`,
      [userId]
    )

    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching horarios' }, { status: 500 })
  }
}
