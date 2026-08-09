import pool from '@/lib/db'
import { addBusinessDays } from '@/lib/trial'
import crypto from 'crypto'

export async function generateInstitutionCode(): Promise<string> {
  try {
    const [rows] = await pool.query(
      `SELECT code FROM institutions WHERE code LIKE 'COL-%' ORDER BY CAST(SUBSTRING(code, 5) AS INTEGER) DESC LIMIT 1`
    ) as any[]
    if (rows.length > 0) {
      const lastCode = rows[0].code
      const numPart = lastCode.replace('COL-', '')
      const lastNum = parseInt(numPart, 10)
      if (!isNaN(lastNum)) {
        const nextNum = lastNum + 1
        return `COL-${String(nextNum).padStart(2, '0')}`
      }
    }
  } catch (e) {
    console.error('Error generating code:', e)
  }
  return 'COL-01'
}

export interface PublicInstitutionInfo {
  name: string
  fullName: string
  email: string
  passwordHash: string
  code?: string
  phone?: string
  phone2?: string
  website?: string
  director_phone?: string
  director_dni?: string
  director_email?: string
  type?: string
  level?: string
  modality?: string
  shift?: string
  dependence?: string
  department?: string
  province?: string
  district?: string
  address?: string
  reference?: string
  total_students?: number
  total_teachers?: number
  total_classrooms?: number
  has_lab?: boolean
  has_library?: boolean
  has_computer_room?: boolean
  has_playground?: boolean
  schedule_config?: any
  notes?: string
  trialDays?: number
  isDemo?: boolean
}

// Crea una institución gratuita con trial de N días hábiles y su usuario director.
// Por defecto 20 días (registro gratis); para demo se pasan 15 días y isDemo: true
// marca la institución (notes = 'DEMO') para que el dev la distinga.
export async function createFreeInstitution(info: PublicInstitutionInfo): Promise<{ institutionId: string; code: string }> {
  const instId = crypto.randomUUID()
  const code = info.code || await generateInstitutionCode()
  const trialDays = info.trialDays ?? 20

  const [instColRows] = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'institutions'`
  ) as any[]
  const instCols = (instColRows || []).map((c: any) => c.column_name)
  const has = (col: string) => instCols.includes(col)

  const [userColRows] = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'users'`
  ) as any[]
  const colNames = (userColRows || []).map((c: any) => c.column_name)
  const hasPasswordHash = colNames.includes('password_hash')
  const hasStatus = colNames.includes('status')

  const inserts: Record<string, any> = {
    id: instId,
    code,
    name: info.name,
    type: info.type || 'colegio',
    status: 'active',
    trial_ends_at: addBusinessDays(new Date(), trialDays).toISOString(),
  }

  if (has('email') && info.email) inserts.email = info.email
  if (has('phone') && info.phone) inserts.phone = info.phone
  if (has('phone2') && info.phone2) inserts.phone2 = info.phone2
  if (has('website') && info.website) inserts.website = info.website
  if (has('director_name') && info.fullName) inserts.director_name = info.fullName
  if (has('director_dni') && info.director_dni) inserts.director_dni = info.director_dni
  if (has('director_phone') && info.director_phone) inserts.director_phone = info.director_phone
  if (has('director_email') && info.director_email) inserts.director_email = info.director_email
  if (has('level') && info.level) inserts.level = info.level
  if (has('modality') && info.modality) inserts.modality = info.modality
  if (has('shift') && info.shift) inserts.shift = info.shift
  if (has('dependence') && info.dependence) inserts.dependence = info.dependence
  if (has('department') && info.department) inserts.department = info.department
  if (has('province') && info.province) inserts.province = info.province
  if (has('district') && info.district) inserts.district = info.district
  if (has('address') && info.address) inserts.address = info.address
  if (has('reference') && info.reference) inserts.reference = info.reference
  if (has('total_students') && info.total_students) inserts.total_students = info.total_students
  if (has('total_teachers') && info.total_teachers) inserts.total_teachers = info.total_teachers
  if (has('total_classrooms') && info.total_classrooms) inserts.total_classrooms = info.total_classrooms
  if (has('has_lab') && typeof info.has_lab === 'boolean') inserts.has_lab = info.has_lab
  if (has('has_library') && typeof info.has_library === 'boolean') inserts.has_library = info.has_library
  if (has('has_computer_room') && typeof info.has_computer_room === 'boolean') inserts.has_computer_room = info.has_computer_room
  if (has('has_playground') && typeof info.has_playground === 'boolean') inserts.has_playground = info.has_playground
  if (has('schedule_config') && info.schedule_config) inserts.schedule_config = JSON.stringify(info.schedule_config)
  if (has('notes')) inserts.notes = info.isDemo ? 'DEMO' : (info.notes || '')

  const conn = await pool.getConnection()
  try {
    await conn.query('BEGIN')

    const columns = Object.keys(inserts)
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')
    const values = columns.map((c) => inserts[c])
    await conn.query(
      `INSERT INTO institutions (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    )

    const userId = crypto.randomUUID()
    if (hasPasswordHash && hasStatus) {
      await conn.query(
        `INSERT INTO users (id, email, full_name, password_hash, role, institution_id, status)
         VALUES ($1, $2, $3, $4, 'director', $5, 'active')`,
        [userId, info.email, info.fullName, info.passwordHash, instId]
      )
    } else if (hasPasswordHash) {
      await conn.query(
        `INSERT INTO users (id, email, full_name, password_hash, role, institution_id)
         VALUES ($1, $2, $3, $4, 'director', $5)`,
        [userId, info.email, info.fullName, info.passwordHash, instId]
      )
    } else {
      await conn.query(
        `INSERT INTO users (id, email, full_name, password, role, institution_id)
         VALUES ($1, $2, $3, $4, 'director', $5)`,
        [userId, info.email, info.fullName, info.passwordHash, instId]
      )
    }

    await conn.query('COMMIT')
    return { institutionId: instId, code }
  } catch (err) {
    await conn.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    conn.release()
  }
}