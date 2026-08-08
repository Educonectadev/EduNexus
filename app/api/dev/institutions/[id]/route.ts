import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (body.status && !['active', 'inactive', 'suspended'].includes(body.status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    const updates: string[] = []
    const values: any[] = []

    if (body.status) { updates.push('status = ?'); values.push(body.status) }
    if (body.plan_id !== undefined) { updates.push('plan_id = ?'); values.push(body.plan_id || null) }
    if (body.name !== undefined) { updates.push('name = ?'); values.push(body.name) }
    if (body.code !== undefined) { updates.push('code = ?'); values.push(body.code) }
    if (body.type !== undefined) { updates.push('type = ?'); values.push(body.type) }
    if (body.level !== undefined) { updates.push('level = ?'); values.push(body.level) }
    if (body.modality !== undefined) { updates.push('modality = ?'); values.push(body.modality) }
    if (body.shift !== undefined) { updates.push('shift = ?'); values.push(body.shift) }
    if (body.dependence !== undefined) { updates.push('dependence = ?'); values.push(body.dependence) }
    if (body.department !== undefined) { updates.push('department = ?'); values.push(body.department) }
    if (body.province !== undefined) { updates.push('province = ?'); values.push(body.province) }
    if (body.district !== undefined) { updates.push('district = ?'); values.push(body.district) }
    if (body.address !== undefined) { updates.push('address = ?'); values.push(body.address) }
    if (body.phone !== undefined) { updates.push('phone = ?'); values.push(body.phone) }
    if (body.email !== undefined) { updates.push('email = ?'); values.push(body.email) }
    if (body.director_name !== undefined) { updates.push('director_name = ?'); values.push(body.director_name) }
    if (body.director_dni !== undefined) { updates.push('director_dni = ?'); values.push(body.director_dni) }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Sin campos para actualizar' }, { status: 400 })
    }

    values.push(id)
    await pool.query(`UPDATE institutions SET ${updates.join(', ')} WHERE id = ?`, values)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error updating institution' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Schema has ON DELETE CASCADE, so deleting the institution cascades
    // But we also need to delete users manually (they reference institution_id with CASCADE)
    await pool.query('DELETE FROM users WHERE institution_id = ?', [id])
    await pool.query('DELETE FROM institutions WHERE id = ?', [id])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error deleting institution', details: error?.message }, { status: 500 })
  }
}
