import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload, resolveInstId } from '@/lib/resolveInstId'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'Sin institucion' }, { status: 400 })

    const { id } = await params

    const [existing] = await pool.query(
      'SELECT id FROM courses WHERE id = ? AND institution_id = ?',
      [id, instId]
    ) as any[]
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { name, code, grade, section, teacher_id, status } = body

    await pool.query(
      `UPDATE courses SET name = ?, code = ?, grade = ?, section = ?, teacher_id = ?, status = ? WHERE id = ? AND institution_id = ?`,
      [name, code, grade, section || 'A', teacher_id || null, status || 'active', id, instId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error updating course' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'Sin institucion' }, { status: 400 })

    const { id } = await params

    const [existing] = await pool.query(
      'SELECT id FROM courses WHERE id = ? AND institution_id = ?',
      [id, instId]
    ) as any[]
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
    }

    await pool.query(`DELETE FROM courses WHERE id = ? AND institution_id = ?`, [id, instId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting course' }, { status: 500 })
  }
}
