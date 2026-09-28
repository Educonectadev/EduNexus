import { jwtVerify } from 'jose'
import pool from '@/lib/db'

type HeaderCarrier = { headers: { get(name: string): string | null } }

export function extractTokens(request: HeaderCarrier): string[] {
  const tokens: string[] = []
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) tokens.push(authHeader.slice(7))
  const cookieToken = request.headers.get('cookie')?.match(/token=([^;]+)/)?.[1]
  if (cookieToken && !tokens.includes(cookieToken)) tokens.push(cookieToken)
  return tokens
}

export function extractToken(request: HeaderCarrier): string | null {
  return extractTokens(request)[0] || null
}

export async function verifyToken(token: string | null | undefined): Promise<Record<string, any> | null> {
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

export async function getAuthPayload(request: HeaderCarrier): Promise<Record<string, any> | null> {
  // Prueba el header Authorization y luego la cookie: así un token viejo
  // en localStorage nunca anula una cookie todavía válida (y viceversa).
  for (const token of extractTokens(request)) {
    const claims = await verifyToken(token)
    if (claims) return claims
  }
  return null
}

export async function resolveInstId(request: HeaderCarrier): Promise<string | null> {
  const user = await getAuthPayload(request)
  if (!user) return null
  if (user.institutionId) return user.institutionId as string
  return null
}
