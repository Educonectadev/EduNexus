import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    let institutions: any[] = []
    let recentUsers: any[] = []
    let stats = { institutions: 0, users: 0, directors: 0, secretarios: 0, docentes: 0, students: 0, parents: 0 }

    try {
      const [rows] = await pool.query(
        `SELECT i.id, i.code, i.name, i.type, i.level, i.district, i.province, i.department,
                i.status, i.created_at, i.total_students, i.total_teachers,
                p.name as plan_name, p.price as plan_price
         FROM institutions i
         LEFT JOIN plans p ON p.id = i.plan_id
         ORDER BY i.created_at DESC LIMIT 50`
      )
      institutions = rows as any[]
    } catch (e) {
      console.error('institutions query error:', e)
    }

    if (institutions.length > 0) {
      const instIds = institutions.map(i => `'${i.id}'`).join(',')

      // Users per institution per role
      try {
        const [userRows] = await pool.query(
          `SELECT institution_id, role, COUNT(*) as cnt
           FROM users
           WHERE institution_id IN (${instIds})
           GROUP BY institution_id, role`
        ) as any[]

        const userMap: Record<string, Record<string, number>> = {}
        for (const row of userRows) {
          if (!userMap[row.institution_id]) userMap[row.institution_id] = {}
          userMap[row.institution_id][row.role] = row.cnt
        }

        institutions = institutions.map(inst => {
          const users = userMap[inst.id] || {}
          return {
            ...inst,
            has_director: (users.director || 0) > 0,
            has_secretario: (users.secretario || 0) > 0,
            has_docentes: (users.docente || 0) > 0,
            docente_count: users.docente || 0,
          }
        })
      } catch (e) {
        console.error('users per institution error:', e)
      }

      // Parents per institution
      try {
        const [parentRows] = await pool.query(
          `SELECT institution_id, COUNT(*) as cnt
           FROM parents
           WHERE institution_id IN (${instIds})
           GROUP BY institution_id`
        ) as any[]

        const parentMap: Record<string, number> = {}
        for (const row of parentRows) parentMap[row.institution_id] = row.cnt

        institutions = institutions.map(inst => ({
          ...inst,
          has_padres: (parentMap[inst.id] || 0) > 0,
          padre_count: parentMap[inst.id] || 0,
        }))
      } catch (e) {
        console.error('parents per institution error:', e)
      }

      // Students per institution
      try {
        const [studentRows] = await pool.query(
          `SELECT institution_id, COUNT(*) as cnt
           FROM students
           WHERE institution_id IN (${instIds})
           GROUP BY institution_id`
        ) as any[]

        const studentMap: Record<string, number> = {}
        for (const row of studentRows) studentMap[row.institution_id] = row.cnt

        institutions = institutions.map(inst => ({
          ...inst,
          has_estudiantes: (studentMap[inst.id] || 0) > 0,
          estudiante_count: studentMap[inst.id] || 0,
        }))
      } catch (e) {
        console.error('students per institution error:', e)
      }

      // Parent-student links per institution
      try {
        const [linkRows] = await pool.query(
          `SELECT s.institution_id, COUNT(DISTINCT ps.parent_id) as linked_parents, COUNT(DISTINCT ps.student_id) as linked_students
           FROM parent_student ps
           JOIN students s ON s.id = ps.student_id
           WHERE s.institution_id IN (${instIds})
           GROUP BY s.institution_id`
        ) as any[]

        const linkMap: Record<string, { linked_parents: number; linked_students: number }> = {}
        for (const row of linkRows) linkMap[row.institution_id] = row

        institutions = institutions.map(inst => {
          const link = linkMap[inst.id]
          return {
            ...inst,
            has_links: link ? link.linked_parents > 0 : false,
            linked_parents: link?.linked_parents || 0,
            linked_students: link?.linked_students || 0,
          }
        })
      } catch (e) {
        console.error('parent_student links error:', e)
      }
    }

    // Global stats
    try {
      const [rows] = await pool.query(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN role = 'director' THEN 1 ELSE 0 END) as directors,
                SUM(CASE WHEN role = 'secretario' THEN 1 ELSE 0 END) as secretarios,
                SUM(CASE WHEN role = 'docente' THEN 1 ELSE 0 END) as docentes
         FROM users`
      )
      const s = (rows as any[])[0] || {}
      stats.users = s.total || 0
      stats.directors = s.directors || 0
      stats.secretarios = s.secretarios || 0
      stats.docentes = s.docentes || 0
    } catch (e) {}

    try {
      const [rows] = await pool.query(`SELECT COUNT(*) as total FROM students`)
      stats.students = ((rows as any[])[0] as any)?.total || 0
    } catch (e) {}

    try {
      const [rows] = await pool.query(`SELECT COUNT(*) as total FROM parents`)
      stats.parents = ((rows as any[])[0] as any)?.total || 0
    } catch (e) {}

    stats.institutions = institutions.length

    try {
      const [rows] = await pool.query(
        `SELECT u.id, u.full_name as name, u.role, u.created_at, i.name as institution_name
         FROM users u LEFT JOIN institutions i ON i.id = u.institution_id
         ORDER BY u.created_at DESC LIMIT 20`
      )
      recentUsers = rows as any[]
    } catch (e) {}

    return NextResponse.json({ institutions, stats, recentUsers })
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching institution data', detail: String(error) }, { status: 500 })
  }
}
