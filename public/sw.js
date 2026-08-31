/* EduNexus Service Worker - PWA Native-like */
const CACHE = 'edunexus-v2'
const OFFLINE_URL = '/offline.html'

const PRECACHE = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// Install - pre-cache critical assets
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  )
})

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

// Fetch - network first, cache fallback for navigation
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Skip non-GET, API calls, and RSC
  if (url.searchParams.has('_rsc')) return
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname.startsWith('/_next/static/')) return

  // Navigation requests - network first, offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE).then((cache) => cache.put(event.request, clone))
          return response
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match(OFFLINE_URL)))
    )
    return
  }

  // Static assets - cache first
  if (url.pathname.startsWith('/_next/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.png') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.ico')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((response) => {
          const clone = response.clone()
          caches.open(CACHE).then((cache) => cache.put(event.request, clone))
          return response
        })
      })
    )
    return
  }

  // Everything else - network with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})

// ===== Push Notifications =====
self.addEventListener('push', (event) => {
  let payload = {
    title: 'EduNexus',
    message: '',
    url: '/',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    senderName: '',
    institutionName: '',
  }
  try {
    if (event.data) payload = Object.assign(payload, event.data.json())
  } catch (e) { /* noop */ }

  let body = payload.message || ''
  const details = []
  if (payload.senderName) details.push(payload.senderName)
  if (payload.institutionName) details.push(payload.institutionName)
  if (details.length > 0) {
    body = body ? `${body}\n\n${details.join(' • ')}` : details.join(' • ')
  }

  const options = {
    body,
    icon: payload.icon || '/icons/icon-192x192.png',
    badge: payload.badge || '/icons/icon-192x192.png',
    vibrate: [120, 60, 120],
    tag: payload.tag || undefined,
    renotify: !!payload.tag,
    data: { url: payload.url || '/', type: payload.type || 'info' },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'dismiss', title: 'Cerrar' },
    ],
    requireInteraction: false,
    silent: false,
  }

  event.waitUntil(self.registration.showNotification(payload.title || 'EduNexus', options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const url = event.notification.data && event.notification.data.url

  event.waitUntil((async () => {
    const urlToOpen = url || '/'
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true })

    for (const client of allClients) {
      if (client.url.includes(urlToOpen) && 'focus' in client) {
        client.focus()
        client.navigate(urlToOpen)
        return
      }
    }

    for (const client of allClients) {
      if ('focus' in client) {
        client.focus()
        if ('navigate' in client) client.navigate(urlToOpen)
        return
      }
    }

    if (clients.openWindow) await clients.openWindow(urlToOpen)
  })())
})

self.addEventListener('notificationclose', (event) => {
  // noop
})
