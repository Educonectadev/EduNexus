"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { useSearchParams } from "next/navigation"
import { LogIn, LogOut, Check, UserCheck, UserX, Search, XCircle, Calendar, Users, Clock, ChevronDown, ChevronLeft, ChevronRight, Sun, Moon } from "@/components/ui/proicons"
import NotificationBell from "@/components/layout/notification-bell"
import { useAuthStore } from "@/stores/auth-store"
import { useTheme } from "next-themes"

const FONT = "var(--app-main-font, 'DM Sans'), sans-serif"

type Tab = "personal" | "alumnos"
type StudentStatus = "present" | "late" | "absent" | "justified" | null

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  present:    { label: "A tiempo",   dot: "var(--note-text)" },
  late:       { label: "Tardanza",   dot: "var(--note-muted)" },
  absent:     { label: "Ausente",    dot: "var(--note-muted)" },
  justified:  { label: "Justificado",dot: "var(--note-text)" },
  early_leave:{ label: "Salida anticipada", dot: "var(--note-muted)" },
}

function getLocalDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function safeFormatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  try {
    const d = new Date(dateStr.includes("T") ? dateStr : dateStr + "T12:00:00")
    if (isNaN(d.getTime())) return "—"
    return d.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "short" })
  } catch { return "—" }
}

function getWeekDays(history: any[]) {
  const map: Record<string, any> = {}
  for (const h of history) { if (h.date) map[h.date] = h }
  const days: { iso: string; label: string; day: number; status: string | null }[] = []
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const iso = getLocalDateStr(d)
    days.push({ iso, label: dayNames[d.getDay()], day: d.getDate(), status: map[iso]?.status || null })
  }
  return days
}

/* ═══ SHARED COMPONENTS ═══ */
function Card({ children, className = "", style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} style={{ borderRadius: "24px", background: "var(--note-surface)", border: "1px solid var(--note-hairline)", ...style }} {...props}>
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-[0.8px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{children}</p>
}

function StatusDot({ color }: { color: string }) {
  return <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: color }} />
}

/* ═══ MAIN PAGE ═══ */
export default function AsistenciaPage() {
  return (
    <React.Suspense fallback={null}><AsistenciaInner /></React.Suspense>
  )
}

function AsistenciaInner() {
  const searchParams = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const { theme, setTheme } = useTheme()
  const prefilterCourse = searchParams.get("curso") || ""
  const [tab, setTab] = React.useState<Tab>(prefilterCourse ? "alumnos" : "personal")
  const [prefillCourse, setPrefillCourse] = React.useState(prefilterCourse)
  const tabs: { key: Tab; label: string }[] = [
    { key: "personal", label: "Mi Asistencia" },
    { key: "alumnos", label: "Asistencia de Alumnos" },
  ]

  return (
    <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-white dark:bg-[#1a1a1c] sb-note">
      <div className="p-6 md:p-8 pb-24 md:pb-8">

        {/* ═══ HEADER ═══ */}
        <header className="flex items-start justify-between mb-6 gap-4">
          <div>
            <p className="text-[14px] font-medium mb-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Control</p>
            <h1 className="text-[36px] md:text-[48px] font-bold leading-tight" style={{ color: "var(--note-text)", fontFamily: FONT }}>Asistencia</h1>
            <p className="text-[13px] mt-2" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Control de tu marcación y la asistencia de tus alumnos</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5">
                <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ background: "var(--note-fill-strong)" }}>
                  <span className="text-[9px] font-semibold" style={{ color: "var(--note-text)" }}>{user.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "D"}</span>
                </div>
                <span className="text-sm md:text-base font-medium whitespace-nowrap" style={{ color: "var(--note-text)", fontFamily: FONT }}>{user.full_name}</span>
              </div>
            )}
            <NotificationBell />
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Cambiar tema" title="Cambiar tema" className="h-10 w-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity relative">
              <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" style={{ color: "var(--note-text)" }} />
              <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" style={{ color: "var(--note-text)" }} />
            </button>
          </div>
        </header>

        {/* ═══ TABS ═══ */}
        <div className="flex mb-6 p-1" style={{ borderRadius: "16px", background: "var(--note-fill)" }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 h-11 text-[13px] font-semibold flex items-center justify-center transition-all duration-200"
              style={{
                borderRadius: "12px",
                background: tab === t.key ? "var(--note-surface)" : "transparent",
                color: tab === t.key ? "var(--note-text)" : "var(--note-muted)",
                boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                fontFamily: FONT,
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "personal" ? <MiAsistencia /> : <AsistenciaAlumnos prefillCourse={prefillCourse} />}
      </div>
    </div>
  )
}

/* ═══ MI ASISTENCIA ═══ */
function MiAsistencia() {
  const [attendance, setAttendance] = React.useState<any>(null)
  const [schedule, setSchedule] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [history, setHistory] = React.useState<any[]>([])
  const [pendingCheckout, setPendingCheckout] = React.useState<any>(null)
  const [scheduleError, setScheduleError] = React.useState<string | null>(null)
  const today = getLocalDateStr()

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [attRes, histRes] = await Promise.all([
          fetch(`/api/docente/attendance?date=${today}`).then(r => r.json()),
          fetch(`/api/docente/attendance-history?limit=30`).then(r => r.json()).catch(() => ({ records: [] })),
        ])
        if (cancelled) return
        setAttendance(attRes.attendance); setSchedule(attRes.schedule)
        setPendingCheckout(attRes.pendingCheckout || null); setHistory(histRes.records || [])
      } catch {} finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  const handleCheck = async (action: "check-in" | "check-out", targetDate?: string) => {
    setActionLoading(true)
    try {
      const now = new Date()
      const localTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const res = await fetch("/api/docente/attendance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, date: targetDate || localDate, time: localTime }),
      })
      const data = await res.json()
      if (data.success) { setAttendance(data.attendance); if (data.schedule) setSchedule(data.schedule); setPendingCheckout(null) }
      else if (res.status === 409 && data.pendingCheckout) setPendingCheckout(data.pendingCheckout)
      else if (res.status === 400 && data.message) { setScheduleError(data.message); setTimeout(() => setScheduleError(null), 5000) }
    } catch {} finally { setActionLoading(false) }
  }

  if (loading) return (
    <div className="space-y-4">
      <div className="h-40 animate-pulse" style={{ borderRadius: "24px", background: "var(--note-fill)" }} />
      <div className="h-24 animate-pulse" style={{ borderRadius: "24px", background: "var(--note-fill)" }} />
    </div>
  )

  const checkedIn = attendance?.check_in, checkedOut = attendance?.check_out
  const s = attendance?.status ? STATUS_CONFIG[attendance.status] : null
  const weekDays = getWeekDays(history)
  const hasPending = !!pendingCheckout

  return (
    <div className="space-y-4">

      {/* Jornada de hoy */}
      <Card>
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
                {new Date().toLocaleDateString("es-PE", { weekday: "long" })}
              </p>
              <p className="text-lg font-bold mt-0.5 capitalize" style={{ color: "var(--note-text)", fontFamily: FONT }}>
                {new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long" })}
              </p>
            </div>
            {s && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium" style={{ borderRadius: "12px", background: "var(--note-fill-strong)", color: "var(--note-text)", fontFamily: FONT }}>
                <StatusDot color={s.dot} />{s.label}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            {[{ label: "Entrada", icon: LogIn, time: checkedIn?.slice(0, 5), sched: schedule?.start_time },
              { label: "Salida", icon: LogOut, time: checkedOut?.slice(0, 5), sched: schedule?.end_time }].map(item => (
              <div key={item.label} style={{ borderRadius: "16px", background: "var(--note-fill)", padding: "16px" }}>
                <div className="flex items-center gap-2 mb-3">
                  <item.icon className="h-3.5 w-3.5" style={{ color: item.time ? "var(--note-text)" : "var(--note-muted)", opacity: item.time ? 1 : 0.4 }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{item.label}</span>
                </div>
                <p className="text-3xl font-bold" style={{ color: item.time ? "var(--note-text)" : "var(--note-muted)", opacity: item.time ? 1 : 0.3, fontFamily: FONT }}>{item.time || "—:——"}</p>
                {item.sched && <p className="text-[10px] mt-2" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Programado {item.sched}</p>}
              </div>
            ))}
          </div>

          {hasPending && (
            <div className="space-y-2">
              <p className="text-[11px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Salida pendiente del {safeFormatDate(pendingCheckout.date)}</p>
              <button onClick={() => handleCheck("check-out", pendingCheckout.date)} disabled={actionLoading}
                className="w-full h-12 text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 hover:opacity-90 active:scale-[0.98]"
                style={{ borderRadius: "14px", background: "var(--note-solid-bg)", color: "var(--note-solid-fg)", fontFamily: FONT }}>
                {actionLoading ? <span className="animate-spin h-4 w-4 border-2 border-current/30 border-t-current rounded-full" /> : <LogOut className="h-4 w-4" />}
                Marcar Salida Pendiente
              </button>
            </div>
          )}
          {!hasPending && !checkedIn && (
            <button onClick={() => handleCheck("check-in")} disabled={actionLoading}
              className="w-full h-12 text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 hover:opacity-90 active:scale-[0.98]"
              style={{ borderRadius: "14px", background: "var(--note-solid-bg)", color: "var(--note-solid-fg)", fontFamily: FONT }}>
              {actionLoading ? <span className="animate-spin h-4 w-4 border-2 border-current/30 border-t-current rounded-full" /> : <LogIn className="h-4 w-4" />}
              Marcar Entrada
            </button>
          )}
          {!hasPending && checkedIn && !checkedOut && (
            <button onClick={() => handleCheck("check-out")} disabled={actionLoading}
              className="w-full h-12 text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 hover:opacity-90 active:scale-[0.98]"
              style={{ borderRadius: "14px", background: "var(--note-fill-strong)", color: "var(--note-text)", fontFamily: FONT }}>
              {actionLoading ? <span className="animate-spin h-4 w-4 border-2 border-current/30 border-t-current rounded-full" /> : <LogOut className="h-4 w-4" />}
              Marcar Salida
            </button>
          )}
          {!hasPending && checkedIn && checkedOut && (
            <div className="w-full h-12 text-sm font-bold flex items-center justify-center gap-2" style={{ borderRadius: "14px", background: "var(--note-fill)", color: "var(--note-muted)", fontFamily: FONT }}>
              <Check className="h-4 w-4" />Jornada completada
            </div>
          )}
        </div>
        {scheduleError && (
          <div className="mx-5 mb-4 p-3 flex items-center gap-3" style={{ borderRadius: "14px", background: "var(--note-fill)", border: "1px solid var(--note-hairline)" }}>
            <Clock className="h-4 w-4 shrink-0" style={{ color: "var(--note-muted)" }} />
            <p className="text-[13px] font-medium" style={{ color: "var(--note-text)", fontFamily: FONT }}>{scheduleError}</p>
          </div>
        )}
      </Card>

      {/* Semana */}
      <Card>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Semana</span>
            <span className="text-[10px] font-medium" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{history.length} registros</span>
          </div>
          <div className="flex items-end justify-between gap-2">
            {weekDays.map((d) => {
              const isToday = getLocalDateStr() === d.iso
              const hasData = !!d.status
              return (
                <div key={d.iso} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full aspect-square max-w-[40px] flex items-center justify-center"
                    style={{ borderRadius: "12px", background: hasData ? "var(--note-fill-strong)" : "var(--note-fill)", border: isToday ? "1.5px solid var(--note-text)" : "1px solid var(--note-hairline)" }}>
                    {hasData && <span className="text-[10px] font-bold" style={{ color: "var(--note-text)", fontFamily: FONT }}>{d.status === "present" ? "✓" : d.status === "late" ? "T" : d.status === "absent" ? "✗" : "J"}</span>}
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-semibold uppercase" style={{ color: isToday ? "var(--note-text)" : "var(--note-muted)", fontFamily: FONT }}>{d.label}</span>
                    <span className="text-[11px] font-bold" style={{ color: isToday ? "var(--note-text)" : "var(--note-muted)", fontFamily: FONT }}>{d.day}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Historial */}
      <Card>
        <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--note-hairline)" }}>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Historial reciente</span>
          <span className="text-[10px] font-medium" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{history.length} registros</span>
        </div>
        {history.length === 0 ? (
          <div className="py-16 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-3" style={{ color: "var(--note-muted)", opacity: 0.3 }} />
            <p className="text-[11px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Sin registros aún</p>
          </div>
        ) : (
          <div>
            {history.slice(0, 7).map((h: any, i: number) => {
              const isLast = i === Math.min(history.length, 7) - 1
              return (
                <div key={h.id || i} className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: isLast ? "none" : "1px solid var(--note-hairline)" }}>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 flex items-center justify-center shrink-0" style={{ borderRadius: "10px", background: "var(--note-fill)" }}>
                      <Calendar className="h-4 w-4" style={{ color: "var(--note-muted)" }} />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium capitalize" style={{ color: "var(--note-text)", fontFamily: FONT }}>{safeFormatDate(h.date)}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Ent: {h.check_in ? h.check_in.slice(0, 5) : '—:——'}</span>
                        <span className="text-[11px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Sal: {h.check_out ? h.check_out.slice(0, 5) : '—:——'}</span>
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1" style={{ borderRadius: "8px", background: "var(--note-fill-strong)", color: "var(--note-text)", fontFamily: FONT }}>
                    <StatusDot color={STATUS_CONFIG[h.status]?.dot || "var(--note-text)"} />{STATUS_CONFIG[h.status]?.label || "A tiempo"}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

/* ═══ PORTAL SELECT ═══ */
function PortalSelect({ value, onChange, options, placeholder, icon: Icon }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder: string; icon?: React.ElementType
}) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const [pos, setPos] = React.useState({ top: 0, left: 0, width: 0 })

  React.useEffect(() => { if (open && triggerRef.current) { const r = triggerRef.current.getBoundingClientRect(); setPos({ top: r.bottom + 4, left: r.left, width: r.width }) } }, [open])
  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { const t = e.target as Node; if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return; setOpen(false) }
    document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const selected = options.find(o => o.value === value)
  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(!open)}
        className="h-10 w-full flex items-center gap-2 px-3 text-[13px] font-medium transition-all cursor-pointer text-left"
        style={{ borderRadius: "14px", border: `1.5px solid ${value ? "var(--note-solid-bg)" : "var(--note-hairline)"}`, background: value ? "var(--note-fill)" : "transparent", color: value ? "var(--note-text)" : "var(--note-muted)", fontFamily: FONT }}>
        {Icon && <Icon className="h-4 w-4 shrink-0 opacity-50" />}
        <span className="flex-1 truncate">{selected?.label || placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 opacity-40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && createPortal(
        <div ref={panelRef} className="fixed z-[9999]" style={{ top: pos.top, left: pos.left, width: pos.width }}>
          <div className="max-h-[260px] overflow-y-auto py-1.5" style={{ background: "var(--note-surface)", borderRadius: "16px", border: "1px solid var(--note-hairline)", boxShadow: "0 12px 40px -8px rgba(0,0,0,0.18)" }}>
            {options.map(opt => {
              const isSelected = opt.value === value
              return (
                <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-left transition-colors"
                  style={{ background: isSelected ? "var(--note-fill)" : "transparent", color: isSelected ? "var(--note-text)" : "var(--note-text)", fontFamily: FONT }}>
                  <span className="flex-1">{opt.label}</span>
                  {isSelected && <Check className="h-4 w-4" style={{ color: "var(--note-text)" }} />}
                </button>
              )
            })}
          </div>
        </div>, document.body
      )}
    </>
  )
}

/* ═══ DATE PICKER ═══ */
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const MonthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

function DatePickerDropdown({ date, onSelect }: { date: string; onSelect: (d: string) => void }) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const [pos, setPos] = React.useState({ top: 0, left: 0, width: 0 })
  const current = new Date(date + "T12:00:00")
  const [viewDate, setViewDate] = React.useState(new Date(current.getFullYear(), current.getMonth(), 1))

  React.useEffect(() => { if (open && triggerRef.current) { const r = triggerRef.current.getBoundingClientRect(); setPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 300) }) } }, [open])
  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { const t = e.target as Node; if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return; setOpen(false) }
    document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const year = viewDate.getFullYear(), month = viewDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let startOffset = new Date(year, month, 1).getDay() - 1; if (startOffset < 0) startOffset = 6
  const today = getLocalDateStr()
  const days: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(!open)}
        className="h-10 w-full flex items-center gap-2 px-3 text-[13px] font-medium transition-all cursor-pointer text-left"
        style={{ borderRadius: "14px", border: `1.5px solid ${date ? "var(--note-solid-bg)" : "var(--note-hairline)"}`, background: date ? "var(--note-fill)" : "transparent", color: date ? "var(--note-text)" : "var(--note-muted)", fontFamily: FONT }}>
        <Calendar className="h-4 w-4 shrink-0 opacity-50" />
        <span className="flex-1 truncate capitalize">{date ? safeFormatDate(date) : "Seleccionar fecha"}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 opacity-40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && createPortal(
        <div ref={panelRef} className="fixed z-[9999]" style={{ top: pos.top, left: pos.left, width: pos.width }}>
          <div className="p-4" style={{ background: "var(--note-surface)", borderRadius: "16px", border: "1px solid var(--note-hairline)", boxShadow: "0 12px 40px -8px rgba(0,0,0,0.18)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold capitalize" style={{ color: "var(--note-text)", fontFamily: FONT }}>{MonthNames[month]} {year}</p>
              <div className="flex gap-1">
                {[new Date(year, month - 1, 1), new Date(year, month + 1, 1)].map((d, i) => (
                  <button key={i} onClick={() => setViewDate(d)} className="h-7 w-7 flex items-center justify-center transition-colors" style={{ borderRadius: "8px", color: "var(--note-muted)" }}>
                    {i === 0 ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map(d => <div key={d} className="text-center py-1"><span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--note-muted)", opacity: 0.4, fontFamily: FONT }}>{d}</span></div>)}
            </div>
            <div className="grid grid-cols-7 gap-px">
              {days.map((day, i) => {
                if (day === null) return <div key={`e-${i}`} />
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                const isToday = dateStr === today, isSelected = dateStr === date, isFuture = dateStr > today
                return (
                  <button key={day} onClick={() => !isFuture && onSelect(dateStr)} disabled={isFuture}
                    className="h-8 w-full flex items-center justify-center text-[12px] font-medium transition-colors"
                    style={{ borderRadius: "8px", background: isSelected ? "var(--note-solid-bg)" : isToday ? "var(--note-fill)" : "transparent", color: isSelected ? "var(--note-solid-fg)" : "var(--note-text)", opacity: isFuture ? 0.25 : 1, cursor: isFuture ? "not-allowed" : "pointer", fontFamily: FONT }}>
                    {day}
                  </button>
                )
              })}
            </div>
          </div>
        </div>, document.body
      )}
    </>
  )
}

/* ═══ ASISTENCIA ALUMNOS ═══ */
function AsistenciaAlumnos({ prefillCourse = "" }: { prefillCourse?: string }) {
  const [courses, setCourses] = React.useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = React.useState(prefillCourse)
  const [date, setDate] = React.useState(getLocalDateStr())
  const [students, setStudents] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [loaded, setLoaded] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [alumnoView, setAlumnoView] = React.useState<"registro" | "estadisticas">("registro")
  const [stats, setStats] = React.useState<any[]>([])
  const [statsLoading, setStatsLoading] = React.useState(false)
  const [statsLoaded, setStatsLoaded] = React.useState(false)

  React.useEffect(() => { fetch("/api/docente/cursos").then(r => r.json()).then(setCourses).catch(() => {}) }, [])

  const handleCargar = async () => {
    if (!selectedCourse) return
    setLoading(true); setLoaded(false)
    try { const res = await fetch(`/api/docente/student-attendance?course_id=${selectedCourse}&date=${date}`); const data = await res.json(); setStudents(data.students || []); setLoaded(true) } catch {} finally { setLoading(false) }
  }
  const handleStatusClick = (studentId: string, status: StudentStatus) => setStudents(prev => prev.map(s => s.id !== studentId ? s : { ...s, status: s.status === status ? null : status }))
  const handleMarkAllPresent = () => setStudents(prev => prev.map(s => s.status ? s : { ...s, status: "present" as const }))
  const handleClearAll = () => setStudents(prev => prev.map(s => ({ ...s, status: null })))

  const loadStats = async () => {
    if (!selectedCourse || statsLoaded) return
    setStatsLoading(true)
    try { const res = await fetch(`/api/docente/student-attendance?course_id=${selectedCourse}&mode=stats`); const data = await res.json(); setStats(data.students || []); setStatsLoaded(true) } catch {} finally { setStatsLoading(false) }
  }

  const handleGuardar = async () => {
    if (!selectedCourse || !date || students.length === 0) return
    setSaving(true)
    try {
      const records = students.filter(s => s.status !== null).map(s => ({ student_id: s.id, status: s.status, notes: s.notes || "" }))
      const res = await fetch("/api/docente/student-attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ course_id: selectedCourse, date, records }) })
      if (res.ok) { setLoaded(false); setStatsLoaded(false); setStats([]) }
    } catch {} finally { setSaving(false) }
  }

  const filtered = students.filter(s => { if (!searchTerm) return true; const q = searchTerm.toLowerCase(); return s.nombres?.toLowerCase().includes(q) || s.apellidos?.toLowerCase().includes(q) || s.dni?.includes(q) })
  const counts = { present: students.filter(s => s.status === 'present').length, late: students.filter(s => s.status === 'late').length, absent: students.filter(s => s.status === 'absent').length, justified: students.filter(s => s.status === 'justified').length }
  const marked = counts.present + counts.late + counts.absent + counts.justified
  const statusChips: { status: StudentStatus; label: string; title: string }[] = [{ status: "present", label: "P", title: "Presente" }, { status: "late", label: "T", title: "Tardanza" }, { status: "absent", label: "F", title: "Falta" }, { status: "justified", label: "J", title: "Justificado" }]
  const summary = [{ label: "Presentes", value: counts.present, icon: UserCheck }, { label: "Tardanzas", value: counts.late, icon: Clock }, { label: "Faltas", value: counts.absent, icon: XCircle }, { label: "Justificados", value: counts.justified, icon: Check }]

  return (
    <div className="space-y-3">
      {/* Selector */}
      <Card>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 flex items-center justify-center" style={{ background: "var(--note-fill)", borderRadius: "12px" }}>
              <Users className="h-5 w-5" style={{ color: "var(--note-muted)" }} />
            </div>
            <div>
              <SectionLabel>Seleccionar curso y fecha</SectionLabel>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--note-muted)", opacity: 0.6, fontFamily: FONT }}>Elige el curso y la fecha para registrar asistencia</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="space-y-1.5">
              <p className="text-xs font-medium" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Curso</p>
              <PortalSelect value={selectedCourse} onChange={v => { setSelectedCourse(v); setStatsLoaded(false); setStats([]) }} placeholder="Seleccionar curso" icon={Users}
                options={courses.map(c => ({ value: c.id, label: `${c.name} - ${c.grade} ${c.section}` }))} />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Fecha</p>
              <DatePickerDropdown date={date} onSelect={setDate} />
            </div>
            <button onClick={handleCargar} disabled={loading || !selectedCourse}
              className="h-10 px-5 text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-30"
              style={{ borderRadius: "12px", background: "var(--note-solid-bg)", color: "var(--note-solid-fg)", fontFamily: FONT }}>
              {loading ? <span className="animate-spin h-4 w-4 border-2 border-current/30 border-t-current rounded-full" /> : <Search className="h-4 w-4" />}
              Cargar
            </button>
          </div>
        </div>
      </Card>

      {/* View toggle */}
      {selectedCourse && (
        <div className="flex p-1" style={{ borderRadius: "12px", background: "var(--note-fill)" }}>
          {([["registro", "Registrar asistencia"], ["estadisticas", "Estadísticas 30 días"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => { setAlumnoView(key); if (key === "estadisticas") loadStats() }}
              className="flex-1 py-2 text-[12px] font-semibold text-center transition-all"
              style={{ borderRadius: "10px", background: alumnoView === key ? "var(--note-surface)" : "transparent", color: alumnoView === key ? "var(--note-text)" : "var(--note-muted)", fontFamily: FONT }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Stats Table */}
      {alumnoView === "estadisticas" && selectedCourse && (
        <Card>
          <div className="px-5 pt-5 pb-3" style={{ borderBottom: "1px solid var(--note-hairline)" }}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center" style={{ background: "var(--note-fill)", borderRadius: "12px" }}>
                <Users className="h-5 w-5" style={{ color: "var(--note-muted)" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--note-text)", fontFamily: FONT }}>Asistencia últimos 30 días</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Resumen por alumno</p>
              </div>
            </div>
          </div>
          {statsLoading ? (
            <div className="py-10 text-center"><div className="h-5 w-5 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: "var(--note-fill)", borderTopColor: "var(--note-text)" }} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr style={{ background: "var(--note-fill)" }}>
                    {["Alumno", "A tiempo", "Tardanzas", "Faltas", "Justific.", "Registros", "% Asistencia"].map(h => (
                      <th key={h} className={`px-5 py-3 text-[10px] font-semibold uppercase tracking-wider ${h === "Alumno" || h === "% Asistencia" ? "text-left" : "text-center"}`}
                        style={{ color: "var(--note-muted)", opacity: 0.6, fontFamily: FONT }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.length === 0 ? (
                    <tr><td colSpan={7} className="py-16 text-center">
                      <Users className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--note-muted)", opacity: 0.3 }} />
                      <p className="text-xs" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Sin registros</p>
                    </td></tr>
                  ) : stats.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: i < stats.length - 1 ? "1px solid var(--note-hairline)" : "none" }}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--note-fill-strong)" }}>
                            <span className="text-[9px] font-bold" style={{ color: "var(--note-text)" }}>{(s.nombres?.[0] || '') + (s.apellidos?.[0] || '')}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: "var(--note-text)", fontFamily: FONT }}>{s.apellidos}, {s.nombres}</p>
                            <p className="text-[9px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>DNI: {s.dni}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center text-sm font-semibold" style={{ color: "var(--note-text)", fontFamily: FONT }}>{s.present}</td>
                      <td className="px-3 py-3 text-center text-sm font-semibold" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{s.late}</td>
                      <td className="px-3 py-3 text-center text-sm font-semibold" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{s.absent}</td>
                      <td className="px-3 py-3 text-center text-sm font-semibold" style={{ color: "var(--note-text)", fontFamily: FONT }}>{s.justified}</td>
                      <td className="px-3 py-3 text-center text-xs" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{s.total}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--note-fill)" }}>
                            <div className="h-full rounded-full" style={{ width: `${s.rate}%`, background: "var(--note-text)", opacity: s.rate >= 80 ? 0.9 : 0.5 }} />
                          </div>
                          <span className="text-xs font-bold w-9 text-right" style={{ color: "var(--note-text)", opacity: s.rate >= 80 ? 1 : 0.6, fontFamily: FONT }}>{s.rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Registro */}
      {loaded && students.length > 0 && alumnoView === "registro" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {summary.map(item => {
              const Icon = item.icon
              return (
                <div key={item.label} className="p-4" style={{ background: "var(--note-surface)", borderRadius: "16px", border: "1px solid var(--note-hairline)" }}>
                  <div className="h-8 w-8 flex items-center justify-center mb-2" style={{ background: "var(--note-fill)", borderRadius: "10px" }}>
                    <Icon className="h-4 w-4" style={{ color: "var(--note-muted)" }} />
                  </div>
                  <SectionLabel>{item.label}</SectionLabel>
                  <p className="mt-1.5 text-lg font-bold leading-none" style={{ color: "var(--note-text)", fontFamily: FONT }}>{item.value}</p>
                </div>
              )
            })}
          </div>

          <Card>
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <div>
                  <SectionLabel>Lista de alumnos</SectionLabel>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{filtered.length} de {students.length} alumnos</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={handleMarkAllPresent} className="h-9 px-4 text-xs font-bold flex items-center gap-1.5 transition-all hover:opacity-90 active:scale-[0.97]"
                    style={{ borderRadius: "10px", background: "var(--note-fill-strong)", color: "var(--note-text)", fontFamily: FONT }}>
                    <UserCheck className="h-3.5 w-3.5" /> Marcar todos
                  </button>
                  <button onClick={handleClearAll} disabled={students.every(s => s.status === null)}
                    className="h-9 px-4 text-xs font-semibold transition-all disabled:opacity-40 hover:opacity-80"
                    style={{ borderRadius: "10px", background: "var(--note-fill)", color: "var(--note-muted)", fontFamily: FONT }}>Limpiar</button>
                  <div className="relative w-44">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "var(--note-muted)", opacity: 0.5 }} />
                    <input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                      className="w-full h-9 pl-9 pr-3 text-[13px] focus:outline-none"
                      style={{ borderRadius: "10px", background: "var(--note-fill)", color: "var(--note-text)", border: "1px solid var(--note-hairline)", fontFamily: FONT }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-3" style={{ borderTop: "1px solid var(--note-hairline)" }}>
                {statusChips.map(chip => (
                  <div key={chip.status} className="flex items-center gap-1.5">
                    <span className="h-4 w-4 rounded-lg flex items-center justify-center text-[9px] font-bold" style={{ background: "var(--note-fill-strong)", color: "var(--note-text)" }}>{chip.label}</span>
                    <span className="text-[10px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{chip.title}</span>
                    <span className="text-[10px] font-semibold ml-0.5" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{students.filter(s => s.status === chip.status).length}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--note-hairline)" }}>
              {filtered.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-3 transition-colors"
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--note-hairline)" : "none", background: s.status ? "var(--note-fill)" : "transparent" }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--note-fill-strong)" }}>
                      <span className="text-[10px] font-bold" style={{ color: "var(--note-text)" }}>{(s.nombres?.[0] || '') + (s.apellidos?.[0] || '')}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--note-text)", fontFamily: FONT }}>{s.apellidos}, {s.nombres}</p>
                      <p className="text-[10px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>DNI: {s.dni}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {statusChips.map(chip => (
                      <button key={chip.status} onClick={() => handleStatusClick(s.id, chip.status)} title={chip.title}
                        className="h-8 px-3 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1"
                        style={{ borderRadius: "10px", background: s.status === chip.status ? "var(--note-fill-strong)" : "var(--note-fill)", color: s.status === chip.status ? "var(--note-text)" : "var(--note-muted)", fontFamily: FONT }}>
                        {chip.label}{s.status === chip.status && <Check className="h-3 w-3" />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex items-center gap-4 sticky bottom-4 backdrop-blur-xl p-4" style={{ borderRadius: "20px", border: "1px solid var(--note-hairline)", background: "var(--note-surface)" }}>
            <div className="flex-1 space-y-1.5">
              <p className="text-sm font-bold" style={{ color: "var(--note-text)", fontFamily: FONT }}>{marked} de {students.length} marcados</p>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--note-fill)" }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${students.length ? (marked / students.length) * 100 : 0}%`, background: "var(--note-text)" }} />
              </div>
            </div>
            <button onClick={handleGuardar} disabled={saving || students.every(s => s.status === null)}
              className="h-12 px-8 text-sm font-bold flex items-center justify-center gap-2.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 hover:opacity-90 active:scale-[0.98]"
              style={{ borderRadius: "14px", background: "var(--note-solid-bg)", color: "var(--note-solid-fg)", fontFamily: FONT }}>
              {saving ? <span className="animate-spin h-4 w-4 border-2 border-current/30 border-t-current rounded-full" /> : null}Guardar
            </button>
          </div>
        </>
      )}

      {loaded && students.length === 0 && (
        <Card className="py-16 text-center">
          <UserX className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--note-muted)", opacity: 0.3 }} />
          <p className="text-xs" style={{ color: "var(--note-muted)", fontFamily: FONT }}>No hay alumnos en este curso</p>
        </Card>
      )}

      {!loaded && courses.length === 0 && (
        <Card className="py-16 text-center">
          <Users className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--note-muted)", opacity: 0.3 }} />
          <p className="text-xs" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Sin cursos asignados</p>
        </Card>
      )}
    </div>
  )
}
