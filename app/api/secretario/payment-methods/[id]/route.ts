import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { id } = await params

    const body = await request.json()
    const { type, name, bank_name, account_number, account_holder, phone, details, is_active } = body

    const fields: string[] = []
    const values: any[] = []
    if (type !== undefined) { fields.push('type = ?'); values.push(type) }
    if (name !== undefined) { fields.push('name = ?'); values.push(name) }
    if (bank_name !== undefined) { fields.push('bank_name = ?'); values.push(bank_name) }
    if (account_number !== undefined) { fields.push('account_number = ?'); values.push(account_number) }
    if (account_holder !== undefined) { fields.push('account_holder = ?'); values.push(account_holder) }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone) }
    if (details !== undefined) { fields.push('details = ?'); values.push(details) }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active ? 1 : 0) }

    if (fields.length === 0) return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })

    const [result, meta] = await pool.query(
      `UPDATE payment_methods SET ${fields.join(', ')} WHERE id = ? AND institution_id = ?`,
      [...values, id, instId]
    ) as any[]

    if (!meta.affectedRows) return NextResponse.json({ error: 'Método no encontrado' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar método de pago' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { id } = await params

    const [result, meta] = await pool.query(
      `DELETE FROM payment_methods WHERE id = ? AND institution_id = ?`,
      [id, instId]
    ) as any[]

    if (!meta.affectedRows) return NextResponse.json({ error: 'Método no encontrado' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar método de pago' }, { status: 500 })
  }
}
