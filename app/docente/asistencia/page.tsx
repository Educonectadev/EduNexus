"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { LogIn, LogOut, Check, UserCheck, UserX, Search, XCircle, Calendar, Users, Flame, Clock, ChevronDown, ChevronLeft, ChevronRight } from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

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
  if (status === "present") return "bg-[var(--note-text)]"
  if (status === "late") return "bg-[var(--note-muted)]"
  if (status === "absent") return "bg-[var(--note-muted)] opacity-60"
  if (status === "justified") return "bg-[var(--note-text)] opacity-60"
  if (status === "early_leave") return "bg-[var(--note-muted)]"
  return "bg-[var(--note-fill-strong)]"
}

function NoteChip({ icon: Icon, className, label }: { icon: React.ComponentType<{ className?: string }>; className?: string; label: string }) {
  return (
    <div className="h-8 w-8 rounded-xl bg-[var(--note-fill)] flex items-center justify-center shrink-0">
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
    <div className="min-h-screen" style={{ background: "var(--sb-surface)" }}>
      <div className="max-w-[800px] mx-auto px-4 py-8">
        <header className="mb-6">
          <span
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.8px]"
            style={{ color: "var(--sb-on-surface-variant)", opacity: 0.45 }}
          >
            <span className="w-6 h-px" style={{ background: "var(--sb-outline-variant)" }} />Panel Docente
          </span>
          <h1
            className="text-2xl font-semibold mt-2"
            style={{
              color: "var(--sb-on-surface)",
              fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif",
              letterSpacing: "-0.02em"
            }}
          >
            Asistencia
          </h1>
          <p
            className="text-sm mt-1"
            style={{
              color: "var(--sb-on-surface-variant)",
              fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
            }}
          >
            Control de tu marcación y la asistencia de tus alumnos
          </p>
        </header>

        <div className="nb-rail">
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
        <div className="animate-pulse grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-xl border border-foreground/10 bg-foreground/5" />)}
        </div>
        <div className="animate-pulse h-24 rounded-xl border border-foreground/10 bg-foreground/5" />
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
      {/* Jornada card */}
      <div className="rounded-xl border border-foreground/10 bg-background overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-foreground/10">
          <div className="flex items-center gap-3">
            <NoteChip icon={Clock} label="" />
            <div>
              <p className="text-sm font-semibold text-foreground capitalize">
                {new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
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
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${s.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 divide-x divide-foreground/10">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <LogIn className={`h-3.5 w-3.5 ${checkedIn ? "text-foreground" : "text-muted-foreground/40"}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Entrada</span>
            </div>
            <p className={`text-xl font-bold tracking-tight ${checkedIn ? "text-foreground" : "text-muted-foreground/40"}`}>
              {checkedIn?.slice(0, 5) || "--:--"}
            </p>
            {schedule && <p className="text-[10px] text-muted-foreground mt-0.5">Programada: {schedule.start_time}</p>}
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <LogOut className={`h-3.5 w-3.5 ${checkedOut ? "text-foreground" : "text-muted-foreground/40"}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Salida</span>
            </div>
            <p className={`text-xl font-bold tracking-tight ${checkedOut ? "text-foreground" : "text-muted-foreground/40"}`}>
              {checkedOut?.slice(0, 5) || "--:--"}
            </p>
            {schedule && <p className="text-[10px] text-muted-foreground mt-0.5">Programada: {schedule.end_time}</p>}
          </div>
        </div>

        <div className="px-5 pb-5 pt-1">
          {hasPending && (
            <div className="rounded-xl bg-foreground/5 border border-foreground/10 p-4">
              <div className="flex items-start gap-3">
                <LogOut className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Salida pendiente del {new Date(pendingCheckout.date + "T00:00:00").toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "short" })}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Marcaste tu entrada a las {pendingCheckout.check_in?.slice(0, 5)} pero no registraste tu salida. Completa la salida pendiente antes de marcar una nueva entrada.
                  </p>
                  <button onClick={() => handleCheck("check-out", pendingCheckout.date)} disabled={actionLoading}
                    className="mt-3 w-full h-10 rounded-xl bg-[var(--note-solid-bg)] text-[var(--note-solid-fg)] text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50">
                    {actionLoading ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <LogOut className="h-4 w-4" />}
                    Marcar Salida
                  </button>
                </div>
              </div>
            </div>
          )}
          {!hasPending && !checkedIn && (
            <button onClick={() => handleCheck("check-in")} disabled={actionLoading}
              className="w-full h-11 rounded-xl bg-[var(--note-solid-bg)] text-[var(--note-solid-fg)] text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50">
              {actionLoading ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <LogIn className="h-4 w-4" />}
              Marcar Entrada
            </button>
          )}
          {!hasPending && checkedIn && !checkedOut && (
            <button onClick={() => handleCheck("check-out")} disabled={actionLoading}
              className="w-full h-11 rounded-xl bg-[var(--note-solid-bg)] text-[var(--note-solid-fg)] text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50">
              {actionLoading ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <LogOut className="h-4 w-4" />}
              Marcar Salida
            </button>
          )}
          {!hasPending && checkedIn && checkedOut && (
            <div className="w-full h-11 rounded-xl bg-foreground/10 text-foreground text-sm font-semibold flex items-center justify-center gap-2">
              <Check className="h-4 w-4" />
              Jornada completada
            </div>
          )}
        </div>
      </div>

      {/* Weekly overview */}
      <div className="rounded-xl border border-foreground/10 bg-background overflow-hidden">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <NoteChip icon={Flame} label="" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Últimos 7 días</p>
          </div>
          <span className="text-[10px] font-medium px-2 py-1 rounded-lg bg-foreground/5 text-muted-foreground">
            {history.length} registros
          </span>
        </div>
        <div className="px-4 pb-4 flex items-end justify-between gap-2">
          {weekDays.map((d) => {
            const isToday = getLocalDateStr() === d.iso
            return (
              <div key={d.iso} className="flex-1 flex flex-col items-center gap-2">
                <div className="h-20 w-full max-w-[34px] rounded-lg bg-foreground/5 flex items-end overflow-hidden">
                  <div className={`w-full h-full transition-all duration-500 ${getBarConfig(d.status)}`} style={{ height: d.status ? "100%" : "8%" }} />
                </div>
                <div className="flex flex-col items-center">
                  <span className={`text-[9px] font-semibold uppercase ${isToday ? "text-foreground" : "text-muted-foreground/50"}`}>{d.label}</span>
                  <span className={`text-[10px] font-medium ${isToday ? "text-foreground" : "text-muted-foreground"}`}>{d.day}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* History */}
      <div className="rounded-xl border border-foreground/10 bg-background overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">Historial reciente</p>
        </div>
        {history.length === 0 ? (
          <div className="py-20 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Aún no tienes registros de asistencia</p>
          </div>
        ) : (
          <div className="divide-y divide-foreground/10">
            {history.slice(0, 10).map((h: any) => {
              const sc = STATUS_CONFIG[h.status] || STATUS_CONFIG.present
              return (
                <div key={h.id} className="flex items-center justify-between px-5 py-3 hover:bg-foreground/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <NoteChip icon={Calendar} label="" />
                    <span className="text-sm text-foreground capitalize">
                      {new Date(h.date + "T00:00:00").toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">Ent: {h.check_in ? h.check_in.slice(0, 5) : '--'}</span>
                    <span className="text-xs text-muted-foreground">Sal: {h.check_out ? h.check_out.slice(0, 5) : '--'}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-lg ${sc.color}`}>
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
        className="h-10 w-full flex items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-all cursor-pointer text-left"
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
            className="absolute z-30 top-full mt-2 left-0 w-[300px] rounded-xl border border-foreground/10 bg-background p-4"
            style={{ boxShadow: "0 24px 48px -16px rgba(0,0,0,0.45)" }}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.37, 0.35, 0, 1] }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground capitalize">{MonthNames[month]} {year}</p>
              <div className="flex gap-1">
                <button onClick={() => setViewDate(new Date(year, month - 1, 1))}
                  className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-foreground/5 transition-colors text-muted-foreground">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setViewDate(new Date(year, month + 1, 1))}
                  className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-foreground/5 transition-colors text-muted-foreground">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map(d => (
                <div key={d} className="text-center py-1"><span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">{d}</span></div>
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
                      "h-8 w-full rounded-lg flex items-center justify-center text-[12px] font-medium transition-colors",
                      isFuture && "text-muted-foreground/30 cursor-not-allowed",
                      isSelected && !isToday && "bg-[var(--note-solid-bg)] text-[var(--note-solid-fg)]",
                      isToday && !isSelected && "bg-foreground/5 text-foreground ring-1 ring-foreground/10",
                      isToday && isSelected && "bg-[var(--note-solid-bg)] text-[var(--note-solid-fg)]",
                      !isSelected && !isToday && !isFuture && "text-foreground/70 hover:bg-foreground/5"
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
    { status: "present", label: "P", title: "Presente", activeClass: "bg-[var(--note-text)] text-[var(--note-solid-fg)]", inactiveClass: "bg-foreground/10 text-muted-foreground hover:text-foreground" },
    { status: "late", label: "T", title: "Tardanza", activeClass: "bg-[var(--note-text)] text-[var(--note-solid-fg)]", inactiveClass: "bg-foreground/10 text-muted-foreground hover:text-foreground" },
    { status: "absent", label: "F", title: "Falta", activeClass: "bg-[var(--note-text)] text-[var(--note-solid-fg)]", inactiveClass: "bg-foreground/10 text-muted-foreground hover:text-foreground" },
    { status: "justified", label: "J", title: "Justificado", activeClass: "bg-[var(--note-text)] text-[var(--note-solid-fg)]", inactiveClass: "bg-foreground/10 text-muted-foreground hover:text-foreground" },
  ]

  const summary = [
    { label: "Presentes", value: counts.present, color: "text-foreground", bg: "bg-foreground/5", icon: UserCheck },
    { label: "Tardanzas", value: counts.late, color: "text-muted-foreground", bg: "bg-foreground/5", icon: Clock },
    { label: "Faltas", value: counts.absent, color: "text-muted-foreground", bg: "bg-foreground/5", icon: XCircle },
    { label: "Justificados", value: counts.justified, color: "text-foreground", bg: "bg-foreground/5", icon: Check },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
      {/* Selector */}
      <div className="rounded-xl border border-foreground/10 bg-background">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <NoteChip icon={Users} label="" />
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">Seleccionar curso y fecha</p>
          </div>
        </div>
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Curso</p>
              <select value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); setStatsLoaded(false); setStats([]) }}
                className={`sbf-native-select w-full ${selectedCourse ? "has-value" : ""}`}>
                <option value="">Seleccionar curso</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name} - {c.grade} {c.section}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Fecha</p>
              <DatePickerDropdown date={date} onSelect={setDate} />
            </div>
            <button onClick={handleCargar} disabled={loading || !selectedCourse}
              className="h-10 px-4 rounded-xl bg-[var(--note-solid-bg)] text-[var(--note-solid-fg)] text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-30 hover:opacity-90 transition-all">
              {loading ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Search className="h-4 w-4" />}
              Cargar alumnos
            </button>
          </div>
        </div>
      </div>

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

      {alumnoView === "estadisticas" && selectedCourse && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-foreground/10 bg-background overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-foreground/10">
            <div className="flex items-center gap-2">
              <NoteChip icon={Users} label="" />
              <div>
                <p className="text-sm font-semibold text-foreground">Asistencia de los últimos 30 días</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Resumen por alumno del curso seleccionado</p>
              </div>
            </div>
          </div>
          {statsLoading ? (
            <div className="py-10 text-center">
              <div className="h-6 w-6 border-2 border-foreground/10 border-t-foreground rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="bg-foreground/5 text-left">
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Alumno</th>
                    <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">A tiempo</th>
                    <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tardanzas</th>
                    <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Faltas</th>
                    <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Justific.</th>
                    <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Registros</th>
                    <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">% Asistencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/10">
                  {stats.length === 0 ? (
                    <tr><td colSpan={7} className="py-20 text-center">
                      <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">Sin registros de asistencia en el curso</p>
                    </td></tr>
                  ) : stats.map(s => (
                    <tr key={s.id} className="hover:bg-foreground/5 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-8 w-8 rounded-lg ${getAvatarColor(`${s.nombres} ${s.apellidos}`)} flex items-center justify-center shrink-0`}>
                            <span className="text-[9px] font-bold text-white">{(s.nombres?.[0] || '') + (s.apellidos?.[0] || '')}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{s.apellidos}, {s.nombres}</p>
                            <p className="text-[9px] text-muted-foreground">DNI: {s.dni}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center text-sm font-semibold text-foreground">{s.present}</td>
                      <td className="px-3 py-3 text-center text-sm font-semibold text-muted-foreground">{s.late}</td>
                      <td className="px-3 py-3 text-center text-sm font-semibold text-red-500">{s.absent}</td>
                      <td className="px-3 py-3 text-center text-sm font-semibold text-blue-600">{s.justified}</td>
                      <td className="px-3 py-3 text-center text-xs text-muted-foreground">{s.total}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-24 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                            <div className={`h-full rounded-full ${s.rate >= 80 ? "bg-foreground" : s.rate >= 60 ? "bg-muted-foreground" : "bg-muted-foreground opacity-60"}`} style={{ width: `${s.rate}%` }} />
                          </div>
                            <span className={`text-xs font-bold w-9 text-right ${s.rate >= 80 ? "text-foreground" : s.rate >= 60 ? "text-muted-foreground" : "text-muted-foreground opacity-60"}`}>{s.rate}%</span>
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
          <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-foreground/10 rounded-xl overflow-hidden">
            {summary.map(s => {
              const Icon = s.icon
              return (
                <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-background p-5 lg:p-6">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-3 ${s.bg}`}>
                    <Icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{s.label}</p>
                  <p className="mt-1.5 text-xl font-bold leading-none tracking-tight text-foreground">{s.value}</p>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Student list */}
          <div className="rounded-xl border border-foreground/10 bg-background overflow-hidden">
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">Lista de alumnos</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{filtered.length} de {students.length} alumnos</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={handleMarkAllPresent}
                    className="h-9 px-3.5 rounded-xl bg-foreground/10 text-foreground text-xs font-semibold hover:opacity-90 transition-colors flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5" /> Marcar todos presentes
                  </button>
                  <button onClick={handleClearAll} disabled={students.every(s => s.status === null)}
                    className="h-9 px-3 rounded-xl bg-foreground/5 text-muted-foreground text-xs font-medium hover:bg-foreground/10 disabled:opacity-40 transition-colors">
                    Limpiar
                  </button>
                  <div className="relative w-44">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                    <input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                      className="sb-input rounded-xl text-sm h-9 pl-9" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-3 border-t border-foreground/10">
                {statusChips.map(chip => (
                  <div key={chip.status} className="flex items-center gap-1.5">
                    <span className={`h-4 w-4 rounded-lg flex items-center justify-center text-[9px] font-bold ${chip.activeClass}`}>{chip.label}</span>
                    <span className="text-[10px] text-muted-foreground">{chip.title}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground ml-0.5">
                      {students.filter(s => s.status === chip.status).length}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="divide-y divide-foreground/10 border-t border-foreground/10">
              {filtered.map(s => (
                <div key={s.id} className={cn(
                  "flex items-center justify-between gap-3 px-4 py-3 transition-colors",
                  s.status ? "bg-foreground/5" : "hover:bg-foreground/5"
                )}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-9 w-9 rounded-lg ${getAvatarColor(`${s.nombres} ${s.apellidos}`)} flex items-center justify-center shrink-0`}>
                      <span className="text-white text-[10px] font-bold">{(s.nombres?.[0] || '') + (s.apellidos?.[0] || '')}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.apellidos}, {s.nombres}</p>
                      <p className="text-[10px] text-muted-foreground">DNI: {s.dni}</p>
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
          </div>

          {/* Save bar */}
          <div className="flex items-center gap-3 sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 rounded-xl border border-foreground/10">
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-foreground">{marked} de {students.length} marcados</p>
              <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                <div className="h-full bg-foreground rounded-full transition-all duration-500" style={{ width: `${students.length ? (marked / students.length) * 100 : 0}%` }} />
              </div>
            </div>
            <button onClick={handleGuardar} disabled={saving || students.every(s => s.status === null)}
              className="h-12 px-6 rounded-xl text-sm font-semibold bg-[var(--note-solid-bg)] text-[var(--note-solid-fg)] hover:opacity-90 active:opacity-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0">
              {saving ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Check className="h-4 w-4" />}
              Guardar
            </button>
          </div>
        </>
      )}

      {loaded && students.length === 0 && (
        <div className="rounded-xl border border-foreground/10 bg-background py-20 text-center">
          <UserX className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">No hay alumnos en este curso</p>
        </div>
      )}

      {!loaded && courses.length === 0 && (
        <div className="rounded-xl border border-foreground/10 bg-background py-20 text-center">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Sin cursos asignados</p>
        </div>
      )}
    </motion.div>
  )
}
