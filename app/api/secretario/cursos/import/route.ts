import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
import { checkPlanFeature } from '@/lib/checkPlanLimit'
import crypto from 'crypto'

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

    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) return NextResponse.json({ error: 'Archivo vacío o sin datos' }, { status: 400 })

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

    // Columna por columna: primero el mapeo del cliente (si viene), si no detección por encabezado
    let nameIdx = -1, codeIdx = -1, gradeIdx = -1, sectionIdx = -1, teacherIdx = -1
    const mappingRaw = formData.get('mapping')
    if (mappingRaw) {
      try {
        const m = JSON.parse(String(mappingRaw))
        nameIdx = typeof m.name === 'number' ? m.name : -1
        codeIdx = typeof m.code === 'number' ? m.code : -1
        gradeIdx = typeof m.grade === 'number' ? m.grade : -1
        sectionIdx = typeof m.section === 'number' ? m.section : -1
        teacherIdx = typeof m.teacher === 'number' ? m.teacher : -1
      } catch { /* fall back a detección */ }
    }
    if (nameIdx === -1) nameIdx = headers.findIndex(h => h.includes('nombre') || h === 'name' || h.includes('curso'))
    if (codeIdx === -1) codeIdx = headers.findIndex(h => h.includes('código') || h.includes('codigo') || h === 'code')
    if (gradeIdx === -1) gradeIdx = headers.findIndex(h => h.includes('grado') || h === 'grade')
    if (sectionIdx === -1) sectionIdx = headers.findIndex(h => h.includes('sección') || h.includes('seccion') || h === 'section')
    if (teacherIdx === -1) teacherIdx = headers.findIndex(h => h.includes('profesor') || h.includes('docente') || h.includes('teacher'))

    if (nameIdx === -1) return NextResponse.json({ error: 'El archivo debe tener una columna "nombre" o "curso"' }, { status: 400 })
    if (codeIdx === -1) return NextResponse.json({ error: 'El archivo debe tener una columna "código"' }, { status: 400 })
    if (gradeIdx === -1) return NextResponse.json({ error: 'El archivo debe tener una columna "grado"' }, { status: 400 })

    // Existing course codes for this institution
    const [existingCourses] = await pool.query(
      `SELECT code FROM courses WHERE institution_id = ?`,
      [instId]
    ) as any[]
    const existingCodes = new Set(existingCourses.map((c: any) => c.code))

    // Profesores existentes (tabla teachers, referenciada por courses.teacher_id)
    const [teachers] = await pool.query(
      `SELECT id, user_id, first_name, last_name, email FROM teachers WHERE institution_id = ?`,
      [instId]
    ) as any[]
    const teacherByName = new Map<string, string>()
    const teacherByEmail = new Map<string, string>()
    const teacherByUser = new Map<string, string>()
    for (const t of teachers as any[]) {
      const full = [t.first_name, t.last_name].filter(Boolean).join(' ').trim()
      if (full) teacherByName.set(full.toLowerCase(), t.id)
      if (t.email) teacherByEmail.set(t.email.trim().toLowerCase(), t.id)
      if (t.user_id) teacherByUser.set(t.user_id, t.id)
    }

    // Docentes de la institución (users), para vincular un profesor nuevo si no existe en teachers
    const [docentes] = await pool.query(
      `SELECT id, full_name, email FROM users WHERE institution_id = ? AND role = 'docente'`,
      [instId]
    ) as any[]
    const docenteByName = new Map<string, any>()
    const docenteByEmail = new Map<string, any>()
    for (const d of docentes as any[]) {
      if (d.full_name) docenteByName.set(d.full_name.trim().toLowerCase(), d)
      if (d.email) docenteByEmail.set(d.email.trim().toLowerCase(), d)
    }

    const ensureTeacher = async (ref: string): Promise<string | null> => {
      const key = ref.trim().toLowerCase()
      let teacherId = teacherByName.get(key) || teacherByEmail.get(key) || null
      if (teacherId) return teacherId

      const doc = docenteByName.get(key) || docenteByEmail.get(key)
      if (!doc) return null

      if (teacherByUser.has(doc.id)) return teacherByUser.get(doc.id)!

      teacherId = crypto.randomUUID()
      const nameParts = (doc.full_name || '').split(' ')
      const firstName = nameParts.slice(0, Math.ceil(nameParts.length / 2)).join(' ') || ref.trim()
      const lastName = nameParts.slice(Math.ceil(nameParts.length / 2)).join(' ')
      const code = `DOC-${String(Date.now()).slice(-5)}${teacherId.slice(0, 3).toUpperCase()}`
      await pool.query(
        `INSERT INTO teachers (id, user_id, institution_id, code, first_name, last_name, email, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
        [teacherId, doc.id, instId, code, firstName, lastName, doc.email || null]
      )
      teacherByUser.set(doc.id, teacherId)
      return teacherId
    }

    const BATCH_SIZE = 100
    const created: number[] = []
    const errors: string[] = []

    const rows: Array<{ name: string; code: string; grade: string; section: string; teacherId: string | null; lineNum: number }> = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim())
      const name = cols[nameIdx] || ''
      const code = cols[codeIdx] || ''
      const grade = cols[gradeIdx] || ''
      const section = cols[sectionIdx] || ''
      const teacherRef = teacherIdx >= 0 ? cols[teacherIdx] || '' : ''

      if (!name) { errors.push(`Línea ${i + 1}: nombre vacío`); continue }
      if (!code) { errors.push(`Línea ${i + 1}: código vacío`); continue }
      if (!grade) { errors.push(`Línea ${i + 1}: grado vacío`); continue }

      if (existingCodes.has(code)) {
        errors.push(`Línea ${i + 1}: el código ${code} ya existe`)
        continue
      }

      let teacherId: string | null = null
      if (teacherRef) {
        teacherId = await ensureTeacher(teacherRef)
        if (!teacherId) {
          errors.push(`Línea ${i + 1}: docente "${teacherRef}" no encontrado en la institución`)
          continue
        }
      }

      existingCodes.add(code)
      rows.push({ name, code, grade, section, teacherId, lineNum: i + 1 })
    }

    for (let batch = 0; batch < rows.length; batch += BATCH_SIZE) {
      const chunk = rows.slice(batch, batch + BATCH_SIZE)
      if (chunk.length === 0) continue

      const values: any[][] = chunk.map(row => [
        crypto.randomUUID(),
        instId,
        row.name,
        row.code,
        row.grade,
        row.section || 'A',
        row.teacherId,
      ])
      const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ')

      try {
        await pool.query(
          `INSERT INTO courses (id, institution_id, name, code, grade, section, teacher_id)
           VALUES ${placeholders}`,
          values.flat()
        )
        for (const row of chunk) created.push(row.lineNum)
      } catch (e: any) {
        errors.push(`Lote ${Math.floor(batch / BATCH_SIZE) + 1}: ${e.message || 'error'}`)
      }
    }

    return NextResponse.json({ created: created.length, errors })
  } catch (error) {
    return NextResponse.json({ error: 'Error procesando archivo' }, { status: 500 })
  }
}
