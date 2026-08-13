"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { LogIn, LogOut, Check, UserCheck, UserX, Search, XCircle, Calendar, Users, Flame, Clock, ChevronDown, ChevronLeft, ChevronRight } from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

type Tab = "personal" | "alumnos"
type StudentStatus = "present" | "late" | "absent" | "justified" | null

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  present:    { label: "A tiempo",   color: "bg-emerald-500/10 text-emerald-600",   dot: "bg-emerald-500" },
  late:       { label: "Tardanza",   color: "bg-amber-500/10 text-amber-600",       dot: "bg-amber-500" },
  absent:     { label: "Ausente",    color: "bg-red-500/10 text-red-600",           dot: "bg-red-500" },
  justified:  { label: "Justificado",color: "bg-blue-500/10 text-blue-600",         dot: "bg-blue-500" },
  early_leave:{ label: "Salida anticipada", color: "bg-orange-500/10 text-orange-600", dot: "bg-orange-500" },
}

function getAvatarColor(name: string) {
  const colors = ["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-amber-500", "bg-pink-500", "bg-cyan-500", "bg-rose-500"]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function getLocalDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function getWeekDays(history: any[]) {
  const map: Record<string, any> = {}
  for (const h of history) map[h.date] = h
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

function getBarConfig(status: string | null) {
  if (status === "present") return "bg-emerald-500"
  if (status === "late") return "bg-amber-500"
  if (status === "absent") return "bg-red-400"
  if (status === "justified") return "bg-blue-500"
  if (status === "early_leave") return "bg-orange-500"
  return "bg-[var(--note-fill-strong)]"
}

function NoteChip({ icon: Icon, className, label }: { icon: React.ComponentType<{ className?: string }>; className?: string; label: string }) {
  return (
    <div className="h-8 w-8 rounded-[12px] bg-[var(--note-fill)] flex items-center justify-center shrink-0">
      <Icon className={cn("h-4 w-4", className)} />
    </div>
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
  const prefilterCourse = searchParams.get("curso") || ""
  const [tab, setTab] = React.useState<Tab>(prefilterCourse ? "alumnos" : "personal")
  const [prefillCourse, setPrefillCourse] = React.useState(prefilterCourse)
  const tabs: { key: Tab; label: string }[] = [
    { key: "personal", label: "Mi Asistencia" },
    { key: "alumnos", label: "Asistencia de Alumnos" },
  ]

  return (
    <div className="sb-note">
      <div className="mx-auto w-full max-w-[1034px] px-2 pb-4 space-y-5">
        <header className="pt-2">
          <h1 className="text-[26px] sm:text-[30px] leading-tight tracking-[-0.03em] text-[var(--note-text)]">Asistencia</h1>
          <p className="mt-1 text-sm text-[var(--note-muted)]">Control de tu marcación y la asistencia de tus alumnos</p>
        </header>

        <div className="flex gap-1 p-1 w-fit rounded-[14px] bg-[var(--note-fill)]">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn("px-4 py-2 rounded-[12px] text-sm font-medium transition-all",
                tab === t.key ? "bg-[var(--note-solid-bg)] text-[var(--note-solid-fg)]" : "text-[var(--note-muted)] hover:text-[var(--note-text)]")}>
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
      <div className="space-y-5">
        <div className="animate-pulse grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)]" />)}
        </div>
        <div className="animate-pulse h-24 rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)]" />
      </div>
    )
  }

  const checkedIn = attendance?.check_in
  const checkedOut = attendance?.check_out
  const s = attendance?.status ? STATUS_CONFIG[attendance.status] : null
  const weekDays = getWeekDays(history)
  const hasPending = !!pendingCheckout

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
      {/* Jornada card */}
      <div className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--note-hairline)]">
          <div className="flex items-center gap-3">
            <NoteChip icon={Clock} />
            <div>
              <p className="text-sm font-semibold text-[var(--note-text)] capitalize">
                {new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <p className="text-[11px] text-[var(--note-muted)] mt-0.5">
                {!checkedIn
                  ? schedule
                    ? `Horario hoy: ${schedule.start_time} — ${schedule.end_time}`
                    : "Hoy sin clases programadas"
                  : checkedOut
                    ? `Jornada completada · ${checkedIn.slice(0, 5)} — ${checkedOut.slice(0, 5)}`
                    : `Entrada ${checkedIn.slice(0, 5)} · salida programada ${schedule?.end_time || "—"}`}
              </p>
            </div>
          </div>
          {s && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[12px] text-[11px] font-medium ${s.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 divide-x divide-[var(--note-hairline)]">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <LogIn className={`h-3.5 w-3.5 ${checkedIn ? "text-emerald-500" : "text-[var(--note-muted)]/40"}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--note-muted)]">Entrada</span>
            </div>
            <p className={`text-xl font-bold tracking-tight ${checkedIn ? "text-[var(--note-text)]" : "text-[var(--note-muted)]/40"}`}>
              {checkedIn?.slice(0, 5) || "--:--"}
            </p>
            {schedule && <p className="text-[10px] text-[var(--note-muted)] mt-0.5">Programada: {schedule.start_time}</p>}
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <LogOut className={`h-3.5 w-3.5 ${checkedOut ? "text-amber-500" : "text-[var(--note-muted)]/40"}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--note-muted)]">Salida</span>
            </div>
            <p className={`text-xl font-bold tracking-tight ${checkedOut ? "text-[var(--note-text)]" : "text-[var(--note-muted)]/40"}`}>
              {checkedOut?.slice(0, 5) || "--:--"}
            </p>
            {schedule && <p className="text-[10px] text-[var(--note-muted)] mt-0.5">Programada: {schedule.end_time}</p>}
          </div>
        </div>

        <div className="px-5 pb-5 pt-1">
          {hasPending && (
            <div className="rounded-[16px] bg-amber-500/10 border border-amber-500/20 p-4">
              <div className="flex items-start gap-3">
                <LogOut className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-600">Salida pendiente del {new Date(pendingCheckout.date + "T00:00:00").toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "short" })}</p>
                  <p className="text-xs text-amber-600/70 mt-0.5">
                    Marcaste tu entrada a las {pendingCheckout.check_in?.slice(0, 5)} pero no registraste tu salida. Completa la salida pendiente antes de marcar una nueva entrada.
                  </p>
                  <button onClick={() => handleCheck("check-out", pendingCheckout.date)} disabled={actionLoading}
                    className="mt-3 w-full h-10 rounded-[12px] bg-amber-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-amber-400 transition-all disabled:opacity-50">
                    {actionLoading ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <LogOut className="h-4 w-4" />}
                    Marcar Salida
                  </button>
                </div>
              </div>
            </div>
          )}
          {!hasPending && !checkedIn && (
            <button onClick={() => handleCheck("check-in")} disabled={actionLoading}
              className="w-full h-11 rounded-[12px] bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all disabled:opacity-50">
              {actionLoading ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <LogIn className="h-4 w-4" />}
              Marcar Entrada
            </button>
          )}
          {!hasPending && checkedIn && !checkedOut && (
            <button onClick={() => handleCheck("check-out")} disabled={actionLoading}
              className="w-full h-11 rounded-[12px] bg-amber-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-amber-400 transition-all disabled:opacity-50">
              {actionLoading ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <LogOut className="h-4 w-4" />}
              Marcar Salida
            </button>
          )}
          {!hasPending && checkedIn && checkedOut && (
            <div className="w-full h-11 rounded-[12px] bg-emerald-500/10 text-emerald-600 text-sm font-semibold flex items-center justify-center gap-2">
              <Check className="h-4 w-4" />
              Jornada completada
            </div>
          )}
        </div>
      </div>

      {/* Weekly overview */}
      <div className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <NoteChip icon={Flame} />
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--note-muted)]">Últimos 7 días</p>
          </div>
          <span className="text-[10px] font-medium px-2 py-1 rounded-[12px] bg-[var(--note-fill)] text-[var(--note-muted)]">
            {history.length} registros
          </span>
        </div>
        <div className="px-5 pb-5 flex items-end justify-between gap-2">
          {weekDays.map((d) => {
            const isToday = getLocalDateStr() === d.iso
            return (
              <div key={d.iso} className="flex-1 flex flex-col items-center gap-2">
                <div className="h-20 w-full max-w-[34px] rounded-[12px] bg-[var(--note-fill)] flex items-end overflow-hidden">
                  <div className={`w-full h-full transition-all duration-500 ${getBarConfig(d.status)}`} style={{ height: d.status ? "100%" : "8%" }} />
                </div>
                <div className="flex flex-col items-center">
                  <span className={`text-[9px] font-semibold uppercase ${isToday ? "text-[var(--note-text)]" : "text-[var(--note-muted)]/50"}`}>{d.label}</span>
                  <span className={`text-[10px] font-medium ${isToday ? "text-[var(--note-text)]" : "text-[var(--note-muted)]"}`}>{d.day}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* History */}
      <div className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <p className="text-[10px] font-semibold text-[var(--note-muted)] uppercase tracking-[0.12em]">Historial reciente</p>
        </div>
        {history.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Calendar className="h-8 w-8 mx-auto text-[var(--note-muted)]/40 mb-2" />
            <p className="text-sm text-[var(--note-muted)]">Aún no tienes registros de asistencia</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--note-hairline)]">
            {history.slice(0, 10).map((h: any) => {
              const sc = STATUS_CONFIG[h.status] || STATUS_CONFIG.present
              return (
                <div key={h.id} className="flex items-center justify-between px-5 py-3 hover:bg-[var(--note-fill)] transition-colors">
                  <div className="flex items-center gap-3">
                    <NoteChip icon={Calendar} />
                    <span className="text-sm text-[var(--note-text)] capitalize">
                      {new Date(h.date + "T00:00:00").toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[var(--note-muted)]">Ent: {h.check_in ? h.check_in.slice(0, 5) : '--'}</span>
                    <span className="text-xs text-[var(--note-muted)]">Sal: {h.check_out ? h.check_out.slice(0, 5) : '--'}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-[12px] ${sc.color}`}>
                      <span className={`h-1 w-1 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const MonthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

function DatePickerDropdown({ date, onSelect }: { date: string; onSelect: (d: string) => void }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const current = new Date(date + "T12:00:00")
  const [viewDate, setViewDate] = React.useState(new Date(current.getFullYear(), current.getMonth(), 1))

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

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

  const display = date ? new Date(date + "T12:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" }) : ""

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="h-10 w-full flex items-center gap-2 rounded-[12px] border px-3 text-sm font-medium transition-all cursor-pointer text-left"
        style={{
          borderColor: date ? "var(--note-hairline-strong)" : "var(--note-hairline)",
          background: date ? "var(--note-fill)" : "transparent",
          color: date ? "var(--note-text)" : "var(--note-muted)",
        }}>
        <Calendar className="h-4 w-4 shrink-0 opacity-50" />
        <span className="flex-1 truncate capitalize">
          {date ? display : "Seleccionar fecha"}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 opacity-40 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute z-30 top-full mt-2 left-0 w-[300px] rounded-[16px] border border-[var(--note-hairline)] bg-[var(--note-surface)] p-4"
            style={{ boxShadow: "0 24px 48px -16px rgba(0,0,0,0.45)" }}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.37, 0.35, 0, 1] }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[var(--note-text)] capitalize">{MonthNames[month]} {year}</p>
              <div className="flex gap-1">
                <button onClick={() => setViewDate(new Date(year, month - 1, 1))}
                  className="h-7 w-7 rounded-[12px] flex items-center justify-center hover:bg-[var(--note-fill)] transition-colors text-[var(--note-muted)]">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setViewDate(new Date(year, month + 1, 1))}
                  className="h-7 w-7 rounded-[12px] flex items-center justify-center hover:bg-[var(--note-fill)] transition-colors text-[var(--note-muted)]">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map(d => (
                <div key={d} className="text-center py-1"><span className="text-[10px] font-semibold text-[var(--note-muted)]/50 uppercase tracking-wider">{d}</span></div>
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
                  <button key={day} onClick={() => !isFuture && selectDate(day)}
                    disabled={isFuture}
                    className={cn(
                      "h-8 w-full rounded-[12px] flex items-center justify-center text-[12px] font-medium transition-colors",
                      isFuture && "text-[var(--note-muted)]/30 cursor-not-allowed",
                      isSelected && !isToday && "bg-[var(--note-solid-bg)] text-[var(--note-solid-fg)]",
                      isToday && !isSelected && "bg-[var(--note-fill)] text-[var(--note-text)] ring-1 ring-[var(--note-hairline-strong)]",
                      isToday && isSelected && "bg-[var(--note-solid-bg)] text-[var(--note-solid-fg)]",
                      !isSelected && !isToday && !isFuture && "text-[var(--note-text)]/70 hover:bg-[var(--note-fill)]"
                    )}>{day}</button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

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

  const selected = courses.find(c => c.id === selectedCourse)

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
    { status: "present", label: "P", title: "Presente", activeClass: "bg-emerald-500 text-white", inactiveClass: "bg-[var(--note-fill-strong)] text-[var(--note-muted)]/40 hover:text-emerald-500" },
    { status: "late", label: "T", title: "Tardanza", activeClass: "bg-amber-500 text-white", inactiveClass: "bg-[var(--note-fill-strong)] text-[var(--note-muted)]/40 hover:text-amber-500" },
    { status: "absent", label: "F", title: "Falta", activeClass: "bg-red-500 text-white", inactiveClass: "bg-[var(--note-fill-strong)] text-[var(--note-muted)]/40 hover:text-red-500" },
    { status: "justified", label: "J", title: "Justificado", activeClass: "bg-blue-500 text-white", inactiveClass: "bg-[var(--note-fill-strong)] text-[var(--note-muted)]/40 hover:text-blue-500" },
  ]

  const summary = [
    { label: "Presentes", value: counts.present, color: "text-emerald-600", bg: "bg-emerald-500/8", icon: UserCheck },
    { label: "Tardanzas", value: counts.late, color: "text-amber-600", bg: "bg-amber-500/8", icon: Clock },
    { label: "Faltas", value: counts.absent, color: "text-red-500", bg: "bg-red-500/8", icon: XCircle },
    { label: "Justificados", value: counts.justified, color: "text-blue-600", bg: "bg-blue-500/8", icon: Check },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
      {/* Selector */}
      <div className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)]">
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <NoteChip icon={Users} />
            <p className="text-[10px] font-semibold text-[var(--note-muted)] uppercase tracking-[0.12em]">Seleccionar curso y fecha</p>
          </div>
        </div>
        <div className="px-5 pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-[var(--note-muted)]">Curso</p>
              <select value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); setStatsLoaded(false); setStats([]) }}
                className={`sbf-native-select w-full ${selectedCourse ? "has-value" : ""}`}>
                <option value="">Seleccionar curso</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name} - {c.grade} {c.section}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-[var(--note-muted)]">Fecha</p>
              <DatePickerDropdown date={date} onSelect={setDate} />
            </div>
            <button onClick={handleCargar} disabled={loading || !selectedCourse}
              className="h-10 px-4 rounded-[12px] bg-[var(--note-solid-bg)] text-[var(--note-solid-fg)] text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-30 hover:opacity-90 transition-all">
              {loading ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Search className="h-4 w-4" />}
              Cargar alumnos
            </button>
          </div>
        </div>
      </div>

      {/* View toggle */}
      {selectedCourse && (
        <div className="flex gap-1 p-1 w-fit rounded-[14px] bg-[var(--note-fill)]">
          {([["registro", "Registrar asistencia"], ["estadisticas", "Estadísticas 30 días"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => { setAlumnoView(key); if (key === "estadisticas") loadStats() }}
              className={cn("px-4 py-2 rounded-[12px] text-sm font-medium transition-all",
                alumnoView === key ? "bg-[var(--note-solid-bg)] text-[var(--note-solid-fg)]" : "text-[var(--note-muted)] hover:text-[var(--note-text)]")}>
              {label}
            </button>
          ))}
        </div>
      )}

      {alumnoView === "estadisticas" && selectedCourse && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-[var(--note-hairline)]">
            <div className="flex items-center gap-2">
              <NoteChip icon={Users} />
              <div>
                <p className="text-sm font-semibold text-[var(--note-text)]">Asistencia de los últimos 30 días</p>
                <p className="text-[11px] text-[var(--note-muted)] mt-0.5">Resumen por alumno del curso seleccionado</p>
              </div>
            </div>
          </div>
          {statsLoading ? (
            <div className="py-10 text-center">
              <div className="h-6 w-6 border-2 border-[var(--note-hairline-strong)] border-t-[var(--note-text)] rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="bg-[var(--note-fill)] text-left">
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--note-muted)]">Alumno</th>
                    <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--note-muted)]">A tiempo</th>
                    <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--note-muted)]">Tardanzas</th>
                    <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--note-muted)]">Faltas</th>
                    <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--note-muted)]">Justific.</th>
                    <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--note-muted)]">Registros</th>
                    <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--note-muted)]">% Asistencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--note-hairline)]">
                  {stats.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-[var(--note-muted)]">Sin registros de asistencia en el curso</td></tr>
                  ) : stats.map(s => (
                    <tr key={s.id} className="hover:bg-[var(--note-fill)] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-8 w-8 rounded-[12px] ${getAvatarColor(`${s.nombres} ${s.apellidos}`)} flex items-center justify-center shrink-0`}>
                            <span className="text-[9px] font-bold text-white">{(s.nombres?.[0] || '') + (s.apellidos?.[0] || '')}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[var(--note-text)] truncate">{s.apellidos}, {s.nombres}</p>
                            <p className="text-[9px] text-[var(--note-muted)]">DNI: {s.dni}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center text-sm font-semibold text-emerald-600">{s.present}</td>
                      <td className="px-3 py-3 text-center text-sm font-semibold text-amber-600">{s.late}</td>
                      <td className="px-3 py-3 text-center text-sm font-semibold text-red-500">{s.absent}</td>
                      <td className="px-3 py-3 text-center text-sm font-semibold text-blue-600">{s.justified}</td>
                      <td className="px-3 py-3 text-center text-xs text-[var(--note-muted)]">{s.total}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-24 h-1.5 rounded-full bg-[var(--note-fill-strong)] overflow-hidden">
                            <div className={`h-full rounded-full ${s.rate >= 80 ? "bg-emerald-400" : s.rate >= 60 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${s.rate}%` }} />
                          </div>
                          <span className={`text-xs font-bold w-9 text-right ${s.rate >= 80 ? "text-emerald-600" : s.rate >= 60 ? "text-amber-600" : "text-red-500"}`}>{s.rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {loaded && students.length > 0 && alumnoView === "registro" && (
        <>
          {/* Summary */}
          <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {summary.map(s => {
              const Icon = s.icon
              return (
                <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] p-5">
                  <div className={`h-9 w-9 rounded-[12px] flex items-center justify-center mb-4 ${s.bg}`}>
                    <Icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--note-muted)]">{s.label}</p>
                  <p className="mt-1.5 text-xl font-bold leading-none tracking-tight text-[var(--note-text)]">{s.value}</p>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Student list */}
          <div className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] overflow-hidden">
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <div>
                  <p className="text-[10px] font-semibold text-[var(--note-muted)] uppercase tracking-[0.12em]">Lista de alumnos</p>
                  <p className="text-[11px] text-[var(--note-muted)] mt-0.5">{filtered.length} de {students.length} alumnos</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={handleMarkAllPresent}
                    className="h-9 px-3.5 rounded-[12px] bg-emerald-500/10 text-emerald-600 text-xs font-semibold hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5" /> Marcar todos presentes
                  </button>
                  <button onClick={handleClearAll} disabled={students.every(s => s.status === null)}
                    className="h-9 px-3 rounded-[12px] bg-[var(--note-fill)] text-[var(--note-muted)] text-xs font-medium hover:bg-[var(--note-fill-strong)] disabled:opacity-40 transition-colors">
                    Limpiar
                  </button>
                  <div className="relative w-44">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--note-muted)]/50" />
                    <input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                      className="sb-input rounded-[12px] text-sm h-9 pl-9" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-3 border-t border-[var(--note-hairline)]">
                {statusChips.map(chip => (
                  <div key={chip.status} className="flex items-center gap-1.5">
                    <span className={`h-4 w-4 rounded-[6px] flex items-center justify-center text-[9px] font-bold ${chip.activeClass}`}>{chip.label}</span>
                    <span className="text-[10px] text-[var(--note-muted)]">{chip.title}</span>
                    <span className="text-[10px] font-semibold text-[var(--note-muted)] ml-0.5">
                      {students.filter(s => s.status === chip.status).length}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="divide-y divide-[var(--note-hairline)] border-t border-[var(--note-hairline)]">
              {filtered.map(s => (
                <div key={s.id} className={cn(
                  "flex items-center justify-between gap-3 px-4 py-3 transition-colors",
                  s.status ? "bg-[var(--note-fill)]" : "hover:bg-[var(--note-fill)]"
                )}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-9 w-9 rounded-[12px] ${getAvatarColor(`${s.nombres} ${s.apellidos}`)} flex items-center justify-center shrink-0`}>
                      <span className="text-white text-[10px] font-bold">{(s.nombres?.[0] || '') + (s.apellidos?.[0] || '')}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--note-text)] truncate">{s.apellidos}, {s.nombres}</p>
                      <p className="text-[10px] text-[var(--note-muted)]">DNI: {s.dni}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {statusChips.map(chip => (
                      <button key={chip.status} onClick={() => handleStatusClick(s.id, chip.status)} title={chip.title}
                        className={cn(
                          "h-7 px-2.5 rounded-[12px] text-[11px] font-semibold transition-all active:scale-95 flex items-center gap-1",
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
          </div>

          {/* Save bar */}
          <div className="flex items-center gap-3 sticky bottom-0">
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-[var(--note-text)]">{marked} de {students.length} marcados</p>
              <div className="h-1.5 rounded-full bg-[var(--note-fill-strong)] overflow-hidden">
                <div className="h-full bg-[var(--note-text)] rounded-full transition-all duration-500" style={{ width: `${students.length ? (marked / students.length) * 100 : 0}%` }} />
              </div>
            </div>
            <button onClick={handleGuardar} disabled={saving || students.every(s => s.status === null)}
              className="h-12 px-6 rounded-[12px] text-sm font-semibold bg-[var(--note-solid-bg)] text-[var(--note-solid-fg)] hover:opacity-90 active:opacity-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0">
              {saving ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Check className="h-4 w-4" />}
              Guardar
            </button>
          </div>
        </>
      )}

      {loaded && students.length === 0 && (
        <div className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] py-14 text-center">
          <UserX className="h-10 w-10 mx-auto text-[var(--note-muted)]/40 mb-3" />
          <p className="text-sm text-[var(--note-muted)]">No hay alumnos en este curso</p>
        </div>
      )}

      {!loaded && courses.length === 0 && (
        <div className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] py-14 text-center">
          <Users className="h-10 w-10 mx-auto text-[var(--note-muted)]/40 mb-3" />
          <p className="text-sm text-[var(--note-muted)]">Sin cursos asignados</p>
        </div>
      )}
    </motion.div>
  )
}