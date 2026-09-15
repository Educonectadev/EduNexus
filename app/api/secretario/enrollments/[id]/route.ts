import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import pool from '@/lib/db'
import crypto from 'crypto'
import { resolveInstId, getAuthPayload } from '@/lib/resolveInstId'
import { logAudit } from '@/lib/audit'

async function getAuthUser(request: NextRequest) {
  const token = request.headers.get('cookie')?.match(/token=([^;]+)/)?.[1]
  if (!token) return null
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'educonecta-secret')
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await params
    const result = await pool.query(
       `SELECT e.id, e.student_id, e.grade, e.section, e.year, e.status, e.created_at,
              s.first_name, s.last_name, s.document_number, s.birth_date, s.gender,
              s.code, s.document_type, s.status as student_status
       FROM enrollments e
       LEFT JOIN students s ON e.student_id = s.id
       WHERE e.id = ? AND s.institution_id = ?`,
      [id, instId]
    )
    const enrollment = (result as any[])[0]?.[0]
    if (!enrollment) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json(enrollment)
  } catch (error: any) {
    console.error('[GET /api/secretario/enrollments/[id]]', error)
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let conn: any = null
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { student_name, student_dni, student_birth_date, student_gender, grade, section, year, status,
            parent_name, parent_dni, parent_phone, parent_email, parent_relationship } = body

    const relMap: Record<string, string> = { padre: 'padre', papa: 'padre', papá: 'padre', 'padre o apoderado': 'padre', madre: 'madre', mama: 'madre', mamá: 'madre', tutor: 'tutor', tutora: 'tutor', apoderado: 'apoderado', apoderada: 'apoderado' }
    const relationship = relMap[String(parent_relationship || '').trim().toLowerCase()] || 'padre'

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    conn = await pool.rawPool.connect()
    await conn.query('BEGIN')

    const current = await conn.query(
      `SELECT e.student_id FROM enrollments e
       JOIN students s ON e.student_id = s.id
       WHERE e.id = $1 AND s.institution_id = $2`,
      [id, instId]
    )
    if (current.rows.length === 0) {
      await conn.query('ROLLBACK')
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    const studentId = current.rows[0].student_id

    if (student_name) {
      const nameParts = student_name.trim().split(/\s+/)
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      await conn.query(
        `UPDATE students SET first_name = $1, last_name = $2, document_number = COALESCE($3, document_number),
         birth_date = COALESCE($4::date, birth_date), gender = COALESCE($5, gender)
         WHERE id = $6`,
        [firstName, lastName, student_dni || null, student_birth_date || null, student_gender || null, studentId]
      )
    }

    await conn.query(
      `UPDATE enrollments SET grade = COALESCE($1, grade), section = COALESCE($2, section),
       year = COALESCE($3, year), status = COALESCE($4, status)
       WHERE id = $5`,
      [grade || null, section || null, year || null, status || null, id]
    )

    // Guarda/vincula al apoderado con el vínculo seleccionado
    if (parent_dni && studentId) {
      const existingParent = await conn.query(
        `SELECT id FROM parents WHERE document_number = $1 AND institution_id = $2`,
        [parent_dni, instId]
      )
      let parentId: string
      if (existingParent.rows.length > 0) {
        parentId = existingParent.rows[0].id
        const pp = (parent_name || '').trim().split(/\s+/)
        await conn.query(
          `UPDATE parents SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone), email = COALESCE($4, email)
           WHERE id = $5`,
          [pp[0] || null, pp.slice(1).join(' ') || null, parent_phone || null, parent_email || null, parentId]
        )
      } else {
        parentId = crypto.randomUUID()
        const pp = (parent_name || '').trim().split(/\s+/)
        await conn.query(
          `INSERT INTO parents (id, institution_id, first_name, last_name, document_type, document_number, phone, email)
           VALUES ($1, $2, $3, $4, 'DNI', $5, $6, $7)`,
          [parentId, instId, pp[0] || '', pp.slice(1).join(' ') || '', parent_dni, parent_phone || null, parent_email || null]
        )
      }
      const existingLink = await conn.query(
        `SELECT id FROM parent_student WHERE parent_id = $1 AND student_id = $2`,
        [parentId, studentId]
      )
      if (existingLink.rows.length > 0) {
        await conn.query(
          `UPDATE parent_student SET relationship = $1, is_primary = true WHERE parent_id = $2 AND student_id = $3`,
          [relationship, parentId, studentId]
        )
      } else {
        await conn.query(
          `INSERT INTO parent_student (parent_id, student_id, relationship, is_primary) VALUES ($1, $2, $3, true)`,
          [parentId, studentId, relationship]
        )
      }
    }

    await conn.query('COMMIT')

    const authUser = await getAuthPayload(request)
    logAudit({
      userId: (authUser?.userId as string) || '',
      institutionId: instId || '',
      action: 'update',
      entity: 'enrollment',
      entityId: id,
      details: { grade, section, year, status },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (conn) {
      try { await conn.query('ROLLBACK') } catch {}
    }
    console.error('[PUT /api/secretario/enrollments/[id]]', error)
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
  } finally {
    if (conn) {
      try { conn.release() } catch {}
    }
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let conn: any = null
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await params
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    conn = await pool.rawPool.connect()
    await conn.query('BEGIN')

    const current = await conn.query(
      `SELECT e.student_id, s.user_id as student_user_id
       FROM enrollments e
       JOIN students s ON e.student_id = s.id
       WHERE e.id = $1 AND s.institution_id = $2`,
      [id, instId]
    )
    if (current.rows.length === 0) {
      await conn.query('ROLLBACK')
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    const studentId = current.rows[0].student_id
    const studentUserId = current.rows[0].student_user_id

    const linkedParents = await conn.query(
      `SELECT ps.parent_id, p.user_id as parent_user_id
       FROM parent_student ps
       LEFT JOIN parents p ON p.id = ps.parent_id
       WHERE ps.student_id = $1`,
      [studentId]
    )

    const orphanParentIds: string[] = []
    const orphanParentUserIds: (string | null)[] = []
    for (const link of linkedParents.rows) {
      const otherChildren = await conn.query(
        `SELECT COUNT(*)::int as c FROM parent_student ps
         JOIN students s ON s.id = ps.student_id
         WHERE ps.parent_id = $1 AND ps.student_id != $2 AND s.institution_id = $3`,
        [link.parent_id, studentId, instId]
      )
      if ((otherChildren.rows[0]?.c ?? 0) === 0) {
        orphanParentIds.push(link.parent_id)
        if (link.parent_user_id) orphanParentUserIds.push(link.parent_user_id)
      }
    }

    await conn.query('DELETE FROM enrollments WHERE student_id = $1', [studentId])
    await conn.query('DELETE FROM parent_student WHERE student_id = $1', [studentId])
    if (orphanParentIds.length > 0) {
      await conn.query('DELETE FROM parents WHERE id = ANY($1)', [orphanParentIds])
    }
    for (const uid of orphanParentUserIds) {
      if (!uid) continue
      await conn.query('DELETE FROM user_roles WHERE user_id = $1', [uid])
      await conn.query('DELETE FROM users WHERE id = $1', [uid])
    }
    if (studentUserId) {
      await conn.query('DELETE FROM user_roles WHERE user_id = $1', [studentUserId])
      await conn.query('DELETE FROM users WHERE id = $1', [studentUserId])
    }
    await conn.query('DELETE FROM students WHERE id = $1', [studentId])

    await conn.query('COMMIT')

    const authUser = await getAuthPayload(request)
    logAudit({
      userId: (authUser?.userId as string) || '',
      institutionId: instId || '',
      action: 'delete',
      entity: 'enrollment',
      entityId: id,
      details: { studentId, studentDeleted: true, parentsDeleted: orphanParentIds.length },
    })

    return NextResponse.json({ success: true, studentDeleted: true, parentsDeleted: orphanParentIds.length })
  } catch (error: any) {
    if (conn) {
      try { await conn.query('ROLLBACK') } catch {}
    }
    console.error('[DELETE /api/secretario/enrollments/[id]]', error)
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
  } finally {
    if (conn) {
      try { conn.release() } catch {}
    }
  }
}
