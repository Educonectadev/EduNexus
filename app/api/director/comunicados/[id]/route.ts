import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload, resolveInstId } from '@/lib/resolveInstId'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'Sin institucion' }, { status: 400 })

    const { id } = await params

    const [existing] = await pool.query(
      'SELECT id FROM notifications WHERE id = ? AND institution_id = ?',
      [id, instId]
    ) as any[]
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Comunicado no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { title, message, target_role, priority, category } = body

    await pool.query(
      `UPDATE notifications SET title = ?, message = ?, target_role = ?, priority = ?, category = ? WHERE id = ? AND institution_id = ?`,
      [title, message, target_role || 'all', priority || 'media', category || 'general', id, instId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error updating comunicado' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'Sin institucion' }, { status: 400 })

    const { id } = await params
    const body = await request.json()

    if (body.pinned !== undefined) {
      await pool.query(
        `UPDATE notifications SET pinned = ? WHERE id = ? AND institution_id = ?`,
        [body.pinned ? 1 : 0, id, instId]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error updating comunicado' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'Sin institucion' }, { status: 400 })

    const { id } = await params
    await pool.query(`DELETE FROM notifications WHERE id = ? AND institution_id = ?`, [id, instId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting comunicado' }, { status: 500 })
  }
}
