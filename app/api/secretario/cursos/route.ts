import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    let query = `
      SELECT c.id, c.institution_id, c.name, c.code, c.grade, c.section,
             c.teacher_id, c.status, c.created_at,
             COALESCE(u.full_name, CONCAT(TRIM(t.first_name), ' ', TRIM(t.last_name)), 'Sin asignar') as teacher_name,
(SELECT COUNT(*) FROM enrollments e
              WHERE e.course_id = c.id AND e.status = 'active'
             ) as student_count,
             (SELECT COUNT(*) FROM horarios h
              WHERE h.course_id = c.id AND h.status = 'active'
             ) as schedule_count
      FROM courses c
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE c.institution_id = ?
    `
    const params: any[] = [instId]

    query += ` ORDER BY c.grade, c.section, c.name`

    const [rows] = await pool.query(query, params)
    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching cursos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await request.json()
    const { name, code, grade, section, teacher_id } = body

    if (!name || !code || !grade) {
      return NextResponse.json({ error: 'Nombre, código y grado son requeridos' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO courses (id, institution_id, name, code, grade, section, teacher_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [id, instId, name, code, grade, section || 'A', teacher_id || null]
    )

    return NextResponse.json({ success: true, id })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error creating curso', details: error.message }, { status: 500 })
  }
}
