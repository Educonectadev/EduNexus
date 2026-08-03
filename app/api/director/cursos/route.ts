import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload, resolveInstId } from '@/lib/resolveInstId'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'Sin institucion' }, { status: 400 })

    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacher_id')

    let query = `
      SELECT c.id, c.institution_id, c.name, c.code, c.grade, c.section,
             c.teacher_id, c.status, c.created_at,
             COALESCE(u.full_name, 'Sin asignar') as teacher_name,
             COUNT(CASE WHEN e.status = 'active' THEN 1 END) as student_count
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN enrollments e ON e.course_id = c.id
      LEFT JOIN students s ON e.student_id = s.id AND s.institution_id = c.institution_id
      WHERE c.institution_id = ?
    `
    const params: any[] = [instId]

    if (teacherId) {
      query += ` AND c.teacher_id = ?`
      params.push(teacherId)
    }

    query += ` GROUP BY c.id, c.institution_id, c.name, c.code, c.grade, c.section, c.teacher_id, c.status, c.created_at, u.full_name`
    query += ` ORDER BY c.grade, c.section, c.name`

    const [rows] = await pool.query(query, params)
    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching courses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'Sin institucion' }, { status: 400 })

    const body = await request.json()
    const { name, code, grade, section, teacher_id } = body

    if (!name || !code || !grade) {
      return NextResponse.json({ error: 'Nombre, codigo y grado son requeridos' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO courses (id, name, code, grade, section, teacher_id, institution_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [id, name, code, grade, section || 'A', teacher_id || null, instId]
    )

    return NextResponse.json({ success: true, id })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error creating course', details: error.message }, { status: 500 })
  }
}
