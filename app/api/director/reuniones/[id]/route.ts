import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import pool from '@/lib/db'

async function getAuthUser(request: NextRequest) {
  const token = request.headers.get('cookie')?.match(/token=([^;]+)/)?.[1]
  if (!token) return null
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'educonecta-secret')
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { title, message, agenda, meeting_date, meeting_time, location, virtual_link, target_role, priority } = body

    await pool.query(
      `UPDATE notifications SET title = ?, message = ?, agenda = ?, meeting_date = ?, meeting_time = ?, location = ?, virtual_link = ?, target_role = ?, priority = ? WHERE id = ? AND institution_id = ? AND type = 'meeting'`,
      [title, message || '', agenda || '', meeting_date, meeting_time || null, location || null, virtual_link || null, target_role || 'all', priority || 'media', id, user.institutionId]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error updating reunión' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await params
    const body = await request.json()

    if (body.pinned !== undefined) {
      await pool.query(
        `UPDATE notifications SET pinned = ? WHERE id = ? AND institution_id = ? AND type = 'meeting'`,
        [body.pinned ? 1 : 0, id, user.institutionId]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error updating reunión' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await params
    await pool.query(
      `DELETE FROM notifications WHERE id = ? AND institution_id = ? AND type = 'meeting'`,
      [id, user.institutionId]
    )
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.code === 'ER_NO_SUCH_TABLE') return NextResponse.json([])
    return NextResponse.json({ error: 'Error deleting reunión' }, { status: 500 })
  }
}
