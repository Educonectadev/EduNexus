import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { extractTokens, verifyToken } from '@/lib/resolveInstId'

// Fechas de contrato: si la columna aún no existe en la BD se crea una sola vez
// (idempotente). Si el usuario de BD no tiene permisos, seguimos sin esas fechas.
let contractColumns: 'unknown' | 'ready' | 'missing' = 'unknown'

async function ensureContractColumns(): Promise<boolean> {
  if (contractColumns === 'unknown') {
    try {
      await pool.query(
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS contract_start_date DATE, ADD COLUMN IF NOT EXISTS contract_end_date DATE'
      )
      contractColumns = 'ready'
    } catch {
      contractColumns = 'missing'
    }
  }
  return contractColumns === 'ready'
}

// Estos campos pueden no existir todavía en algunas bases (migración pendiente),
// por eso se piden aparte: si fallan, el perfil sigue funcionando sin ellos.
async function getStaffFields(userId: string): Promise<Record<string, any>> {
  const full =
    'SELECT grade_level, specialization, contract_type, contract_start_date, contract_end_date FROM users WHERE id = ?'
  const reduced = 'SELECT grade_level, specialization, contract_type FROM users WHERE id = ?'
  const minimal = 'SELECT grade_level, specialization FROM users WHERE id = ?'

  try {
    const [rows] = await pool.query(full, [userId])
    if ((rows as any[])[0]) return (rows as any[])[0]
  } catch {
    if (await ensureContractColumns()) {
      try {
        const [rows] = await pool.query(full, [userId])
        if ((rows as any[])[0]) return (rows as any[])[0]
      } catch {
        // seguimos con los campos disponibles
      }
    }
  }

  for (const sql of [reduced, minimal]) {
    try {
      const [rows] = await pool.query(sql, [userId])
      if ((rows as any[])[0]) return (rows as any[])[0]
    } catch {
      // siguiente intento
    }
  }
  return {}
}

function resolveContract(fields: Record<string, any>, createdAt?: string | null) {
  const type = (fields.contract_type || '').trim()
  const start = fields.contract_start_date || null
  const end = fields.contract_end_date || null
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let status: 'vigente' | 'vencido' | 'pendiente' | 'sin_fechas' | 'sin_datos'
  if (end && new Date(end) < today) status = 'vencido'
  else if (start && new Date(start) > today) status = 'pendiente'
  else if (start || end) status = 'vigente'
  else if (!type) status = 'sin_datos'
  else if (/indefinido|planilla|permanent/i.test(type)) status = 'vigente'
  else status = 'sin_fechas'

  const since = start || createdAt || null
  let months = 0
  if (since) {
    const d = new Date(since)
    months = Math.max(0, (today.getFullYear() - d.getFullYear()) * 12 + (today.getMonth() - d.getMonth()))
    if (today.getDate() < d.getDate()) months = Math.max(0, months - 1)
  }

  return { type: type || null, start, end, status, months }
}

export async function GET(req: Request) {
  try {
    let payload: Record<string, any> | null = null
    for (const token of extractTokens(req)) {
      payload = await verifyToken(token)
      if (payload) break
    }

    if (!payload) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const [users] = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.avatar_url, u.created_at, u.dni,
              u.status, u.last_login, u.subject, u.institution_id,
              i.name AS inst_name, i.code AS inst_code, i.level AS inst_level,
              i.type AS inst_type, i.district AS inst_district, i.province AS inst_province,
              i.status AS inst_status, i.logo_url AS inst_logo,
              p.name AS plan_name
       FROM users u
       LEFT JOIN institutions i ON u.institution_id = i.id
       LEFT JOIN plans p ON i.plan_id = p.id
       WHERE u.id = ?`,
      [payload.userId]
    )
    const user = (users as any[])[0]

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const staff = await getStaffFields(user.id)
    const contract = resolveContract({ ...staff }, user.created_at)

    let teaching: Record<string, any> | null = null
    if (payload.role === 'docente') {
      try {
        const [courses] = await pool.query(
          `SELECT id, name, code, grade, section FROM courses
           WHERE teacher_id = ? AND status = 'active'
           ORDER BY grade, section, name`,
          [user.id]
        )
        const list = (courses as any[]).map((c: any) => ({
          id: c.id,
          name: c.name || '',
          grade: (c.grade || '').trim(),
          section: (c.section || '').trim(),
        }))
        const grades = Array.from(new Set(list.map(c => c.grade).filter(Boolean)))
        const sections = Array.from(new Set(list.map(c => c.section).filter(Boolean)))
        teaching = { courses: list, grades, sections }
      } catch {
        teaching = { courses: [], grades: [], sections: [] }
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        createdAt: user.created_at,
        avatarUrl: user.avatar_url,
        role: payload.role,
        institutionId: user.institution_id,
        dni: user.dni || '',
        status: user.status || 'active',
        lastLogin: user.last_login || null,
        subject: user.subject || '',
        gradeLevel: staff.grade_level || '',
        specialization: staff.specialization || '',
        contract,
        institution: user.institution_id
          ? {
              id: user.institution_id,
              name: user.inst_name || null,
              code: user.inst_code || null,
              level: user.inst_level || '',
              type: user.inst_type || '',
              district: user.inst_district || '',
              province: user.inst_province || '',
              status: user.inst_status || 'active',
              logo: user.inst_logo || null,
              plan: user.plan_name || null,
            }
          : null,
        teaching,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }
}
