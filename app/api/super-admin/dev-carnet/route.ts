import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload } from '@/lib/resolveInstId'
import { jsPDF } from 'jspdf'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user || (user.role !== 'super_admin' && user.role !== 'dev')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const [[devUser]] = await pool.query(
      'SELECT id, full_name, email, dni FROM users WHERE id = ?',
      [user.id]
    ) as any[]

    if (!devUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 53.98] })

    pdf.setFillColor(240, 240, 245)
    pdf.rect(0, 0, 85.6, 53.98, 'F')

    pdf.setFillColor(41, 98, 255)
    pdf.rect(0, 0, 85.6, 14, 'F')

    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    pdf.text('EDUCONECTA', 4, 5.5)
    pdf.setFontSize(5)
    pdf.setFont('helvetica', 'normal')
    pdf.text('Plataforma Educativa Digital', 4, 9.5)

    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'bold')
    pdf.text('CARNET DEV', 60, 5.5)
    pdf.setFontSize(5)
    pdf.setFont('helvetica', 'normal')
    pdf.text('Desarrollador', 60, 9.5)

    pdf.setTextColor(50, 50, 50)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text(devUser.full_name.toUpperCase(), 43, 22, { align: 'center' })

    pdf.setFontSize(6)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Email: ${devUser.email}`, 43, 27, { align: 'center' })

    if (devUser.dni) {
      pdf.text(`DNI: ${devUser.dni}`, 43, 31, { align: 'center' })
    }

    pdf.setFontSize(5)
    pdf.text('Rol: Super Administrador', 43, 35, { align: 'center' })

    pdf.setDrawColor(41, 98, 255)
    pdf.setLineWidth(0.3)
    pdf.line(4, 40, 81.6, 40)

    pdf.setTextColor(100, 100, 100)
    pdf.setFontSize(4)
    pdf.setFont('helvetica', 'normal')
    pdf.text('Carnet generado por Educonecta - Plataforma Educativa Digital', 4, 44)
    pdf.text(`www.educonecta.pe | Acceso total al sistema`, 4, 48)

    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="carnet-dev-${devUser.full_name.replace(/\s+/g, '-').toLowerCase()}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating dev carnet:', error)
    return NextResponse.json({ error: 'Error generating carnet' }, { status: 500 })
  }
}
