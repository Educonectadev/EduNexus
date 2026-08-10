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
    const [planTableRows] = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'plans'`
    ) as any[]
    const hasPlansTable = (planTableRows || []).length > 0

    let planCols: string[] = []
    if (hasPlansTable) {
      const [planColRows] = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'plans'`
      ) as any[]
      planCols = (planColRows || []).map((c: any) => c.column_name)
    }
    const hasTrialDays = planCols.includes('trial_days')

    // Verificar que existan las tablas referenciadas en subconsultas
    const [tables] = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_name IN ('students','teachers')`
    ) as any[]
    const tableSet = new Set((tables || []).map((t: any) => t.table_name))
    const studentsCount = tableSet.has('students')
      ? "(SELECT COUNT(*)::int FROM students s WHERE s.institution_id = i.id)"
      : "0"
    const teachersCount = tableSet.has('teachers')
      ? "(SELECT COUNT(*)::int FROM teachers t WHERE t.institution_id = i.id)"
      : "0"

    const [rows] = await pool.query(
      `SELECT i.*,
              COALESCE(${studentsCount}, 0) AS total_students,
              COALESCE(${teachersCount}, 0) AS total_teachers,
              ${hasPlansTable ? `p.name as plan_name, p.price as plan_price${hasTrialDays ? ', p.trial_days as plan_trial_days' : ''}` : "NULL as plan_name, NULL as plan_price, NULL as plan_trial_days"}
       FROM institutions i
       ${hasPlansTable ? 'LEFT JOIN plans p ON p.id = i.plan_id' : ''}
       ORDER BY i.created_at DESC`
    )
    return NextResponse.json(rows)
  } catch (error) {
    console.error('GET /api/dev/institutions error:', error)
    return NextResponse.json({ error: 'Error fetching institutions', details: (error as any)?.message }, { status: 500 })
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
      notes, plan_id, schedule_config, demo_request_id,
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

    // Solo insertar columnas que existen en la tabla (schema puede variar)
    const [instColRows] = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'institutions'`
    ) as any[]
    const instCols = (instColRows || []).map((c: any) => c.column_name)

    const inserts: Record<string, any> = {
      id: instId,
      code: instCode,
      name,
      type: type || 'colegio',
      status: 'active',
      trial_ends_at: trialEnd,
    }
    const set = (col: string, val: any) => { if (val !== undefined && instCols.includes(col)) inserts[col] = val }
    set('level', level || '')
    set('modality', modality || '')
    set('shift', shift || '')
    set('dependence', dependence || '')
    set('department', department || '')
    set('province', province || '')
    set('district', district || '')
    set('address', address || '')
    set('reference', reference || '')
    set('phone', phone || '')
    set('phone2', phone2 || '')
    set('email', directorEmail)
    set('website', website || '')
    set('director_name', director_name || '')
    set('director_dni', director_dni || '')
    set('director_phone', director_phone || '')
    set('director_email', director_email || directorEmail)
    set('total_students', Number(total_students) || 0)
    set('total_teachers', Number(total_teachers) || 0)
    set('total_classrooms', Number(total_classrooms) || 0)
    set('has_lab', !!has_lab)
    set('has_library', !!has_library)
    set('has_computer_room', !!has_computer_room)
    set('has_playground', !!has_playground)
    set('notes', notes || '')
    set('plan_id', plan_id || null)
    set('schedule_config', schedule_config ? JSON.stringify(schedule_config) : null)

    const columns = Object.keys(inserts)
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')
    const values = columns.map((c) => inserts[c])
    await pool.query(`INSERT INTO institutions (${columns.join(', ')}) VALUES (${placeholders})`, values)

    if (director_name) {
      const userId = generateId()
      await pool.query(
        `INSERT INTO users (id, email, full_name, password_hash, role, institution_id, dni, status)
         VALUES (?, ?, ?, ?, 'director', ?, ?, 'active')`,
        [userId, directorEmail, director_name, hashedPassword, instId, director_dni || '']
      )
    }

    if (demo_request_id) {
      await pool.query(
        `UPDATE demo_requests SET status = 'completed', institution_id = ? WHERE id = ?`,
        [instId, demo_request_id]
      )
    }

    return NextResponse.json({
      success: true,
      code: instCode,
      institutionId: instId,
      director: {
        email: directorEmail,
        password: directorPassword,
        name: director_name,
      },
    })
  } catch (error: any) {
    console.error('POST /api/dev/institutions error:', error)
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Código ya existe, intenta de nuevo' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error creating institution', details: error?.message }, { status: 500 })
  }
}
