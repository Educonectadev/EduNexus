import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getPadreUserId, getPadreInstitutionId, getPadreChildrenIds } from '@/lib/getPadreInfo'
import { checkPlanFeature } from '@/lib/checkPlanLimit'

export async function GET(request: NextRequest) {
  try {
    const userId = await getPadreUserId(request)
    if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const instId = await getPadreInstitutionId(request)
    const allowed = await checkPlanFeature(instId || '', 'can_parents_portal')
    if (!allowed) {
      return NextResponse.json({ error: 'Portal de padres no disponible en tu plan', upgrade_required: true }, { status: 403 })
    }

    const childrenIds = await getPadreChildrenIds(userId)

    if (childrenIds.length === 0) {
      return NextResponse.json({ summary: { total_paid: 0, total_pending: 0 }, pending: [], history: [] })
    }

    const placeholders = childrenIds.map(() => '?').join(',')

    const [rows] = await pool.query(
      `SELECT p.id, pc.name AS concept, p.amount, p.paid_amount, p.due_date, p.status, p.paid_date,
              p.reference AS reference, s.id AS student_id,
              CONCAT(s.first_name, ' ', s.last_name) AS student_name, s.grade, s.section
       FROM payments p
       JOIN students s ON s.id = p.student_id
       LEFT JOIN payment_concepts pc ON pc.id = p.concept_id
       WHERE p.student_id IN (${placeholders}) AND p.deleted_at IS NULL
       ORDER BY p.due_date DESC`,
      childrenIds
    )

    const records = rows as any[]
    const pending = records.filter(r => r.status === 'pending' || r.status === 'partial' || r.status === 'overdue')
    const history = records.filter(r => r.status === 'paid')
    const totalPaid = history.reduce((sum, r) => sum + (Number(r.paid_amount) || 0), 0)
    const totalPending = pending.reduce((sum, r) => sum + (Number(r.amount) - Number(r.paid_amount || 0)), 0)

    return NextResponse.json({
      summary: { total_paid: totalPaid, total_pending: totalPending },
      pending,
      history,
    })
  } catch (error) {
    console.error('Error fetching pagos:', error)
    return NextResponse.json({ summary: null, pending: [], history: [] })
  }
}
