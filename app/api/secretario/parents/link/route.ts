import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId, getAuthPayload } from '@/lib/resolveInstId'
import { logAudit } from '@/lib/audit'

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS parents (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      institution_id VARCHAR(36) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      document_type VARCHAR(20) DEFAULT 'DNI',
      document_number VARCHAR(20) NOT NULL,
      email VARCHAR(255) DEFAULT NULL,
      phone VARCHAR(20) DEFAULT NULL,
      address VARCHAR(255) DEFAULT NULL,
      occupation VARCHAR(100) DEFAULT NULL,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_parent_dni_inst (document_number, institution_id),
      INDEX idx_parent_institution (institution_id),
      INDEX idx_parent_name (first_name, last_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS parent_student (
      id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
      parent_id VARCHAR(36) NOT NULL,
      student_id VARCHAR(36) NOT NULL,
      relationship ENUM('padre','madre','apoderado','tio','abuelo','hermano','otro') NOT NULL DEFAULT 'padre',
      is_primary TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_parent_student (parent_id, student_id),
      INDEX idx_ps_student (student_id),
      INDEX idx_ps_parent (parent_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
}

export async function POST(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({error: 'No autenticado'}, { status: 401 })

    await ensureTables()

    const body = await request.json()
    const { parent_id, student_id, relationship } = body

    if (!parent_id || !student_id) {
      return NextResponse.json({ error: 'parent_id y student_id son requeridos' }, { status: 400 })
    }

    const [students] = await pool.query(
      `SELECT id FROM students WHERE id = ? AND institution_id = ?`,
      [student_id, instId]
    ) as any[]
    if (!students || students.length === 0) {
      return NextResponse.json({ error: 'Estudiante no encontrado en esta institución' }, { status: 404 })
    }

    const [parents] = await pool.query(
      `SELECT id FROM parents WHERE id = ? AND institution_id = ?`,
      [parent_id, instId]
    ) as any[]
    if (!parents || parents.length === 0) {
      return NextResponse.json({ error: 'Padre no encontrado en esta institución' }, { status: 404 })
    }

    const [existing] = await pool.query(
      `SELECT id FROM parent_student WHERE parent_id = ? AND student_id = ?`,
      [parent_id, student_id]
    ) as any[]
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Ya está vinculado' }, { status: 409 })
    }

    await pool.query(
      `INSERT INTO parent_student (parent_id, student_id, relationship) VALUES (?, ?, ?)`,
      [parent_id, student_id, relationship || 'apoderado']
    )

    const authUser = await getAuthPayload(request)
    logAudit({
      userId: (authUser?.userId as string) || '',
      institutionId: instId || '',
      action: 'create',
      entity: 'parent_student_link',
      entityId: `${parent_id}_${student_id}`,
      details: { parent_id, student_id, relationship: relationship || 'apoderado' },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error linking', details: error?.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({error: 'No autenticado'}, { status: 401 })

    await ensureTables()

    const { searchParams } = new URL(request.url)
    const parent_id = searchParams.get('parent_id')
    const student_id = searchParams.get('student_id')

    if (!parent_id || !student_id) {
      return NextResponse.json({ error: 'parent_id y student_id requeridos' }, { status: 400 })
    }

    await pool.query(
      `DELETE FROM parent_student WHERE parent_id = ? AND student_id = ?`,
      [parent_id, student_id]
    )

    const authUser = await getAuthPayload(request)
    logAudit({
      userId: (authUser?.userId as string) || '',
      institutionId: instId || '',
      action: 'delete',
      entity: 'parent_student_link',
      entityId: `${parent_id}_${student_id}`,
      details: { parent_id, student_id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error unlinking', details: error?.message }, { status: 500 })
  }
}
