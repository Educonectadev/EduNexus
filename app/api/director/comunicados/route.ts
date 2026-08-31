import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload } from '@/lib/resolveInstId'
import { sendPushToRole } from '@/lib/server-push'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json([])
    const instId = user.institutionId as string
    if (!instId) return NextResponse.json([])

    const [rows] = await pool.query(
      `SELECT id, title, COALESCE(message, '') as message, type, target_role, status,
              COALESCE(priority, 'media') as priority,
              COALESCE(category, 'general') as category,
              pinned,
              institution_id, created_at
       FROM notifications
       WHERE type = 'communication' AND institution_id = $1
       ORDER BY created_at DESC`,
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
    const { title, message, target_role, priority, category } = body

    if (!title || !message) {
      return NextResponse.json({ error: 'Título y mensaje son requeridos' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    try {
      await pool.rawPool.query(
        `INSERT INTO notifications (id, title, message, type, target_role, priority, category, institution_id, status)
         VALUES ($1, $2, $3, 'communication', $4, $5, $6, $7, 'active')`,
        [id, title, message, target_role || 'all', priority || 'media', category || 'general', instId]
      )
    } catch (e: any) {
      // Si falla por trigger roto (42804), arreglar y reintentar
      if (e?.code === '42804') {
        try {
          await pool.rawPool.query(`DROP TRIGGER IF EXISTS trg_notify_new_notification ON notifications`)
          await pool.rawPool.query(`DROP FUNCTION IF EXISTS notify_new_notification()`)
          await pool.rawPool.query(`
            CREATE OR REPLACE FUNCTION notify_new_notification()
            RETURNS TRIGGER AS $$
            DECLARE payload TEXT;
            BEGIN
              SELECT json_build_object(
                'id', NEW.id, 'user_id', COALESCE(NEW.user_id, ''),
                'institution_id', NEW.institution_id, 'target_role', NEW.target_role,
                'type', NEW.type, 'title', NEW.title,
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
          await pool.rawPool.query(`CREATE TRIGGER trg_notify_new_notification AFTER INSERT ON notifications FOR EACH ROW EXECUTE FUNCTION notify_new_notification()`)
        } catch {}
        await pool.rawPool.query(
          `INSERT INTO notifications (id, title, message, type, target_role, priority, category, institution_id, status)
           VALUES ($1, $2, $3, 'communication', $4, $5, $6, $7, 'active')`,
          [id, title, message, target_role || 'all', priority || 'media', category || 'general', instId]
        )
      } else if (e?.code === '42P01') {
        // Tabla no existe, crear
        await pool.rawPool.query(`
          CREATE TABLE IF NOT EXISTS notifications (
            id VARCHAR(36) NOT NULL PRIMARY KEY, title VARCHAR(255) NOT NULL,
            message TEXT DEFAULT NULL, type VARCHAR(50) NOT NULL DEFAULT 'info',
            target_role VARCHAR(50) DEFAULT 'all', status VARCHAR(20) DEFAULT 'active',
            meeting_date DATE DEFAULT NULL, meeting_time TIME DEFAULT NULL,
            institution_id VARCHAR(36) DEFAULT NULL, created_by VARCHAR(36) DEFAULT NULL,
            user_id VARCHAR(36) DEFAULT NULL, is_read BOOLEAN DEFAULT false,
            priority VARCHAR(20) DEFAULT 'media', category VARCHAR(50) DEFAULT 'general',
            pinned BOOLEAN DEFAULT false, location VARCHAR(255) DEFAULT NULL,
            virtual_link VARCHAR(500) DEFAULT NULL, agenda TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `)
        await pool.rawPool.query(
          `INSERT INTO notifications (id, title, message, type, target_role, priority, category, institution_id, status)
           VALUES ($1, $2, $3, 'communication', $4, $5, $6, $7, 'active')`,
          [id, title, message, target_role || 'all', priority || 'media', category || 'general', instId]
        )
      } else {
        throw e
      }
    }

    // Send push notifications in background (don't block response)
    sendPushToRole(instId, target_role || 'all', {
      title: `Nuevo comunicado: ${title}`,
      message: message.substring(0, 200),
      type: 'communication',
    }).catch(() => {})

    return NextResponse.json({ success: true, id })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 })
  }
}
