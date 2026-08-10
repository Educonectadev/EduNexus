import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
import { checkPlanFeature } from '@/lib/checkPlanLimit'
import { notifyParentsOfStudents } from '@/lib/notify'

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

    try {
      const [gRows] = await pool.query(
        `SELECT student_id, course_id, period FROM grades WHERE id = ? AND institution_id = ?`,
        [id, instId]
      ) as any[]
      const g = (gRows as any[])[0]
      if (g?.student_id) {
        const [info] = await pool.query(
          `SELECT CONCAT(s.first_name, ' ', s.last_name) AS student_name, c.name AS course_name
           FROM students s, courses c
           WHERE s.id = ? AND c.id = ?`,
          [g.student_id, g.course_id]
        ) as any[]
        const row = (info as any[])[0]
        notifyParentsOfStudents(
          instId,
          [g.student_id],
          'Nota actualizada',
          `Se actualizó la nota de ${row?.student_name || 'tu hijo(a)'} en ${row?.course_name || 'el curso'}: ${Number(score)}/${Number(max_score || 20)}.`,
          'grade', 'notas', 'media'
        )
      }
    } catch { /* el aviso es opcional */ }

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
