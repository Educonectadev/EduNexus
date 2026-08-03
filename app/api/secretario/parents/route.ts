import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { resolveInstId, getAuthPayload } from '@/lib/resolveInstId'
import { logAudit } from '@/lib/audit'

function generateParentPassword(): string {
  const segment = () => Math.random().toString(36).slice(2, 6)
  return `padre-${segment()}-${segment()}`
}

function slugify(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "")
}

async function generateEmail(firstName: string, lastName: string, documentNumber: string, instId: string): Promise<string> {
  const [rows] = await pool.query(`SELECT name, code FROM institutions WHERE id = ?`, [instId]) as any[]
  const inst = rows?.[0]
  const instCode = slugify(inst?.code || inst?.name || "colegio").slice(0, 12) || "colegio"
  const name = slugify(firstName)
  const last = slugify(lastName.split(" ")[0] || "")
  let base = `${name}.${last}@${instCode}.edu.pe`.toLowerCase()
  if (base.length > 60) {
    base = `${name.slice(0, 4)}.${last}@${instCode}.edu.pe`.toLowerCase()
  }
  let candidate = base
  let n = 1
  while (true) {
    const [exists] = await pool.query(`SELECT id FROM users WHERE email = ?`, [candidate]) as any[]
    if (!exists || exists.length === 0) return candidate
    candidate = base.replace("@", `+${n}@`)
    n += 1
    if (n > 50) {
      candidate = `padre.${documentNumber}@${instCode}.edu.pe`.toLowerCase()
      break
    }
  }
  return candidate
}

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS parents (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      institution_id VARCHAR(36) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      document_type VARCHAR(20) DEFAULT 'DNI',
      document_number VARCHAR(20) NOT NULL,
      email VARCHAR(255) DEFAULT NULL,
      phone VARCHAR(20) DEFAULT NULL,
      address VARCHAR(255) DEFAULT NULL,
      occupation VARCHAR(100) DEFAULT NULL,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_parent_dni_inst (document_number, institution_id),
      INDEX idx_parent_institution (institution_id),
      INDEX idx_parent_name (first_name, last_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  const [cols] = await pool.query(`SHOW COLUMNS FROM parents LIKE 'occupation'`) as any[]
  if (cols.length === 0) {
    await pool.query(`ALTER TABLE parents ADD COLUMN occupation VARCHAR(100) DEFAULT NULL AFTER address`)
  }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS parent_student (
      id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
      parent_id VARCHAR(36) NOT NULL,
      student_id VARCHAR(36) NOT NULL,
      relationship ENUM('padre','madre','apoderado','tio','abuelo','hermano','otro') NOT NULL DEFAULT 'padre',
      is_primary TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_parent_student (parent_id, student_id),
      INDEX idx_ps_student (student_id),
      INDEX idx_ps_parent (parent_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
}

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json([])

    await ensureTables()

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''

    let query = `
      SELECT p.*
      FROM parents p
      WHERE p.institution_id = ?
    `
    const params: any[] = [instId]

    if (q.trim()) {
      query += ` AND (CONCAT(p.first_name, ' ', p.last_name) LIKE ? OR p.document_number LIKE ? OR p.phone LIKE ?)`
      const like = `%${q}%`
      params.push(like, like, like)
    }

    query += ` ORDER BY p.first_name ASC LIMIT 100`

    const [rows] = await pool.query(query, params)
    const parents = rows as any[]
    const parentIds = parents.map(r => r.id)

    let linkedMap: Record<string, { name: string; relationship: string; id: string; grade: string; section: string }[]> = {}
    if (parentIds.length > 0) {
      const [rawLinks] = await pool.query(
        `SELECT * FROM parent_student WHERE parent_id IN (${parentIds.map(() => '?').join(',')})`,
        parentIds
      ) as any[]
      
      if (rawLinks && rawLinks.length > 0) {
        const studentIds = rawLinks.map((l: any) => l.student_id)
        const [students] = await pool.query(
          `SELECT id, first_name, last_name, grade, section FROM students WHERE id IN (${studentIds.map(() => '?').join(',')})`,
          studentIds
        ) as any[]
        
        const studentMap: Record<string, any> = {}
        for (const s of students) studentMap[s.id] = s
        
        for (const l of rawLinks) {
          if (!linkedMap[l.parent_id]) linkedMap[l.parent_id] = []
          const s = studentMap[l.student_id]
          linkedMap[l.parent_id].push({
            name: s ? `${s.first_name || ''} ${s.last_name || ''}`.trim() : `Estudiante (${l.student_id?.slice(0, 8)}...)`,
            relationship: l.relationship,
            id: l.student_id,
            grade: s?.grade || '',
            section: s?.section || '',
          })
        }
      }
    }

    let userMap: Record<string, any> = {}
    if (parentIds.length > 0) {
      const emails = parents.filter(r => r.email).map(r => r.email)
      if (emails.length > 0) {
        const [users] = await pool.query(
          `SELECT email, status AS user_status
           FROM users
           WHERE email IN (${emails.map(() => '?').join(',')}) AND role = 'padre' AND institution_id = ?`,
          [...emails, instId]
        ) as any[]
        for (const u of users) {
          const parent = parents.find(r => r.email === u.email)
          if (parent) userMap[parent.id] = u
        }
      }
    }

    const result = parents.map(r => ({
      ...r,
      has_account: !!userMap[r.id],
      account_email: userMap[r.id]?.email || null,
      account_status: userMap[r.id]?.user_status || null,
      linked_students: linkedMap[r.id] || [],
    }))

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error fetching parents', details: error?.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No se encontró la institución' }, { status: 400 })

    await ensureTables()

    const body = await request.json()
    const { first_name, last_name, document_type, document_number, email, phone, address, occupation, student_id, relationship, create_account, password: customPassword } = body

    if (!first_name || !last_name || !document_number) {
      return NextResponse.json({ error: 'Nombre, apellido y DNI son requeridos' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    let generatedEmail: string | null = null
    let generatedPassword: string | null = null

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      // Crear registro en parents
      await conn.query(
        `INSERT INTO parents (id, institution_id, first_name, last_name, document_type, document_number, email, phone, address, occupation)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, instId, first_name, last_name, document_type || 'DNI', document_number, email || null, phone || null, address || null, occupation || null]
      )

      // Vincular estudiante si viene
      if (student_id) {
        await conn.query(
          `INSERT INTO parent_student (parent_id, student_id, relationship, is_primary) VALUES (?, ?, ?, 1)`,
          [id, student_id, relationship || 'padre']
        )
      }

      // Crear cuenta de usuario para login del padre
      if (create_account !== false) {
        generatedEmail = email || (await generateEmail(first_name, last_name, document_number, instId))
        generatedPassword = (customPassword && customPassword.trim()) || generateParentPassword()
        const hashedPassword = await bcrypt.hash(generatedPassword!, 10)
        const fullName = `${first_name} ${last_name}`.trim()

        // Verificar que el email no exista
        const [exists] = await conn.query(`SELECT id FROM users WHERE email = ?`, [generatedEmail]) as any[]
        if (exists && exists.length > 0) {
          await conn.rollback()
          return NextResponse.json({ error: `El correo ${generatedEmail} ya está registrado en el sistema` }, { status: 409 })
        }

        // Asegurar columnas necesarias
        const [cols] = await conn.query(`SHOW COLUMNS FROM users`) as any[]
        const colNames = (cols || []).map((c: any) => c.Field)
        const userId = crypto.randomUUID()

        const insertCols: string[] = ['id', 'email', 'full_name', 'role', 'institution_id', 'status']
        const insertVals: any[] = [userId, generatedEmail, fullName, 'padre', instId, 'active']

        if (colNames.includes('password')) {
          insertCols.push('password'); insertVals.push(generatedPassword)
        }
        if (colNames.includes('password_hash')) {
          insertCols.push('password_hash'); insertVals.push(hashedPassword)
        }
        if (colNames.includes('document_number')) {
          insertCols.push('document_number'); insertVals.push(document_number)
        }
        if (colNames.includes('phone')) {
          insertCols.push('phone'); insertVals.push(phone || null)
        }
        if (colNames.includes('full_name') === false && colNames.includes('name')) {
          insertCols[insertCols.indexOf('full_name')] = 'name'
        }

        const placeholders = insertCols.map(() => '?').join(', ')
        await conn.query(
          `INSERT INTO users (${insertCols.join(', ')}) VALUES (${placeholders})`,
          insertVals
        )

        // Actualizar email en parents también
        await conn.query(`UPDATE parents SET email = ? WHERE id = ?`, [generatedEmail, id])
      }

      await conn.commit()

      const authUser = await getAuthPayload(request)
      logAudit({
        userId: (authUser?.userId as string) || '',
        institutionId: instId,
        action: 'create',
        entity: 'parent',
        entityId: id,
        details: { name: `${first_name} ${last_name}`, document: document_number },
      })

      return NextResponse.json({
        success: true,
        id,
        generated_email: generatedEmail,
        generated_password: generatedPassword,
      })
    } catch (e) {
      try { await conn.rollback() } catch {}
      throw e
    } finally {
      conn.release()
    }
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Ya existe un padre/guardián con ese DNI en esta institución' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error creating parent', details: error?.message }, { status: 500 })
  }
}
