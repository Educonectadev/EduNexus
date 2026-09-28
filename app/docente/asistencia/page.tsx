"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { useSearchParams } from "next/navigation"
import { LogIn, LogOut, Check, UserCheck, UserX, Search, XCircle, Calendar, Users, Clock, ChevronDown, ChevronLeft, ChevronRight } from "@/components/ui/proicons"
import { SbSectionHeader, SbBtn } from "@/components/ui/sb"

type Tab = "personal" | "alumnos"
type StudentStatus = "present" | "late" | "absent" | "justified" | null

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  present: { label: "A tiempo", color: "bg-emerald-500/10 text-emerald-600", dot: "bg-emerald-500" },
  late: { label: "Tardanza", color: "bg-amber-500/10 text-amber-600", dot: "bg-amber-500" },
  absent: { label: "Ausente", color: "bg-red-500/10 text-red-600", dot: "bg-red-500" },
  justified: { label: "Justificado", color: "bg-blue-500/10 text-blue-600", dot: "bg-blue-500" },
  early_leave: { label: "Salida anticipada", color: "bg-sb-surface-container-high text-sb-on-surface-variant/60", dot: "bg-sb-on-surface-variant/40" },
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

export default function AsistenciaPage() {
  return <React.Suspense fallback={null}><AsistenciaInner /></React.Suspense>
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
    <div className="space-y-5">
      <SbSectionHeader
        title="Asistencia"
        description="Control de tu marcación y la asistencia de tus alumnos"
      />

      {/* TABS */}
      <div className="flex gap-1 p-1 bg-sb-surface-container rounded-2xl">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 ${tab === t.key ? "bg-sb-on-surface text-sb-surface" : "text-sb-on-surface-variant/50 hover:text-sb-on-surface/70"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "personal" ? <MiAsistencia /> : <AsistenciaAlumnos prefillCourse={prefillCourse} />}
    </div>
  )
}

/* MI ASISTENCIA */
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
      const res = await fetch("/api/docente/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, date: targetDate || localDate, time: localTime }) })
      const data = await res.json()
      if (data.success) { setAttendance(data.attendance); if (data.schedule) setSchedule(data.schedule); setPendingCheckout(null) }
      else if (res.status === 409 && data.pendingCheckout) setPendingCheckout(data.pendingCheckout)
      else if (res.status === 400 && data.message) { setScheduleError(data.message); setTimeout(() => setScheduleError(null), 5000) }
    } catch {} finally { setActionLoading(false) }
  }

  if (loading) return (
    <div className="space-y-5">
      <div className="h-48 animate-pulse rounded-2xl bg-sb-surface-container" />
      <div className="h-28 animate-pulse rounded-2xl bg-sb-surface-container" />
    </div>
  )

  const checkedIn = attendance?.check_in, checkedOut = attendance?.check_out
  const s = attendance?.status ? STATUS_CONFIG[attendance.status] : null
  const weekDays = getWeekDays(history)
  const hasPending = !!pendingCheckout
  const workedMinutes = checkedIn && checkedOut ? Math.round((new Date(`2000-01-01T${checkedOut}`).getTime() - new Date(`2000-01-01T${checkedIn}`).getTime()) / 60000) : null

  return (
    <div className="space-y-5">

      {/* JORNADA DE HOY */}
      <div className="rounded-2xl bg-sb-surface border border-sb-outline-variant/10 p-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50">
              {new Date().toLocaleDateString("es-PE", { weekday: "long" })}
            </p>
            <p className="text-xl font-semibold tracking-tight mt-0.5 capitalize text-sb-on-surface">
              {new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long" })}
            </p>
          </div>
          {s && (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${s.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />{s.label}
            </span>
          )}
        </div>

        {/* Timeline visual */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[{ label: "Entrada", icon: LogIn, time: checkedIn?.slice(0, 5), sched: schedule?.start_time, active: !!checkedIn },
            { label: "Salida", icon: LogOut, time: checkedOut?.slice(0, 5), sched: schedule?.end_time, active: !!checkedOut }].map(item => (
            <div key={item.label} className={`p-4 rounded-2xl ${item.active ? "bg-sb-surface-container-high/50" : "bg-sb-surface-container-low/50"}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${item.active ? "bg-sb-on-surface text-sb-surface" : "bg-sb-surface-container text-sb-on-surface-variant/50"}`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50">{item.label}</span>
              </div>
              <p className={`text-3xl font-semibold tabular-nums ${item.time ? "text-sb-on-surface" : "text-sb-on-surface/30"}`}>{item.time || "—:——"}</p>
              {item.sched && <p className="text-[11px] mt-2 text-sb-on-surface-variant/50">Programado {item.sched}</p>}
            </div>
          ))}
        </div>

        {/* Work summary */}
        {workedMinutes !== null && (
          <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-xl bg-sb-surface-container-low/50">
            <Clock className="h-4 w-4 text-sb-on-surface-variant/50" />
            <span className="text-sm font-medium text-sb-on-surface">
              Jornada: {Math.floor(workedMinutes / 60)}h {workedMinutes % 60}min
            </span>
          </div>
        )}

        {/* Action buttons */}
        {hasPending && (
          <div className="space-y-2">
            <p className="text-[11px] text-sb-on-surface-variant/50">Salida pendiente del {safeFormatDate(pendingCheckout.date)}</p>
            <SbBtn variant="filled" rounded className="w-full h-12 text-sm font-semibold" onClick={() => handleCheck("check-out", pendingCheckout.date)} disabled={actionLoading}>
              {actionLoading ? <span className="animate-spin h-4 w-4 border-2 border-current/30 border-t-current rounded-full" /> : <LogOut className="h-4 w-4" />}
              Marcar Salida Pendiente
            </SbBtn>
          </div>
        )}
        {!hasPending && !checkedIn && (
          <SbBtn variant="filled" rounded className="w-full h-12 text-sm font-semibold" onClick={() => handleCheck("check-in")} disabled={actionLoading}>
            {actionLoading ? <span className="animate-spin h-4 w-4 border-2 border-current/30 border-t-current rounded-full" /> : <LogIn className="h-4 w-4" />}
            Marcar Entrada
          </SbBtn>
        )}
        {!hasPending && checkedIn && !checkedOut && (
          <SbBtn variant="tonal" rounded className="w-full h-12 text-sm font-semibold" onClick={() => handleCheck("check-out")} disabled={actionLoading}>
            {actionLoading ? <span className="animate-spin h-4 w-4 border-2 border-current/30 border-t-current rounded-full" /> : <LogOut className="h-4 w-4" />}
            Marcar Salida
          </SbBtn>
        )}
        {!hasPending && checkedIn && checkedOut && (
          <div className="w-full h-12 text-sm font-medium flex items-center justify-center gap-2 rounded-xl bg-sb-surface-container text-sb-on-surface-variant/50">
            <Check className="h-4 w-4" />Jornada completada
          </div>
        )}

        {scheduleError && (
          <div className="mt-3 p-3 flex items-center gap-3 rounded-xl bg-sb-surface-container-low/50 border border-sb-outline-variant/10">
            <Clock className="h-4 w-4 shrink-0 text-sb-on-surface-variant/50" />
            <p className="text-[13px] font-medium text-sb-on-surface">{scheduleError}</p>
          </div>
        )}
      </div>

      {/* SEMANA */}
      <div className="rounded-2xl bg-sb-surface border border-sb-outline-variant/10">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-sb-outline-variant/10">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50">Esta semana</span>
          <span className="text-[11px] font-medium text-sb-on-surface-variant/50">{history.length} registros</span>
        </div>
        <div className="p-5">
          <div className="flex items-end justify-between gap-2">
            {weekDays.map(d => {
              const isToday = getLocalDateStr() === d.iso
              const hasData = !!d.status
              return (
                <div key={d.iso} className="flex-1 flex flex-col items-center gap-2">
                  <div className={`w-full aspect-square max-w-[42px] flex items-center justify-center rounded-xl border transition-all duration-200 ${hasData ? "bg-sb-surface-container-high border-sb-outline-variant/20" : "bg-sb-surface-container-low/50 border-sb-outline-variant/10"} ${isToday ? "ring-1 ring-sb-on-surface/30" : ""}`}>
                    {hasData && <span className="text-[11px] font-semibold text-sb-on-surface">{d.status === "present" ? "✓" : d.status === "late" ? "T" : d.status === "absent" ? "✗" : "J"}</span>}
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={`text-[9px] font-semibold uppercase ${isToday ? "text-sb-on-surface" : "text-sb-on-surface-variant/50"}`}>{d.label}</span>
                    <span className={`text-[11px] font-semibold ${isToday ? "text-sb-on-surface" : "text-sb-on-surface-variant/50"}`}>{d.day}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* HISTORIAL */}
      <div className="rounded-2xl bg-sb-surface border border-sb-outline-variant/10 overflow-hidden">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-sb-outline-variant/10">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50">Historial reciente</span>
          <span className="text-[11px] font-medium text-sb-on-surface-variant/50">{history.length} registros</span>
        </div>
        {history.length === 0 ? (
          <div className="py-16 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-3 text-sb-on-surface-variant/15" />
            <p className="text-[11px] text-sb-on-surface-variant/50">Sin registros aún</p>
          </div>
        ) : (
          <div className="divide-y divide-sb-outline-variant/10">
            {history.slice(0, 7).map((h: any, i: number) => {
              const statusCfg = STATUS_CONFIG[h.status]
              return (
                <div key={h.id || i} className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-sb-surface-container-low/50">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 flex items-center justify-center shrink-0 rounded-xl bg-sb-surface-container">
                      <Calendar className="h-4 w-4 text-sb-on-surface-variant/50" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium capitalize text-sb-on-surface">{safeFormatDate(h.date)}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-sb-on-surface-variant/50">Ent: {h.check_in ? h.check_in.slice(0, 5) : '—:——'}</span>
                        <span className="text-[11px] text-sb-on-surface-variant/50">Sal: {h.check_out ? h.check_out.slice(0, 5) : '—:——'}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusCfg?.color || "bg-sb-surface-container text-sb-on-surface-variant/60"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusCfg?.dot || "bg-sb-on-surface-variant/40"}`} />{statusCfg?.label || "A tiempo"}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* PORTAL SELECT */
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
        className="sb-input h-10 w-full flex items-center gap-2 text-[13px] font-medium transition-all cursor-pointer text-left">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-sb-on-surface-variant/50" />}
        <span className={`flex-1 truncate ${value ? "text-sb-on-surface" : "text-sb-on-surface-variant/50"}`}>{selected?.label || placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-sb-on-surface-variant/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && createPortal(
        <div ref={panelRef} className="fixed z-[9999]" style={{ top: pos.top, left: pos.left, width: pos.width }}>
          <div className="max-h-[260px] overflow-y-auto py-1.5 bg-sb-surface rounded-xl border border-sb-outline-variant/20 shadow-lg">
            {options.map(opt => {
              const isSelected = opt.value === value
              return (
                <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-left transition-colors ${isSelected ? "bg-sb-surface-container-high text-sb-on-surface" : "text-sb-on-surface hover:bg-sb-surface-container-low/50"}`}>
                  <span className="flex-1">{opt.label}</span>
                  {isSelected && <Check className="h-4 w-4 text-sb-on-surface" />}
                </button>
              )
            })}
          </div>
        </div>, document.body
      )}
    </>
  )
}

/* DATE PICKER */
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
        className="sb-input h-10 w-full flex items-center gap-2 text-[13px] font-medium transition-all cursor-pointer text-left">
        <Calendar className="h-4 w-4 shrink-0 text-sb-on-surface-variant/50" />
        <span className={`flex-1 truncate capitalize ${date ? "text-sb-on-surface" : "text-sb-on-surface-variant/50"}`}>{date ? safeFormatDate(date) : "Seleccionar fecha"}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-sb-on-surface-variant/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && createPortal(
        <div ref={panelRef} className="fixed z-[9999]" style={{ top: pos.top, left: pos.left, width: pos.width }}>
          <div className="p-4 bg-sb-surface rounded-2xl border border-sb-outline-variant/20 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold capitalize text-sb-on-surface">{MonthNames[month]} {year}</p>
              <div className="flex gap-1">
                {[new Date(year, month - 1, 1), new Date(year, month + 1, 1)].map((d, i) => (
                  <button key={i} onClick={() => setViewDate(d)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-sb-surface-container-high transition-colors text-sb-on-surface-variant/50">
                    {i === 0 ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map(d => <div key={d} className="text-center py-1"><span className="text-[10px] font-semibold uppercase tracking-wider text-sb-on-surface-variant/30">{d}</span></div>)}
            </div>
            <div className="grid grid-cols-7 gap-px">
              {days.map((day, i) => {
                if (day === null) return <div key={`e-${i}`} />
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                const isToday = dateStr === today, isSelected = dateStr === date, isFuture = dateStr > today
                return (
                  <button key={day} onClick={() => !isFuture && onSelect(dateStr)} disabled={isFuture}
                    className={`h-8 w-full flex items-center justify-center text-[12px] font-medium rounded-lg transition-colors ${isSelected ? "bg-sb-on-surface text-sb-surface" : isToday ? "bg-sb-primary/10 text-sb-primary ring-1 ring-sb-primary/30" : isFuture ? "text-sb-on-surface-variant/20 cursor-not-allowed" : "text-sb-on-surface/70 hover:bg-sb-surface-container-high"}`}>
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

/* ASISTENCIA ALUMNOS */
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
    <div className="space-y-5">
      {/* SELECTOR */}
      <div className="rounded-2xl bg-sb-surface border border-sb-outline-variant/10 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-sb-surface-container">
            <Users className="h-5 w-5 text-sb-on-surface-variant/50" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50">Seleccionar curso y fecha</p>
            <p className="text-[11px] mt-0.5 text-sb-on-surface-variant/50">Elige el curso y la fecha para registrar asistencia</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50">Curso</p>
            <PortalSelect value={selectedCourse} onChange={v => { setSelectedCourse(v); setStatsLoaded(false); setStats([]) }} placeholder="Seleccionar curso" icon={Users}
              options={courses.map(c => ({ value: c.id, label: `${c.name} - ${c.grade} ${c.section}` }))} />
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50">Fecha</p>
            <DatePickerDropdown date={date} onSelect={setDate} />
          </div>
          <SbBtn variant="filled" rounded className="h-10 px-5 text-sm font-semibold" onClick={handleCargar} disabled={loading || !selectedCourse}>
            {loading ? <span className="animate-spin h-4 w-4 border-2 border-current/30 border-t-current rounded-full" /> : <Search className="h-4 w-4" />}
            Cargar
          </SbBtn>
        </div>
      </div>

      {/* VIEW TOGGLE */}
      {selectedCourse && (
        <div className="flex gap-1 p-1 bg-sb-surface-container rounded-2xl">
          {([["registro", "Registrar asistencia"], ["estadisticas", "Estadísticas 30 días"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => { setAlumnoView(key); if (key === "estadisticas") loadStats() }}
              className={`flex-1 rounded-xl px-3 py-1.5 text-xs font-medium text-center transition-all ${alumnoView === key ? "bg-sb-on-surface text-sb-surface" : "text-sb-on-surface-variant/50 hover:text-sb-on-surface/70"}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* STATS TABLE */}
      {alumnoView === "estadisticas" && selectedCourse && (
        <div className="rounded-2xl bg-sb-surface border border-sb-outline-variant/10 overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-sb-outline-variant/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-sb-surface-container">
                <Users className="h-5 w-5 text-sb-on-surface-variant/50" />
              </div>
              <div>
                <p className="text-sm font-semibold text-sb-on-surface">Asistencia últimos 30 días</p>
                <p className="text-[11px] mt-0.5 text-sb-on-surface-variant/50">Resumen por alumno</p>
              </div>
            </div>
          </div>
          {statsLoading ? (
            <div className="py-10 text-center"><div className="h-5 w-5 border-2 border-sb-surface-container border-t-sb-on-surface rounded-full animate-spin mx-auto" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="bg-sb-surface-container/50">
                    {["Alumno", "A tiempo", "Tardanzas", "Faltas", "Justific.", "Registros", "% Asistencia"].map(h => (
                      <th key={h} className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 ${h === "Alumno" || h === "% Asistencia" ? "text-left" : "text-center"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sb-outline-variant/10">
                  {stats.length === 0 ? (
                    <tr><td colSpan={7} className="py-16 text-center">
                      <Users className="h-10 w-10 mx-auto mb-3 text-sb-on-surface-variant/15" />
                      <p className="text-xs text-sb-on-surface-variant/50">Sin registros</p>
                    </td></tr>
                  ) : stats.map(s => (
                    <tr key={s.id} className="transition-colors hover:bg-sb-surface-container-low/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 bg-sb-surface-container">
                            <span className="text-[9px] font-semibold text-sb-on-surface-variant/60">{(s.nombres?.[0] || '') + (s.apellidos?.[0] || '')}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate text-sb-on-surface">{s.apellidos}, {s.nombres}</p>
                            <p className="text-[9px] text-sb-on-surface-variant/50">DNI: {s.dni}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center text-sm font-semibold text-sb-on-surface">{s.present}</td>
                      <td className="px-3 py-3 text-center text-sm font-semibold text-sb-on-surface-variant/60">{s.late}</td>
                      <td className="px-3 py-3 text-center text-sm font-semibold text-sb-on-surface-variant/60">{s.absent}</td>
                      <td className="px-3 py-3 text-center text-sm font-semibold text-sb-on-surface">{s.justified}</td>
                      <td className="px-3 py-3 text-center text-xs text-sb-on-surface-variant/50">{s.total}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-24 h-1.5 rounded-full overflow-hidden bg-sb-surface-container">
                            <div className={`h-full rounded-full transition-all duration-500 bg-sb-on-surface ${s.rate >= 80 ? "opacity-90" : "opacity-50"}`} style={{ width: `${s.rate}%` }} />
                          </div>
                          <span className={`text-xs font-semibold w-9 text-right ${s.rate >= 80 ? "text-sb-on-surface" : "text-sb-on-surface-variant/60"}`}>{s.rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* REGISTRO */}
      {loaded && students.length > 0 && alumnoView === "registro" && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {summary.map(item => {
              const Icon = item.icon
              return (
                <div key={item.label} className="rounded-2xl bg-sb-surface border border-sb-outline-variant/10 p-4 transition-all duration-300 hover:scale-[1.02]">
                  <div className="h-8 w-8 flex items-center justify-center mb-2 rounded-lg bg-sb-surface-container">
                    <Icon className="h-4 w-4 text-sb-on-surface-variant/50" />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50">{item.label}</p>
                  <p className="mt-1.5 text-lg font-semibold leading-none text-sb-on-surface">{item.value}</p>
                </div>
              )
            })}
          </div>

          {/* Student list */}
          <div className="rounded-2xl bg-sb-surface border border-sb-outline-variant/10 overflow-hidden">
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50">Lista de alumnos</p>
                  <p className="text-[11px] mt-0.5 text-sb-on-surface-variant/50">{filtered.length} de {students.length} alumnos</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={handleMarkAllPresent} className="sb-btn tonal rounded h-9 px-4 text-xs font-semibold flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5" /> Marcar todos
                  </button>
                  <button onClick={handleClearAll} disabled={students.every(s => s.status === null)}
                    className="sb-btn rounded h-9 px-4 text-xs font-medium">Limpiar</button>
                  <div className="relative w-44">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sb-on-surface-variant/40" />
                    <input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                      className="sb-input h-9 pl-9 pr-3 text-[13px]" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-3 border-t border-sb-outline-variant/10">
                {statusChips.map(chip => (
                  <div key={chip.status} className="flex items-center gap-1.5">
                    <span className={`h-4 w-4 rounded-md flex items-center justify-center text-[9px] font-bold ${chip.status ? STATUS_CONFIG[chip.status].color : "bg-sb-surface-container text-sb-on-surface-variant/60"}`}>{chip.label}</span>
                    <span className="text-[10px] text-sb-on-surface-variant/50">{chip.title}</span>
                    <span className="text-[10px] font-semibold ml-0.5 text-sb-on-surface-variant/60">{students.filter(s => s.status === chip.status).length}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-sb-outline-variant/10 divide-y divide-sb-outline-variant/10">
              {filtered.map(s => (
                <div key={s.id} className={`flex items-center justify-between gap-3 px-5 py-3 transition-all duration-200 hover:bg-sb-surface-container-low/50 ${s.status ? "bg-sb-surface-container-low/50" : ""}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 bg-sb-surface-container">
                      <span className="text-[10px] font-semibold text-sb-on-surface-variant/60">{(s.nombres?.[0] || '') + (s.apellidos?.[0] || '')}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate text-sb-on-surface">{s.apellidos}, {s.nombres}</p>
                      <p className="text-[10px] text-sb-on-surface-variant/50">DNI: {s.dni}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {statusChips.map(chip => {
                      const active = s.status === chip.status
                      const cfg = chip.status ? STATUS_CONFIG[chip.status] : null
                      return (
                        <button key={chip.status} onClick={() => handleStatusClick(s.id, chip.status)} title={chip.title}
                          className={`h-8 px-3 rounded-xl text-[11px] font-semibold transition-all duration-200 flex items-center gap-1 ${active ? (cfg?.color || "") : "bg-sb-surface-container text-sb-on-surface-variant/50"}`}>
                          {chip.label}{active && <Check className="h-3 w-3" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save bar */}
          <div className="flex items-center gap-4 sticky bottom-4 backdrop-blur-xl p-4 rounded-2xl border border-sb-outline-variant/10 bg-sb-surface">
            <div className="flex-1 space-y-1.5">
              <p className="text-sm font-semibold text-sb-on-surface">{marked} de {students.length} marcados</p>
              <div className="h-2 rounded-full overflow-hidden bg-sb-surface-container">
                <div className="h-full rounded-full transition-all duration-500 bg-sb-on-surface" style={{ width: `${students.length ? (marked / students.length) * 100 : 0}%` }} />
              </div>
            </div>
            <SbBtn variant="filled" rounded className="h-12 px-8 text-sm font-semibold" onClick={handleGuardar} disabled={saving || students.every(s => s.status === null)}>
              {saving ? <span className="animate-spin h-4 w-4 border-2 border-current/30 border-t-current rounded-full" /> : null}Guardar
            </SbBtn>
          </div>
        </>
      )}

      {loaded && students.length === 0 && (
        <div className="py-16 text-center rounded-2xl bg-sb-surface border border-sb-outline-variant/10">
          <UserX className="h-10 w-10 mx-auto mb-3 text-sb-on-surface-variant/15" />
          <p className="text-xs text-sb-on-surface-variant/50">No hay alumnos en este curso</p>
        </div>
      )}

      {!loaded && courses.length === 0 && (
        <div className="py-16 text-center rounded-2xl bg-sb-surface border border-sb-outline-variant/10">
          <Users className="h-10 w-10 mx-auto mb-3 text-sb-on-surface-variant/15" />
          <p className="text-xs text-sb-on-surface-variant/50">Sin cursos asignados</p>
        </div>
      )}
    </div>
  )
}
