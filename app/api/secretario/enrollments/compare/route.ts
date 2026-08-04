import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'

interface CompareRow {
  student_name: string
  student_dni: string
  student_birth_date: string
  student_gender: string
  parent_name: string
  parent_dni: string
  parent_phone: string
  parent_email: string
  grade: string
  section: string
}

function norm(v: string): string {
  const decoded = (v || '').toString().replace(/u00([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
  return decoded.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ')
}

function fmtDate(v: any): string {
  if (!v) return ''
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v).slice(0, 10)
}

function normGender(v: string): string {
  const g = (v || '').toString().trim().toUpperCase()
  if (g === 'MASCULINO') return 'M'
  if (g === 'FEMENINO') return 'F'
  return g
}

export async function POST(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await request.json()
    const rows: CompareRow[] = Array.isArray(body?.rows) ? body.rows : []

    const dnis = [...new Set(rows.map(r => (r.student_dni || '').trim()).filter(Boolean))]
    if (dnis.length === 0) return NextResponse.json({ results: [] })

    const [students] = await pool.query(
      `SELECT id, code, first_name, last_name, document_number, birth_date, gender,
              document_type, grade, section
       FROM students
       WHERE document_number IN (?) AND institution_id = ?`,
      [dnis, instId]
    )

    const [enrollments] = await pool.query(
      `SELECT e.id, e.student_id, e.grade, e.section, e.year, e.status
       FROM enrollments e
       JOIN students s ON s.id = e.student_id
       WHERE s.document_number IN (?) AND s.institution_id = ? AND e.status = 'active'`,
      [dnis, instId]
    )

    const [parents] = await pool.query(
      `SELECT p.id, p.first_name, p.last_name, p.document_number, p.phone, p.email,
              p.user_id
       FROM parents p
       JOIN parent_student ps ON ps.parent_id = p.id
       JOIN students s ON s.id = ps.student_id
       WHERE s.document_number IN (?) AND s.institution_id = ?`,
      [dnis, instId]
    )
    const parentByStudent = new Map<string, any[]>()
    const [parentLinks] = await pool.query(
      `SELECT ps.student_id, ps.parent_id
       FROM parent_student ps
       JOIN students s ON s.id = ps.student_id
       WHERE s.document_number IN (?) AND s.institution_id = ?`,
      [dnis, instId]
    )
    for (const link of parentLinks as any[]) {
      const arr = parentByStudent.get(link.student_id) || []
      arr.push((parents as any[]).find(p => p.id === link.parent_id))
      parentByStudent.set(link.student_id, arr)
    }

    const studentByDni = new Map<string, any>()
    for (const s of students as any[]) studentByDni.set(s.document_number, s)

    const enrollmentByStudent = new Map<string, any>()
    for (const e of enrollments as any[]) {
      if (!enrollmentByStudent.has(e.student_id)) enrollmentByStudent.set(e.student_id, e)
    }

    const results = rows.map(row => {
      const dni = (row.student_dni || '').trim()
      const student = dni ? studentByDni.get(dni) : null

      if (!student) {
        return { row: row.student_dni, dni, status: 'new', changes: [], existing: false }
      }

      const changes: { field: string; old: string; new: string }[] = []

      const expectedName = norm(row.student_name)
      const actualName = norm(`${student.first_name || ''} ${student.last_name || ''}`)
      if (expectedName && expectedName !== actualName) {
        changes.push({ field: 'Nombre', old: `${student.first_name || ''} ${student.last_name || ''}`.trim(), new: (row.student_name || '').trim() })
      }

      const expectedBirth = (row.student_birth_date || '').trim()
      const actualBirth = fmtDate(student.birth_date)
      if (expectedBirth && expectedBirth !== actualBirth) {
        changes.push({ field: 'Fecha nac.', old: actualBirth || '—', new: expectedBirth })
      }

      const expectedGender = normGender(row.student_gender)
      const actualGender = normGender(student.gender || '')
      if (expectedGender && expectedGender !== actualGender) {
        changes.push({ field: 'Género', old: actualGender || '—', new: expectedGender })
      }

      const enrollment = enrollmentByStudent.get(student.id)
      const expectedGrade = (row.grade || '').trim()
      const actualGrade = enrollment?.grade || student.grade || ''
      if (expectedGrade && expectedGrade !== actualGrade) {
        changes.push({ field: 'Grado', old: actualGrade || '—', new: expectedGrade })
      }

      const expectedSection = (row.section || '').trim()
      const actualSection = enrollment?.section || student.section || ''
      if (expectedSection && expectedSection !== actualSection) {
        changes.push({ field: 'Sección', old: actualSection || '—', new: expectedSection })
      }

      // Parent comparison (first linked parent)
      const linkedParents = (parentByStudent.get(student.id) || []).filter(Boolean)
      const parent = linkedParents[0]
      if (parent) {
        const expectedParentName = norm(row.parent_name)
        const actualParentName = norm(`${parent.first_name || ''} ${parent.last_name || ''}`)
        if (expectedParentName && expectedParentName !== actualParentName) {
          changes.push({ field: 'Padre', old: `${parent.first_name || ''} ${parent.last_name || ''}`.trim(), new: (row.parent_name || '').trim() })
        }
        if (row.parent_phone && row.parent_phone.trim() !== (parent.phone || '')) {
          changes.push({ field: 'Teléfono padre', old: parent.phone || '—', new: row.parent_phone.trim() })
        }
        if (row.parent_email && row.parent_email.trim() !== (parent.email || '')) {
          changes.push({ field: 'Email padre', old: parent.email || '—', new: row.parent_email.trim() })
        }
      }

      return {
        row: row.student_dni,
        dni,
        status: changes.length === 0 ? 'unchanged' : 'changed',
        changes,
        existing: true,
        code: student.code || '',
        enrollmentId: enrollment?.id || null,
        enrollmentYear: enrollment?.year || '',
      }
    })

    return NextResponse.json({ results })
  } catch (error: any) {
    console.error('[compare enrollments]', error)
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
  }
}
