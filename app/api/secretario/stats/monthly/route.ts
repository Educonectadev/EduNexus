import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
export async function GET(req: NextRequest){
  const instId = await resolveInstId(req); if(!instId) return NextResponse.json([])
  const months: {month:string, matriculas:number, pagos:number}[]=[]
  for(let i=5;i>=0;i--){
    const d=new Date(); d.setMonth(d.getMonth()-i)
    const yyyy=d.getFullYear(); const mm=d.getMonth()+1
    const label=d.toLocaleDateString('es-PE',{month:'short'}).replace('.','')
    const [enr]=await pool.query(`SELECT COUNT(*)::int as c FROM enrollments WHERE institution_id=$1 AND EXTRACT(YEAR FROM created_at)=$2 AND EXTRACT(MONTH FROM created_at)=$3`,[instId, yyyy, mm]) as any
    const [pay]=await pool.query(`SELECT COUNT(*)::int as c FROM payments WHERE institution_id=$1 AND EXTRACT(YEAR FROM created_at)=$2 AND EXTRACT(MONTH FROM created_at)=$3`,[instId, yyyy, mm]) as any
    months.push({month: label.charAt(0).toUpperCase()+label.slice(1,3), matriculas: enr[0]?.c||0, pagos: pay[0]?.c||0})
  }
  return NextResponse.json(months)
}
