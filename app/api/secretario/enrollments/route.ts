import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import crypto from 'crypto'
import { resolveInstId, getAuthPayload } from '@/lib/resolveInstId'
import { logAudit } from '@/lib/audit'
import { checkPlanLimit } from '@/lib/checkPlanLimit'

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

export async function POST(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({error: 'No autenticado'}, { status: 401 })

    const body = await request.json()
    const {
      student_code, student_name, student_dni, student_birth_date, student_gender,
      parent_name, parent_dni, parent_phone, parent_email,
      grade, section, year,
    } = body

    if (!student_name || !student_dni || !grade) {
      return NextResponse.json({ error: 'Nombre, DNI y grado son requeridos' }, { status: 400 })
    }

    // Split full name into first/last
    const nameParts = student_name.trim().split(/\s+/)
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    // Check plan limit before enrolling new students
    const limitCheck = await checkPlanLimit(instId, 'students')
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.message }, { status: 403 })
    }

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      let studentId: string

      // Check if student exists by document_number within this institution
      const [existingStudent] = await conn.query(
        'SELECT id FROM students WHERE document_number = ? AND institution_id = ?',
        [student_dni, instId]
      )

      if ((existingStudent as any[]).length > 0) {
        // Student exists — check if enrollment already exists for same grade/section/year
        studentId = (existingStudent as any[])[0].id
        const [existingEnrollment] = await conn.query(
          `SELECT id FROM enrollments WHERE student_id = ? AND grade = ? AND section = ? AND year = ?`,
          [studentId, grade, section || 'A', year || new Date().getFullYear()]
        )
        if ((existingEnrollment as any[]).length > 0) {
          await conn.rollback()
          return NextResponse.json({ error: 'DUPLICATE_ENROLLMENT', details: `El alumno ya está matriculado en ${grade} ${section || 'A'} ${year || new Date().getFullYear()}` }, { status: 409 })
        }

        await conn.query(
          `UPDATE students SET first_name = ?, last_name = ?, birth_date = COALESCE(?, birth_date), gender = COALESCE(?, gender),
           code = COALESCE(NULLIF(?, ''), code)
           WHERE id = ?`,
          [firstName, lastName, student_birth_date || null, student_gender || null, student_code?.trim() || '', studentId]
        )
      } else {
        studentId = crypto.randomUUID()
        const code = student_code?.trim() || `ALU-${Date.now().toString(36).toUpperCase()}`
        await conn.query(
          `INSERT INTO students (id, institution_id, code, first_name, last_name, document_type, document_number, birth_date, gender, grade, section, status)
           VALUES (?, ?, ?, ?, ?, 'DNI', ?, NULLIF(?, ''), NULLIF(?, ''), ?, ?, 'active')`,
          [studentId, instId, code, firstName, lastName, student_dni, student_birth_date || null, student_gender || null, grade, section || 'A']
        )
      }

      // Insert enrollment (id is auto_increment)
      const [result] = await conn.query(
        `INSERT INTO enrollments (student_id, grade, section, year, status)
         VALUES (?, ?, ?, ?, 'active')`,
        [studentId, grade, section || 'A', year || new Date().getFullYear()]
      )

      // Link parent if provided
      if (parent_dni) {
        const [existingParent] = await conn.query(
          'SELECT id FROM parents WHERE document_number = ? AND institution_id = ?',
          [parent_dni, instId]
        )

        let parentId: string

        if ((existingParent as any[]).length > 0) {
          parentId = (existingParent as any[])[0].id
        } else {
          parentId = crypto.randomUUID()
          const parentNameParts = (parent_name || '').trim().split(/\s+/)
          const parentFirst = parentNameParts[0] || ''
          const parentLast = parentNameParts.slice(1).join(' ') || ''
          await conn.query(
            `INSERT INTO parents (id, institution_id, first_name, last_name, document_type, document_number, phone, email)
             VALUES (?, ?, ?, ?, 'DNI', ?, ?, ?)`,
            [parentId, instId, parentFirst, parentLast, parent_dni, parent_phone || null, parent_email || null]
          )
        }

        const [existingLink] = await conn.query(
          'SELECT id FROM parent_student WHERE parent_id = ? AND student_id = ?',
          [parentId, studentId]
        )
        if ((existingLink as any[]).length === 0) {
          await conn.query(
            `INSERT INTO parent_student (parent_id, student_id, relationship, is_primary) VALUES (?, ?, 'padre', 1)`,
            [parentId, studentId]
          )
        }
      }

      await conn.commit()

      const authUser = await getAuthPayload(request)
      logAudit({
        userId: (authUser?.userId as string) || '',
        institutionId: instId || '',
        action: 'enroll',
        entity: 'enrollment',
        entityId: String((result as any).insertId),
        details: { studentId, grade, section, year: year || new Date().getFullYear() },
      })

      return NextResponse.json({ success: true, enrollmentId: (result as any).insertId, studentId })
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Error creating enrollment', details: error.message }, { status: 500 })
  }
}
