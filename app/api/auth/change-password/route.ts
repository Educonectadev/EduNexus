import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'educonecta-secret')
    const { payload } = await jwtVerify(token, secret)

    const body = await request.json()
    const { current_password, new_password } = body

    if (!current_password || !new_password) {
      return NextResponse.json({ error: 'Contraseña actual y nueva son requeridas' }, { status: 400 })
    }

    if (new_password.length < 6) {
      return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [payload.userId])
    const users = rows as any[]

    if (users.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const valid = await bcrypt.compare(current_password, users[0].password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(new_password, 10)
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashed, payload.userId])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error changing password' }, { status: 500 })
  }
}
