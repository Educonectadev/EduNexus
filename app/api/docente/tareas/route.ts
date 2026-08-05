import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload } from '@/lib/resolveInstId'
import { checkPlanFeature } from '@/lib/checkPlanLimit'
import crypto from 'crypto'

// Schema managed by migrations/

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'docente') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const instId = user.institutionId as string
    const allowed = await checkPlanFeature(instId, 'can_homework')
    if (!allowed) {
      return NextResponse.json({ error: 'Tareas no disponibles en tu plan' }, { status: 403 })
    }
    const userId = user.id as string
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')

    let query: string
    let params: any[]

    if (courseId) {
      query = `
        SELECT h.id, h.title, h.description, h.subject, h.start_date, h.due_date, h.status, h.priority,
               h.assigned_by, h.student_id, h.course_id, h.created_at,
               COUNT(CASE WHEN hs.status IN ('submitted','graded') THEN 1 END) as delivered_count,
               COUNT(DISTINCT CASE WHEN e2.status = 'active' THEN s2.id END) as total_students
        FROM homework h
        LEFT JOIN homework_submissions hs ON hs.homework_id = h.id
        LEFT JOIN enrollments e2 ON e2.course_id = h.course_id
        LEFT JOIN students s2 ON e2.student_id = s2.id
        WHERE h.course_id = ?
        GROUP BY h.id, h.title, h.description, h.subject, h.start_date, h.due_date, h.status, h.priority,
                 h.assigned_by, h.student_id, h.course_id, h.created_at
        ORDER BY h.due_date DESC
      `
      params = [courseId]
    } else {
      query = `
        SELECT h.id, h.title, h.description, h.subject, h.start_date, h.due_date, h.status, h.priority,
               h.assigned_by, h.student_id, h.course_id, h.created_at,
               COUNT(CASE WHEN hs.status IN ('submitted','graded') THEN 1 END) as delivered_count,
               COUNT(DISTINCT CASE WHEN e2.status = 'active' THEN s2.id END) as total_students
        FROM homework h
        LEFT JOIN homework_submissions hs ON hs.homework_id = h.id
        LEFT JOIN enrollments e2 ON e2.course_id = h.course_id
        LEFT JOIN students s2 ON e2.student_id = s2.id
        WHERE h.course_id IN (
          SELECT c.id FROM courses c WHERE c.teacher_id = ? AND c.status = 'active'
        )
        GROUP BY h.id, h.title, h.description, h.subject, h.start_date, h.due_date, h.status, h.priority,
                 h.assigned_by, h.student_id, h.course_id, h.created_at
        ORDER BY h.due_date DESC
      `
      params = [userId]
    }

    const [rows] = await pool.query(query, params)
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching docente tareas:', error)
    return NextResponse.json({ error: 'Error fetching tareas' }, { status: 500 })
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

    const allowed = await checkPlanFeature(instId, 'can_homework')
    if (!allowed) {
      return NextResponse.json({ error: 'Tareas no disponibles en tu plan' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, subject, start_date, due_date, priority, course_id, assigned_to_all } = body

    if (!title || !course_id) {
      return NextResponse.json({ error: 'title and course_id required' }, { status: 400 })
    }

    if (assigned_to_all) {
      const [students] = await pool.query(
        `SELECT e.student_id FROM enrollments e WHERE e.course_id = ? AND e.status = 'active'`,
        [course_id]
      ) as any[]

      const homeworkId = crypto.randomUUID()
      await pool.query(
        `INSERT INTO homework (id, title, description, subject, start_date, due_date, status, priority, assigned_by, student_id, course_id, institution_id)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, NULL, ?, ?)`,
        [homeworkId, title, description || null, subject || null, start_date || null, due_date || null, priority || 'medium', userId, course_id, instId || null]
      )

      for (const row of students) {
        const submissionId = crypto.randomUUID()
        await pool.query(
          `INSERT INTO homework_submissions (id, homework_id, student_id, status) VALUES (?, ?, ?, 'pending')
           ON CONFLICT (homework_id, student_id) DO NOTHING`,
          [submissionId, homeworkId, row.student_id]
        )
      }

      return NextResponse.json({ success: true, id: homeworkId, student_count: students.length })
    } else {
      const homeworkId = crypto.randomUUID()
      await pool.query(
        `INSERT INTO homework (id, title, description, subject, start_date, due_date, status, priority, assigned_by, student_id, course_id, institution_id)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)`,
        [homeworkId, title, description || null, subject || null, start_date || null, due_date || null, priority || 'medium', userId, null, course_id, instId || null]
      )

      return NextResponse.json({ success: true, id: homeworkId })
    }
  } catch (error) {
    console.error('Error creating tarea:', error)
    return NextResponse.json({ error: 'Error creating tarea' }, { status: 500 })
  }
}
