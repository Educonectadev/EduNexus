import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
import { checkPlanFeature } from '@/lib/checkPlanLimit'
import crypto from 'crypto'
import { notifyParentsOfStudents } from '@/lib/notify'

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json([])

    const allowed = await checkPlanFeature(instId, 'can_grades')
    if (!allowed) {
      return NextResponse.json({ error: 'Calificaciones no disponibles en tu plan' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id') || ''
    const studentId = searchParams.get('student_id') || ''
    const period = searchParams.get('period') || ''

    let query = `
      SELECT g.id, g.student_id, g.course_id, g.period, g.score, g.max_score, g.notes, g.created_at,
             CONCAT(s.first_name, ' ', s.last_name) AS student_name,
             s.grade, s.section,
             c.name AS course_name
      FROM grades g
      JOIN students s ON g.student_id = s.id
      JOIN courses c ON g.course_id = c.id
      WHERE g.institution_id = ?
    `
    const params: any[] = [instId]

    if (courseId) { query += ` AND g.course_id = ?`; params.push(courseId) }
    if (studentId) { query += ` AND g.student_id = ?`; params.push(studentId) }
    if (period) { query += ` AND g.period = ?`; params.push(period) }

    query += ` ORDER BY s.grade, s.section, s.first_name, g.period`

    const [rows] = await pool.query(query, params)
    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const allowed = await checkPlanFeature(instId, 'can_grades')
    if (!allowed) {
      return NextResponse.json({ error: 'Calificaciones no disponibles en tu plan' }, { status: 403 })
    }

    const body = await request.json()
    const { student_id, course_id, period, score, max_score, notes } = body

    if (!student_id || !course_id || !period || score === undefined) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
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
    return NextResponse.json({ error: 'Error saving grade' }, { status: 500 })
  }
}
