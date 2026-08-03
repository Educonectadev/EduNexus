import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload, resolveInstId } from '@/lib/resolveInstId'
import { logAudit } from '@/lib/audit'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, type, student_id, notes } = body

    const [existing] = await pool.query(
      'SELECT id, institution_id FROM documents WHERE id = ?',
      [id]
    ) as any

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    const updates: string[] = []
    const values: any[] = []

    if (status !== undefined) {
      if (!['pending', 'approved', 'rejected', 'ready'].includes(status)) {
        return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
      }
      updates.push('status = ?')
      values.push(status)
    }
    if (type !== undefined) {
      updates.push('type = ?')
      values.push(type)
    }
    if (student_id !== undefined) {
      updates.push('student_id = ?')
      values.push(student_id || null)
    }
    if (notes !== undefined) {
      updates.push('notes = ?')
      values.push(notes)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
    }

    values.push(id)
    await pool.query(`UPDATE documents SET ${updates.join(', ')} WHERE id = ?`, values)

    const authUser = await getAuthPayload(request)
    const instId = await resolveInstId(request)
    logAudit({
      userId: (authUser?.userId as string) || '',
      institutionId: instId || existing[0].institution_id,
      action: 'update',
      entity: 'document',
      entityId: id,
      details: { status, type, notes },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error updating document' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [result] = await pool.query('DELETE FROM documents WHERE id = ?', [id]) as any

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    const authUser = await getAuthPayload(request)
    const instId = await resolveInstId(request)
    logAudit({
      userId: (authUser?.userId as string) || '',
      institutionId: instId || '',
      action: 'delete',
      entity: 'document',
      entityId: id,
      details: {},
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting document' }, { status: 500 })
  }
}
