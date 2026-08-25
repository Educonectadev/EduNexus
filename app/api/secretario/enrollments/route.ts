import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import crypto from 'crypto'
import { resolveInstId, getAuthPayload } from '@/lib/resolveInstId'
import { logAudit } from '@/lib/audit'
import { checkPlanLimit } from '@/lib/checkPlanLimit'
import { ensureParentAccount } from '@/lib/parent-account'
import { notifyUsers } from '@/lib/notify'

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json([], { status: 200 })

    const [enrollments] = await pool.query(
      `SELECT e.id, e.student_id, e.grade, e.section, e.year, e.status, e.created_at,
              s.first_name, s.last_name, s.document_number, s.birth_date, s.gender,
              s.code, s.document_type
       FROM enrollments e
       LEFT JOIN students s ON e.student_id = s.id
       WHERE s.institution_id = ?
       ORDER BY e.created_at DESC`,
      [instId]
    )
    return NextResponse.json(enrollments)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error fetching enrollments', details: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // Fix enrollments missing course_id
    const [result] = await pool.query(
      `UPDATE enrollments e
       SET course_id = (
         SELECT c.id FROM courses c
         WHERE c.institution_id = e.institution_id
           AND c.grade = e.grade
           AND c.section = e.section
           AND c.status = 'active'
         LIMIT 1
       )
       WHERE e.institution_id = ?
         AND e.course_id IS NULL
         AND e.status = 'active'`,
      [instId]
    )

    return NextResponse.json({
      success: true,
      updated: (result as any).affectedRows || 0
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error fixing enrollments', details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let conn: any = null
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({error: 'No autenticado'}, { status: 401 })

    const body = await request.json()
    const {
      student_code, student_name, student_dni, student_birth_date, student_gender,
      parent_name, parent_dni, parent_phone, parent_email,
      grade, section, year,
    } = body

    if (!student_name || !student_dni) {
      return NextResponse.json({ error: 'Nombre y DNI son requeridos' }, { status: 400 })
    }

    let gradeId = null
    if (grade) {
      const [gradeRows] = await pool.query(
        `SELECT id FROM academic_grades WHERE institution_id = ? AND LOWER(name) = LOWER(?)`,
        [instId, grade]
      ) as any[]
      if ((gradeRows as any[]).length === 0) {
        return NextResponse.json({ error: `El grado "${grade}" no existe en Gestión Académica` }, { status: 400 })
      }
      gradeId = (gradeRows as any[])[0].id
    }
    if (section) {
      const [secRows] = await pool.query(
        `SELECT id FROM academic_sections WHERE institution_id = ? AND LOWER(name) = LOWER(?)`,
        [instId, section]
      ) as any[]
      if ((secRows as any[]).length === 0) {
        return NextResponse.json({ error: `La sección "${section}" no existe en Gestión Académica` }, { status: 400 })
      }
    }

    const nameParts = student_name.trim().split(/\s+/)
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    const limitCheck = await checkPlanLimit(instId, 'students')
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.message }, { status: 403 })
    }

    conn = await pool.rawPool.connect()
    await conn.query('BEGIN')

    let studentId: string
    let linkedParentId: string | null = null

    const existingStudent = await conn.query(
      'SELECT id FROM students WHERE document_number = $1 AND institution_id = $2',
      [student_dni, instId]
    )

    if (existingStudent.rows.length > 0) {
      studentId = existingStudent.rows[0].id
      if (grade) {
        const existingEnrollment = await conn.query(
          `SELECT id FROM enrollments WHERE student_id = $1 AND grade = $2 AND section = $3 AND year = $4`,
          [studentId, grade, section || 'A', year || new Date().getFullYear()]
        )
        if (existingEnrollment.rows.length > 0) {
          await conn.query('ROLLBACK')
          return NextResponse.json({ error: 'DUPLICATE_ENROLLMENT', details: `El alumno ya está matriculado en ${grade} ${section || 'A'} ${year || new Date().getFullYear()}` }, { status: 409 })
        }
      }

      await conn.query(
        `UPDATE students SET first_name = $1, last_name = $2, birth_date = COALESCE($3::date, birth_date), gender = COALESCE($4, gender),
         code = COALESCE(NULLIF($5, ''), code)
         WHERE id = $6`,
        [firstName, lastName, student_birth_date || null, student_gender || null, student_code?.trim() || '', studentId]
      )
    } else {
      studentId = crypto.randomUUID()
      const code = student_code?.trim() || `ALU-${Date.now().toString(36).toUpperCase()}`
      await conn.query(
        `INSERT INTO students (id, institution_id, code, first_name, last_name, document_type, document_number, birth_date, gender, grade, section, status)
         VALUES ($1, $2, $3, $4, $5, 'DNI', $6, NULLIF($7, '')::date, NULLIF($8, ''), $9, $10, 'active')`,
        [studentId, instId, code, firstName, lastName, student_dni, student_birth_date || null, student_gender || null, grade || '', section || '']
      )
    }

    // Find the course that matches this grade/section
    let courseId = null
    if (grade) {
      const [courseRows] = await conn.query(
        `SELECT id FROM courses WHERE institution_id = $1 AND grade = $2 AND section = $3 AND status = 'active' LIMIT 1`,
        [instId, grade, section || 'A']
      )
      courseId = (courseRows as any).rows[0]?.id || null
    }

    const result = await conn.query(
      `INSERT INTO enrollments (institution_id, student_id, course_id, grade, section, year, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active')`,
      [instId, studentId, courseId, grade || '', section || '', year || new Date().getFullYear()]
    )

    if (parent_dni) {
      const existingParent = await conn.query(
        'SELECT id FROM parents WHERE document_number = $1 AND institution_id = $2',
        [parent_dni, instId]
      )

let parentId: string

    if (existingParent.rows.length > 0) {
      parentId = existingParent.rows[0].id
    } else {
      parentId = crypto.randomUUID()
      const parentNameParts = (parent_name || '').trim().split(/\s+/)
      const parentFirst = parentNameParts[0] || ''
      const parentLast = parentNameParts.slice(1).join(' ') || ''
      await conn.query(
        `INSERT INTO parents (id, institution_id, first_name, last_name, document_type, document_number, phone, email)
         VALUES ($1, $2, $3, $4, 'DNI', $5, $6, $7)`,
        [parentId, instId, parentFirst, parentLast, parent_dni, parent_phone || null, parent_email || null]
      )
    }

    linkedParentId = parentId

    const existingLink = await conn.query(
        'SELECT id FROM parent_student WHERE parent_id = $1 AND student_id = $2',
        [parentId, studentId]
      )
      if (existingLink.rows.length === 0) {
        await conn.query(
          `INSERT INTO parent_student (parent_id, student_id, relationship, is_primary) VALUES ($1, $2, 'padre', true)`,
          [parentId, studentId]
        )
      }
    }

    await conn.query('COMMIT')

    // Crea la cuenta del padre si aún no tiene acceso: el secretario recibe
    // usuario/contraseña para entregárselos, y el "registro de matrícula"
    // (ficha) queda disponible en el portal del padre con todos los detalles.
    let parentCredentials: { email: string; password: string } | null = null
    if (linkedParentId) {
      try {
        const parentName = (parent_name || '').trim() || (parent_dni || '')
        const account = await ensureParentAccount(instId, linkedParentId, parentName, parent_dni, parent_email)
        if (account.password) parentCredentials = { email: account.email, password: account.password }
        if (account.userId) {
          notifyUsers(
            instId,
            [account.userId],
            'Matrícula registrada',
            `Tu hijo(a) fue matriculado en ${grade} ${section || 'A'} (año ${year || new Date().getFullYear()}). Ingresa a tu portal para ver todos los detalles de la matrícula.`,
            'matricula', 'matriculas', 'alta'
          )
        }
      } catch (error) {
        console.error('[enrollments] parent account:', error)
      }
    }

    const authUser = await getAuthPayload(request)
    logAudit({
      userId: (authUser?.userId as string) || '',
      institutionId: instId || '',
      action: 'enroll',
      entity: 'enrollment',
      entityId: studentId,
      details: { studentId, grade, section, year: year || new Date().getFullYear() },
    })

    return NextResponse.json({
      success: true,
      enrollmentId: studentId,
      studentId,
      ...(parentCredentials ? { parent_credentials: parentCredentials } : {}),
    })
  } catch (error: any) {
    if (conn) {
      try { await conn.query('ROLLBACK') } catch {}
    }
    console.error('[POST /api/secretario/enrollments]', error)
    return NextResponse.json({ error: 'Error creating enrollment', details: error.message }, { status: 500 })
  } finally {
    if (conn) {
      try { conn.release() } catch {}
    }
  }
}

export async function DELETE(request: NextRequest) {
  let conn: any = null
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    conn = await pool.rawPool.connect()
    await conn.query('BEGIN')

    const studentsResult = await conn.query(
      `SELECT id, user_id FROM students WHERE institution_id = $1`,
      [instId]
    )

    const parentLinksResult = await conn.query(
      `SELECT ps.parent_id FROM parent_student ps
       JOIN students s ON s.id = ps.student_id
       WHERE s.institution_id = $1`,
      [instId]
    )
    const parentIds = [...new Set(parentLinksResult.rows.map((l: any) => l.parent_id))]

    let parentUserIds: string[] = []
    if (parentIds.length > 0) {
      const parentsResult = await conn.query(
        `SELECT user_id FROM parents WHERE id = ANY($1) AND user_id IS NOT NULL`,
        [parentIds]
      )
      parentUserIds = parentsResult.rows.map((p: any) => p.user_id)
    }

    const studentUserIds = studentsResult.rows.map((s: any) => s.user_id).filter(Boolean)

    await conn.query(
      `DELETE FROM enrollments e USING students s WHERE e.student_id = s.id AND s.institution_id = $1`,
      [instId]
    )
    if (parentIds.length > 0) {
      await conn.query('DELETE FROM parent_student WHERE parent_id = ANY($1)', [parentIds])
    }
    if (parentIds.length > 0) {
      await conn.query(
        `DELETE FROM parents WHERE id = ANY($1) AND institution_id = $2`,
        [parentIds, instId]
      )
    }
    for (const uid of parentUserIds) {
      await conn.query('DELETE FROM user_roles WHERE user_id = $1', [uid])
      await conn.query('DELETE FROM users WHERE id = $1', [uid])
    }
    for (const uid of studentUserIds) {
      await conn.query('DELETE FROM user_roles WHERE user_id = $1', [uid])
      await conn.query('DELETE FROM users WHERE id = $1', [uid])
    }
    await conn.query('DELETE FROM students WHERE institution_id = $1', [instId])

    await conn.query('COMMIT')

    const authUser = await getAuthPayload(request)
    logAudit({
      userId: (authUser?.userId as string) || '',
      institutionId: instId || '',
      action: 'delete',
      entity: 'enrollment',
      entityId: 'all',
      details: { bulkDelete: true, studentsDeleted: studentsResult.rows.length, parentsDeleted: parentIds.length },
    })

    return NextResponse.json({ success: true, studentsDeleted: studentsResult.rows.length, parentsDeleted: parentIds.length })
  } catch (error: any) {
    if (conn) {
      try { await conn.query('ROLLBACK') } catch {}
    }
    console.error('[DELETE /api/secretario/enrollments] bulk', error)
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
  } finally {
    if (conn) {
      try { conn.release() } catch {}
    }
  }
}
