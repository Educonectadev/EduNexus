import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const [rows] = await pool.query(
      `SELECT
         s.grade,
         s.section,
         COUNT(*) as student_count
       FROM students s
       WHERE s.institution_id = ? AND s.status = 'active' AND TRIM(s.grade) <> ''
       GROUP BY s.grade, s.section
       ORDER BY s.section ASC, s.grade`,
      [instId]
    ) as any[]

    const [courseRows] = await pool.query(
      `SELECT id, grade, section FROM courses WHERE institution_id = ?`,
      [instId]
    ) as any[]

    const normalize = (g: string) => (g || '').trim().replace(' de Secundaria', ' Secundaria').replace(' de Primaria', ' Primaria').replace(' de Inicial', ' Inicial')
    const existing = new Set((courseRows as any[]).map((c: any) => `${normalize(c.grade)}|${(c.section || 'A').trim()}`))

    const missing: any[] = []
    for (const r of rows as any[]) {
      const key = `${normalize(r.grade)}|${(r.section || 'A').trim()}`
      if (!existing.has(key)) {
        missing.push({
          grade: normalize(r.grade),
          original_grade: r.grade,
          section: (r.section || 'A').trim(),
          student_count: Number(r.student_count) || 0,
        })
      }
    }

    return NextResponse.json({ missing })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error checking missing courses', details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let conn: any = null
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const [rows] = await pool.query(
      `SELECT s.grade, s.section, COUNT(*) as student_count
       FROM students s
       WHERE s.institution_id = ? AND s.status = 'active' AND TRIM(s.grade) <> ''
       GROUP BY s.grade, s.section
       ORDER BY s.section ASC, s.grade`,
      [instId]
    ) as any[]

    const [courseRows] = await pool.query(
      `SELECT id, grade, section FROM courses WHERE institution_id = ?`,
      [instId]
    ) as any[]

    const normalize = (g: string) => (g || '').trim().replace(' de Secundaria', ' Secundaria').replace(' de Primaria', ' Primaria').replace(' de Inicial', ' Inicial')
    const existing = new Set((courseRows as any[]).map((c: any) => `${normalize(c.grade)}|${(c.section || 'A').trim()}`))

    const toCreate: Array<{ name: string; code: string; grade: string; section: string }> = []
    for (const r of rows as any[]) {
      const grade = normalize(r.grade)
      const section = (r.section || 'A').trim()
      const key = `${grade}|${section}`
      if (!existing.has(key)) {
        const code = `CRS-${grade.replace(/[^\dA-Za-z]/g, '')}${section}`
        toCreate.push({ name: `${grade} · Sección ${section}`, code, grade, section })
        existing.add(key)
      }
    }

    if (toCreate.length === 0) {
      return NextResponse.json({ success: true, created: 0 })
    }

    conn = await pool.rawPool.connect()
    await conn.query('BEGIN')

    for (const c of toCreate) {
      await conn.query(
        `INSERT INTO courses (id, institution_id, name, code, grade, section, teacher_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, NULL, 'active')`,
        [crypto.randomUUID(), instId, c.name, c.code, c.grade, c.section]
      )
    }

    await conn.query('COMMIT')

    return NextResponse.json({ success: true, created: toCreate.length, courses: toCreate })
  } catch (error: any) {
    if (conn) { try { await conn.query('ROLLBACK') } catch {} }
    console.error('[POST /api/secretario/cursos/generate]', error)
    return NextResponse.json({ error: 'Error generating courses', details: error.message }, { status: 500 })
  } finally {
    if (conn) { try { conn.release() } catch {} }
  }
}