import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json([])
    const [rows] = await pool.query(
      `SELECT * FROM payment_concepts WHERE institution_id = ? ORDER BY type, name`,
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
    const { name, amount, type } = body
    if (!name || amount === undefined) return NextResponse.json({ error: 'Nombre y monto requeridos' }, { status: 400 })
    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO payment_concepts (id, institution_id, name, amount, type) VALUES (?, ?, ?, ?, ?)`,
      [id, instId, name, Number(amount), type || 'monthly']
    )
    return NextResponse.json({ success: true, id })
  } catch (error) {
    return NextResponse.json({ error: 'Error creating concept' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
    const body = await request.json()
    const updates: string[] = []; const values: any[] = []
    if (body.name) { updates.push('name = ?'); values.push(body.name) }
    if (body.amount !== undefined) { updates.push('amount = ?'); values.push(Number(body.amount)) }
    if (body.type) { updates.push('type = ?'); values.push(body.type) }
    if (body.is_active !== undefined) { updates.push('is_active = ?'); values.push(body.is_active ? 1 : 0) }
    if (updates.length === 0) return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
    values.push(id, instId)
    await pool.query(`UPDATE payment_concepts SET ${updates.join(', ')} WHERE id = ? AND institution_id = ?`, values)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error updating concept' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
    await pool.query(`DELETE FROM payment_concepts WHERE id = ? AND institution_id = ?`, [id, instId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting concept' }, { status: 500 })
  }
}
