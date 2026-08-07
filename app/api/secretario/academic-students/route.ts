import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json([], { status: 200 })

    const { searchParams } = new URL(request.url)
    const grade = searchParams.get('grade') || ''
    const section = searchParams.get('section') || 'all'

    let query = `
      SELECT s.id, s.code, s.first_name, s.last_name, s.section, s.gender,
             s.document_number, s.birth_date, s.status
      FROM students s
      WHERE s.institution_id = ?
    `
    const params: any[] = [instId]

    if (grade) {
      query += ` AND s.grade = ?`
      params.push(grade)
    }
    if (section && section !== 'all') {
      query += ` AND s.section = ?`
      params.push(section)
    }

    query += ` ORDER BY s.section ASC, s.first_name ASC, s.last_name ASC`

    const [rows] = await pool.query(query, params)
    return NextResponse.json(rows)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error fetching students by grade' }, { status: 500 })
  }
}