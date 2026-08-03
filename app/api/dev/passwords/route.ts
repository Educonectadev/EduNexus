import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.status, u.created_at, u.last_login,
              u.password_hash, u.password,
              i.name as institution_name,
              (SELECT al.created_at FROM audit_logs al
               WHERE al.user_id = u.id AND al.action = 'password_change'
               ORDER BY al.created_at DESC LIMIT 1) as password_changed_at
       FROM users u
       LEFT JOIN institutions i ON u.institution_id = i.id
       ORDER BY u.full_name ASC`
    )
    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching passwords' }, { status: 500 })
  }
}
