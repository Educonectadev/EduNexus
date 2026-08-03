import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (body.status && !['active', 'inactive', 'suspended'].includes(body.status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    const updates: string[] = []
    const values: any[] = []

    if (body.status) { updates.push('status = ?'); values.push(body.status) }
    if (body.plan_id !== undefined) { updates.push('plan_id = ?'); values.push(body.plan_id || null) }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Sin campos para actualizar' }, { status: 400 })
    }

    values.push(id)
    await pool.query(`UPDATE institutions SET ${updates.join(', ')} WHERE id = ?`, values)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error updating institution' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      // Get user IDs for this institution
      const [users] = await conn.query('SELECT id FROM users WHERE institution_id = ?', [id])
      const userIds = (users as any[]).map(u => u.id)

      // Delete in order: child tables first
      const safeDelete = async (query: string, params: any[]) => {
        try { await conn.query(query, params) } catch (e: any) { if (e?.code !== 'ER_NO_SUCH_TABLE') throw e }
      }

      if (userIds.length > 0) {
        const placeholders = userIds.map(() => '?').join(',')
        await safeDelete(`DELETE FROM parent_student WHERE parent_id IN (SELECT id FROM parents WHERE institution_id = ?)`, [id])
        await safeDelete(`DELETE FROM parents WHERE institution_id = ?`, [id])
        await safeDelete(`DELETE FROM enrollments WHERE student_id IN (SELECT id FROM students WHERE institution_id = ?)`, [id])
        await safeDelete(`DELETE FROM students WHERE institution_id = ?`, [id])
        await safeDelete(`DELETE FROM notifications WHERE institution_id = ?`, [id])
        await safeDelete(`DELETE FROM audit_logs WHERE institution_id = ?`, [id])
        await safeDelete(`DELETE FROM users WHERE institution_id = ?`, [id])
      }

      await safeDelete(`DELETE FROM institutions WHERE id = ?`, [id])

      await conn.commit()
      return NextResponse.json({ success: true })
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Error deleting institution', details: error?.message }, { status: 500 })
  }
}
