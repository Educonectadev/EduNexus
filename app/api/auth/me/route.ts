import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import pool from '@/lib/db'

export async function GET(req: Request) {
  try {
    const token = req.headers.get('cookie')?.match(/token=([^;]+)/)?.[1]

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'educonecta-secret')
    const { payload } = await jwtVerify(token, secret)

    const [users] = await pool.query(
      'SELECT id, email, full_name, phone, avatar_url, created_at FROM users WHERE id = ?',
      [payload.userId]
    )
    const user = (users as any[])[0]

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        createdAt: user.created_at,
        avatarUrl: user.avatar_url,
        role: payload.role,
        institutionId: payload.institutionId,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }
}
