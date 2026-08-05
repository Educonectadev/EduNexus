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

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json([])

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
        `SELECT * FROM parent_student WHERE parent_id = ANY($1)`,
        [parentIds]
      ) as any[]

      if (rawLinks && rawLinks.length > 0) {
        const studentIds = rawLinks.map((l: any) => l.student_id)
        const [students] = await pool.query(
          `SELECT id, first_name, last_name, grade, section FROM students WHERE id = ANY($1)`,
          [studentIds]
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
           WHERE email = ANY($1) AND role = 'padre' AND institution_id = $2`,
          [emails, instId]
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
  let conn: any = null
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No se encontró la institución' }, { status: 400 })

    const body = await request.json()
    const { first_name, last_name, document_type, document_number, email, phone, address, occupation, student_id, relationship, create_account, password: customPassword } = body

    if (!first_name || !last_name || !document_number) {
      return NextResponse.json({ error: 'Nombre, apellido y DNI son requeridos' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    let generatedEmail: string | null = null
    let generatedPassword: string | null = null

    conn = await pool.rawPool.connect()
    await conn.query('BEGIN')

    await conn.query(
      `INSERT INTO parents (id, institution_id, first_name, last_name, document_type, document_number, email, phone, address, occupation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, instId, first_name, last_name, document_type || 'DNI', document_number, email || null, phone || null, address || null, occupation || null]
    )

    if (student_id) {
      await conn.query(
        `INSERT INTO parent_student (parent_id, student_id, relationship, is_primary) VALUES ($1, $2, $3, true)`,
        [id, student_id, relationship || 'padre']
      )
    }

    if (create_account !== false) {
      generatedEmail = email || (await generateEmail(first_name, last_name, document_number, instId))
      generatedPassword = (customPassword && customPassword.trim()) || generateParentPassword()
      const hashedPassword = await bcrypt.hash(generatedPassword!, 10)
      const fullName = `${first_name} ${last_name}`.trim()

      const exists = await conn.query(`SELECT id FROM users WHERE email = $1`, [generatedEmail])
      if (exists.rows.length > 0) {
        await conn.query('ROLLBACK')
        return NextResponse.json({ error: `El correo ${generatedEmail} ya está registrado en el sistema` }, { status: 409 })
      }

      const userId = crypto.randomUUID()
      await conn.query(
        `INSERT INTO users (id, email, full_name, password_hash, role, institution_id, status)
         VALUES ($1, $2, $3, $4, 'padre', $5, 'active')`,
        [userId, generatedEmail, fullName, hashedPassword, instId]
      )

      await conn.query(`UPDATE parents SET email = $1 WHERE id = $2`, [generatedEmail, id])
    }

    await conn.query('COMMIT')

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
  } catch (error: any) {
    if (conn) {
      try { await conn.query('ROLLBACK') } catch {}
    }
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Ya existe un padre/guardián con ese DNI en esta institución' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error creating parent', details: error?.message }, { status: 500 })
  } finally {
    if (conn) {
      try { conn.release() } catch {}
    }
  }
}
