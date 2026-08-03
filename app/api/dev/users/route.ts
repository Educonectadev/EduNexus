import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.status, u.created_at,
              u.dni, u.phone, u.subject, u.institution_id,
              i.code as institution_code, i.name as institution_name
       FROM users u
       LEFT JOIN institutions i ON u.institution_id = i.id
       ORDER BY u.created_at DESC`
    )
    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, full_name, password, role, institution_id } = body

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Email, nombre y contraseña son requeridos' }, { status: 400 })
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email])
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 })
    }

    const userId = crypto.randomUUID()
    const hashedPassword = await bcrypt.hash(password, 10)

    await pool.query(
      `INSERT INTO users (id, email, full_name, password_hash, role, institution_id, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [userId, email, full_name, hashedPassword, role || 'director', institution_id || null]
    )

    return NextResponse.json({ success: true, id: userId })
  } catch (error) {
    return NextResponse.json({ error: 'Error creating user' }, { status: 500 })
  }
}
