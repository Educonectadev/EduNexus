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
    const { title, message, meeting_date, meeting_time, target_role, priority, location, virtual_link, agenda } = body

    await pool.rawPool.query(
      `UPDATE notifications SET title = $1, message = $2, meeting_date = $3, meeting_time = $4, target_role = $5, priority = $6, location = $7, virtual_link = $8, agenda = $9
       WHERE id = $10 AND institution_id = $11 AND type = 'meeting'`,
      [title, message || '', meeting_date, meeting_time || null, target_role || 'all', priority || 'media', location || '', virtual_link || '', agenda || '', id, instId]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'director') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const instId = user.institutionId as string

    const { id } = await params
    const body = await request.json()

    if (body.pinned !== undefined) {
      await pool.rawPool.query(
        `UPDATE notifications SET pinned = $1 WHERE id = $2 AND institution_id = $3 AND type = 'meeting'`,
        [body.pinned ? true : false, id, instId]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'director') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const instId = user.institutionId as string

    const { id } = await params
    await pool.rawPool.query(
      `DELETE FROM notifications WHERE id = $1 AND institution_id = $2 AND type = 'meeting'`,
      [id, instId]
    )
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 })
  }
}
