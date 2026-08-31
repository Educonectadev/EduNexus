/* EduNexus Service Worker */
const CACHE = 'edunexus-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled([
        cache.add('/manifest.json').catch(() => {}),
        cache.add('/icon.svg').catch(() => {}),
      ])
    )
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Pass-through: solo caché de archivos estáticos, sin interceptar RSC/API
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  // No interceptar requests de RSC, API, ni SSE
  if (url.searchParams.has('_rsc') || url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) return
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  )
})

// ===== Notificaciones push =====
self.addEventListener('push', (event) => {
  let payload = { title: 'EduNexus', message: '', url: '/', icon: '/icon.svg', badge: '/icon.svg' }
  try {
    if (event.data) payload = Object.assign(payload, event.data.json())
  } catch (e) { /* payload vacío */ }

  const options = {
    body: payload.message || '',
    icon: payload.icon || '/icon.svg',
    badge: payload.badge || '/icon.svg',
    data: { url: payload.url || '/', type: payload.type || 'info' },
    tag: payload.tag || undefined,
    renotify: !!payload.tag,
    vibrate: [120, 60, 120],
  }

  event.waitUntil(self.registration.showNotification(payload.title || 'EduNexus', options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data && event.notification.data.url

  event.waitUntil((async () => {
    const urlToOpen = url || '/'
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true })
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
  // Se puede registrar aquí el cierre si se quiere tracking
})