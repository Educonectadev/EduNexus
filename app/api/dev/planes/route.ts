import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import crypto from 'crypto'

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, description, price, max_users, max_students, features, status, created_at
       FROM plans ORDER BY price ASC`
    )
    return NextResponse.json(rows)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error fetching plans' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, max_users, max_students, features, status } = body

    if (!name) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO plans (id, name, description, price, max_users, max_students, features, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        description || null,
        price || 0,
        max_users || 5,
        max_students || 50,
        features ? JSON.stringify(features) : null,
        status || 'active',
      ]
    )

    return NextResponse.json({ success: true, id })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error creating plan' }, { status: 500 })
  }
}
