import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import crypto from 'crypto'
import { resolveInstId, getAuthPayload } from '@/lib/resolveInstId'
import { logAudit } from '@/lib/audit'
import { saveUpload, deleteUpload } from '@/lib/uploads'

// Schema managed by migrations/

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json([], { status: 200 })

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    let query = `SELECT id, name, description, file_url, file_type, file_size, category, tags, created_at
                 FROM document_library WHERE institution_id = ?`
    const params: any[] = [instId]

    if (category && category !== 'all') {
      query += ` AND category = ?`
      params.push(category)
    }

    if (search) {
      query += ` AND (name LIKE ? OR description LIKE ?)`
      params.push(`%${search}%`, `%${search}%`)
    }

    query += ` ORDER BY created_at DESC`

    const [rows] = await pool.query(query, params)
    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching library' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    ensureUploadDir()

    const formData = await request.formData()
    const name = formData.get('name') as string
    const description = formData.get('description') as string | null
    const category = formData.get('category') as string || 'general'
    const file = formData.get('file') as File | null

    if (!name) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    }

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    const ext = file.name.split('.').pop() || 'bin'
    const filename = `${id}-${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const file_url = saveUpload('library', filename, buffer)

    const fileType = file.type || 'application/octet-stream'
    const fileSize = file.size

    await pool.query(
      `INSERT INTO document_library (id, institution_id, uploaded_by, name, description, file_url, file_type, file_size, category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, instId, null, name, description || null, file_url, fileType, fileSize, category]
    )

    const authUser = await getAuthPayload(request)
    logAudit({
      userId: (authUser?.userId as string) || '',
      institutionId: instId,
      action: 'create',
      entity: 'document_library',
      entityId: id,
      details: { name, category, file_type: fileType },
    })

    return NextResponse.json({ success: true, id, file_url })
  } catch (error: any) {
    console.error('[document-library] POST error:', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Error uploading file' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const [existing] = await pool.query(
      'SELECT file_url, name FROM document_library WHERE id = ? AND institution_id = ?',
      [id, instId]
    ) as any

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    // Delete file from disk
    deleteUpload(existing[0].file_url)

    await pool.query('DELETE FROM document_library WHERE id = ? AND institution_id = ?', [id, instId])

    const authUser = await getAuthPayload(request)
    logAudit({
      userId: (authUser?.userId as string) || '',
      institutionId: instId,
      action: 'delete',
      entity: 'document_library',
      entityId: id,
      details: { name: existing[0].name },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting file' }, { status: 500 })
  }
}
