import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload } from '@/lib/resolveInstId'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const [rows] = await pool.query(
      `SELECT i.*, p.name as plan_name, p.price as plan_price, p.features as plan_features
       FROM institutions i
       LEFT JOIN plans p ON p.id = i.plan_id
       WHERE i.id = ?`,
      [id]
    ) as any[]

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 })
    }

    const institution = rows[0]

    const [users] = await pool.query(
      `SELECT id, full_name, email, role, status FROM users WHERE institution_id = ?`,
      [id]
    ) as any[]

    const [dashboards] = await pool.query(
      `SELECT * FROM institution_dashboards WHERE institution_id = ?`,
      [id]
    ) as any[]

    return NextResponse.json({
      ...institution,
      users,
      dashboards,
    })
  } catch (error) {
    console.error('Error fetching institution:', error)
    return NextResponse.json({ error: 'Error fetching institution' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let conn: any = null
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const [instResult] = await pool.query('SELECT id, name FROM institutions WHERE id = ?', [id]) as any[]
    const inst = instResult?.[0]
    if (!inst) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 })
    }

    conn = await pool.rawPool.connect()
    await conn.query('BEGIN')

    await conn.query('DELETE FROM users WHERE institution_id = $1', [id])
    await conn.query('DELETE FROM institution_dashboards WHERE institution_id = $1', [id])
    await conn.query('DELETE FROM enrollments WHERE student_id IN (SELECT id FROM students WHERE institution_id = $1)', [id])
    await conn.query('DELETE FROM students WHERE institution_id = $1', [id])
    await conn.query('DELETE FROM courses WHERE institution_id = $1', [id])
    await conn.query('DELETE FROM parent_student WHERE parent_id IN (SELECT id FROM parents WHERE institution_id = $1)', [id])
    await conn.query('DELETE FROM parents WHERE institution_id = $1', [id])
    await conn.query('DELETE FROM chat_messages WHERE institution_id = $1', [id])
    await conn.query('DELETE FROM virtual_classes WHERE institution_id = $1', [id])

    try { await conn.query('DELETE FROM notifications WHERE institution_id = $1', [id]) } catch {}
    try { await conn.query('DELETE FROM horarios WHERE institution_id = $1', [id]) } catch {}
    try { await conn.query('DELETE FROM attendance WHERE institution_id = $1', [id]) } catch {}
    try { await conn.query('DELETE FROM academic_grades WHERE institution_id = $1', [id]) } catch {}
    try { await conn.query('DELETE FROM documents WHERE institution_id = $1', [id]) } catch {}
    try { await conn.query('DELETE FROM certificates WHERE institution_id = $1', [id]) } catch {}
    try { await conn.query('DELETE FROM payments WHERE institution_id = $1', [id]) } catch {}

    await conn.query('DELETE FROM institutions WHERE id = $1', [id])

    await conn.query('COMMIT')

    return NextResponse.json({ success: true, message: `Institution "${inst.name}" and all associated data deleted` })
  } catch (error) {
    if (conn) {
      try { await conn.query('ROLLBACK') } catch {}
    }
    console.error('Error deleting institution:', error)
    return NextResponse.json({ error: 'Error deleting institution' }, { status: 500 })
  } finally {
    if (conn) {
      try { conn.release() } catch {}
    }
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, code, plan_id, status, type, level, modality, shift, department, province, district, address, phone, email, director_name, director_dni, dependence } = body

    const [[inst]] = await pool.query('SELECT id FROM institutions WHERE id = ?', [id]) as any[]
    if (!inst) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 })
    }

    const updates: string[] = []
    const values: any[] = []

    if (name !== undefined) { updates.push('name = ?'); values.push(name) }
    if (code !== undefined) { updates.push('code = ?'); values.push(code) }
    if (plan_id !== undefined) { updates.push('plan_id = ?'); values.push(plan_id) }
    if (status !== undefined) { updates.push('status = ?'); values.push(status) }
    if (type !== undefined) { updates.push('type = ?'); values.push(type) }
    if (level !== undefined) { updates.push('level = ?'); values.push(level) }
    if (modality !== undefined) { updates.push('modality = ?'); values.push(modality) }
    if (shift !== undefined) { updates.push('shift = ?'); values.push(shift) }
    if (department !== undefined) { updates.push('department = ?'); values.push(department) }
    if (province !== undefined) { updates.push('province = ?'); values.push(province) }
    if (district !== undefined) { updates.push('district = ?'); values.push(district) }
    if (address !== undefined) { updates.push('address = ?'); values.push(address) }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone) }
    if (email !== undefined) { updates.push('email = ?'); values.push(email) }
    if (director_name !== undefined) { updates.push('director_name = ?'); values.push(director_name) }
    if (director_dni !== undefined) { updates.push('director_dni = ?'); values.push(director_dni) }
    if (dependence !== undefined) { updates.push('dependence = ?'); values.push(dependence) }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    values.push(id)
    await pool.query(`UPDATE institutions SET ${updates.join(', ')} WHERE id = ?`, values)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating institution:', error)
    return NextResponse.json({ error: 'Error updating institution' }, { status: 500 })
  }
}
