import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import crypto from 'crypto'
import { getAuthPayload } from '@/lib/resolveInstId'
import { checkPlanFeature } from '@/lib/checkPlanLimit'
import { saveUpload, deleteUpload } from '@/lib/uploads'

// Schema managed by migrations/

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'docente') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const userId = user.id as string
    const instId = user.institutionId as string

    const allowed = await checkPlanFeature(instId, 'can_documents')
    if (!allowed) {
      return NextResponse.json({ error: 'Materiales no disponibles en tu plan' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')

    const myCoursesClause = `c.id IN (
      SELECT c2.id FROM courses c2 WHERE c2.teacher_id = ? AND c2.status = 'active'
    )`

    let query = `
      SELECT m.id, m.course_id, m.uploaded_by, m.name, m.description, m.file_url, m.file_type,
             m.file_size, m.created_at, c.name AS course_name, c.grade, c.section, 'propio' AS source
      FROM course_materials m
      JOIN courses c ON c.id = m.course_id
      WHERE m.institution_id = ? AND m.uploaded_by = ? AND ${myCoursesClause}
    `
    const params: any[] = [instId, userId, userId]

    if (courseId) {
      query += ` AND m.course_id = ?`
      params.push(courseId)
    }

    query += `
      UNION ALL
      SELECT m.id, NULL AS course_id, NULL AS uploaded_by, m.name, m.description, m.file_url, m.file_type,
             m.file_size, m.created_at, NULL AS course_name, NULL AS grade, NULL AS section, 'biblioteca' AS source
      FROM document_library m
      WHERE m.institution_id = ?
      ORDER BY created_at DESC
    `
    params.push(instId)

    const [rows] = await pool.query(query, params)
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching materiales:', error)
    return NextResponse.json({ error: 'Error fetching materiales' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'docente') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const userId = user.id as string
    const instId = user.institutionId as string

    const allowed = await checkPlanFeature(instId, 'can_documents')
    if (!allowed) {
      return NextResponse.json({ error: 'Materiales no disponibles en tu plan' }, { status: 403 })
    }

    const formData = await request.formData()
    const name = formData.get('name') as string
    const description = formData.get('description') as string | null
    const courseId = formData.get('course_id') as string
    const file = formData.get('file') as File | null

    if (!name || !courseId) {
      return NextResponse.json({ error: 'Nombre y curso requeridos' }, { status: 400 })
    }

    const [courseRows] = await pool.query(
      `SELECT c.id FROM courses c
       JOIN teachers t ON c.teacher_id = t.id
       WHERE c.id = ? AND t.user_id = ? AND c.status = 'active'`,
      [courseId, userId]
    ) as any[]
    if (!courseRows[0]) {
      return NextResponse.json({ error: 'Curso no asignado' }, { status: 403 })
    }

    const id = crypto.randomUUID()
    let file_url: string | null = null
    let fileType = 'application/octet-stream'
    let fileSize = 0

    if (file && file.size > 0) {
      const ext = file.name.split('.').pop() || 'bin'
      const filename = `${id}-${Date.now()}.${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())
      file_url = await saveUpload('materials', instId, filename, buffer)
      fileType = file.type || 'application/octet-stream'
      fileSize = file.size
    }

    await pool.query(
      `INSERT INTO course_materials (id, institution_id, course_id, uploaded_by, name, description, file_url, file_type, file_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, instId, courseId, userId, name, description || null, file_url, fileType, fileSize]
    )

    return NextResponse.json({ success: true, id, file_url })
  } catch (error: any) {
    console.error('[materiales] POST error:', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Error al subir material' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'docente') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const userId = user.id as string

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const [existing] = await pool.query(
      `SELECT m.file_url, m.course_id FROM course_materials m
       WHERE m.id = ? AND m.uploaded_by = ?`,
      [id, userId]
    ) as any[]

    if (!existing[0]) {
      return NextResponse.json({ error: 'Material no encontrado' }, { status: 404 })
    }

    const fileUrl = existing[0].file_url
    if (fileUrl) {
      await deleteUpload(fileUrl)
    }

    await pool.query('DELETE FROM course_materials WHERE id = ?', [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting material:', error)
    return NextResponse.json({ error: 'Error deleting material' }, { status: 500 })
  }
}
