import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json([])

    const [rows] = await pool.query(
      `SELECT id, type, name, bank_name, account_number, account_holder, phone, details, is_active
       FROM payment_methods WHERE institution_id = ? ORDER BY created_at ASC`,
      [instId]
    )
    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const { type, name, bank_name, account_number, account_holder, phone, details } = body

    if (!type || !name) {
      return NextResponse.json({ error: 'Tipo y nombre requeridos' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO payment_methods (id, institution_id, type, name, bank_name, account_number, account_holder, phone, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, instId, type, name,
        bank_name || null, account_number || null, account_holder || null,
        phone || null, details || null,
      ]
    )
    return NextResponse.json({ success: true, id })
  } catch (error) {
    return NextResponse.json({ error: 'Error al guardar método de pago' }, { status: 500 })
  }
}
