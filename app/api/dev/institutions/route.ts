import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

function generateId(): string {
  return crypto.randomUUID()
}

async function generateCode(): Promise<string> {
  try {
    const [rows] = await pool.query(
      `SELECT code FROM institutions WHERE code LIKE 'COL-%' ORDER BY CAST(SUBSTRING(code, 5) AS UNSIGNED) DESC LIMIT 1`
    ) as any[]
    if (rows.length > 0) {
      const lastCode = rows[0].code
      const numPart = lastCode.replace('COL-', '')
      const lastNum = parseInt(numPart, 10)
      if (!isNaN(lastNum)) {
        const nextNum = lastNum + 1
        return `COL-${String(nextNum).padStart(2, '0')}`
      }
    }
  } catch (e) {
    console.error('Error generating code:', e)
  }
  return 'COL-01'
}

function generatePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let pass = ''
  for (let i = 0; i < 12; i++) pass += chars[Math.floor(Math.random() * chars.length)]
  return pass
}

function generateEmail(name: string, code: string): string {
  const clean = name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, '.')
    .slice(0, 30)
  return `director.${code.toLowerCase()}@${clean}.edu.pe`
}

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT i.*, p.name as plan_name, p.price as plan_price
       FROM institutions i
       LEFT JOIN plans p ON p.id = i.plan_id
       ORDER BY i.created_at DESC`
    )
    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching institutions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name, code, type, level, modality, shift, dependence,
      department, province, district, address, reference,
      phone, phone2, email, website,
      director_name, director_dni, director_phone, director_email,
      total_students, total_teachers, total_classrooms,
      has_lab, has_library, has_computer_room, has_playground,
      notes, plan_id,
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const instId = generateId()
    const instCode = code || await generateCode()
    const directorEmail = email || generateEmail(name, instCode)
    const directorPassword = generatePassword()
    const hashedPassword = await bcrypt.hash(directorPassword, 10)

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      await conn.query(
        `INSERT INTO institutions (
          id, code, name, type, level, modality, shift, dependence,
          department, province, district, address, reference,
          phone, phone2, email, website,
          director_name, director_dni, director_phone, director_email,
          total_students, total_teachers, total_classrooms,
          has_lab, has_library, has_computer_room, has_playground,
          notes, plan_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [
          instId, instCode, name, type || '', level || '', modality || '', shift || '', dependence || '',
          department || '', province || '', district || '', address || '', reference || '',
          phone || '', phone2 || '', directorEmail, website || '',
          director_name || '', director_dni || '', director_phone || '', director_email || directorEmail,
          total_students || 0, total_teachers || 0, total_classrooms || 0,
          has_lab ? 1 : 0, has_library ? 1 : 0, has_computer_room ? 1 : 0, has_playground ? 1 : 0,
          notes || '', plan_id || null,
        ]
      )

      if (director_name) {
        const userId = generateId()
        await conn.query(
          `INSERT INTO users (id, email, full_name, password_hash, role, institution_id, dni, status)
           VALUES (?, ?, ?, ?, 'director', ?, ?, 'active')`,
          [userId, directorEmail, director_name, hashedPassword, instId, director_dni || '']
        )
      }

      await conn.commit()

      return NextResponse.json({
        success: true,
        code: instCode,
        director: {
          email: directorEmail,
          password: directorPassword,
          name: director_name,
        },
      })
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Código ya existe, intenta de nuevo' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error creating institution' }, { status: 500 })
  }
}
