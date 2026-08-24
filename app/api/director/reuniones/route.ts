import { NextRequest, NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/resolveInstId'
import pool from '@/lib/db'
import crypto from 'crypto'

async function fixTrigger() {
  try {
    await pool.rawPool.query(`DROP TRIGGER IF EXISTS trg_notify_new_notification ON notifications`)
    await pool.rawPool.query(`DROP FUNCTION IF EXISTS notify_new_notification()`)
    await pool.rawPool.query(`
      CREATE OR REPLACE FUNCTION notify_new_notification()
      RETURNS TRIGGER AS $$
      DECLARE payload TEXT;
      BEGIN
        SELECT json_build_object(
          'id', NEW.id,
          'user_id', COALESCE(NEW.user_id, ''),
          'institution_id', NEW.institution_id,
          'target_role', NEW.target_role,
          'type', NEW.type,
          'title', NEW.title,
          'message', left(COALESCE(NEW.message, ''), 180),
          'category', COALESCE(NEW.category, 'general'),
          'priority', COALESCE(NEW.priority, 'media'),
          'pinned', COALESCE(NEW.pinned, false),
          'created_at', NEW.created_at
        )::text INTO payload;
        PERFORM pg_notify('edu_notifications', payload);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `)
    await pool.rawPool.query(`
      CREATE TRIGGER trg_notify_new_notification
        AFTER INSERT ON notifications
        FOR EACH ROW EXECUTE FUNCTION notify_new_notification()
    `)
  } catch {
    // Si falla, no importa — el INSERT sigue funcionando
  }
}

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
              CAST(COALESCE(pinned, 0) AS BOOLEAN) as pinned,
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

    // Intentar insertar con todos los campos
    try {
      await pool.rawPool.query(
        `INSERT INTO notifications (id, title, message, type, target_role, status, meeting_date, meeting_time, institution_id, priority, location, virtual_link, agenda)
         VALUES ($1, $2, $3, 'meeting', $4, 'active', $5, $6, $7, $8, $9, $10, $11)`,
        [id, title, message || '', target_role || 'all', meeting_date, meeting_time || null, instId, priority || 'media', location || '', virtual_link || '', agenda || '']
      )
      await fixTrigger()
      return NextResponse.json({ success: true, id })
    } catch (e: any) {
      // Error 42804 = datatype_mismatch (trigger roto con COALESCE boolean/integer)
      if (e?.code === '42804') {
        await fixTrigger()
        // Reintentar el INSERT
        try {
          await pool.rawPool.query(
            `INSERT INTO notifications (id, title, message, type, target_role, status, meeting_date, meeting_time, institution_id, priority, location, virtual_link, agenda)
             VALUES ($1, $2, $3, 'meeting', $4, 'active', $5, $6, $7, $8, $9, $10, $11)`,
            [id, title, message || '', target_role || 'all', meeting_date, meeting_time || null, instId, priority || 'media', location || '', virtual_link || '', agenda || '']
          )
          return NextResponse.json({ success: true, id })
        } catch (e3: any) {
          return NextResponse.json({ error: e3?.message || String(e3), code: e3?.code }, { status: 500 })
        }
      }
      // Si falla por columna faltante, insertar solo columnas base
      if (e?.code === '42703' || e?.code === '42P01') {
        try {
          await pool.rawPool.query(
            `INSERT INTO notifications (id, title, message, type, target_role, status, meeting_date, meeting_time, institution_id)
             VALUES ($1, $2, $3, 'meeting', $4, 'active', $5, $6, $7)`,
            [id, title, message || '', target_role || 'all', meeting_date, meeting_time || null, instId]
          )
          return NextResponse.json({ success: true, id, warning: 'Guardado sin campos extendidos' })
        } catch (e2: any) {
          if (e2?.code === '42P01') {
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
            await pool.rawPool.query(
              `INSERT INTO notifications (id, title, message, type, target_role, status, meeting_date, meeting_time, institution_id, priority, location, virtual_link, agenda)
               VALUES ($1, $2, $3, 'meeting', $4, 'active', $5, $6, $7, $8, $9, $10, $11)`,
              [id, title, message || '', target_role || 'all', meeting_date, meeting_time || null, instId, priority || 'media', location || '', virtual_link || '', agenda || '']
            )
            await fixTrigger()
            return NextResponse.json({ success: true, id })
          }
          return NextResponse.json({ error: e2?.message || String(e2), code: e2?.code }, { status: 500 })
        }
      }
      return NextResponse.json({ error: e?.message || String(e), code: e?.code }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 })
  }
}
