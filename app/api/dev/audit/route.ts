import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, u.name as user_name
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC LIMIT 100`
    )
    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching audit logs' }, { status: 500 })
  }
}
