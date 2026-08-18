"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { useSearchParams } from "next/navigation"
import { LogIn, LogOut, Check, UserCheck, UserX, Search, XCircle, Calendar, Users, Flame, Clock, ChevronDown, ChevronLeft, ChevronRight, Bell, Sun, Moon } from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import { useTheme } from "next-themes"

type Tab = "personal" | "alumnos"
type StudentStatus = "present" | "late" | "absent" | "justified" | null

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  present:    { label: "A tiempo",   color: "bg-[var(--note-fill-strong)] text-[var(--note-text)]",   dot: "bg-[var(--note-text)]" },
  late:       { label: "Tardanza",   color: "bg-[var(--note-fill)] text-[var(--note-muted)]",       dot: "bg-[var(--note-muted)]" },
  absent:     { label: "Ausente",    color: "bg-[var(--note-fill-strong)] text-[var(--note-muted)]",           dot: "bg-[var(--note-muted)]" },
  justified:  { label: "Justificado",color: "bg-[var(--note-fill)] text-[var(--note-text)]",         dot: "bg-[var(--note-text)]" },
  early_leave:{ label: "Salida anticipada", color: "bg-[var(--note-fill)] text-[var(--note-muted)]", dot: "bg-[var(--note-muted)]" },
}

function getAvatarColor(_name: string) {
  return "bg-[var(--note-fill-strong)]"
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
  } catch {
    return "—"
  }
}

function getWeekDays(history: any[]) {
  const map: Record<string, any> = {}
  for (const h of history) { if (h.date) map[h.date] = h }
  const days: { iso: string; label: string; day: number; status: string | null }[] = []
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const iso = getLocalDateStr(d)
    days.push({ iso, label: dayNames[d.getDay()], day: d.getDate(), status: map[iso]?.status || null })
  }
  return days
}

function getBarColor(status: string | null) {
  if (status === "present") return "var(--sb-on-surface)"
  if (status === "late") return "var(--sb-on-surface-variant)"
  if (status === "absent") return "var(--sb-on-surface-variant)"
  if (status === "justified") return "var(--sb-on-surface)"
  if (status === "early_leave") return "var(--sb-on-surface-variant)"
  return "var(--sb-outline-variant)"
}

function getBarOpacity(status: string | null) {
  if (status === "present") return 0.9
  if (status === "late") return 0.6
  if (status === "absent") return 0.35
  if (status === "justified") return 0.5
  if (status === "early_leave") return 0.6
  return 0.15
}

const FONT = "var(--app-main-font, 'DM Sans'), sans-serif"

function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("overflow-hidden", className)}
      style={{
        background: "var(--sb-surface-container)",
        borderRadius: "16px",
        border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)",
      }}
      {...props}
    >
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-bold uppercase tracking-[0.8px]"
      style={{ color: "var(--sb-on-surface-variant)", opacity: 0.45, fontFamily: FONT }}
    >
      {children}
    </p>
  )
}

function StatusBadge({ label, dot }: { label: string; dot: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium"
      style={{ borderRadius: "8px", background: "var(--sb-surface-container-high)", color: "var(--sb-on-surface)", fontFamily: FONT }}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}

export default function AsistenciaPage() {
  return (
    <React.Suspense fallback={null}>
      <AsistenciaInner />
    </React.Suspense>
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
    <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-[#BABABA] dark:bg-[#1a1a1c] sb-note">
      <div className="p-6 md:p-8 pb-24 md:pb-8">
      <header className="flex items-start justify-between mb-5 gap-4">
        <div>
          <p className="text-[14px] font-medium mb-1 text-[#666] dark:text-[#a1a1aa]">Panel Docente</p>
          <h1 className="text-[36px] md:text-[48px] font-bold leading-tight text-[#000] dark:text-[#f4f4f5]">
            Asistencia
          </h1>
          <p className="text-[13px] mt-2 text-[#666] dark:text-[#a1a1aa]">
            Control de tu marcación y la asistencia de tus alumnos
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-[#27272a]">
              <div className="h-6 w-6 rounded-full bg-[#F5F5F5] dark:bg-[#3f3f46] flex items-center justify-center">
                <span className="text-[9px] font-semibold text-[#000] dark:text-[#f4f4f5]">
                  {user.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "D"}
                </span>
              </div>
              <span className="text-[11px] text-[#666] dark:text-[#a1a1aa] truncate max-w-[160px]">
                {user.full_name}
              </span>
            </div>
          )}
          <button aria-label="Notificaciones" className="h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-[#27272a] hover:opacity-80 transition-opacity">
            <Bell className="h-[18px] w-[18px] text-[#000] dark:text-[#f4f4f5]" />
          </button>
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Cambiar tema" title="Cambiar tema" className="h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-[#27272a] hover:opacity-80 transition-opacity relative">
            <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-[#000] dark:text-[#f4f4f5]" />
            <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-[#000] dark:text-[#f4f4f5]" />
          </button>
        </div>
      </header>

      <div className="nb-rail mb-5">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("nb-chip", tab === t.key && "active")}>
            <Check className="nb-chip-check" />
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "personal" ? <MiAsistencia key="personal" /> : <AsistenciaAlumnos key="alumnos" prefillCourse={prefillCourse} />}
      </AnimatePresence>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   MI ASISTENCIA
   ═══════════════════════════════════════════════════════ */
function MiAsistencia() {
  const [attendance, setAttendance] = React.useState<any>(null)
  const [schedule, setSchedule] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [history, setHistory] = React.useState<any[]>([])
  const [pendingCheckout, setPendingCheckout] = React.useState<any>(null)
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
        setAttendance(attRes.attendance)
        setSchedule(attRes.schedule)
        setPendingCheckout(attRes.pendingCheckout || null)
        setHistory(histRes.records || [])
      } catch {} finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  const handleCheck = async (action: "check-in" | "check-out", targetDate?: string) => {
    setActionLoading(true)
    try {
      const res = await fetch("/api/docente/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...(targetDate ? { date: targetDate } : {}) }),
      })
      const data = await res.json()
      if (data.success) {
        setAttendance(data.attendance)
        if (data.schedule) setSchedule(data.schedule)
        setPendingCheckout(null)
      } else if (res.status === 409 && data.pendingCheckout) {
        setPendingCheckout(data.pendingCheckout)
      }
    } catch {} finally { setActionLoading(false) }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 animate-pulse" style={{ borderRadius: "16px", background: "var(--sb-surface-container)" }} />
          ))}
        </div>
        <div className="h-28 animate-pulse" style={{ borderRadius: "16px", background: "var(--sb-surface-container)" }} />
      </div>
    )
  }

  const checkedIn = attendance?.check_in
  const checkedOut = attendance?.check_out
  const s = attendance?.status ? STATUS_CONFIG[attendance.status] : null
  const weekDays = getWeekDays(history)
  const hasPending = !!pendingCheckout

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">

      {/* ═══ Jornada + Status ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Jornada card */}
        <Card className="sm:col-span-2">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 flex items-center justify-center"
                  style={{ background: "var(--sb-surface-container-high)", borderRadius: "12px" }}
                >
                  <Clock className="h-5 w-5" style={{ color: "var(--sb-on-surface-variant)" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold capitalize" style={{ color: "var(--sb-on-surface)", fontFamily: FONT }}>
                    {new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>
                    {!checkedIn
                      ? schedule
                        ? `Horario: ${schedule.start_time} — ${schedule.end_time}`
                        : "Sin clases programadas"
                      : checkedOut
                        ? `Completada · ${checkedIn.slice(0, 5)} — ${checkedOut.slice(0, 5)}`
                        : `Entrada ${checkedIn.slice(0, 5)} · salida ${schedule?.end_time || "—"}`
                    }
                  </p>
                </div>
              </div>
              {s && <StatusBadge label={s.label} dot={s.dot} />}
            </div>

            {/* Entrada / Salida */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className="p-3"
                style={{ background: "var(--sb-surface-container-high)", borderRadius: "12px" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <LogIn className="h-3.5 w-3.5" style={{ color: checkedIn ? "var(--sb-on-surface)" : "var(--sb-on-surface-variant)", opacity: checkedIn ? 1 : 0.3 }} />
                  <SectionLabel>Entrada</SectionLabel>
                </div>
                <p className="text-2xl font-bold" style={{ color: checkedIn ? "var(--sb-on-surface)" : "var(--sb-on-surface-variant)", opacity: checkedIn ? 1 : 0.3, fontFamily: FONT }}>
                  {checkedIn?.slice(0, 5) || "—:——"}
                </p>
                {schedule && (
                  <p className="text-[10px] mt-1" style={{ color: "var(--sb-on-surface-variant)", opacity: 0.6, fontFamily: FONT }}>
                    Prog. {schedule.start_time}
                  </p>
                )}
              </div>
              <div
                className="p-3"
                style={{ background: "var(--sb-surface-container-high)", borderRadius: "12px" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <LogOut className="h-3.5 w-3.5" style={{ color: checkedOut ? "var(--sb-on-surface)" : "var(--sb-on-surface-variant)", opacity: checkedOut ? 1 : 0.3 }} />
                  <SectionLabel>Salida</SectionLabel>
                </div>
                <p className="text-2xl font-bold" style={{ color: checkedOut ? "var(--sb-on-surface)" : "var(--sb-on-surface-variant)", opacity: checkedOut ? 1 : 0.3, fontFamily: FONT }}>
                  {checkedOut?.slice(0, 5) || "—:——"}
                </p>
                {schedule && (
                  <p className="text-[10px] mt-1" style={{ color: "var(--sb-on-surface-variant)", opacity: 0.6, fontFamily: FONT }}>
                    Prog. {schedule.end_time}
                  </p>
                )}
              </div>
            </div>

            {/* Action */}
            <div className="mt-4">
              {hasPending && (
                <div className="space-y-2">
                  <p className="text-xs" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>
                    Salida pendiente del {safeFormatDate(pendingCheckout.date)}
                  </p>
                  <button
                    onClick={() => handleCheck("check-out", pendingCheckout.date)}
                    disabled={actionLoading}
                    className="w-full h-11 text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    style={{ borderRadius: "12px", background: "var(--sb-on-surface)", color: "var(--sb-surface)", fontFamily: FONT }}
                  >
                    {actionLoading ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <LogOut className="h-4 w-4" />}
                    Marcar Salida Pendiente
                  </button>
                </div>
              )}
              {!hasPending && !checkedIn && (
                <button
                  onClick={() => handleCheck("check-in")}
                  disabled={actionLoading}
                  className="w-full h-11 text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  style={{ borderRadius: "12px", background: "var(--sb-on-surface)", color: "var(--sb-surface)", fontFamily: FONT }}
                >
                  {actionLoading ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <LogIn className="h-4 w-4" />}
                  Marcar Entrada
                </button>
              )}
              {!hasPending && checkedIn && !checkedOut && (
                <button
                  onClick={() => handleCheck("check-out")}
                  disabled={actionLoading}
                  className="w-full h-11 text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  style={{ borderRadius: "12px", background: "var(--sb-on-surface)", color: "var(--sb-surface)", fontFamily: FONT }}
                >
                  {actionLoading ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <LogOut className="h-4 w-4" />}
                  Marcar Salida
                </button>
              )}
              {!hasPending && checkedIn && checkedOut && (
                <div
                  className="w-full h-11 text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ borderRadius: "12px", background: "var(--sb-surface-container-high)", color: "var(--sb-on-surface-variant)", fontFamily: FONT }}
                >
                  <Check className="h-4 w-4" />
                  Jornada completada
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Weekly mini chart */}
        <Card>
          <div className="p-5 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="h-10 w-10 flex items-center justify-center"
                style={{ background: "var(--sb-surface-container-high)", borderRadius: "12px" }}
              >
                <Flame className="h-5 w-5" style={{ color: "var(--sb-on-surface-variant)" }} />
              </div>
              <div>
                <SectionLabel>Semana</SectionLabel>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--sb-on-surface-variant)", opacity: 0.6, fontFamily: FONT }}>
                  {history.length} registros
                </p>
              </div>
            </div>
            <div className="flex-1 flex items-end justify-between gap-1.5">
              {weekDays.map((d) => {
                const isToday = getLocalDateStr() === d.iso
                const hasData = !!d.status
                return (
                  <div key={d.iso} className="flex-1 flex flex-col items-center gap-1.5">
                    <div
                      className="w-full aspect-square max-w-[36px] flex items-center justify-center transition-all"
                      style={{
                        borderRadius: "10px",
                        background: hasData ? getBarColor(d.status) : "var(--sb-surface-container-high)",
                        opacity: hasData ? getBarOpacity(d.status) : 0.3,
                      }}
                    >
                      {hasData && (
                        <span className="text-[9px] font-bold" style={{ color: "var(--sb-surface)", fontFamily: FONT }}>
                          {d.status === "present" ? "✓" : d.status === "late" ? "T" : d.status === "absent" ? "✗" : "J"}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      <span
                        className="text-[8px] font-semibold uppercase"
                        style={{ color: isToday ? "var(--sb-on-surface)" : "var(--sb-on-surface-variant)", opacity: isToday ? 1 : 0.4, fontFamily: FONT }}
                      >
                        {d.label}
                      </span>
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: isToday ? "var(--sb-on-surface)" : "var(--sb-on-surface-variant)", fontFamily: FONT }}
                      >
                        {d.day}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* ═══ Historial ═══ */}
      <Card>
        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <SectionLabel>Historial reciente</SectionLabel>
          <span
            className="text-[10px] font-medium px-2 py-1"
            style={{ borderRadius: "8px", background: "var(--sb-surface-container-high)", color: "var(--sb-on-surface-variant)", fontFamily: FONT }}
          >
            {history.length} registros
          </span>
        </div>
        {history.length === 0 ? (
          <div className="py-16 text-center">
            <Calendar className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--sb-on-surface-variant)", opacity: 0.3 }} />
            <p className="text-xs" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>
              Aún no tienes registros de asistencia
            </p>
          </div>
        ) : (
          <div>
            {history.slice(0, 10).map((h: any, i: number) => {
              const sc = STATUS_CONFIG[h.status] || STATUS_CONFIG.present
              const isLast = i === Math.min(history.length, 10) - 1
              return (
                <div
                  key={h.id || i}
                  className="flex items-center justify-between px-5 py-3.5 transition-colors"
                  style={{ borderBottom: isLast ? "none" : "1px solid color-mix(in srgb, var(--sb-outline-variant) 20%, transparent)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sb-surface-container-high)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 flex items-center justify-center shrink-0"
                      style={{ background: "var(--sb-surface-container-high)", borderRadius: "10px" }}
                    >
                      <Calendar className="h-4 w-4" style={{ color: "var(--sb-on-surface-variant)" }} />
                    </div>
                    <div>
                      <p className="text-sm capitalize" style={{ color: "var(--sb-on-surface)", fontFamily: FONT }}>
                        {safeFormatDate(h.date)}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px]" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>
                          Ent: {h.check_in ? h.check_in.slice(0, 5) : '—'}
                        </span>
                        <span className="text-[11px]" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>
                          Sal: {h.check_out ? h.check_out.slice(0, 5) : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-lg ${sc.color}`}>
                    <span className={`h-1 w-1 rounded-full ${sc.dot}`} />
                    {sc.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   DATE PICKER
   ═══════════════════════════════════════════════════════ */
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const MonthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

/* ─── Portal Select (curso dropdown) ─── */
function PortalSelect({ value, onChange, options, placeholder, icon: Icon }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
  icon?: React.ElementType
}) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const [pos, setPos] = React.useState({ top: 0, left: 0, width: 0 })

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left, width: r.width })
    }
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (triggerRef.current?.contains(t)) return
      if (panelRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const selected = options.find(o => o.value === value)

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(!open)}
        className="h-10 w-full flex items-center gap-2 px-3 text-[13px] font-medium transition-all cursor-pointer text-left"
        style={{
          borderRadius: "14px",
          border: `1.5px solid ${value ? "var(--sb-primary)" : "var(--sb-outline-variant)"}`,
          background: value ? "color-mix(in srgb, var(--sb-primary) 8%, transparent)" : "transparent",
          color: value ? "var(--sb-on-surface)" : "var(--sb-on-surface-variant)",
          fontFamily: FONT,
        }}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0 opacity-50" />}
        <span className="flex-1 truncate">{selected?.label || placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 opacity-40 transition-transform", open && "rotate-180")} />
      </button>

      {open && createPortal(
        <motion.div
          ref={panelRef}
          className="fixed z-[9999]"
          style={{ top: pos.top, left: pos.left, width: pos.width }}
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.15, ease: [0.37, 0.35, 0, 1] }}
        >
          <div className="max-h-[260px] overflow-y-auto py-1.5"
            style={{
              background: "var(--sb-surface)",
              borderRadius: "16px",
              border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)",
              boxShadow: "0 12px 40px -8px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04)",
            }}
          >
            {options.map(opt => {
              const isSelected = opt.value === value
              return (
                <button key={opt.value} type="button"
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-left transition-colors"
                  style={{
                    background: isSelected ? "color-mix(in srgb, var(--sb-primary) 10%, transparent)" : "transparent",
                    color: isSelected ? "var(--sb-primary)" : "var(--sb-on-surface)",
                    fontFamily: FONT,
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--sb-surface-container-high)" }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent" }}
                >
                  <span className="flex-1">{opt.label}</span>
                  {isSelected && <Check className="h-4 w-4" style={{ color: "var(--sb-primary)" }} />}
                </button>
              )
            })}
          </div>
        </motion.div>,
        document.body
      )}
    </>
  )
}

/* ─── Portal Date Picker ─── */
function DatePickerDropdown({ date, onSelect }: { date: string; onSelect: (d: string) => void }) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const [pos, setPos] = React.useState({ top: 0, left: 0, width: 0 })
  const current = new Date(date + "T12:00:00")
  const [viewDate, setViewDate] = React.useState(new Date(current.getFullYear(), current.getMonth(), 1))

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 300) })
    }
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (triggerRef.current?.contains(t)) return
      if (panelRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let startOffset = new Date(year, month, 1).getDay() - 1
  if (startOffset < 0) startOffset = 6
  const today = getLocalDateStr()

  const days: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  const selectDate = (day: number) => {
    const d = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    onSelect(d)
    setOpen(false)
  }

  const display = date ? safeFormatDate(date) : ""

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(!open)}
        className="h-10 w-full flex items-center gap-2 px-3 text-[13px] font-medium transition-all cursor-pointer text-left"
        style={{
          borderRadius: "14px",
          border: `1.5px solid ${date ? "var(--sb-primary)" : "var(--sb-outline-variant)"}`,
          background: date ? "color-mix(in srgb, var(--sb-primary) 8%, transparent)" : "transparent",
          color: date ? "var(--sb-on-surface)" : "var(--sb-on-surface-variant)",
          fontFamily: FONT,
        }}
      >
        <Calendar className="h-4 w-4 shrink-0 opacity-50" />
        <span className="flex-1 truncate capitalize">{date ? display : "Seleccionar fecha"}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 opacity-40 transition-transform", open && "rotate-180")} />
      </button>

      {open && createPortal(
        <motion.div
          ref={panelRef}
          className="fixed z-[9999]"
          style={{ top: pos.top, left: pos.left, width: pos.width }}
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.15, ease: [0.37, 0.35, 0, 1] }}
        >
            <div className="p-4"
              style={{
                background: "var(--sb-surface)",
                borderRadius: "16px",
                border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)",
                boxShadow: "0 12px 40px -8px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold capitalize" style={{ color: "var(--sb-on-surface)", fontFamily: FONT }}>
                  {MonthNames[month]} {year}
                </p>
                <div className="flex gap-1">
                  <button onClick={() => setViewDate(new Date(year, month - 1, 1))}
                    className="h-7 w-7 flex items-center justify-center transition-colors"
                    style={{ borderRadius: "8px", color: "var(--sb-on-surface-variant)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sb-surface-container-high)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setViewDate(new Date(year, month + 1, 1))}
                    className="h-7 w-7 flex items-center justify-center transition-colors"
                    style={{ borderRadius: "8px", color: "var(--sb-on-surface-variant)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sb-surface-container-high)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map(d => (
                  <div key={d} className="text-center py-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--sb-on-surface-variant)", opacity: 0.4, fontFamily: FONT }}>{d}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-px">
                {days.map((day, i) => {
                  if (day === null) return <div key={`e-${i}`} />
                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                  const isToday = dateStr === today
                  const isSelected = dateStr === date
                  const isFuture = dateStr > today
                  return (
                    <button key={day} onClick={() => !isFuture && selectDate(day)} disabled={isFuture}
                      className="h-8 w-full flex items-center justify-center text-[12px] font-medium transition-colors"
                      style={{
                        borderRadius: "8px",
                        background: isSelected ? "var(--sb-on-surface)" : isToday ? "var(--sb-surface-container-high)" : "transparent",
                        color: isSelected ? "var(--sb-surface)" : isToday ? "var(--sb-on-surface)" : "var(--sb-on-surface)",
                        opacity: isFuture ? 0.25 : 1,
                        cursor: isFuture ? "not-allowed" : "pointer",
                        fontFamily: FONT,
                      }}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>,
        document.body
      )}
    </>
  )
}

/* ═══════════════════════════════════════════════════════
   ASISTENCIA ALUMNOS
   ═══════════════════════════════════════════════════════ */
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

  React.useEffect(() => {
    fetch("/api/docente/cursos").then(r => r.json()).then(setCourses).catch(() => {})
  }, [])

  const handleCargar = async () => {
    if (!selectedCourse) return
    setLoading(true); setLoaded(false)
    try {
      const res = await fetch(`/api/docente/student-attendance?course_id=${selectedCourse}&date=${date}`)
      const data = await res.json()
      setStudents(data.students || [])
      setLoaded(true)
    } catch {} finally { setLoading(false) }
  }

  const handleStatusClick = (studentId: string, status: StudentStatus) => {
    setStudents(prev => prev.map(s => s.id !== studentId ? s : { ...s, status: s.status === status ? null : status }))
  }

  const handleMarkAllPresent = () => {
    setStudents(prev => prev.map(s => s.status ? s : { ...s, status: "present" as const }))
  }

  const handleClearAll = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: null })))
  }

  const loadStats = async () => {
    if (!selectedCourse || statsLoaded) return
    setStatsLoading(true)
    try {
      const res = await fetch(`/api/docente/student-attendance?course_id=${selectedCourse}&mode=stats`)
      const data = await res.json()
      setStats(data.students || [])
      setStatsLoaded(true)
    } catch {} finally { setStatsLoading(false) }
  }

  const handleGuardar = async () => {
    if (!selectedCourse || !date || students.length === 0) return
    setSaving(true)
    try {
      const records = students.filter(s => s.status !== null).map(s => ({ student_id: s.id, status: s.status, notes: s.notes || "" }))
      const res = await fetch("/api/docente/student-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: selectedCourse, date, records }),
      })
      if (res.ok) { setLoaded(false); setStatsLoaded(false); setStats([]) }
    } catch {} finally { setSaving(false) }
  }

  const filtered = students.filter(s => {
    if (!searchTerm) return true
    const q = searchTerm.toLowerCase()
    return s.nombres?.toLowerCase().includes(q) || s.apellidos?.toLowerCase().includes(q) || s.dni?.includes(q)
  })

  const counts = {
    present: students.filter(s => s.status === 'present').length,
    late: students.filter(s => s.status === 'late').length,
    absent: students.filter(s => s.status === 'absent').length,
    justified: students.filter(s => s.status === 'justified').length,
  }
  const marked = counts.present + counts.late + counts.absent + counts.justified

  const statusChips: { status: StudentStatus; label: string; title: string; activeClass: string; inactiveClass: string }[] = [
    { status: "present", label: "P", title: "Presente", activeClass: "bg-[var(--note-text)] text-[var(--note-solid-fg)]", inactiveClass: "bg-foreground/10 text-muted-foreground hover:text-foreground" },
    { status: "late", label: "T", title: "Tardanza", activeClass: "bg-[var(--note-text)] text-[var(--note-solid-fg)]", inactiveClass: "bg-foreground/10 text-muted-foreground hover:text-foreground" },
    { status: "absent", label: "F", title: "Falta", activeClass: "bg-[var(--note-text)] text-[var(--note-solid-fg)]", inactiveClass: "bg-foreground/10 text-muted-foreground hover:text-foreground" },
    { status: "justified", label: "J", title: "Justificado", activeClass: "bg-[var(--note-text)] text-[var(--note-solid-fg)]", inactiveClass: "bg-foreground/10 text-muted-foreground hover:text-foreground" },
  ]

  const summary = [
    { label: "Presentes", value: counts.present, icon: UserCheck },
    { label: "Tardanzas", value: counts.late, icon: Clock },
    { label: "Faltas", value: counts.absent, icon: XCircle },
    { label: "Justificados", value: counts.justified, icon: Check },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
      {/* Selector */}
      <Card>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="h-10 w-10 flex items-center justify-center"
              style={{ background: "var(--sb-surface-container-high)", borderRadius: "12px" }}
            >
              <Users className="h-5 w-5" style={{ color: "var(--sb-on-surface-variant)" }} />
            </div>
            <div>
              <SectionLabel>Seleccionar curso y fecha</SectionLabel>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--sb-on-surface-variant)", opacity: 0.6, fontFamily: FONT }}>
                Elige el curso y la fecha para registrar asistencia
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="space-y-1.5">
              <p className="text-xs font-medium" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>Curso</p>
              <PortalSelect
                value={selectedCourse}
                onChange={v => { setSelectedCourse(v); setStatsLoaded(false); setStats([]) }}
                placeholder="Seleccionar curso"
                icon={Users}
                options={courses.map(c => ({ value: c.id, label: `${c.name} - ${c.grade} ${c.section}` }))}
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>Fecha</p>
              <DatePickerDropdown date={date} onSelect={setDate} />
            </div>
            <button
              onClick={handleCargar}
              disabled={loading || !selectedCourse}
              className="h-10 px-5 text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-30"
              style={{ borderRadius: "12px", background: "var(--sb-on-surface)", color: "var(--sb-surface)", fontFamily: FONT }}
            >
              {loading ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Search className="h-4 w-4" />}
              Cargar alumnos
            </button>
          </div>
        </div>
      </Card>

      {/* View toggle */}
      {selectedCourse && (
        <div className="nb-rail">
          {([["registro", "Registrar asistencia"], ["estadisticas", "Estadísticas 30 días"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => { setAlumnoView(key); if (key === "estadisticas") loadStats() }}
              className={cn("nb-chip", alumnoView === key && "active")}>
              <Check className="nb-chip-check" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Stats Table */}
      {alumnoView === "estadisticas" && selectedCourse && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="px-5 pt-5 pb-3" style={{ borderBottom: "1px solid color-mix(in srgb, var(--sb-outline-variant) 25%, transparent)" }}>
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 flex items-center justify-center"
                  style={{ background: "var(--sb-surface-container-high)", borderRadius: "12px" }}
                >
                  <Users className="h-5 w-5" style={{ color: "var(--sb-on-surface-variant)" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--sb-on-surface)", fontFamily: FONT }}>Asistencia últimos 30 días</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>Resumen por alumno</p>
                </div>
              </div>
            </div>
            {statsLoading ? (
              <div className="py-10 text-center">
                <div className="h-5 w-5 border-2 animate-spin mx-auto" style={{ borderColor: "color-mix(in srgb, var(--sb-on-surface-variant) 20%, transparent)", borderTopColor: "var(--sb-on-surface)", borderRadius: "999px" }} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr style={{ background: "var(--sb-surface-container-high)" }}>
                      <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--sb-on-surface-variant)", opacity: 0.45, fontFamily: FONT }}>Alumno</th>
                      <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--sb-on-surface-variant)", opacity: 0.45, fontFamily: FONT }}>A tiempo</th>
                      <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--sb-on-surface-variant)", opacity: 0.45, fontFamily: FONT }}>Tardanzas</th>
                      <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--sb-on-surface-variant)", opacity: 0.45, fontFamily: FONT }}>Faltas</th>
                      <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--sb-on-surface-variant)", opacity: 0.45, fontFamily: FONT }}>Justific.</th>
                      <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--sb-on-surface-variant)", opacity: 0.45, fontFamily: FONT }}>Registros</th>
                      <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--sb-on-surface-variant)", opacity: 0.45, fontFamily: FONT }}>% Asistencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.length === 0 ? (
                      <tr><td colSpan={7} className="py-16 text-center">
                        <Users className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--sb-on-surface-variant)", opacity: 0.3 }} />
                        <p className="text-xs" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>Sin registros</p>
                      </td></tr>
                    ) : stats.map((s, i) => (
                      <tr key={s.id} className="transition-colors"
                        style={{ borderBottom: i < stats.length - 1 ? "1px solid color-mix(in srgb, var(--sb-outline-variant) 20%, transparent)" : "none" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sb-surface-container-high)" }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`h-8 w-8 rounded-lg ${getAvatarColor(`${s.nombres} ${s.apellidos}`)} flex items-center justify-center shrink-0`}>
                              <span className="text-[9px] font-bold text-white">{(s.nombres?.[0] || '') + (s.apellidos?.[0] || '')}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate" style={{ color: "var(--sb-on-surface)", fontFamily: FONT }}>{s.apellidos}, {s.nombres}</p>
                              <p className="text-[9px]" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>DNI: {s.dni}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center text-sm font-semibold" style={{ color: "var(--sb-on-surface)", fontFamily: FONT }}>{s.present}</td>
                        <td className="px-3 py-3 text-center text-sm font-semibold" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>{s.late}</td>
                        <td className="px-3 py-3 text-center text-sm font-semibold text-red-500">{s.absent}</td>
                        <td className="px-3 py-3 text-center text-sm font-semibold text-blue-600">{s.justified}</td>
                        <td className="px-3 py-3 text-center text-xs" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>{s.total}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--sb-surface-container-high)" }}>
                              <div className="h-full rounded-full" style={{
                                width: `${s.rate}%`,
                                background: s.rate >= 80 ? "var(--sb-on-surface)" : "var(--sb-on-surface-variant)",
                                opacity: s.rate >= 80 ? 0.9 : 0.5,
                              }} />
                            </div>
                            <span className="text-xs font-bold w-9 text-right" style={{
                              color: s.rate >= 80 ? "var(--sb-on-surface)" : "var(--sb-on-surface-variant)",
                              opacity: s.rate >= 80 ? 1 : 0.6, fontFamily: FONT,
                            }}>{s.rate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Registro */}
      {loaded && students.length > 0 && alumnoView === "registro" && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {summary.map(item => {
              const Icon = item.icon
              return (
                <div key={item.label} className="p-4" style={{
                  background: "var(--sb-surface-container)",
                  borderRadius: "16px",
                  border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)",
                }}>
                  <div className="h-8 w-8 flex items-center justify-center mb-2" style={{ background: "var(--sb-surface-container-high)", borderRadius: "10px" }}>
                    <Icon className="h-4 w-4" style={{ color: "var(--sb-on-surface-variant)" }} />
                  </div>
                  <SectionLabel>{item.label}</SectionLabel>
                  <p className="mt-1.5 text-lg font-bold leading-none" style={{ color: "var(--sb-on-surface)", fontFamily: FONT }}>{item.value}</p>
                </div>
              )
            })}
          </div>

          {/* Student list */}
          <Card>
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <div>
                  <SectionLabel>Lista de alumnos</SectionLabel>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>
                    {filtered.length} de {students.length} alumnos
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={handleMarkAllPresent}
                    className="h-9 px-3.5 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    style={{ borderRadius: "12px", background: "var(--sb-surface-container-high)", color: "var(--sb-on-surface)", fontFamily: FONT }}>
                    <UserCheck className="h-3.5 w-3.5" /> Marcar todos
                  </button>
                  <button onClick={handleClearAll} disabled={students.every(s => s.status === null)}
                    className="h-9 px-3 text-xs font-medium transition-colors disabled:opacity-40"
                    style={{ borderRadius: "12px", background: "var(--sb-surface-container)", color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>
                    Limpiar
                  </button>
                  <div className="relative w-44">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "var(--sb-on-surface-variant)", opacity: 0.5 }} />
                    <input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                      className="sb-input rounded-xl text-sm h-9 pl-9" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-3" style={{ borderTop: "1px solid color-mix(in srgb, var(--sb-outline-variant) 25%, transparent)" }}>
                {statusChips.map(chip => (
                  <div key={chip.status} className="flex items-center gap-1.5">
                    <span className={`h-4 w-4 rounded-lg flex items-center justify-center text-[9px] font-bold ${chip.activeClass}`}>{chip.label}</span>
                    <span className="text-[10px]" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>{chip.title}</span>
                    <span className="text-[10px] font-semibold ml-0.5" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>
                      {students.filter(s => s.status === chip.status).length}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: "1px solid color-mix(in srgb, var(--sb-outline-variant) 25%, transparent)" }}>
              {filtered.map((s, i) => (
                <div key={s.id}
                  className="flex items-center justify-between gap-3 px-5 py-3 transition-colors"
                  style={{
                    borderBottom: i < filtered.length - 1 ? "1px solid color-mix(in srgb, var(--sb-outline-variant) 20%, transparent)" : "none",
                    background: s.status ? "var(--sb-surface-container-high)" : "transparent",
                  }}
                  onMouseEnter={(e) => { if (!s.status) e.currentTarget.style.background = "var(--sb-surface-container-high)" }}
                  onMouseLeave={(e) => { if (!s.status) e.currentTarget.style.background = "transparent" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-9 w-9 rounded-lg ${getAvatarColor(`${s.nombres} ${s.apellidos}`)} flex items-center justify-center shrink-0`}>
                      <span className="text-white text-[10px] font-bold">{(s.nombres?.[0] || '') + (s.apellidos?.[0] || '')}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--sb-on-surface)", fontFamily: FONT }}>{s.apellidos}, {s.nombres}</p>
                      <p className="text-[10px]" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>DNI: {s.dni}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {statusChips.map(chip => (
                      <button key={chip.status} onClick={() => handleStatusClick(s.id, chip.status)} title={chip.title}
                        className={cn(
                          "h-7 px-2.5 rounded-lg text-[11px] font-semibold transition-all active:scale-95 flex items-center gap-1",
                          s.status === chip.status ? chip.activeClass : chip.inactiveClass
                        )}>
                        {chip.label}
                        {s.status === chip.status && <Check className="h-3 w-3" />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Save bar */}
          <div className="flex items-center gap-3 sticky bottom-4 backdrop-blur-sm p-4" style={{
            borderRadius: "16px",
            border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)",
            background: "color-mix(in srgb, var(--sb-surface) 85%, transparent)",
            boxShadow: "0 4px 24px -4px rgba(0,0,0,0.15)",
          }}>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold" style={{ color: "var(--sb-on-surface)", fontFamily: FONT }}>
                {marked} de {students.length} marcados
              </p>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--sb-surface-container-high)" }}>
                <div className="h-full rounded-full transition-all duration-500" style={{
                  width: `${students.length ? (marked / students.length) * 100 : 0}%`,
                  background: "var(--sb-on-surface)",
                }} />
              </div>
            </div>
            <button onClick={handleGuardar} disabled={saving || students.every(s => s.status === null)}
              className="h-12 px-6 text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              style={{ borderRadius: "12px", background: "var(--sb-on-surface)", color: "var(--sb-surface)", fontFamily: FONT }}>
              {saving ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Check className="h-4 w-4" />}
              Guardar
            </button>
          </div>
        </>
      )}

      {loaded && students.length === 0 && (
        <Card className="py-16 text-center">
          <UserX className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--sb-on-surface-variant)", opacity: 0.3 }} />
          <p className="text-xs" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>No hay alumnos en este curso</p>
        </Card>
      )}

      {!loaded && courses.length === 0 && (
        <Card className="py-16 text-center">
          <Users className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--sb-on-surface-variant)", opacity: 0.3 }} />
          <p className="text-xs" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>Sin cursos asignados</p>
        </Card>
      )}
    </motion.div>
  )
}
