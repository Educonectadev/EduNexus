import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload } from '@/lib/resolveInstId'
import { jsPDF } from 'jspdf'
import {
  generateInstitutionCarnetFront,
  generateInstitutionCarnetBack,
  InstitutionCarnetData,
} from '@/lib/carnet-design'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const [[inst]] = await pool.query(
      'SELECT name, code, logo_url, director_name, address, phone, email FROM institutions WHERE id = ?',
      [id]
    ) as any[]

    if (!inst) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 })
    }

    // Fetch logo
    let logoBase64: string | null = null
    if (inst.logo_url) {
      try {
        const response = await fetch(inst.logo_url)
        const blob = await response.blob()
        const buffer = await blob.arrayBuffer()
        logoBase64 = Buffer.from(buffer).toString('base64')
      } catch {}
    }

    const instData: InstitutionCarnetData = {
      name: inst.name,
      code: inst.code,
      directorName: inst.director_name,
      address: inst.address,
      phone: inst.phone,
      email: inst.email,
      logoUrl: inst.logo_url,
    }

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [70, 100] })

    // Front side
    await generateInstitutionCarnetFront(pdf, instData, logoBase64)

    // Back side
    pdf.addPage([70, 100], 'portrait')
    await generateInstitutionCarnetBack(pdf, instData)

    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="carnet-${inst.code}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating carnet:', error)
    return NextResponse.json({ error: 'Error generating carnet' }, { status: 500 })
  }
}
