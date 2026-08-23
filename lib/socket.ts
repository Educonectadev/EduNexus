'use client'

import io from 'socket.io-client'

let socket: any = null

export function getSocket(): any {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL
    if (!url) return null
    socket = io(url, {
      autoConnect: false,
      reconnection: false,
      timeout: 5000,
    })
  }
  return socket
}

export function connectSocket() {
  const s = getSocket()
  if (!s) return null
  if (!s.connected) {
    s.connect()
  }
  return s
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
