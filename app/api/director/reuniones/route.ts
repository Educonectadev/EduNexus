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

    const [rows] = await pool.query(
      `SELECT *, COALESCE(priority, 'media') as priority,
              COALESCE(pinned, 0) as pinned,
              COALESCE(location, '') as location,
              COALESCE(virtual_link, '') as virtual_link,
              COALESCE(agenda, '') as agenda
       FROM notifications
       WHERE type = 'meeting' AND institution_id = ?
       ORDER BY pinned DESC, meeting_date ASC, meeting_time ASC`,
      [instId]
    )
    return NextResponse.json(rows)
  } catch (error: any) {
    if (error?.code === 'ER_NO_SUCH_TABLE') return NextResponse.json([])
    console.error('Error fetching reuniones:', error)
    return NextResponse.json({ error: 'Error fetching reuniones' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user || (user.role !== 'director' && user.role !== 'dev' && user.role !== 'super_admin')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const instId = user.institutionId as string
    const userId = user.id as string

    const body = await request.json()
    const { title, message, agenda, meeting_date, meeting_time, location, virtual_link, target_role, priority } = body

    if (!title || !meeting_date) {
      return NextResponse.json({ error: 'Título y fecha son requeridos' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO notifications (id, title, message, agenda, type, target_role, priority, status, meeting_date, meeting_time, location, virtual_link, institution_id, created_by)
       VALUES (?, ?, ?, ?, 'meeting', ?, ?, 'active', ?, ?, ?, ?, ?, ?)`,
      [id, title, message || '', agenda || '', target_role || 'all', priority || 'media', meeting_date, meeting_time || null, location || null, virtual_link || null, instId, userId]
    )

    return NextResponse.json({ success: true, id })
  } catch (error: any) {
    if (error?.code === 'ER_NO_SUCH_TABLE') return NextResponse.json({ error: 'Tabla notifications no existe. Ejecuta la migración.' }, { status: 500 })
    console.error('Error creating reunión:', error)
    return NextResponse.json({ error: 'Error creating reunión' }, { status: 500 })
  }
}
