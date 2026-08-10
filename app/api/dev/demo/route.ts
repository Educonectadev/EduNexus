import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { createFreeInstitution } from '@/lib/institution'
import bcrypt from 'bcryptjs'

function generatePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let pass = ''
  for (let i = 0; i < 12; i++) pass += chars[Math.floor(Math.random() * chars.length)]
  return pass
}

// POST - Crear la institución demo a partir de una solicitud
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const [rows] = await pool.query('SELECT * FROM demo_requests WHERE id = ?', [id]) as any[]
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    const req = rows[0]

    if (req.institution_id) {
      return NextResponse.json({
        error: 'Esta solicitud ya tiene una institución creada',
        institution_id: req.institution_id,
      }, { status: 409 })
    }

    const typeMap: Record<string, string> = {
      private: 'colegio',
      public: 'colegio',
    }
    const levelMap: Record<string, string> = {
      initial: 'inicial',
      primary: 'primaria',
      secondary: 'secundaria',
      all: '',
    }

    const directorPassword = generatePassword()
    const hashedPassword = await bcrypt.hash(directorPassword, 10)

    const result = await createFreeInstitution({
      name: req.institution_name || `Institución de ${req.full_name}`,
      fullName: req.full_name,
      email: req.email,
      phone: req.phone || '',
      passwordHash: hashedPassword,
      type: typeMap[req.institution_type] || 'colegio',
      level: levelMap[req.level] || '',
      trialDays: 15,
      isDemo: true,
    })

    await pool.query(
      'UPDATE demo_requests SET status = ?, institution_id = ? WHERE id = ?',
      ['completed', result.institutionId, id]
    )

    return NextResponse.json({
      success: true,
      code: result.code,
      director: {
        email: req.email,
        password: directorPassword,
        name: req.full_name,
      },
    })
  } catch (error: any) {
    console.error('Error creating institution from demo:', error)
    return NextResponse.json({ error: 'Error creando la institución' }, { status: 500 })
  }
}

// GET - List all demo requests (dev only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const includeCustomers = searchParams.get('include_customers') === '1'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const offset = (page - 1) * limit

    // Por defecto NO se muestran solicitudes de colegios que ya tienen plan
    // (ya son clientes). Con include_customers=1 se pueden ver igual.
    const where: string[] = []
    const params: any[] = []

    if (status) {
      where.push('status = ?')
      params.push(status)
    }
    if (!includeCustomers) {
      where.push(`NOT EXISTS (
        SELECT 1 FROM institutions i
        WHERE i.status = 'active' AND i.plan_id IS NOT NULL
          AND (i.id = demo_requests.institution_id
               OR LOWER(TRIM(i.email)) = LOWER(TRIM(demo_requests.email))
               OR translate(LOWER(TRIM(i.name)), 'áéíóúü', 'aeiou')
                  = translate(LOWER(TRIM(demo_requests.institution_name)), 'áéíóúü', 'aeiou'))
      )
      AND NOT EXISTS (
        SELECT 1 FROM users u
        WHERE u.status = 'active' AND LOWER(TRIM(u.email)) = LOWER(TRIM(demo_requests.email))
      )`)
    }

    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : ''

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM demo_requests${whereSql ? ' ' + whereSql : ''}`
    const [[{ total }]] = await pool.query(countQuery, params) as any[]

    const [rows] = await pool.query(
      `SELECT demo_requests.* FROM demo_requests${whereSql ? ' ' + whereSql : ''} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    ) as any[]

    return NextResponse.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching demo requests:', error)
    return NextResponse.json({ error: 'Error fetching demo requests' }, { status: 500 })
  }
}

// PUT - Update demo request status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, notes, demo_date } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 })
    }

    const validStatuses = ['pending', 'contacted', 'scheduled', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    await pool.query(
      'UPDATE demo_requests SET status = ?, notes = COALESCE(?, notes), demo_date = COALESCE(?, demo_date) WHERE id = ?',
      [status, notes || null, demo_date || null, id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating demo request:', error)
    return NextResponse.json({ error: 'Error updating' }, { status: 500 })
  }
}

// DELETE - Delete demo request
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    await pool.query('DELETE FROM demo_requests WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting demo request:', error)
    return NextResponse.json({ error: 'Error deleting' }, { status: 500 })
  }
}
