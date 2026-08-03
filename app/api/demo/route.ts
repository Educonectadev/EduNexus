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
      `SELECT id FROM demo_requests WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
      [email]
    ) as any[]

    if (existing.length > 0) {
      return NextResponse.json({ 
        error: 'Ya tienes una solicitud reciente. Espera 24 horas para enviar otra.' 
      }, { status: 429 })
    }

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO demo_requests (id, full_name, email, phone, institution_name, institution_type, level, estimated_students, message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, full_name, email, phone || null, institution_name || null, institution_type || 'private', level || 'all', estimated_students || 0, message || null]
    )

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
