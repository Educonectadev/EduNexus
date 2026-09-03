import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload, resolveInstId } from '@/lib/resolveInstId'
export async function PATCH(req: NextRequest, { params }: { params: { id: string }}) {
  const instId = await resolveInstId(req); if(!instId) return NextResponse.json({error:'No inst'},{status:400})
  const body = await req.json()
  if(body.action==='despedir'){
    await pool.query(`UPDATE users SET status='inactive' WHERE id=$1 AND institution_id=$2`, [params.id, instId])
    return NextResponse.json({ok:true})
  }
  return NextResponse.json({error:'unknown'}, {status:400})
}
export async function DELETE(req: NextRequest, { params }: { params: { id: string }}) {
  const instId = await resolveInstId(req); if(!instId) return NextResponse.json({error:'No inst'},{status:400})
  await pool.query(`DELETE FROM teachers WHERE user_id=$1`, [params.id])
  await pool.query(`DELETE FROM users WHERE id=$1 AND institution_id=$2`, [params.id, instId])
  return NextResponse.json({ok:true})
}
