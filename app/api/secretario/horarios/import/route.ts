import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
import { checkPlanFeature } from '@/lib/checkPlanLimit'
import crypto from 'crypto'

const DAY_MAP: Record<string, number> = {
  lunes: 1, lun: 1, '1': 1,
  martes: 2, mar: 2, '2': 2,
  miercoles: 3, miércoles: 3, mie: 3, mié: 3, '3': 3,
  jueves: 4, jue: 4, '4': 4,
  viernes: 5, vie: 5, '5': 5,
}

function parseDay(raw: string): number | null {
  const key = raw.trim().toLowerCase()
  if (DAY_MAP[key] !== undefined) return DAY_MAP[key]
  const n = parseInt(raw, 10)
  return n >= 1 && n <= 5 ? n : null
}

function parseTime(raw: string): string | null {
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  const hh = parseInt(m[1], 10)
  const mm = parseInt(m[2], 10)
  if (hh > 23 || mm > 59) return null
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim()

export async function POST(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const allowed = await checkPlanFeature(instId, 'can_bulk_import')
    if (!allowed) {
      return NextResponse.json({
        error: 'Importación masiva no disponible en tu plan',
        upgrade_required: true,
      }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })

    const tipo = formData.get('tipo') === 'docentes' ? 'docentes' : 'alumnos'

    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) return NextResponse.json({ error: 'Archivo vacío o sin datos' }, { status: 400 })

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

    let courseIdx = -1, dayIdx = -1, startIdx = -1, endIdx = -1, classroomIdx = -1, teacherIdx = -1
    const mappingRaw = formData.get('mapping')
    if (mappingRaw) {
      try {
        const m = JSON.parse(String(mappingRaw))
        courseIdx = typeof m.course === 'number' ? m.course : -1
        dayIdx = typeof m.day === 'number' ? m.day : -1
        startIdx = typeof m.start === 'number' ? m.start : -1
        endIdx = typeof m.end === 'number' ? m.end : -1
        classroomIdx = typeof m.classroom === 'number' ? m.classroom : -1
        teacherIdx = typeof m.teacher === 'number' ? m.teacher : -1
      } catch { /* fall back a detección */ }
    }
    if (courseIdx === -1) courseIdx = headers.findIndex(h => h.includes('curso') || h.includes('código') || h.includes('codigo') || h === 'code' || h.includes('materia'))
    if (dayIdx === -1) dayIdx = headers.findIndex(h => h.includes('día') || h.includes('dia') || h === 'day')
    if (startIdx === -1) startIdx = headers.findIndex(h => h.includes('inicio') || h.includes('hora ini') || h.includes('desde') || h === 'start')
    if (endIdx === -1) endIdx = headers.findIndex(h => h.includes('fin') || h.includes('hasta') || h === 'end')
    if (classroomIdx === -1) classroomIdx = headers.findIndex(h => h.includes('salón') || h.includes('salon') || h.includes('aula') || h.includes('classroom'))
    if (tipo === 'docentes' && teacherIdx === -1) teacherIdx = headers.findIndex(h => h.includes('docente') || h.includes('profesor') || h.includes('teacher'))

    if (courseIdx === -1) return NextResponse.json({ error: 'El archivo debe tener una columna "curso" o "código"' }, { status: 400 })
    if (dayIdx === -1) return NextResponse.json({ error: 'El archivo debe tener una columna "día"' }, { status: 400 })
    if (startIdx === -1 || endIdx === -1) return NextResponse.json({ error: 'El archivo debe tener columnas de hora de inicio y fin' }, { status: 400 })
    if (tipo === 'docentes' && teacherIdx === -1) return NextResponse.json({ error: 'El archivo de docentes debe tener una columna "docente"' }, { status: 400 })

    // Cursos por código de esta institución
    const [courses] = await pool.query(
      `SELECT id, code FROM courses WHERE institution_id = ?`,
      [instId]
    ) as any[]
    const courseByCode = new Map<string, string>()
    for (const c of courses as any[]) courseByCode.set(c.code.trim().toLowerCase(), c.id)

    // Docentes (teachers) para resolver por nombre
    let teacherByName = new Map<string, string>()
    if (tipo === 'docentes') {
      const [teachers] = await pool.query(
        `SELECT t.id, t.first_name, t.last_name, t.user_id, u.full_name
         FROM teachers t
         LEFT JOIN users u ON t.user_id = u.id
         WHERE t.institution_id = ?`,
        [instId]
      ) as any[]
      for (const t of teachers as any[]) {
        if (t.full_name) teacherByName.set(norm(String(t.full_name)), t.id)
        if (t.first_name && t.last_name) teacherByName.set(norm(`${t.first_name} ${t.last_name}`), t.id)
        else if (t.first_name) teacherByName.set(norm(String(t.first_name)), t.id)
      }
    }

    // Horarios existentes para evitar duplicados exactos
    const [existing] = await pool.query(
      `SELECT course_id, day_of_week, start_time, end_time FROM horarios WHERE institution_id = ? AND status = 'active'`,
      [instId]
    ) as any[]
    const existingKeys = new Set((existing as any[]).map((h: any) =>
      `${h.course_id}|${h.day_of_week}|${String(h.start_time).slice(0, 5)}|${String(h.end_time).slice(0, 5)}`
    ))

    const BATCH_SIZE = 100
    const created: number[] = []
    const errors: string[] = []
    const teacherAssignments = new Map<string, string>()

    const rows: Array<{ courseId: string; day: number; start: string; end: string; classroom: string | null; lineNum: number }> = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim())
      const code = cols[courseIdx] || ''
      const day = parseDay(cols[dayIdx] || '')
      const start = parseTime(cols[startIdx] || '')
      const end = parseTime(cols[endIdx] || '')
      const classroom = classroomIdx >= 0 ? cols[classroomIdx] || '' : ''

      if (!code) { errors.push(`Línea ${i + 1}: código de curso vacío`); continue }
      if (day === null) { errors.push(`Línea ${i + 1}: día "${cols[dayIdx] || ''}" no válido (usa Lunes-Viernes o 1-5)`); continue }
      if (!start) { errors.push(`Línea ${i + 1}: hora de inicio "${cols[startIdx] || ''}" no válida`); continue }
      if (!end) { errors.push(`Línea ${i + 1}: hora de fin "${cols[endIdx] || ''}" no válida`); continue }
      if (start >= end) { errors.push(`Línea ${i + 1}: la hora de inicio debe ser menor que la de fin`); continue }

      let teacherId: string | null = null
      if (tipo === 'docentes') {
        const teacherName = cols[teacherIdx] || ''
        if (!teacherName) { errors.push(`Línea ${i + 1}: nombre del docente vacío`); continue }
        teacherId = teacherByName.get(norm(teacherName)) || null
        if (!teacherId) { errors.push(`Línea ${i + 1}: docente "${teacherName}" no encontrado (agrégalo en Personal o el Director)`); continue }
      }

      const courseId = courseByCode.get(code.trim().toLowerCase())
      if (!courseId) { errors.push(`Línea ${i + 1}: curso "${code}" no encontrado (importa los cursos primero)`); continue }

      if (teacherId) teacherAssignments.set(courseId, teacherId)

      const key = `${courseId}|${day}|${start.slice(0, 5)}|${end.slice(0, 5)}`
      if (existingKeys.has(key)) {
        errors.push(`Línea ${i + 1}: el horario del curso ${code} (${day} ${start.slice(0, 5)}-${end.slice(0, 5)}) ya existe`)
        continue
      }

      existingKeys.add(key)
      rows.push({ courseId, day, start, end, classroom: classroom || null, lineNum: i + 1 })
    }

    for (let batch = 0; batch < rows.length; batch += BATCH_SIZE) {
      const chunk = rows.slice(batch, batch + BATCH_SIZE)
      if (chunk.length === 0) continue

      const values: any[][] = chunk.map(row => [
        crypto.randomUUID(),
        instId,
        row.courseId,
        row.day,
        row.start,
        row.end,
        row.classroom,
      ])
      const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ')

      try {
        await pool.query(
          `INSERT INTO horarios (id, institution_id, course_id, day_of_week, start_time, end_time, classroom)
           VALUES ${placeholders}`,
          values.flat()
        )
        for (const row of chunk) created.push(row.lineNum)
      } catch (e: any) {
        errors.push(`Lote ${Math.floor(batch / BATCH_SIZE) + 1}: ${e.message || 'error'}`)
      }
    }

    if (teacherAssignments.size > 0) {
      for (const [courseId, teacherId] of teacherAssignments) {
        await pool.query(
          `UPDATE courses SET teacher_id = ? WHERE id = ? AND institution_id = ?`,
          [teacherId, courseId, instId]
        )
      }
    }

    return NextResponse.json({ created: created.length, errors })
  } catch (error) {
    return NextResponse.json({ error: 'Error procesando archivo' }, { status: 500 })
  }
}
