import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload, resolveInstId } from '@/lib/resolveInstId'
import { checkPlanFeature } from '@/lib/checkPlanLimit'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

function generatePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let pass = ''
  for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)]
  return pass
}

function generateEmail(name: string): string {
  const parts = name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
  const first = parts[0] || 'docente'
  const last = parts[parts.length - 1] || ''
  return `doc.${first}.${last}@iep.edu.pe`
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    if (user.role !== 'secretario' && user.role !== 'director' && user.role !== 'dev' && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const institutionId = await resolveInstId(request)
    if (!institutionId) return NextResponse.json({ error: 'Institución requerida' }, { status: 400 })

    const allowed = await checkPlanFeature(institutionId, 'can_bulk_import')
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
    const nameIdx = headers.findIndex(h => h.includes('nombre') || h === 'name')
    const dniIdx = headers.findIndex(h => h.includes('dni') || h.includes('documento'))
    const phoneIdx = headers.findIndex(h => h.includes('teléfono') || h.includes('telefono') || h.includes('phone'))
    const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('correo'))
    const subjectIdx = headers.findIndex(h => h.includes('especialidad') || h.includes('asignatura') || h.includes('subject'))
    const levelIdx = headers.findIndex(h => h.includes('nivel') || h.includes('level'))
    const contractIdx = headers.findIndex(h => h.includes('contrato') || h.includes('contract'))
    const statusIdx = headers.findIndex(h => h.includes('estado') || h.includes('status'))

    if (nameIdx === -1) return NextResponse.json({ error: 'El archivo debe tener una columna "nombre"' }, { status: 400 })

    const [existingUsers] = await pool.query(
      `SELECT dni FROM users WHERE institution_id = ? AND dni IS NOT NULL AND dni != ''`,
      [institutionId]
    ) as any[]
    const existingDnis = new Set(existingUsers.map((u: any) => u.dni))

    const [existingEmails] = await pool.query(
      `SELECT email FROM users WHERE institution_id = ? AND email IS NOT NULL AND email != ''`,
      [institutionId]
    ) as any[]
    const existingEmailSet = new Set(existingEmails.map((u: any) => u.email))

    const BATCH_SIZE = 50
    const created: number[] = []
    const skipped: number[] = []
    const errors: string[] = []
    const credentials: Array<{ name: string; email: string; password: string }> = []

    const rows: Array<{
      name: string; dni: string; phone: string; email: string;
      subject: string; level: string; contract: string; status: string;
      lineNum: number
    }> = []

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim())
      const name = cols[nameIdx] || ''
      if (!name) { errors.push(`Línea ${i + 1}: nombre vacío`); continue }

      const dni = dniIdx >= 0 ? cols[dniIdx] || '' : ''
      if (dni && existingDnis.has(dni)) { skipped.push(i + 1); continue }

      rows.push({
        name,
        dni,
        phone: phoneIdx >= 0 ? cols[phoneIdx] || '' : '',
        email: emailIdx >= 0 ? cols[emailIdx] || '' : '',
        subject: subjectIdx >= 0 ? cols[subjectIdx] || '' : '',
        level: levelIdx >= 0 ? cols[levelIdx] || '' : '',
        contract: contractIdx >= 0 ? cols[contractIdx] || '' : '',
        status: statusIdx >= 0 ? cols[statusIdx] || 'active' : 'active',
        lineNum: i + 1,
      })
    }

    for (let batch = 0; batch < rows.length; batch += BATCH_SIZE) {
      const chunk = rows.slice(batch, batch + BATCH_SIZE)
      if (chunk.length === 0) continue

      const values: any[][] = []
      for (const row of chunk) {
        const id = crypto.randomUUID()
        const email = row.email || generateEmail(row.name)
        const password = generatePassword()
        const hashedPassword = await bcrypt.hash(password, 10)

        if (existingEmailSet.has(email)) {
          errors.push(`Línea ${row.lineNum}: email ${email} ya existe`)
          continue
        }

        values.push([
          id, email, row.name, hashedPassword, 'docente',
          institutionId, row.dni, row.phone, row.subject,
          row.level, row.contract || '', row.status || 'active'
        ])
        credentials.push({ name: row.name, email, password })
        existingEmailSet.add(email)
      }

      if (values.length === 0) continue

      const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')
      const flatValues = values.flat()

      try {
        await pool.query(
          `INSERT INTO users (id, email, full_name, password_hash, role, institution_id, dni, phone, subject, grade_level, contract_type, status)
           VALUES ${placeholders}`,
          flatValues
        )
        for (const row of chunk) created.push(row.lineNum)
      } catch (e: any) {
        errors.push(`Lote ${Math.floor(batch / BATCH_SIZE) + 1}: ${e.message || 'error'}`)
      }
    }

    return NextResponse.json({ created: created.length, skipped: skipped.length, errors, credentials })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Error procesando archivo' }, { status: 500 })
  }
}