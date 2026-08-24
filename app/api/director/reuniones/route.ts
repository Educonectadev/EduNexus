import { NextRequest, NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/resolveInstId'
import pool from '@/lib/db'
import crypto from 'crypto'

async function ensureTable(): Promise<string | null> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT DEFAULT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'info',
        target_role VARCHAR(50) DEFAULT 'all',
        status VARCHAR(20) DEFAULT 'active',
        meeting_date DATE DEFAULT NULL,
        meeting_time TIME DEFAULT NULL,
        institution_id VARCHAR(36) DEFAULT NULL,
        created_by VARCHAR(36) DEFAULT NULL,
        user_id VARCHAR(36) DEFAULT NULL,
        is_read BOOLEAN DEFAULT false,
        priority VARCHAR(20) DEFAULT 'media',
        category VARCHAR(50) DEFAULT 'general',
        pinned BOOLEAN DEFAULT false,
        location VARCHAR(255) DEFAULT NULL,
        virtual_link VARCHAR(500) DEFAULT NULL,
        agenda TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    return null
  } catch (e: any) {
    return e?.message || String(e)
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json([])
    const instId = user.institutionId as string
    if (!instId) return NextResponse.json([])

    const tableErr = await ensureTable()
    if (tableErr) return NextResponse.json([])

    try {
      const [rows] = await pool.query(
        `SELECT id, title, COALESCE(message, '') as message, type, target_role, status,
                meeting_date, meeting_time, institution_id, created_at
         FROM notifications
         WHERE type = 'meeting' AND institution_id = $1
         ORDER BY meeting_date ASC, meeting_time ASC`,
        [instId]
      )
      return NextResponse.json(rows)
    } catch {
      return NextResponse.json([])
    }
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  let step = 'init'
  try {
    step = 'getAuthPayload'
    const user = await getAuthPayload(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado', step }, { status: 401 })
    }

    step = 'getInstId'
    const instId = user.institutionId as string
    if (!instId) {
      return NextResponse.json({ error: 'Sin institución', step, userId: user.id }, { status: 400 })
    }

    step = 'parseBody'
    const body = await request.json()
    const { title, message, meeting_date, meeting_time, target_role } = body

    if (!title || !meeting_date) {
      return NextResponse.json({ error: 'Título y fecha son requeridos', step }, { status: 400 })
    }

    step = 'ensureTable'
    const tableErr = await ensureTable()
    if (tableErr) {
      return NextResponse.json({ error: 'No se pudo crear tabla notifications', step, detail: tableErr }, { status: 500 })
    }

    step = 'insert'
    const id = crypto.randomUUID()
    const [result] = await pool.query(
      `INSERT INTO notifications (id, title, message, type, target_role, status, meeting_date, meeting_time, institution_id)
       VALUES ($1, $2, $3, 'meeting', $4, 'active', $5, $6, $7)`,
      [id, title, message || '', target_role || 'all', meeting_date, meeting_time || null, instId]
    )

    return NextResponse.json({ success: true, id })
  } catch (error: any) {
    return NextResponse.json({
      error: error?.message || String(error),
      code: error?.code || null,
      step,
    }, { status: 500 })
  }
}
