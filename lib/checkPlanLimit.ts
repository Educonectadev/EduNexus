import pool from '@/lib/db'
import { getEffectivePermissions } from '@/lib/planPermissions'

type LimitCheck = 'students' | 'users' | 'documents' | 'certificates'
type FeatureCheck = 'can_certificates' | 'can_documents' | 'can_parents_portal' | 'can_export_reports' | 'can_bulk_import' | 'can_priority_support' | 'can_virtual_classes' | 'can_ai_assistant' | 'can_chat' | 'can_carnets' | 'can_homework' | 'can_grades' | 'can_attendance'

export async function checkPlanLimit(institutionId: string, check: LimitCheck): Promise<{ allowed: boolean; current: number; limit: number; message?: string }> {
  const [rows] = await pool.query(
    `SELECT p.max_students, p.max_users, p.features
     FROM institutions i
     JOIN plans p ON p.id = i.plan_id
     WHERE i.id = ?`,
    [institutionId]
  ) as any[]

  if (!rows || rows.length === 0) {
    return { allowed: true, current: 0, limit: Infinity }
  }

  const plan = rows[0]
  let limitField: string
  let table: string
  let countField: string

  switch (check) {
    case 'students':
      limitField = 'max_students'
      table = 'students'
      countField = 'COUNT(*)'
      break
    case 'users':
      limitField = 'max_users'
      table = 'users'
      countField = 'COUNT(*)'
      break
    case 'documents':
      limitField = 'max_students' // reuse, no dedicated field yet
      table = 'documents'
      countField = 'COUNT(*)'
      break
    case 'certificates':
      limitField = 'max_students' // reuse
      table = 'certificates'
      countField = 'COUNT(*)'
      break
  }

  const limit = plan[limitField]
  if (!limit || limit >= 999999) return { allowed: true, current: 0, limit: Infinity }

  const [countResult] = await pool.query(`SELECT ${countField} as total FROM ${table} WHERE institution_id = ?`, [institutionId]) as any[]
  const current = countResult[0]?.total || 0

  if (current >= limit) {
    const labels: Record<string, string> = {
      students: 'estudiantes',
      users: 'usuarios',
      documents: 'documentos',
      certificates: 'certificados',
    }
    return {
      allowed: false,
      current,
      limit,
      message: `Has alcanzado el límite de ${limit} ${labels[check] || check} de tu plan. Actualiza tu plan para continuar.`,
    }
  }

  return { allowed: true, current, limit }
}

export async function checkPlanFeature(institutionId: string, feature: FeatureCheck): Promise<boolean> {
  const [rows] = await pool.query(
    `SELECT p.features FROM institutions i
     JOIN plans p ON p.id = i.plan_id
     WHERE i.id = ?`,
    [institutionId]
  ) as any[]

  if (!rows || rows.length === 0) {
    return getEffectivePermissions(null)[feature]
  }

  return getEffectivePermissions(rows[0]?.features)[feature]
}
