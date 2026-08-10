import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import pool from '@/lib/db'

// Helpers para crear/consultar la cuenta web (rol 'padre') de un apoderado.

export function generateParentPassword(): string {
  const segment = () => Math.random().toString(36).slice(2, 6)
  return `padre-${segment()}-${segment()}`
}

function slugify(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/).join('.')
}

export function generateParentEmail(fullName: string, dni: string, instId: string): string {
  const base = slugify(fullName) || 'padre'
  return `${base}.${dni.slice(-4).toLowerCase()}${instId.slice(0, 4).toLowerCase()}@iep.edu.pe`
}

export interface ParentAccountResult {
  userId: string | null
  email: string
  password: string | null
  created: boolean
  existed: boolean
}

// Crea la cuenta del padre si aún no existe y retorna credenciales.
export async function ensureParentAccount(
  instId: string,
  parentId: string,
  fullName: string,
  dni: string,
  preferredEmail: string | null
): Promise<ParentAccountResult> {
  const email = preferredEmail?.trim() || generateParentEmail(fullName, dni, instId)

  const [existing] = await pool.query(
    `SELECT u.id FROM users u
     WHERE u.email = ? AND u.role = 'padre' LIMIT 1`,
    [email]
  ) as any[]
  const row = (existing as any[])[0]

  if (row) {
    try {
      await pool.query(`UPDATE parents SET email = ?, user_id = ? WHERE id = ?`, [email, row.id, parentId])
    } catch { /* columna user_id quizá no existe */ }
    return { userId: row.id, email, password: null, created: false, existed: true }
  }

  const password = generateParentPassword()
  const hashed = await bcrypt.hash(password, 10)
  const userId = crypto.randomUUID()

  await pool.query(
    `INSERT INTO users (id, email, full_name, password_hash, role, institution_id, status)
     VALUES (?, ?, ?, ?, 'padre', ?, 'active')`,
    [userId, email, fullName, hashed, instId]
  )

  try {
    await pool.query(`UPDATE parents SET email = ?, user_id = ? WHERE id = ?`, [email, userId, parentId])
  } catch { /* columna user_id quizá no existe */ }

  return { userId, email, password, created: true, existed: false }
}