import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload, resolveInstId } from '@/lib/resolveInstId'

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const instId = await resolveInstId(request)
    const globalRole = instId ? null : (user.role === 'dev' || user.role === 'super_admin' ? user.role : null)
    if (!instId && !globalRole) {
      return NextResponse.json({ error: 'Sin institucion' }, { status: 400 })
    }

    const body = await request.json()

    if (body.id) {
      await pool.query(
        `INSERT INTO notification_reads (notification_id, user_id)
         VALUES (?, ?)
         ON CONFLICT (notification_id, user_id) DO NOTHING`,
        [body.id, user.id]
      )
      return NextResponse.json({ success: true })
    }

    if (body.all) {
      if (globalRole) {
        await pool.query(
          `INSERT INTO notification_reads (notification_id, user_id)
           SELECT n.id, ?
           FROM notifications n
           WHERE n.status = 'active' AND (n.target_role = ? OR n.user_id = ?)
           ON CONFLICT (notification_id, user_id) DO NOTHING`,
          [user.id, globalRole, user.id]
        )
      } else {
        await pool.query(
          `INSERT INTO notification_reads (notification_id, user_id)
           SELECT n.id, ?
           FROM notifications n
           WHERE n.institution_id = ? AND n.status = 'active'
             AND (n.target_role = 'all' OR n.target_role = ?)
           ON CONFLICT (notification_id, user_id) DO NOTHING`,
          [user.id, instId, user.role || 'all']
        )
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Parametros invalidos' }, { status: 400 })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json({ error: 'Error al marcar notificación' }, { status: 500 })
  }
}