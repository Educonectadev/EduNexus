import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, price, max_users, max_students, features, status } = body

    const [existing] = await pool.query('SELECT id FROM plans WHERE id = ?', [id]) as any
    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
    }

    await pool.query(
      `UPDATE plans SET name = ?, description = ?, price = ?, max_users = ?, max_students = ?, features = ?, status = ? WHERE id = ?`,
      [
        name,
        description || null,
        price || 0,
        max_users || 5,
        max_students || 50,
        features ? JSON.stringify(features) : null,
        status || 'active',
        id,
      ]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error updating plan' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await pool.query('DELETE FROM plans WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error deleting plan' }, { status: 500 })
  }
}
