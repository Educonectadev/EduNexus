import jsPDF from 'jspdf'
import QRCode from 'qrcode'

// Colors
const C = {
  white: [255, 255, 255] as [number, number, number],
  bg: [248, 250, 252] as [number, number, number],
  primary: [59, 130, 246] as [number, number, number],
  primaryLight: [219, 234, 254] as [number, number, number],
  primaryDark: [37, 99, 235] as [number, number, number],
  text: [15, 23, 42] as [number, number, number],
  textMuted: [100, 116, 139] as [number, number, number],
  textLight: [148, 163, 184] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  borderLight: [241, 245, 249] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  successBg: [220, 252, 231] as [number, number, number],
  dark: [15, 23, 42] as [number, number, number],
  darkCard: [30, 41, 59] as [number, number, number],
  darkSurface: [51, 65, 85] as [number, number, number],
}

function roundedRect(pdf: jsPDF, x: number, y: number, w: number, h: number, r: number, style: string = 'F') {
  pdf.roundedRect(x, y, w, h, r, r, style)
}

function drawSubtlePatterns(pdf: jsPDF) {
  // Very light decorative circles
  pdf.setFillColor(232, 240, 254)
  pdf.circle(62, -3, 12, 'F')
  pdf.circle(-2, 95, 8, 'F')
  // Small accent dots
  pdf.setFillColor(219, 234, 254)
  for (let i = 0; i < 5; i++) {
    pdf.circle(8 + i * 14, 4, 0.8, 'F')
  }
}

function drawBackPatterns(pdf: jsPDF) {
  pdf.setFillColor(232, 240, 254)
  pdf.circle(65, 95, 15, 'F')
  pdf.circle(-5, 10, 10, 'F')
  pdf.setFillColor(219, 234, 254)
  for (let i = 0; i < 4; i++) {
    pdf.circle(60 + i * 3, 5 + i * 25, 0.6, 'F')
  }
}

export interface StudentCarnetData {
  firstName: string
  lastName: string
  dni: string
  photoUrl?: string | null
  gradeLevel: string
  section: string
  enrollmentYear: number
  studentCode: string
  institutionName: string
  institutionCode: string
  institutionLogo?: string | null
  institutionAddress?: string
  institutionPhone?: string
  institutionEmail?: string
  institutionWebsite?: string
  level?: string
  status?: 'active' | 'inactive'
}

export interface InstitutionCarnetData {
  name: string
  code: string
  directorName?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  logoUrl?: string
}

async function generateQRDataURL(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 200,
    margin: 1,
    color: { dark: '#0f172a', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })
}

function drawPhotoFrame(pdf: jsPDF, x: number, y: number, w: number, h: number) {
  // Shadow
  pdf.setFillColor(220, 225, 235)
  roundedRect(pdf, x + 0.5, y + 0.5, w, h, 4, 'F')
  // White frame
  pdf.setFillColor(...C.white)
  roundedRect(pdf, x - 1, y - 1, w + 2, h + 2, 5, 'F')
  // Blue accent border
  pdf.setDrawColor(...C.primary)
  pdf.setLineWidth(0.4)
  pdf.roundedRect(x - 1, y - 1, w + 2, h + 2, 5, 5, 'S')
}

export async function generateStudentCarnetFront(
  pdf: jsPDF,
  student: StudentCarnetData,
  photoBase64?: string | null
) {
  // Page background
  pdf.setFillColor(...C.bg)
  pdf.rect(0, 0, 70, 100, 'F')

  // Subtle patterns
  drawSubtlePatterns(pdf)

  // Main card
  pdf.setFillColor(...C.white)
  roundedRect(pdf, 4, 6, 62, 88, 4, 'F')

  // Card border
  pdf.setDrawColor(...C.border)
  pdf.setLineWidth(0.2)
  pdf.roundedRect(4, 6, 62, 88, 4, 4, 'S')

  // === HEADER ===
  // Top accent line
  pdf.setFillColor(...C.primary)
  pdf.rect(4, 6, 62, 2, 'F')
  // Round top corners
  pdf.setFillColor(...C.primary)
  roundedRect(pdf, 4, 6, 62, 4, 4, 'F')

  // Logo area
  const logoX = 8
  const logoY = 11
  if (student.institutionLogo) {
    try {
      const response = await fetch(student.institutionLogo)
      const blob = await response.blob()
      const buffer = await blob.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      pdf.addImage(`data:image/png;base64,${base64}`, 'PNG', logoX, logoY, 8, 8)
    } catch {
      pdf.setFillColor(...C.primaryLight)
      roundedRect(pdf, logoX, logoY, 8, 8, 2, 'F')
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(5)
      pdf.setTextColor(...C.primary)
      pdf.text('EC', logoX + 4, logoY + 5, { align: 'center' })
    }
  } else {
    pdf.setFillColor(...C.primaryLight)
    roundedRect(pdf, logoX, logoY, 8, 8, 2, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(5)
    pdf.setTextColor(...C.primary)
    pdf.text('EC', logoX + 4, logoY + 5, { align: 'center' })
  }

  // Institution name
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(6)
  pdf.setTextColor(...C.text)
  const instName = student.institutionName.length > 28
    ? student.institutionName.slice(0, 26) + '...'
    : student.institutionName
  pdf.text(instName, logoX + 10, logoY + 3.5)

  pdf.setFontSize(3.5)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...C.textMuted)
  pdf.text('Carnet Estudiantil', logoX + 10, logoY + 7)

  // Year badge
  const yearText = String(student.enrollmentYear || new Date().getFullYear())
  pdf.setFillColor(...C.primaryLight)
  roundedRect(pdf, 52, 12, 10, 5, 2.5, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(4)
  pdf.setTextColor(...C.primary)
  pdf.text(yearText, 57, 15.2, { align: 'center' })

  // === PHOTO ===
  const photoX = 22
  const photoY = 22
  const photoW = 26
  const photoH = 28

  drawPhotoFrame(pdf, photoX, photoY, photoW, photoH)

  if (photoBase64) {
    try {
      pdf.addImage(`data:image/jpeg;base64,${photoBase64}`, 'JPEG', photoX, photoY, photoW, photoH)
    } catch {
      pdf.setFillColor(...C.primaryLight)
      pdf.rect(photoX, photoY, photoW, photoH, 'F')
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(8)
      pdf.setTextColor(...C.primary)
      pdf.text('S/F', photoX + photoW / 2, photoY + photoH / 2, { align: 'center' })
    }
  } else {
    pdf.setFillColor(...C.primaryLight)
    pdf.rect(photoX, photoY, photoW, photoH, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.setTextColor(...C.primary)
    pdf.text('S/F', photoX + photoW / 2, photoY + photoH / 2, { align: 'center' })
  }

  // === NAME (protagonist) ===
  const nameY = 54
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.setTextColor(...C.text)
  const fullName = `${student.lastName} ${student.firstName}`
  const displayName = fullName.length > 24 ? fullName.slice(0, 22) + '...' : fullName
  pdf.text(displayName.toUpperCase(), 35, nameY, { align: 'center' })

  // Student code
  pdf.setFontSize(4)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...C.textMuted)
  pdf.text(student.studentCode, 35, nameY + 4.5, { align: 'center' })

  // === INFO FIELDS ===
  const fieldsY = 61
  const fieldW = 28
  const fieldH = 5.5

  // Left column
  // DNI
  pdf.setFillColor(...C.borderLight)
  roundedRect(pdf, 8, fieldsY, fieldW, fieldH, 1.5, 'F')
  pdf.setFontSize(3)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...C.textLight)
  pdf.text('DNI', 11, fieldsY + 2)
  pdf.setFontSize(5)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...C.text)
  pdf.text(student.dni || '---', 11, fieldsY + 4.5)

  // Grade & Section
  pdf.setFillColor(...C.borderLight)
  roundedRect(pdf, 8, fieldsY + 7, fieldW, fieldH, 1.5, 'F')
  pdf.setFontSize(3)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...C.textLight)
  pdf.text('GRADO / SECCION', 11, fieldsY + 9)
  pdf.setFontSize(5)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...C.text)
  pdf.text(`${student.gradeLevel || ''} ${student.section || ''}`.trim() || '---', 11, fieldsY + 11.5)

  // Right column
  // Level
  pdf.setFillColor(...C.borderLight)
  roundedRect(pdf, 38, fieldsY, fieldW, fieldH, 1.5, 'F')
  pdf.setFontSize(3)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...C.textLight)
  pdf.text('NIVEL', 41, fieldsY + 2)
  pdf.setFontSize(5)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...C.text)
  pdf.text(student.level || '---', 41, fieldsY + 4.5)

  // Status
  const statusY = fieldsY + 7
  pdf.setFillColor(...C.borderLight)
  roundedRect(pdf, 38, statusY, fieldW, fieldH, 1.5, 'F')
  pdf.setFontSize(3)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...C.textLight)
  pdf.text('ESTADO', 41, statusY + 2)

  // Status badge
  const isActive = student.status !== 'inactive'
  const statusColor = isActive ? C.success : [239, 68, 68] as [number, number, number]
  const statusBg = isActive ? C.successBg : [254, 226, 226] as [number, number, number]
  pdf.setFillColor(...statusBg)
  roundedRect(pdf, 41, statusY + 3, 14, 3, 1.5, 'F')
  pdf.setFontSize(3.5)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...statusColor)
  pdf.text(isActive ? 'Activo' : 'Inactivo', 48, statusY + 5.1, { align: 'center' })

  // === QR CODE ===
  try {
    const qrData = await generateQRDataURL(student.studentCode || student.dni || 'N/A')
    pdf.addImage(qrData, 'PNG', 48, 64, 12, 12)
  } catch {
    pdf.setFillColor(...C.borderLight)
    pdf.rect(48, 64, 12, 12, 'F')
    pdf.setFontSize(3)
    pdf.setTextColor(...C.textLight)
    pdf.text('QR', 54, 70, { align: 'center' })
  }

  // === FOOTER ===
  pdf.setFontSize(3)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...C.textLight)
  pdf.text('Vigente hasta: Diciembre ' + (student.enrollmentYear || new Date().getFullYear()), 35, 82, { align: 'center' })

  // Bottom accent
  pdf.setFillColor(...C.primary)
  pdf.rect(4, 92, 62, 2, 'F')
  pdf.setFillColor(...C.primary)
  roundedRect(pdf, 4, 91, 62, 4, 4, 'F')
}

export async function generateStudentCarnetBack(
  pdf: jsPDF,
  student: StudentCarnetData
) {
  // Page background
  pdf.setFillColor(...C.bg)
  pdf.rect(0, 0, 70, 100, 'F')

  drawBackPatterns(pdf)

  // Main card
  pdf.setFillColor(...C.white)
  roundedRect(pdf, 4, 6, 62, 88, 4, 'F')
  pdf.setDrawColor(...C.border)
  pdf.setLineWidth(0.2)
  pdf.roundedRect(4, 6, 62, 88, 4, 4, 'S')

  // Top accent
  pdf.setFillColor(...C.primary)
  roundedRect(pdf, 4, 6, 62, 4, 4, 'F')
  pdf.rect(4, 8, 62, 2, 'F')

  // Large QR
  try {
    const qrData = await generateQRDataURL(student.studentCode || student.dni || 'N/A')
    pdf.addImage(qrData, 'PNG', 18, 14, 34, 34)
  } catch {
    pdf.setFillColor(...C.borderLight)
    pdf.rect(18, 14, 34, 34, 'F')
    pdf.setFontSize(6)
    pdf.setTextColor(...C.textLight)
    pdf.text('QR Code', 35, 32, { align: 'center' })
  }

  // Student name under QR
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(6)
  pdf.setTextColor(...C.text)
  const fullName = `${student.lastName} ${student.firstName}`
  pdf.text(fullName.toUpperCase(), 35, 52, { align: 'center' })

  // Divider
  pdf.setFillColor(...C.borderLight)
  pdf.rect(10, 55, 50, 0.3, 'F')

  // Contact info
  const contactY = 59
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(4)
  pdf.setTextColor(...C.primary)
  pdf.text('INFORMACION DE CONTACTO', 35, contactY, { align: 'center' })

  const infoY = contactY + 5
  const items = [
    { label: 'Institucion', value: student.institutionName },
    { label: 'Direccion', value: student.institutionAddress || '---' },
    { label: 'Telefono', value: student.institutionPhone || '---' },
    { label: 'Correo', value: student.institutionEmail || '---' },
    { label: 'Sitio Web', value: student.institutionWebsite || '---' },
  ]

  items.forEach((item, i) => {
    const y = infoY + i * 5
    pdf.setFontSize(3)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...C.textLight)
    pdf.text(item.label.toUpperCase(), 10, y)
    pdf.setFontSize(4)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...C.text)
    const val = item.value.length > 35 ? item.value.slice(0, 33) + '...' : item.value
    pdf.text(val, 10, y + 3)
  })

  // Disclaimer
  pdf.setFillColor(...C.borderLight)
  roundedRect(pdf, 8, 86, 54, 6, 2, 'F')
  pdf.setFontSize(3)
  pdf.setFont('helvetica', 'italic')
  pdf.setTextColor(...C.textMuted)
  pdf.text('Este carnet es personal e intransferible.', 35, 88.5, { align: 'center' })
  pdf.text('Debe ser presentado al ingresar a la institucion.', 35, 91, { align: 'center' })

  // Bottom accent
  pdf.setFillColor(...C.primary)
  roundedRect(pdf, 4, 91, 62, 4, 4, 'F')
  pdf.rect(4, 93, 62, 2, 'F')
}

export async function generateInstitutionCarnetFront(
  pdf: jsPDF,
  inst: InstitutionCarnetData,
  logoBase64?: string | null
) {
  pdf.setFillColor(...C.bg)
  pdf.rect(0, 0, 70, 100, 'F')
  drawSubtlePatterns(pdf)

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
  const logoX = 22
  const logoY = 14
  if (logoBase64) {
    try {
      pdf.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', logoX, logoY, 26, 20)
    } catch {
      pdf.setFillColor(...C.primaryLight)
      roundedRect(pdf, logoX, logoY, 26, 20, 3, 'F')
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(8)
      pdf.setTextColor(...C.primary)
      pdf.text('EC', logoX + 13, logoY + 12, { align: 'center' })
    }
  } else {
    pdf.setFillColor(...C.primaryLight)
    roundedRect(pdf, logoX, logoY, 26, 20, 3, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.setTextColor(...C.primary)
    pdf.text('EC', logoX + 13, logoY + 12, { align: 'center' })
  }

  // Institution name
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(...C.text)
  const name = inst.name.length > 30 ? inst.name.slice(0, 28) + '...' : inst.name
  pdf.text(name.toUpperCase(), 35, 40, { align: 'center' })

  // Code
  pdf.setFontSize(4)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...C.textMuted)
  pdf.text(`Codigo: ${inst.code}`, 35, 44.5, { align: 'center' })

  // Info fields
  const fieldsY = 49
  const fields = [
    { label: 'DIRECTOR', value: inst.directorName || '---' },
    { label: 'DIRECCION', value: inst.address || '---' },
    { label: 'TELEFONO', value: inst.phone || '---' },
    { label: 'CORREO', value: inst.email || '---' },
  ]

  fields.forEach((field, i) => {
    const y = fieldsY + i * 7
    pdf.setFillColor(...C.borderLight)
    roundedRect(pdf, 8, y, 54, 5.5, 1.5, 'F')
    pdf.setFontSize(3)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...C.textLight)
    pdf.text(field.label, 11, y + 2)
    pdf.setFontSize(4.5)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...C.text)
    const val = field.value.length > 32 ? field.value.slice(0, 30) + '...' : field.value
    pdf.text(val, 11, y + 4.5)
  })

  // Year
  pdf.setFontSize(4)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...C.textLight)
  pdf.text('Año Escolar ' + new Date().getFullYear(), 35, 82, { align: 'center' })

  // Bottom accent
  pdf.setFillColor(...C.primary)
  roundedRect(pdf, 4, 91, 62, 4, 4, 'F')
  pdf.rect(4, 93, 62, 2, 'F')
}

export async function generateInstitutionCarnetBack(
  pdf: jsPDF,
  inst: InstitutionCarnetData
) {
  pdf.setFillColor(...C.bg)
  pdf.rect(0, 0, 70, 100, 'F')
  drawBackPatterns(pdf)

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

  // Large QR
  try {
    const qrData = await generateQRDataURL(inst.code || inst.name)
    pdf.addImage(qrData, 'PNG', 18, 14, 34, 34)
  } catch {
    pdf.setFillColor(...C.borderLight)
    pdf.rect(18, 14, 34, 34, 'F')
    pdf.setFontSize(6)
    pdf.setTextColor(...C.textLight)
    pdf.text('QR Code', 35, 32, { align: 'center' })
  }

  // Institution name
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(6)
  pdf.setTextColor(...C.text)
  pdf.text(inst.name.toUpperCase(), 35, 52, { align: 'center' })

  // Divider
  pdf.setFillColor(...C.borderLight)
  pdf.rect(10, 55, 50, 0.3, 'F')

  // Contact info
  const contactY = 59
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(4)
  pdf.setTextColor(...C.primary)
  pdf.text('INFORMACION DE CONTACTO', 35, contactY, { align: 'center' })

  const infoY = contactY + 5
  const items = [
    { label: 'Direccion', value: inst.address || '---' },
    { label: 'Telefono', value: inst.phone || '---' },
    { label: 'Correo', value: inst.email || '---' },
    { label: 'Sitio Web', value: inst.website || '---' },
  ]

  items.forEach((item, i) => {
    const y = infoY + i * 5
    pdf.setFontSize(3)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...C.textLight)
    pdf.text(item.label.toUpperCase(), 10, y)
    pdf.setFontSize(4)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...C.text)
    const val = item.value.length > 35 ? item.value.slice(0, 33) + '...' : item.value
    pdf.text(val, 10, y + 3)
  })

  // Disclaimer
  pdf.setFillColor(...C.borderLight)
  roundedRect(pdf, 8, 82, 54, 8, 2, 'F')
  pdf.setFontSize(3)
  pdf.setFont('helvetica', 'italic')
  pdf.setTextColor(...C.textMuted)
  pdf.text('Este documento es personal e intransferible.', 35, 85, { align: 'center' })
  pdf.text('Sirve como credencial de identificacion del estudiante', 35, 87.5, { align: 'center' })
  pdf.text('dentro de la institucion educativa.', 35, 90, { align: 'center' })

  // Bottom accent
  pdf.setFillColor(...C.primary)
  roundedRect(pdf, 4, 91, 62, 4, 4, 'F')
  pdf.rect(4, 93, 62, 2, 'F')
}
