import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
import crypto from 'crypto'
import { notifyAll, formatDate } from '@/lib/notify'

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json([])
    const [rows] = await pool.query(
      `SELECT * FROM academic_periods WHERE institution_id = ? ORDER BY year DESC, start_date ASC`,
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
    const { name, year, start_date, end_date, is_active } = body
    if (!name || !year) return NextResponse.json({ error: 'Nombre y año requeridos' }, { status: 400 })

    if (is_active) {
      await pool.query(`UPDATE academic_periods SET is_active = 0 WHERE institution_id = ?`, [instId])
    }

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO academic_periods (id, institution_id, name, year, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, instId, name, Number(year), start_date || null, end_date || null, is_active ? 1 : 0]
    )

    if (start_date) {
      notifyAll(
        instId,
        'Cronograma escolar actualizado',
        `El inicio de clases del ${name || 'periodo ' + year} está programado para el ${formatDate(start_date)}.`,
        'academic', 'calendario', 'alta'
      )
    }

    return NextResponse.json({ success: true, id })
  } catch (error) {
    return NextResponse.json({ error: 'Error creating period' }, { status: 500 })
  }
}
