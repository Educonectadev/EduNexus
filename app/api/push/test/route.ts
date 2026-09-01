import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload } from '@/lib/resolveInstId'
import { sendPushToUser } from '@/lib/server-push'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // Check if user has any push subscriptions
    const [subs] = await pool.query(
      'SELECT COUNT(*) as count FROM push_subscriptions WHERE user_id = $1',
      [user.id]
    ) as any[]

    const subCount = subs[0]?.count || 0

    if (subCount === 0) {
      return NextResponse.json({
        error: 'No hay suscripciones push para este usuario',
        userId: user.id,
        hint: 'Activa las notificaciones desde la campana'
      }, { status: 404 })
    }

    // Send test push
    const result = await sendPushToUser(user.id, {
      title: 'Prueba de notificación',
      message: 'Si ves esto, las push notifications funcionan correctamente.',
      type: 'info',
      url: '/panel',
    })

    return NextResponse.json({
      success: true,
      subscriptions: subCount,
      pushResult: result,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
