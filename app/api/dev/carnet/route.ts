import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'

const C = {
  white: [255, 255, 255] as [number, number, number],
  bg: [248, 250, 252] as [number, number, number],
  primary: [59, 130, 246] as [number, number, number],
  primaryLight: [219, 234, 254] as [number, number, number],
  text: [15, 23, 42] as [number, number, number],
  textMuted: [100, 116, 139] as [number, number, number],
  textLight: [148, 163, 184] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  borderLight: [241, 245, 249] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  successBg: [220, 252, 231] as [number, number, number],
}

function roundedRect(pdf: jsPDF, x: number, y: number, w: number, h: number, r: number, style: string = 'F') {
  pdf.roundedRect(x, y, w, h, r, r, style)
}

async function generateQRDataURL(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 200,
    margin: 1,
    color: { dark: '#0f172a', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })
}

export async function GET(request: NextRequest) {
  try {
    const [[devUser]] = await pool.query(
      "SELECT id, full_name, email, dni FROM users WHERE role = 'dev' LIMIT 1"
    ) as any[]

    if (!devUser) {
      return NextResponse.json({ error: 'Dev user not found' }, { status: 404 })
    }

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [70, 100] })

    // Background
    pdf.setFillColor(...C.bg)
    pdf.rect(0, 0, 70, 100, 'F')

    // Subtle patterns
    pdf.setFillColor(232, 240, 254)
    pdf.circle(62, -3, 12, 'F')
    pdf.circle(-2, 95, 8, 'F')
    pdf.setFillColor(219, 234, 254)
    for (let i = 0; i < 5; i++) {
      pdf.circle(8 + i * 14, 4, 0.8, 'F')
    }

    // Card
    pdf.setFillColor(...C.white)
    roundedRect(pdf, 4, 6, 62, 88, 4, 'F')
    pdf.setDrawColor(...C.border)
    pdf.setLineWidth(0.2)
    pdf.roundedRect(4, 6, 62, 88, 4, 4, 'S')

    // Top accent
    pdf.setFillColor(...C.primary)
    roundedRect(pdf, 4, 6, 62, 4, 4, 'F')
    pdf.rect(4, 8, 62, 2, 'F')

    // Logo
    pdf.setFillColor(...C.primaryLight)
    roundedRect(pdf, 8, 12, 10, 10, 2, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(6)
    pdf.setTextColor(...C.primary)
    pdf.text('EC', 13, 18, { align: 'center' })

    // Brand
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7)
    pdf.setTextColor(...C.text)
    pdf.text('EDUCONECTA', 21, 16)
    pdf.setFontSize(4)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...C.textMuted)
    pdf.text('Desarrollador', 21, 20)

    // Badge
    pdf.setFillColor(...C.primaryLight)
    roundedRect(pdf, 52, 13, 10, 5, 2.5, 'F')
    pdf.setFontSize(3.5)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...C.primary)
    pdf.text('DEV', 57, 16.2, { align: 'center' })

    // Avatar
    const avatarX = 22
    const avatarY = 28
    const avatarW = 26
    const avatarH = 28

    // Photo frame
    pdf.setFillColor(220, 225, 235)
    roundedRect(pdf, avatarX + 0.5, avatarY + 0.5, avatarW, avatarH, 4, 'F')
    pdf.setFillColor(...C.white)
    roundedRect(pdf, avatarX - 1, avatarY - 1, avatarW + 2, avatarH + 2, 5, 'F')
    pdf.setDrawColor(...C.primary)
    pdf.setLineWidth(0.4)
    pdf.roundedRect(avatarX - 1, avatarY - 1, avatarW + 2, avatarH + 2, 5, 5, 'S')

    // Initials in avatar
    const initials = devUser.full_name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
    pdf.setFillColor(...C.primary)
    pdf.rect(avatarX, avatarY, avatarW, avatarH, 'F')
    roundedRect(pdf, avatarX, avatarY, avatarW, avatarH, 4, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(14)
    pdf.setTextColor(...C.white)
    pdf.text(initials, avatarX + avatarW / 2, avatarY + avatarH / 2 + 2, { align: 'center' })

    // Name
    const nameY = 60
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.setTextColor(...C.text)
    pdf.text(devUser.full_name.toUpperCase(), 35, nameY, { align: 'center' })

    pdf.setFontSize(4)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...C.textMuted)
    pdf.text('Desarrollador Educonecta', 35, nameY + 4.5, { align: 'center' })

    // Info fields
    const fieldsY = 67
    // DNI
    pdf.setFillColor(...C.borderLight)
    roundedRect(pdf, 8, fieldsY, 54, 5.5, 1.5, 'F')
    pdf.setFontSize(3)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...C.textLight)
    pdf.text('DNI', 11, fieldsY + 2)
    pdf.setFontSize(5)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...C.text)
    pdf.text(devUser.dni || '---', 11, fieldsY + 4.5)

    // Status
    pdf.setFillColor(...C.borderLight)
    roundedRect(pdf, 8, fieldsY + 7, 54, 5.5, 1.5, 'F')
    pdf.setFontSize(3)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...C.textLight)
    pdf.text('ESTADO', 11, fieldsY + 9)
    pdf.setFillColor(...C.successBg)
    roundedRect(pdf, 11, fieldsY + 10.5, 14, 3, 1.5, 'F')
    pdf.setFontSize(3.5)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...C.success)
    pdf.text('Activo', 18, fieldsY + 12.6, { align: 'center' })

    // QR
    try {
      const qrData = await generateQRDataURL(devUser.email || 'dev@educonecta.pe')
      pdf.addImage(qrData, 'PNG', 48, 74, 12, 12)
    } catch {
      pdf.setFillColor(...C.borderLight)
      pdf.rect(48, 74, 12, 12, 'F')
      pdf.setFontSize(3)
      pdf.setTextColor(...C.textLight)
      pdf.text('QR', 54, 80, { align: 'center' })
    }

    // Footer
    pdf.setFontSize(3)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...C.textLight)
    pdf.text('Acceso total al sistema', 35, 90, { align: 'center' })

    // Bottom accent
    pdf.setFillColor(...C.primary)
    roundedRect(pdf, 4, 91, 62, 4, 4, 'F')
    pdf.rect(4, 93, 62, 2, 'F')

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
