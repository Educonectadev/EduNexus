import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { course_id, day_of_week, start_time, end_time, classroom, status } = body

    await pool.query(
      `UPDATE horarios SET course_id = ?, day_of_week = ?, start_time = ?, end_time = ?, classroom = ?, status = ? WHERE id = ? AND institution_id = ?`,
      [course_id, day_of_week, start_time, end_time, classroom || null, status || 'active', id, instId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error updating horario' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await params
    await pool.query(`DELETE FROM horarios WHERE id = ? AND institution_id = ?`, [id, instId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting horario' }, { status: 500 })
  }
}
