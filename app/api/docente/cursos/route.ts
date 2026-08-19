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
      `SELECT c.id, c.name, c.code, c.grade, c.section, c.status, c.created_at,
              (SELECT COUNT(*) FROM enrollments e
               JOIN students s ON e.student_id = s.id
               WHERE e.course_id = c.id AND e.status = 'active'
              ) as student_count
       FROM courses c
       LEFT JOIN teachers t ON c.teacher_id = t.id
       WHERE t.user_id = ? AND c.status = 'active'
       ORDER BY c.grade, c.section, c.name`,
      [userId]
    )

    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching courses' }, { status: 500 })
  }
}
