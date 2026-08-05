import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId, getAuthPayload } from '@/lib/resolveInstId'
import { logAudit } from '@/lib/audit'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({error: 'No autenticado'}, { status: 401 })

    const { id } = await params
    const [parents] = await pool.query(
      `SELECT * FROM parents WHERE id = ? AND institution_id = ?`,
      [id, instId]
    )
    const parent = (parents as any[])[0]
    if (!parent) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    const [links] = await pool.query(
      `SELECT ps.*, s.first_name, s.last_name, s.grade, s.section, s.document_number
       FROM parent_student ps
       LEFT JOIN students s ON ps.student_id = s.id
       WHERE ps.parent_id = ?`,
      [id]
    )

    return NextResponse.json({ ...parent, linked_students: links })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error fetching parent' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({error: 'No autenticado'}, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { first_name, last_name, document_type, document_number, email, phone, address, occupation, status, password } = body

    await pool.query(
      `UPDATE parents SET first_name=?, last_name=?, document_type=?, document_number=?, email=?, phone=?, address=?, occupation=?, status=?
       WHERE id=? AND institution_id=?`,
      [first_name, last_name, document_type, document_number, email || null, phone || null, address || null, occupation || null, status || 'active', id, instId]
    )

    // Resetear contraseña del padre si se proporcionó una nueva
    if (password && password.trim()) {
      const hashedPassword = await bcrypt.hash(password.trim(), 10)
      const [colRows] = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1`,
        ['users']
      ) as any[]
      const colNames = (colRows || []).map((c: any) => c.column_name)
      const updates: string[] = []
      const vals: any[] = []
      if (colNames.includes('password')) { updates.push('password = ?'); vals.push(password.trim()) }
      if (colNames.includes('password_hash')) { updates.push('password_hash = ?'); vals.push(hashedPassword) }
      if (updates.length > 0) {
        vals.push(email, instId)
        await pool.query(
          `UPDATE users SET ${updates.join(', ')} WHERE email = ? AND institution_id = ? AND role = 'padre'`,
          vals
        )
      }
    }

    const authUser = await getAuthPayload(request)
    logAudit({
      userId: (authUser?.userId as string) || '',
      institutionId: instId || '',
      action: 'update',
      entity: 'parent',
      entityId: id,
      details: { first_name, last_name, document_number },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Ya existe un padre con ese DNI' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error updating parent' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({error: 'No autenticado'}, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { action, password } = body

    if (action === 'create_account') {
      const [parents] = await pool.query(
        `SELECT * FROM parents WHERE id = ? AND institution_id = ?`,
        [id, instId]
      ) as any[]
      const parent = parents[0]
      if (!parent) return NextResponse.json({ error: 'Padre no encontrado' }, { status: 404 })

      const [existing] = await pool.query(
        `SELECT id FROM users WHERE email = ? AND institution_id = ? AND role = 'padre'`,
        [parent.email, instId]
      ) as any[]
      if (existing && existing.length > 0) {
        return NextResponse.json({ error: 'Este padre ya tiene cuenta de usuario' }, { status: 409 })
      }

      const crypto = await import('crypto')
      const userId = crypto.randomUUID()
      const generatedPassword = password?.trim() || `padre-${Math.random().toString(36).slice(2,6)}-${Math.random().toString(36).slice(2,6)}`
      const hashedPassword = await bcrypt.hash(generatedPassword, 10)
      const fullName = `${parent.first_name} ${parent.last_name}`.trim()

      const [colRows] = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1`,
        ['users']
      ) as any[]
      const colNames = (colRows || []).map((c: any) => c.column_name)

      const insertCols: string[] = ['id', 'email', 'full_name', 'role', 'institution_id', 'status']
      const insertVals: any[] = [userId, parent.email, fullName, 'padre', instId, 'active']

      if (colNames.includes('password')) {
        insertCols.push('password'); insertVals.push(generatedPassword)
      }
      if (colNames.includes('password_hash')) {
        insertCols.push('password_hash'); insertVals.push(hashedPassword)
      }
      if (colNames.includes('document_number')) {
        insertCols.push('document_number'); insertVals.push(parent.document_number)
      }

      const placeholders = insertCols.map(() => '?').join(', ')
      await pool.query(
        `INSERT INTO users (${insertCols.join(', ')}) VALUES (${placeholders})`,
        insertVals
      )

      return NextResponse.json({ success: true, generated_password: generatedPassword, email: parent.email })
    }

    if (action === 'reset_password') {
      const newPwd = password?.trim() || `padre-${Math.random().toString(36).slice(2,6)}-${Math.random().toString(36).slice(2,6)}`
      const hashedPassword = await bcrypt.hash(newPwd, 10)

      const [parents] = await pool.query(
        `SELECT email FROM parents WHERE id = ? AND institution_id = ?`,
        [id, instId]
      ) as any[]
      const parent = parents[0]
      if (!parent) return NextResponse.json({ error: 'Padre no encontrado' }, { status: 404 })

      const [colRows] = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1`,
        ['users']
      ) as any[]
      const colNames = (colRows || []).map((c: any) => c.column_name)

      const updates: string[] = []
      const vals: any[] = []
      if (colNames.includes('password')) { updates.push('password = ?'); vals.push(newPwd) }
      if (colNames.includes('password_hash')) { updates.push('password_hash = ?'); vals.push(hashedPassword) }

      if (updates.length === 0) {
        return NextResponse.json({ error: 'No hay columnas de contraseña para actualizar' }, { status: 500 })
      }

      vals.push(parent.email, instId)
      const [, meta] = await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE email = ? AND institution_id = ? AND role = 'padre'`,
        vals
      ) as any[]

      if (meta.affectedRows === 0) {
        return NextResponse.json({ error: 'No se encontró cuenta de usuario para este padre' }, { status: 404 })
      }

      return NextResponse.json({ success: true, generated_password: newPwd, email: parent.email })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error processing request', details: error?.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({error: 'No autenticado'}, { status: 401 })

    const { id } = await params
    await pool.query(
      `DELETE FROM parents WHERE id = ? AND institution_id = ?`,
      [id, instId]
    )

    const authUser = await getAuthPayload(request)
    logAudit({
      userId: (authUser?.userId as string) || '',
      institutionId: instId || '',
      action: 'delete',
      entity: 'parent',
      entityId: id,
      details: {},
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error deleting parent' }, { status: 500 })
  }
}
