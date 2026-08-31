import { Pool, PoolClient } from 'pg'

// National scale: 34,000+ institutions, ~2M students
// Pool must handle concurrent requests across all tenants
const poolConfig: any = (() => {
  const conn = process.env.DATABASE_URL || process.env.POSTGRES_URL
  const ssl = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
  const base = { ssl }
  if (conn) {
    try {
      const url = new URL(conn)
      return {
        ...base,
        host: url.hostname,
        port: parseInt(url.port || '5432'),
        user: url.username,
        password: url.password,
        database: url.pathname.replace('/', ''),
      }
    } catch {
      return { ...base, connectionString: conn }
    }
  }
  return {
    ...base,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  }
})()

poolConfig.max = parseInt(process.env.DB_POOL_LIMIT || '50')
poolConfig.idleTimeoutMillis = 60000
poolConfig.connectionTimeoutMillis = 10000

const pool = new Pool(poolConfig)

// Convert mysql-style ? placeholders to pg-style $1, $2, ...
function toPgParams(sql: string, params: any[] = []): { text: string; values: any[] } {
  let idx = 0
  const text = sql.replace(/\?/g, () => {
    idx += 1
    return `$${idx}`
  })
  return { text, values: params }
}

// Compatibility shim — mimics mysql2/promise's pool.query() tuple shape
// `await pool.query(sql, params)` returns `[rows, meta]` where:
//   - rows: array of row objects (or [] for UPDATE/DELETE without RETURNING)
//   - meta: { rowCount, insertId?, affectedRows }
// Both destructuring styles are supported:
//   const [rows] = await pool.query(...)
//   const [rows, fields] = await pool.query(...)
//   await pool.query(...) // for fire-and-forget
export const poolShim = {
  async query(sql: string, params: any[] = []) {
    const { text, values } = toPgParams(sql, params || [])
    const res = await pool.query(text, values)
    const meta: any = {
      rowCount: res.rowCount ?? 0,
      affectedRows: res.rowCount ?? 0, // legacy alias
      fields: res.fields,
    }
    // For INSERT...RETURNING id, expose first row's id as insertId
    if (res.rows && res.rows.length > 0 && res.rows[0] && 'id' in res.rows[0]) {
      meta.insertId = (res.rows[0] as any).id
    }
    return [res.rows, meta] as any
  },
  async execute(sql: string, params: any[] = []) {
    return this.query(sql, params)
  },
  async getConnection(): Promise<PoolClient> {
    return pool.connect()
  },
  async end() {
    await pool.end()
  },
  get rawPool() {
    return pool
  },
}

// Connection pool health check
export async function checkPoolHealth() {
  try {
    const start = Date.now()
    await pool.query('SELECT 1')
    const latency = Date.now() - start
    const threadsRes = await pool.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM pg_stat_activity"
    )
    return {
      status: 'healthy',
      latency,
      activeConnections: parseInt(threadsRes.rows[0]?.count || '0'),
      poolLimit: parseInt(process.env.DB_POOL_LIMIT || '50'),
    }
  } catch (error) {
    return { status: 'unhealthy', error: String(error) }
  }
}

export default poolShim as any