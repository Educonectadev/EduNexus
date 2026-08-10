import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { addBusinessDays } from '@/lib/trial'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

function generateId(): string {
  return crypto.randomUUID()
}

async function generateCode(): Promise<string> {
  try {
    const [rows] = await pool.query(
      `SELECT code FROM institutions WHERE code LIKE 'COL-%' ORDER BY CAST(SUBSTRING(code, 5) AS INTEGER) DESC LIMIT 1`
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
    const [planColRows] = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'plans'`
    ) as any[]
    const planCols = (planColRows || []).map((c: any) => c.column_name)
    const hasTrialDays = planCols.includes('trial_days')

    const [rows] = await pool.query(
      `SELECT i.*,
              COALESCE((SELECT COUNT(*)::int FROM students s WHERE s.institution_id = i.id), 0) AS total_students,
              COALESCE((SELECT COUNT(*)::int FROM teachers t WHERE t.institution_id = i.id), 0) AS total_teachers,
              p.name as plan_name, p.price as plan_price${hasTrialDays ? ', p.trial_days as plan_trial_days' : ''}
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
      notes, plan_id, schedule_config,
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const instId = generateId()
    const instCode = code || await generateCode()
    const directorEmail = email || generateEmail(name, instCode)
    const directorPassword = generatePassword()
    const hashedPassword = await bcrypt.hash(directorPassword, 10)

    let trialEnd = null
    if (plan_id) {
      let tdays: any = null
      try {
        const [planRows] = await pool.query('SELECT trial_days FROM plans WHERE id = ?', [plan_id]) as any
        tdays = planRows?.[0]?.trial_days
      } catch { /* columna trial_days aún no existe */ }
      trialEnd = tdays && Number(tdays) > 0 ? addBusinessDays(new Date(), Number(tdays)).toISOString() : null
    } else {
      trialEnd = addBusinessDays(new Date(), 20).toISOString()
    }

    await pool.query(
      `INSERT INTO institutions (
        id, code, name, type, level, modality, shift, dependence,
        department, province, district, address, reference,
        phone, phone2, email, website,
        director_name, director_dni, director_phone, director_email,
        total_students, total_teachers, total_classrooms,
        has_lab, has_library, has_computer_room, has_playground,
        notes, plan_id, schedule_config, status, trial_ends_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      [
        instId, instCode, name, type || '', level || '', modality || '', shift || '', dependence || '',
        department || '', province || '', district || '', address || '', reference || '',
        phone || '', phone2 || '', directorEmail, website || '',
        director_name || '', director_dni || '', director_phone || '', director_email || directorEmail,
        total_students || 0, total_teachers || 0, total_classrooms || 0,
        has_lab ? true : false, has_library ? true : false, has_computer_room ? true : false, has_playground ? true : false,
        notes || '', plan_id || null, schedule_config ? JSON.stringify(schedule_config) : null,
        trialEnd,
      ]
    )

    if (director_name) {
      const userId = generateId()
      await pool.query(
        `INSERT INTO users (id, email, full_name, password_hash, role, institution_id, dni, status)
         VALUES (?, ?, ?, ?, 'director', ?, ?, 'active')`,
        [userId, directorEmail, director_name, hashedPassword, instId, director_dni || '']
      )
    }

    return NextResponse.json({
      success: true,
      code: instCode,
      director: {
        email: directorEmail,
        password: directorPassword,
        name: director_name,
      },
    })
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Código ya existe, intenta de nuevo' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error creating institution' }, { status: 500 })
  }
}
