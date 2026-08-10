import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

const FORBIDDEN = /^\s*(DROP|ALTER|TRUNCATE|GRANT|REVOKE|CREATE USER|DROP USER)/i

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = body

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Query is required', columns: [], rows: [], duration: 0 }, { status: 400 })
    }

    if (FORBIDDEN.test(query)) {
      return NextResponse.json({
        error: 'Operación no permitida. Solo se permiten consultas SELECT, INSERT, UPDATE y DELETE.',
        columns: [],
        rows: [],
        duration: 0,
      }, { status: 403 })
    }

    const start = Date.now()
    const [result, meta] = await pool.query(query)
    const duration = Date.now() - start

    if (Array.isArray(result)) {
      const columns = (meta?.fields || []).map((f: any) => f.name)
      return NextResponse.json({ columns, rows: result, duration })
    }

    return NextResponse.json({
      columns: [],
      rows: [],
      affectedRows: (result as any).affectedRows,
      duration,
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || 'Error executing query',
      columns: [],
      rows: [],
      duration: 0,
    }, { status: 500 })
  }
}
