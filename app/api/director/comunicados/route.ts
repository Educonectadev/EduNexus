import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload, resolveInstId } from '@/lib/resolveInstId'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'Sin institucion' }, { status: 400 })

    const [rows] = await pool.query(
      `SELECT *, COALESCE(priority, 'media') as priority,
              COALESCE(category, 'general') as category,
              COALESCE(pinned, 0) as pinned
       FROM notifications WHERE type = 'communication' AND institution_id = ?
       ORDER BY pinned DESC, created_at DESC`,
      [instId]
    )
    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching comunicados' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'Sin institucion' }, { status: 400 })

    const body = await request.json()
    const { title, message, target_role, priority, category } = body

    if (!title || !message) {
      return NextResponse.json({ error: 'Titulo y mensaje son requeridos' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO notifications (id, title, message, type, target_role, priority, category, institution_id, status)
       VALUES (?, ?, ?, 'communication', ?, ?, ?, ?, 'active')`,
      [id, title, message, target_role || 'all', priority || 'media', category || 'general', instId]
    )

    return NextResponse.json({ success: true, id })
  } catch (error) {
    return NextResponse.json({ error: 'Error creating comunicado' }, { status: 500 })
  }
}
