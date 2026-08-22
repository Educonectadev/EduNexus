import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload } from '@/lib/resolveInstId'
import { checkPlanFeature } from '@/lib/checkPlanLimit'
import crypto from 'crypto'
import { notifyParentsOfStudents } from '@/lib/notify'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'docente') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const userId = user.id as string
    const instId = user.institutionId as string

    const allowed = await checkPlanFeature(instId, 'can_grades')
    if (!allowed) {
      return NextResponse.json({ error: 'Calificaciones no disponibles en tu plan' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')

    const [courses] = await pool.query(
      `SELECT c.id, c.name, c.code, c.grade, c.section
       FROM courses c
       JOIN teachers t ON c.teacher_id = t.id
       WHERE t.user_id = ? AND c.status = 'active'
       ORDER BY c.grade, c.section, c.name`,
      [userId]
    ) as any[]

    if (courseId) {
      const [courseRows] = await pool.query(
        `SELECT c.id, c.name, c.code, c.grade, c.section
         FROM courses c
         JOIN teachers t ON c.teacher_id = t.id
         WHERE c.id = ? AND t.user_id = ? AND c.status = 'active'`,
        [courseId, userId]
      ) as any[]
      const course = courseRows[0]
      if (!course) {
        return NextResponse.json({ error: 'Curso no encontrado o no asignado' }, { status: 404 })
      }

      const [students] = await pool.query(
        `SELECT s.id, s.code, s.first_name, s.last_name, s.document_number, e.grade, e.section
         FROM students s
         JOIN enrollments e ON e.student_id = s.id
         WHERE e.course_id = ? AND e.status = 'active'
         ORDER BY s.last_name, s.first_name`,
        [courseId]
      ) as any[]

      const [grades] = await pool.query(
        `SELECT id, student_id, course_id, period, score, max_score, notes, created_at
         FROM grades
         WHERE institution_id = ? AND course_id = ?
         ORDER BY period`,
        [instId, courseId]
      ) as any[]

      const gradesByStudent: Record<string, any[]> = {}
      for (const g of grades) {
        ;(gradesByStudent[g.student_id] = gradesByStudent[g.student_id] || []).push(g)
      }

      const studentsWithGrades = (students as any[]).map((s: any) => ({ ...s, grades: gradesByStudent[s.id] || [] }))

      return NextResponse.json({ courses, course, students: studentsWithGrades })
    }

    return NextResponse.json({ courses, course: null, students: [] })
  } catch (error) {
    console.error('Error fetching calificaciones:', error)
    return NextResponse.json({ error: 'Error fetching calificaciones' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'docente') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const userId = user.id as string
    const instId = user.institutionId as string

    const allowed = await checkPlanFeature(instId, 'can_grades')
    if (!allowed) {
      return NextResponse.json({ error: 'Calificaciones no disponibles en tu plan' }, { status: 403 })
    }

    const body = await request.json()
    const { student_id, course_id, period, score, max_score, notes } = body

    if (!student_id || !course_id || !period || score === undefined) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const [courseRows] = await pool.query(
      `SELECT c.id
       FROM courses c
       JOIN teachers t ON c.teacher_id = t.id
       WHERE c.id = ? AND t.user_id = ? AND c.status = 'active'`,
      [course_id, userId]
    ) as any[]
    const course = courseRows[0]
    if (!course) {
      return NextResponse.json({ error: 'Curso no asignado' }, { status: 403 })
    }

    const [studentRows] = await pool.query(
      `SELECT s.id
       FROM students s
       JOIN enrollments e ON e.student_id = s.id
       WHERE s.id = ? AND e.course_id = ? AND e.status = 'active'`,
      [student_id, course_id]
    ) as any[]
    if (!studentRows[0]) {
      return NextResponse.json({ error: 'Alumno no pertenece al curso' }, { status: 403 })
    }

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO grades (id, institution_id, student_id, course_id, period, score, max_score, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (student_id, course_id, period) DO UPDATE SET
         score = EXCLUDED.score,
         max_score = EXCLUDED.max_score,
         notes = EXCLUDED.notes`,
      [id, instId, student_id, course_id, period, Number(score), Number(max_score || 20), notes || null]
    )

    try {
      const [info] = await pool.query(
        `SELECT CONCAT(s.first_name, ' ', s.last_name) AS student_name, c.name AS course_name
         FROM students s, courses c
         WHERE s.id = ? AND c.id = ?`,
        [student_id, course_id]
      ) as any[]
      const row = (info as any[])[0]
      notifyParentsOfStudents(
        instId,
        [student_id],
        'Nota publicada',
        `Se publicó la nota de ${row?.student_name || 'tu hijo(a)'} en ${row?.course_name || 'el curso'}: ${Number(score)}/${Number(max_score || 20)} (periodo ${period}).`,
        'grade', 'notas', 'media'
      )
    } catch { /* el aviso es opcional */ }

    return NextResponse.json({ success: true, id })
  } catch (error: any) {
    console.error('Error saving calificacion:', error)
    return NextResponse.json({ error: 'Error saving calificacion' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'docente') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const userId = user.id as string

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const [, meta] = await pool.query(
      `DELETE FROM grades
       WHERE id = ? AND course_id IN (
         SELECT c.id FROM courses c
         JOIN teachers t ON c.teacher_id = t.id
         WHERE t.user_id = ?
       )`,
      [id, userId]
    ) as any[]

    if (!meta || meta.affectedRows === 0) {
      return NextResponse.json({ error: 'Calificación no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting calificacion:', error)
    return NextResponse.json({ error: 'Error deleting calificacion' }, { status: 500 })
  }
}
