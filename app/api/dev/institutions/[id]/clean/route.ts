import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const conn = await pool.getConnection()

    try {
      await conn.beginTransaction()
      let deletedTotal = 0

      const q = async (sql: string, args: any[]) => {
        try { const [r] = await conn.query(sql, args); return (r as any).affectedRows || 0 } catch { return 0 }
      }

      deletedTotal += await q(`DELETE FROM parent_student WHERE parent_id IN (SELECT id FROM parents WHERE institution_id = ?)`, [id])
      deletedTotal += await q(`DELETE FROM parents WHERE institution_id = ?`, [id])
      deletedTotal += await q(`DELETE FROM enrollments WHERE student_id IN (SELECT id FROM students WHERE institution_id = ?)`, [id])
      deletedTotal += await q(`DELETE FROM students WHERE institution_id = ?`, [id])
      deletedTotal += await q(`DELETE FROM notifications WHERE institution_id = ?`, [id])
      deletedTotal += await q(`DELETE FROM audit_logs WHERE institution_id = ?`, [id])
      deletedTotal += await q(`DELETE FROM users WHERE institution_id = ?`, [id])

      await conn.commit()
      return NextResponse.json({ success: true, deleted: deletedTotal })
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error limpiando' }, { status: 500 })
  }
}
