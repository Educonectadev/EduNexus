import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
import crypto from 'crypto'
import { notifyUsers, resolveCourseTeacherUser, getCourseName } from '@/lib/notify'

// ============================================================
// Sustitución TEMPORAL de docentes por curso y fecha.
// El docente original del curso (courses.teacher_id / horarios)
// NO se toca: se registra quién lo sustituyó en una fecha concreta.
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10)

    const [rows] = await pool.query(
      `SELECT s.id, s.course_id, s.date, s.original_teacher_id, s.substitute_teacher_id,
              s.notes, s.status, s.created_at,
              c.name AS course_name, c.grade, c.section,
              orig.full_name AS original_teacher_name,
              sub.full_name AS substitute_teacher_name
       FROM teacher_substitutions s
       JOIN courses c ON s.course_id = c.id
       LEFT JOIN users orig ON orig.id = s.original_teacher_id
       LEFT JOIN users sub ON sub.id = s.substitute_teacher_id
       WHERE s.institution_id = ? AND s.date = ?
       ORDER BY s.created_at DESC`,
      [instId, date]
    ).catch(() => [] as any[]) as any[]

    return NextResponse.json({ date, substitutions: rows || [] })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error fetching substitutions', details: error?.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await request.json()
    const { course_id, date, substitute_teacher_id, notes } = body

    if (!course_id || !date) {
      return NextResponse.json({ error: 'Curso y fecha son requeridos' }, { status: 400 })
    }
    if (!substitute_teacher_id) {
      return NextResponse.json({ error: 'Selecciona el docente que sustituye' }, { status: 400 })
    }

    // El docente original NO se toca; se guarda solo para referencia
    const originalTeacherId = await resolveCourseTeacherUser(course_id)

    // Verificar que el sustituto es un docente activo de esta institución
    const [subCheck] = await pool.query(
      `SELECT id FROM users WHERE id = ? AND institution_id = ? AND role = 'docente' AND status = 'active'`,
      [substitute_teacher_id, instId]
    ) as any[]
    if ((subCheck as any[]).length === 0) {
      return NextResponse.json({ error: 'El docente sustituto no es válido' }, { status: 400 })
    }

    // No permitir que el sustituto sea el mismo docente original
    if (originalTeacherId === substitute_teacher_id) {
      return NextResponse.json({ error: 'El docente original no puede sustituirse a sí mismo' }, { status: 400 })
    }

    // Un curso solo tiene una sustitución por fecha (upsert)
    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO teacher_substitutions
         (id, institution_id, course_id, date, original_teacher_id, substitute_teacher_id, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
       ON CONFLICT (course_id, date) DO UPDATE
         SET substitute_teacher_id = EXCLUDED.substitute_teacher_id,
             original_teacher_id = EXCLUDED.original_teacher_id,
             notes = EXCLUDED.notes,
             status = 'active',
             updated_at = NOW()`,
      [id, instId, course_id, date, originalTeacherId, substitute_teacher_id, notes || '']
    )

    // Notificar al sustituto
    try {
      const courseName = await getCourseName(course_id)
      notifyUsers(
        instId,
        [substitute_teacher_id],
        'Sustitución asignada',
        `Fuiste asignado para sustituir en "${courseName}" el día ${date}.`,
        'schedule', 'horarios', 'alta'
      )
    } catch { /* noop */ }

    return NextResponse.json({ success: true, id })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error creating substitution', details: error?.message }, { status: 500 })
  }
}

// Cancelar una sustitución (no la borra, solo la marca cancelled)
export async function DELETE(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    await pool.query(
      `UPDATE teacher_substitutions SET status = 'cancelled', updated_at = NOW()
       WHERE id = ? AND institution_id = ?`,
      [id, instId]
    )
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error cancelling substitution', details: error?.message }, { status: 500 })
  }
}