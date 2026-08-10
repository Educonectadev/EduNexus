import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { addBusinessDays } from '@/lib/trial'

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
    if (body.plan_id !== undefined) {
      updates.push('plan_id = ?'); values.push(body.plan_id || null)
      let trialEnd = null
      if (body.plan_id) {
        let tdays: any = null
        try {
          const [planRows] = await pool.query('SELECT trial_days FROM plans WHERE id = ?', [body.plan_id]) as any
          tdays = planRows?.[0]?.trial_days
        } catch { /* columna trial_days aún no existe */ }
        trialEnd = tdays && Number(tdays) > 0 ? addBusinessDays(new Date(), Number(tdays)).toISOString() : null
      } else {
        trialEnd = addBusinessDays(new Date(), 20).toISOString()
      }
      updates.push('trial_ends_at = ?'); values.push(trialEnd)
    }
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
    if (body.phone2 !== undefined) { updates.push('phone2 = ?'); values.push(body.phone2) }
    if (body.email !== undefined) { updates.push('email = ?'); values.push(body.email) }
    if (body.website !== undefined) { updates.push('website = ?'); values.push(body.website) }
    if (body.reference !== undefined) { updates.push('reference = ?'); values.push(body.reference) }
    if (body.director_name !== undefined) { updates.push('director_name = ?'); values.push(body.director_name) }
    if (body.director_dni !== undefined) { updates.push('director_dni = ?'); values.push(body.director_dni) }
    if (body.director_phone !== undefined) { updates.push('director_phone = ?'); values.push(body.director_phone) }
    if (body.director_email !== undefined) { updates.push('director_email = ?'); values.push(body.director_email) }
    if (body.total_students !== undefined) { updates.push('total_students = ?'); values.push(Number(body.total_students) || 0) }
    if (body.total_teachers !== undefined) { updates.push('total_teachers = ?'); values.push(Number(body.total_teachers) || 0) }
    if (body.total_classrooms !== undefined) { updates.push('total_classrooms = ?'); values.push(Number(body.total_classrooms) || 0) }
    for (const f of ['has_lab', 'has_library', 'has_computer_room', 'has_playground'] as const) {
      if (body[f] !== undefined) { updates.push(`${f} = ?`); values.push(body[f] ? true : false) }
    }
    if (body.notes !== undefined) { updates.push('notes = ?'); values.push(body.notes) }
    if (body.schedule_config !== undefined) { updates.push('schedule_config = ?'); values.push(JSON.stringify(body.schedule_config)) }

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
