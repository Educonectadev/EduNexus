/* EduNexus Service Worker - PWA Native-like */
const CACHE = 'edunexus-v4'
const OFFLINE_URL = '/offline.html'

const PRECACHE = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.searchParams.has('_rsc')) return
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname.startsWith('/_next/static/')) return

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

  let body = payload.message || 'Tienes una nueva notificación'
  const details = []
  if (payload.senderName) details.push(payload.senderName)
  if (payload.institutionName) details.push(payload.institutionName)
  if (details.length > 0) {
    body = body ? `${body}\n\n${details.join(' • ')}` : details.join(' • ')
  }

  const tag = payload.tag || `notif-${Date.now()}`

  const options = {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag,
    renotify: true,
    requireInteraction: false,
    silent: false,
    data: { url: payload.url || '/', type: payload.type || 'info', timestamp: Date.now() },
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'EduNexus', options)
      .then(() => console.log('[SW] Notification shown successfully'))
      .catch((err) => console.error('[SW] showNotification failed:', err))
  )

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: 'PUSH_RECEIVED', payload })
      })
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data && event.notification.data.url

  event.waitUntil((async () => {
    const urlToOpen = url || '/'
    const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })

    for (const client of allClients) {
      if ('focus' in client) {
        client.focus()
        client.navigate(urlToOpen)
        return
      }
    }

    if (self.clients.openWindow) await self.clients.openWindow(urlToOpen)
  })())
})

self.addEventListener('notificationclose', () => {})
