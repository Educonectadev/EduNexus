import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload } from '@/lib/resolveInstId'

export async function getPadreUserId(request: NextRequest): Promise<string | null> {
  const payload = await getAuthPayload(request)
  return (payload?.userId as string) || null
}

export async function getPadreInstitutionId(request: NextRequest): Promise<string | null> {
  const payload = await getAuthPayload(request)
  return (payload?.institutionId as string) || null
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
