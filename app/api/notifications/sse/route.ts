import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import pool from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return new Response('Missing token', { status: 401 })

  let userId: string
  let institutionId: string
  let role: string

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'educonecta-secret')
    const { payload } = await jwtVerify(token, secret)
    userId = (payload.id || payload.userId) as string
    institutionId = payload.institutionId as string
    role = payload.role as string
  } catch {
    return new Response('Invalid token', { status: 401 })
  }

  const encoder = new TextEncoder()
  let closed = false
  let lastCheck = new Date().toISOString()

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: any) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch { closed = true }
      }

      send('connected', { userId, institutionId, role })

      const heartbeat = setInterval(() => {
        send('ping', { ts: Date.now() })
      }, 25000)

      const poll = setInterval(async () => {
        if (closed) { clearInterval(heartbeat); clearInterval(poll); return }
        try {
          let rows: any[]
          if (role === 'dev' && !institutionId) {
            ;[rows] = await pool.query(
              `SELECT id, title, message, type, target_role, institution_id, created_at
               FROM notifications
               WHERE target_role = 'dev' AND status = 'active'
                 AND created_at > $1
               ORDER BY created_at DESC LIMIT 10`,
              [lastCheck]
            ) as any[]
          } else if (institutionId) {
            ;[rows] = await pool.query(
              `SELECT id, title, message, type, target_role, institution_id, created_at
               FROM notifications
               WHERE institution_id = $1 AND status = 'active'
                 AND (target_role = $2 OR target_role = 'all')
                 AND created_at > $3
               ORDER BY created_at DESC LIMIT 10`,
              [institutionId, role || 'all', lastCheck]
            ) as any[]
          } else {
            return
          }

          if (rows.length > 0) {
            lastCheck = rows[0].created_at
            for (const n of rows) {
              send('notification', n)
            }
          }
        } catch { /* noop */ }
      }, 5000)

      req.signal.addEventListener('abort', () => {
        closed = true
        clearInterval(heartbeat)
        clearInterval(poll)
        try { controller.close() } catch { /* noop */ }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
