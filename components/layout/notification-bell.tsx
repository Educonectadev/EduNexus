"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell, BellRing, X, CheckIcon, Clock, Inbox, Megaphone, Handshake, Users,
  Download, Smartphone, Info, Power, Zap, Loader2, CheckCircle,
} from "@/components/ui/proicons"
import { cn } from "@/lib/utils"
import { useNotifications, type LiveNotification } from "@/hooks/use-notifications"
import { usePushSettings } from "@/hooks/use-push"

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "Ahora"
  if (m < 60) return `Hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return "Ayer"
  if (d < 7) return `Hace ${d} días`
  return new Date(iso).toLocaleDateString("es-PE")
}

function notifMeta(type: string): { icon: React.ComponentType<{ className?: string }>; cls: string } {
  switch (type) {
    case "meeting": return { icon: Handshake, cls: "bg-amber-500/10 text-amber-500" }
    case "communication": return { icon: Megaphone, cls: "bg-sb-primary/10 text-sb-primary" }
    case "trial_request": return { icon: Users, cls: "bg-violet-500/10 text-violet-500" }
    default: return { icon: BellRing, cls: "bg-emerald-500/10 text-emerald-500" }
  }
}

export default function NotificationBell() {
  const { notifications, loading, unread, live, closeLive, markOneRead, markAllRead } = useNotifications()
  const push = usePushSettings()
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pushBusy, setPushBusy] = React.useState(false)
  const unreadCount = Math.min(unread, 99)

  const toggle = () => setOpen(o => !o)

  let pushStatus = "Recibe avisos aunque la app esté cerrada"
  let pushLabel = "Activar"
  let pushDisabled = false
  if (push.permission === "granted" && push.subscribed) {
    pushStatus = "Activadas en este dispositivo"
    pushLabel = "Desactivar"
  } else if (push.permission === "granted") {
    pushStatus = "Listas, falta suscribirse"
    pushLabel = "Activar"
  } else if (push.permission === "denied") {
    pushStatus = "Bloqueadas por el navegador"
    pushLabel = "Bloqueada"
    pushDisabled = true
  }

  const handlePushToggle = async () => {
    setPushBusy(true)
    try {
      await push.toggle()
    } finally {
      setPushBusy(false)
    }
  }

  return (
    <>
      <button
        onClick={toggle}
        aria-label="Notificaciones"
        className="flex items-center justify-center p-2 rounded-xl text-sb-on-surface-variant hover:bg-sb-surface-container-highest/50 hover:text-sb-on-surface/80 transition-all relative"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="t-badge" data-open={unreadCount > 0 ? "true" : "false"}>
            <span className="t-badge-dot">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* ===== TOAST EN VIVO (realtime) ===== */}
      <AnimatePresence>
        {live && !open && (
          <motion.button
            key={live.id}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.37, 0.35, 0, 1] }}
            onClick={() => { markOneRead(live.id); closeLive() }}
            className="fixed top-4 left-1/2 z-[70] -translate-x-1/2 w-[calc(100vw-32px)] max-w-[380px] text-left bg-sb-surface-container/[0.96] backdrop-blur-2xl rounded-2xl border border-sb-outline-variant/20 shadow-2xl shadow-black/10 p-3.5 flex items-start gap-3"
          >
            <div className="h-9 w-9 rounded-xl bg-sb-primary/10 flex items-center justify-center shrink-0">
              <BellRing className="h-4 w-4 text-sb-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-sb-primary font-semibold uppercase tracking-wider">Nueva notificación</p>
              <p className="text-[13px] font-medium text-sb-on-surface mt-0.5 truncate">{live.title}</p>
              {live.message && <p className="text-[11px] text-sb-on-surface-variant mt-0.5 line-clamp-2">{live.message}</p>}
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-semibold shrink-0 mt-0.5">NUEVA</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ===== PANEL ===== */}
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.37, 0.35, 0, 1] }}
              className="fixed top-16 right-3 left-3 sm:left-auto sm:right-4 z-50 bg-sb-surface-container/95 backdrop-blur-3xl rounded-3xl border border-sb-outline-variant/20 shadow-2xl max-h-[75vh] overflow-hidden w-auto sm:w-[380px]"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-sb-outline-variant/10">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-sb-on-surface">Notificaciones</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-sb-primary text-sb-on-primary text-[9px] font-bold">{unreadCount}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead}
                      className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-medium text-sb-on-surface-variant hover:bg-sb-surface-container-highest/60 hover:text-sb-on-surface/80 transition-colors">
                      <CheckIcon className="h-3 w-3" />
                      Leer todo
                    </button>
                  )}
                  <button onClick={() => setOpen(false)}
                    className="flex items-center justify-center p-1.5 rounded-lg text-sb-on-surface-variant hover:bg-sb-surface-container-highest/50 transition-all">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-auto max-h-[60vh]">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="flex items-start gap-3 animate-pulse">
                        <div className="h-8 w-8 rounded-xl bg-sb-surface-container-highest shrink-0" />
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-3 w-3/4 rounded bg-sb-surface-container-highest" />
                          <div className="h-2.5 w-1/2 rounded bg-sb-surface-container-highest" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-14 flex flex-col items-center gap-3 text-center px-6">
                    <div className="h-12 w-12 rounded-2xl bg-sb-surface-container-highest flex items-center justify-center">
                      <Inbox className="h-6 w-6 text-sb-on-surface-variant/50" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-sb-on-surface/80">Sin notificaciones</p>
                      <p className="text-[11px] text-sb-on-surface-variant/60 mt-0.5">Los avisos de tu institución aparecerán aquí</p>
                    </div>
                  </div>
                ) : (
                  notifications.map(n => {
                    const meta = notifMeta(n.type)
                    const handleClick = () => {
                      markOneRead(n.id)
                      setOpen(false)
                      if (n.type === 'meeting') {
                        const path = window.location.pathname
                        if (path.startsWith('/docente')) router.push('/docente/reuniones')
                        else if (path.startsWith('/director')) router.push('/director/reuniones')
                        else if (path.startsWith('/padre')) router.push('/padre/comunicados')
                        else router.push('/docente/reuniones')
                      }
                    }
                    return (
                      <button
                        key={n.id}
                        onClick={handleClick}
                        className={cn(
                          "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-sb-surface-container-highest/50",
                          !n.read && "bg-sb-primary/5"
                        )}
                      >
                        <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5", !n.read ? meta.cls : "bg-sb-surface-container-highest text-sb-on-surface-variant/60")}>
                          <meta.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-[13px] truncate", !n.read ? "text-sb-on-surface font-medium" : "text-sb-on-surface/75")}>{n.title}</p>
                          {n.message && <p className="text-[11px] text-sb-on-surface-variant mt-0.5 line-clamp-2">{n.message}</p>}
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-sb-on-surface-variant/60" />
                            <span className="text-[10px] text-sb-on-surface-variant/60">{timeAgo(n.created_at)}</span>
                          </div>
                        </div>
                        {!n.read && <div className="h-2 w-2 rounded-full bg-sb-primary shrink-0 mt-2" />}
                      </button>
                    )
                  })
                )}
              </div>

              {/* ===== CONFIG: push + instalación ===== */}
              {(push.supported || push.canInstall || push.isIOS) && (
                <div className="border-t border-sb-outline-variant/10 px-4 py-3 space-y-2">
                  {push.supported && (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 rounded-lg bg-sb-primary/10 flex items-center justify-center shrink-0">
                          <BellRing className="h-3.5 w-3.5 text-sb-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-sb-on-surface">Notificaciones del dispositivo</p>
                          <p className="text-[10px] text-sb-on-surface-variant truncate">{pushStatus}</p>
                        </div>
                      </div>
                      <button
                        onClick={handlePushToggle}
                        disabled={pushDisabled || pushBusy}
                        className={cn(
                          "flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-medium shrink-0 transition-colors",
                          push.permission === "granted" && push.subscribed
                            ? "text-sb-on-surface-variant hover:bg-sb-surface-container-highest/60"
                            : "bg-sb-primary text-sb-on-primary hover:opacity-90",
                          pushDisabled && "opacity-50 cursor-not-allowed",
                          pushBusy && "opacity-60"
                        )}
                      >
                        {pushBusy
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : push.permission === "granted" && push.subscribed
                            ? <Power className="h-3 w-3" />
                            : <Zap className="h-3 w-3" />}
                        {pushLabel}
                      </button>
                    </div>
                  )}

                  {push.standalone ? (
                    <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle className="h-3.5 w-3.5" />
                      App instalada en este dispositivo
                    </div>
                  ) : push.canInstall ? (
                    <button
                      onClick={() => push.promptInstall()}
                      className="flex items-center justify-between gap-3 w-full text-left rounded-xl bg-sb-surface-container-highest/50 hover:bg-sb-surface-container-highest/80 border border-sb-outline-variant/10 px-3 py-2 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-6 w-6 rounded-lg bg-sb-primary/10 flex items-center justify-center shrink-0">
                          <Download className="h-3.5 w-3.5 text-sb-primary" />
                        </div>
                        <p className="text-[12px] font-medium text-sb-on-surface truncate">Instalar la app en el dispositivo</p>
                      </div>
                      <span className="text-[10px] font-semibold text-sb-primary shrink-0">Instalar</span>
                    </button>
                  ) : push.isIOS ? (
                    <div className="flex items-start gap-2.5 px-1">
                      <div className="h-6 w-6 rounded-lg bg-sb-surface-container-highest flex items-center justify-center shrink-0">
                        <Smartphone className="h-3.5 w-3.5 text-sb-on-surface-variant" />
                      </div>
                      <p className="text-[10.5px] leading-snug text-sb-on-surface-variant">
                        <span className="font-medium text-sb-on-surface">iPhone/iPad:</span> para recibir alertas en pantalla de bloqueo, agrega EduNexus a tu pantalla de inicio (Compartir
                        <Info className="inline h-3 w-3 mx-0.5 -mt-0.5" /> → Añadir a pantalla de inicio), luego abre la app desde ahí.
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}