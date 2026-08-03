import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface InstitutionInfo {
  name: string
  code: string
  address?: string
  phone?: string
  email?: string
}

interface CertificateData {
  student_name: string
  type: string
  issue_date: string
  institution: InstitutionInfo
  custom_content?: string
}

interface DocumentData {
  type: string
  student_name?: string
  status: string
  created_at: string
  notes?: string
  institution: InstitutionInfo
  custom_content?: string
}

function addHeader(doc: jsPDF, inst: InstitutionInfo, y: number = 25): number {
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header line
  doc.setDrawColor(100, 100, 100)
  doc.setLineWidth(0.5)
  doc.line(20, y, pageWidth - 20, y)

  // Institution name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(30, 30, 30)
  doc.text(inst.name.toUpperCase(), pageWidth / 2, y + 10, { align: 'center' })

  // Code
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`Código: ${inst.code}`, pageWidth / 2, y + 16, { align: 'center' })

  // Address/Phone
  if (inst.address || inst.phone) {
    const contactParts = [inst.address, inst.phone].filter(Boolean).join(' | ')
    doc.text(contactParts, pageWidth / 2, y + 21, { align: 'center' })
  }

  // Bottom line
  doc.line(20, y + 25, pageWidth - 20, y + 25)

  return y + 32
}

function addFooter(doc: jsPDF, inst: InstitutionInfo) {
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setDrawColor(100, 100, 100)
  doc.setLineWidth(0.3)
  doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text(`${inst.name} — ${inst.code}`, 20, pageHeight - 20)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, pageWidth - 20, pageHeight - 20, { align: 'right' })
}

export function generateCertificatePDF(data: CertificateData): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  let y = addHeader(doc, data.institution)

  // Title
  y += 15
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(30, 30, 30)
  doc.text(data.type.toUpperCase(), pageWidth / 2, y, { align: 'center' })

  // Decorative line under title
  y += 5
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  const titleWidth = doc.getTextWidth(data.type.toUpperCase())
  doc.line((pageWidth - titleWidth) / 2 - 10, y, (pageWidth + titleWidth) / 2 + 10, y)

  // Body
  y += 20
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(50, 50, 50)

  const bodyText = `Se certifica que el/la alumno(a):`
  doc.text(bodyText, pageWidth / 2, y, { align: 'center' })

  y += 12
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(20, 20, 20)
  doc.text(data.student_name.toUpperCase(), pageWidth / 2, y, { align: 'center' })

  // Underline student name
  y += 3
  const nameWidth = doc.getTextWidth(data.student_name.toUpperCase())
  doc.setDrawColor(30, 30, 30)
  doc.setLineWidth(0.5)
  doc.line((pageWidth - nameWidth) / 2, y, (pageWidth + nameWidth) / 2, y)

  y += 18
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(50, 50, 50)

  // Use custom content if provided, otherwise use default content
  if (data.custom_content) {
    // Strip HTML tags for PDF (basic)
    const plainText = data.custom_content
      .replace(/<h2[^>]*>/gi, '\n')
      .replace(/<\/h2>/gi, '\n')
      .replace(/<b>/gi, '')
      .replace(/<\/b>/gi, '')
      .replace(/<i>/gi, '')
      .replace(/<\/i>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    const lines = doc.splitTextToSize(plainText, pageWidth - 50)
    lines.forEach((line: string) => {
      if (line.trim()) {
        doc.text(line, pageWidth / 2, y, { align: 'center' })
        y += 7
      } else {
        y += 4
      }
    })
  } else {
    let contentLines: string[] = []
    switch (data.type.toLowerCase()) {
      case 'constancia de matrícula':
        contentLines = [
          'se encuentra debidamente matriculado(a) en nuestra Institución Educativa,',
          'para el año escolar vigente.',
        ]
        break
      case 'certificado de notas':
        contentLines = [
          'ha completado satisfactoriamente sus estudios con las calificaciones',
          'que se detallan en el adjunto.',
        ]
        break
      case 'constancia de conducta':
        contentLines = [
          'se comporta de manera exemplar, demostrando responsabilidad,',
          'respeto y compromiso durante el presente año escolar.',
        ]
        break
      case 'constancia de no deuda':
        contentLines = [
          'se encuentra a paz y salvo con la Institución Educativa,',
          'no teniendo ningún adealdo pendiente.',
        ]
        break
      default:
        contentLines = [
          'cumple con los requisitos establecidos por la Institución Educativa.',
        ]
    }

    contentLines.forEach(line => {
      doc.text(line, pageWidth / 2, y, { align: 'center' })
      y += 7
    })
  }

  // Date
  y += 15
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  const dateStr = new Date(data.issue_date).toLocaleDateString('es-PE', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
  doc.text(`Lima, ${dateStr}`, pageWidth / 2, y, { align: 'center' })

  // Signature lines
  y += 40
  const sigWidth = 60
  const leftSig = pageWidth / 2 - sigWidth - 10
  const rightSig = pageWidth / 2 + 10

  doc.setDrawColor(30, 30, 30)
  doc.setLineWidth(0.5)
  doc.line(leftSig, y, leftSig + sigWidth, y)
  doc.line(rightSig, y, rightSig + sigWidth, y)

  y += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(30, 30, 30)
  doc.text('Director(a)', leftSig + sigWidth / 2, y, { align: 'center' })
  doc.text('Secretario(a)', rightSig + sigWidth / 2, y, { align: 'center' })

  addFooter(doc, data.institution)

  return doc
}

export function generateDocumentPDF(data: DocumentData): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  let y = addHeader(doc, data.institution)

  // Title
  y += 15
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(30, 30, 30)
  doc.text(data.type.toUpperCase(), pageWidth / 2, y, { align: 'center' })

  // Status badge
  y += 10
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    ready: 'Listo para entregar',
  }
  doc.text(`Estado: ${statusLabels[data.status] || data.status}`, pageWidth / 2, y, { align: 'center' })

  // Body
  y += 20
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(50, 50, 50)

  if (data.student_name) {
    doc.text(`Alumno: ${data.student_name}`, 25, y)
    y += 8
  }

  const dateStr = new Date(data.created_at).toLocaleDateString('es-PE', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
  doc.text(`Fecha de solicitud: ${dateStr}`, 25, y)
  y += 8

  // Use custom content if provided
  if (data.custom_content) {
    const plainText = data.custom_content
      .replace(/<h2[^>]*>/gi, '\n')
      .replace(/<\/h2>/gi, '\n')
      .replace(/<b>/gi, '')
      .replace(/<\/b>/gi, '')
      .replace(/<i>/gi, '')
      .replace(/<\/i>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    y += 5
    const lines = doc.splitTextToSize(plainText, pageWidth - 50)
    lines.forEach((line: string) => {
      if (line.trim()) {
        doc.text(line, 25, y)
        y += 6
      } else {
        y += 3
      }
    })
  } else if (data.notes) {
    doc.text(`Observaciones: ${data.notes}`, 25, y)
  }

  addFooter(doc, data.institution)

  return doc
}

export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename)
}

// ===== DOCX Generation =====
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, BorderStyle, TableRow, TableCell, Table, WidthType, convertInchesToTwip } from 'docx'
import { saveAs } from 'file-saver'

function stripHtml(html: string): string {
  return html
    .replace(/<h2[^>]*>/gi, '\n')
    .replace(/<\/h2>/gi, '\n')
    .replace(/<b>/gi, '')
    .replace(/<\/b>/gi, '')
    .replace(/<i>/gi, '')
    .replace(/<\/i>/gi, '')
    .replace(/<u>/gi, '')
    .replace(/<\/u>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function htmlToDocxParagraphs(html: string): Paragraph[] {
  const plain = stripHtml(html)
  return plain.split('\n').filter(l => l.trim()).map(line =>
    new Paragraph({
      children: [new TextRun({ text: line, size: 24 })],
      spacing: { after: 120 },
    })
  )
}

export async function generateCertificateDOCX(data: CertificateData): Promise<Blob> {
  const dateStr = new Date(data.issue_date).toLocaleDateString('es-PE', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  let contentParagraphs: Paragraph[] = []

  if (data.custom_content) {
    contentParagraphs = htmlToDocxParagraphs(data.custom_content)
  } else {
    let contentText = ''
    switch (data.type.toLowerCase()) {
      case 'constancia de matrícula':
        contentText = 'se encuentra debidamente matriculado(a) en nuestra Institución Educativa, para el año escolar vigente.'
        break
      case 'certificado de notas':
        contentText = 'ha completado satisfactoriamente sus estudios con las calificaciones que se detallan en el adjunto.'
        break
      case 'constancia de conducta':
        contentText = 'se comporta de manera ejemplar, demostrando responsabilidad, respeto y compromiso durante el presente año escolar.'
        break
      case 'constancia de no deuda':
        contentText = 'se encuentra a paz y salvo con la Institución Educativa, no teniendo ningún adeudo pendiente.'
        break
      default:
        contentText = 'cumple con los requisitos establecidos por la Institución Educativa.'
    }
    contentParagraphs = [
      new Paragraph({ children: [new TextRun({ text: 'Se certifica que el/la alumno(a):', size: 24 })], spacing: { after: 200 } }),
      new Paragraph({ children: [new TextRun({ text: data.student_name.toUpperCase(), bold: true, size: 32 })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
      new Paragraph({ children: [new TextRun({ text: '', size: 10 })], spacing: { after: 50 } }),
      new Paragraph({ children: [new TextRun({ text: contentText, size: 24 })], spacing: { after: 200 } }),
    ]
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1.2) },
        },
      },
      children: [
        // Header
        new Paragraph({ children: [new TextRun({ text: data.institution.name.toUpperCase(), bold: true, size: 32 })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
        new Paragraph({ children: [new TextRun({ text: `Código: ${data.institution.code}`, size: 18, color: '666666' })], alignment: AlignmentType.CENTER, spacing: { after: 50 } }),
        new Paragraph({
          children: [new TextRun({ text: '' })],
          border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: '999999' } },
          spacing: { after: 300 },
        }),
        // Title
        new Paragraph({ children: [new TextRun({ text: data.type.toUpperCase(), bold: true, size: 36 })], alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
        // Content
        ...contentParagraphs,
        // Date
        new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 200 } }),
        new Paragraph({ children: [new TextRun({ text: `Lima, ${dateStr}`, size: 22 })], alignment: AlignmentType.CENTER, spacing: { after: 600 } }),
        // Signatures
        new Paragraph({
          children: [
            new TextRun({ text: '________________________' }),
            new TextRun({ text: '          ' }),
            new TextRun({ text: '________________________' }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Director(a)', bold: true, size: 20 }),
            new TextRun({ text: '                    ' }),
            new TextRun({ text: 'Secretario(a)', bold: true, size: 20 }),
          ],
          alignment: AlignmentType.CENTER,
        }),
        // Footer
        new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 100 } }),
        new Paragraph({
          children: [new TextRun({ text: `${data.institution.name} — ${data.institution.code} | Generado: ${new Date().toLocaleDateString('es-PE')}`, size: 16, color: '999999' })],
          alignment: AlignmentType.CENTER,
        }),
      ],
    }],
  })

  return Packer.toBlob(doc)
}

export async function generateDocumentDOCX(data: DocumentData): Promise<Blob> {
  const dateStr = new Date(data.created_at).toLocaleDateString('es-PE', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    ready: 'Listo para entregar',
  }

  const contentParagraphs: Paragraph[] = []

  if (data.student_name) {
    contentParagraphs.push(new Paragraph({ children: [new TextRun({ text: `Alumno: ${data.student_name}`, size: 24 })], spacing: { after: 120 } }))
  }

  contentParagraphs.push(new Paragraph({ children: [new TextRun({ text: `Fecha de solicitud: ${dateStr}`, size: 24 })], spacing: { after: 120 } }))
  contentParagraphs.push(new Paragraph({ children: [new TextRun({ text: `Estado: ${statusLabels[data.status] || data.status}`, size: 24 })], spacing: { after: 120 } }))

  if (data.custom_content) {
    contentParagraphs.push(new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 100 } }))
    contentParagraphs.push(...htmlToDocxParagraphs(data.custom_content))
  } else if (data.notes) {
    contentParagraphs.push(new Paragraph({ children: [new TextRun({ text: `Observaciones: ${data.notes}`, size: 24 })], spacing: { after: 120 } }))
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1.2) },
        },
      },
      children: [
        new Paragraph({ children: [new TextRun({ text: data.institution.name.toUpperCase(), bold: true, size: 32 })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
        new Paragraph({ children: [new TextRun({ text: `Código: ${data.institution.code}`, size: 18, color: '666666' })], alignment: AlignmentType.CENTER, spacing: { after: 50 } }),
        new Paragraph({
          children: [new TextRun({ text: '' })],
          border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: '999999' } },
          spacing: { after: 300 },
        }),
        new Paragraph({ children: [new TextRun({ text: data.type.toUpperCase(), bold: true, size: 36 })], alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
        ...contentParagraphs,
        new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 100 } }),
        new Paragraph({
          children: [new TextRun({ text: `${data.institution.name} — ${data.institution.code} | Generado: ${new Date().toLocaleDateString('es-PE')}`, size: 16, color: '999999' })],
          alignment: AlignmentType.CENTER,
        }),
      ],
    }],
  })

  return Packer.toBlob(doc)
}

export async function downloadDOCX(blob: Blob, filename: string) {
  saveAs(blob, filename)
}
