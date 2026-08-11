import { Server } from 'socket.io'
import { createServer } from 'http'
import { parse } from 'cookie'
import { jwtVerify } from 'jose'
import { Client } from 'pg'
import crypto from 'crypto'
import pool from './lib/db'
import webpush from 'web-push'
import { runAnomalyScan } from './lib/anomalies'

const PORT = parseInt(process.env.SOCKET_PORT || '3001')
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'educonecta-secret')
const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')

// ===== WEB PUSH (VAPID) =====
const pushReady = !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
if (pushReady) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:soporte@educonecta.pe',
    process.env.VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string
  )
  console.log('Web push habilitado (VAPID configurado)')
} else {
  console.warn('Web push deshabilitado: faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY')
}

function pushTargetPath(role?: string, type?: string): string {
  if (type === 'demo_request' || type === 'trial_request') return '/dev/demo'
  if (role === 'dev' || role === 'super_admin') return '/dev'
  if (role === 'padre') return '/padre'
  return '/panel'
}

// Envía notificaciones push a las suscripciones que correspondan según el destino
// de la notificación (user_id, target_role 'dev', o institución + rol).
async function dispatchWebPush(data: any) {
  if (!pushReady) return
  try {
    const { user_id, target_role, institution_id } = data
    let rows: any[] = []

    if (user_id) {
      ;[rows] = await pool.query(
        `SELECT s.endpoint, s.p256dh, s.auth, u.role AS "role"
         FROM push_subscriptions s
         JOIN users u ON u.id = s.user_id
         WHERE s.user_id = ? AND u.status = 'active'`,
        [user_id]
      )
    } else if (target_role === 'dev') {
      ;[rows] = await pool.query(
        `SELECT s.endpoint, s.p256dh, s.auth, u.role AS "role"
         FROM push_subscriptions s
         JOIN users u ON u.id = s.user_id
         WHERE u.role = 'dev' AND u.status = 'active'`
      )
    } else if (institution_id) {
      const roleClause = target_role && target_role !== 'all' ? ' AND u.role = ?' : ''
      const params = target_role && target_role !== 'all'
        ? [institution_id, target_role]
        : [institution_id]
      ;[rows] = await pool.query(
        `SELECT s.endpoint, s.p256dh, s.auth, u.role AS "role"
         FROM push_subscriptions s
         JOIN users u ON u.id = s.user_id
         WHERE u.institution_id = ? AND u.status = 'active'${roleClause}`,
        params
      )
    }

    if (!rows.length) return

    const payload = JSON.stringify({
      title: data.title || 'Nueva notificación',
      message: data.message || '',
      url: BASE_URL + pushTargetPath(data.target_role || rows[0]?.role, data.type),
      type: data.type || 'info',
    })

    await Promise.allSettled(rows.map((r) =>
      webpush
        .sendNotification({ endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } }, payload)
        .catch((err: any) => {
          // Suscripción obsoleta: limpiar
          if (err && (err.statusCode === 404 || err.statusCode === 410)) {
            pool.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [r.endpoint]).catch(() => {})
          } else if (err && err.statusCode) {
            console.error('Push error', err.statusCode, r.endpoint)
          }
        })
    ))

    console.log(`push -> ${rows.length} suscripción(es) (${data.title || 'sin título'})`)
  } catch (error) {
    console.error('Error dispatching web push:', error)
  }
}

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    credentials: true
  }
})

io.use(async (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie || ''
    const cookies = parse(cookieHeader)
    const token = cookies.token

    if (!token) {
      return next(new Error('No token provided'))
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    socket.data.userId = payload.id as string
    socket.data.userRole = payload.role as string
    socket.data.institutionId = payload.institutionId as string
    socket.data.fullName = payload.fullName as string
    next()
  } catch (error) {
    next(new Error('Invalid token'))
  }
})

io.on('connection', (socket) => {
  const { userId, institutionId, fullName } = socket.data
  console.log(`User connected: ${fullName} (${userId})`)

  socket.join(`inst:${institutionId}`)
  socket.join(`user:${userId}`)

  const userRole = socket.data.userRole as string | undefined

  if (institutionId) {
    socket.join(`notif:${institutionId}:all`)
    if (userRole) socket.join(`notif:${institutionId}:${userRole}`)
  }

  // Usuarios sin institución (dev) reciben avisos globales de solicitudes
  if (userRole === 'dev') {
    socket.join('notif:dev')
  }

  io.to(`inst:${institutionId}`).emit('user:online', { userId, fullName })

  socket.on('message:send', async (data) => {
    try {
      const { receiverId, courseId, message, messageType } = data

      const id = crypto.randomUUID()
      await pool.query(
        `INSERT INTO chat_messages (id, institution_id, sender_id, receiver_id, course_id, message, message_type)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, institutionId, userId, receiverId || null, courseId || null, message, messageType || 'text']
      )

      const messageData = {
        id,
        sender_id: userId,
        sender_name: fullName,
        receiver_id: receiverId,
        course_id: courseId,
        message,
        message_type: messageType || 'text',
        created_at: new Date().toISOString(),
        is_read: false
      }

      if (receiverId) {
        io.to(`user:${receiverId}`).emit('message:new', messageData)
        socket.emit('message:new', messageData)

        // Aviso en campana si el destinatario es un padre
        try {
          const [rRows] = await pool.query(`SELECT role FROM users WHERE id = ?`, [receiverId])
          if (rRows[0]?.role === 'padre') {
            await pool.query(
              `INSERT INTO notifications (id, institution_id, title, message, type, target_role, category, priority, status, user_id)
               VALUES (?, ?, 'Nuevo mensaje', ?, 'message', 'padre', 'mensajes', 'media', 'active', ?)`,
              [crypto.randomUUID(), institutionId, `${fullName} te escribió: "${String(message).slice(0, 120)}"`, receiverId]
            )
          }
        } catch (error) {
          console.error('Error notifying parent:', error)
        }
      } else if (courseId) {
        io.to(`inst:${institutionId}`).emit('message:new', messageData)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      socket.emit('message:error', { error: 'Error sending message' })
    }
  })

  socket.on('message:read', async (data) => {
    try {
      const { messageId } = data
      await pool.query(
        'UPDATE chat_messages SET is_read = true WHERE id = ? AND receiver_id = ?',
        [messageId, userId]
      )
      socket.emit('message:read:confirm', { messageId })
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  })

  socket.on('typing:start', (data) => {
    const { receiverId } = data
    if (receiverId) {
      io.to(`user:${receiverId}`).emit('typing:start', { userId, fullName })
    }
  })

  socket.on('typing:stop', (data) => {
    const { receiverId } = data
    if (receiverId) {
      io.to(`user:${receiverId}`).emit('typing:stop', { userId })
    }
  })

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${fullName} (${userId})`)
    io.to(`inst:${institutionId}`).emit('user:offline', { userId })
  })
})

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`)
})

// ===== NOTIFICACIONES EN TIEMPO REAL =====
// Se suscribe a Postgres LISTEN/NOTIFY ('edu_notifications') activado por el
// trigger trg_notify_new_notification al insertar filas en la tabla notifications.
// Al recibir el payload lo transmite a las rooms notif:{institution}:{targetRole}
// (o notif:{institution}:all si target_role = 'all'), con un sonido/typing al cliente.

function buildListenerConfig() {
  const conn = process.env.DATABASE_URL || process.env.POSTGRES_URL
  const ssl = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
  if (conn) return { connectionString: conn, ssl }
  return {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl,
  }
}

async function listenNotifications() {
  const client = new Client(buildListenerConfig())
  try {
    await client.connect()
    await client.query('LISTEN edu_notifications')
    console.log('Notification listener: LISTEN edu_notifications active')

    client.on('notification', (msg) => {
      try {
        const data = JSON.parse(msg.payload || '{}')
        const { institution_id, target_role, user_id } = data

        // Notificación individual (ej: docentes, padres de un alumno)
        if (user_id) {
          io.to(`user:${user_id}`).emit('notify:new', data)
          console.log(`notify:new -> user:${user_id} (${data.title || 'sin título'})`)
          dispatchWebPush(data)
          return
        }

        // Solicitudes para el rol dev (sin institución): sala global notif:dev
        if (target_role && target_role === 'dev') {
          io.to('notif:dev').emit('notify:new', data)
          console.log(`notify:new -> notif:dev (${data.title || 'sin título'})`)
          dispatchWebPush(data)
          return
        }

        if (!institution_id) return
        const room = target_role && target_role !== 'all'
          ? `notif:${institution_id}:${target_role}`
          : `notif:${institution_id}:all`
        io.to(room).emit('notify:new', data)
        console.log(`notify:new -> ${room} (${data.title || 'sin título'})`)
        dispatchWebPush(data)
      } catch (error) {
        console.error('Error processing notification payload:', error)
      }
    })

    client.on('error', (error) => {
      console.error('Notification listener error:', error)
      setTimeout(listenNotifications, 5000)
    })
  } catch (error) {
    console.error('Notification listener failed, retrying in 5s:', error)
    setTimeout(listenNotifications, 5000)
  }
}

listenNotifications()

// ===== AUDITORÍA AUTOMÁTICA POR HORARIO =====
// Revisa la constitución de los colegios y las anomalías/cruces de datos
// periódicamente. Las anomalías NUEVAS (no-baja) se notifican al dev:
// se inserta una fila en notifications (target_role='dev'), el trigger de
// realtime la entrega en vivo a la sala notif:dev y dispatchWebPush la
// envía como push a las suscripciones del dev. No re-notifica las que ya
// están abiertas (runAnomalyScan sincroniza dev_anomaly_log).
async function runScheduledAudit() {
  const started = new Date().toISOString()
  try {
    const { nuevos, findings } = await runAnomalyScan(async (f) => {
      try {
        await pool.query(
          `INSERT INTO notifications (id, institution_id, title, message, type, target_role, category, priority, status)
           VALUES (?, NULL, ?, ?, 'anomalia', 'dev', 'errores', ?, 'active')`,
          [crypto.randomUUID(), `Anomalía (${f.severity}): ${f.title}`, f.detail, f.severity === 'alta' ? 'alta' : 'media']
        )
      } catch (error) {
        console.error('[auditoría] error creando notificación dev:', error)
      }
    })
    console.log(`[auditoría] revisión ${started}: ${findings.length} anomalía(s) detectadas, ${nuevos} nueva(s) notificada(s)`)
  } catch (error) {
    console.error('[auditoría] error en revisión programada:', error)
  }
}

// Al arrancar y luego cada 12 horas
runScheduledAudit()
const AUDIT_INTERVAL_MS = 12 * 60 * 60 * 1000
setInterval(runScheduledAudit, AUDIT_INTERVAL_MS)
