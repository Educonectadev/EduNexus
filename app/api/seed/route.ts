import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { secret } = body

    if (secret !== 'educonecta-seed-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hash = bcrypt.hashSync('password123', 10)
    const inst1 = crypto.randomUUID()
    const inst2 = crypto.randomUUID()
    const inst3 = crypto.randomUUID()

    // Institutions
    await pool.query(`INSERT INTO institutions (id, code, name, type, district, province, department, phone, email, status) VALUES ($1, $2, $3, 'colegio', $4, 'Lima', 'Lima', $5, $6, 'active') ON CONFLICT (id) DO NOTHING`,
      [inst1, 'COL01', 'IEP San Martin de Porres', 'San Martin de Porres', '01-555-1000', 'contacto@col01.edu.pe'])
    await pool.query(`INSERT INTO institutions (id, code, name, type, district, province, department, phone, email, status) VALUES ($1, $2, $3, 'colegio', $4, 'Lima', 'Lima', $5, $6, 'active') ON CONFLICT (id) DO NOTHING`,
      [inst2, 'COL02', 'IEP Ricardo Palma', 'Miraflores', '01-555-1001', 'contacto@col02.edu.pe'])
    await pool.query(`INSERT INTO institutions (id, code, name, type, district, province, department, phone, email, status) VALUES ($1, $2, $3, 'colegio', $4, 'Lima', 'Lima', $5, $6, 'active') ON CONFLICT (id) DO NOTHING`,
      [inst3, 'COL03', 'IEP Maria Montessori', 'San Isidro', '01-555-1002', 'contacto@col03.edu.pe'])

    // Users
    const users = [
      [crypto.randomUUID(), 'admin@educonecta.pe', 'Admin General', hash, 'super_admin', inst1, '00000001', '999000001'],
      [crypto.randomUUID(), 'director@educonecta.pe', 'Carlos Director', hash, 'director', inst1, '00000002', '999000002'],
      [crypto.randomUUID(), 'secretario@educonecta.pe', 'Maria Secretaria', hash, 'secretario', inst1, '00000003', '999000003'],
      [crypto.randomUUID(), 'docente@educonecta.pe', 'Juan Docente', hash, 'docente', inst1, '00000004', '999000004'],
      [crypto.randomUUID(), 'padre@educonecta.pe', 'Pedro Padre', hash, 'padre', inst1, '00000005', '999000005'],
      [crypto.randomUUID(), 'docente2@educonecta.pe', 'Ana Docente', hash, 'docente', inst1, '00000006', '999000006'],
      [crypto.randomUUID(), 'docente3@educonecta.pe', 'Rosa Docente', hash, 'docente', inst1, '00000007', '999000007'],
    ]

    for (const u of users) {
      await pool.query(`INSERT INTO users (id, email, full_name, password_hash, role, institution_id, dni, phone, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active') ON CONFLICT (email) DO NOTHING`, u)
    }

    // Teachers
    const teachers = [
      [crypto.randomUUID(), users[3][0], inst1, 'DOC001', 'Juan', 'Docente', 'docente@educonecta.pe'],
      [crypto.randomUUID(), users[5][0], inst1, 'DOC002', 'Ana', 'Docente', 'docente2@educonecta.pe'],
      [crypto.randomUUID(), users[6][0], inst1, 'DOC003', 'Rosa', 'Docente', 'docente3@educonecta.pe'],
    ]
    for (const t of teachers) {
      await pool.query(`INSERT INTO teachers (id, user_id, institution_id, code, first_name, last_name, email, status) VALUES ($1,$2,$3,$4,$5,$6,$7,'active') ON CONFLICT (id) DO NOTHING`, t)
    }

    // Students
    const studentIds: string[] = []
    const grades = ['1ro', '2do', '3ro', '4to', '5to']
    const sections = ['A', 'B']
    for (let i = 1; i <= 10; i++) {
      const sid = crypto.randomUUID()
      studentIds.push(sid)
      await pool.query(`INSERT INTO students (id, institution_id, code, first_name, last_name, dni, grade, section, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active') ON CONFLICT (id) DO NOTHING`,
        [sid, inst1, `ALU${String(i).padStart(3,'0')}`, `Alumno${i}`, `Apellido${i}`, String(10000000+i), grades[i%5], sections[i%2]])
    }

    // Courses
    const c1 = crypto.randomUUID(), c2 = crypto.randomUUID(), c3 = crypto.randomUUID()
    await pool.query(`INSERT INTO courses (id, institution_id, name, code, grade, section, teacher_id, status) VALUES ($1,$2,$3,$4,$5,$6,$7,'active') ON CONFLICT (id) DO NOTHING`,
      [c1, inst1, 'Matematica 1ro A', 'MAT1A', '1ro', 'A', users[3][0]])
    await pool.query(`INSERT INTO courses (id, institution_id, name, code, grade, section, teacher_id, status) VALUES ($1,$2,$3,$4,$5,$6,$7,'active') ON CONFLICT (id) DO NOTHING`,
      [c2, inst1, 'Comunicaciones 1ro A', 'COM1A', '1ro', 'A', users[5][0]])
    await pool.query(`INSERT INTO courses (id, institution_id, name, code, grade, section, teacher_id, status) VALUES ($1,$2,$3,$4,$5,$6,$7,'active') ON CONFLICT (id) DO NOTHING`,
      [c3, inst1, 'Ciencia 2do A', 'CIE2A', '2do', 'A', users[6][0]])

    // Enrollments
    for (let i = 0; i < 10; i++) {
      await pool.query(`INSERT INTO enrollments (institution_id, student_id, course_id, grade, section, year, status) VALUES ($1,$2,$3,$4,'A',2026,'active') ON CONFLICT DO NOTHING`,
        [inst1, studentIds[i], i < 5 ? c1 : c2, i < 5 ? '1ro' : '2do'])
    }

    // Horarios
    for (let d = 1; d <= 5; d++) {
      await pool.query(`INSERT INTO horarios (id, institution_id, course_id, teacher_id, day_of_week, start_time, end_time, classroom, status) VALUES ($1,$2,$3,$4,$5,'08:00','09:00','A-101','active') ON CONFLICT DO NOTHING`,
        [crypto.randomUUID(), inst1, c1, users[3][0], d])
      await pool.query(`INSERT INTO horarios (id, institution_id, course_id, teacher_id, day_of_week, start_time, end_time, classroom, status) VALUES ($1,$2,$3,$4,$5,'09:00','10:00','A-102','active') ON CONFLICT DO NOTHING`,
        [crypto.randomUUID(), inst1, c2, users[5][0], d])
    }

    return NextResponse.json({
      success: true,
      message: 'Seed completo: 3 instituciones, 7 usuarios, 3 docentes, 10 alumnos, 3 cursos, 10 matriculas, 10 horarios',
      credentials: {
        super_admin: 'admin@educonecta.pe / password123',
        director: 'director@educonecta.pe / password123',
        secretario: 'secretario@educonecta.pe / password123',
        docente: 'docente@educonecta.pe / password123',
        padre: 'padre@educonecta.pe / password123',
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
