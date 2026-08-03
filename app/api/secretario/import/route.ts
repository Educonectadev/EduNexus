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
        upgrade_required: true 
      }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })

    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) return NextResponse.json({ error: 'Archivo vacío o sin datos' }, { status: 400 })

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const nameIdx = headers.findIndex(h => h.includes('nombre') || h === 'name' || h.includes('alumno'))
    const dniIdx = headers.findIndex(h => h.includes('dni') || h.includes('documento'))
    const gradeIdx = headers.findIndex(h => h.includes('grado') || h.includes('grade'))
    const sectionIdx = headers.findIndex(h => h.includes('sección') || h.includes('seccion') || h.includes('section'))

    if (nameIdx === -1) return NextResponse.json({ error: 'El archivo debe tener una columna "nombre" o "alumno"' }, { status: 400 })

    const BATCH_SIZE = 100
    const created: number[] = []
    const errors: string[] = []

    // First, fetch all existing DNIs for this institution in one query
    const [existingStudents] = await pool.query(
      `SELECT document_number FROM students WHERE institution_id = ? AND document_number IS NOT NULL AND document_number != ''`,
      [instId]
    ) as any[]
    const existingDnis = new Set(existingStudents.map((s: any) => s.document_number))

    // Parse all rows
    const rows: Array<{ name: string; dni: string; grade: string; section: string; lineNum: number }> = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim())
      const name = cols[nameIdx] || ''
      const dni = dniIdx >= 0 ? cols[dniIdx] || '' : ''
      const grade = gradeIdx >= 0 ? cols[gradeIdx] || '' : ''
      const section = sectionIdx >= 0 ? cols[sectionIdx] || '' : ''

      if (!name) { errors.push(`Línea ${i + 1}: nombre vacío`); continue }

      if (dni && existingDnis.has(dni)) {
        errors.push(`Línea ${i + 1}: DNI ${dni} ya existe`)
        continue
      }

      rows.push({ name, dni, grade, section, lineNum: i + 1 })
    }

    // Batch insert
    for (let batch = 0; batch < rows.length; batch += BATCH_SIZE) {
      const chunk = rows.slice(batch, batch + BATCH_SIZE)
      if (chunk.length === 0) continue

      const values: any[][] = []
      for (const row of chunk) {
        const nameParts = row.name.split(' ')
        const firstName = nameParts.slice(0, Math.ceil(nameParts.length / 2)).join(' ')
        const lastName = nameParts.slice(Math.ceil(nameParts.length / 2)).join(' ')
        const id = crypto.randomUUID()
        const code = `ALU${String(Date.now()).slice(-6)}${batch + values.length}`

        values.push([id, instId, firstName || row.name, lastName || '', row.dni || '', row.grade || '', row.section || '', code])
      }

      const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ')
      const flatValues = values.flat()

      try {
        await pool.query(
          `INSERT INTO students (id, institution_id, first_name, last_name, document_number, grade, section, code, status)
           VALUES ${placeholders}`,
          [...flatValues]
        )
        // Mark all as created
        for (let j = 0; j < chunk.length; j++) {
          created.push(chunk[j].lineNum)
        }
      } catch (e: any) {
        errors.push(`Lote ${Math.floor(batch / BATCH_SIZE) + 1}: ${e.message || 'error'}`)
      }
    }

    return NextResponse.json({ created: created.length, errors })
  } catch (error) {
    return NextResponse.json({ error: 'Error procesando archivo' }, { status: 500 })
  }
}
