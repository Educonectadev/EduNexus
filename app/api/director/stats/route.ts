import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload, resolveInstId } from '@/lib/resolveInstId'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'Sin institucion' }, { status: 400 })

    // Single query for all stats
    const [stats] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM enrollments e WHERE e.status = 'active' AND e.institution_id = ?) as students,
        (SELECT COUNT(*) FROM users WHERE role = 'docente' AND status = 'active' AND institution_id = ?) as teachers,
        (SELECT COUNT(*) FROM enrollments WHERE status = 'active' AND institution_id = ?) as enrollments,
        (SELECT COUNT(*) FROM enrollments WHERE status = 'pending' AND institution_id = ?) as pending,
        (SELECT COUNT(*) FROM documents WHERE institution_id = ?) as documents,
        (SELECT COUNT(*) FROM courses WHERE institution_id = ?) as courses,
        (SELECT COUNT(*) FROM users WHERE role = 'padre' AND status = 'active' AND institution_id = ?) as parents,
        (SELECT COUNT(*) FROM users WHERE role = 'secretario' AND status = 'active' AND institution_id = ?) as secretary,
        (SELECT COUNT(*) FROM horarios WHERE status = 'active' AND institution_id = ?) as horarios,
        (SELECT COUNT(*) FROM courses WHERE status = 'active' AND institution_id = ?) as activeCourses
    `, [instId, instId, instId, instId, instId, instId, instId, instId, instId, instId]) as any[]

    const s = stats[0]

    const [weekHorarios] = await pool.query(
      `SELECT h.day_of_week, COUNT(*) as count
       FROM horarios h
       WHERE h.status = 'active' AND h.institution_id = ?
       GROUP BY h.day_of_week
       ORDER BY h.day_of_week`,
      [instId]
    )

    return NextResponse.json({
      students: s.students || 0,
      teachers: s.teachers || 0,
      enrollments: s.enrollments || 0,
      pending: s.pending || 0,
      documents: s.documents || 0,
      courses: s.courses || 0,
      parents: s.parents || 0,
      secretary: s.secretary || 0,
      horarios: s.horarios || 0,
      activeCourses: s.activeCourses || 0,
      weekHorarios: weekHorarios as any[],
    })
  } catch (error) {
    return NextResponse.json({
      students: 0, teachers: 0, enrollments: 0, pending: 0,
      documents: 0, courses: 0, parents: 0, secretary: 0,
      horarios: 0, activeCourses: 0, weekHorarios: [],
    })
  }
}
