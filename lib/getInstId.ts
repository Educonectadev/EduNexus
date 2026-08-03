import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import pool from '@/lib/db'

export async function getInstId(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return null
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'educonecta-secret')
    const { payload } = await jwtVerify(token, secret)
    if (payload.institutionId) return payload.institutionId as string
    return null
  } catch {
    return null
  }
}
