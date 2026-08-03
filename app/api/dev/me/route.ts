import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const [[devUser]] = await pool.query(
      "SELECT id, full_name, email, dni, phone, created_at FROM users WHERE role = 'dev' LIMIT 1"
    ) as any[]

    if (!devUser) {
      return NextResponse.json({ error: 'Dev user not found' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: devUser.id,
        email: devUser.email,
        fullName: devUser.full_name,
        phone: devUser.phone,
        dni: devUser.dni,
        createdAt: devUser.created_at,
        role: 'dev',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching dev user' }, { status: 500 })
  }
}
