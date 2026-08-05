import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
import crypto from 'crypto'

// Schema managed by migrations/

function generateName(yearNumber: number, level: string): string {
  const suffixes: Record<string, string> = {
    Inicial: 'de Inicial',
    Primaria: 'de Primaria',
    Secundaria: 'de Secundaria',
  }
  const suffix = suffixes[level] || level
  const yearMap: Record<number, string> = {
    1: '1°', 2: '2°', 3: '3°', 4: '4°', 5: '5°', 6: '6°',
  }
  return `${yearMap[yearNumber] || yearNumber} ${suffix}`
}

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json([])

    const [rows] = await pool.query(
      `SELECT id, name, level, year_number, sort_order, is_active FROM academic_grades WHERE institution_id = ? ORDER BY sort_order ASC`,
      [instId]
    )
    return NextResponse.json(rows)
  } catch (error: any) {
    console.error('[academic-grades] GET error:', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Error fetching grades' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    let { name, level, year_number } = body

    if (level && year_number !== undefined) {
      name = generateName(Number(year_number), level)
    }

    if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

    const [existing] = await pool.query(
      `SELECT id FROM academic_grades WHERE institution_id = ? AND name = ?`,
      [instId, name.trim()]
    )
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: 'Ya existe un grado con ese nombre' }, { status: 409 })
    }

    const [maxOrder] = await pool.query(
      `SELECT MAX(sort_order) as m FROM academic_grades WHERE institution_id = ?`,
      [instId]
    )
    const nextOrder = ((maxOrder as any[])[0]?.m ?? -1) + 1

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO academic_grades (id, institution_id, name, level, year_number, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, instId, name.trim(), level || '', year_number !== undefined ? Number(year_number) : 0, nextOrder]
    )

    return NextResponse.json({ id, name: name.trim(), level: level || '', year_number: year_number || 0, sort_order: nextOrder, is_active: 1 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error creating grade' }, { status: 500 })
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
    const { name, level, year_number, sort_order, is_active } = body

    const updates: string[] = []
    const params: any[] = []

    let finalName = name

    if (level !== undefined && year_number !== undefined) {
      finalName = generateName(Number(year_number), level)
    }

    if (finalName !== undefined) {
      const [existing] = await pool.query(
        `SELECT id FROM academic_grades WHERE institution_id = ? AND name = ? AND id != ?`,
        [instId, finalName.trim(), id]
      )
      if ((existing as any[]).length > 0) {
        return NextResponse.json({ error: 'Ya existe un grado con ese nombre' }, { status: 409 })
      }
      updates.push('name = ?'); params.push(finalName.trim())
    }
    if (level !== undefined) { updates.push('level = ?'); params.push(level) }
    if (year_number !== undefined) { updates.push('year_number = ?'); params.push(Number(year_number)) }
    if (sort_order !== undefined) { updates.push('sort_order = ?'); params.push(sort_order) }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0) }

    if (updates.length === 0) return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })

    params.push(id, instId)
    await pool.query(
      `UPDATE academic_grades SET ${updates.join(', ')} WHERE id = ? AND institution_id = ?`,
      params
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error updating grade' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    await pool.query(`DELETE FROM academic_grades WHERE id = ? AND institution_id = ?`, [id, instId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting grade' }, { status: 500 })
  }
}
