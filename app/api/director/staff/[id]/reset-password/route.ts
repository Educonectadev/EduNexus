import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload, resolveInstId } from '@/lib/resolveInstId'
import bcrypt from 'bcryptjs'

function generatePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let pass = ''
  for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)]
  return pass
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'Sin institucion' }, { status: 400 })

    const { id } = await params

    const [targetUser] = await pool.query(
      'SELECT id FROM users WHERE id = ? AND institution_id = ?',
      [id, instId]
    ) as any[]
    if (targetUser.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado en esta institucion' }, { status: 404 })
    }

    const password = generatePassword()
    const hashedPassword = await bcrypt.hash(password, 10)

    const [result] = await pool.query(
      'UPDATE users SET password_hash = ? WHERE id = ? AND institution_id = ?',
      [hashedPassword, id, instId]
    )

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, password })
  } catch (error) {
    return NextResponse.json({ error: 'Error regenerating password' }, { status: 500 })
  }
}
