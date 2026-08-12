import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
import crypto from 'crypto'

// ============================================================
// Vacantes por grado + sección + año (capacidad editable por el secretario).
// El número de ocupados se calcula en tiempo real desde enrollments activos.
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10)

    const [grades] = await pool.query(
      `SELECT id, name, level, year_number FROM academic_grades
       WHERE institution_id = ? AND is_active = true ORDER BY sort_order ASC`,
      [instId]
    ).catch(() => [] as any[]) as any[]

    const [sections] = await pool.query(
      `SELECT id, name FROM academic_sections
       WHERE institution_id = ? AND is_active = true ORDER BY sort_order ASC`,
      [instId]
    ).catch(() => [] as any[]) as any[]

    const [occupiedRows] = await pool.query(
      `SELECT grade, section, COUNT(*)::int AS occupied
       FROM enrollments
       WHERE institution_id = ? AND year = ? AND status = 'active'
       GROUP BY grade, section`,
      [instId, year]
    ).catch(() => [] as any[]) as any[]

    const [studentRows] = await pool.query(
      `SELECT e.grade, e.section, s.full_name, s.dni, s.code, s.student_code
       FROM enrollments e
       JOIN students s ON e.student_id = s.id
       WHERE e.institution_id = ? AND e.year = ? AND e.status = 'active'
       ORDER BY s.full_name ASC`,
      [instId, year]
    ).catch(() => [] as any[]) as any[]

    const [capacityRows] = await pool.query(
      `SELECT id, grade, section, capacity FROM grade_section_vacancies
       WHERE institution_id = ? AND year = ?`,
      [instId, year]
    ).catch(() => [] as any[]) as any[]

    const occupiedMap: Record<string, number> = {}
    for (const r of (occupiedRows || []) as any[]) {
      occupiedMap[`${r.grade}__${r.section || 'A'}`] = Number(r.occupied) || 0
    }

    const studentsMap: Record<string, any[]> = {}
    for (const r of (studentRows || []) as any[]) {
      const key = `${r.grade}__${r.section || 'A'}`
      if (!studentsMap[key]) studentsMap[key] = []
      studentsMap[key].push({
        name: r.full_name || `${r.dni || ''}`.trim(),
        dni: r.dni || null,
        code: r.code || r.student_code || null,
      })
    }

    const capacityMap: Record<string, number> = {}
    const capIdMap: Record<string, string> = {}
    for (const r of (capacityRows || []) as any[]) {
      capacityMap[`${r.grade}__${r.section || 'A'}`] = Number(r.capacity) || 0
      capIdMap[`${r.grade}__${r.section || 'A'}`] = r.id
    }

    // Matriz grado x sección
    const matrix = (grades || []).map((g: any) => ({
      grade: g.name,
      level: g.level || '',
      sections: (sections || []).map((s: any) => {
        const key = `${g.name}__${s.name}`
        const capacity = capacityMap[key] ?? null
        const occupied = occupiedMap[key] || 0
        return {
          id: capIdMap[key] || null,
          section: s.name,
          capacity,
          occupied,
          available: capacity == null ? null : Math.max(0, capacity - occupied),
          students: studentsMap[key] || [],
        }
      }),
    }))

    return NextResponse.json({ year, grades: matrix })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error fetching vacancies', details: error?.message }, { status: 500 })
  }
}

// Upsert de capacidad para un grado+sección+año
export async function POST(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await request.json()
    const { grade, section, year, capacity } = body

    if (!grade?.trim()) return NextResponse.json({ error: 'Grado requerido' }, { status: 400 })
    const sec = section?.trim() || 'A'
    const yr = parseInt(year, 10) || new Date().getFullYear()
    const cap = parseInt(capacity, 10)

    if (isNaN(cap) || cap < 0) return NextResponse.json({ error: 'Capacidad inválida' }, { status: 400 })

    const [existing] = await pool.query(
      `SELECT id FROM grade_section_vacancies WHERE institution_id = ? AND grade = ? AND section = ? AND year = ?`,
      [instId, grade.trim(), sec, yr]
    ) as any[]

    if ((existing as any[]).length > 0) {
      await pool.query(
        `UPDATE grade_section_vacancies SET capacity = ?, updated_at = NOW() WHERE id = ?`,
        [cap, (existing as any[])[0].id]
      )
      return NextResponse.json({ success: true, id: (existing as any[])[0].id })
    }

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO grade_section_vacancies (id, institution_id, grade, section, year, capacity)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, instId, grade.trim(), sec, yr, cap]
    )

    return NextResponse.json({ success: true, id })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error saving vacancy', details: error?.message }, { status: 500 })
  }
}

// Elimina la configuración de capacidad (vuelve a "sin límite definido")
export async function DELETE(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    await pool.query(`DELETE FROM grade_section_vacancies WHERE id = ? AND institution_id = ?`, [id, instId])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error deleting vacancy', details: error?.message }, { status: 500 })
  }
}