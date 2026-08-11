import crypto from 'crypto'
import pool from './db'

// ============================================================
// Auditoría DEV compartida: la usa la ruta /api/dev/anomalias y
// el worker programado de server.ts (revisión automática por horario).
// Detecta cómo está constituido cada colegio, cruces de datos entre
// instituciones y anomalías/bugs. Usa imports relativos para poder
// ejecutarse con Node (server.ts) sin resolver alias de bundler.
// ============================================================

export async function tableExists(name: string): Promise<boolean> {
  try {
    const [rows] = await pool.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = ?`,
      [name]
    ) as any[]
    return (rows || []).length > 0
  } catch {
    return false
  }
}

export interface Finding {
  type: string
  severity: 'alta' | 'media' | 'baja'
  institutionId: string | null
  title: string
  detail: string
  key: string
}

function shortHash(s: string): string {
  return crypto.createHash('md5').update(s).digest('hex').slice(0, 8)
}

function finding(f: Omit<Finding, 'key'>): Finding {
  return { ...f, key: `${f.type}::${f.institutionId || 'global'}::${shortHash(f.detail)}` }
}

export interface AnomalyCheck {
  type: string
  severity: Finding['severity']
  title: string
}

export const ANOMALY_CHECKS: AnomalyCheck[] = [
  { type: 'user.inst_inexistente', severity: 'alta', title: 'Usuario apunta a institución inexistente' },
  { type: 'user.email_duplicado', severity: 'media', title: 'Correo de usuario duplicado' },
  { type: 'inst.code_duplicado', severity: 'alta', title: 'Código de institución duplicado' },
  { type: 'inst.sin_director', severity: 'baja', title: 'Institución sin usuario director' },
  { type: 'inst.sin_usuario', severity: 'media', title: 'Institución sin ningún usuario activo' },
  { type: 'plan.inexistente', severity: 'alta', title: 'Institución con plan inexistente' },
  { type: 'inst.trial_vencido_sin_plan', severity: 'media', title: 'Trial vencido sin plan asignado' },
  { type: 'inst.demo_con_plan', severity: 'media', title: 'Institución marcada DEMO pero con plan asignado' },
  { type: 'inst.con_plan_y_trial', severity: 'media', title: 'Institución con plan asignado y trial vigente' },
  { type: 'student.inst_inexistente', severity: 'alta', title: 'Estudiante apunta a institución inexistente' },
  { type: 'student.sin_matricula', severity: 'media', title: 'Estudiante activo sin matrícula activa' },
  { type: 'enrollment.duplicada', severity: 'alta', title: 'Matrícula duplicada del mismo alumno en el mismo año' },
  { type: 'teacher.inst_inexistente', severity: 'alta', title: 'Docente apunta a institución inexistente' },
  { type: 'teacher.user_cruzado', severity: 'media', title: 'Docente vinculado a usuario de otro colegio' },
  { type: 'teacher.sin_cursos', severity: 'baja', title: 'Docente sin cursos asignados' },
  { type: 'course.inst_inexistente', severity: 'alta', title: 'Curso apunta a institución inexistente' },
  { type: 'course.docente_cruzado', severity: 'media', title: 'Curso con docente de otro colegio' },
  { type: 'course.sin_docente', severity: 'baja', title: 'Curso activo sin docente asignado' },
  { type: 'enrollment.inst_inexistente', severity: 'alta', title: 'Matrícula apunta a institución inexistente' },
  { type: 'enrollment.cruzada', severity: 'alta', title: 'Matrícula CRUZADA: colegio distinto al del estudiante' },
  { type: 'enrollment.student_inexistente', severity: 'alta', title: 'Matrícula sin estudiante válido' },
  { type: 'enrollment.student_inactivo', severity: 'media', title: 'Matrícula activa de estudiante inactivo' },
  { type: 'payment.cruzada', severity: 'alta', title: 'Pago CRUZADO: colegio distinto al del estudiante' },
  { type: 'payment.student_inexistente', severity: 'alta', title: 'Pago sin estudiante válido' },
  { type: 'payment.inst_inexistente', severity: 'alta', title: 'Pago apunta a institución inexistente' },
  { type: 'payment.concepto_duplicado', severity: 'alta', title: 'Pagos pagados duplicados por alumno/concepto/año' },
  { type: 'grade.cruzada', severity: 'alta', title: 'Nota CRUZADA: colegio distinto al del estudiante' },
  { type: 'attendance.cruzada', severity: 'media', title: 'Asistencia CRUZADA: colegio distinto al del estudiante' },
  { type: 'horario.cruzada', severity: 'media', title: 'Horario CRUZADO: colegio distinto al del curso' },
  { type: 'notif.user_cruzado', severity: 'baja', title: 'Notificación con usuario de otro colegio' },
  { type: 'trialreq.inst_inexistente', severity: 'baja', title: 'Solicitud de contratación con institución inexistente' },
  { type: 'demo.completed_sin_inst', severity: 'media', title: 'Solicitud de demo completada sin institución' },
  { type: 'push.user_inexistente', severity: 'baja', title: 'Suscripción push con usuario inexistente' },
]

async function runChecks(has: Record<string, boolean>): Promise<Finding[]> {
  const out: Finding[] = []
  const Q = async (type: string, severity: Finding['severity'], title: string, sql: string, keyField = 'id', instField = 'institution_id') => {
    try {
      const [rows] = await pool.query(sql) as any[]
      for (const r of (rows || []) as any[]) {
        out.push(finding({
          type, severity, institutionId: r[instField] || null,
          title, detail: `${title} — ${r[keyField] || ''}${r.extra ? ' · ' + r.extra : ''}`.trim(),
        }))
      }
    } catch (e: any) {
      console.error(`[anomalias] check ${type} falló:`, e?.message)
    }
  }

  if (has.users && has.institutions) {
    await Q('user.inst_inexistente', 'alta', 'Usuario apunta a institución inexistente',
      `SELECT u.id, u.email AS extra, u.institution_id FROM users u
       WHERE u.institution_id IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM institutions i WHERE i.id = u.institution_id) LIMIT 100`)

    await Q('user.email_duplicado', 'media', 'Correo de usuario duplicado',
      `SELECT MIN(id) AS id, email AS extra, MIN(institution_id) AS institution_id
       FROM users GROUP BY email HAVING COUNT(*) > 1 LIMIT 100`)
  }

  if (has.institutions) {
    await Q('inst.code_duplicado', 'alta', 'Código de institución duplicado',
      `SELECT MIN(id) AS id, code AS extra, MIN(id) AS institution_id
       FROM institutions GROUP BY code HAVING COUNT(*) > 1 LIMIT 50`)

    await Q('inst.sin_director', 'baja', 'Institución sin usuario director',
      `SELECT i.id, i.name AS extra, i.id AS institution_id FROM institutions i
       WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.institution_id = i.id AND u.role = 'director')
         AND EXISTS (SELECT 1 FROM users u WHERE u.institution_id = i.id) LIMIT 100`)

    await Q('inst.sin_usuario', 'media', 'Institución sin ningún usuario activo',
      `SELECT i.id, i.name AS extra, i.id AS institution_id FROM institutions i
       WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.institution_id = i.id AND u.status = 'active') LIMIT 100`)

    await Q('plan.inexistente', 'alta', 'Institución con plan inexistente',
      `SELECT i.id, i.name AS extra, i.id AS institution_id FROM institutions i
       WHERE i.plan_id IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM plans p WHERE p.id = i.plan_id) LIMIT 100`)

    await Q('inst.trial_vencido_sin_plan', 'media', 'Trial vencido sin plan asignado',
      `SELECT i.id, i.name AS extra, i.id AS institution_id FROM institutions i
       WHERE i.status = 'active' AND i.plan_id IS NULL
         AND i.trial_ends_at IS NOT NULL AND i.trial_ends_at < NOW() LIMIT 100`)

    await Q('inst.demo_con_plan', 'media', 'Institución marcada DEMO pero con plan asignado',
      `SELECT i.id, i.name AS extra, i.id AS institution_id FROM institutions i
       WHERE UPPER(COALESCE(i.notes,'')) LIKE '%DEMO%' AND i.plan_id IS NOT NULL LIMIT 100`)

    await Q('inst.con_plan_y_trial', 'media', 'Institución con plan asignado y trial_ends_at vigente',
      `SELECT i.id, i.name AS extra, i.id AS institution_id FROM institutions i
       WHERE i.plan_id IS NOT NULL AND i.trial_ends_at IS NOT NULL LIMIT 100`)
  }

  if (has.students && has.institutions) {
    await Q('student.inst_inexistente', 'alta', 'Estudiante apunta a institución inexistente',
      `SELECT s.id, s.full_name AS extra, s.institution_id FROM students s
       WHERE NOT EXISTS (SELECT 1 FROM institutions i WHERE i.id = s.institution_id) LIMIT 100`)
  }

  if (has.students && has.enrollments) {
    await Q('student.sin_matricula', 'media', 'Estudiante activo sin matrícula activa',
      `SELECT s.id, s.full_name AS extra, s.institution_id FROM students s
       WHERE s.status = 'active' AND NOT EXISTS (
         SELECT 1 FROM enrollments e WHERE e.student_id = s.id AND e.status = 'active'
       ) LIMIT 100`)
  }

  if (has.enrollments) {
    await Q('enrollment.duplicada', 'alta', 'Matrícula duplicada del mismo alumno en el mismo año',
      `SELECT MIN(id::text) AS id, CONCAT('estudiante ', student_id, ' · año ', year) AS extra,
              MIN(institution_id) AS institution_id
       FROM enrollments WHERE status = 'active'
       GROUP BY student_id, year HAVING COUNT(*) > 1 LIMIT 100`)
  }

  if (has.teachers) {
    if (has.institutions) {
      await Q('teacher.inst_inexistente', 'alta', 'Docente apunta a institución inexistente',
        `SELECT t.id, t.email AS extra, t.institution_id FROM teachers t
         WHERE NOT EXISTS (SELECT 1 FROM institutions i WHERE i.id = t.institution_id) LIMIT 100`)
    }
    if (has.users) {
      await Q('teacher.user_cruzado', 'media', 'Docente (teachers) vinculado a usuario de otro colegio',
        `SELECT t.id, CONCAT(u.email, ' -> ', t.institution_id) AS extra, t.institution_id
         FROM teachers t JOIN users u ON u.id = t.user_id
         WHERE t.institution_id <> u.institution_id LIMIT 100`)
    }
    if (has.courses) {
      await Q('teacher.sin_cursos', 'baja', 'Docente sin cursos asignados',
        `SELECT t.id, CONCAT(t.first_name, ' ', t.last_name) AS extra, t.institution_id FROM teachers t
         WHERE NOT EXISTS (SELECT 1 FROM courses c WHERE c.teacher_id = t.user_id) LIMIT 100`)
    }
  }

  if (has.courses) {
    if (has.institutions) {
      await Q('course.inst_inexistente', 'alta', 'Curso apunta a institución inexistente',
        `SELECT c.id, c.name AS extra, c.institution_id FROM courses c
         WHERE NOT EXISTS (SELECT 1 FROM institutions i WHERE i.id = c.institution_id) LIMIT 100`)
    }
    if (has.users) {
      await Q('course.docente_cruzado', 'media', 'Curso con docente de otro colegio',
        `SELECT c.id, c.name AS extra, c.institution_id FROM courses c
         JOIN users u ON u.id = c.teacher_id
         WHERE c.teacher_id IS NOT NULL AND c.institution_id <> u.institution_id LIMIT 100`)
    }
    if (has.users) {
      await Q('course.sin_docente', 'baja', 'Curso activo sin docente asignado',
        `SELECT c.id, c.name AS extra, c.institution_id FROM courses c
         WHERE c.status = 'active' AND c.teacher_id IS NULL LIMIT 100`)
    }
  }

  if (has.enrollments) {
    if (has.institutions) {
      await Q('enrollment.inst_inexistente', 'alta', 'Matrícula apunta a institución inexistente',
        `SELECT e.id::text AS id, e.student_id AS extra, e.institution_id FROM enrollments e
         WHERE NOT EXISTS (SELECT 1 FROM institutions i WHERE i.id = e.institution_id) LIMIT 100`)
    }
    if (has.students) {
      await Q('enrollment.cruzada', 'alta', 'Matrícula CRUZADA: colegio distinto al del estudiante',
        `SELECT e.id::text AS id, CONCAT('matrícula en ', e.institution_id, ' ≠ estudiante en ', s.institution_id) AS extra,
                e.institution_id
         FROM enrollments e JOIN students s ON s.id = e.student_id
         WHERE e.institution_id IS DISTINCT FROM s.institution_id LIMIT 100`)

      await Q('enrollment.student_inexistente', 'alta', 'Matrícula sin estudiante válido',
        `SELECT e.id::text AS id, e.institution_id AS extra, e.institution_id FROM enrollments e
         WHERE NOT EXISTS (SELECT 1 FROM students s WHERE s.id = e.student_id) LIMIT 100`)

      await Q('enrollment.student_inactivo', 'media', 'Matrícula activa de estudiante inactivo',
        `SELECT e.id::text AS id, s.full_name AS extra, e.institution_id FROM enrollments e
         JOIN students s ON s.id = e.student_id
         WHERE e.status = 'active' AND s.status <> 'active' LIMIT 100`)
    }
  }

  if (has.payments) {
    if (has.students) {
      await Q('payment.cruzada', 'alta', 'Pago CRUZADO: colegio distinto al del estudiante',
        `SELECT p.id, CONCAT('pago en ', p.institution_id, ' ≠ estudiante en ', s.institution_id) AS extra,
                p.institution_id
         FROM payments p JOIN students s ON s.id = p.student_id
         WHERE p.institution_id IS DISTINCT FROM s.institution_id LIMIT 100`)

      await Q('payment.student_inexistente', 'alta', 'Pago sin estudiante válido',
        `SELECT p.id, COALESCE(p.reference, '') AS extra, p.institution_id FROM payments p
         WHERE NOT EXISTS (SELECT 1 FROM students s WHERE s.id = p.student_id) LIMIT 100`)
    }
    if (has.institutions) {
      await Q('payment.inst_inexistente', 'alta', 'Pago apunta a institución inexistente',
        `SELECT p.id, p.student_id AS extra, p.institution_id FROM payments p
         WHERE NOT EXISTS (SELECT 1 FROM institutions i WHERE i.id = p.institution_id) LIMIT 100`)
    }
    await Q('payment.concepto_duplicado', 'alta', 'Pagos pagados duplicados por alumno/concepto/año',
      `SELECT MIN(id) AS id, CONCAT(alumno, ' · concepto ', concept_id, ' x', c) AS extra, institution_id
       FROM (
         SELECT id, institution_id, student_id AS alumno, concept_id,
                EXTRACT(YEAR FROM COALESCE(paid_date, due_date)) AS yr
         FROM payments WHERE status = 'paid' AND concept_id IS NOT NULL
       ) p
       GROUP BY alumno, concept_id, yr HAVING COUNT(*) > 1 LIMIT 100`)
  }

  if (has.grades && has.students) {
    await Q('grade.cruzada', 'alta', 'Nota CRUZADA: colegio distinto al del estudiante',
      `SELECT g.id, CONCAT('nota en ', g.institution_id, ' ≠ estudiante en ', s.institution_id) AS extra,
              g.institution_id
       FROM grades g JOIN students s ON s.id = g.student_id
       WHERE g.institution_id IS DISTINCT FROM s.institution_id LIMIT 100`)
  }

  if (has.attendance && has.students) {
    await Q('attendance.cruzada', 'media', 'Asistencia CRUZADA: colegio distinto al del estudiante',
      `SELECT a.id, CONCAT('asistencia en ', a.institution_id, ' ≠ estudiante en ', s.institution_id) AS extra,
              a.institution_id
       FROM attendance a JOIN students s ON s.id = a.student_id
       WHERE a.institution_id IS DISTINCT FROM s.institution_id LIMIT 100`)
  }

  if (has.horarios && has.courses) {
    await Q('horario.cruzada', 'media', 'Horario CRUZADO: colegio distinto al del curso',
      `SELECT h.id, CONCAT('horario en ', h.institution_id, ' ≠ curso en ', c.institution_id) AS extra,
              h.institution_id
       FROM horarios h JOIN courses c ON c.id = h.course_id
       WHERE h.institution_id IS DISTINCT FROM c.institution_id LIMIT 100`)
  }

  if (has.notifications && has.users) {
    await Q('notif.user_cruzado', 'baja', 'Notificación con usuario de otro colegio',
      `SELECT n.id, CONCAT(u.email, ' -> ', n.institution_id) AS extra, n.institution_id
       FROM notifications n JOIN users u ON u.id = n.user_id
       WHERE n.user_id IS NOT NULL AND n.institution_id IS NOT NULL
         AND n.institution_id <> u.institution_id LIMIT 100`)
  }

  if (has.trial_requests) {
    await Q('trialreq.inst_inexistente', 'baja', 'Solicitud de contratación con institución inexistente',
      `SELECT t.id, t.institution_name AS extra, t.institution_id FROM trial_requests t
       WHERE t.institution_id IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM institutions i WHERE i.id = t.institution_id) LIMIT 100`)
  }

  if (has.demo_requests) {
    await Q('demo.completed_sin_inst', 'media', 'Solicitud de demo completada sin institución',
      `SELECT d.id, d.institution_name AS extra, d.institution_id FROM demo_requests d
       WHERE d.status = 'completed' AND d.institution_id IS NULL LIMIT 100`)
  }

  if (has.push_subscriptions && has.users) {
    await Q('push.user_inexistente', 'baja', 'Suscripción push con usuario inexistente',
      `SELECT s.id, s.endpoint AS extra, s.user_id AS institution_id FROM push_subscriptions s
       WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.user_id) LIMIT 100`)
  }

  return out
}

// Ejecuta el escaneo y sincroniza dev_anomaly_log. Notifica (vía notifyFn)
// solo anomalías NUEVAS y de severidad no-baja. Devuelve las nuevas notificadas.
export async function runAnomalyScan(
  notifyFn: (f: Finding) => Promise<void> | void
): Promise<{ nuevos: number; findings: Finding[]; has: Record<string, boolean> }> {
  const found: Record<string, boolean> = {}
  for (const t of ['institutions', 'users', 'students', 'teachers', 'courses', 'enrollments', 'payments', 'grades', 'attendance', 'horarios', 'notifications', 'trial_requests', 'demo_requests', 'push_subscriptions', 'plans']) {
    found[t] = await tableExists(t)
  }

  const findings = await runChecks(found)
  const keySet = new Set(findings.map(f => f.key))
  let nuevos = 0

  try {
    const [openRows] = await pool.query(
      `SELECT anomaly_key, id FROM dev_anomaly_log WHERE status = 'open'`
    ) as any[]
    const open = new Map<string, string>((openRows || []).map((r: any) => [String(r.anomaly_key), String(r.id)]))

    for (const f of findings) {
      if (open.has(f.key)) {
        await pool.query('UPDATE dev_anomaly_log SET last_seen_at = NOW() WHERE anomaly_key = ?', [f.key]).catch(() => {})
        continue
      }
      await pool.query(
        `INSERT INTO dev_anomaly_log (id, anomaly_key, institution_id, type, severity, title, detail, status, first_seen_at, last_seen_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'open', NOW(), NOW())
         ON CONFLICT (anomaly_key) DO UPDATE SET status = 'open', resolved_at = NULL, last_seen_at = NOW()`,
        [crypto.randomUUID(), f.key, f.institutionId, f.type, f.severity, f.title, f.detail]
      ).catch(() => {})
      if (f.severity !== 'baja') {
        await notifyFn(f)
        nuevos += 1
      }
    }

    for (const [key, id] of open.entries()) {
      if (!keySet.has(key)) {
        await pool.query('UPDATE dev_anomaly_log SET status = ?, resolved_at = NOW() WHERE id = ?', ['resolved', id]).catch(() => {})
      }
    }
  } catch (e: any) {
    console.error('[anomalias] error sincronizando log:', e?.message)
  }

  return { nuevos, findings, has: found }
}

export async function buildConstitution(has: Record<string, boolean>) {
  const countSub = (table: string, where = '') => {
    if (!has[table]) return '0'
    const w = where ? ` AND ${where}` : ''
    return `(SELECT COUNT(*)::int FROM ${table} x WHERE x.institution_id = i.id${w})`
  }

  const [rows] = await pool.query(
    `SELECT i.id, i.code, i.name, i.type, i.status, i.plan_id, i.trial_ends_at, i.notes, i.created_at,
            p.name AS plan_name, p.trial_days AS plan_trial_days,
            ${countSub('users')} AS users,
            ${countSub('users', "x.role = 'director'")} AS directors,
            ${countSub('students')} AS students,
            ${countSub('teachers')} AS teachers,
            ${countSub('courses')} AS courses,
            ${countSub('enrollments')} AS enrollments,
            ${countSub('payments')} AS payments
     FROM institutions i LEFT JOIN plans p ON p.id = i.plan_id
     ORDER BY i.created_at DESC`
  ).catch(() => [] as any[]) as any[]

  const raw = (rows as any[]) || []
  const now = Date.now()
  const list = raw.map(r => ({
    ...r,
    trial_vencido: !r.plan_id && !!r.trial_ends_at && new Date(r.trial_ends_at).getTime() < now,
  }))
  const agg = {
    total: list.length,
    conPlan: 0, sinPlan: 0, trialActivo: 0, trialVencido: 0, demo: 0,
    usuarios: 0, alumnos: 0, docentes: 0, cursos: 0, matriculas: 0, pagos: 0,
  }
  for (const r of list) {
    if (r.plan_id) agg.conPlan += 1
    else {
      agg.sinPlan += 1
      if (r.trial_vencido) agg.trialVencido += 1
      else agg.trialActivo += 1
    }
    if (r.notes && String(r.notes).toUpperCase().includes('DEMO')) agg.demo += 1
    agg.usuarios += Number(r.users) || 0
    agg.alumnos += Number(r.students) || 0
    agg.docentes += Number(r.teachers) || 0
    agg.cursos += Number(r.courses) || 0
    agg.matriculas += Number(r.enrollments) || 0
    agg.pagos += Number(r.payments) || 0
  }

  return { list, agg }
}

export async function getOpenAnomalies() {
  const [activeRows] = await pool.query(
    `SELECT l.*, i.name AS institution_name
     FROM dev_anomaly_log l LEFT JOIN institutions i ON i.id = l.institution_id
     WHERE l.status = 'open'
     ORDER BY CASE l.severity WHEN 'alta' THEN 0 WHEN 'media' THEN 1 ELSE 2 END, l.first_seen_at DESC
     LIMIT 200`
  ).catch(() => [] as any[]) as any[]

  const [resolvedCountRow] = await pool.query(
    `SELECT COUNT(*)::int AS count FROM dev_anomaly_log WHERE status = 'resolved'`
  ).catch(() => [{ count: 0 }] as any[]) as any[]

  return {
    anomalias: (activeRows as any[]) || [],
    resolvedCount: resolvedCountRow?.[0]?.count || 0,
  }
}