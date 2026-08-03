import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json([])

    const [rows] = await pool.query(
      `SELECT id, name, sort_order, is_active FROM academic_sections WHERE institution_id = ? ORDER BY sort_order ASC`,
      [instId]
    )
    return NextResponse.json(rows)
  } catch (error: any) {
    if (error?.code === 'ER_NO_SUCH_TABLE') return NextResponse.json([])
    return NextResponse.json({ error: 'Error fetching sections' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const { name } = body
    if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

    const [existing] = await pool.query(
      `SELECT id FROM academic_sections WHERE institution_id = ? AND name = ?`,
      [instId, name.trim()]
    )
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: 'Ya existe una sección con ese nombre' }, { status: 409 })
    }

    const [maxOrder] = await pool.query(
      `SELECT MAX(sort_order) as m FROM academic_sections WHERE institution_id = ?`,
      [instId]
    )
    const nextOrder = ((maxOrder as any[])[0]?.m ?? -1) + 1

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO academic_sections (id, institution_id, name, sort_order) VALUES (?, ?, ?, ?)`,
      [id, instId, name.trim(), nextOrder]
    )

    return NextResponse.json({ id, name: name.trim(), sort_order: nextOrder, is_active: 1 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error creating section' }, { status: 500 })
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
    const { name, sort_order, is_active } = body

    if (name !== undefined) {
      const [existing] = await pool.query(
        `SELECT id FROM academic_sections WHERE institution_id = ? AND name = ? AND id != ?`,
        [instId, name.trim(), id]
      )
      if ((existing as any[]).length > 0) {
        return NextResponse.json({ error: 'Ya existe una sección con ese nombre' }, { status: 409 })
      }
    }

    const updates: string[] = []
    const params: any[] = []
    if (name !== undefined) { updates.push('name = ?'); params.push(name.trim()) }
    if (sort_order !== undefined) { updates.push('sort_order = ?'); params.push(sort_order) }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0) }

    if (updates.length === 0) return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })

    params.push(id, instId)
    await pool.query(
      `UPDATE academic_sections SET ${updates.join(', ')} WHERE id = ? AND institution_id = ?`,
      params
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error updating section' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    await pool.query(`DELETE FROM academic_sections WHERE id = ? AND institution_id = ?`, [id, instId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting section' }, { status: 500 })
  }
}
