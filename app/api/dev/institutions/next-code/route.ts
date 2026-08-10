import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT code FROM institutions WHERE code LIKE 'COL-%' ORDER BY CAST(SUBSTRING(code, 5) AS INTEGER) DESC LIMIT 1`
    ) as any[]

    if (rows.length > 0) {
      const lastCode = rows[0].code
      const numPart = lastCode.replace('COL-', '')
      const lastNum = parseInt(numPart, 10)
      if (!isNaN(lastNum)) {
        const nextNum = lastNum + 1
        return NextResponse.json({ code: `COL-${String(nextNum).padStart(2, '0')}` })
      }
    }

    return NextResponse.json({ code: 'COL-01' })
  } catch (error) {
    return NextResponse.json({ code: 'COL-01' })
  }
}
