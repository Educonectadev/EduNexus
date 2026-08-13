import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const FIRST = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Valeria', 'Miguel', 'Lucía', 'José', 'Camila', 'Pedro', 'Daniela', 'Antonio', 'Gabriela', 'Ricardo', 'Sofía', 'Fernando', 'Claudia', 'Manuel', 'Paola']
const LAST = ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Morales', 'Reyes', 'Ortiz', 'Gutiérrez', 'Castillo']
const GRADES = ['1° Primaria', '2° Primaria', '3° Primaria', '4° Primaria', '5° Primaria', '6° Primaria', '1° Secundaria', '2° Secundaria', '3° Secundaria', '4° Secundaria', '5° Secundaria']
const COURSE_NAMES = ['Matemática', 'Comunicación', 'Ciencia y Tecnología', 'Historia, Geografía y Economía', 'Inglés', 'Educación Física']
const TIMES = [['07:30', '08:30'], ['08:30', '09:30'], ['09:45', '10:45'], ['10:45', '11:45'], ['12:00', '13:00']]

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const genDni = () => '7' + String(Math.floor(10000000 + Math.random() * 89999999))

async function dumpInto(institutionId: string, studentsCount: number) {
  const hashedPassword = await bcrypt.hash('demo1234', 10)
  const conn = await pool.getConnection()

  const [colRows] = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'users'`
  ) as any[]
  const hasPasswordHash = (colRows || []).some((c: { column_name: string }) => c.column_name === 'password_hash')

  const userCols = hasPasswordHash
    ? 'id, email, full_name, password_hash, role, institution_id, status'
    : 'id, email, full_name, password, role, institution_id, status'
  const userVals = hasPasswordHash
    ? '$1, $2, $3, $4, $5, $6, $7'
    : '$1, $2, $3, $4, $5, $6, $7'

  try {
    await conn.query('BEGIN')

    // 1. Docentes (6)
    const teachersUserIds: string[] = []
    for (let i = 0; i < 6; i++) {
      const fname = pick(FIRST); const lname = pick(LAST)
      const userId = crypto.randomUUID()
      const email = `prof.${fname.toLowerCase()}.${lname.toLowerCase()}${i}@demo.edu.pe`
      await conn.query(
        `INSERT INTO users (${userCols})
         VALUES (${userVals})`,
        [userId, email, `${fname} ${lname}`, hashedPassword, 'docente', institutionId, 'active']
      )
      await conn.query(
        `INSERT INTO teachers (id, user_id, institution_id, code, first_name, last_name, email, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')`,
        [crypto.randomUUID(), userId, institutionId, 'DOC-' + String(i + 1).padStart(3, '0'), fname, lname, email]
      )
      teachersUserIds.push(userId)
    }

    // 2. Cursos (6 con grado distinto)
    const courseIds: string[] = []
    COURSE_NAMES.forEach((cname, i) => {
      courseIds.push(crypto.randomUUID())
    })
    for (let i = 0; i < COURSE_NAMES.length; i++) {
      await conn.query(
        `INSERT INTO courses (id, institution_id, name, code, grade, section, teacher_id, status)
         VALUES ($1, $2, $3, $4, $5, 'A', $6, 'active')`,
        [courseIds[i], institutionId, COURSE_NAMES[i], 'CRS-' + String(i + 1).padStart(3, '0'), GRADES[i % GRADES.length], teachersUserIds[i % teachersUserIds.length]]
      )
    }

    // 3. Estudiantes
    const studentIds: string[] = []
    for (let i = 0; i < studentsCount; i++) {
      const fname = pick(FIRST); const lname = pick(LAST); const lname2 = pick(LAST)
      const id = crypto.randomUUID()
      const grade = pick(GRADES)
      await conn.query(
        `INSERT INTO students (id, institution_id, code, student_code, first_name, last_name, full_name, dni, gender, grade, section, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'A', 'active')`,
        [id, institutionId, 'ALU-' + String(i + 1).padStart(4, '0'), 'ALU-' + String(i + 1).padStart(4, '0'), fname, `${lname} ${lname2}`, `${fname} ${lname} ${lname2}`, genDni(), Math.random() > 0.5 ? 'M' : 'F', grade]
      )
      studentIds.push(id)
    }

    // 4. Matrículas (1 por estudiante)
    for (const sid of studentIds) {
      const courseId = pick(courseIds)
      const grade = pick(GRADES)
      await conn.query(
        `INSERT INTO enrollments (institution_id, student_id, course_id, grade, grade_level, level, section, status)
         VALUES ($1, $2, $3, $4, $4, $5, 'A', 'active')`,
        [institutionId, sid, courseId, grade, grade.includes('Secundaria') ? 'secundaria' : 'primaria']
      )
    }

    // 5. Horarios
    for (let i = 0; i < COURSE_NAMES.length; i++) {
      const day = (i % 5) + 1
      for (let s = 0; s < 2; s++) {
        const slot = TIMES[(i + s) % TIMES.length]
        await conn.query(
          `INSERT INTO horarios (id, institution_id, course_id, teacher_id, day_of_week, start_time, end_time, classroom, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')`,
          [crypto.randomUUID(), institutionId, courseIds[i], teachersUserIds[i % teachersUserIds.length], day, slot[0], slot[1], 'Aula ' + String(s + 1)]
        )
      }
    }

    // 5. Secretario (usuario con rol secretario)
    const secFname = pick(FIRST); const secLname = pick(LAST)
    const secretarioEmail = `secretaria@demo.edu.pe`
    const secUserId = crypto.randomUUID()
    await conn.query(
      `INSERT INTO users (${userCols})
       VALUES (${userVals})`,
      [secUserId, secretarioEmail, `${secFname} ${secLname}`, hashedPassword, 'secretario', institutionId, 'active']
    )

    // 6. Padres (3, vinculados a estudiantes vía email en parents)
    const parentCredentials: { email: string }[] = []
    for (let p = 0; p < 3; p++) {
      const pfname = pick(FIRST); const plname = pick(LAST)
      const pid = crypto.randomUUID()
      const pUserId = crypto.randomUUID()
      const pEmail = `padre${p + 1}@demo.edu.pe`
      const ptr = `${pfname} ${plname}`

      await conn.query(
        `INSERT INTO users (${userCols})
         VALUES (${userVals})`,
        [pUserId, pEmail, ptr, hashedPassword, 'padre', institutionId, 'active']
      )
      await conn.query(
        `INSERT INTO parents (id, institution_id, first_name, last_name, document_type, document_number, email, phone, address, occupation, user_id, status)
         VALUES ($1, $2, $3, $4, 'DNI', $5, $6, $7, '', $8, $9, 'active')`,
        [pid, institutionId, pfname, plname, genDni(), pEmail, '9' + String(Math.floor(10000000 + Math.random() * 89999999)), pick(LAST), pUserId]
      )

      // Vincula 6 estudiantes por padre
      const start = p * 6
      for (let k = 0; k < 6 && start + k < studentIds.length; k++) {
        await conn.query(
          `INSERT INTO parent_student (parent_id, student_id, relationship, is_primary)
           VALUES ($1, $2, $3, TRUE)`,
          [pid, studentIds[start + k], p === 0 ? 'padre' : p === 1 ? 'madre' : 'apoderado']
        )
      }
      parentCredentials.push({ email: pEmail })
    }

    await conn.query('COMMIT')
    return {
      students: studentIds.length,
      teachers: teachersUserIds.length,
      courses: courseIds.length,
      demoAccess: [
        { role: 'secretario', email: secretarioEmail, password: 'demo1234' },
        ...parentCredentials.map((pc, i) => ({ role: 'padre' + (i + 1), email: pc.email, password: 'demo1234' })),
      ],
    }
  } catch (err) {
    await conn.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    conn.release()
  }
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('cookie')?.match(/token=([^;]+)/)?.[1]
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'educonecta-secret')
    const { payload } = await jwtVerify(token, secret)
    if (!payload.institutionId) {
      return NextResponse.json({ error: 'Sin institución asociada' }, { status: 400 })
    }

    const body = await request.json()
    const count = Math.max(1, Math.min(60, body.students || 20))

    const result = await dumpInto(payload.institutionId as string, count)
    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error('Seed demo error:', error)
    return NextResponse.json({ error: 'Error al generar datos de ejemplo' }, { status: 500 })
  }
}