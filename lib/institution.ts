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

// Crea una institución gratuita con trial de 20 días hábiles y su usuario director.
export async function createFreeInstitution(info: {
  name: string
  code?: string
  fullName: string
  email: string
  phone?: string
  passwordHash: string
}): Promise<{ institutionId: string; code: string }> {
  const instId = crypto.randomUUID()
  const code = info.code || await generateInstitutionCode()

  const [colRows] = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1`,
    ['users']
  ) as any[]
  const colNames = (colRows || []).map((c: any) => c.column_name)
  const hasPasswordHash = colNames.includes('password_hash')
  const hasStatus = colNames.includes('status')

  const conn = await pool.getConnection()
  try {
    await conn.query('BEGIN')

    await conn.query(
      `INSERT INTO institutions (id, code, name, type, status, trial_ends_at)
       VALUES (?, ?, ?, 'private', 'active', ?)`,
      [instId, code, info.name, addBusinessDays(new Date(), 20).toISOString()]
    )

    if (hasPasswordHash && hasStatus) {
      await conn.query(
        `INSERT INTO users (id, email, full_name, password_hash, role, institution_id, status)
         VALUES (?, ?, ?, ?, 'director', ?, 'active')`,
        [crypto.randomUUID(), info.email, info.fullName, info.passwordHash, instId]
      )
    } else if (hasPasswordHash) {
      await conn.query(
        `INSERT INTO users (id, email, full_name, password_hash, role, institution_id)
         VALUES (?, ?, ?, ?, 'director', ?)`,
        [crypto.randomUUID(), info.email, info.fullName, info.passwordHash, instId]
      )
    } else {
      await conn.query(
        `INSERT INTO users (id, email, full_name, password, role, institution_id)
         VALUES (?, ?, ?, ?, 'director', ?)`,
        [crypto.randomUUID(), info.email, info.fullName, info.passwordHash, instId]
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