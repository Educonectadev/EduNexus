import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId, getAuthPayload } from '@/lib/resolveInstId'
import { checkPlanFeature } from '@/lib/checkPlanLimit'
import { notifyUsers } from '@/lib/notify'

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const allowed = await checkPlanFeature(instId, 'can_chat')
    if (!allowed) {
      return NextResponse.json({ 
        error: 'Chat no disponible en tu plan',
        upgrade_required: true 
      }, { status: 403 })
    }

    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contact_id')
    const courseId = searchParams.get('course_id')

    if (contactId) {
      const [messages] = await pool.query(
        `SELECT cm.*, u.full_name as sender_name
         FROM chat_messages cm
         JOIN users u ON u.id = cm.sender_id
         WHERE cm.institution_id = ?
           AND ((cm.sender_id = ? AND cm.receiver_id = ?) OR (cm.sender_id = ? AND cm.receiver_id = ?))
         ORDER BY cm.created_at ASC
         LIMIT 100`,
        [instId, user.id, contactId, contactId, user.id]
      ) as any[]

      await pool.query(
        `UPDATE chat_messages SET is_read = 1 
         WHERE institution_id = ? AND sender_id = ? AND receiver_id = ? AND is_read = 0`,
        [instId, contactId, user.id]
      )

      return NextResponse.json(messages)
    }

    if (courseId) {
      const [messages] = await pool.query(
        `SELECT cm.*, u.full_name as sender_name
         FROM chat_messages cm
         JOIN users u ON u.id = cm.sender_id
         WHERE cm.institution_id = ? AND cm.course_id = ?
         ORDER BY cm.created_at DESC
         LIMIT 50`,
        [instId, courseId]
      ) as any[]

      return NextResponse.json(messages.reverse())
    }

    const [contacts] = await pool.query(
      `SELECT DISTINCT
        u.id,
        u.full_name,
        u.role,
        COUNT(CASE WHEN cm.sender_id = u.id AND cm.receiver_id = ? AND cm.is_read = 0 THEN 1 END) as unread_count,
        MAX(cm.created_at) as last_message_at
       FROM users u
       LEFT JOIN chat_messages cm ON 
         (cm.sender_id = u.id AND cm.receiver_id = ?) OR 
         (cm.sender_id = ? AND cm.receiver_id = u.id)
       WHERE u.institution_id = ? AND u.id != ? AND u.role IN ('docente', 'padre')
       GROUP BY u.id, u.full_name, u.role
       ORDER BY last_message_at DESC`,
      [user.id, user.id, user.id, instId, user.id]
    ) as any[]

    return NextResponse.json(contacts)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Error fetching messages' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const allowed = await checkPlanFeature(instId, 'can_chat')
    if (!allowed) {
      return NextResponse.json({ 
        error: 'Chat no disponible en tu plan',
        upgrade_required: true 
      }, { status: 403 })
    }

    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const { receiver_id, course_id, message, message_type } = body

    if (!message || (!receiver_id && !course_id)) {
      return NextResponse.json({ error: 'message and receiver_id or course_id required' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO chat_messages (id, institution_id, sender_id, receiver_id, course_id, message, message_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, instId, user.id, receiver_id || null, course_id || null, message, message_type || 'text']
    )

    // Aviso en campana cuando el destinatario es un padre (mensaje directo)
    if (receiver_id) {
      try {
        const [rRows] = await pool.query(
          `SELECT role, full_name FROM users WHERE id = ? AND institution_id = ?`,
          [receiver_id, instId]
        ) as any[]
        const receiver = (rRows as any[])[0]
        if (receiver && receiver.role === 'padre') {
          notifyUsers(instId, [receiver_id], 'Nuevo mensaje', `${user.fullName || 'Docente'} te escribió: "${String(message).slice(0, 120)}"`, 'message', 'mensajes', 'media')
        }
      } catch { /* el aviso es opcional */ }
    }

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Error sending message' }, { status: 500 })
  }
}
