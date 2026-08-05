import { Server } from 'socket.io'
import { createServer } from 'http'
import { parse } from 'cookie'
import { jwtVerify } from 'jose'
import pool from './lib/db'

const PORT = parseInt(process.env.SOCKET_PORT || '3001')
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'educonecta-secret')

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
