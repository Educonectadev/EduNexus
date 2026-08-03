import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
import { checkPlanFeature } from '@/lib/checkPlanLimit'

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const allowed = await checkPlanFeature(instId, 'can_attendance')
    if (!allowed) {
      return NextResponse.json({ error: 'Asistencia no disponible en tu plan' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10)

    const [teachers] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.dni
       FROM users u
       WHERE u.institution_id = ? AND u.role = 'docente' AND u.status = 'active'
       ORDER BY u.full_name`,
      [instId]
    )

    const teacherIds = (teachers as any[]).map(t => t.id)
    let attendanceMap: Record<string, any> = {}

    if (teacherIds.length > 0) {
      const placeholders = teacherIds.map(() => '?').join(',')
      const [attRows] = await pool.query(
        `SELECT teacher_id, date, check_in, check_out, status, notes
         FROM teacher_attendance
         WHERE date = ? AND teacher_id IN (${placeholders})`,
        [date, ...teacherIds]
      )
      for (const a of attRows as any[]) {
        attendanceMap[a.teacher_id] = a
      }
    }

    const present = (teachers as any[]).filter(t => attendanceMap[t.id]?.status === 'present').length
    const late = (teachers as any[]).filter(t => attendanceMap[t.id]?.status === 'late').length
    const absent = (teachers as any[]).filter(t => attendanceMap[t.id]?.status === 'absent').length
    const justified = (teachers as any[]).filter(t => attendanceMap[t.id]?.status === 'justified').length
    const pending = (teachers as any[]).filter(t => !attendanceMap[t.id]).length

    const result = (teachers as any[]).map(t => ({
      ...t,
      attendance: attendanceMap[t.id] || null,
    }))

    return NextResponse.json({
      teachers: result,
      summary: { present, late, absent, justified, pending, total: result.length },
      date,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching teacher attendance' }, { status: 500 })
  }
}
