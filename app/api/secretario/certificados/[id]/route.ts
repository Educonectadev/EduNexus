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
    const { student_name, type, status, student_id } = body

    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const [existing] = await pool.query(
      'SELECT student_name, type, status, institution_id FROM certificates WHERE id = ? AND institution_id = ?',
      [id, instId]
    ) as any

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Certificado no encontrado' }, { status: 404 })
    }

    const updates: string[] = []
    const values: any[] = []

    if (student_name !== undefined) {
      updates.push('student_name = ?')
      values.push(student_name)
    }
    if (type !== undefined) {
      updates.push('type = ?')
      values.push(type)
    }
    if (status !== undefined) {
      if (!['emitido', 'pendiente', 'anulado'].includes(status)) {
        return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
      }
      updates.push('status = ?')
      values.push(status)
    }
    if (student_id !== undefined) {
      updates.push('student_id = ?')
      values.push(student_id || null)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
    }

    values.push(id, instId)
    await pool.query(`UPDATE certificates SET ${updates.join(', ')} WHERE id = ? AND institution_id = ?`, values)

    const authUser = await getAuthPayload(request)
    logAudit({
      userId: (authUser?.userId as string) || '',
      institutionId: existing[0].institution_id,
      action: 'update',
      entity: 'certificate',
      entityId: id,
      details: { student_name, type, status },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error updating certificate' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const [cert] = await pool.query('SELECT student_name, type, institution_id FROM certificates WHERE id = ? AND institution_id = ?', [id, instId]) as any
    if (!cert || cert.length === 0) {
      return NextResponse.json({ error: 'Certificado no encontrado' }, { status: 404 })
    }

    await pool.query('DELETE FROM certificates WHERE id = ? AND institution_id = ?', [id, instId])

    const authUser = await getAuthPayload(request)
    logAudit({
      userId: (authUser?.userId as string) || '',
      institutionId: cert[0].institution_id,
      action: 'delete',
      entity: 'certificate',
      entityId: id,
      details: { student_name: cert[0].student_name, type: cert[0].type },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting certificate' }, { status: 500 })
  }
}
