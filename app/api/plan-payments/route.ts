import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload, resolveInstId } from '@/lib/resolveInstId'
import crypto from 'crypto'

// ============================================================
// Pagos del PLAN adquirido por la institución (SaaS EduNexus).
// SEPARADO de los pagos de padres por matrículas/mensualidades.
// Accesible para director y secretario. Registro MANUAL con voucher.
// ============================================================

const ALLOWED_ROLES = ['director', 'secretario']

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre']

async function authorize(request: NextRequest): Promise<{ instId: string } | { error: NextResponse }> {
  const user = await getAuthPayload(request)
  if (!user) return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) }
  if (!ALLOWED_ROLES.includes(user.role)) {
    return { error: NextResponse.json({ error: 'Sin permiso para ver pagos del plan' }, { status: 403 }) }
  }
  const instId = await resolveInstId(request)
  if (!instId) return { error: NextResponse.json({ error: 'Sin institución' }, { status: 400 }) }
  return { instId }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authorize(request)
    if ('error' in auth) return auth.error
    const instId = auth.instId

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10)

    // Plan actual de la institución
    const [planRows] = await pool.query(
      `SELECT p.id, p.name, p.description, p.price, p.max_users, p.max_students, p.features,
              i.plan_id AS current_plan_id, i.trial_ends_at
       FROM institutions i
       LEFT JOIN plans p ON p.id = i.plan_id
       WHERE i.id = ?`,
      [instId]
    ) as any[]

    const plan = (planRows as any[])?.[0] || null

    // Pagos registrados del año
    const [payRows] = await pool.query(
      `SELECT id, plan_id, year, month, amount, status, payment_date, method, voucher_ref, notes, updated_at
       FROM institution_plan_payments
       WHERE institution_id = ? AND year = ?
       ORDER BY month ASC`,
      [instId, year]
    ) as any[]

    const payments = (payRows as any[]) || []
    const payByMonth: Record<number, any> = {}
    for (const p of payments) payByMonth[p.month] = p

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    const planPrice = Number(plan?.price) || 0

    // Generar cuotas del año (enero a diciembre)
    const cuotas = MONTHS.map((name, i) => {
      const month = i + 1
      const pay = payByMonth[month]
      const isPast = year < currentYear || (year === currentYear && month < currentMonth)
      let status = 'pending'
      if (pay?.status === 'paid') status = 'paid'
      else if (isPast) status = 'overdue'
      return {
        month,
        monthName: name,
        amount: pay?.amount != null ? Number(pay.amount) : planPrice,
        status,
        payment: pay || null,
      }
    })

    const paidTotal = cuotas.filter(c => c.status === 'paid').reduce((a, c) => a + c.amount, 0)
    const pendingTotal = cuotas.filter(c => c.status !== 'paid').reduce((a, c) => a + c.amount, 0)
    const paidCount = cuotas.filter(c => c.status === 'paid').length

    return NextResponse.json({
      year,
      currentYear,
      plan: plan ? {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: planPrice,
        max_users: plan.max_users,
        max_students: plan.max_students,
        features: plan.features,
      } : null,
      trial_ends_at: plan?.trial_ends_at || null,
      cuotas,
      totals: {
        year: paidTotal + pendingTotal,
        paid: paidTotal,
        pending: pendingTotal,
        paidCount,
        pendingCount: 12 - paidCount,
      },
      paymentMethods: await getPaymentMethods(instId),
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error fetching plan payments', details: error?.message }, { status: 500 })
  }
}

async function getPaymentMethods(instId: string): Promise<any[]> {
  try {
    const [rows] = await pool.query(
      `SELECT id, type, name, bank_name, account_number, account_holder, phone, details
       FROM payment_methods WHERE institution_id = ? ORDER BY created_at ASC`,
      [instId]
    )
    return (rows as any[]) || []
  } catch {
    return []
  }
}

// Registrar / actualizar pago de una cuota (upsert por institution+year+month)
export async function POST(request: NextRequest) {
  try {
    const auth = await authorize(request)
    if ('error' in auth) return auth.error
    const instId = auth.instId

    const body = await request.json()
    const { year, month, amount, payment_date, method, voucher_ref, notes } = body

    const yr = parseInt(year, 10)
    const mo = parseInt(month, 10)
    if (isNaN(yr) || isNaN(mo) || mo < 1 || mo > 12) {
      return NextResponse.json({ error: 'Año y mes inválidos' }, { status: 400 })
    }
    if (amount == null || isNaN(Number(amount)) || Number(amount) < 0) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
    }

    // plan actual para guardar referencia
    const [planRows] = await pool.query(
      `SELECT plan_id FROM institutions WHERE id = ?`,
      [instId]
    ) as any[]
    const planId = (planRows as any[])[0]?.plan_id || null

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO institution_plan_payments
         (id, institution_id, plan_id, year, month, amount, status, payment_date, method, voucher_ref, notes)
       VALUES (?, ?, ?, ?, ?, ?, 'paid', ?, ?, ?, ?)
       ON CONFLICT (institution_id, year, month) DO UPDATE
         SET amount = EXCLUDED.amount,
             status = 'paid',
             payment_date = EXCLUDED.payment_date,
             method = EXCLUDED.method,
             voucher_ref = EXCLUDED.voucher_ref,
             notes = EXCLUDED.notes,
             updated_at = NOW()`,
      [id, instId, planId, yr, mo, Number(amount), payment_date || null, method || '', voucher_ref || '', notes || '']
    )

    return NextResponse.json({ success: true, id })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error saving plan payment', details: error?.message }, { status: 500 })
  }
}

// Cancelar pago de una cuota (vuelve a pending/overdue según fecha)
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authorize(request)
    if ('error' in auth) return auth.error
    const instId = auth.instId

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    await pool.query(
      `DELETE FROM institution_plan_payments WHERE id = ? AND institution_id = ?`,
      [id, instId]
    )
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error deleting plan payment', details: error?.message }, { status: 500 })
  }
}