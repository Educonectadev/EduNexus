import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'
import { createFreeInstitution } from '@/lib/institution'

// Registro público "Solicitar acceso": crea la institución gratuita
// con trial de 20 días hábiles y su usuario director.
export async function POST(req: Request) {
  try {
    const { email, password, fullName, institutionName, phone } = await req.json()

    if (!email || !password || !fullName || !institutionName) {
      return NextResponse.json({ error: 'Nombre, institución, email y contraseña son requeridos' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email])
    if ((existing as any[]).length) {
      return NextResponse.json({ error: 'El correo ya está registrado' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const { code } = await createFreeInstitution({
      name: institutionName,
      fullName,
      email,
      phone: phone || '',
      passwordHash: hashedPassword,
    })

    return NextResponse.json({
      message: 'Institución creada exitosamente',
      institutionCode: code,
    })
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'El correo ya está registrado' }, { status: 409 })
    }
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}