import { NextResponse } from 'next/server'
import pool from '@/lib/db'
export async function GET(){
  try{
    await pool.query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS shift VARCHAR(20) DEFAULT ''`)
    await pool.query(`ALTER TABLE parents ADD COLUMN IF NOT EXISTS shift VARCHAR(20) DEFAULT ''`)
    await pool.query(`ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS shift VARCHAR(20) DEFAULT ''`)
    return NextResponse.json({ok:true})
  }catch(e:any){ return NextResponse.json({error:e.message},{status:500}) }
}
export async function POST(){ return GET() }
