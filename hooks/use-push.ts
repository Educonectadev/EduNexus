'use client'

import * as React from 'react'
import {
  isPushSupported,
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
  isUserSubscribed,
  isIOSPWA,
  isStandalone,
  type BeforeInstallPromptEvent,
} from '@/lib/push'

type PermissionState = 'unsupported' | 'default' | 'granted' | 'denied'

export interface PushSettings {
  supported: boolean
  permission: PermissionState
  subscribed: boolean
  installPrompt: BeforeInstallPromptEvent | null
  canInstall: boolean
  standalone: boolean
  isIOS: boolean
}

export function usePushSettings(): PushSettings & {
  requestPermission: () => Promise<void>
  toggle: () => Promise<void>
  promptInstall: () => Promise<boolean>
} {
  const [supported, setSupported] = React.useState(false)
  const [permission, setPermission] = React.useState<PermissionState>('default')
  const [subscribed, setSubscribed] = React.useState(false)
  const [installPrompt, setInstallPrompt] = React.useState<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = React.useState(false)
  const [standalone, setStandalone] = React.useState(false)
  const [isIOS, setIsIOS] = React.useState(false)

  const syncPermission = React.useCallback((p: string) => {
    if (p === 'granted') setPermission('granted')
    else if (p === 'denied') setPermission('denied')
    else setPermission('default')
  }, [])

  const refreshSubscription = React.useCallback(async () => {
    try {
      const result = await isUserSubscribed()
      setSubscribed(result)
    } catch {
      // Don't change state on error
    }
  }, [])

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const pushOk = isPushSupported()
    setSupported(pushOk)
    if (!pushOk) {
      setPermission('unsupported')
      return
    }

    if (typeof Notification !== 'undefined') syncPermission(Notification.permission)

    // Register SW and check subscription with retry
    const init = async () => {
      const reg = await registerServiceWorker()
      if (reg) {
        // Wait a bit for SW to stabilize
        await new Promise(r => setTimeout(r, 500))
        await refreshSubscription()
      }
    }
    init()

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      setCanInstall(true)
    }
    const onInstalled = () => {
      setInstallPrompt(null)
      setCanInstall(false)
      setStandalone(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    setIsIOS(isIOSPWA())
    setStandalone(isStandalone())

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [syncPermission, refreshSubscription])

  const requestPermission = React.useCallback(async () => {
    if (!supported || typeof Notification === 'undefined') return
    const result = await Notification.requestPermission()
    syncPermission(result)
    if (result === 'granted') {
      // Wait a bit for permission to settle
      await new Promise(r => setTimeout(r, 300))
      const success = await subscribeToPush()
      if (success) {
        setSubscribed(true)
      } else {
        // Retry once after a delay
        await new Promise(r => setTimeout(r, 1000))
        const retry = await subscribeToPush()
        setSubscribed(retry)
      }
    }
  }, [supported, syncPermission])

  const toggle = React.useCallback(async () => {
    const active = await isUserSubscribed()
    if (active) {
      await unsubscribeFromPush()
      setSubscribed(false)
    } else {
      await requestPermission()
    }
  }, [requestPermission])

  const promptInstall = React.useCallback(async (): Promise<boolean> => {
    if (installPrompt) {
      installPrompt.prompt()
      await installPrompt.userChoice
      setInstallPrompt(null)
      setCanInstall(false)
      return true
    }
    return false
  }, [installPrompt])

  return {
    supported,
    permission,
    subscribed,
    installPrompt,
    canInstall,
    standalone,
    isIOS,
    requestPermission,
    toggle,
    promptInstall,
  }
}
