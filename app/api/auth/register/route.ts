import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { email, password, fullName, institutionCode } = await req.json()

    if (!email || !password || !fullName || !institutionCode) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    const [institutions] = await pool.query(
      'SELECT id FROM institutions WHERE code = ?',
      [institutionCode]
    )

    if (!(institutions as any[]).length) {
      return NextResponse.json({ error: 'Código de institución inválido' }, { status: 400 })
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email])
    if ((existing as any[]).length) {
      return NextResponse.json({ error: 'El correo ya está registrado' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const institution = (institutions as any[])[0]

    await pool.query(
      `INSERT INTO users (email, password, full_name, password_hash, role, institution_id, status)
       VALUES (?, ?, ?, ?, 'director', ?, 'active')`,
      [email, hashedPassword, fullName, hashedPassword, institution.id]
    )

    return NextResponse.json({ message: 'Cuenta creada exitosamente' })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
