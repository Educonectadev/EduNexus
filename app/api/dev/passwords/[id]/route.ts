import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { password } = body

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const [existing] = await pool.query('SELECT id, full_name, email FROM users WHERE id = ?', [id])
    if ((existing as any[]).length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await pool.query(
      'UPDATE users SET password_hash = ?, password = ? WHERE id = ?',
      [hashedPassword, hashedPassword, id]
    )

    const user = (existing as any[])[0]

    await pool.query(
      `INSERT INTO audit_logs (id, action, entity, entity_id, details, user_name, user_id, created_at)
       VALUES (?, 'password_change', 'users', ?, ?, 'Dev Admin', 'dev', NOW())`,
      [crypto.randomUUID(), id, `Contraseña reseteada para ${user.full_name} (${user.email})`]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error resetting password' }, { status: 500 })
  }
}
