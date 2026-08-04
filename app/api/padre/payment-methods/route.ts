import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getPadreInstitutionId } from '@/lib/getPadreInfo'
import { checkPlanFeature } from '@/lib/checkPlanLimit'

export async function GET(request: NextRequest) {
  try {
    const instId = await getPadreInstitutionId(request)
    if (!instId) return NextResponse.json({ methods: [], dependence: 'privado' })

    const allowed = await checkPlanFeature(instId, 'can_parents_portal')
    if (!allowed) return NextResponse.json({ methods: [], dependence: 'privado' })

    const [instRows] = await pool.query(
      `SELECT name, dependence, type, address FROM institutions WHERE id = ? LIMIT 1`,
      [instId]
    ) as any[]

    const institution = instRows && instRows.length > 0 ? instRows[0] : null

    const [methods] = await pool.query(
      `SELECT id, type, name, bank_name, account_number, account_holder, phone, details
       FROM payment_methods WHERE institution_id = ? AND is_active = 1 ORDER BY created_at ASC`,
      [instId]
    )

    return NextResponse.json({
      methods,
      dependence: institution?.dependence || 'privado',
      institution_name: institution?.name || null,
    })
  } catch (error) {
    return NextResponse.json({ methods: [], dependence: 'privado' })
  }
}
