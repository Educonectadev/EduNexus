import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const institutionId = await resolveInstId(request)
    if (!institutionId) {
      return NextResponse.json({ error: 'Institución requerida' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const role = body.role

    let query = `DELETE FROM users WHERE institution_id = $1 AND role IN ('docente', 'secretario')`
    const params: any[] = [institutionId]

    if (role) {
      query = `DELETE FROM users WHERE institution_id = $1 AND role = $2`
      params.push(role)
    }

    const [result] = await pool.query(query, params) as any[]

    return NextResponse.json({
      success: true,
      deleted: result.affectedRows || 0,
      message: `${result.affectedRows || 0} personal eliminado`,
    })
  } catch (error: any) {
    console.error('Bulk delete error:', error)
    return NextResponse.json({ error: 'Error al eliminar personal' }, { status: 500 })
  }
}
