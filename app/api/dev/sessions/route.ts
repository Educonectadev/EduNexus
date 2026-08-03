import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = `
      SELECT us.id, us.user_id, us.ip_address, us.user_agent,
             us.logged_in_at, us.logged_out_at,
             u.full_name, u.email, u.role,
             i.name as institution_name
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      LEFT JOIN institutions i ON us.institution_id = i.id
    `
    const params: any[] = []

    if (userId) {
      query += ' WHERE us.user_id = ?'
      params.push(userId)
    }

    query += ' ORDER BY us.logged_in_at DESC LIMIT ?'
    params.push(limit)

    const [rows] = await pool.query(query, params)
    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching sessions' }, { status: 500 })
  }
}
