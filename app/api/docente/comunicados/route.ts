import { NextRequest, NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/resolveInstId'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json([])
    const instId = user.institutionId as string
    if (!instId) return NextResponse.json([])

    const [rows] = await pool.query(
      `SELECT id, title, COALESCE(message, '') as message, type, target_role, status,
              COALESCE(priority, 'media') as priority,
              COALESCE(category, 'general') as category,
              institution_id, created_at
       FROM notifications
       WHERE type = 'communication' AND institution_id = $1
         AND (target_role = 'all' OR target_role = 'docente')
       ORDER BY created_at DESC`,
      [instId]
    )
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json([])
  }
}
