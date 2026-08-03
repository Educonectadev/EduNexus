import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getPadreUserId, getPadreChildrenIds, getPadreInstitutionId } from '@/lib/getPadreInfo'
import { checkPlanFeature } from '@/lib/checkPlanLimit'

export async function GET(request: NextRequest) {
  try {
    const userId = await getPadreUserId(request)
    if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const instId = await getPadreInstitutionId(request)
    const allowed = await checkPlanFeature(instId || '', 'can_homework')
    if (!allowed) {
      return NextResponse.json({ error: 'Tareas no disponibles en tu plan' }, { status: 403 })
    }

    const childrenIds = await getPadreChildrenIds(userId)
    if (childrenIds.length === 0) {
      return NextResponse.json([])
    }

    const placeholders = childrenIds.map(() => '?').join(',')
    const [rows] = await pool.query(
      `SELECT t.id, t.title, t.description, t.subject, t.due_date, t.status, t.priority, t.assigned_by, t.student_id
       FROM homework t
       WHERE t.student_id IN (${placeholders})
       ORDER BY t.due_date ASC`,
      childrenIds
    )
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching tareas:', error)
    return NextResponse.json([])
  }
}
