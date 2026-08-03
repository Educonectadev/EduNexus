import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload } from '@/lib/resolveInstId'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

function generatePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let pass = ''
  for (let i = 0; i < 12; i++) pass += chars[Math.floor(Math.random() * chars.length)]
  return pass
}

function generateEmail(name: string, code: string): string {
  const clean = name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, '.')
    .slice(0, 30)
  return `director.${code.toLowerCase()}@${clean}.edu.pe`
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const offset = (page - 1) * limit

    // Get total count
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM institutions') as any[]

    const [rows] = await pool.query(
      `SELECT i.id, i.name, i.code, i.status, i.total_students, i.total_teachers,
              i.type, i.level, i.modality, i.shift,
              i.department, i.province, i.district, i.address,
              i.phone, i.email, i.director_name,
              p.name as plan_name, p.price as plan_price
       FROM institutions i
       LEFT JOIN plans p ON p.id = i.plan_id
       ORDER BY i.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )

    let dashCountMap: Record<string, number> = {}
    try {
      const instIds = (rows as any[]).map(r => r.id)
      if (instIds.length > 0) {
        const placeholders = instIds.map(() => '?').join(',')
        const [dashRows] = await pool.query(
          `SELECT institution_id, COUNT(*) as cnt FROM institution_dashboards WHERE institution_id IN (${placeholders}) AND status = 'active' GROUP BY institution_id`,
          instIds
        ) as any[]
        for (const row of dashRows) dashCountMap[row.institution_id] = row.cnt
      }
    } catch {}

    const result = (rows as any[]).map(r => ({ ...r, dashboard_count: dashCountMap[r.id] || 0 }))

    return NextResponse.json({
      data: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching institutions:', error)
    return NextResponse.json({ error: 'Error fetching institutions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, code, plan_id, type, level, modality, shift, department, province, district, address, phone, email, director_name, director_dni } = body

    if (!name) {
      return NextResponse.json({ error: 'name required' }, { status: 400 })
    }

    const instId = crypto.randomUUID()
    const instCode = code || `INST${Date.now().toString(36).toUpperCase()}`

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      await conn.query(
        `INSERT INTO institutions (id, code, name, type, level, modality, shift, department, province, district, address, phone, email, director_name, director_dni, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [instId, instCode, name, type || '', level || '', modality || '', shift || '', department || '', province || '', district || '', address || '', phone || '', email || '', director_name || '', director_dni || '']
      )

      if (plan_id) {
        await conn.query(`UPDATE institutions SET plan_id = ? WHERE id = ?`, [plan_id, instId])
      }

      let directorCredentials = null
      if (director_name) {
        const directorEmail = email || generateEmail(name, instCode)
        const password = generatePassword()
        const hashedPassword = await bcrypt.hash(password, 10)
        const userId = crypto.randomUUID()

        await conn.query(
          `INSERT INTO users (id, email, full_name, password_hash, role, institution_id, dni, status)
           VALUES (?, ?, ?, ?, 'director', ?, ?, 'active')`,
          [userId, directorEmail, director_name, hashedPassword, instId, director_dni || '']
        )

        directorCredentials = { email: directorEmail, password, name: director_name }
      }

      let secretaryCredentials = null
      {
        const secName = 'Secretario General'
        const secEmail = `sec.${instCode.toLowerCase()}@${name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '').slice(0, 20)}.edu.pe`
        const secPassword = generatePassword()
        const hashedPassword = await bcrypt.hash(secPassword, 10)
        const userId = crypto.randomUUID()

        await conn.query(
          `INSERT INTO users (id, email, full_name, password_hash, role, institution_id, dni, status)
           VALUES (?, ?, ?, ?, 'secretario', ?, '', 'active')`,
          [userId, secEmail, secName, hashedPassword, instId]
        )

        secretaryCredentials = { email: secEmail, password: secPassword, name: secName }
      }

      const defaultDashboards = [
        { name: 'Dashboard Director', description: 'Vista general del colegio con metricas clave', type: 'main', role: 'director' },
        { name: 'Dashboard Docentes', description: 'Cursos asignados, calificaciones y asistencia de alumnos', type: 'academic', role: 'docente' },
        { name: 'Dashboard Secretaria', description: 'Gestion de padres, alumnos, documentos y pagos', type: 'administrative', role: 'secretario' },
        { name: 'Dashboard Padres', description: 'Notas, asistencia y tareas de sus hijos', type: 'main', role: 'padre' },
        { name: 'Dashboard Alumnos', description: 'Tareas, calificaciones y calendario escolar', type: 'main', role: 'alumno' },
      ]

      try {
        for (const dash of defaultDashboards) {
          const dashId = crypto.randomUUID()
          await conn.query(
            `INSERT INTO institution_dashboards (id, institution_id, name, description, type, role, status)
             VALUES (?, ?, ?, ?, ?, ?, 'active')`,
            [dashId, instId, dash.name, dash.description, dash.type, dash.role]
          )
        }
      } catch {}

      await conn.commit()

      return NextResponse.json({ success: true, id: instId, code: instCode, director: directorCredentials, secretary: secretaryCredentials })
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  } catch (error) {
    console.error('Error creating institution:', error)
    return NextResponse.json({ error: 'Error creating institution' }, { status: 500 })
  }
}
