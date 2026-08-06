import fs from 'fs'
import path from 'path'

// Vercel serverless: process.cwd() (public/) is read-only. Only /tmp is writable.
// We store uploads in /tmp/uploads and serve them through an API route, falling
// back to the committed public/uploads folder for legacy files.
export const UPLOAD_ROOT = path.join('/tmp', 'uploads')
export const PUBLIC_UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads')

function categoryDir(category: string): string {
  return path.join(UPLOAD_ROOT, category)
}

export function ensureUploadDir(category: string): void {
  fs.mkdirSync(categoryDir(category), { recursive: true })
}

/** Saves a buffer and returns the public URL to reference it. */
export function saveUpload(category: string, filename: string, buffer: Buffer): string {
  ensureUploadDir(category)
  fs.writeFileSync(path.join(categoryDir(category), filename), buffer)
  return `/api/uploads/${category}/${filename}`
}

/**
 * Resolves the on-disk path for a stored file_url. Supports both the new
 * /tmp (writable) location and legacy /uploads/... public files.
 */
export function resolveUploadPath(fileUrl: string | null | undefined): string | null {
  if (!fileUrl) return null
  // modern url: /api/uploads/category/filename
  if (fileUrl.startsWith('/api/uploads/')) {
    const rel = fileUrl.replace('/api/uploads/', '')
    const tmp = path.join(UPLOAD_ROOT, rel)
    if (fs.existsSync(tmp)) return tmp
    const publicFile = path.join(PUBLIC_UPLOAD_ROOT, rel)
    if (fs.existsSync(publicFile)) return publicFile
    return tmp
  }
  // legacy url: /uploads/...
  if (fileUrl.startsWith('/uploads/')) {
    const rel = fileUrl.replace('/uploads/', '')
    const tmp = path.join(UPLOAD_ROOT, rel)
    if (fs.existsSync(tmp)) return tmp
    return path.join(PUBLIC_UPLOAD_ROOT, rel)
  }
  return null
}

/** Deletes a stored upload (from /tmp or public) if it exists. */
export function deleteUpload(fileUrl: string | null | undefined): void {
  const p = resolveUploadPath(fileUrl)
  if (p && fs.existsSync(p)) {
    try {
      fs.unlinkSync(p)
    } catch {
      // ignore
    }
  }
}