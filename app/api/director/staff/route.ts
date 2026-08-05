import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload, resolveInstId } from '@/lib/resolveInstId'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

function generatePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let pass = ''
  for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)]
  return pass
}

function generateEmail(name: string, role: string): string {
  const parts = name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
  const first = parts[0] || 'user'
  const last = parts[parts.length - 1] || ''
  const prefix = role === 'secretario' ? 'sec' : 'doc'
  return `${prefix}.${first}.${last}@iep.edu.pe`
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'Sin institucion' }, { status: 400 })

    try {
      const [rows] = await pool.query(
        `SELECT id, email, full_name, role, dni, phone, subject, grade_level, specialization, contract_type, status, created_at
         FROM users
         WHERE role IN ('docente', 'secretario') AND institution_id = ?
         ORDER BY created_at DESC`,
        [instId]
      )
      return NextResponse.json(rows)
    } catch (error: any) {
      if (error?.code === 'ER_BAD_FIELD_ERROR') {
        const [rows] = await pool.query(
          `SELECT id, email, full_name, role, dni, phone, subject, status, created_at
           FROM users
           WHERE role IN ('docente', 'secretario') AND institution_id = ?
           ORDER BY created_at DESC`,
          [instId]
        )
        return NextResponse.json(rows)
      }
      throw error
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Error fetching staff' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'Sin institucion' }, { status: 400 })

    const body = await request.json()
    const { full_name, dni, phone, email, subject, role, grade_level, specialization, contract_type } = body

    if (!full_name || !dni) {
      return NextResponse.json({ error: 'Nombre y DNI son requeridos' }, { status: 400 })
    }

    const finalEmail = email || generateEmail(full_name, role || 'docente')
    const password = generatePassword()
    const hashedPassword = await bcrypt.hash(password, 10)
    const userId = crypto.randomUUID()

    const contract = (contract_type || '').trim()

    try {
      await pool.query(
        `INSERT INTO users (id, email, full_name, password_hash, role, dni, phone, subject, grade_level, specialization, contract_type, institution_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [userId, finalEmail, full_name, hashedPassword, role || 'docente', dni, phone || '', subject || '', grade_level || '', specialization || '', contract, instId]
      )
    } catch (colErr: any) {
      if (colErr?.code === 'ER_BAD_FIELD_ERROR') {
        await pool.query(
          `INSERT INTO users (id, email, full_name, password_hash, role, dni, phone, subject, institution_id, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
          [userId, finalEmail, full_name, hashedPassword, role || 'docente', dni, phone || '', subject || '', instId]
        )
      } else {
        throw colErr
      }
    }

    return NextResponse.json({
      success: true,
      credentials: {
        email: finalEmail,
        password,
      },
    })
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'El DNI o email ya existe' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error creating staff' }, { status: 500 })
  }
}
