import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { jwtVerify } from 'jose'

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'educonecta-secret')
    const { payload } = await jwtVerify(token, secret)

    const body = await request.json()
    const { full_name, phone, dni } = body

    await pool.query(
      'UPDATE users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), dni = COALESCE(?, dni) WHERE id = ?',
      [full_name || null, phone || null, dni || null, payload.userId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error updating profile' }, { status: 500 })
  }
}
