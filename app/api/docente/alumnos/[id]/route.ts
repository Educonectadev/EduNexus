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

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')

    const [studentRows] = await pool.query(
      `SELECT s.id, s.code, s.first_name, s.last_name, s.full_name, s.document_number, s.dni,
              s.gender, s.grade, s.section, s.birth_date, s.academic_condition, s.photo_url
       FROM students s
       WHERE s.id = ? AND s.institution_id = ?`,
      [id, instId]
    ) as any[]
    const student = (studentRows as any[])[0]
    if (!student) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
    }

    let course = null
    let grades: any[] = []
    let attendanceSummary: any = { present: 0, late: 0, absent: 0, justified: 0, total: 0, rate: 0 }
    let recentAttendance: any[] = []

    if (courseId) {
      const [courseRows] = await pool.query(
        `SELECT c.id, c.name, c.code, c.grade, c.section
         FROM courses c
         JOIN teachers t ON c.teacher_id = t.id
         WHERE c.id = ? AND t.user_id = ? AND c.status = 'active'`,
        [courseId, userId]
      ) as any[]
      course = (courseRows as any[])[0]

      if (course) {
        const [g] = await pool.query(
          `SELECT id, course_id, period, score, max_score, notes, created_at
           FROM grades
           WHERE institution_id = ? AND student_id = ? AND course_id = ?
           ORDER BY period`,
          [instId, id, courseId]
        ) as any[]
        grades = g as any[]

        const [attRows] = await pool.query(
          `SELECT status, date
           FROM attendance
           WHERE institution_id = ? AND student_id = ?
           ORDER BY date DESC
           LIMIT 40`,
          [instId, id]
        ) as any[]

        const rows = attRows as any[]
        for (const a of rows) {
          if (a.status in attendanceSummary) attendanceSummary[a.status]++
        }
        attendanceSummary.total = rows.length
        const presentLike = attendanceSummary.present + attendanceSummary.late
        attendanceSummary.rate = rows.length ? Math.round((presentLike / rows.length) * 100) : 0

        recentAttendance = rows.slice(0, 10).map((a: any) => ({
          date: a.date,
          status: a.status,
        }))
      }
    }

    const [parentRows] = await pool.query(
      `SELECT p.id, p.first_name, p.last_name, p.document_number, p.email, p.phone, p.occupation,
              ps.relationship, ps.is_primary
       FROM parents p
       JOIN parent_student ps ON ps.parent_id = p.id
       WHERE ps.student_id = ? AND p.status = 'active'
       ORDER BY ps.is_primary DESC, ps.relationship`,
      [id]
    ) as any[]

    return NextResponse.json({
      student,
      course,
      grades,
      attendance: attendanceSummary,
      recentAttendance,
      parents: parentRows as any[],
    })
  } catch (error) {
    console.error('Error fetching student ficha:', error)
    return NextResponse.json({ error: 'Error fetching student ficha' }, { status: 500 })
  }
}
