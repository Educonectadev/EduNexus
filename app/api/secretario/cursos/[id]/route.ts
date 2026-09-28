import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
import { normalizeTeacherId, validateCourseFields } from '../_teacher-id'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { name, code, grade, section, teacher_id, status } = body

    const tooLong = validateCourseFields({ name, code, grade, section })
    if (tooLong) {
      return NextResponse.json({ error: tooLong }, { status: 400 })
    }

    const teacherId = await normalizeTeacherId(instId, teacher_id)
    await pool.query(
      `UPDATE courses SET name = ?, code = ?, grade = ?, section = ?, teacher_id = ?, status = ? WHERE id = ? AND institution_id = ?`,
      [name, code, grade, section || 'A', teacherId, status || 'active', id, instId]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[cursos] PUT error:', error?.message || error)
    return NextResponse.json({ error: 'Error updating curso', details: error?.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await params
    await pool.query(`DELETE FROM courses WHERE id = ? AND institution_id = ?`, [id, instId])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[cursos] DELETE error:', error?.message || error)
    return NextResponse.json({ error: 'Error deleting curso', details: error?.message }, { status: 500 })
  }
}
