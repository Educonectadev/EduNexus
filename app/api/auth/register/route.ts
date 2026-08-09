import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'
import { createFreeInstitution } from '@/lib/institution'
import { SignJWT } from 'jose'

// Registro público: crea la institución gratuita con su usuario director.
// mode: 'free' → trial de 20 días hábiles | 'demo' → trial de 15 días hábiles (institución marcada DEMO).
// Al terminar, emite sesión propia (auto-login) para que el director entre directo a su panel.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      mode,
      email,
      password,
      fullName,
      institutionName,
      phone,
      website,
      directorDni,
      directorPhone,
      type,
      level,
      modality,
      shift,
      department,
      province,
      district,
      address,
      reference,
    } = body

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

    const isDemo = mode === 'demo'
    const hashedPassword = await bcrypt.hash(password, 10)

    const { institutionId, code } = await createFreeInstitution({
      name: institutionName,
      fullName,
      email,
      phone: phone || '',
      website: website || '',
      directorDni: directorDni || '',
      directorPhone: directorPhone || '',
      type: type || 'colegio',
      level: level || '',
      modality: modality || '',
      shift: shift || '',
      department: department || '',
      province: province || '',
      district: district || '',
      address: address || '',
      reference: reference || '',
      passwordHash: hashedPassword,
      trialDays: isDemo ? 15 : 20,
      isDemo,
    })

    const [userRows] = await pool.query('SELECT id FROM users WHERE email = ?', [email])
    const userId = (userRows as any[])[0]?.id

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'educonecta-secret')
    const response = NextResponse.json({
      message: 'Institución creada exitosamente',
      institutionCode: code,
      institutionId,
      mode: isDemo ? 'demo' : 'free',
      trialDays: isDemo ? 15 : 20,
      redirectTo: '/director/dashboard',
    })

    if (userId) {
      const token = await new SignJWT({
        userId,
        email,
        role: 'director',
        institutionId,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret)

      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
    }

    return response
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'El correo ya está registrado' }, { status: 409 })
    }
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}