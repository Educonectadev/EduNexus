import { NextRequest, NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/resolveInstId'
import pool from '@/lib/db'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json([])
    const instId = user.institutionId as string
    if (!instId) return NextResponse.json([])

    const [rows] = await pool.query(
      `SELECT id, title, COALESCE(message, '') as message, type, target_role, status,
              meeting_date, meeting_time, institution_id, created_at,
              COALESCE(priority, 'media') as priority,
              COALESCE(pinned, false) as pinned,
              COALESCE(location, '') as location,
              COALESCE(virtual_link, '') as virtual_link,
              COALESCE(agenda, '') as agenda
       FROM notifications
       WHERE type = 'meeting' AND institution_id = $1
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
    const instId = user.institutionId as string
    if (!instId) return NextResponse.json({ error: 'Sin institución' }, { status: 400 })

    const body = await request.json()
    const { title, message, meeting_date, meeting_time, target_role, priority, location, virtual_link, agenda } = body

    if (!title || !meeting_date) {
      return NextResponse.json({ error: 'Título y fecha son requeridos' }, { status: 400 })
    }

    const id = crypto.randomUUID()

    // Intentar crear la tabla si no existe
    try {
      await pool.rawPool.query(`
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
    } catch {
      // Si falla por permisos, continuamos e intentamos el INSERT
    }

    // Primero intentar insertar con todos los campos
    try {
      await pool.rawPool.query(
        `INSERT INTO notifications (id, title, message, type, target_role, status, meeting_date, meeting_time, institution_id, priority, location, virtual_link, agenda)
         VALUES ($1, $2, $3, 'meeting', $4, 'active', $5, $6, $7, $8, $9, $10, $11)`,
        [id, title, message || '', target_role || 'all', meeting_date, meeting_time || null, instId, priority || 'media', location || '', virtual_link || '', agenda || '']
      )
      return NextResponse.json({ success: true, id })
    } catch (e: any) {
      // Si falla por columnas faltantes, insertar solo con columnas base
      if (e?.code === '42703' || e?.message?.includes('column') || e?.code === '42P01') {
        try {
          await pool.rawPool.query(
            `INSERT INTO notifications (id, title, message, type, target_role, status, meeting_date, meeting_time, institution_id)
             VALUES ($1, $2, $3, 'meeting', $4, 'active', $5, $6, $7)`,
            [id, title, message || '', target_role || 'all', meeting_date, meeting_time || null, instId]
          )
          return NextResponse.json({ success: true, id, warning: 'Guardado sin campos extendidos (location, virtual_link, agenda, priority)' })
        } catch (e2: any) {
          return NextResponse.json({ error: e2?.message || String(e2), code: e2?.code || null }, { status: 500 })
        }
      }
      return NextResponse.json({ error: e?.message || String(e), code: e?.code || null }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 })
  }
}
