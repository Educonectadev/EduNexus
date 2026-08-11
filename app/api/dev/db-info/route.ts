import { NextResponse } from 'next/server'
import pool, { checkPoolHealth } from '@/lib/db'

// Datos REALES de la conexión a la base de datos. Deriva de las variables de
// entorno (.env.local) y del pool activo, no de valores fijos.

function parseConnString(connStr?: string) {
  if (!connStr) return null
  try {
    const u = new URL(connStr)
    return {
      host: u.hostname,
      port: u.port || '5432',
      user: u.username,
      database: (u.pathname || '').replace(/^\//, '') || 'postgres',
    }
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const conn = parseConnString(process.env.DATABASE_URL || process.env.POSTGRES_URL)

    const connection = {
      database: conn?.database || process.env.DB_NAME || 'educonecta',
      host: conn?.host || process.env.DB_HOST || 'localhost',
      port: conn?.port || process.env.DB_PORT || '5432',
      user: conn?.user || process.env.DB_USER || 'postgres',
      socket: process.env.DB_SOCKET || null,
      ssl: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production',
      engine: 'PostgreSQL',
      poolLimit: parseInt(process.env.DB_POOL_LIMIT || '50'),
    }

    const health = await checkPoolHealth()

    const [tables] = await pool.query(
      `SELECT table_name AS table_name, (SELECT count(*)::int
         FROM information_schema.columns c WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name)
         AS column_count
       FROM information_schema.tables t
       WHERE t.table_schema = current_schema() AND t.table_type = 'BASE TABLE'
       ORDER BY table_name`
    ).catch(() => [] as any[]) as any[]

    const [counts] = await pool.query(
      `SELECT (SELECT count(*)::int FROM institutions) AS institutions,
              (SELECT count(*)::int FROM users) AS users,
              (SELECT count(*)::int FROM students) AS students,
              (SELECT count(*)::int FROM teachers) AS teachers,
              (SELECT count(*)::int FROM courses) AS courses,
              (SELECT count(*)::int FROM enrollments) AS enrollments,
              (SELECT count(*)::int FROM payments) AS payments`
    ).catch(() => [] as any[]) as any[]

    return NextResponse.json({
      ok: true,
      connection,
      health,
      tables: tables || [],
      counts: counts?.[0] || {},
    })
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: String(error?.message || error),
    }, { status: 500 })
  }
}