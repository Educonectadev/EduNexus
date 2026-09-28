/* EduNexus Service Worker v7 */
const CACHE = 'edunexus-v7'
const OFFLINE_URL = '/offline.html'

const PRECACHE = [
  '/',
  '/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  OFFLINE_URL,
]

function isSameOrigin(url) {
  try {
    return new URL(url, self.location.origin).origin === self.location.origin
  } catch (e) {
    return false
  }
}

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        PRECACHE.map((url) =>
          fetch(new Request(url, { cache: 'no-cache' }))
            .then((res) => {
              if (!res || !res.ok || !isSameOrigin(res.url)) return undefined
              return cache.put(url, res)
            })
            .catch(() => undefined)
        )
      )
    )
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

function canCache(response) {
  if (!response || !response.ok) return false
  if (response.redirected && !isSameOrigin(response.url)) return false
  return isSameOrigin(response.url)
}

function cachePut(request, response) {
  if (!canCache(response)) return undefined
  const clone = response.clone()
  return caches.open(CACHE).then((cache) => cache.put(request, clone)).catch(() => undefined)
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.searchParams.has('_rsc')) return
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname.startsWith('/_next/static/')) return
  if (url.origin !== self.location.origin) return

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          cachePut(event.request, response)
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
          cachePut(event.request, response)
          return response
        })
      })
    )
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        cachePut(event.request, response)
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
