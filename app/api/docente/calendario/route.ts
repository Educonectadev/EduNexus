import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload } from '@/lib/resolveInstId'
import { checkPlanFeature } from '@/lib/checkPlanLimit'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'docente') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const userId = user.id as string
    const instId = user.institutionId as string

    const allowed = await checkPlanFeature(instId, 'can_attendance')
    if (!allowed) {
      return NextResponse.json({ error: 'Calendario no disponible en tu plan' }, { status: 403 })
    }

    // Weekly schedule (classes) from horarios
    const [horarios] = await pool.query(
      `SELECT h.id, h.course_id, h.day_of_week, h.start_time, h.end_time, h.classroom,
              c.name as course_name, c.grade, c.section
       FROM horarios h
       JOIN courses c ON h.course_id = c.id
       JOIN teachers t ON c.teacher_id = t.id
       WHERE t.user_id = ? AND h.status = 'active'
       ORDER BY h.day_of_week, h.start_time`,
      [userId]
    ) as any[]

    // Institution events / meetings from notifications
    const [notifications] = await pool.query(
      `SELECT id, title, message, type, category, target_role, meeting_date, meeting_time, location, virtual_link, created_at
       FROM notifications
       WHERE institution_id = ? AND status = 'active'
         AND meeting_date IS NOT NULL
         AND (target_role = 'all' OR target_role = 'docente' OR target_role = '')
       ORDER BY meeting_date ASC, meeting_time ASC`,
      [instId]
    ) as any[]

    // Virtual classes scheduled by this docente
    const [virtualClasses] = await pool.query(
      `SELECT vc.id, vc.course_id, vc.title, vc.description, vc.meeting_url, vc.platform, vc.class_date, vc.class_time,
              vc.duration_minutes, vc.status, c.name as course_name
       FROM virtual_classes vc
       LEFT JOIN courses c ON c.id = vc.course_id
       WHERE vc.institution_id = ? AND vc.teacher_id = ? AND vc.status = 'scheduled'
       ORDER BY vc.class_date ASC, vc.class_time ASC`,
      [instId, userId]
    ) as any[]

    const events: any[] = []

    for (const h of horarios) {
      events.push({
        id: `class-${h.id}`,
        title: h.course_name,
        subtitle: `${h.grade} · Sección ${h.section}`,
        type: 'class',
        day_of_week: h.day_of_week,
        start_time: (h.start_time as string).slice(0, 5),
        end_time: (h.end_time as string).slice(0, 5),
        classroom: h.classroom,
        course_id: h.course_id,
        date: null,
      })
    }

    for (const n of notifications) {
      const rawType = String(n.type || n.category || '').toLowerCase()
      let type = 'event'
      if (rawType.includes('examen') || rawType.includes('exam')) type = 'exam'
      else if (rawType.includes('reunion') || rawType.includes('meet') || n.category === 'reunion') type = 'meeting'
      events.push({
        id: `notif-${n.id}`,
        title: n.title,
        subtitle: n.message || n.location || null,
        type,
        date: n.meeting_date instanceof Date ? n.meeting_date.toISOString().slice(0, 10) : String(n.meeting_date).slice(0, 10),
        start_time: n.meeting_time ? (n.meeting_time as string).slice(0, 5) : null,
        location: n.location,
        meeting_url: n.virtual_link,
      })
    }

    for (const vc of virtualClasses) {
      events.push({
        id: `virtual-${vc.id}`,
        title: vc.title,
        subtitle: vc.course_name || vc.platform,
        type: 'virtual',
        date: vc.class_date instanceof Date ? vc.class_date.toISOString().slice(0, 10) : String(vc.class_date).slice(0, 10),
        start_time: vc.class_time ? (vc.class_time as string).slice(0, 5) : null,
        meeting_url: vc.meeting_url,
        platform: vc.platform,
      })
    }

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching calendario:', error)
    return NextResponse.json({ error: 'Error fetching calendario' }, { status: 500 })
  }
}
