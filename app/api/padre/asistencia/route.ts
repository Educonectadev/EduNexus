import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getPadreUserId, getPadreChildrenIds, getPadreInstitutionId } from '@/lib/getPadreInfo'
import { checkPlanFeature } from '@/lib/checkPlanLimit'

export async function GET(request: NextRequest) {
  try {
    const userId = await getPadreUserId(request)
    if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const instId = await getPadreInstitutionId(request)
    const allowed = await checkPlanFeature(instId || '', 'can_attendance')
    if (!allowed) {
      return NextResponse.json({ error: 'Asistencia no disponible en tu plan' }, { status: 403 })
    }

    const childrenIds = await getPadreChildrenIds(userId)
    if (childrenIds.length === 0) {
      return NextResponse.json({ summary: null, records: [] })
    }

    const placeholders = childrenIds.map(() => '?').join(',')
    const [rows] = await pool.query(
      `SELECT a.date, a.status, a.entry_time, a.exit_time, a.observation, a.student_id
       FROM attendance a
       WHERE a.student_id IN (${placeholders})
       ORDER BY a.date DESC
       LIMIT 60`,
      childrenIds
    )

    const records = rows as any[]
    const totalDays = records.length
    const present = records.filter(r => r.status === 'present').length
    const absent = records.filter(r => r.status === 'absent').length
    const tardy = records.filter(r => r.status === 'tardy').length
    const pct = totalDays ? Math.round((present / totalDays) * 100) : 0

    return NextResponse.json({
      summary: { total_days: totalDays, present, absent, tardy, pct },
      records,
    })
  } catch (error) {
    console.error('Error fetching asistencia:', error)
    return NextResponse.json({ summary: null, records: [] })
  }
}
