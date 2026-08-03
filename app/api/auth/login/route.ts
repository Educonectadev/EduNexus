import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import pool from '@/lib/db'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
    }

    const [colRows] = await pool.query(`SHOW COLUMNS FROM users`) as any[]
    const colNames = (colRows || []).map((c: any) => c.Field)
    const hasPasswordHash = colNames.includes('password_hash')
    const hasStatus = colNames.includes('status')

    const selectCols = ['id', 'email', 'full_name', 'role', 'institution_id', 'password']
    if (hasPasswordHash) selectCols.push('password_hash')
    if (hasStatus) selectCols.push('status')

    const [users] = await pool.query(
      `SELECT ${selectCols.join(', ')} FROM users WHERE email = ?`,
      [email]
    )
    const user = (users as any[])[0]

    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    if (hasStatus && user.status === 'inactive') {
      return NextResponse.json({ error: 'Esta cuenta está desactivada. Contacta al administrador.' }, { status: 403 })
    }

    const storedPassword = hasPasswordHash ? (user.password_hash || user.password) : user.password

    let valid = false
    if (storedPassword && storedPassword.startsWith('$2')) {
      valid = await bcrypt.compare(password, storedPassword)
    } else if (storedPassword) {
      valid = password === storedPassword
      if (valid && hasPasswordHash) {
        const newHash = await bcrypt.hash(password, 10)
        await pool.query(`UPDATE users SET password_hash = ? WHERE id = ?`, [newHash, user.id]).catch(() => {})
      }
    }

    if (!valid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'educonecta-secret')
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role || 'director',
      institutionId: user.institution_id || null,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret)

    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || '127.0.0.1'
    const userAgent = req.headers.get('user-agent') || ''

    await pool.query(
      `INSERT INTO user_sessions (id, user_id, institution_id, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), user.id, user.institution_id || null, ip, userAgent]
    ).catch(() => {})

    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    ).catch(() => {})

    const response = NextResponse.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role || 'director',
      },
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
