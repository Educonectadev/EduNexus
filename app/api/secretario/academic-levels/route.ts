import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ levels: ['Primaria', 'Secundaria'] })

    const [rows] = await pool.query(
      `SELECT niveles FROM institutions WHERE id = ?`,
      [instId]
    )
    const inst = (rows as any[])[0]
    let levels: string[] = ['Primaria', 'Secundaria']

    if (inst?.niveles) {
      try {
        const parsed = typeof inst.niveles === 'string' ? JSON.parse(inst.niveles) : inst.niveles
        if (Array.isArray(parsed) && parsed.length > 0) {
          levels = parsed
        }
      } catch {}
    }

    return NextResponse.json({ levels })
  } catch (error) {
    return NextResponse.json({ levels: ['Primaria', 'Secundaria'] })
  }
}
