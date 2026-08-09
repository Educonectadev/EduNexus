import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import pool from '@/lib/db'
import { computeTrialStatus, addBusinessDays } from '@/lib/trial'

// Base del trial: si la columna trial_ends_at no existe (migración pendiente),
// se calcula desde el created_at de la institución para que el conteo funcione igual.
// Demo (notes = DEMO) usa 15 días hábiles; gratis usa 20.
async function effectiveTrialEnds(inst: any): Promise<string | null> {
  if (!inst) return null
  if (inst.plan_id) return null
  if (inst.trial_ends_at) return inst.trial_ends_at
  // Columna no existe o NULL: calcula desde created_at según demo o gratis.
  const isDemo = !!(inst.notes && String(inst.notes).toUpperCase().includes('DEMO'))
  const days = isDemo ? 15 : 20
  const base = inst.created_at ? new Date(inst.created_at) : new Date()
  const end = addBusinessDays(base, days)
  // Si esa fecha ya venció (institución vieja), reinicia desde ahora la primera vez.
  return end > new Date() ? end.toISOString() : addBusinessDays(new Date(), days).toISOString()
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

    let inst: any
    try {
      const [rows] = await pool.query(
        `SELECT i.id, i.name, i.email, i.phone, i.created_at, i.trial_ends_at, i.notes, p.id as plan_id, p.name as plan_name, p.price as plan_price, p.max_users, p.max_students, p.features as plan_features
         FROM institutions i
         LEFT JOIN plans p ON p.id = i.plan_id
         WHERE i.id = ?`,
        [payload.institutionId]
      )
      inst = (rows as any[])[0]
    } catch (qErr: any) {
      if (qErr?.code !== 'ER_NO_SUCH_COLUMN') throw qErr
      const [rows] = await pool.query(
        `SELECT i.id, i.name, i.email, i.phone, i.created_at, i.notes, p.id as plan_id, p.name as plan_name, p.price as plan_price, p.max_users, p.max_students, p.features as plan_features
         FROM institutions i
         LEFT JOIN plans p ON p.id = i.plan_id
         WHERE i.id = ?`,
        [payload.institutionId]
      )
      inst = (rows as any[])[0]
    }

    const isDemo = !!(inst?.notes && String(inst.notes).toUpperCase().includes('DEMO'))
    const trialEndsAt = await effectiveTrialEnds(inst)

    return NextResponse.json({
      id: inst?.id || null,
      name: inst?.name || '',
      email: inst?.email || '',
      phone: inst?.phone || '',
      isDemo,
      trialDays: inst?.plan_id ? null : (isDemo ? 15 : 20),
      plan: inst?.plan_id ? {
        id: inst.plan_id,
        name: inst.plan_name,
        price: inst.plan_price,
        max_users: inst.max_users,
        max_students: inst.max_students,
        features: inst.plan_features,
      } : null,
      trial: computeTrialStatus({ planId: inst?.plan_id || null, trialEndsAt: trialEndsAt }),
    })
  } catch (error: any) {
    if (error?.code === 'ER_NO_SUCH_TABLE') return NextResponse.json({ id: null, name: '' })
    return NextResponse.json({ id: null, name: '' })
  }
}