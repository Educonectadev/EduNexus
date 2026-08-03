import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
import { checkPlanFeature } from '@/lib/checkPlanLimit'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const allowed = await checkPlanFeature(instId, 'can_grades')
    if (!allowed) {
      return NextResponse.json({ error: 'Calificaciones no disponibles en tu plan' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { score, max_score, notes } = body
    const updates: string[] = []; const values: any[] = []
    if (score !== undefined) { updates.push('score = ?'); values.push(Number(score)) }
    if (max_score !== undefined) { updates.push('max_score = ?'); values.push(Number(max_score)) }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes) }
    if (updates.length === 0) return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
    values.push(id, instId)
    await pool.query(`UPDATE grades SET ${updates.join(', ')} WHERE id = ? AND institution_id = ?`, values)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error updating grade' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const allowed = await checkPlanFeature(instId, 'can_grades')
    if (!allowed) {
      return NextResponse.json({ error: 'Calificaciones no disponibles en tu plan' }, { status: 403 })
    }

    const { id } = await params
    await pool.query(`DELETE FROM grades WHERE id = ? AND institution_id = ?`, [id, instId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting grade' }, { status: 500 })
  }
}
