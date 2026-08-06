import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

export const BUCKET = 'uploads'

// Legacy storage: committed files in public/uploads (read-only on Vercel but
// never written to in production). Only kept for fallback reads.
export const UPLOAD_ROOT = path.join('/tmp', 'uploads')
export const PUBLIC_UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads')

export function ensureUploadDir<T>(_category?: string): T | undefined {
  return undefined
}

/** Saves a buffer into Supabase Storage and returns its public URL. */
export async function saveUpload(category: string, filename: string, buffer: Buffer): Promise<string> {
  const objectPath = `${category}/${filename}`
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, buffer, {
    contentType: guessMime(filename),
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  return publicUrl(category, filename)
}

/** Returns a public object URL without requesting it. */
export function publicUrl(category: string, filename: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${category}/${filename}`
}

/** Returns public URL for a legacy (pre-Supabase) path if it only exists locally. */
export function legacyPublicUrl(fileUrl: string): string {
  return fileUrl
}

/**
 * Resolves the file referenced by a stored url into local (tmp/public) cache so
 * existing read code can still access it. On Supabase we return null to signal
 * the callers that it should be fetched via the public URL instead.
 */
export function resolveUploadPath(fileUrl: string | null | undefined): string | null {
  if (!fileUrl) return null
  if (fileUrl.startsWith('/api/uploads/')) {
    const rel = fileUrl.replace('/api/uploads/', '')
    const tmp = path.join(UPLOAD_ROOT, rel)
    if (fs.existsSync(tmp)) return tmp
    const pub = path.join(PUBLIC_UPLOAD_ROOT, rel)
    if (fs.existsSync(pub)) return pub
    return tmp
  }
  if (fileUrl.startsWith('/uploads/')) {
    const rel = fileUrl.replace('/uploads/', '')
    const tmp = path.join(UPLOAD_ROOT, rel)
    if (fs.existsSync(tmp)) return tmp
    return path.join(PUBLIC_UPLOAD_ROOT, rel)
  }
  return null
}

/** Removes an object from Supabase Storage (or local disk for legacy files). */
export async function deleteUpload(fileUrl: string | null | undefined): Promise<void> {
  if (!fileUrl) return
  if (fileUrl.includes('/storage/v1/object/public/')) {
    const marker = `/object/public/${BUCKET}/`
    const idx = fileUrl.indexOf(marker)
    if (idx !== -1) {
      const objPath = fileUrl.slice(idx + marker.length).split('?')[0]
      if (objPath && !objPath.includes('..')) {
        try {
          await supabase.storage.from(BUCKET).remove([objPath])
          return
        } catch {
          // ignore, also attempt local
        }
      }
    }
  } else if (fileUrl.startsWith('/uploads/') || fileUrl.startsWith('/api/uploads/')) {
    const p = resolveUploadPath(fileUrl)
    if (p && fs.existsSync(p)) {
      try {
        fs.unlinkSync(p)
      } catch {
        // ignore
      }
    }
  }
}

export function guessMime(filename: string): string {
  const ext = (filename.split('.').pop() || '').toLowerCase()
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    csv: 'text/csv',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  }
  return map[ext] || 'application/octet-stream'
}