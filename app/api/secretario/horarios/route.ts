import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    let query = `
      SELECT h.id, h.institution_id, h.course_id, h.day_of_week, h.start_time, h.end_time,
             h.classroom, h.status,
             c.name as course_name, c.grade, c.section, c.teacher_id,
             COALESCE(CONCAT(TRIM(t.first_name), ' ', TRIM(t.last_name)), 'Sin asignar') as teacher_name
      FROM horarios h
      JOIN courses c ON h.course_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      WHERE h.institution_id = ?
    `
    const params: any[] = [instId]

    query += ` ORDER BY h.day_of_week, h.start_time`

    const [rows] = await pool.query(query, params)
    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching horarios' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await request.json()
    const { course_id, day_of_week, start_time, end_time, classroom } = body

    if (!course_id || !day_of_week || !start_time || !end_time) {
      return NextResponse.json({ error: 'Curso, día, hora inicio y fin son requeridos' }, { status: 400 })
    }

    const [overlap] = await pool.query(
      `SELECT id FROM horarios
       WHERE course_id = ? AND day_of_week = ? AND status = 'active'
       AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))`,
      [course_id, day_of_week, end_time, start_time, end_time, start_time]
    )

    if ((overlap as any[]).length > 0) {
      return NextResponse.json({ error: 'El horario se superpone con otro existente' }, { status: 409 })
    }

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO horarios (id, institution_id, course_id, day_of_week, start_time, end_time, classroom, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [id, instId, course_id, day_of_week, start_time, end_time, classroom || null]
    )

    return NextResponse.json({ success: true, id })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error creating horario', details: error.message }, { status: 500 })
  }
}
