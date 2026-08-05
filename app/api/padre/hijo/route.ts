import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getPadreUserId, getPadreChildrenIds, getPadreInstitutionId } from '@/lib/getPadreInfo'
import { checkPlanFeature } from '@/lib/checkPlanLimit'

export async function GET(request: NextRequest) {
  try {
    const userId = await getPadreUserId(request)
    if (!userId) return NextResponse.json({ children: [], error: 'No autenticado' }, { status: 401 })

    const instId = await getPadreInstitutionId(request)
    const allowed = await checkPlanFeature(instId || '', 'can_parents_portal')
    if (!allowed) {
      return NextResponse.json({ error: 'Portal de padres no disponible en tu plan', upgrade_required: true }, { status: 403 })
    }

    const childrenIds = await getPadreChildrenIds(userId)

    if (childrenIds.length === 0) {
      return NextResponse.json({ children: [], message: 'No se encontraron hijos vinculados a esta cuenta' })
    }

    const placeholders = childrenIds.map(() => '?').join(',')

    const [colRows] = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1`,
      ['students']
    ) as any[]
    const studentCols = (colRows || []).map((c: any) => c.column_name)

    const selectCols = ['s.id', 's.first_name', 's.last_name', 's.document_number', 's.grade', 's.section', 's.status']
    if (studentCols.includes('academic_condition')) selectCols.push('s.academic_condition')

    const [rows] = await pool.query(
      `SELECT ${selectCols.join(', ')}
       FROM students s
       WHERE s.id IN (${placeholders}) AND s.status = 'active'`,
      childrenIds
    )

    const students = rows as any[]

    const [tableRows] = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() ORDER BY table_name`
    ) as any[]
    const tables = (tableRows || []).map((r: any) => r.table_name as string)
    const hasGrades = tables.includes('grades')
    const hasAttendance = tables.includes('attendance')

    const result = []

    for (const student of students) {
      let gradeList: any[] = []
      if (hasGrades) {
        try {
          const [grades] = await pool.query(
            `SELECT subject_name as subject, score as grade, term FROM grades WHERE student_id = ? ORDER BY created_at DESC LIMIT 6`,
            [student.id]
          )
          gradeList = (grades as any[]).length > 0 ? (grades as any[]) : []
        } catch {}
      }

      let attendancePct = 0
      if (hasAttendance) {
        try {
          const [attendance] = await pool.query(
            `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
             FROM attendance WHERE student_id = ? AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)`,
            [student.id]
          )
          const att = (attendance as any[])[0] || {}
          attendancePct = att.total ? Math.round(((att.present || 0) / att.total) * 100) : 0
        } catch {}
      }

      const avg = gradeList.length > 0
        ? (gradeList.reduce((sum: number, g: any) => sum + (g.grade || 0), 0) / gradeList.length).toFixed(1)
        : '0'

      result.push({
        ...student,
        course: `${student.grade} ${student.section}`,
        grades: gradeList,
        average: parseFloat(avg),
        attendance_pct: attendancePct,
      })
    }

    return NextResponse.json({ children: result })
  } catch (error) {
    console.error('Error fetching padre children:', error)
    return NextResponse.json({ children: [], error: 'Error al obtener datos' }, { status: 500 })
  }
}
