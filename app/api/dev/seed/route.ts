import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const LIMA_DISTRICTS = [
  'San Isidro', 'Miraflores', 'Barranco', 'San Borja', 'Surco',
  'San Martín de Porres', 'Jesús María', 'Lince', 'Pueblo Libre', 'Magdalena',
]

const LAST_NAMES = [
  'García', 'Rodríguez', 'Martínez', 'López', 'González',
  'Hernández', 'Pérez', 'Sánchez', 'Ramírez', 'Torres',
  'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz',
  'Morales', 'Reyes', 'Ortiz', 'Gutiérrez', 'Castillo',
]

const MALE_NAMES = [
  'Juan', 'Carlos', 'Miguel', 'José', 'Luis',
  'Jorge', 'Pedro', 'Antonio', 'Manuel', 'Francisco',
  'Alejandro', 'Roberto', 'Fernando', 'Ricardo', 'Eduardo',
]

const FEMALE_NAMES = [
  'María', 'Ana', 'Rosa', 'Carmen', 'Luz',
  'Claudia', 'Patricia', 'Sandra', 'Mónica', 'Lucía',
  'Gabriela', 'Teresa', 'Verónica', 'Elizabeth', 'Daniela',
]

const FIRST_NAMES = [...MALE_NAMES, ...FEMALE_NAMES]

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const letter = letters[Math.floor(Math.random() * letters.length)]
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${letter}${num}`
}

async function seedInstitutions(count: number) {
  const names = [
    'IEP San Martín de Porres', 'IEP Ricardo Palma', 'IEP María Montessori',
    'IEP Miguel Grau', 'IEP José Carlos Mariátegui', 'IEP Abraham Valdelomar',
    'IEP César Vallejo', 'IEP Victor Raúl Haya de la Torre', 'IEP Enrique López Albújar',
    'IEP Andrés Bello',
  ]

  const created = []
  for (let i = 0; i < count; i++) {
    const id = crypto.randomUUID()
    const code = generateCode()
    const name = names[i % names.length] + (i >= names.length ? ` ${i + 1}` : '')
    const district = randomFrom(LIMA_DISTRICTS)

    try {
      await pool.query(
        `INSERT INTO institutions (id, code, name, type, district, province, department, phone, email, status)
         VALUES (?, ?, ?, 'colegio', ?, 'Lima', 'Lima', ?, ?, 'active')`,
        [id, code, name, district, `01-555-${1000 + i}`, `contacto@${code.toLowerCase()}.edu.pe`]
      )
      created.push(code)
    } catch (e: any) {
      if (e.code === '23505') continue
      throw e
    }
  }
  return created
}

async function seedUsers(institutionIds: string[], count: number) {
  const roles = ['director', 'secretario', 'docente', 'padre']
  const hashedPassword = await bcrypt.hash('password123', 10)
  const created = []

  for (const instId of institutionIds) {
    for (let i = 0; i < count; i++) {
      const role = roles[i % roles.length]
      const firstName = randomFrom(FIRST_NAMES)
      const lastName = randomFrom(LAST_NAMES)
      const fullName = `${firstName} ${lastName}`
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 999)}@test.edu.pe`

      try {
        const userId = crypto.randomUUID()
        await pool.query(
          `INSERT INTO users (id, email, full_name, password_hash, role, institution_id, status)
           VALUES (?, ?, ?, ?, ?, ?, 'active')`,
          [userId, email, fullName, hashedPassword, role, instId]
        )
        created.push(email)
      } catch (e: any) {
        if (e.code === '23505') continue
        throw e
      }
    }
  }
  return created
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, institutionCount = 3, userCount = 5 } = body

    if (action === 'seed-institutions') {
      const codes = await seedInstitutions(institutionCount)
      return NextResponse.json({
        success: true,
        message: `${codes.length} instituciones creadas: ${codes.join(', ')}`,
      })
    }

    if (action === 'seed-users') {
      const [existing] = await pool.query('SELECT id FROM institutions ORDER BY created_at DESC LIMIT ?', [institutionCount])
      const instIds = (existing as any[]).map(r => r.id)

      if (instIds.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'No hay instituciones. Ejecuta el seed de instituciones primero.',
        })
      }

      const emails = await seedUsers(instIds, userCount)
      return NextResponse.json({
        success: true,
        message: `${emails.length} usuarios creados`,
      })
    }

    if (action === 'seed-all') {
      const codes = await seedInstitutions(institutionCount)
      const [existing] = await pool.query('SELECT id FROM institutions ORDER BY created_at DESC LIMIT ?', [institutionCount])
      const instIds = (existing as any[]).map(r => r.id)
      const emails = await seedUsers(instIds, userCount)

      // Seed audit logs
      const [users] = await pool.query('SELECT id, full_name, institution_id FROM users ORDER BY RANDOM() LIMIT 10') as any[]
      const actions = ['create', 'update', 'delete', 'enroll']
      const entities = ['students', 'enrollments', 'documents', 'users', 'courses']
      const details = [
        'Creó un nuevo alumno: Juan García López',
        'Actualizó los datos de María Rodríguez',
        'Eliminó el documento Constancia de Estudios #123',
        'Matriculó a Carlos Hernández en 3° Secundaria',
        'Registró asistencia del día para 2° Primaria Sección A',
        'Generó certificado de notas para Ana Martínez',
        'Actualizó calificaciones del 2do bimestre - Matemática',
        'Creó nuevo curso: Ciencia y Tecnología 5°',
        'Eliminó registro de reunión cancelada',
        'Editó perfil del docente Roberto Sánchez',
        'Descargó reporte de asistencia mensual',
        'Creó comunicado para padres de 4° Secundaria',
        'Aprobó matrícula de Patricia López',
        'Actualizó configuración de notificaciones',
        'Generó constancia de matrícula para Pedro Flores',
      ]

      try {
        for (let i = 0; i < 15; i++) {
          const user = users[i % users.length]
          const action = actions[i % actions.length]
          const entity = entities[i % entities.length]
          await pool.query(
            `INSERT INTO audit_logs (id, action, entity, entity_id, details, user_name, user_id, institution_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW() - INTERVAL '${i * 3} hours')`,
            [crypto.randomUUID(), action, entity, crypto.randomUUID(), details[i], user?.full_name || 'Sistema', user?.id || null, user?.institution_id || instIds[0]]
          )
        }
      } catch {}

      return NextResponse.json({
        success: true,
        message: `Seed completo: ${codes.length} instituciones, ${emails.length} usuarios, 15 registros de auditoría`,
      })
    }

    return NextResponse.json({ success: false, message: 'Acción no válida' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message || 'Error ejecutando seed',
    }, { status: 500 })
  }
}
