import { NextRequest, NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/resolveInstId'
import pool from '@/lib/db'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user || (user.role !== 'director' && user.role !== 'dev' && user.role !== 'super_admin')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const instId = user.institutionId as string
    if (!instId) return NextResponse.json([])

    const [rows] = await pool.query(
      `SELECT id, title, COALESCE(message, '') as message, type, target_role, status,
              meeting_date, meeting_time, institution_id, created_at
       FROM notifications
       WHERE type = 'meeting' AND institution_id = ?
       ORDER BY meeting_date ASC, meeting_time ASC`,
      [instId]
    )
    return NextResponse.json(rows)
  } catch (error: any) {
    console.error('Error fetching reuniones:', error)
    return NextResponse.json({ error: error?.message || String(error), code: error?.code || null }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado', detail: 'getAuthPayload returned null' }, { status: 401 })
    if (user.role !== 'director' && user.role !== 'dev' && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado', detail: `role=${user.role}` }, { status: 401 })
    }
    const instId = user.institutionId as string
    if (!instId) return NextResponse.json({ error: 'Sin institución', detail: 'institutionId is null', userId: user.id }, { status: 400 })

    const body = await request.json()
    const { title, message, meeting_date, meeting_time, target_role, priority } = body

    if (!title || !meeting_date) {
      return NextResponse.json({ error: 'Título y fecha son requeridos' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    const [result] = await pool.query(
      `INSERT INTO notifications (id, title, message, type, target_role, status, meeting_date, meeting_time, institution_id)
       VALUES (?, ?, ?, 'meeting', ?, 'active', ?, ?, ?)
       RETURNING id`,
      [id, title, message || '', target_role || 'all', meeting_date, meeting_time || null, instId]
    )

    return NextResponse.json({ success: true, id })
  } catch (error: any) {
    console.error('Error creating reunión:', error)
    return NextResponse.json({
      error: error?.message || String(error),
      code: error?.code || null,
      detail: error?.detail || null,
    }, { status: 500 })
  }
}
