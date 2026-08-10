import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import crypto from 'crypto'
import { getAuthPayload } from '@/lib/resolveInstId'

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

    await pool.query(
      `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, user_agent, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())
       ON CONFLICT (endpoint) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         p256dh = EXCLUDED.p256dh,
         auth = EXCLUDED.auth,
         user_agent = EXCLUDED.user_agent,
         last_seen_at = NOW()`,
      [crypto.randomUUID(), user.id, endpoint, p256dh, auth, userAgent]
    ).catch((error) => {
      console.error('[push] error guardando suscripción:', error)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving push subscription:', error)
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
      'DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?',
      [body.endpoint, user.id]
    ).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing push subscription:', error)
    return NextResponse.json({ error: 'Error al eliminar suscripción' }, { status: 500 })
  }
}