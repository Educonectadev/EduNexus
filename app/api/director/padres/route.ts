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
      SELECT p.*,
        (
          SELECT string_agg(
            (s.first_name || ' ' || s.last_name || '|' || ps.relationship || '|' || s.id || '|' || COALESCE(s.grade, '') || '|' || COALESCE(s.section, '')),
            ';;' ORDER BY s.first_name
          )
          FROM parent_student ps
          LEFT JOIN students s ON ps.student_id = s.id
          WHERE ps.parent_id = p.id
        ) AS linked_students,
        u.email as user_email,
        u.status as user_status
      FROM parents p
      LEFT JOIN users u ON u.email = p.email AND u.role = 'padre'
      WHERE p.institution_id = ?
    `
    const params: any[] = [instId]

    if (q.trim()) {
      query += ` AND (CONCAT(p.first_name, ' ', p.last_name) LIKE ? OR p.document_number LIKE ? OR p.phone LIKE ? OR p.email LIKE ?)`
      const like = `%${q}%`
      params.push(like, like, like, like)
    }

    query += ` GROUP BY p.id ORDER BY p.first_name ASC LIMIT 200`

    const [rows] = await pool.query(query, params)

    const result = (rows as any[]).map(r => ({
      ...r,
      linked_students: r.linked_students
        ? r.linked_students.split(';;').map((s: string) => {
            const [name, relationship, id, grade, section] = s.split('|')
            return { name, relationship, id, grade, section }
          })
        : [],
      has_account: !!r.user_email,
      account_status: r.user_status || null,
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
    const { first_name, last_name, document_type, document_number, email, phone, address, occupation, student_id, relationship, create_account } = body

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
      generatedPassword = generateParentPassword()
      const hashedPassword = await bcrypt.hash(generatedPassword, 10)
      const fullName = `${first_name} ${last_name}`.trim()

      const exists = await conn.query(`SELECT id FROM users WHERE email = $1`, [generatedEmail])
      if (exists.rows.length > 0) {
        await conn.query('ROLLBACK')
        return NextResponse.json({ error: `El correo ${generatedEmail} ya está registrado` }, { status: 409 })
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
