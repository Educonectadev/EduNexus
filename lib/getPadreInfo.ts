import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import pool from '@/lib/db'

export async function getPadreUserId(request: NextRequest): Promise<string | null> {
  const token = request.headers.get('cookie')?.match(/token=([^;]+)/)?.[1]
  if (!token) return null
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'educonecta-secret')
    const { payload } = await jwtVerify(token, secret)
    return (payload.userId as string) || null
  } catch {
    return null
  }
}

export async function getPadreInstitutionId(request: NextRequest): Promise<string | null> {
  const token = request.headers.get('cookie')?.match(/token=([^;]+)/)?.[1]
  if (!token) return null
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'educonecta-secret')
    const { payload } = await jwtVerify(token, secret)
    return (payload.institutionId as string) || null
  } catch {
    return null
  }
}

export async function getPadreChildrenIds(userId: string): Promise<string[]> {
  const [parents] = await pool.query(
    `SELECT id FROM parents WHERE email = (SELECT email FROM users WHERE id = ?) LIMIT 1`,
    [userId]
  ) as any[]

  if (!parents || parents.length === 0) return []
  const parentId = parents[0].id

  const [links] = await pool.query(
    `SELECT student_id FROM parent_student WHERE parent_id = ?`,
    [parentId]
  ) as any[]

  return (links || []).map((l: any) => l.student_id)
}
