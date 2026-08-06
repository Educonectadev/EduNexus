import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const [totalUsers] = await pool.query('SELECT COUNT(*) as count FROM users')
    const [activeUsers] = await pool.query("SELECT COUNT(*) as count FROM users WHERE status = 'active'")

    const [totalSessions] = await pool.query('SELECT COUNT(*) as count FROM user_sessions')

    const [todaySessions] = await pool.query(
      "SELECT COUNT(*) as count FROM user_sessions WHERE DATE(logged_in_at) = CURRENT_DATE"
    )

    const [uniqueToday] = await pool.query(
      "SELECT COUNT(DISTINCT user_id) as count FROM user_sessions WHERE DATE(logged_in_at) = CURRENT_DATE"
    )

    const [last7days] = await pool.query(
      `SELECT DATE(logged_in_at) as day, COUNT(*) as sessions, COUNT(DISTINCT user_id) as users
       FROM user_sessions
       WHERE logged_in_at >= (CURRENT_DATE - INTERVAL '7 days')
       GROUP BY DATE(logged_in_at)
       ORDER BY day ASC`
    )

    const [recentLogins] = await pool.query(
      `SELECT us.logged_in_at, us.ip_address, us.user_agent,
              u.full_name, u.email, u.role
       FROM user_sessions us
       JOIN users u ON us.user_id = u.id
       ORDER BY us.logged_in_at DESC
       LIMIT 10`
    )

    const [topUsers] = await pool.query(
      `SELECT u.full_name, u.email, u.role,
              COUNT(us.id) as session_count,
              MAX(us.logged_in_at) as last_seen
       FROM users u
       LEFT JOIN user_sessions us ON u.id = us.user_id
       GROUP BY u.id, u.full_name, u.email, u.role
       HAVING COUNT(us.id) > 0
       ORDER BY session_count DESC
       LIMIT 10`
    )

    return NextResponse.json({
      totalUsers: (totalUsers as any[])[0].count,
      activeUsers: (activeUsers as any[])[0].count,
      totalSessions: (totalSessions as any[])[0].count,
      todaySessions: (todaySessions as any[])[0].count,
      uniqueToday: (uniqueToday as any[])[0].count,
      last7days,
      recentLogins,
      topUsers,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching session stats' }, { status: 500 })
  }
}
