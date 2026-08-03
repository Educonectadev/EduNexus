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

    return NextResponse.json({ attendance: record, date })
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
    const { action, date, notes } = body
    const today = date || new Date().toISOString().slice(0, 10)
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

    const [existing] = await pool.query(
      `SELECT id, check_in, check_out, status FROM teacher_attendance WHERE teacher_id = ? AND date = ?`,
      [userId, today]
    )
    const record = (existing as any[])[0]

    if (action === 'check-in') {
      const checkInLimit = '08:30:00'
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
      await pool.query(
        `UPDATE teacher_attendance SET check_out = ?, notes = ? WHERE id = ?`,
        [currentTime, notes || null, record.id]
      )
    } else {
      return NextResponse.json({ error: 'Invalid action. Use check-in or check-out' }, { status: 400 })
    }

    const [updated] = await pool.query(
      `SELECT id, teacher_id, date, check_in, check_out, status, notes FROM teacher_attendance WHERE teacher_id = ? AND date = ?`,
      [userId, today]
    )
    return NextResponse.json({ success: true, attendance: (updated as any[])[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Error updating attendance' }, { status: 500 })
  }
}
