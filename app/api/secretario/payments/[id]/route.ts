import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { id } = await params
    const body = await request.json()
    const updates: string[] = []; const values: any[] = []
    if (body.amount !== undefined) { updates.push('amount = ?'); values.push(Number(body.amount)) }
    if (body.paid_amount !== undefined) { updates.push('paid_amount = ?'); values.push(Number(body.paid_amount)) }
    if (body.due_date !== undefined) { updates.push('due_date = ?'); values.push(body.due_date || null) }
    if (body.paid_date !== undefined) { updates.push('paid_date = ?'); values.push(body.paid_date || null) }
    if (body.status) { updates.push('status = ?'); values.push(body.status) }
    if (body.reference !== undefined) { updates.push('reference = ?'); values.push(body.reference || null) }
    if (body.notes !== undefined) { updates.push('notes = ?'); values.push(body.notes || null) }
    if (updates.length === 0) return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
    values.push(id, instId)
    await pool.query(`UPDATE payments SET ${updates.join(', ')} WHERE id = ? AND institution_id = ?`, values)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error updating payment' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { id } = await params
    await pool.query(`DELETE FROM payments WHERE id = ? AND institution_id = ?`, [id, instId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting payment' }, { status: 500 })
  }
}
