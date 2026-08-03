import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuthPayload } from '@/lib/resolveInstId'
import { checkPlanFeature } from '@/lib/checkPlanLimit'
import crypto from 'crypto'

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS homework (
      id VARCHAR(36) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      subject VARCHAR(100),
      start_date DATE,
      due_date DATE,
      status ENUM('pending','delivered','graded') DEFAULT 'pending',
      priority ENUM('high','medium','low') DEFAULT 'medium',
      assigned_by VARCHAR(36),
      student_id VARCHAR(36),
      course_id VARCHAR(36),
      institution_id VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_homework_course (course_id),
      INDEX idx_homework_student (student_id),
      INDEX idx_homework_due (due_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  const [cols] = await pool.query(`SHOW COLUMNS FROM homework LIKE 'course_id'`) as any[]
  if (cols.length === 0) {
    await pool.query(`ALTER TABLE homework ADD COLUMN course_id VARCHAR(36) AFTER student_id`)
    await pool.query(`ALTER TABLE homework ADD COLUMN institution_id VARCHAR(36) AFTER course_id`)
    await pool.query(`ALTER TABLE homework ADD INDEX idx_homework_course (course_id)`)
  }

  const [startCol] = await pool.query(`SHOW COLUMNS FROM homework LIKE 'start_date'`) as any[]
  if (startCol.length === 0) {
    await pool.query(`ALTER TABLE homework ADD COLUMN start_date DATE AFTER subject`)
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS homework_submissions (
      id VARCHAR(36) PRIMARY KEY,
      homework_id VARCHAR(36) NOT NULL,
      student_id VARCHAR(36) NOT NULL,
      status ENUM('pending','submitted','graded') DEFAULT 'pending',
      grade DECIMAL(5,2),
      feedback TEXT,
      submitted_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_submission_homework (homework_id),
      INDEX idx_submission_student (student_id),
      UNIQUE KEY uk_submission (homework_id, student_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'docente') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const instId = user.institutionId as string
    const allowed = await checkPlanFeature(instId, 'can_homework')
    if (!allowed) {
      return NextResponse.json({ error: 'Tareas no disponibles en tu plan' }, { status: 403 })
    }
    const userId = user.id as string
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')

    await ensureTables()

    let query: string
    let params: any[]

    if (courseId) {
      query = `
        SELECT h.id, h.title, h.description, h.subject, h.start_date, h.due_date, h.status, h.priority,
               h.assigned_by, h.student_id, h.course_id, h.created_at,
               COUNT(CASE WHEN hs.status IN ('submitted','graded') THEN 1 END) as delivered_count,
               COUNT(DISTINCT CASE WHEN e2.status = 'active' THEN s2.id END) as total_students
        FROM homework h
        LEFT JOIN homework_submissions hs ON hs.homework_id = h.id
        LEFT JOIN enrollments e2 ON e2.course_id = h.course_id
        LEFT JOIN students s2 ON e2.student_id = s2.id
        WHERE h.course_id = ?
        GROUP BY h.id, h.title, h.description, h.subject, h.start_date, h.due_date, h.status, h.priority,
                 h.assigned_by, h.student_id, h.course_id, h.created_at
        ORDER BY h.due_date DESC
      `
      params = [courseId]
    } else {
      query = `
        SELECT h.id, h.title, h.description, h.subject, h.start_date, h.due_date, h.status, h.priority,
               h.assigned_by, h.student_id, h.course_id, h.created_at,
               COUNT(CASE WHEN hs.status IN ('submitted','graded') THEN 1 END) as delivered_count,
               COUNT(DISTINCT CASE WHEN e2.status = 'active' THEN s2.id END) as total_students
        FROM homework h
        LEFT JOIN homework_submissions hs ON hs.homework_id = h.id
        LEFT JOIN enrollments e2 ON e2.course_id = h.course_id
        LEFT JOIN students s2 ON e2.student_id = s2.id
        WHERE h.course_id IN (
          SELECT c.id FROM courses c WHERE c.teacher_id = ? AND c.status = 'active'
        )
        GROUP BY h.id, h.title, h.description, h.subject, h.start_date, h.due_date, h.status, h.priority,
                 h.assigned_by, h.student_id, h.course_id, h.created_at
        ORDER BY h.due_date DESC
      `
      params = [userId]
    }

    const [rows] = await pool.query(query, params)
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching docente tareas:', error)
    return NextResponse.json({ error: 'Error fetching tareas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayload(request)
    if (!user || user.role !== 'docente') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const userId = user.id as string
    const instId = user.institutionId as string

    const allowed = await checkPlanFeature(instId, 'can_homework')
    if (!allowed) {
      return NextResponse.json({ error: 'Tareas no disponibles en tu plan' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, subject, start_date, due_date, priority, course_id, assigned_to_all } = body

    if (!title || !course_id) {
      return NextResponse.json({ error: 'title and course_id required' }, { status: 400 })
    }

    await ensureTables()

    if (assigned_to_all) {
      const [students] = await pool.query(
        `SELECT e.student_id FROM enrollments e WHERE e.course_id = ? AND e.status = 'active'`,
        [course_id]
      ) as any[]

      const homeworkId = crypto.randomUUID()
      await pool.query(
        `INSERT INTO homework (id, title, description, subject, start_date, due_date, status, priority, assigned_by, student_id, course_id, institution_id)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, NULL, ?, ?)`,
        [homeworkId, title, description || null, subject || null, start_date || null, due_date || null, priority || 'medium', userId, course_id, instId || null]
      )

      for (const row of students) {
        const submissionId = crypto.randomUUID()
        await pool.query(
          `INSERT INTO homework_submissions (id, homework_id, student_id, status) VALUES (?, ?, ?, 'pending')
           ON DUPLICATE KEY UPDATE status = status`,
          [submissionId, homeworkId, row.student_id]
        )
      }

      return NextResponse.json({ success: true, id: homeworkId, student_count: students.length })
    } else {
      const homeworkId = crypto.randomUUID()
      await pool.query(
        `INSERT INTO homework (id, title, description, subject, start_date, due_date, status, priority, assigned_by, student_id, course_id, institution_id)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)`,
        [homeworkId, title, description || null, subject || null, start_date || null, due_date || null, priority || 'medium', userId, null, course_id, instId || null]
      )

      return NextResponse.json({ success: true, id: homeworkId })
    }
  } catch (error) {
    console.error('Error creating tarea:', error)
    return NextResponse.json({ error: 'Error creating tarea' }, { status: 500 })
  }
}
