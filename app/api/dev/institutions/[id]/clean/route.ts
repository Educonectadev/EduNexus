import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let conn: any = null
  try {
    const { id } = await params
    conn = await pool.rawPool.connect()

    await conn.query('BEGIN')
    let deletedTotal = 0

    const q = async (sql: string, args: any[]) => {
      try {
        const r = await conn.query(sql, args)
        return r.rowCount || 0
      } catch { return 0 }
    }

    deletedTotal += await q(`DELETE FROM parent_student WHERE parent_id IN (SELECT id FROM parents WHERE institution_id = $1)`, [id])
    deletedTotal += await q(`DELETE FROM parents WHERE institution_id = $1`, [id])
    deletedTotal += await q(`DELETE FROM enrollments WHERE student_id IN (SELECT id FROM students WHERE institution_id = $1)`, [id])
    deletedTotal += await q(`DELETE FROM students WHERE institution_id = $1`, [id])
    deletedTotal += await q(`DELETE FROM notifications WHERE institution_id = $1`, [id])
    deletedTotal += await q(`DELETE FROM audit_logs WHERE institution_id = $1`, [id])
    deletedTotal += await q(`DELETE FROM users WHERE institution_id = $1`, [id])

    await conn.query('COMMIT')
    return NextResponse.json({ success: true, deleted: deletedTotal })
  } catch (error: any) {
    if (conn) {
      try { await conn.query('ROLLBACK') } catch {}
    }
    return NextResponse.json({ error: error?.message || 'Error limpiando' }, { status: 500 })
  } finally {
    if (conn) {
      try { conn.release() } catch {}
    }
  }
}
