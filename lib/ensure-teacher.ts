import crypto from 'crypto'
import pool from '@/lib/db'

export async function ensureTeacherRow(
  instId: string,
  user: { id: string; full_name?: string | null; email?: string | null }
): Promise<string> {
  const [existing] = await pool.query(
    `SELECT id FROM teachers WHERE user_id = ? AND institution_id = ? LIMIT 1`,
    [user.id, instId]
  )
  const found = (existing as any[])[0]
  if (found) return found.id

  const teacherId = crypto.randomUUID()
  const parts = (user.full_name || '').trim().split(/\s+/).filter(Boolean)
  const firstName = parts.slice(0, Math.ceil(parts.length / 2)).join(' ') || user.full_name || 'Docente'
  const lastName = parts.slice(Math.ceil(parts.length / 2)).join(' ')
  const code = `DOC-${String(Date.now()).slice(-5)}${teacherId.slice(0, 3).toUpperCase()}`

  await pool.query(
    `INSERT INTO teachers (id, user_id, institution_id, code, first_name, last_name, email, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
    [teacherId, user.id, instId, code, firstName, lastName, user.email || '']
  )
  return teacherId
}
