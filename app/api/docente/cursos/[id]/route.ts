import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload } from '@/lib/resolveInstId'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'docente') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const userId = user.id as string
    const instId = user.institutionId as string
    const { id } = await params

    const [courseRows] = await pool.query(
      `SELECT c.id, c.name, c.code, c.grade, c.section, c.status, c.created_at,
              (SELECT COUNT(*) FROM enrollments e
               JOIN students s ON e.student_id = s.id
               WHERE s.institution_id = ? AND s.grade = c.grade AND s.section = c.section AND e.status = 'active'
              ) as student_count
       FROM courses c
       LEFT JOIN teachers t ON c.teacher_id = t.id
       WHERE c.id = ? AND t.user_id = ? AND c.status = 'active'`,
      [instId, id, userId]
    )
    const course = (courseRows as any[])[0]
    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado o no asignado' }, { status: 404 })
    }

    const [teachers] = await pool.query(
      `SELECT t.id, u.id as user_id, u.full_name, u.email
       FROM courses c
       LEFT JOIN teachers t ON c.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE c.id = ?`,
      [id]
    )

    const [students] = await pool.query(
      `SELECT s.id, s.code, s.first_name, s.last_name, s.document_number, s.gender, s.grade, s.section
       FROM students s
       JOIN enrollments e ON e.student_id = s.id
       WHERE s.institution_id = ? AND s.grade = ? AND s.section = ? AND e.status = 'active'
       ORDER BY s.last_name, s.first_name`,
      [instId, course.grade, course.section]
    )

    return NextResponse.json({
      course: {
        id: course.id,
        name: course.name,
        code: course.code,
        grade: course.grade,
        section: course.section,
        student_count: course.student_count,
      },
      teachers: teachers as any[],
      students: students as any[],
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching course detail' }, { status: 500 })
  }
}
