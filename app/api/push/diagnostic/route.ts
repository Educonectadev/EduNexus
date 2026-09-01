import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  const diagnostics: Record<string, any> = {}

  // 1. Check VAPID keys
  const publicKey = process.env.VAPID_PUBLIC_KEY || ''
  const privateKey = process.env.VAPID_PRIVATE_KEY || ''
  diagnostics.vapid = {
    publicKeySet: !!publicKey,
    privateKeySet: !!privateKey,
    publicKeyPrefix: publicKey ? publicKey.substring(0, 20) + '...' : 'NOT SET',
  }

  // 2. Check push subscriptions
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as total, 
              COUNT(DISTINCT user_id) as users,
              MAX(last_seen_at) as last_subscription
       FROM push_subscriptions`
    ) as any[]
    diagnostics.subscriptions = rows[0] || { total: 0, users: 0 }
  } catch (e: any) {
    diagnostics.subscriptions = { error: e.message }
  }

  // 3. Check recent notifications
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as total FROM notifications WHERE created_at > NOW() - INTERVAL '24 hours'`
    ) as any[]
    diagnostics.recentNotifications = rows[0]?.total || 0
  } catch (e: any) {
    diagnostics.recentNotifications = { error: e.message }
  }

  // 4. Try a test web-push if configured
  if (publicKey && privateKey) {
    try {
      const webpush = require('web-push')
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:soporte@educonecta.pe',
        publicKey,
        privateKey
      )
      diagnostics.webpushReady = true
    } catch (e: any) {
      diagnostics.webpushReady = false
      diagnostics.webpushError = e.message
    }
  }

  return NextResponse.json(diagnostics, { pretty: true })
}
