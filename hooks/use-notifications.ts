'use client'

import * as React from 'react'
import { connectSocket } from '@/lib/socket'

export interface LiveNotification {
  id: string
  title: string
  message: string
  type: string
  target_role: string | null
  institution_id: string | null
  created_at: string
  read: boolean
}

let soundCtx: AudioContext | null = null

function playNotificationSound() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    if (!Ctx) return
    if (!soundCtx) soundCtx = new Ctx()
    const ctx = soundCtx
    const play = () => {
      const notes = [880, 1108.73, 1567.98]
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq
        const t = ctx.currentTime + i * 0.12
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(0.12, t + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(t)
        osc.stop(t + 0.12)
      })
    }
    if (ctx.state === 'suspended') ctx.resume().then(play)
    else play()
  } catch { /* silencio */ }
}

function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/token=([^;]+)/)
  return match ? match[1] : null
}

export function useNotifications() {
  const [notifications, setNotifications] = React.useState<LiveNotification[]>([])
  const [loading, setLoading] = React.useState(true)
  const [unread, setUnread] = React.useState(0)
  const [live, setLive] = React.useState<LiveNotification | null>(null)
  const liveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastId = React.useRef<string>('')

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch('/api/notificaciones')
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnread(data.unread || 0)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    const t = setTimeout(() => { refresh() }, 0)
    return () => clearTimeout(t)
  }, [refresh])

  const handleNewNotification = React.useCallback((n: any) => {
    if (!n || !n.id || n.id === lastId.current) return
    lastId.current = n.id
    const item: LiveNotification = {
      id: n.id,
      title: n.title || 'Nueva notificación',
      message: n.message || '',
      type: n.type || 'info',
      target_role: n.target_role || null,
      institution_id: n.institution_id || null,
      created_at: n.created_at || new Date().toISOString(),
      read: false,
    }
    setNotifications(prev => [item, ...prev.filter(x => x.id !== item.id)].slice(0, 60))
    setUnread(u => u + 1)
    setLive(item)
    playNotificationSound()
    if (liveTimer.current) clearTimeout(liveTimer.current)
    liveTimer.current = setTimeout(() => setLive(null), 4500)
  }, [])

  React.useEffect(() => {
    const hasSocket = !!process.env.NEXT_PUBLIC_SOCKET_URL

    if (hasSocket) {
      let socket: any
      try {
        socket = connectSocket()
        if (socket) {
          socket.on('notify:new', handleNewNotification)
        }
      } catch (error) {
        console.error('Error connecting socket:', error)
      }
      return () => {
        if (socket) socket.off('notify:new', handleNewNotification)
      }
    }

    const token = getTokenFromCookie()
    if (!token) return

    let es: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      es = new EventSource(`/api/notifications/sse?token=${encodeURIComponent(token)}`)
      es.addEventListener('notification', (e) => {
        try { handleNewNotification(JSON.parse(e.data)) } catch { /* noop */ }
      })
      es.onerror = () => {
        es?.close()
        reconnectTimer = setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      es?.close()
      if (reconnectTimer) clearTimeout(reconnectTimer)
    }
  }, [handleNewNotification])

  const markOneRead = React.useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
    setUnread(u => Math.max(0, u - 1))
    try {
      await fetch('/api/notificaciones/read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    } catch { /* noop */ }
  }, [])

  const markAllRead = React.useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
    try {
      await fetch('/api/notificaciones/read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
    } catch { /* noop */ }
  }, [])

  const closeLive = React.useCallback(() => setLive(null), [])

  return { notifications, loading, unread, live, closeLive, markOneRead, markAllRead, refresh }
}
