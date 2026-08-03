import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'

export async function GET(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({}, { status: 200 })

    const [[enrollments]] = await pool.query('SELECT COUNT(*) as count FROM enrollments WHERE institution_id = ? AND status = "active"', [instId]) as any
    const [[pending]] = await pool.query('SELECT COUNT(*) as count FROM enrollments WHERE institution_id = ? AND status = "pending"', [instId]) as any
    const [[activeStudents]] = await pool.query('SELECT COUNT(*) as count FROM students WHERE institution_id = ? AND status = "active"', [instId]) as any
    const [[totalStudents]] = await pool.query('SELECT COUNT(*) as count FROM students WHERE institution_id = ?', [instId]) as any
    const [[courses]] = await pool.query('SELECT COUNT(*) as count FROM courses WHERE institution_id = ?', [instId]) as any
    const [[schedules]] = await pool.query('SELECT COUNT(*) as count FROM horarios WHERE institution_id = ?', [instId]) as any
    const [[parents]] = await pool.query('SELECT COUNT(*) as count FROM parents WHERE institution_id = ?', [instId]) as any
    const [[issuedDocs]] = await pool.query('SELECT COUNT(*) as count FROM issued_documents WHERE institution_id = ?', [instId]) as any
    const [[instInfo]] = await pool.query('SELECT name, code FROM institutions WHERE id = ?', [instId]) as any

    // Count documents and certificates (try/catch in case tables don't exist yet)
    let documentsCount = 0
    let certificatesCount = 0
    try {
      const [[docs]] = await pool.query('SELECT COUNT(*) as count FROM documents WHERE institution_id = ?', [instId]) as any
      documentsCount = docs?.count || 0
    } catch {}
    try {
      const [[certs]] = await pool.query('SELECT COUNT(*) as count FROM certificates WHERE institution_id = ?', [instId]) as any
      certificatesCount = certs?.count || 0
    } catch {}

    const [pendingPayments] = await pool.query(
      'SELECT COALESCE(SUM(amount - paid_amount), 0) as total FROM payments WHERE institution_id = ? AND status IN ("pending","partial","overdue")',
      [instId]
    ) as any

    const [todayAttendance] = await pool.query(
      'SELECT COUNT(*) as count FROM attendance WHERE institution_id = ? AND date = CURDATE() AND status = "absent"',
      [instId]
    ) as any

    return NextResponse.json({
      active_students: activeStudents[0]?.count || 0,
      total_students: totalStudents[0]?.count || 0,
      enrollments: enrollments[0]?.count || 0,
      pending: pending[0]?.count || 0,
      courses: courses[0]?.count || 0,
      schedules: schedules[0]?.count || 0,
      parents: parents[0]?.count || 0,
      documents: documentsCount,
      issued_documents: issuedDocs[0]?.count || 0,
      certificates: certificatesCount,
      total_debt: pendingPayments[0]?.total || 0,
      absent_today: todayAttendance[0]?.count || 0,
      institution_name: instInfo?.name || '',
      institution_code: instInfo?.code || '',
    })
  } catch (error) {
    return NextResponse.json({})
  }
}
