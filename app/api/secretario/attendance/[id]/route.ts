import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
import { checkPlanFeature } from '@/lib/checkPlanLimit'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const allowed = await checkPlanFeature(instId, 'can_attendance')
    if (!allowed) {
      return NextResponse.json({ error: 'Asistencia no disponible en tu plan' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, notes } = body
    await pool.query(`UPDATE attendance SET status = ?, notes = ? WHERE id = ? AND institution_id = ?`, [status, notes || null, id, instId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error updating attendance' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const allowed = await checkPlanFeature(instId, 'can_attendance')
    if (!allowed) {
      return NextResponse.json({ error: 'Asistencia no disponible en tu plan' }, { status: 403 })
    }

    const { id } = await params
    await pool.query(`DELETE FROM attendance WHERE id = ? AND institution_id = ?`, [id, instId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting attendance' }, { status: 500 })
  }
}
