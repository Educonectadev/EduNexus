import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// GET - List all demo requests (dev only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const offset = (page - 1) * limit

    let query = 'SELECT * FROM demo_requests'
    const params: any[] = []

    if (status) {
      query += ' WHERE status = ?'
      params.push(status)
    }

    // Get total count
    const countQuery = status 
      ? 'SELECT COUNT(*) as total FROM demo_requests WHERE status = ?'
      : 'SELECT COUNT(*) as total FROM demo_requests'
    const [[{ total }]] = await pool.query(countQuery, status ? [status] : []) as any[]

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const [rows] = await pool.query(query, params) as any[]

    return NextResponse.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching demo requests:', error)
    return NextResponse.json({ error: 'Error fetching demo requests' }, { status: 500 })
  }
}

// PUT - Update demo request status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, notes, demo_date } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 })
    }

    const validStatuses = ['pending', 'contacted', 'scheduled', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    await pool.query(
      'UPDATE demo_requests SET status = ?, notes = COALESCE(?, notes), demo_date = COALESCE(?, demo_date) WHERE id = ?',
      [status, notes || null, demo_date || null, id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating demo request:', error)
    return NextResponse.json({ error: 'Error updating' }, { status: 500 })
  }
}

// DELETE - Delete demo request
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    await pool.query('DELETE FROM demo_requests WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting demo request:', error)
    return NextResponse.json({ error: 'Error deleting' }, { status: 500 })
  }
}
