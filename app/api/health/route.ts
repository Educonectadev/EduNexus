import { NextResponse } from 'next/server'
import pool, { checkPoolHealth } from '@/lib/db'
import { cache } from '@/lib/cache'

export async function GET() {
  try {
    const dbHealth = await checkPoolHealth()
    
    const [instCount] = await pool.query('SELECT COUNT(*) as count FROM institutions') as any[]
    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users') as any[]
    const [studentCount] = await pool.query('SELECT COUNT(*) as count FROM students') as any[]

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.1.1',
      database: dbHealth,
      cache: {
        size: cache.size(),
      },
      stats: {
        institutions: instCount?.[0]?.count || 0,
        users: userCount?.[0]?.count || 0,
        students: studentCount?.[0]?.count || 0,
      },
      environment: process.env.NODE_ENV || 'development',
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: String(error),
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
