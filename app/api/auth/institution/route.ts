import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('cookie')?.match(/token=([^;]+)/)?.[1]
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'educonecta-secret')
    const { payload } = await jwtVerify(token, secret)

    if (!payload.institutionId) {
      return NextResponse.json({ id: null, name: '' }, { status: 401 })
    }

    const [rows] = await pool.query(
      `SELECT i.id, i.name, p.id as plan_id, p.name as plan_name, p.price as plan_price, p.max_users, p.max_students, p.features as plan_features
       FROM institutions i
       LEFT JOIN plans p ON p.id = i.plan_id
       WHERE i.id = ?`,
      [payload.institutionId]
    )
    const inst = (rows as any[])[0]
    return NextResponse.json({
      id: inst?.id || null,
      name: inst?.name || '',
      plan: inst?.plan_id ? {
        id: inst.plan_id,
        name: inst.plan_name,
        price: inst.plan_price,
        max_users: inst.max_users,
        max_students: inst.max_students,
        features: inst.plan_features,
      } : null,
    })
  } catch (error: any) {
    if (error?.code === 'ER_NO_SUCH_TABLE') return NextResponse.json({ id: null, name: '' })
    return NextResponse.json({ id: null, name: '' })
  }
}
