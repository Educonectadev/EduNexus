import mysql from 'mysql2/promise'

// National scale: 34,000+ institutions, ~2M students
// Pool must handle concurrent requests across all tenants
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'educonecta',
  socketPath: process.env.DB_SOCKET || undefined,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_LIMIT || '50'),
  maxIdle: parseInt(process.env.DB_POOL_MAX_IDLE || '25'),
  idleTimeout: 60000,
  queueLimit: parseInt(process.env.DB_POOL_QUEUE_LIMIT || '100'),
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
})

// Connection pool health check
export async function checkPoolHealth() {
  try {
    const start = Date.now()
    await pool.query('SELECT 1')
    const latency = Date.now() - start
    const [threads] = await pool.query('SHOW STATUS WHERE Variable_name = "Threads_connected"') as any[]
    return {
      status: 'healthy',
      latency,
      activeConnections: threads?.[0]?.Value || 0,
      poolLimit: parseInt(process.env.DB_POOL_LIMIT || '50'),
    }
  } catch (error) {
    return { status: 'unhealthy', error: String(error) }
  }
}

export default pool
