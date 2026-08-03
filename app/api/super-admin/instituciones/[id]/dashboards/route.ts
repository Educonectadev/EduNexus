import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload } from '@/lib/resolveInstId'
import crypto from 'crypto'

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS institution_dashboards (
      id VARCHAR(36) PRIMARY KEY,
      institution_id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      type ENUM('main','academic','financial','attendance','administrative','custom') DEFAULT 'main',
      role ENUM('director','docente','secretario','padre','alumno') DEFAULT 'director',
      config JSON,
      status ENUM('active','inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_dashboard_institution (institution_id),
      INDEX idx_dashboard_role (role),
      FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  const [roleCol] = await pool.query(`SHOW COLUMNS FROM institution_dashboards LIKE 'role'`) as any[]
  if (roleCol.length === 0) {
    await pool.query(`ALTER TABLE institution_dashboards ADD COLUMN role ENUM('director','docente','secretario','padre','alumno') DEFAULT 'director' AFTER type`)
    await pool.query(`ALTER TABLE institution_dashboards ADD INDEX idx_dashboard_role (role)`)
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    await ensureTable()

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

    await ensureTable()

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

    await ensureTable()

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

    await ensureTable()
    await pool.query(`DELETE FROM institution_dashboards WHERE id = ?`, [dashboard_id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting dashboard:', error)
    return NextResponse.json({ error: 'Error deleting dashboard' }, { status: 500 })
  }
}
