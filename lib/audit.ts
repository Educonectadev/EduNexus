import pool from '@/lib/db'
import crypto from 'crypto'

export async function logAudit(params: {
  userId: string
  institutionId: string
  action: string
  entity: string
  entityId?: string
  details?: Record<string, any>
  ipAddress?: string
}) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (id, user_id, institution_id, action, entity, entity_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        crypto.randomUUID(),
        params.userId,
        params.institutionId,
        params.action,
        params.entity,
        params.entityId || null,
        params.details ? JSON.stringify(params.details) : null,
        params.ipAddress || null,
      ]
    )
  } catch (error) {
    console.error('Audit log error:', error)
  }
}
