import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload, resolveInstId } from '@/lib/resolveInstId'
import { checkPlanFeature } from '@/lib/checkPlanLimit'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'Sin institucion' }, { status: 400 })

    const allowed = await checkPlanFeature(instId, 'can_export_reports')
    if (!allowed) {
      return NextResponse.json({ 
        error: 'Exportación de reportes no disponible en tu plan',
        upgrade_required: true 
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'resumen'
    const fromDate = searchParams.get('from') || ''

    switch (type) {
      case 'resumen': {
        const [students] = await pool.query(
          'SELECT COUNT(*) as count FROM students s JOIN enrollments e ON e.student_id = s.id WHERE e.status = ? AND e.institution_id = ?',
          ['active', instId]
        )
        const [teachers] = await pool.query(
          'SELECT COUNT(*) as count FROM users WHERE role = ? AND status = ? AND institution_id = ?',
          ['docente', 'active', instId]
        )
        const [enrollments] = await pool.query(
          'SELECT COUNT(*) as count FROM enrollments WHERE status = ? AND institution_id = ?',
          ['active', instId]
        )
        const [parents] = await pool.query(
          'SELECT COUNT(*) as count FROM users WHERE role = ? AND status = ? AND institution_id = ?',
          ['padre', 'active', instId]
        )
        const [secretary] = await pool.query(
          'SELECT COUNT(*) as count FROM users WHERE role = ? AND status = ? AND institution_id = ?',
          ['secretario', 'active', instId]
        )
        const [documents] = await pool.query(
          'SELECT COUNT(*) as count FROM documents WHERE institution_id = ?',
          [instId]
        )
        const [meetings] = await pool.query(
          'SELECT COUNT(*) as count FROM notifications WHERE type = ? AND institution_id = ?',
          ['meeting', instId]
        )
        const [byGrade] = await pool.query(
          `SELECT s.grade, COUNT(*) as count FROM students s
           JOIN enrollments e ON e.student_id = s.id
           WHERE e.status = 'active' AND e.institution_id = ?
           GROUP BY s.grade ORDER BY s.grade`,
          [instId]
        )
        return NextResponse.json({
          title: 'Resumen general',
          data: {
            students: (students as any)[0].count,
            teachers: (teachers as any)[0].count,
            enrollments: (enrollments as any)[0].count,
            parents: (parents as any)[0].count,
            secretary: (secretary as any)[0].count,
            documents: (documents as any)[0].count || 0,
            meetings: (meetings as any)[0].count || 0,
            byGrade: byGrade as any[],
          },
        })
      }

      case 'staff': {
        const [staff] = await pool.query(
          `SELECT u.full_name, u.email, u.dni, u.phone, u.role, u.subject, u.status, u.created_at,
                  COALESCE(u.contract_type, '') as contract_type, COALESCE(u.grade_level, '') as grade_level
           FROM users u
           WHERE u.role IN ('docente', 'secretario', 'director') AND u.institution_id = ?
           ORDER BY u.role, u.full_name`,
          [instId]
        )
        return NextResponse.json({ title: 'Reporte de personal', data: staff })
      }

      case 'alumnos': {
        const [students] = await pool.query(
          `SELECT s.id, s.code, CONCAT(s.first_name, ' ', s.last_name) as full_name,
                  s.document_number, s.grade, s.section, s.gender, s.status, s.birth_date,
                  COALESCE(e.year, '') as enrollment_year
           FROM students s
           LEFT JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
           WHERE e.institution_id = ?
           ORDER BY s.grade, s.section, s.first_name`,
          [instId]
        )
        const [byGrade] = await pool.query(
          `SELECT s.grade, COUNT(*) as count FROM students s
           JOIN enrollments e ON e.student_id = s.id
           WHERE e.status = 'active' AND e.institution_id = ?
           GROUP BY s.grade ORDER BY s.grade`,
          [instId]
        )
        const [byGender] = await pool.query(
          `SELECT s.gender, COUNT(*) as count FROM students s
           JOIN enrollments e ON e.student_id = s.id
           WHERE e.status = 'active' AND e.institution_id = ?
           GROUP BY s.gender`,
          [instId]
        )
        return NextResponse.json({
          title: 'Reporte de alumnos',
          data: { students, byGrade: byGrade as any[], byGender: byGender as any[] },
        })
      }

      case 'matricula': {
        const dateFilter = fromDate ? ` AND e.created_at >= ?` : ''
        const params = [instId, ...(fromDate ? [fromDate] : [])]

        const [enrollments] = await pool.query(
          `SELECT e.id, CONCAT(s.first_name, ' ', s.last_name) as student_name,
                  s.document_number, e.grade, e.section, e.year, e.status, e.created_at
           FROM enrollments e
           JOIN students s ON e.student_id = s.id
           WHERE e.institution_id = ?${dateFilter}
           ORDER BY e.created_at DESC`,
          params
        )
        return NextResponse.json({ title: 'Reporte de matricula', data: enrollments })
      }

      case 'reuniones': {
        const [meetings] = await pool.query(
          `SELECT title, message, meeting_date, meeting_time, target_role, status, created_at
           FROM notifications WHERE type = 'meeting' AND institution_id = ?
           ORDER BY meeting_date DESC`,
          [instId]
        )
        return NextResponse.json({ title: 'Reporte de reuniones', data: meetings })
      }

      case 'documentos': {
        const [docs] = await pool.query(
          `SELECT d.id, d.type, d.status, d.created_at,
                  CONCAT(s.first_name, ' ', s.last_name) as student_name
           FROM documents d
           LEFT JOIN students s ON d.student_id = s.id
           WHERE d.institution_id = ?
           ORDER BY d.created_at DESC`,
          [instId]
        )
        const [byType] = await pool.query(
          'SELECT type, COUNT(*) as count FROM documents WHERE institution_id = ? GROUP BY type ORDER BY count DESC',
          [instId]
        )
        return NextResponse.json({
          title: 'Reporte de documentos',
          data: { docs, byType: byType as any[] },
        })
      }

      default:
        return NextResponse.json({ error: 'Tipo de reporte no valido' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Error generando reporte' }, { status: 500 })
  }
}
