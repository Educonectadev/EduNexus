import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload } from '@/lib/resolveInstId'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'docente') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const instId = user.institutionId as string
    const userId = user.id as string

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10)
    const range = searchParams.get('range') || 'week'

    let dateFilter = ''
    const params: any[] = [instId, userId]

    if (range === 'today') {
      dateFilter = 'AND s.date = CURRENT_DATE'
    } else if (range === 'week') {
      dateFilter = 'AND s.date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL \'7 days\''
    } else if (range === 'month') {
      dateFilter = 'AND s.date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL \'30 days\''
    } else if (date) {
      dateFilter = 'AND s.date = ?'
      params.push(date)
    }

    const [asOriginal] = await pool.query(
      `SELECT s.id, s.course_id, s.date, s.substitute_teacher_id, s.notes, s.status, s.created_at,
              c.name AS course_name, c.grade, c.section,
              sub.full_name AS substitute_teacher_name,
              'original' AS my_role
       FROM teacher_substitutions s
       JOIN courses c ON s.course_id = c.id
       LEFT JOIN users sub ON sub.id = s.substitute_teacher_id
       WHERE s.institution_id = ? AND s.original_teacher_id = ? AND s.status = 'active' ${dateFilter}
       ORDER BY s.date ASC`,
      params
    ) as any[]

    const params2: any[] = [instId, userId]
    let dateFilter2 = ''
    if (range === 'today') {
      dateFilter2 = 'AND s.date = CURRENT_DATE'
    } else if (range === 'week') {
      dateFilter2 = 'AND s.date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL \'7 days\''
    } else if (range === 'month') {
      dateFilter2 = 'AND s.date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL \'30 days\''
    } else if (date) {
      dateFilter2 = 'AND s.date = ?'
      params2.push(date)
    }

    const [asSubstitute] = await pool.query(
      `SELECT s.id, s.course_id, s.date, s.original_teacher_id, s.notes, s.status, s.created_at,
              c.name AS course_name, c.grade, c.section,
              orig.full_name AS original_teacher_name,
              'substitute' AS my_role
       FROM teacher_substitutions s
       JOIN courses c ON s.course_id = c.id
       LEFT JOIN users orig ON orig.id = s.original_teacher_id
       WHERE s.institution_id = ? AND s.substitute_teacher_id = ? AND s.status = 'active' ${dateFilter2}
       ORDER BY s.date ASC`,
      params2
    ) as any[]

    const all = [...(asOriginal || []), ...(asSubstitute || [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    return NextResponse.json(all)
  } catch (error: any) {
    console.error('Error fetching docente substitutions:', error)
    return NextResponse.json({ error: 'Error fetching substitutions' }, { status: 500 })
  }
}
