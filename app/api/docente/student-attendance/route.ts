import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload } from '@/lib/resolveInstId'
import { checkPlanFeature } from '@/lib/checkPlanLimit'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'docente') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const instId = user.institutionId as string
    const allowed = await checkPlanFeature(instId, 'can_attendance')
    if (!allowed) {
      return NextResponse.json({ error: 'Asistencia no disponible en tu plan' }, { status: 403 })
    }
    const userId = user.id as string
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10)

    if (!courseId) {
      return NextResponse.json({ error: 'course_id es requerido' }, { status: 400 })
    }

    const [courseRows] = await pool.query(
      `SELECT c.id, c.grade, c.section
       FROM courses c
       LEFT JOIN teachers t ON c.teacher_id = t.id
       WHERE c.id = ? AND t.user_id = ?`,
      [courseId, userId]
    )
    const course = (courseRows as any[])[0]
    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado o no asignado' }, { status: 404 })
    }

    const [students] = await pool.query(
      `SELECT s.id, s.document_number, s.first_name, s.last_name
       FROM students s
       JOIN enrollments e ON e.student_id = s.id
       WHERE s.grade = ? AND s.section = ? AND e.status = 'active'
       ORDER BY s.last_name, s.first_name`,
      [course.grade, course.section]
    )

    const [attendanceRows] = await pool.query(
      `SELECT student_id, status, notes FROM attendance WHERE date = ? AND student_id IN (${(students as any[]).length ? (students as any[]).map(() => '?').join(',') : 'NULL'})`,
      [date, ...(students as any[]).map(s => s.id)]
    )
    const attendanceMap: Record<string, any> = {}
    for (const a of attendanceRows as any[]) {
      attendanceMap[a.student_id] = a
    }

    const result = (students as any[]).map(s => ({
      id: s.id,
      dni: s.document_number,
      nombres: s.first_name,
      apellidos: s.last_name,
      status: attendanceMap[s.id]?.status || null,
      notes: attendanceMap[s.id]?.notes || '',
    }))

    const present = result.filter(s => s.status === 'present').length
    const late = result.filter(s => s.status === 'late').length
    const absent = result.filter(s => s.status === 'absent').length
    const justified = result.filter(s => s.status === 'justified').length

    return NextResponse.json({
      students: result,
      summary: { present, late, absent, justified, total: result.length },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching students' }, { status: 500 })
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

    const allowed = await checkPlanFeature(instId, 'can_attendance')
    if (!allowed) {
      return NextResponse.json({ error: 'Asistencia no disponible en tu plan' }, { status: 403 })
    }

    const body = await request.json()
    const { course_id, date, records } = body

    if (!course_id || !date || !records?.length) {
      return NextResponse.json({ error: 'course_id, date y records son requeridos' }, { status: 400 })
    }

    const [courseRows] = await pool.query(
      `SELECT c.id
       FROM courses c
       LEFT JOIN teachers t ON c.teacher_id = t.id
       WHERE c.id = ? AND t.user_id = ?`,
      [course_id, userId]
    )
    if (!(courseRows as any[])[0]) {
      return NextResponse.json({ error: 'Curso no encontrado o no asignado' }, { status: 404 })
    }

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      for (const r of records) {
        if (!r.student_id || !r.status) continue
        const id = crypto.randomUUID()
        await conn.query(
          `INSERT INTO attendance (id, institution_id, student_id, date, status, notes, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (student_id, date) DO UPDATE SET
             status = EXCLUDED.status,
             notes = EXCLUDED.notes`,
          [id, instId, r.student_id, date, r.status, r.notes || '', userId]
        )
      }

      await conn.commit()
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error saving attendance' }, { status: 500 })
  }
}
