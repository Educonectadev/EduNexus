/* EduNexus Service Worker */
const CACHE = 'edunexus-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(['/', '/manifest.json', '/icon.svg']))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Pass-through con fallback de caché (la app sigue siendo dinámica)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
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