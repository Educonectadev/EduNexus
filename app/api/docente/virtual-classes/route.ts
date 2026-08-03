import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId, getAuthPayload } from '@/lib/resolveInstId'
import { checkPlanFeature } from '@/lib/checkPlanLimit'

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const allowed = await checkPlanFeature(instId, 'can_virtual_classes')
    if (!allowed) {
      return NextResponse.json({ 
        error: 'Clases virtuales no disponibles en tu plan',
        upgrade_required: true 
      }, { status: 403 })
    }

    const user = await getAuthPayload(request)
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')

    let query = `
      SELECT vc.*, c.name as course_name, u.full_name as teacher_name
      FROM virtual_classes vc
      LEFT JOIN courses c ON c.id = vc.course_id
      LEFT JOIN users u ON u.id = vc.teacher_id
      WHERE vc.institution_id = ?
    `
    const params: any[] = [instId]

    if (user?.role === 'docente') {
      query += ' AND vc.teacher_id = ?'
      params.push(user.id)
    }

    if (courseId) {
      query += ' AND vc.course_id = ?'
      params.push(courseId)
    }

    query += ' ORDER BY vc.class_date DESC, vc.class_time DESC'

    const [classes] = await pool.query(query, params) as any[]

    return NextResponse.json(classes)
  } catch (error) {
    console.error('Error fetching virtual classes:', error)
    return NextResponse.json({ error: 'Error fetching classes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const allowed = await checkPlanFeature(instId, 'can_virtual_classes')
    if (!allowed) {
      return NextResponse.json({ 
        error: 'Clases virtuales no disponibles en tu plan',
        upgrade_required: true 
      }, { status: 403 })
    }

    const user = await getAuthPayload(request)
    if (!user || user.role !== 'docente') {
      return NextResponse.json({ error: 'Solo docentes pueden crear clases' }, { status: 403 })
    }

    const body = await request.json()
    const { course_id, title, description, meeting_url, platform, class_date, class_time, duration_minutes } = body

    if (!course_id || !title || !meeting_url || !class_date || !class_time) {
      return NextResponse.json({ error: 'course_id, title, meeting_url, class_date, class_time required' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO virtual_classes (id, institution_id, course_id, teacher_id, title, description, meeting_url, platform, class_date, class_time, duration_minutes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
      [id, instId, course_id, user.id, title, description || '', meeting_url, platform || 'zoom', class_date, class_time, duration_minutes || 60]
    )

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('Error creating virtual class:', error)
    return NextResponse.json({ error: 'Error creating class' }, { status: 500 })
  }
}
