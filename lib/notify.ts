import crypto from 'crypto'
import pool from '@/lib/db'
import { sendPushToRole, sendPushToUsers } from '@/lib/server-push'

// Creación centralizada de notificaciones en la tabla `notifications`.
// El trigger trg_notify_new_notification emite pg_notify('edu_notifications')
// y el servidor Socket.IO lo entrega en tiempo real:
//  - userIds -> a la sala user:{id} (notificación individual)
//  - targetRole/área -> a las salas notif:{institution}:{rol} o :all

interface NotifyOptions {
  institutionId: string
  title: string
  message: string
  type?: string
  category?: string
  priority?: string
  targetRole?: string
  userIds?: string[]
}

export async function createNotify(opts: NotifyOptions) {
  const {
    institutionId, title, message,
    type = 'info', category = 'general', priority = 'media',
    targetRole = 'all', userIds,
  } = opts

  if (!title) return
  try {
    if (userIds && userIds.length > 0) {
      await pool.query(
        `INSERT INTO notifications (id, institution_id, title, message, type, target_role, category, priority, status, user_id)
         SELECT CAST(gen_random_uuid() AS VARCHAR(36)), ?, ?, ?, ?, ?, ?, ?, 'active', uid
         FROM UNNEST(?::text[]) AS uid
         WHERE EXISTS (SELECT 1 FROM users u WHERE u.id = uid AND u.status = 'active')`,
        [institutionId, title, message, type, targetRole, category, priority, userIds]
      )
      // Send push to specific users
      sendPushToUsers(userIds, {
        title,
        message: message.substring(0, 200),
        type,
      }).catch(() => {})
      return
    }
    await pool.query(
      `INSERT INTO notifications (id, institution_id, title, message, type, target_role, category, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [crypto.randomUUID(), institutionId, title, message, type, targetRole, category, priority]
    )
    // Send push to role
    sendPushToRole(institutionId, targetRole, {
      title,
      message: message.substring(0, 200),
      type,
    }).catch(() => {})
  } catch (error) {
    console.error('[notify] error:', error)
  }
}

export const notifyRole = (
  institutionId: string, targetRole: string, title: string, message: string,
  type = 'info', category = 'general', priority = 'media',
) => createNotify({ institutionId, title, message, type, category, priority, targetRole })

export const notifyAll = (
  institutionId: string, title: string, message: string,
  type = 'info', category = 'general', priority = 'media',
) => createNotify({ institutionId, title, message, type, category, priority })

export const notifyUsers = (
  institutionId: string, userIds: string[], title: string, message: string,
  type = 'info', category = 'general', priority = 'media',
) => createNotify({ institutionId, title, message, type, category, priority, userIds })

// Notifica a los padres vinculados a uno o varios alumnos
export async function notifyParentsOfStudents(
  institutionId: string, studentIds: string[], title: string, message: string,
  type = 'info', category = 'general', priority = 'media',
) {
  if (!studentIds?.length) return
  try {
    // First get the parent user IDs
    const [parentRows] = await pool.query(
      `SELECT DISTINCT u.id
       FROM parent_student ps
       JOIN parents p ON p.id = ps.parent_id
       JOIN users u ON u.email = p.email
       WHERE ps.student_id = ANY(?::text[]) AND u.role = 'padre' AND u.status = 'active'`,
      [studentIds]
    ) as any[]
    
    const parentUserIds = (parentRows || []).map((r: any) => r.id)
    
    await pool.query(
      `INSERT INTO notifications (id, institution_id, title, message, type, target_role, category, priority, status, user_id)
       SELECT CAST(gen_random_uuid() AS VARCHAR(36)), ?, ?, ?, ?, 'padre', ?, ?, 'active', u.id
       FROM parent_student ps
       JOIN parents p ON p.id = ps.parent_id
       JOIN users u ON u.email = p.email
       WHERE ps.student_id = ANY(?::text[]) AND u.role = 'padre' AND u.status = 'active'`,
      [institutionId, title, message, type, category, priority, studentIds]
    )
    
    // Send push to parent users
    if (parentUserIds.length > 0) {
      sendPushToUsers(parentUserIds, {
        title,
        message: message.substring(0, 200),
        type,
      }).catch(() => {})
    }
  } catch (error) {
    console.error('[notify-parents] error:', error)
  }
}

// Resuelve el docente (usuario) asignado a un curso
export async function resolveCourseTeacherUser(courseId: string): Promise<string | null> {
  try {
    const [rows] = await pool.query(
      `SELECT t.user_id FROM courses c JOIN teachers t ON c.teacher_id = t.id WHERE c.id = ?`,
      [courseId]
    ) as any[]
    if ((rows as any[])?.length && (rows as any[])[0]?.user_id) return (rows as any[])[0].user_id
  } catch { /* tabla teachers quizá no existe */ }

  try {
    const [rows] = await pool.query(
      `SELECT u.id FROM courses c JOIN users u ON c.teacher_id = u.id AND u.role = 'docente' WHERE c.id = ?`,
      [courseId]
    ) as any[]
    if ((rows as any[])?.length) return (rows as any[])[0].id
  } catch { /* noop */ }

  return null
}

export async function getCourseName(courseId: string): Promise<string> {
  try {
    const [rows] = await pool.query(`SELECT name FROM courses WHERE id = ?`, [courseId]) as any[]
    return (rows as any[])[0]?.name || 'Curso'
  } catch {
    return 'Curso'
  }
}

const DAY_NAMES: Record<string, string> = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo',
}

export function dayName(day: string | number): string {
  return DAY_NAMES[String(day)] || `Día ${day}`
}

export function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })
}