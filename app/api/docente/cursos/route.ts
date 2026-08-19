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

    // Auto-fix enrollments missing course_id for this teacher's courses
    await pool.query(
      `UPDATE enrollments e
       SET course_id = (
         SELECT c.id FROM courses c
         LEFT JOIN teachers t ON c.teacher_id = t.id
         WHERE c.institution_id = e.institution_id
           AND c.grade = e.grade
           AND c.section = e.section
           AND c.status = 'active'
           AND t.user_id = ?
         LIMIT 1
       )
       WHERE e.course_id IS NULL
         AND e.status = 'active'
         AND EXISTS (
           SELECT 1 FROM courses c2
           LEFT JOIN teachers t2 ON c2.teacher_id = t2.id
           WHERE c2.institution_id = e.institution_id
             AND c2.grade = e.grade
             AND c2.section = e.section
             AND c2.status = 'active'
             AND t2.user_id = ?
         )`,
      [userId, userId]
    )

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
