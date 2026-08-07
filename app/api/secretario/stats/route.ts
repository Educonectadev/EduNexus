import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'

async function count(table: string, instId: string | null, extra = ''): Promise<number> {
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as count FROM ${table} WHERE institution_id = ? ${extra}`,
      [instId]
    ) as any
    return Number(rows?.[0]?.count ?? 0) || 0
  } catch (error: any) {
    console.error(`[stats] count ${table}:`, error?.message || error)
    return -1
  }
}

export async function GET(request: NextRequest) {
  const instId = await resolveInstId(request)
  if (!instId) return NextResponse.json({}, { status: 200 })

  const r = {
    active_students: await count('students', instId, "AND status = 'active'"),
    total_students: await count('students', instId),
    enrollments: await count('enrollments', instId, "AND status = 'active'"),
    pending: await count('enrollments', instId, "AND status = 'pending'"),
    courses: await count('courses', instId),
    schedules: await count('horarios', instId),
    parents: await count('parents', instId),
    issued_documents: await count('issued_documents', instId),
    documents: (await count('documents', instId)) + (await count('document_library', instId)),
    certificates: await count('certificates', instId),
    absent_today: await count('attendance', instId, "AND date = CURRENT_DATE AND status = 'absent'"),
  }

  let total_debt = 0
  try {
    const [pendingPayments] = await pool.query(
      `SELECT COALESCE(SUM(amount - paid_amount), 0) as total FROM payments
       WHERE institution_id = ? AND status IN ('pending','partial','overdue')`,
      [instId]
    ) as any
    total_debt = Number(pendingPayments?.[0]?.total ?? 0) || 0
  } catch (error: any) {
    console.error('[stats] total_debt:', error?.message || error)
  }

  let institution_name = ''
  let institution_code = ''
  try {
    const [instInfo] = await pool.query(
      'SELECT name, code FROM institutions WHERE id = ?',
      [instId]
    ) as any
    institution_name = instInfo?.[0]?.name ?? ''
    institution_code = instInfo?.[0]?.code ?? ''
  } catch {}

  return NextResponse.json({ ...r, total_debt, institution_name, institution_code })
}