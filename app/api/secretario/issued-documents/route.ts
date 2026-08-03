import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json([])

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id') || ''
    const type = searchParams.get('type') || ''

    let query = `
      SELECT d.*, CONCAT(s.first_name, ' ', s.last_name) AS student_name,
             s.document_number AS student_dni, s.grade, s.section
      FROM issued_documents d
      JOIN students s ON d.student_id = s.id
      WHERE d.institution_id = ?
    `
    const params: any[] = [instId]
    if (studentId) { query += ` AND d.student_id = ?`; params.push(studentId) }
    if (type) { query += ` AND d.type = ?`; params.push(type) }
    query += ` ORDER BY d.created_at DESC LIMIT 50`

    const [rows] = await pool.query(query, params)
    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const { student_id, type, number, details } = body
    if (!student_id || !type) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })

    const [instRows] = await pool.query(`SELECT code FROM institutions WHERE id = ?`, [instId])
    const instCode = (instRows as any[])[0]?.code || ''

    const docNumber = number || `${type.toUpperCase()}-${instCode}-${Date.now().toString(36).toUpperCase()}`
    const id = crypto.randomUUID()

    await pool.query(
      `INSERT INTO issued_documents (id, institution_id, student_id, type, number, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, instId, student_id, type, docNumber, details ? JSON.stringify(details) : null]
    )

    return NextResponse.json({ success: true, id, number: docNumber })
  } catch (error) {
    return NextResponse.json({ error: 'Error creating document' }, { status: 500 })
  }
}
