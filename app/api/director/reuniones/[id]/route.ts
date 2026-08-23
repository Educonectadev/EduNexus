import { NextRequest, NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/resolveInstId'
import pool from '@/lib/db'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'director') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const instId = user.institutionId as string

    const { id } = await params
    const body = await request.json()
    const { title, message, meeting_date, meeting_time, target_role, priority } = body

    await pool.query(
      `UPDATE notifications SET title = ?, message = ?, meeting_date = ?, meeting_time = ?, target_role = ?, priority = ? WHERE id = ? AND institution_id = ? AND type = 'meeting'`,
      [title, message || '', meeting_date, meeting_time || null, target_role || 'all', priority || 'media', id, instId]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating reunión:', error?.message || error)
    return NextResponse.json({ error: 'Error updating reunión' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'director') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const instId = user.institutionId as string

    const { id } = await params
    await pool.query(
      `DELETE FROM notifications WHERE id = ? AND institution_id = ? AND type = 'meeting'`,
      [id, instId]
    )
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting reunión:', error?.message || error)
    return NextResponse.json({ error: 'Error deleting reunión' }, { status: 500 })
  }
}
