import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { id } = await params
    const body = await request.json()

    if (body.is_active) {
      await pool.query(`UPDATE academic_periods SET is_active = 0 WHERE institution_id = ?`, [instId])
    }

    const updates: string[] = []; const values: any[] = []
    if (body.name) { updates.push('name = ?'); values.push(body.name) }
    if (body.year) { updates.push('year = ?'); values.push(Number(body.year)) }
    if (body.start_date !== undefined) { updates.push('start_date = ?'); values.push(body.start_date || null) }
    if (body.end_date !== undefined) { updates.push('end_date = ?'); values.push(body.end_date || null) }
    if (body.is_active !== undefined) { updates.push('is_active = ?'); values.push(body.is_active ? 1 : 0) }
    if (updates.length === 0) return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
    values.push(id, instId)
    await pool.query(`UPDATE academic_periods SET ${updates.join(', ')} WHERE id = ? AND institution_id = ?`, values)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error updating period' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { id } = await params
    await pool.query(`DELETE FROM academic_periods WHERE id = ? AND institution_id = ?`, [id, instId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting period' }, { status: 500 })
  }
}
