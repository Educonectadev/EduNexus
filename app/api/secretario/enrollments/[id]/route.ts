import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import pool from '@/lib/db'
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
    const [rows] = await pool.query(
       `SELECT e.id, e.student_id, e.grade, e.section, e.year, e.status, e.created_at,
              s.first_name, s.last_name, s.document_number, s.birth_date, s.gender,
              s.code, s.document_type, s.status as student_status
       FROM enrollments e
       LEFT JOIN students s ON e.student_id = s.id
       WHERE e.id = ? AND s.institution_id = ?`,
      [id, instId]
    )
    const enrollment = (rows as any[])[0]
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
  let conn: any
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { student_name, student_dni, student_birth_date, student_gender, grade, section, year, status } = body

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    conn = await pool.getConnection()
    await conn.beginTransaction()

    const [current] = await conn.query(
      `SELECT e.student_id FROM enrollments e
       JOIN students s ON e.student_id = s.id
       WHERE e.id = ? AND s.institution_id = ?`,
      [id, instId]
    )
    if ((current as any[]).length === 0) {
      await conn.rollback()
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    const studentId = (current as any[])[0].student_id

    if (student_name) {
      const nameParts = student_name.trim().split(/\s+/)
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      await conn.query(
        `UPDATE students SET first_name = ?, last_name = ?, document_number = COALESCE(?, document_number),
         birth_date = COALESCE(?, birth_date), gender = COALESCE(?, gender)
         WHERE id = ?`,
        [firstName, lastName, student_dni || null, student_birth_date || null, student_gender || null, studentId]
      )
    }

    await conn.query(
      `UPDATE enrollments SET grade = COALESCE(?, grade), section = COALESCE(?, section),
       year = COALESCE(?, year), status = COALESCE(?, status)
       WHERE id = ?`,
      [grade || null, section || null, year || null, status || null, id]
    )

    await conn.commit()

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
      try { await conn.rollback() } catch {}
    }
    console.error('[PUT /api/secretario/enrollments/[id]]', error)
    return NextResponse.json({ error: error.message, code: error.code, sql: error.sqlMessage }, { status: 500 })
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
  let conn: any
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await params
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    conn = await pool.getConnection()
    await conn.beginTransaction()

    const [current] = await conn.query(
      `SELECT e.student_id, s.user_id as student_user_id
       FROM enrollments e
       JOIN students s ON e.student_id = s.id
       WHERE e.id = ? AND s.institution_id = ?`,
      [id, instId]
    )
    if ((current as any[]).length === 0) {
      await conn.rollback()
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    const studentId = (current as any[])[0].student_id
    const studentUserId = (current as any[])[0].student_user_id

    // Parents linked only to this student (no other children in this institution)
    const [linkedParents] = await conn.query(
      `SELECT ps.parent_id, p.user_id as parent_user_id
       FROM parent_student ps
       LEFT JOIN parents p ON p.id = ps.parent_id
       WHERE ps.student_id = ?`,
      [studentId]
    )

    const orphanParentIds: string[] = []
    const orphanParentUserIds: (string | null)[] = []
    for (const link of linkedParents as any[]) {
      const [otherChildren] = await conn.query(
        `SELECT COUNT(*) as c FROM parent_student ps
         JOIN students s ON s.id = ps.student_id
         WHERE ps.parent_id = ? AND ps.student_id != ? AND s.institution_id = ?`,
        [link.parent_id, studentId, instId]
      )
      if (((otherChildren as any[])[0]?.c ?? 0) === 0) {
        orphanParentIds.push(link.parent_id)
        if (link.parent_user_id) orphanParentUserIds.push(link.parent_user_id)
      }
    }

    // Delete enrollment rows for this student (all of them, not just this one)
    await conn.query('DELETE FROM enrollments WHERE student_id = ?', [studentId])
    // Unlink parents from this student
    await conn.query('DELETE FROM parent_student WHERE student_id = ?', [studentId])
    // Delete orphaned parents
    if (orphanParentIds.length > 0) {
      await conn.query('DELETE FROM parents WHERE id IN (?)', [orphanParentIds])
    }
    // Delete orphaned parent user accounts
    for (const uid of orphanParentUserIds) {
      if (!uid) continue
      await conn.query('DELETE FROM user_roles WHERE user_id = ?', [uid])
      await conn.query('DELETE FROM users WHERE id = ?', [uid])
    }
    // Delete student user account if any
    if (studentUserId) {
      await conn.query('DELETE FROM user_roles WHERE user_id = ?', [studentUserId])
      await conn.query('DELETE FROM users WHERE id = ?', [studentUserId])
    }
    // Delete student (payments/grades/attendance/issued_documents cascade)
    await conn.query('DELETE FROM students WHERE id = ?', [studentId])

    await conn.commit()

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
      try { await conn.rollback() } catch {}
    }
    console.error('[DELETE /api/secretario/enrollments/[id]]', error)
    return NextResponse.json({ error: error.message, code: error.code, sql: error.sqlMessage }, { status: 500 })
  } finally {
    if (conn) {
      try { conn.release() } catch {}
    }
  }
}
