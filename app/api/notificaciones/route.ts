import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload, resolveInstId } from '@/lib/resolveInstId'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'Sin institucion' }, { status: 400 })

    const [rows] = await pool.query(
      `SELECT n.id, n.title, n.message, n.type, n.target_role,
              COALESCE(n.priority, 'media') AS priority,
              COALESCE(n.category, 'general') AS category,
              COALESCE(n.pinned, 0) AS pinned,
              n.institution_id, n.status, n.created_at,
              CASE WHEN r.user_id IS NULL THEN false ELSE true END AS read
       FROM notifications n
       LEFT JOIN notification_reads r ON r.notification_id = n.id AND r.user_id = ?
       WHERE n.institution_id = ? AND n.status = 'active'
         AND (n.target_role = 'all' OR n.target_role = ?)
       ORDER BY n.pinned DESC, n.created_at DESC
       LIMIT 60`,
      [user.id, instId, user.role || 'all']
    )

    const notifications = (rows as any[]).map(n => ({
      id: n.id,
      title: n.title,
      message: n.message || '',
      type: n.type,
      target_role: n.target_role,
      priority: n.priority,
      category: n.category,
      pinned: Number(n.pinned) || 0,
      institution_id: n.institution_id,
      created_at: n.created_at,
      read: !!n.read,
    }))

    const unread = notifications.filter(n => !n.read).length
    return NextResponse.json({ notifications, unread })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Error al cargar notificaciones' }, { status: 500 })
  }
}