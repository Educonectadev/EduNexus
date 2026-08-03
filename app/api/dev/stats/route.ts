import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const [institutions] = await pool.query('SELECT COUNT(*) as count FROM institutions')
    const [users] = await pool.query('SELECT COUNT(*) as count FROM users')
    const [students] = await pool.query('SELECT COUNT(*) as count FROM students')
    const [tables] = await pool.query("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'educonecta'")

    return NextResponse.json({
      institutions: (institutions as any)[0].count,
      users: (users as any)[0].count,
      students: (students as any)[0].count,
      tables: (tables as any)[0].count,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching stats' }, { status: 500 })
  }
}
