// Helpers de cliente para notificaciones push (web-push)

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

export function isPushSupported(): boolean {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
}

let swRegistrationCache: ServiceWorkerRegistration | null = null

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  if (swRegistrationCache) return swRegistrationCache
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    // Wait for the service worker to be active
    if (reg.installing) {
      await new Promise<void>((resolve) => {
        reg.installing!.addEventListener('statechange', (e) => {
          if ((e.target as ServiceWorker).state === 'activated') resolve()
        })
      })
    } else if (reg.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' })
      await new Promise<void>((resolve) => {
        reg.waiting!.addEventListener('statechange', (e) => {
          if ((e.target as ServiceWorker).state === 'activated') resolve()
        })
      })
    }
    swRegistrationCache = reg
    return reg
  } catch (error) {
    console.error('[push] Error registrando service worker:', error)
    return null
  }
}

export async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch('/api/push/vapid-public-key')
    if (!res.ok) {
      console.error('[push] VAPID key endpoint failed:', res.status)
      return null
    }
    const data = await res.json()
    if (!data.enabled) {
      console.error('[push] VAPID keys not configured on server')
      return null
    }
    return data.publicKey as string
  } catch (error) {
    console.error('[push] Error obteniendo VAPID key:', error)
    return null
  }
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  const reg = await registerServiceWorker()
  if (!reg) return null
  try {
    return await reg.pushManager.getSubscription()
  } catch {
    return null
  }
}

export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) {
    console.warn('[push] Push not supported in this browser')
    return false
  }

  const permission = typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  if (permission !== 'granted') {
    console.warn('[push] Notification permission not granted:', permission)
    return false
  }

  const publicKey = await getVapidPublicKey()
  if (!publicKey) {
    console.error('[push] No VAPID public key available')
    return false
  }

  const reg = await registerServiceWorker()
  if (!reg) {
    console.error('[push] Service worker registration failed')
    return false
  }

  try {
    let subscription = await reg.pushManager.getSubscription()

    if (!subscription) {
      // Need to create new subscription
      try {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
      } catch (subError: any) {
        // If subscription fails, try unsubscribing first and resubscribing
        console.warn('[push] Initial subscribe failed, trying reset:', subError?.message)
        const existing = await reg.pushManager.getSubscription()
        if (existing) await existing.unsubscribe()
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
      }
    }

    const p256dh = subscription.getKey('p256dh')
    const auth = subscription.getKey('auth')
    if (!p256dh || !auth) {
      console.error('[push] Missing subscription keys')
      return false
    }

    const toB64 = (buf: ArrayBuffer | null) =>
      btoa(String.fromCharCode(...new Uint8Array(buf as ArrayBuffer))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: { p256dh: toB64(p256dh), auth: toB64(auth) },
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[push] Failed to save subscription:', res.status, err)
      return false
    }

    console.log('[push] Subscription saved successfully')
    return true
  } catch (error) {
    console.error('[push] Error suscribiéndose a push:', error)
    return false
  }
}

// Check if user has active push subscription
// Auto-heals: if browser has subscription but DB doesn't, re-saves it
export async function isUserSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false
  const reg = await registerServiceWorker()
  if (!reg) return false
  try {
    const subscription = await reg.pushManager.getSubscription()
    if (!subscription) return false

    const res = await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`)

    // If DB is down (503), assume subscription is still active
    if (res.status === 503) return true

    if (!res.ok) return false
    const data = await res.json()

    // If browser has subscription but DB doesn't, re-save it
    if (!data.active) {
      const p256dh = subscription.getKey('p256dh')
      const auth = subscription.getKey('auth')
      if (p256dh && auth) {
        const toB64 = (buf: ArrayBuffer | null) =>
          btoa(String.fromCharCode(...new Uint8Array(buf as ArrayBuffer))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
        const saveRes = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: { p256dh: toB64(p256dh), auth: toB64(auth) },
          }),
        })
        return saveRes.ok || saveRes.status === 503
      }
    }

    return !!data.active
  } catch (error) {
    console.error('[push] Error consultando suscripción:', error)
    return false
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false
  const reg = await registerServiceWorker()
  if (!reg) return false
  try {
    const subscription = await reg.pushManager.getSubscription()
    if (!subscription) return true
    const endpoint = subscription.endpoint

    try {
      const res = await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      })
      return res.ok
    } catch {
      return false
    }
  } catch (error) {
    console.error('[push] Error desuscribiendo push:', error)
    return false
  }
}

export function isIOSPWA(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent
  return /ipad|iphone|ipod/i.test(ua) && !(window as any).MSStream
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
    || (navigator as any).standalone === true
}

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}
