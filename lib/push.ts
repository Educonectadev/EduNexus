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

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    return reg
  } catch (error) {
    console.error('Error registrando service worker:', error)
    return null
  }
}

export async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch('/api/push/vapid-public-key')
    if (!res.ok) return null
    const data = await res.json()
    return data.enabled ? (data.publicKey as string) : null
  } catch (error) {
    console.error('Error obteniendo VAPID key:', error)
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
  if (!isPushSupported()) return false

  const permission = typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  if (permission !== 'granted') return false

  const publicKey = await getVapidPublicKey()
  if (!publicKey) return false

  const reg = await registerServiceWorker()
  if (!reg) return false

  try {
    let subscription = await reg.pushManager.getSubscription()
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
    }

    const p256dh = subscription.getKey('p256dh')
    const auth = subscription.getKey('auth')
    if (!p256dh || !auth) return false

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
    return res.ok
  } catch (error) {
    console.error('Error suscribiéndose a push:', error)
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
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      })
    } catch { /* noop */ }

    const ok = await subscription.unsubscribe()
    return ok
  } catch (error) {
    console.error('Error desuscribiendo push:', error)
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