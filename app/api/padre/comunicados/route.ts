import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload, resolveInstId } from '@/lib/resolveInstId'
import { checkPlanFeature } from '@/lib/checkPlanLimit'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'Sin institucion' }, { status: 400 })

    const allowed = await checkPlanFeature(instId, 'can_parents_portal')
    if (!allowed) {
      return NextResponse.json({ 
        error: 'Portal de padres no disponible en tu plan',
        upgrade_required: true 
      }, { status: 403 })
    }

    const [rows] = await pool.query(
      `SELECT n.id, n.title, n.message, n.target_role, n.status, n.created_at
       FROM notifications n
       WHERE n.type = 'communication' AND n.institution_id = ?
       AND (n.target_role = 'all' OR n.target_role = 'padre')
       ORDER BY n.created_at DESC`,
      [instId]
    )
    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching comunicados' }, { status: 500 })
  }
}
