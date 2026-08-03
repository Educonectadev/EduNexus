import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload } from '@/lib/resolveInstId'
import { checkPlanFeature } from '@/lib/checkPlanLimit'
import crypto from 'crypto'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { id } = await params

    const [hwRows] = await pool.query(
      `SELECT h.id, h.title, h.description, h.subject, h.start_date, h.due_date, h.status, h.priority,
              h.assigned_by, h.student_id, h.course_id, h.created_at
       FROM homework h WHERE h.id = ?`,
      [id]
    ) as any[]

    if (hwRows.length === 0) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
    }
    const homework = hwRows[0]

    const [students] = await pool.query(
      `SELECT e.student_id, s.full_name, s.dni, s.grade, s.section,
              COALESCE(hs.status, 'pending') as submission_status,
              hs.grade as submission_grade,
              hs.submitted_at,
              hs.feedback,
              hs.id as submission_id
       FROM enrollments e
       JOIN students s ON e.student_id = s.id
       LEFT JOIN homework_submissions hs ON hs.homework_id = ? AND hs.student_id = e.student_id
       WHERE e.course_id = ? AND e.status = 'active'
       ORDER BY s.full_name ASC`,
      [id, homework.course_id]
    ) as any[]

    const delivered = students.filter((s: any) => s.submission_status === 'submitted' || s.submission_status === 'graded').length
    const total = students.length

    return NextResponse.json({ ...homework, students, delivered_count: delivered, total_students: total })
  } catch (error) {
    console.error('Error fetching tarea detail:', error)
    return NextResponse.json({ error: 'Error fetching tarea detail' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { id } = await params
    const body = await request.json()
    const { status, action, submission_id, student_id, grade, feedback } = body

    if (action === 'update_submission' && submission_id) {
      await pool.query(
        `UPDATE homework_submissions SET status = ?, grade = ?, feedback = ?, submitted_at = IF(? = 'submitted', NOW(), submitted_at) WHERE id = ?`,
        [status || 'submitted', grade || null, feedback || null, status || 'submitted', submission_id]
      )
      return NextResponse.json({ success: true })
    }

    if (action === 'mark_submitted' && student_id) {
      const [existing] = await pool.query(
        `SELECT id FROM homework_submissions WHERE homework_id = ? AND student_id = ?`,
        [id, student_id]
      ) as any[]

      if (existing.length > 0) {
        await pool.query(
          `UPDATE homework_submissions SET status = 'submitted', submitted_at = NOW() WHERE id = ?`,
          [existing[0].id]
        )
      } else {
        const subId = crypto.randomUUID()
        await pool.query(
          `INSERT INTO homework_submissions (id, homework_id, student_id, status, submitted_at) VALUES (?, ?, ?, 'submitted', NOW())`,
          [subId, id, student_id]
        )
      }
      return NextResponse.json({ success: true })
    }

    if (status) {
      await pool.query(`UPDATE homework SET status = ? WHERE id = ?`, [status, id])
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating tarea:', error)
    return NextResponse.json({ error: 'Error updating tarea' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { id } = await params

    await pool.query(`DELETE FROM homework_submissions WHERE homework_id = ?`, [id])
    await pool.query(`DELETE FROM homework WHERE id = ?`, [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tarea:', error)
    return NextResponse.json({ error: 'Error deleting tarea' }, { status: 500 })
  }
}
