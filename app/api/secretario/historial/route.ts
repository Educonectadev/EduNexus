import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ logs: [], total: 0, page: 1, limit: 50 })

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const action = searchParams.get('action') || 'all'
    const entity = searchParams.get('entity') || 'all'
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 50
    const offset = (page - 1) * limit

    let query = `
      SELECT al.id, al.action, al.entity, al.entity_id, al.details,
             COALESCE(u.full_name, al.user_id, 'Sistema') as user_name,
             al.created_at
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE al.institution_id = ?
    `
    const params: any[] = [instId]

    if (q.trim()) {
      query += ` AND (u.full_name LIKE ? OR al.details LIKE ? OR al.entity LIKE ?)`
      const like = `%${q}%`
      params.push(like, like, like)
    }

    if (action !== 'all') {
      query += ` AND al.action = ?`
      params.push(action)
    }

    if (entity !== 'all') {
      query += ` AND al.entity = ?`
      params.push(entity)
    }

    if (from) {
      query += ` AND al.created_at >= ?`
      params.push(from)
    }

    if (to) {
      query += ` AND al.created_at <= ?`
      params.push(to + ' 23:59:59')
    }

    const [countRows] = await pool.query(
      query.replace('SELECT al.id, al.action, al.entity, al.entity_id, al.details, COALESCE(u.full_name, al.user_id, \'Sistema\') as user_name, al.created_at', 'SELECT COUNT(*) as total'),
      params
    )
    const total = (countRows as any[])[0]?.total || 0

    query += ` ORDER BY al.created_at DESC LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const [rows] = await pool.query(query, params)
    return NextResponse.json({ logs: rows, total, page, limit })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error fetching history' }, { status: 500 })
  }
}
