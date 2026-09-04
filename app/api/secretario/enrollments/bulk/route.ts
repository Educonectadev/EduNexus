import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import crypto from 'crypto'
import { resolveInstId } from '@/lib/resolveInstId'
export async function POST(req: NextRequest){
  const instId = await resolveInstId(req); if(!instId) return NextResponse.json({error:'No inst'},{status:401})
  const { rows } = await req.json() as { rows: any[] }
  if(!rows?.length) return NextResponse.json({error:'empty'},{status:400})
  const conn:any = await (pool as any).rawPool.connect()
  try{
    await conn.query('BEGIN')
    let imported=0, skipped=0, errors=0
    // Pre-fetch existing students by DNI for fast lookup
    const dnis = rows.map(r=>r.student_dni).filter(Boolean)
    const existingMap = new Map<string,string>()
    if(dnis.length){
      const res = await conn.query(`SELECT id, document_number FROM students WHERE institution_id=$1 AND document_number = ANY($2)`, [instId, dnis])
      for(const r of res.rows) existingMap.set(r.document_number, r.id)
    }
    // Ensure grades/sections exist cache
    const gradeCache = new Set<string>()
    const [gRows]=await pool.query(`SELECT LOWER(name) as n FROM academic_grades WHERE institution_id=$1`,[instId]) as any
    for(const g of gRows) gradeCache.add(g.n)
    for(const r of rows){
      try{
        const grade = r.grade || ''
        const section = r.section || 'A'
        if(grade && !gradeCache.has(grade.toLowerCase())){ skipped++; continue }
        let studentId = existingMap.get(r.student_dni)
        if(studentId){
          const exEnr = await conn.query(`SELECT id FROM enrollments WHERE student_id=$1 AND grade=$2 AND section=$3 AND year=$4`,[studentId, grade, section, r.year||new Date().getFullYear()])
          if(exEnr.rows.length){ skipped++; continue }
          // update student data
          const parts = (r.student_name||'').trim().split(/\s+/); const first=parts[0]||''; const last=parts.slice(1).join(' ')||''
          try{
            await conn.query(`UPDATE students SET first_name=$1, last_name=$2, birth_date=COALESCE($3::date,birth_date), gender=COALESCE($4,gender), shift=COALESCE(NULLIF($5,''),shift) WHERE id=$6`,[first,last,r.student_birth_date||null,r.student_gender||null,r.shift||'',studentId])
          }catch(e:any){ if(e.code!=='42703') throw e; await conn.query(`UPDATE students SET first_name=$1, last_name=$2 WHERE id=$3`,[first,last,studentId]) }
        }else{
          studentId=crypto.randomUUID()
          const parts=(r.student_name||'').trim().split(/\s+/); const first=parts[0]||''; const last=parts.slice(1).join(' ')||''
          const code=r.student_code||`ALU-${Date.now().toString(36).toUpperCase()}`
          try{
            await conn.query(`INSERT INTO students (id,institution_id,code,first_name,last_name,document_type,document_number,birth_date,gender,grade,section,shift,status) VALUES ($1,$2,$3,$4,$5,'DNI',$6,NULLIF($7,'')::date,NULLIF($8,''),$9,$10,$11,'active')`,[studentId,instId,code,first,last,r.student_dni,r.student_birth_date||null,r.student_gender||null,grade,section,r.shift||''])
          }catch(e:any){
            if(e.code==='42703'){
              await conn.query(`INSERT INTO students (id,institution_id,code,first_name,last_name,document_type,document_number,birth_date,gender,grade,section,status) VALUES ($1,$2,$3,$4,$5,'DNI',$6,NULLIF($7,'')::date,NULLIF($8,''),$9,$10,'active')`,[studentId,instId,code,first,last,r.student_dni,r.student_birth_date||null,r.student_gender||null,grade,section])
            } else throw e
          }
          existingMap.set(r.student_dni, studentId)
        }
        let courseId=null
        if(grade){
          const cr=await conn.query(`SELECT id FROM courses WHERE institution_id=$1 AND grade=$2 AND section=$3 LIMIT 1`,[instId, grade, section])
          courseId=cr.rows[0]?.id||null
        }
        try{
          await conn.query(`INSERT INTO enrollments (institution_id,student_id,course_id,grade,section,shift,year,status) VALUES ($1,$2,$3,$4,$5,$6,$7,'active')`,[instId, studentId, courseId, grade, section, r.shift||'', r.year||new Date().getFullYear()])
        }catch(e:any){
          if(e.code==='42703'){
            await conn.query(`INSERT INTO enrollments (institution_id,student_id,course_id,grade,section,year,status) VALUES ($1,$2,$3,$4,$5,$6,'active')`,[instId, studentId, courseId, grade, section, r.year||new Date().getFullYear()])
          } else throw e
        }
        // parent link optional
        if(r.parent_dni){
          let pid:string
          const exP = await conn.query(`SELECT id FROM parents WHERE document_number=$1 AND institution_id=$2`,[r.parent_dni, instId])
          if(exP.rows.length) pid=exP.rows[0].id
          else { pid=crypto.randomUUID(); const pp=(r.parent_name||'').split(/\s+/); await conn.query(`INSERT INTO parents (id,institution_id,first_name,last_name,document_type,document_number,phone,email) VALUES ($1,$2,$3,$4,'DNI',$5,$6,$7)`,[pid,instId,pp[0]||'',pp.slice(1).join(' ')||'',r.parent_dni,r.parent_phone||null,r.parent_email||null]) }
          const exL=await conn.query(`SELECT id FROM parent_student WHERE parent_id=$1 AND student_id=$2`,[pid, studentId])
          if(!exL.rows.length) await conn.query(`INSERT INTO parent_student (parent_id,student_id,relationship,is_primary) VALUES ($1,$2,'padre',true)`,[pid, studentId])
        }
        imported++
      }catch(e){ console.error(e); errors++ }
    }
    await conn.query('COMMIT')
    return NextResponse.json({ imported, skipped, errors })
  }catch(e:any){ await conn.query('ROLLBACK').catch(()=>{}); return NextResponse.json({error:e.message},{status:500}) }
  finally{ conn.release() }
}
