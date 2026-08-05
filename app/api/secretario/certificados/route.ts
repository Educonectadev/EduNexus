import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { resolveInstId, getAuthPayload } from '@/lib/resolveInstId'
import { logAudit } from '@/lib/audit'
import { checkPlanFeature, checkPlanLimit } from '@/lib/checkPlanLimit'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'certificates')

// Schema managed by migrations/

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  }
}

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json([], { status: 200 })

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

    ensureUploadDir()

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
       VALUES (?, ?, ?, ?, ?, CURRENT_DATE, ?, 'emitido')`,
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
