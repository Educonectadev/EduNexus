import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { name, code, grade, section, teacher_id, status } = body

    await pool.query(
      `UPDATE courses SET name = ?, code = ?, grade = ?, section = ?, teacher_id = ?, status = ? WHERE id = ? AND institution_id = ?`,
      [name, code, grade, section || 'A', teacher_id || null, status || 'active', id, instId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error updating curso' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await params
    await pool.query(`DELETE FROM courses WHERE id = ? AND institution_id = ?`, [id, instId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting curso' }, { status: 500 })
  }
}
