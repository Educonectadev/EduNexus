import pool from '@/lib/db'

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

export async function normalizeTeacherId(instId: string, value: string | null | undefined): Promise<string | null> {
  if (!value) return null
  const fk = await coursesTeacherIdFk()
  if (fk === 'unknown') return value

  if (fk === 'users') {
    const [user] = await pool.query(`SELECT id FROM users WHERE id = ? AND institution_id = ?`, [value, instId])
    if ((user as any[]).length) return value
    const [teacher] = await pool.query(`SELECT user_id FROM teachers WHERE id = ? AND institution_id = ?`, [value, instId])
    return (teacher as any[]).length ? (teacher as any[])[0].user_id : value
  }

  const [teacher] = await pool.query(`SELECT id FROM teachers WHERE id = ? AND institution_id = ?`, [value, instId])
  if ((teacher as any[]).length) return value
  const [byUser] = await pool.query(`SELECT id FROM teachers WHERE user_id = ? AND institution_id = ?`, [value, instId])
  if ((byUser as any[]).length) return (byUser as any[])[0].id
  return value
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
