import pool from '@/lib/db'
import { normalizeGradeLabel } from '@/lib/academic-level'
import { ensureTeacherRow } from '@/lib/ensure-teacher'

type FkTarget = 'teachers' | 'users' | 'unknown'
let cachedFk: FkTarget | undefined

async function coursesTeacherIdFk(): Promise<FkTarget> {
  if (cachedFk !== undefined) return cachedFk
  let resolved: FkTarget = 'unknown'
  try {
    const [rows] = await pool.query(
      `SELECT ccu.table_name AS ref
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
       JOIN information_schema.constraint_column_usage ccu
         ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
       WHERE tc.constraint_type = 'FOREIGN KEY'
         AND tc.table_name = 'courses' AND kcu.column_name = 'teacher_id'
       ORDER BY tc.constraint_name
       LIMIT 1`
    )
    const ref = (rows as any[])[0]?.ref
    resolved = ref === 'teachers' || ref === 'users' ? ref : 'unknown'
  } catch {
    resolved = 'unknown'
  }
  cachedFk = resolved
  return resolved
}

export type TeacherResolution = { teacherId: string | null; error?: string }

export async function resolveTeacherId(instId: string, value: string | null | undefined): Promise<TeacherResolution> {
  if (!value) return { teacherId: null }

  const fk = await coursesTeacherIdFk()

  if (fk === 'users') {
    const [user] = await pool.query(`SELECT id FROM users WHERE id = ? AND institution_id = ?`, [value, instId])
    if ((user as any[]).length) return { teacherId: value }
    const [teacher] = await pool.query(`SELECT user_id FROM teachers WHERE id = ? AND institution_id = ?`, [value, instId])
    if ((teacher as any[]).length) return { teacherId: (teacher as any[])[0].user_id }
    return { teacherId: null, error: 'El docente seleccionado no existe en esta institución' }
  }

  const [teacher] = await pool.query(`SELECT id FROM teachers WHERE id = ? AND institution_id = ?`, [value, instId])
  if ((teacher as any[]).length) return { teacherId: (teacher as any[])[0].id }

  const [byUser] = await pool.query(`SELECT id FROM teachers WHERE user_id = ? AND institution_id = ?`, [value, instId])
  if ((byUser as any[]).length) return { teacherId: (byUser as any[])[0].id }

  const [user] = await pool.query(
    `SELECT id, full_name, email FROM users WHERE id = ? AND institution_id = ? AND role = 'docente'`,
    [value, instId]
  )
  const row = (user as any[])[0]
  if (row) {
    try {
      const teacherId = await ensureTeacherRow(instId, row)
      return { teacherId }
    } catch (e: any) {
      return { teacherId: null, error: `No se pudo registrar la ficha del docente (${e?.message || 'error'})` }
    }
  }

  return { teacherId: null, error: 'El docente seleccionado no existe en esta institución' }
}

export type GradeResolution = { grade: string; error?: string }

export async function resolveGrade(instId: string, grade: string): Promise<GradeResolution> {
  const [rows] = await pool.query(`SELECT name FROM academic_grades WHERE institution_id = ?`, [instId])
  const names = (rows as any[]).map(r => r.name).filter(Boolean)
  if (names.length === 0) return { grade }

  const exact = names.find(n => n === grade)
  if (exact) return { grade: exact }

  const target = normalizeGradeLabel(grade)
  const match = names.find(n => normalizeGradeLabel(n) === target)
  if (match) return { grade: match }

  return { grade, error: `El grado «${grade}» no está en el catálogo de grados de la institución` }
}

const FIELD_LIMITS = [
  { field: 'name', label: 'Nombre', max: 200 },
  { field: 'code', label: 'Código', max: 20 },
  { field: 'grade', label: 'Grado', max: 20 },
  { field: 'section', label: 'Sección', max: 10 },
]

export function validateCourseFields(body: Record<string, any>): string | null {
  for (const rule of FIELD_LIMITS) {
    const value = body[rule.field]
    if (typeof value === 'string' && value.length > rule.max) {
      return `${rule.label} supera los ${rule.max} caracteres (${value.length})`
    }
  }
  return null
}
