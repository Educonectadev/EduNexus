import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { id } = await params
    const [rows] = await pool.query(
      `SELECT d.*, CONCAT(s.first_name, ' ', s.last_name) AS student_name,
              s.document_number AS student_dni, s.grade, s.section, s.code AS student_code,
              i.name AS institution_name, i.district, i.province, i.department,
              i.address AS institution_address
       FROM issued_documents d
       JOIN students s ON d.student_id = s.id
       JOIN institutions i ON d.institution_id = i.id
       WHERE d.id = ? AND d.institution_id = ?`,
      [id, instId]
    )
    if (!(rows as any[]).length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json((rows as any[])[0])
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { id } = await params
    await pool.query(`DELETE FROM issued_documents WHERE id = ? AND institution_id = ?`, [id, instId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting document' }, { status: 500 })
  }
}
