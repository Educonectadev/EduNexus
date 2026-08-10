import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import pool from '@/lib/db'
import crypto from 'crypto'

// Autenticado: crea una solicitud de contratación tras vencer el trial.
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('cookie')?.match(/token=([^;]+)/)?.[1]
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'educonecta-secret')
    const { payload } = await jwtVerify(token, secret)

    const { message } = await request.json()

    let fullName = ''
    let email = ''
    let role = ''
    let userPhone = ''
    let institutionName = ''

    if (payload.userId) {
      const [users] = await pool.query(
        'SELECT full_name, email, phone, role FROM users WHERE id = ?',
        [payload.userId]
      ) as any[]
      const u = users?.[0]
      if (u) {
        fullName = u.full_name || ''
        email = u.email || ''
        userPhone = u.phone || ''
        role = u.role || ''
      }
    }

    if (payload.institutionId) {
      const [insts] = await pool.query(
        'SELECT name FROM institutions WHERE id = ?',
        [payload.institutionId]
      ) as any[]
      institutionName = insts?.[0]?.name || ''
    }

    // Evita spam: una sola solicitud pendiente por usuario (el dev la resuelve).
    try {
      const [pendingRows] = await pool.query(
        `SELECT id FROM trial_requests WHERE user_id = ? AND status = 'pending' LIMIT 1`,
        [payload.userId || null]
      ) as any[]
      if (pendingRows.length > 0) {
        return NextResponse.json({ error: 'Ya tienes una solicitud pendiente' }, { status: 429 })
      }
    } catch { /* table may not exist yet */ }

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO trial_requests (id, institution_id, user_id, full_name, email, phone, institution_name, message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [id, payload.institutionId || null, payload.userId || null, fullName, email, userPhone, institutionName, message || null]
    ).catch(() => {})

    // Notificación para el dev (revisar pago y activar plan)
    await pool.query(
      `INSERT INTO notifications (id, user_id, institution_id, title, message, type, target_role, status)
       VALUES (?, ?, ?, ?, ?, 'trial_request', 'dev', 'active')`,
      [crypto.randomUUID(), null, payload.institutionId || null, 'Nueva solicitud de contratación', (role + ' solicitó activar el plan de ' + institutionName).trim()]
    ).catch(() => {})

    return NextResponse.json({ success: true, message: 'Solicitud enviada. Te contactaremos pronto.' })
  } catch (error) {
    console.error('Error creating trial request:', error)
    return NextResponse.json({ error: 'Error al enviar solicitud' }, { status: 500 })
  }
}