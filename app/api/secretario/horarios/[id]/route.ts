import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
import { notifyUsers, notifyRole, resolveCourseTeacherUser, getCourseName, dayName } from '@/lib/notify'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { course_id, day_of_week, start_time, end_time, classroom, status } = body

    await pool.query(
      `UPDATE horarios SET course_id = ?, day_of_week = ?, start_time = ?, end_time = ?, classroom = ?, status = ? WHERE id = ? AND institution_id = ?`,
      [course_id, day_of_week, start_time, end_time, classroom || null, status || 'active', id, instId]
    )

    const courseName = await getCourseName(course_id)
    const teacherUserId = await resolveCourseTeacherUser(course_id)
    const message = `Tu horario de ${courseName} fue actualizado (${dayName(day_of_week)} de ${start_time} a ${end_time}).`
    if (teacherUserId) notifyUsers(instId, [teacherUserId], 'Horario actualizado', message, 'schedule', 'horarios', 'media')
    else notifyRole(instId, 'docente', 'Horario actualizado', message, 'schedule', 'horarios', 'media')

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error updating horario' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await params
    await pool.query(`DELETE FROM horarios WHERE id = ? AND institution_id = ?`, [id, instId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting horario' }, { status: 500 })
  }
}
