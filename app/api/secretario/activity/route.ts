import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ activities: [] })

    const limit = 20

    // Matrículas recientes
    const [enrollments] = await pool.query(
      `SELECT e.id, e.grade, e.section, e.created_at,
              CONCAT(s.first_name, ' ', s.last_name) AS student_name
       FROM enrollments e
       JOIN students s ON e.student_id = s.id
       WHERE s.institution_id = ?
       ORDER BY e.created_at DESC LIMIT ?`,
      [instId, limit]
    ) as any

    // Asistencia registrada
    const [attendance] = await pool.query(
      `SELECT a.id, a.date, a.created_at,
              CONCAT(s.first_name, ' ', s.last_name) AS student_name,
              s.grade, s.section
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       WHERE a.institution_id = ?
       ORDER BY a.created_at DESC LIMIT ?`,
      [instId, limit]
    ) as any

    // Pagos
    const [payments] = await pool.query(
      `SELECT p.*, CONCAT(s.first_name, ' ', s.last_name) AS student_name,
              COALESCE(pc.name, p.concept, 'Colegiatura') AS concept_name
       FROM payments p
       JOIN students s ON p.student_id = s.id
       LEFT JOIN payment_concepts pc ON p.concept_id = pc.id
       WHERE p.institution_id = ?
       ORDER BY p.created_at DESC LIMIT ?`,
      [instId, limit]
    ) as any

    // Documentos emitidos
    let issuedDocs: any[] = []
    try {
      const [docs] = await pool.query(
        `SELECT d.id, d.type, d.created_at,
                CONCAT(s.first_name, ' ', s.last_name) AS student_name
         FROM issued_documents d
         JOIN students s ON d.student_id = s.id
         WHERE d.institution_id = ?
         ORDER BY d.created_at DESC LIMIT ?`,
        [instId, limit]
      ) as any
      issuedDocs = docs
    } catch {}

    type RawActivity = { id: any; created_at: any; type: string; act_title: string; act_desc: string; color: string }

    const items: RawActivity[] = []

    ;(enrollments as any[]).forEach((e: any) => {
      if (e.grade && e.section) {
        items.push({
          id: `m-${e.id}-${e.created_at}`, created_at: e.created_at,
          type: 'matricula',
          act_title: 'Nueva matricula',
          act_desc: `Se registro un nuevo alumno (${e.student_name}) en ${e.grade}${e.section ? ` ${e.section}` : ''}`,
          color: '#10b981',
        })
      }
    })

    ;(attendance as any[]).forEach((a: any) => {
      items.push({
        id: `a-${a.id}-${a.created_at}`,
        created_at: a.created_at || a.date,
        type: 'asistencia',
        act_title: 'Asistencia registrada',
        act_desc: `Se registro asistencia de ${a.grade}${a.section ? ` ${a.section}` : ''}`,
        color: '#3b82f6',
      })
    })

    ;(payments as any[]).forEach((p: any) => {
      if (p.payment_date) {
        items.push({
          id: `p-${p.id}-${p.payment_date}`,
          created_at: p.payment_date,
          type: 'pago',
          act_title: 'Pago registrado',
          act_desc: `${p.concept_name} — ${p.student_name}`,
          color: '#8b5cf6',
        })
      }
    })

    ;(issuedDocs as any[]).forEach((d: any) => {
      items.push({
        id: `d-${d.id}-${d.created_at}`,
        created_at: d.created_at,
        type: 'documento',
        act_title: 'Documento generado',
        act_desc: `${d.type === 'certificado' ? 'Certificado' : 'Constancia'} para ${d.student_name}`,
        color: '#f59e0b',
      })
    })

    // Ordenar por fecha, más recientes primero
    items.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const activities = items.slice(0, limit).map((it: any) => ({
      id: it.id,
      type: it.type,
      title: it.act_title,
      description: it.act_desc,
      time: it.created_at ? new Date(it.created_at).toISOString() : null,
      color: it.color,
    }))

    return NextResponse.json({ activities })
  } catch (error) {
    return NextResponse.json({ activities: [] })
  }
}