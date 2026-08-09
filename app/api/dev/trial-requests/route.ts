import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('cookie')?.match(/token=([^;]+)/)?.[1]
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'educonecta-secret')
    const { payload } = await jwtVerify(token, secret)
    if (payload.role !== 'dev') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    try {
      const [rows] = await pool.query(
        `SELECT id, institution_id, user_id, full_name, email, phone, institution_name, message, status, created_at
         FROM trial_requests
         ORDER BY created_at DESC
         LIMIT 100`
      ) as any[]
      return NextResponse.json({ requests: rows })
    } catch {
      return NextResponse.json({ requests: [] })
    }
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
}