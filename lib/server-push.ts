import webpush from 'web-push'
import pool from '@/lib/db'

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:soporte@educonecta.pe'

const vapidConfigured = !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY)

if (vapidConfigured) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY!, VAPID_PRIVATE_KEY!)
}

interface PushPayload {
  title: string
  message: string
  url?: string
  type?: string
  icon?: string
  badge?: string
}

function targetPath(role?: string, type?: string): string {
  if (type === 'demo_request' || type === 'trial_request') return '/dev/demo'
  if (role === 'dev' || role === 'super_admin') return '/dev'
  if (role === 'padre') return '/padre'
  if (role === 'secretario') return '/secretario/dashboard'
  if (role === 'docente') return '/docente/dashboard'
  if (role === 'director') return '/director/dashboard'
  return '/panel'
}

async function sendToSubscriptions(subscriptions: any[], payload: PushPayload) {
  if (!vapidConfigured || !subscriptions.length) return { sent: 0, errors: 0 }

  const jsonPayload = JSON.stringify({
    title: payload.title,
    message: payload.message,
    url: payload.url || '/',
    type: payload.type || 'info',
    icon: payload.icon || '/icon.svg',
    badge: payload.badge || '/icon.svg',
  })

  let sent = 0
  let errors = 0
  const expiredEndpoints: string[] = []

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        jsonPayload
      )
      sent++
    } catch (error: any) {
      errors++
      if (error.statusCode === 404 || error.statusCode === 410 || error.statusCode === 403) {
        expiredEndpoints.push(sub.endpoint)
      }
    }
  }

  if (expiredEndpoints.length > 0) {
    try {
      await pool.query(
        `DELETE FROM push_subscriptions WHERE endpoint = ANY($1::text[])`,
        [expiredEndpoints]
      )
    } catch { /* noop */ }
  }

  return { sent, errors }
}

export async function sendPushToRole(
  institutionId: string,
  targetRole: string,
  payload: PushPayload
) {
  if (!vapidConfigured) return { sent: 0, errors: 0 }

  try {
    let sql: string
    let params: any[]

    if (targetRole === 'dev') {
      sql = `SELECT s.endpoint, s.p256dh, s.auth
             FROM push_subscriptions s
             JOIN users u ON u.id = s.user_id
             WHERE u.role = 'dev' AND u.status = 'active'`
      params = []
    } else if (targetRole === 'all' || !targetRole) {
      sql = `SELECT s.endpoint, s.p256dh, s.auth
             FROM push_subscriptions s
             JOIN users u ON u.id = s.user_id
             WHERE u.institution_id = $1 AND u.status = 'active'`
      params = [institutionId]
    } else {
      sql = `SELECT s.endpoint, s.p256dh, s.auth
             FROM push_subscriptions s
             JOIN users u ON u.id = s.user_id
             WHERE u.institution_id = $1 AND u.role = $2 AND u.status = 'active'`
      params = [institutionId, targetRole]
    }

    const [rows] = await pool.query(sql, params) as any[]
    const subscriptions = rows || []

    const url = payload.url || targetPath(targetRole, payload.type)
    return sendToSubscriptions(subscriptions, { ...payload, url })
  } catch (error) {
    console.error('[server-push] error:', error)
    return { sent: 0, errors: 1 }
  }
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
) {
  if (!vapidConfigured) return { sent: 0, errors: 0 }

  try {
    const [rows] = await pool.query(
      `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1`,
      [userId]
    ) as any[]

    const url = payload.url || '/panel'
    return sendToSubscriptions(rows || [], { ...payload, url })
  } catch (error) {
    console.error('[server-push] error:', error)
    return { sent: 0, errors: 1 }
  }
}

export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
) {
  if (!vapidConfigured || !userIds.length) return { sent: 0, errors: 0 }

  try {
    const [rows] = await pool.query(
      `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ANY($1::text[])`,
      [userIds]
    ) as any[]

    return sendToSubscriptions(rows || [], { ...payload, url: payload.url || '/panel' })
  } catch (error) {
    console.error('[server-push] error:', error)
    return { sent: 0, errors: 1 }
  }
}
