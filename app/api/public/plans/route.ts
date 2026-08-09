import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, description, price, max_users, max_students, features, status
       FROM plans WHERE status = 'active' ORDER BY price ASC`
    )
    return NextResponse.json(rows)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error fetching plans' }, { status: 500 })
  }
}