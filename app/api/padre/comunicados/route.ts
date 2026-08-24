import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload } from '@/lib/resolveInstId'
import { checkPlanFeature } from '@/lib/checkPlanLimit'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json([])
    const instId = user.institutionId as string
    if (!instId) return NextResponse.json([])

    const allowed = await checkPlanFeature(instId, 'can_parents_portal')
    if (!allowed) {
      return NextResponse.json({ error: 'Portal de padres no disponible en tu plan' }, { status: 403 })
    }

    const [rows] = await pool.query(
      `SELECT id, title, COALESCE(message, '') as message, type, target_role, status, created_at
       FROM notifications
       WHERE type = 'communication' AND institution_id = $1
         AND (target_role = 'all' OR target_role = 'padre')
       ORDER BY created_at DESC`,
      [instId]
    )
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json([])
  }
}
