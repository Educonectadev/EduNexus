import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json([], { status: 200 })

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const grade = searchParams.get('grade') || ''
    const status = searchParams.get('status') || ''

    let query = `
      SELECT s.id, CONCAT(s.first_name, ' ', s.last_name) AS full_name,
             s.document_number AS dni, s.grade AS grade_level, s.section, s.status, s.code,
             s.gender, s.birth_date
      FROM students s
      WHERE s.institution_id = ?
    `
    const params: any[] = [instId]

    if (q.trim()) {
      // Use prefix matching for index utilization
      const like = `${q}%`
      query += ` AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.document_number LIKE ? OR s.code LIKE ?)`
      params.push(like, like, like, like)
    }

    if (grade) {
      query += ` AND s.grade = ?`
      params.push(grade)
    }

    if (status) {
      query += ` AND s.status = ?`
      params.push(status)
    }

    query += ` ORDER BY s.first_name ASC LIMIT 50`

    const [rows] = await pool.query(query, params)
    return NextResponse.json(rows)
  } catch (error: any) {
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json([])
    }
    return NextResponse.json({ error: 'Error searching students' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    if (!studentId) return NextResponse.json({ error: 'student_id requerido' }, { status: 400 })

    const body = await request.json()
    const { status, academic_condition } = body

    if (status) {
      await pool.query(`UPDATE students SET status = ? WHERE id = ? AND institution_id = ?`, [status, studentId, instId])
    }

    if (academic_condition) {
      await pool.query(`UPDATE enrollments SET academic_condition = ? WHERE student_id = ? AND status = 'active'`, [academic_condition, studentId])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error updating student' }, { status: 500 })
  }
}
