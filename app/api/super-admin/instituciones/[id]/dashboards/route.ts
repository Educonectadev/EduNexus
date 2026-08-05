import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload } from '@/lib/resolveInstId'
import crypto from 'crypto'

// Schema managed by migrations/

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const [rows] = await pool.query(
      `SELECT id, institution_id, name, description, type, role, config, status, created_at, updated_at
       FROM institution_dashboards
       WHERE institution_id = ?
       ORDER BY role, created_at DESC`,
      [id]
    )

    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching dashboards:', error)
    return NextResponse.json({ error: 'Error fetching dashboards' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, type, role, config } = body

    if (!name) {
      return NextResponse.json({ error: 'name required' }, { status: 400 })
    }

    const dashboardId = crypto.randomUUID()
    await pool.query(
      `INSERT INTO institution_dashboards (id, institution_id, name, description, type, role, config, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [dashboardId, id, name, description || null, type || 'main', role || 'director', config ? JSON.stringify(config) : null]
    )

    return NextResponse.json({ success: true, id: dashboardId })
  } catch (error) {
    console.error('Error creating dashboard:', error)
    return NextResponse.json({ error: 'Error creating dashboard' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { dashboard_id, name, description, type, role, config, status } = body

    if (!dashboard_id) {
      return NextResponse.json({ error: 'dashboard_id required' }, { status: 400 })
    }

    const updates: string[] = []
    const values: any[] = []

    if (name) { updates.push('name = ?'); values.push(name) }
    if (description !== undefined) { updates.push('description = ?'); values.push(description) }
    if (type) { updates.push('type = ?'); values.push(type) }
    if (role) { updates.push('role = ?'); values.push(role) }
    if (config) { updates.push('config = ?'); values.push(JSON.stringify(config)) }
    if (status) { updates.push('status = ?'); values.push(status) }

    if (updates.length > 0) {
      values.push(dashboard_id)
      await pool.query(`UPDATE institution_dashboards SET ${updates.join(', ')} WHERE id = ?`, values)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating dashboard:', error)
    return NextResponse.json({ error: 'Error updating dashboard' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { dashboard_id } = body

    if (!dashboard_id) {
      return NextResponse.json({ error: 'dashboard_id required' }, { status: 400 })
    }

    await pool.query(`DELETE FROM institution_dashboards WHERE id = ?`, [dashboard_id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting dashboard:', error)
    return NextResponse.json({ error: 'Error deleting dashboard' }, { status: 500 })
  }
}
