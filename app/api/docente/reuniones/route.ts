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
              meeting_date, meeting_time, institution_id, created_at,
              COALESCE(priority, 'media') as priority,
              pinned,
              COALESCE(location, '') as location,
              COALESCE(virtual_link, '') as virtual_link,
              COALESCE(agenda, '') as agenda
       FROM notifications
       WHERE type = 'meeting' AND institution_id = $1
         AND (target_role = 'all' OR target_role = 'docente')
       ORDER BY meeting_date DESC, meeting_time DESC`,
      [instId]
    )
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json([])
  }
}
