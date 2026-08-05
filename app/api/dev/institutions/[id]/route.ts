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

    // Schema has ON DELETE CASCADE, so deleting the institution cascades
    // But we also need to delete users manually (they reference institution_id with CASCADE)
    await pool.query('DELETE FROM users WHERE institution_id = ?', [id])
    await pool.query('DELETE FROM institutions WHERE id = ?', [id])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error deleting institution', details: error?.message }, { status: 500 })
  }
}
