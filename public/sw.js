/* EduNexus Service Worker v6 */
const CACHE = 'edunexus-v6'
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
self.addEventListener('push', function(event) {
  let data = {
    title: 'EduNexus',
    message: 'Tienes una nueva notificación',
    url: '/',
    senderName: '',
    institutionName: '',
  }

  try {
    if (event.data) {
      data = Object.assign(data, event.data.json())
    }
  } catch (e) {}

  let body = data.message || ''
  if (data.senderName) body += '\n' + data.senderName
  if (data.institutionName) body += ' • ' + data.institutionName
  if (!body) body = 'Tienes una nueva notificación'

  var title = data.title || 'EduNexus'
  var icon = '/icons/icon-192x192.png'
  var badge = '/icons/icon-192x192.png'
  var url = data.url || '/'

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: icon,
      badge: badge,
      vibrate: [200, 100, 200],
      tag: 'edunexus-push',
      renotify: true,
      data: { url: url }
    })
  )

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clients) {
      clients.forEach(function(client) {
        client.postMessage({ type: 'PUSH_RECEIVED', payload: data })
      })
    })
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  var url = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(allClients) {
      for (var i = 0; i < allClients.length; i++) {
        var client = allClients[i]
        if ('focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })
  )
})
