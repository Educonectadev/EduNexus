import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
import { resolveTeacherId, resolveGrade, validateCourseFields } from '../_teacher-id'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { name, code, grade, section, teacher_id, status } = body

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }
    if (!grade || !String(grade).trim()) {
      return NextResponse.json({ error: 'El grado es requerido' }, { status: 400 })
    }

    const tooLong = validateCourseFields({ name, code, grade, section })
    if (tooLong) {
      return NextResponse.json({ error: tooLong }, { status: 400 })
    }

    const gradeResolution = await resolveGrade(instId, grade)
    if (gradeResolution.error) {
      return NextResponse.json({ error: gradeResolution.error }, { status: 400 })
    }
    const gradeLength = validateCourseFields({ name, code, grade: gradeResolution.grade, section })
    if (gradeLength) {
      return NextResponse.json({ error: gradeLength }, { status: 400 })
    }

    const teacher = await resolveTeacherId(instId, teacher_id)
    if (teacher.error) {
      return NextResponse.json({ error: teacher.error }, { status: 400 })
    }

    let finalCode = typeof code === 'string' ? code.trim() : ''
    if (!finalCode) {
      const [existing] = await pool.query(
        `SELECT code FROM courses WHERE id = ? AND institution_id = ?`,
        [id, instId]
      )
      finalCode = ((existing as any[])[0]?.code || '').trim()
      if (!finalCode) return NextResponse.json({ error: 'El código es requerido' }, { status: 400 })
    }

    await pool.query(
      `UPDATE courses SET name = ?, code = ?, grade = ?, section = ?, teacher_id = ?, status = ? WHERE id = ? AND institution_id = ?`,
      [name, finalCode, gradeResolution.grade, section || 'A', teacher.teacherId, status || 'active', id, instId]
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
