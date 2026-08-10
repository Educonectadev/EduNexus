import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import crypto from 'crypto'

export async function GET() {
  try {
    const [planColRows] = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'plans'`
    ) as any[]
    const planCols = (planColRows || []).map((c: any) => c.column_name)
    const hasTrialDays = planCols.includes('trial_days')
    const rows = await pool.query(
      `SELECT ${hasTrialDays ? 'trial_days, ' : ''}id, name, description, price, max_users, max_students, features, status, created_at
       FROM plans ORDER BY price ASC, name ASC`
    )
    return NextResponse.json(rows)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error fetching plans' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, max_users, max_students, features, status, trial_days } = body

    if (!name) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    }

    const [planColRows] = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'plans'`
    ) as any[]
    const planCols = (planColRows || []).map((c: any) => c.column_name)
    const hasTrialDays = planCols.includes('trial_days')
    const td = trial_days == null || trial_days === '' ? null : Number(trial_days)

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO plans (id, name, description, price, max_users, max_students, features, status${hasTrialDays ? ', trial_days' : ''})
       VALUES (?, ?, ?, ?, ?, ?, ?, ?${hasTrialDays ? ', ?' : ''})`,
      [
        id,
        name,
        description || null,
        price || 0,
        max_users || 5,
        max_students || 50,
        features ? JSON.stringify(features) : null,
        status || 'active',
        ...(hasTrialDays ? [td] : []),
      ]
    )

    return NextResponse.json({ success: true, id })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error creating plan' }, { status: 500 })
  }
}
