import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload } from '@/lib/resolveInstId'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const instId = user.institutionId as string | null

    if (!instId && user.role !== 'dev' && user.role !== 'super_admin') {
      return NextResponse.json({ notifications: [], unread: 0 })
    }

    const globalRole = !instId ? user.role : null

    const [rows] = globalRole
      ? (await pool.query(
          `SELECT n.id, n.title, n.message, n.type, n.target_role,
                  COALESCE(n.priority, 'media') AS priority,
                  COALESCE(n.category, 'general') AS category,
                  n.pinned,
                  n.institution_id, n.status, n.created_at,
                  CASE WHEN r.user_id IS NULL THEN false ELSE true END AS read
           FROM notifications n
           LEFT JOIN notification_reads r ON r.notification_id = n.id AND r.user_id = $1
           WHERE n.status = 'active'
             AND (n.target_role = $2 OR n.user_id = $1)
           ORDER BY n.created_at DESC
           LIMIT 60`,
          [user.id, globalRole]
        )) as any[]
      : (await pool.query(
          `SELECT n.id, n.title, n.message, n.type, n.target_role,
                  COALESCE(n.priority, 'media') AS priority,
                  COALESCE(n.category, 'general') AS category,
                  n.pinned,
                  n.institution_id, n.status, n.created_at,
                  CASE WHEN r.user_id IS NULL THEN false ELSE true END AS read
           FROM notifications n
           LEFT JOIN notification_reads r ON r.notification_id = n.id AND r.user_id = $1
           WHERE n.institution_id = $2 AND n.status = 'active'
             AND (
               (n.user_id IS NOT NULL AND n.user_id = $1)
               OR
               (n.user_id IS NULL AND (n.target_role = 'all' OR n.target_role = $3))
             )
           ORDER BY n.created_at DESC
           LIMIT 60`,
          [user.id, instId, user.role || 'all']
        )) as any[]

    const notifications = (rows as any[]).map(n => ({
      id: n.id,
      title: n.title,
      message: n.message || '',
      type: n.type,
      target_role: n.target_role,
      priority: n.priority,
      category: n.category,
      pinned: n.pinned === true || n.pinned === 1 || n.pinned === '1',
      institution_id: n.institution_id,
      created_at: n.created_at,
      read: !!n.read,
    }))

    const unread = notifications.filter(n => !n.read).length
    return NextResponse.json({ notifications, unread })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ notifications: [], unread: 0 })
  }
}