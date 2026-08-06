import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { UPLOAD_ROOT, PUBLIC_UPLOAD_ROOT } from '@/lib/uploads'
import { getAuthPayload } from '@/lib/resolveInstId'

// Serves uploaded files. On Vercel the public/ folder is read-only, so new
// uploads live in /tmp/uploads and are served here. Legacy files committed in
// public/uploads are also served.
export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return new NextResponse('No autorizado', { status: 401 })

    const { path: pathSegments } = await params
    const rel = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments
    if (!rel || rel.includes('..')) return new NextResponse('Not found', { status: 404 })

    // resolve against /tmp first, then public (legacy committed files)
    let filePath = path.join(UPLOAD_ROOT, rel)
    if (!fs.existsSync(filePath)) {
      filePath = path.join(PUBLIC_UPLOAD_ROOT, rel)
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      return new NextResponse('Not found', { status: 404 })
    }

    const buffer = fs.readFileSync(filePath)
    const ext = path.extname(rel).toLowerCase()
    const mimeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc': 'application/msword',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.png': 'image/png',
    }
    const contentType = mimeMap[ext] || 'application/octet-stream'

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(buffer.byteLength),
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch (error) {
    return new NextResponse('Not found', { status: 404 })
  }
}