"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Bell, BellRing, CheckIcon, Clock, Inbox, Megaphone, Handshake, Users,
  Loader2, Zap,
} from "@/components/ui/proicons"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/hooks/use-notifications"
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

export default function MobileNotificationBell() {
  const { notifications, loading, unread, markOneRead, markAllRead } = useNotifications()
  const push = usePushSettings()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [pushBusy, setPushBusy] = React.useState(false)
  const morphRef = React.useRef<HTMLDivElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [menuHeight, setMenuHeight] = React.useState<number>(48)
  const unreadCount = Math.min(unread, 99)

  React.useLayoutEffect(() => {
    if (menuOpen && menuRef.current) {
      setMenuHeight(Math.max(menuRef.current.scrollHeight, 48))
    }
  }, [menuOpen])

  React.useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => { if (morphRef.current && !morphRef.current.contains(e.target as Node)) setMenuOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false) }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey) }
  }, [menuOpen])

  let pushStatus = "Activar"
  let pushDisabled = false
  if (push.permission === "granted" && push.subscribed) {
    pushStatus = "Desactivar"
  } else if (push.permission === "denied") {
    pushStatus = "Bloqueada"
    pushDisabled = true
  }

  const handlePushToggle = async () => {
    setPushBusy(true)
    try { await push.toggle() } finally { setPushBusy(false) }
  }

  return (
    <div ref={morphRef} className="t-morph" data-open={menuOpen ? "true" : "false"} style={menuOpen ? { height: `${Math.min(menuHeight, 420)}px` } : undefined}>
      <div ref={menuRef} className="t-morph-menu overflow-y-auto max-h-[70vh]" role="menu">
        <div className="p-2">
          <div className="flex items-center justify-between px-3 py-1.5 mb-1">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-sb-on-surface">Notificaciones</p>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-sb-primary text-sb-on-primary text-[8px] font-bold">{unreadCount}</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="flex items-center gap-1 h-5 px-1.5 rounded-md text-[9px] font-medium text-sb-on-surface-variant hover:bg-sb-surface-container-high transition-colors">
                <CheckIcon className="h-2.5 w-2.5" />
                Leer todo
              </button>
            )}
          </div>

          <div className="max-h-[50vh] overflow-y-auto">
            {loading ? (
              <div className="p-2 space-y-2">
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex items-start gap-2 animate-pulse">
                    <div className="h-6 w-6 rounded-lg bg-sb-surface-container-highest shrink-0" />
                    <div className="flex-1 space-y-1 py-0.5">
                      <div className="h-2 w-3/4 rounded bg-sb-surface-container-highest" />
                      <div className="h-1.5 w-1/2 rounded bg-sb-surface-container-highest" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 flex flex-col items-center gap-2 text-center px-4">
                <div className="h-8 w-8 rounded-lg bg-sb-surface-container-highest flex items-center justify-center">
                  <Inbox className="h-4 w-4 text-sb-on-surface-variant/50" />
                </div>
                <p className="text-[11px] font-medium text-sb-on-surface/80">Sin notificaciones</p>
              </div>
            ) : (
              notifications.slice(0, 8).map(n => {
                const meta = notifMeta(n.type)
                const handleClick = () => {
                  markOneRead(n.id)
                  setMenuOpen(false)
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
                      "w-full flex items-start gap-2 px-2.5 py-1.5 text-left rounded-lg transition-colors hover:bg-sb-surface-container-high",
                      !n.read && "bg-sb-primary/5"
                    )}
                  >
                    <div className={cn("h-6 w-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5", !n.read ? meta.cls : "bg-sb-surface-container-highest text-sb-on-surface-variant/60")}>
                      <meta.icon className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-[10px] truncate", !n.read ? "text-sb-on-surface font-medium" : "text-sb-on-surface/75")}>{n.title}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="h-2 w-2 text-sb-on-surface-variant/60" />
                        <span className="text-[8px] text-sb-on-surface-variant/60">{timeAgo(n.created_at)}</span>
                      </div>
                    </div>
                    {!n.read && <div className="h-1.5 w-1.5 rounded-full bg-sb-primary shrink-0 mt-1" />}
                  </button>
                )
              })
            )}
          </div>

          {push.supported && (
            <div className="border-t border-sb-outline-variant/10 mt-1 pt-1 px-2.5 py-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <BellRing className="h-2.5 w-2.5 text-sb-primary shrink-0" />
                  <span className="text-[9px] text-sb-on-surface-variant truncate">Push: {pushStatus}</span>
                </div>
                <button
                  onClick={handlePushToggle}
                  disabled={pushDisabled || pushBusy}
                  className={cn(
                    "flex items-center gap-0.5 h-5 px-1.5 rounded-md text-[8px] font-medium shrink-0 transition-colors",
                    push.permission === "granted" && push.subscribed
                      ? "text-sb-on-surface-variant hover:bg-sb-surface-container-high"
                      : "bg-sb-primary text-sb-on-primary hover:opacity-90",
                    pushDisabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {pushBusy ? <Loader2 className="h-2 w-2 animate-spin" /> : <Zap className="h-2 w-2" />}
                  {push.permission === "granted" && push.subscribed ? "Off" : "On"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        className="t-morph-plus"
        aria-expanded={menuOpen ? "true" : "false"}
        aria-label="Notificaciones"
        onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
      >
        <div className="relative">
          <Bell className="h-5 w-5 text-sb-on-surface" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[12px] h-3 rounded-full bg-sb-primary text-sb-on-primary text-[7px] font-bold flex items-center justify-center px-0.5">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </button>
    </div>
  )
}
