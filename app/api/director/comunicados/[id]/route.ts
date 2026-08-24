import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload } from '@/lib/resolveInstId'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const instId = user.institutionId as string
    if (!instId) return NextResponse.json({ error: 'Sin institución' }, { status: 400 })

    const { id } = await params
    const body = await request.json()
    const { title, message, target_role, priority, category } = body

    await pool.rawPool.query(
      `UPDATE notifications SET title = $1, message = $2, target_role = $3, priority = $4, category = $5
       WHERE id = $6 AND institution_id = $7 AND type = 'communication'`,
      [title, message, target_role || 'all', priority || 'media', category || 'general', id, instId]
    )
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const instId = user.institutionId as string
    if (!instId) return NextResponse.json({ error: 'Sin institución' }, { status: 400 })

    const { id } = await params
    const body = await request.json()

    if (body.pinned !== undefined) {
      await pool.rawPool.query(
        `UPDATE notifications SET pinned = $1 WHERE id = $2 AND institution_id = $3 AND type = 'communication'`,
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
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const instId = user.institutionId as string
    if (!instId) return NextResponse.json({ error: 'Sin institución' }, { status: 400 })

    const { id } = await params
    await pool.rawPool.query(
      `DELETE FROM notifications WHERE id = $1 AND institution_id = $2 AND type = 'communication'`,
      [id, instId]
    )
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 })
  }
}
