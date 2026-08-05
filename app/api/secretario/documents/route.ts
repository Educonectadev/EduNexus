import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import crypto from 'crypto'
import { resolveInstId, getAuthPayload } from '@/lib/resolveInstId'
import { logAudit } from '@/lib/audit'
import { checkPlanFeature, checkPlanLimit } from '@/lib/checkPlanLimit'

// Schema managed by migrations/

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json([], { status: 200 })

    const [rows] = await pool.query(
      `SELECT d.*, CONCAT(s.first_name, ' ', s.last_name) as student_name
       FROM documents d
       LEFT JOIN students s ON d.student_id = s.id
       WHERE d.institution_id = ?
       ORDER BY d.created_at DESC`,
      [instId]
    )
    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching documents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // Check permissions
    const canDocuments = await checkPlanFeature(instId, 'can_documents')
    if (!canDocuments) {
      return NextResponse.json({ error: 'Tu plan no incluye gestión de documentos' }, { status: 403 })
    }

    const limitCheck = await checkPlanLimit(instId, 'documents')
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.message }, { status: 403 })
    }

    const body = await request.json()
    const { type, student_id, status, notes } = body

    if (!type) {
      return NextResponse.json({ error: 'Tipo de documento requerido' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO documents (id, institution_id, type, student_id, status, notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, instId, type, student_id || null, status || 'pending', notes || null]
    )

    const authUser = await getAuthPayload(request)
    logAudit({
      userId: (authUser?.userId as string) || '',
      institutionId: instId,
      action: 'create',
      entity: 'document',
      entityId: id,
      details: { type, student_id, status: status || 'pending' },
    })

    return NextResponse.json({ success: true, id })
  } catch (error) {
    return NextResponse.json({ error: 'Error creating document' }, { status: 500 })
  }
}
