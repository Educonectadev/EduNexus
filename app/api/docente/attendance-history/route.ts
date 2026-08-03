import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload } from '@/lib/resolveInstId'
import { checkPlanFeature } from '@/lib/checkPlanLimit'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'docente') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const instId = user.institutionId as string
    const allowed = await checkPlanFeature(instId, 'can_attendance')
    if (!allowed) {
      return NextResponse.json({ error: 'Asistencia no disponible en tu plan' }, { status: 403 })
    }
    const userId = user.id as string
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '30')

    const [rows] = await pool.query(
      `SELECT id, date, check_in, check_out, status, notes, created_at
       FROM teacher_attendance
       WHERE teacher_id = ?
       ORDER BY date DESC
       LIMIT ?`,
      [userId, limit]
    )

    return NextResponse.json({ records: rows })
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching history' }, { status: 500 })
  }
}
