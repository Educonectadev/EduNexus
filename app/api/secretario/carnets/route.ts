import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
import { checkPlanFeature } from '@/lib/checkPlanLimit'
import { jsPDF } from 'jspdf'
import {
  generateStudentCarnetFront,
  generateStudentCarnetBack,
  StudentCarnetData,
} from '@/lib/carnet-design'

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const allowed = await checkPlanFeature(instId, 'can_carnets')
    if (!allowed) {
      return NextResponse.json({
        error: 'Carnets no disponibles en tu plan',
        upgrade_required: true
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const gradeLevel = searchParams.get('grade_level')
    const section = searchParams.get('section')

    let query = `
      SELECT s.id, s.first_name, s.last_name, s.dni, s.photo_url, s.student_code,
             e.grade_level, e.section, e.enrollment_year, e.level
      FROM students s
      JOIN enrollments e ON e.student_id = s.id
      WHERE s.institution_id = ?
    `
    const params: any[] = [instId]

    if (studentId) {
      query += ' AND s.id = ?'
      params.push(studentId)
    }
    if (gradeLevel) {
      query += ' AND e.grade_level = ?'
      params.push(gradeLevel)
    }
    if (section) {
      query += ' AND e.section = ?'
      params.push(section)
    }

    query += ' ORDER BY e.grade_level, e.section, s.last_name'

    const [students] = await pool.query(query, params) as any[]

    return NextResponse.json(students)
  } catch (error) {
    console.error('Error fetching carnet students:', error)
    return NextResponse.json({ error: 'Error fetching students' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const allowed = await checkPlanFeature(instId, 'can_carnets')
    if (!allowed) {
      return NextResponse.json({
        error: 'Carnets no disponibles en tu plan',
        upgrade_required: true
      }, { status: 403 })
    }

    const body = await request.json()
    const { student_ids } = body

    if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      return NextResponse.json({ error: 'student_ids required' }, { status: 400 })
    }

    // Fetch institution info
    const [[instInfo]] = await pool.query(
      'SELECT name, code, logo_url, address, phone, email FROM institutions WHERE id = ?',
      [instId]
    ) as any[]

    // Fetch students with enrollment info
    const placeholders = student_ids.map(() => '?').join(',')
    const [students] = await pool.query(
      `SELECT s.id, s.first_name, s.last_name, s.dni, s.photo_url, s.student_code,
              e.grade_level, e.section, e.enrollment_year, e.level, e.status
       FROM students s
       JOIN enrollments e ON e.student_id = s.id
       WHERE s.institution_id = ? AND s.id IN (${placeholders})`,
      [instId, ...student_ids]
    ) as any[]

    // Fetch institution logo as base64
    let logoBase64: string | null = null
    if (instInfo?.logo_url) {
      try {
        const response = await fetch(instInfo.logo_url)
        const blob = await response.blob()
        const buffer = await blob.arrayBuffer()
        logoBase64 = Buffer.from(buffer).toString('base64')
      } catch {}
    }

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [70, 100] })

    for (let i = 0; i < students.length; i++) {
      const student = students[i]

      // Front side
      if (i > 0) pdf.addPage([70, 100], 'portrait')

      // Fetch student photo
      let photoBase64: string | null = null
      if (student.photo_url) {
        try {
          const response = await fetch(student.photo_url)
          const blob = await response.blob()
          const buffer = await blob.arrayBuffer()
          photoBase64 = Buffer.from(buffer).toString('base64')
        } catch {}
      }

      const studentData: StudentCarnetData = {
        firstName: student.first_name,
        lastName: student.last_name,
        dni: student.dni,
        photoUrl: student.photo_url,
        gradeLevel: student.grade_level,
        section: student.section,
        enrollmentYear: student.enrollment_year,
        studentCode: student.student_code || `${instInfo?.code || ''}-${student.id.slice(0, 6).toUpperCase()}`,
        institutionName: instInfo?.name || 'Institucion',
        institutionCode: instInfo?.code || '',
        institutionLogo: instInfo?.logo_url,
        institutionAddress: instInfo?.address,
        institutionPhone: instInfo?.phone,
        institutionEmail: instInfo?.email,
        level: student.level,
        status: student.status,
      }

      await generateStudentCarnetFront(pdf, studentData, photoBase64)

      // Back side
      pdf.addPage([70, 100], 'portrait')
      await generateStudentCarnetBack(pdf, studentData)
    }

    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="carnets-${instInfo?.code || 'export'}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating carnets:', error)
    return NextResponse.json({ error: 'Error generating carnets' }, { status: 500 })
  }
}
