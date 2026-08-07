import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await params

    interface CourseRow {
      id: string; institution_id: string; name: string; code: string; grade: string; section: string; teacher_id: string | null; status: string
    }
    const [courseRows] = await pool.query(
      `SELECT id, institution_id, name, code, grade, section, teacher_id, status
       FROM courses WHERE id = ? AND institution_id = ? LIMIT 1`,
      [id, instId]
    ) as any[]
    const course = (courseRows as CourseRow[])?.[0]
    if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })

    const grade = (course.grade || '').trim()
    const section = (course.section || '').trim()
    const year = new Date().getFullYear()

    // Assigned: enrollments that point to this course (active, current year)
    const [assigned] = await pool.query(
      `SELECT e.student_id, s.id AS sid, s.first_name, s.last_name, s.section, s.document_number, s.status
       FROM enrollments e
       JOIN students s ON e.student_id = s.id
       WHERE e.institution_id = ? AND e.course_id = ? AND e.year = ? AND e.status = 'active'
       ORDER BY s.section ASC, s.last_name ASC, s.first_name ASC`,
      [instId, id, year]
    ) as any[]

    // Candidates: students of the same grade+section enrolled this year that are
    // not yet assigned to this course (course_id NULL or another course)
    let candidates: any[] = []
    if (grade || section) {
      const conds: string[] = ['e.institution_id = ?', 'e.year = ?', 'e.status = ?']
      const params: any[] = [instId, year, 'active']
      if (section) { conds.push('s.section = ?'); params.push(section) }
      if (grade) {
        conds.push(`(
          s.grade = ? OR
          REPLACE(s.grade, ' de Secundaria', ' Secundaria') = ? OR
          REPLACE(s.grade, ' de Primaria', ' Primaria') = ? OR
          REPLACE(s.grade, ' de Inicial', ' Inicial') = ?
        )`)
        params.push(grade, grade, grade, grade)
      }
      conds.push(`(e.course_id IS NULL OR e.course_id <> ?)`)
      params.push(id)

      const [rows] = await pool.query(
        `SELECT s.id, s.first_name, s.last_name, s.section, s.document_number, s.status
         FROM enrollments e
         JOIN students s ON e.student_id = s.id
         WHERE ${conds.join(' AND ')}
         ORDER BY s.section ASC, s.last_name ASC, s.first_name ASC`,
        params
      ) as any[]
      candidates = rows as any[]
    }

    return NextResponse.json({
      course,
      assigned: (assigned as any[]).map((r: any) => ({ ...r, id: r.sid, assigned: true })),
      candidates: candidates.map((r: any) => ({ ...r, assigned: false })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error fetching course students', details: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let conn: any = null
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const selectedIds: string[] = Array.isArray(body.studentIds) ? body.studentIds : []

    const [courseRows] = await pool.query(
      `SELECT id, institution_id, section FROM courses WHERE id = ? AND institution_id = ? LIMIT 1`,
      [id, instId]
    ) as any[]
    if (!(courseRows as any[])?.length) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })

    const year = new Date().getFullYear()

    conn = await pool.rawPool.connect()
    await conn.query('BEGIN')

    // Detach this course from any enrollments in case parents change section/grade
    await conn.query(
      `UPDATE enrollments SET course_id = NULL WHERE course_id = $1 AND institution_id = $2`,
      [id, instId]
    )

    // Attach selected students (keeping only the active enrollment for the current year)
    for (const sid of selectedIds) {
      const selRes = await conn.query(
        `SELECT id FROM enrollments
         WHERE student_id = $1 AND institution_id = $2 AND year = $3 AND status = 'active'
         ORDER BY created_at DESC LIMIT 1`,
        [sid, instId, year]
      )
      if (selRes.rows.length) {
        await conn.query(
          `UPDATE enrollments SET course_id = $1 WHERE id = $2`,
          [id, selRes.rows[0].id]
        )
      }
    }

    await conn.query('COMMIT')

    return NextResponse.json({ success: true, assigned: selectedIds.length })
  } catch (error: any) {
    if (conn) { try { await conn.query('ROLLBACK') } catch {} }
    console.error('[PUT /api/secretario/cursos/[id]/students]', error)
    return NextResponse.json({ error: 'Error saving course students', details: error.message }, { status: 500 })
  } finally {
    if (conn) { try { conn.release() } catch {} }
  }
}