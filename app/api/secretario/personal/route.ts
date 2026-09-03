import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload, resolveInstId } from '@/lib/resolveInstId'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'Sin institucion' }, { status: 400 })

    const [rows] = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.dni, u.phone, u.subject, u.grade_level,
              u.specialization, u.contract_type, u.status, u.created_at,
              t.id as teacher_id
       FROM users u
       LEFT JOIN teachers t ON t.user_id = u.id AND t.institution_id = u.institution_id
       WHERE u.role IN ('docente', 'secretario') AND u.institution_id = ?
       ORDER BY u.created_at DESC`,
      [instId]
    )

    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching personal' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'Sin institucion' }, { status: 400 })
    const conn: any = await (pool as any).rawPool.connect()
    try {
      await conn.query('BEGIN')
      const usersRes = await conn.query(`SELECT id FROM users WHERE institution_id = $1 AND role IN ('docente','secretario')`, [instId])
      const ids: string[] = usersRes.rows.map((r: any) => r.id)
      if (ids.length > 0) {
        await conn.query(`DELETE FROM teachers WHERE user_id = ANY($1)`, [ids])
        await conn.query(`DELETE FROM users WHERE id = ANY($1)`, [ids])
      }
      await conn.query('COMMIT')
      return NextResponse.json({ deleted: ids.length })
    } catch (e: any) {
      await conn.query('ROLLBACK').catch(()=>{})
      return NextResponse.json({ error: e.message }, { status: 500 })
    } finally { conn.release() }
  } catch (error: any) {
    return NextResponse.json({ error: 'Error deleting personal' }, { status: 500 })
  }
}
