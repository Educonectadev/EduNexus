import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload } from '@/lib/resolveInstId'
import { checkPlanFeature } from '@/lib/checkPlanLimit'
import crypto from 'crypto'

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
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10)

    const [rows] = await pool.query(
      `SELECT id, teacher_id, date, check_in, check_out, status, notes, created_at, updated_at
       FROM teacher_attendance
       WHERE teacher_id = ? AND date = ?`,
      [userId, date]
    )
    const record = (rows as any[])[0] || null

    const [pendingRows] = await pool.query(
      `SELECT id, teacher_id, date, check_in, check_out, status, notes
       FROM teacher_attendance
       WHERE teacher_id = ? AND check_in IS NOT NULL AND check_out IS NULL AND date < ?
       ORDER BY date DESC LIMIT 1`,
      [userId, date]
    )
    const pendingCheckout = (pendingRows as any[])[0] || null
    if (pendingCheckout) {
      const d = pendingCheckout.date
      pendingCheckout.date = d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10)
    }

    const dayOfWeek = new Date(date + 'T00:00:00').getDay()
    const scheduleDay = dayOfWeek >= 1 && dayOfWeek <= 5 ? dayOfWeek : null
    let schedule = null
    if (scheduleDay) {
      const [schedRows] = await pool.query(
        `SELECT MIN(h.start_time) as start_time, MAX(h.end_time) as end_time, COUNT(*) as blocks
         FROM horarios h
         JOIN courses c ON h.course_id = c.id
         JOIN teachers t ON c.teacher_id = t.id
         WHERE t.user_id = ? AND h.status = 'active' AND h.day_of_week = ?`,
        [userId, scheduleDay]
      )
      const s = (schedRows as any[])[0]
      if (s && s.start_time) {
        schedule = {
          start_time: (s.start_time as string).slice(0, 5),
          end_time: (s.end_time as string).slice(0, 5),
          blocks: s.blocks,
        }
      }
    }

    return NextResponse.json({ attendance: record, schedule, date, pendingCheckout })
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching attendance' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'docente') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const userId = user.id as string
    const instId = user.institutionId as string
    if (!instId) {
      return NextResponse.json({ error: 'No institution' }, { status: 400 })
    }

    const allowed = await checkPlanFeature(instId, 'can_attendance')
    if (!allowed) {
      return NextResponse.json({ error: 'Asistencia no disponible en tu plan' }, { status: 403 })
    }

    const body = await request.json()
    const { action, date, notes, time } = body
    const today = date || new Date().toISOString().slice(0, 10)
    const currentTime = time || `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}:${String(new Date().getSeconds()).padStart(2, '0')}`

    const dayOfWeek = new Date(today + 'T00:00:00').getDay()
    const scheduleDay = dayOfWeek >= 1 && dayOfWeek <= 5 ? dayOfWeek : null

    const [schedRows] = scheduleDay ? await pool.query(
      `SELECT MIN(h.start_time) as start_time, MAX(h.end_time) as end_time
       FROM horarios h
       JOIN courses c ON h.course_id = c.id
       JOIN teachers t ON c.teacher_id = t.id
       WHERE t.user_id = ? AND h.status = 'active' AND h.day_of_week = ?`,
      [userId, scheduleDay]
    ) : [[{ start_time: null, end_time: null }]]
    const sched = (schedRows as any[])[0]
    const scheduleStart = sched?.start_time || null
    const scheduleEnd = sched?.end_time || null

    const graceMinutes = 15
    const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
    const applyGrace = (t: string) => toMin(t) + graceMinutes
    const fmt = (mins: number) => `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}:00`

    const currentMin = toMin(currentTime.slice(0, 5))

    const [existing] = await pool.query(
      `SELECT id, check_in, check_out, status FROM teacher_attendance WHERE teacher_id = ? AND date = ?`,
      [userId, today]
    )
    const record = (existing as any[])[0]

    if (action === 'check-in') {
      if (!scheduleStart) {
        return NextResponse.json({ error: 'No tienes horario programado para hoy' }, { status: 400 })
      }
      const checkInWindowStart = toMin(scheduleStart) - 30
      const checkInWindowEnd = applyGrace(scheduleStart)
      if (currentMin < checkInWindowStart || currentMin > checkInWindowEnd) {
        return NextResponse.json({
          error: 'OUTSIDE_SCHEDULE',
          message: `Solo puedes marcar entrada entre ${fmt(checkInWindowStart).slice(0,5)} y ${fmt(checkInWindowEnd).slice(0,5)}`,
          window: { start: fmt(checkInWindowStart).slice(0,5), end: fmt(checkInWindowEnd).slice(0,5) },
        }, { status: 400 })
      }
      const [pendingRows] = await pool.query(
        `SELECT id, teacher_id, date, check_in, check_out, status, notes
         FROM teacher_attendance
         WHERE teacher_id = ? AND check_in IS NOT NULL AND check_out IS NULL AND date < ?
         ORDER BY date DESC LIMIT 1`,
        [userId, today]
      )
      const pendingCheckout = (pendingRows as any[])[0] || null
      if (pendingCheckout) {
        const d = pendingCheckout.date
        pendingCheckout.date = d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10)
        return NextResponse.json({
          error: 'PENDING_CHECKOUT',
          message: 'Debes marcar tu salida del día anterior antes de registrar tu entrada',
          pendingCheckout,
        }, { status: 409 })
      }
      const checkInLimit = scheduleStart ? fmt(applyGrace(scheduleStart)) : '08:30:00'
      const status = currentTime <= checkInLimit ? 'present' : 'late'

      if (record) {
        await pool.query(
          `UPDATE teacher_attendance SET check_in = ?, status = ?, notes = ? WHERE id = ?`,
          [currentTime, record.check_in ? record.status : status, notes || null, record.id]
        )
      } else {
        const id = crypto.randomUUID()
        await pool.query(
          `INSERT INTO teacher_attendance (id, institution_id, teacher_id, date, check_in, status, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, instId, userId, today, currentTime, status, notes || null]
        )
      }
    } else if (action === 'check-out') {
      if (!record) {
        return NextResponse.json({ error: 'No check-in found for today' }, { status: 400 })
      }
      if (!record.check_in) {
        return NextResponse.json({ error: 'Debes marcar entrada primero' }, { status: 400 })
      }
      if (record.check_out) {
        return NextResponse.json({ error: 'Ya marcaste salida hoy' }, { status: 400 })
      }
      if (scheduleEnd) {
        const checkOutWindowStart = toMin(scheduleEnd) - 15
        const checkOutWindowEnd = toMin(scheduleEnd) + 60
        if (currentMin < checkOutWindowStart || currentMin > checkOutWindowEnd) {
          return NextResponse.json({
            error: 'OUTSIDE_SCHEDULE',
            message: `Solo puedes marcar salida entre ${fmt(checkOutWindowStart).slice(0,5)} y ${fmt(checkOutWindowEnd).slice(0,5)}`,
            window: { start: fmt(checkOutWindowStart).slice(0,5), end: fmt(checkOutWindowEnd).slice(0,5) },
          }, { status: 400 })
        }
      }
      const checkOutStatus = scheduleEnd && currentTime < fmt(applyGrace(scheduleEnd))
        ? 'early_leave'
        : record.status === 'present' || record.status === 'late'
          ? record.status
          : 'present'
      await pool.query(
        `UPDATE teacher_attendance SET check_out = ?, status = ?, notes = ? WHERE id = ?`,
        [currentTime, checkOutStatus, notes || null, record.id]
      )
    } else {
      return NextResponse.json({ error: 'Invalid action. Use check-in or check-out' }, { status: 400 })
    }

    const [updated] = await pool.query(
      `SELECT id, teacher_id, date, check_in, check_out, status, notes FROM teacher_attendance WHERE teacher_id = ? AND date = ?`,
      [userId, today]
    )
    const updatedRecord = (updated as any[])[0]
    return NextResponse.json({
      success: true,
      attendance: updatedRecord,
      schedule: scheduleStart
        ? { start_time: scheduleStart.slice(0, 5), end_time: (scheduleEnd || '').slice(0, 5), blocks: null }
        : null,
    })
  } catch (error: any) {
    console.error('[docente attendance POST error]', error?.message, error?.sqlMessage, error?.stack)
    return NextResponse.json({ error: 'Error updating attendance' }, { status: 500 })
  }
}
