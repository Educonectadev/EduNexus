import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import pool from '@/lib/db'
import { computeTrialStatus, addBusinessDays } from '@/lib/trial'

// Backfill: si la institución existía antes del sistema de trial (trial_ends_at NULL)
// y no tiene plan pagado, se le asigna 20 días hábiles desde ahora.
async function ensureTrial(institutionId: string) {
  try {
    await pool.query(
      `UPDATE institutions
       SET trial_ends_at = $1
       WHERE id = $2 AND plan_id IS NULL AND trial_ends_at IS NULL`,
      [addBusinessDays(new Date(), 20).toISOString(), institutionId]
    )
  } catch { /* trial_ends_at may not exist yet */ }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('cookie')?.match(/token=([^;]+)/)?.[1]
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'educonecta-secret')
    const { payload } = await jwtVerify(token, secret)

    if (!payload.institutionId) {
      return NextResponse.json({ error: 'Sin institución asociada' }, { status: 400 })
    }

    const body = await request.json()
    const updates: string[] = []
    const values: any[] = []

    if (body.name !== undefined) { updates.push('name = ?'); values.push(body.name) }
    if (body.email !== undefined) { updates.push('email = ?'); values.push(body.email) }
    if (body.phone !== undefined) { updates.push('phone = ?'); values.push(body.phone) }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Sin campos para actualizar' }, { status: 400 })
    }

    values.push(payload.institutionId)
    await pool.query(
      `UPDATE institutions SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

    return NextResponse.json({ success: true, message: 'Institución actualizada' })
  } catch (error) {
    console.error('PATCH institution error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('cookie')?.match(/token=([^;]+)/)?.[1]
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'educonecta-secret')
    const { payload } = await jwtVerify(token, secret)

    if (!payload.institutionId) {
      return NextResponse.json({ id: null, name: '' }, { status: 401 })
    }

    await ensureTrial(payload.institutionId)

    let inst: any
    try {
      const [rows] = await pool.query(
        `SELECT i.id, i.name, i.email, i.phone, i.trial_ends_at, p.id as plan_id, p.name as plan_name, p.price as plan_price, p.max_users, p.max_students, p.features as plan_features
         FROM institutions i
         LEFT JOIN plans p ON p.id = i.plan_id
         WHERE i.id = ?`,
        [payload.institutionId]
      )
      inst = (rows as any[])[0]
    } catch (qErr: any) {
      if (qErr?.code !== 'ER_NO_SUCH_COLUMN') throw qErr
      const [rows] = await pool.query(
        `SELECT i.id, i.name, p.id as plan_id, p.name as plan_name, p.price as plan_price, p.max_users, p.max_students, p.features as plan_features
         FROM institutions i
         LEFT JOIN plans p ON p.id = i.plan_id
         WHERE i.id = ?`,
        [payload.institutionId]
      )
      inst = (rows as any[])[0]
    }

    return NextResponse.json({
      id: inst?.id || null,
      name: inst?.name || '',
      email: inst?.email || '',
      phone: inst?.phone || '',
      plan: inst?.plan_id ? {
        id: inst.plan_id,
        name: inst.plan_name,
        price: inst.plan_price,
        max_users: inst.max_users,
        max_students: inst.max_students,
        features: inst.plan_features,
      } : null,
      trial: inst ? (inst.trial_ends_at !== undefined
        ? computeTrialStatus({ planId: inst.plan_id || null, trialEndsAt: inst.trial_ends_at || null })
        : null) : null,
    })
  } catch (error: any) {
    if (error?.code === 'ER_NO_SUCH_TABLE') return NextResponse.json({ id: null, name: '' })
    return NextResponse.json({ id: null, name: '' })
  }
}