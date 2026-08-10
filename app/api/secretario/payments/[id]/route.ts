import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId, getAuthPayload } from '@/lib/resolveInstId'
import { logAudit } from '@/lib/audit'
import { notifyParentsOfStudents } from '@/lib/notify'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { id } = await params
    const body = await request.json()
    const updates: string[] = []; const values: any[] = []
    if (body.amount !== undefined) { updates.push('amount = ?'); values.push(Number(body.amount)) }
    if (body.paid_amount !== undefined) { updates.push('paid_amount = ?'); values.push(Number(body.paid_amount)) }
    if (body.due_date !== undefined) { updates.push('due_date = ?'); values.push(body.due_date || null) }
    if (body.paid_date !== undefined) { updates.push('paid_date = ?'); values.push(body.paid_date || null) }
    if (body.status) { updates.push('status = ?'); values.push(body.status) }
    if (body.reference !== undefined) { updates.push('reference = ?'); values.push(body.reference || null) }
    if (body.notes !== undefined) { updates.push('notes = ?'); values.push(body.notes || null) }
    if (updates.length === 0) return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
    values.push(id, instId)

    const [existing] = await pool.query(
      `SELECT p.student_id, p.amount, p.paid_amount,
              CONCAT(s.first_name, ' ', s.last_name) AS student_name,
              pc.name AS concept_name
       FROM payments p
       LEFT JOIN students s ON p.student_id = s.id
       LEFT JOIN payment_concepts pc ON p.concept_id = pc.id
       WHERE p.id = ? AND p.institution_id = ?`,
      [id, instId]
    ) as any[]
    const existingPayment = (existing as any[])[0]

    await pool.query(`UPDATE payments SET ${updates.join(', ')} WHERE id = ? AND institution_id = ?`, values)

    if (existingPayment?.student_id && body.status === 'paid') {
      const totalPaid = body.paid_amount !== undefined ? Number(body.paid_amount) : Number(existingPayment.paid_amount || 0)
      notifyParentsOfStudents(
        instId,
        [existingPayment.student_id],
        'Pago procesado',
        `Se procesó el pago de ${existingPayment.concept_name || 'cuota'} de ${existingPayment.student_name || 'tu hijo(a)'} por S/ ${Number(existingPayment.amount || 0).toFixed(2)}.`,
        'payment', 'pagos', 'alta'
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error updating payment' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { id } = await params

    const body = await request.json().catch(() => null)
    const reason = (body?.reason || '').trim()

    const [existing] = await pool.query(
      `SELECT p.*, CONCAT(s.first_name, ' ', s.last_name) AS student_name, pc.name AS concept_name
       FROM payments p
       LEFT JOIN students s ON p.student_id = s.id
       LEFT JOIN payment_concepts pc ON p.concept_id = pc.id
       WHERE p.id = ? AND p.institution_id = ?`,
      [id, instId]
    ) as any[]

    const payment = (existing as any[])[0]
    if (!payment) return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })

    // Logical delete: keep the row, mark as deleted with a reason
    const [result, meta] = await pool.query(
      `UPDATE payments SET deleted_at = ?, delete_reason = ? WHERE id = ? AND institution_id = ? AND deleted_at IS NULL`,
      [new Date().toISOString(), reason || '', id, instId]
    ) as any[]

    const authUser = await getAuthPayload(request)
    logAudit({
      userId: (authUser?.userId as string) || (authUser?.id as string) || '',
      institutionId: instId,
      action: 'delete',
      entity: 'payment',
      entityId: id,
      details: {
        student: payment.student_name,
        concept: payment.concept_name,
        amount: Number(payment.amount),
        paid_amount: Number(payment.paid_amount),
        reason: reason || 'Sin motivo especificado',
        soft_delete: true,
      },
    })

    return NextResponse.json({ success: true, softDelete: (meta?.rowCount ?? 0) > 0 })
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting payment' }, { status: 500 })
  }
}
