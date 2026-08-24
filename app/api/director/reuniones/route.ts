import { NextRequest, NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/resolveInstId'
import pool from '@/lib/db'
import crypto from 'crypto'

const CREATE_TABLE = `
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
);
`

let tableReady = false

async function ensureTable() {
  if (tableReady) return
  try {
    await pool.query(CREATE_TABLE)
    tableReady = true
  } catch {
    // tabla ya existe o error
    tableReady = true
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user || (user.role !== 'director' && user.role !== 'dev' && user.role !== 'super_admin')) {
      return NextResponse.json([])
    }
    const instId = user.institutionId as string
    if (!instId) return NextResponse.json([])

    await ensureTable()
    const [rows] = await pool.query(
      `SELECT id, title, COALESCE(message, '') as message, type, target_role, status,
              meeting_date, meeting_time, institution_id, created_at
       FROM notifications
       WHERE type = 'meeting' AND institution_id = ?
       ORDER BY meeting_date ASC, meeting_time ASC`,
      [instId]
    )
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    if (user.role !== 'director' && user.role !== 'dev' && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const instId = user.institutionId as string
    if (!instId) return NextResponse.json({ error: 'Sin institución' }, { status: 400 })

    const body = await request.json()
    const { title, message, meeting_date, meeting_time, target_role } = body

    if (!title || !meeting_date) {
      return NextResponse.json({ error: 'Título y fecha son requeridos' }, { status: 400 })
    }

    await ensureTable()
    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO notifications (id, title, message, type, target_role, status, meeting_date, meeting_time, institution_id)
       VALUES (?, ?, ?, 'meeting', ?, 'active', ?, ?, ?)`,
      [id, title, message || '', target_role || 'all', meeting_date, meeting_time || null, instId]
    )

    return NextResponse.json({ success: true, id })
  } catch (error: any) {
    const msg = error?.message || String(error)
    if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('42P01')) {
      return NextResponse.json({ error: 'Tabla notifications no existe. Ejecuta el SQL migration en tu base de datos.' }, { status: 500 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
