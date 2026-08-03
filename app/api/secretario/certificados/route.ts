import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { resolveInstId, getAuthPayload } from '@/lib/resolveInstId'
import { logAudit } from '@/lib/audit'
import { checkPlanFeature, checkPlanLimit } from '@/lib/checkPlanLimit'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'certificates')

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS certificates (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      institution_id VARCHAR(36) NOT NULL,
      student_id VARCHAR(36) DEFAULT NULL,
      student_name VARCHAR(200) NOT NULL,
      type VARCHAR(100) NOT NULL,
      issue_date DATE DEFAULT NULL,
      file_url VARCHAR(500) DEFAULT NULL,
      status ENUM('emitido','pendiente','anulado') NOT NULL DEFAULT 'emitido',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
      INDEX idx_cert_institution (institution_id),
      INDEX idx_cert_student (student_id),
      INDEX idx_cert_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  // Migration: add student_id if missing
  const [cols] = await pool.query(`SHOW COLUMNS FROM certificates LIKE 'student_id'`) as any[]
  if (cols.length === 0) {
    await pool.query(`ALTER TABLE certificates ADD COLUMN student_id VARCHAR(36) DEFAULT NULL AFTER institution_id`)
    await pool.query(`ALTER TABLE certificates ADD FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL`)
  }
  // Migration: fix status ENUM if needed
  const [statusCol] = await pool.query(`SHOW COLUMNS FROM certificates LIKE 'status'`) as any[]
  if (statusCol.length > 0 && !statusCol[0].Type.includes('emitido')) {
    await pool.query(`ALTER TABLE certificates MODIFY COLUMN status VARCHAR(20) DEFAULT 'emitido'`)
  }
  // Migration: add file_url if missing
  const [fileCols] = await pool.query(`SHOW COLUMNS FROM certificates LIKE 'file_url'`) as any[]
  if (fileCols.length === 0) {
    await pool.query(`ALTER TABLE certificates ADD COLUMN file_url VARCHAR(500) DEFAULT NULL AFTER issue_date`)
  }

  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  }
}

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json([], { status: 200 })

    await ensureTables()

    const [rows] = await pool.query(
      `SELECT c.id, c.student_id, c.student_name, c.type, c.issue_date, c.file_url, c.status, c.created_at,
              CONCAT(s.first_name, ' ', s.last_name) AS student_full_name
       FROM certificates c
       LEFT JOIN students s ON c.student_id = s.id
       WHERE c.institution_id = ?
       ORDER BY c.created_at DESC`,
      [instId]
    )
    return NextResponse.json(rows)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error fetching certificates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({error: 'No autenticado'}, { status: 401 })

    // Check permissions
    const canCertificates = await checkPlanFeature(instId, 'can_certificates')
    if (!canCertificates) {
      return NextResponse.json({ error: 'Tu plan no incluye certificados digitales' }, { status: 403 })
    }

    const limitCheck = await checkPlanLimit(instId, 'certificates')
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.message }, { status: 403 })
    }

    await ensureTables()

    const formData = await request.formData()
    const student_id = formData.get('student_id') as string | null
    const student_name = formData.get('student_name') as string
    const type = formData.get('type') as string
    const file = formData.get('file') as File | null

    if (!student_name || !type) {
      return NextResponse.json({ error: 'Nombre y tipo son requeridos' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    let file_url: string | null = null

    if (file && file.size > 0) {
      const ext = file.name.split('.').pop() || 'pdf'
      const filename = `${id}-${Date.now()}.${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())
      fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer)
      file_url = `/uploads/certificates/${filename}`
    }

    await pool.query(
      `INSERT INTO certificates (id, institution_id, student_id, student_name, type, issue_date, file_url, status)
       VALUES (?, ?, ?, ?, ?, CURDATE(), ?, 'emitido')`,
      [id, instId, student_id || null, student_name, type, file_url]
    )

    const authUser = await getAuthPayload(request)
    logAudit({
      userId: (authUser?.userId as string) || '',
      institutionId: instId,
      action: 'create',
      entity: 'certificate',
      entityId: id,
      details: { student_name, student_id, type },
    })

    return NextResponse.json({ success: true, id, file_url })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error creating certificate' }, { status: 500 })
  }
}
