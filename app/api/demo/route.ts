import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import crypto from 'crypto'

// Public endpoint - anyone can submit a demo request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { full_name, email, phone, institution_name, institution_type, level, estimated_students, message } = body

    if (!full_name || !email) {
      return NextResponse.json({ error: 'Nombre y email son requeridos' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    // Check if already submitted recently (same email in last 24h)
    const [existing] = await pool.query(
      `SELECT id FROM demo_requests WHERE email = ? AND created_at > NOW() - INTERVAL '24 hours'`,
      [email]
    ) as any[]

    if (existing.length > 0) {
      return NextResponse.json({ 
        error: 'Ya tienes una solicitud reciente. Espera 24 horas para enviar otra.' 
      }, { status: 429 })
    }

    // Si el email o el nombre de la institución ya pertenecen a un cliente
    // (institución con plan, usuario, o solicitud de contratación en curso),
    // no se crea solicitud de demo ni se avisa al dev.
    const norm = (s: string) =>
      String(s || '').toLowerCase().trim().replace(/\s+/g, ' ')

    let existingCustomer: any[] = []
    try {
      const [customerRows] = await pool.query(
        `SELECT src FROM (
           SELECT 'inst' AS src FROM institutions
           WHERE status = 'active' AND plan_id IS NOT NULL
             AND (LOWER(TRIM(email)) = ? OR translate(LOWER(TRIM(name)), 'áéíóúü', 'aeiou') = translate(?, 'áéíóúü', 'aeiou'))
           UNION ALL
           SELECT 'user' AS src FROM users
           WHERE LOWER(TRIM(email)) = ?
           UNION ALL
           SELECT 'trial' AS src FROM trial_requests
           WHERE LOWER(TRIM(email)) = ?
           LIMIT 1
         ) t`,
        [norm(email), norm(institution_name || ''), norm(email), norm(email)]
      ) as any[]
      existingCustomer = customerRows || []
    } catch (error) {
      console.error('Error chequeando cliente existente:', error)
    }

    if (existingCustomer.length > 0) {
      return NextResponse.json({
        success: true,
        already_customer: true,
        message: 'El colegio ya cuenta con un plan activo. No registramos la solicitud de demo.',
      })
    }

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO demo_requests (id, full_name, email, phone, institution_name, institution_type, level, estimated_students, message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, full_name, email, phone || null, institution_name || null, institution_type || 'private', level || 'all', estimated_students || 0, message || null]
    )

    // Avisa al dev en tiempo real (sala global notif:dev)
    await pool.query(
      `INSERT INTO notifications (id, user_id, institution_id, title, message, type, target_role, status)
       VALUES (?, NULL, NULL, 'Nueva solicitud de demo', ?, 'demo_request', 'dev', 'active')`,
      [crypto.randomUUID(), `${full_name}${institution_name ? ' · ' + institution_name : ''} solicitó una demo`]
    ).catch(() => {})

    return NextResponse.json({ 
      success: true, 
      message: 'Solicitud enviada correctamente. Nos contactaremos contigo pronto.',
      id 
    })
  } catch (error) {
    console.error('Error creating demo request:', error)
    return NextResponse.json({ error: 'Error al enviar solicitud' }, { status: 500 })
  }
}
