import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import pool from '@/lib/db'

export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7)
  return request.headers.get('cookie')?.match(/token=([^;]+)/)?.[1] || null
}

export async function getAuthPayload(request: NextRequest): Promise<Record<string, any> | null> {
  const token = extractToken(request)
  if (!token) return null
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'educonecta-secret')
    const { payload } = await jwtVerify(token, secret)
    const claims = payload as Record<string, any>
    return {
      ...claims,
      id: claims.id || claims.userId,
    }
  } catch {
    return null
  }
}

export async function resolveInstId(request: NextRequest): Promise<string | null> {
  const user = await getAuthPayload(request)
  if (!user) return null
  if (user.institutionId) return user.institutionId as string
  return null
}
