import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import crypto from 'crypto'
import { getAuthPayload } from '@/lib/resolveInstId'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const endpoint = request.nextUrl.searchParams.get('endpoint')
    if (!endpoint) return NextResponse.json({ active: false })

    const [rows] = await pool.query(
      'SELECT 1 FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2',
      [endpoint, user.id]
    ).catch(() => [] as any[]) as any[]

    return NextResponse.json({ active: (rows as any[]).length > 0 })
  } catch {
    return NextResponse.json({ active: false })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await request.json()
    const { endpoint, keys } = body
    const p256dh = keys?.p256dh
    const auth = keys?.auth

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 })
    }

    const userAgent = request.headers.get('user-agent') || null

    try {
      await pool.rawPool.query(
        `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, user_agent, last_seen_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (endpoint, user_id) DO UPDATE SET
           p256dh = EXCLUDED.p256dh,
           auth = EXCLUDED.auth,
           user_agent = EXCLUDED.user_agent,
           last_seen_at = NOW()`,
        [crypto.randomUUID(), user.id, endpoint, p256dh, auth, userAgent]
      )
    } catch (e: any) {
      // Si la tabla no existe, crearla
      if (e?.code === '42P01') {
        await pool.rawPool.query(`
          CREATE TABLE IF NOT EXISTS push_subscriptions (
            id VARCHAR(36) NOT NULL PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            endpoint TEXT NOT NULL,
            p256dh TEXT NOT NULL,
            auth TEXT NOT NULL,
            user_agent TEXT,
            last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(endpoint, user_id)
          )
        `)
        await pool.rawPool.query(
          `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, user_agent, last_seen_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (endpoint, user_id) DO UPDATE SET
             p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, user_agent = EXCLUDED.user_agent, last_seen_at = NOW()`,
          [crypto.randomUUID(), user.id, endpoint, p256dh, auth, userAgent]
        )
      } else {
        console.error('[push] error guardando suscripción:', e)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al guardar suscripción' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await request.json()
    if (!body?.endpoint) {
      return NextResponse.json({ error: 'Endpoint requerido' }, { status: 400 })
    }

    await pool.query(
      'DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2',
      [body.endpoint, user.id]
    ).catch(() => {})

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar suscripción' }, { status: 500 })
  }
}
