"use client"

import * as React from "react"
import { Clock, LogIn, LogOut, Check, UserCheck, UserX, Search, XCircle, Calendar, Users, ChevronDown, Sparkles, Flame } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { SbTabs } from "@/components/ui/sb"

type Tab = "personal" | "alumnos"
type StudentStatus = "present" | "late" | "absent" | "justified" | null

const staggerItem = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }
const listItem = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, filter: "blur(8px)", y: -10 },
}

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  present: { label: "A tiempo", color: "text-emerald-600", bg: "bg-emerald-500/10", dot: "bg-emerald-500" },
  late: { label: "Tardanza", color: "text-amber-600", bg: "bg-amber-500/10", dot: "bg-amber-500" },
  absent: { label: "Ausente", color: "text-red-500", bg: "bg-red-500/10", dot: "bg-red-500" },
  justified: { label: "Justificado", color: "text-blue-600", bg: "bg-blue-500/10", dot: "bg-blue-500" },
}

function getAvatarColor(name: string) {
  const colors = ["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-amber-500", "bg-pink-500", "bg-cyan-500", "bg-rose-500"]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function getWeekDays(history: any[]) {
  const map: Record<string, any> = {}
  for (const h of history) map[h.date] = h
  const days: { iso: string; label: string; day: number; status: string | null }[] = []
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().slice(0, 10)
    const rec = map[iso]
    days.push({
      iso,
      label: dayNames[d.getDay()],
      day: d.getDate(),
      status: rec?.status || null,
    })
  }
  return days
}

function getBarConfig(status: string | null) {
  if (status === "present") return { h: "h-full", color: "bg-emerald-500" }
  if (status === "late") return { h: "h-2/3", color: "bg-amber-500" }
  if (status === "absent") return { h: "h-1/3", color: "bg-red-400" }
  if (status === "justified") return { h: "h-1/2", color: "bg-blue-500" }
  return { h: "h-1", color: "bg-sb-on-surface-variant/15" }
}

function MiniHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-xl bg-sb-primary/10 flex items-center justify-center shrink-0">
        <Clock className="h-4 w-4 text-sb-primary" />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sb-on-surface-variant/60">{eyebrow}</p>
        <h1 className="text-2xl font-bold tracking-tight text-sb-on-surface mt-0.5">{title}</h1>
        <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">{subtitle}</p>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color, bg, delay = 0 }: {
  label: string; value: string; icon: React.ElementType; color: string; bg: string; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-sb-surface rounded-2xl p-4 border border-sb-outline-variant/10"
    >
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
        <Icon className={`h-4.5 w-4.5 ${color}`} />
      </div>
      <p className="text-lg font-bold tracking-tight text-sb-on-surface">{value}</p>
      <p className="text-[11px] text-sb-on-surface-variant/45 mt-0.5">{label}</p>
    </motion.div>
  )
}

export default function AsistenciaPage() {
  const [tab, setTab] = React.useState<Tab>("personal")

  return (
    <div className="space-y-6">
      <MiniHeader
        eyebrow="Control de asistencia"
        title="Asistencia"
        subtitle="Registra tu marcación y la asistencia de tus alumnos"
      />

      <SbTabs
        tabs={[
          { id: "personal", label: "Mi Asistencia" },
          { id: "alumnos", label: "Asistencia de Alumnos" },
        ]}
        activeTab={tab}
        onTabChange={(id) => setTab(id as Tab)}
      />

      <AnimatePresence mode="wait">
        {tab === "personal" ? <MiAsistencia key="personal" /> : <AsistenciaAlumnos key="alumnos" />}
      </AnimatePresence>
    </div>
  )
}

function MiAsistencia() {
  const [attendance, setAttendance] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [history, setHistory] = React.useState<any[]>([])
  const today = new Date().toISOString().split("T")[0]

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
        setHistory(histRes.records || [])
      } catch {} finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  const handleCheck = async (action: "check-in" | "check-out") => {
    setActionLoading(true)
    try {
      const res = await fetch("/api/docente/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (data.success) setAttendance(data.attendance)
    } catch {} finally { setActionLoading(false) }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="animate-pulse grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl bg-sb-surface-container" />)}
        </div>
        <div className="animate-pulse h-24 rounded-2xl bg-sb-surface-container" />
      </div>
    )
  }

  const checkedIn = attendance?.check_in
  const checkedOut = attendance?.check_out
  const s = attendance?.status ? statusConfig[attendance.status] : null
  const weekDays = getWeekDays(history)

  const formattedToday = new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
      {/* Jornada hero */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl bg-sb-surface border border-sb-outline-variant/10"
      >
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-sb-primary/5 blur-3xl" />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-sb-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sb-on-surface-variant/60">
              {formattedToday}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight text-sb-on-surface capitalize">
                {s ? s.label : "Tu jornada de hoy"}
              </h2>
              <p className="text-sm text-sb-on-surface-variant/50 mt-1.5">
                {!checkedIn
                  ? "Aún no has marcado tu entrada. Comienza tu jornada laboral."
                  : !checkedOut
                    ? `Entrada registrada a las ${checkedIn.slice(0, 5)}. No olvides marcar tu salida.`
                    : `Jornada completada: ${checkedIn.slice(0, 5)} → ${checkedOut.slice(0, 5)}. ¡Buen trabajo!`}
              </p>
            </div>

            <div className="flex gap-3">
              {!checkedIn && (
                <button onClick={() => handleCheck("check-in")} disabled={actionLoading}
                  className="h-14 px-7 rounded-2xl bg-emerald-500 text-white text-sm font-semibold flex items-center gap-3 hover:bg-emerald-400 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/25 active:scale-[0.98]">
                  {actionLoading ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <LogIn className="h-5 w-5" />}
                  Marcar Entrada
                </button>
              )}
              {checkedIn && !checkedOut && (
                <button onClick={() => handleCheck("check-out")} disabled={actionLoading}
                  className="h-14 px-7 rounded-2xl bg-amber-500 text-white text-sm font-semibold flex items-center gap-3 hover:bg-amber-400 transition-all disabled:opacity-50 shadow-lg shadow-amber-500/25 active:scale-[0.98]">
                  {actionLoading ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <LogOut className="h-5 w-5" />}
                  Marcar Salida
                </button>
              )}
              {checkedIn && checkedOut && (
                <div className="h-14 px-7 rounded-2xl bg-emerald-500/10 text-emerald-600 text-sm font-semibold flex items-center gap-3">
                  <Check className="h-5 w-5" />
                  Jornada completada
                </div>
              )}
            </div>
          </div>

          {/* Jornada timeline */}
          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-sb-surface-container-low p-4">
              <div className="flex items-center gap-2 mb-1">
                <LogIn className={`h-3.5 w-3.5 ${checkedIn ? "text-emerald-500" : "text-sb-on-surface-variant/30"}`} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-sb-on-surface-variant/45">Entrada</span>
              </div>
              <p className={`text-xl font-bold tracking-tight ${checkedIn ? "text-sb-on-surface" : "text-sb-on-surface-variant/30"}`}>
                {checkedIn?.slice(0, 5) || "--:--"}
              </p>
            </div>
            <div className="rounded-2xl bg-sb-surface-container-low p-4">
              <div className="flex items-center gap-2 mb-1">
                <LogOut className={`h-3.5 w-3.5 ${checkedOut ? "text-amber-500" : "text-sb-on-surface-variant/30"}`} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-sb-on-surface-variant/45">Salida</span>
              </div>
              <p className={`text-xl font-bold tracking-tight ${checkedOut ? "text-sb-on-surface" : "text-sb-on-surface-variant/30"}`}>
                {checkedOut?.slice(0, 5) || "--:--"}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Weekly overview */}
      <div className="bg-sb-surface rounded-2xl p-5 border border-sb-outline-variant/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-sb-primary" />
            <p className="text-sm font-semibold text-sb-on-surface">Últimos 7 días</p>
          </div>
          <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-sb-surface-container-high text-sb-on-surface-variant/50">
            {history.length} registros
          </span>
        </div>
        <div className="flex items-end justify-between gap-2">
          {weekDays.map((d) => {
            const bar = getBarConfig(d.status)
            const today = new Date().toISOString().slice(0, 10) === d.iso
            return (
              <div key={d.iso} className="flex-1 flex flex-col items-center gap-2">
                <div className="h-20 w-full max-w-[34px] rounded-xl bg-sb-surface-container-low flex items-end overflow-hidden">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "100%" }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className={`w-full ${bar.color} ${bar.h}`}
                  />
                </div>
                <div className="flex flex-col items-center">
                  <span className={`text-[9px] font-semibold uppercase ${today ? "text-sb-primary" : "text-sb-on-surface-variant/35"}`}>{d.label}</span>
                  <span className={`text-[10px] font-medium ${today ? "text-sb-on-surface" : "text-sb-on-surface-variant/50"}`}>{d.day}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Status pill */}
      {s && (
        <div className="flex justify-center">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${s.bg} ${s.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {s.label}
          </span>
        </div>
      )}

      {/* History */}
      <div className="bg-sb-surface rounded-2xl overflow-hidden border border-sb-outline-variant/10">
        <div className="px-5 pt-5 pb-3">
          <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">Historial reciente</p>
        </div>
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.03 } } }} className="space-y-px">
          {history.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Calendar className="h-8 w-8 mx-auto text-sb-on-surface-variant/15 mb-2" />
              <p className="text-sm text-sb-on-surface-variant/30">Aún no tienes registros de asistencia</p>
            </div>
          ) : history.slice(0, 10).map((h: any) => {
            const sc = statusConfig[h.status] || statusConfig.present
            return (
              <motion.div key={h.id} variants={listItem} className="flex items-center justify-between px-5 py-3 hover:bg-sb-surface-container-low/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-sb-surface-container flex items-center justify-center">
                    <Calendar className="h-3.5 w-3.5 text-sb-on-surface-variant/30" />
                  </div>
                  <span className="text-sm text-sb-on-surface capitalize">
                    {new Date(h.date + "T00:00:00").toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "short" })}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-sb-on-surface-variant/50">Ent: {h.check_in ? h.check_in.slice(0, 5) : '--'}</span>
                  <span className="text-xs text-sb-on-surface-variant/50">Sal: {h.check_out ? h.check_out.slice(0, 5) : '--'}</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                    <span className={`h-1 w-1 rounded-full ${sc.dot}`} />
                    {sc.label}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </motion.div>
  )
}

function AsistenciaAlumnos() {
  const [courses, setCourses] = React.useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = React.useState("")
  const [date, setDate] = React.useState(new Date().toISOString().split("T")[0])
  const [students, setStudents] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [loaded, setLoaded] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

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
      if (res.ok) setLoaded(false)
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
    { status: "present", label: "P", title: "Presente", activeClass: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25", inactiveClass: "bg-sb-surface-container text-sb-on-surface-variant/30 hover:text-emerald-500" },
    { status: "late", label: "T", title: "Tardanza", activeClass: "bg-amber-500 text-white shadow-lg shadow-amber-500/25", inactiveClass: "bg-sb-surface-container text-sb-on-surface-variant/30 hover:text-amber-500" },
    { status: "absent", label: "F", title: "Falta", activeClass: "bg-red-500 text-white shadow-lg shadow-red-500/25", inactiveClass: "bg-sb-surface-container text-sb-on-surface-variant/30 hover:text-red-500" },
    { status: "justified", label: "J", title: "Justificado", activeClass: "bg-blue-500 text-white shadow-lg shadow-blue-500/25", inactiveClass: "bg-sb-surface-container text-sb-on-surface-variant/30 hover:text-blue-500" },
  ]

  const summary = [
    { label: "Presentes", value: counts.present, color: "text-emerald-600", bg: "bg-emerald-500/8", icon: UserCheck },
    { label: "Tardanzas", value: counts.late, color: "text-amber-600", bg: "bg-amber-500/8", icon: Clock },
    { label: "Faltas", value: counts.absent, color: "text-red-500", bg: "bg-red-500/8", icon: XCircle },
    { label: "Justificados", value: counts.justified, color: "text-blue-600", bg: "bg-blue-500/8", icon: Check },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
      {/* Selector hero */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl bg-sb-surface border border-sb-outline-variant/10"
      >
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-sb-primary/5 blur-3xl" />
        <div className="relative p-6 sm:p-7">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-sb-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sb-on-surface-variant/60">
              Registro de alumnos
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-sb-on-surface">
            Toma asistencia por curso
          </h2>
          <p className="text-sm text-sb-on-surface-variant/50 mt-1 max-w-lg">
            Selecciona el curso y la fecha, luego marca el estado de cada alumno.
          </p>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-sb-on-surface-variant/60">Curso</p>
              <div className="relative">
                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/40 pointer-events-none" />
                <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
                  className="w-full h-12 pl-10 pr-9 rounded-2xl bg-sb-surface-container-low border border-sb-outline-variant/15 text-sm text-sb-on-surface outline-none appearance-none transition-all hover:border-sb-on-surface/30 focus:border-sb-primary focus:ring-4 focus:ring-sb-primary/10">
                  <option value="">Seleccionar curso</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name} · {c.grade} {c.section}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/30 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-sb-on-surface-variant/60">Fecha</p>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/40 pointer-events-none" />
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full h-12 pl-10 pr-3 rounded-2xl bg-sb-surface-container-low border border-sb-outline-variant/15 text-sm text-sb-on-surface outline-none transition-all hover:border-sb-on-surface/30 focus:border-sb-primary focus:ring-4 focus:ring-sb-primary/10 [color-scheme:light]" />
              </div>
            </div>

            <div className="flex items-end">
              <button onClick={handleCargar} disabled={loading || !selectedCourse}
                className="w-full h-12 px-5 rounded-2xl bg-sb-on-surface text-sb-surface text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-30 hover:bg-sb-on-surface/90 transition-all active:scale-[0.98]">
                {loading ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Search className="h-4 w-4" />}
                Cargar alumnos
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {loaded && students.length > 0 && (
        <>
          {/* Summary */}
          <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {summary.map(s => {
              const Icon = s.icon
              return (
                <motion.div key={s.label} variants={staggerItem} className="bg-sb-surface rounded-2xl p-4 border border-sb-outline-variant/10">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-2.5 ${s.bg}`}>
                    <Icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <p className="text-xl font-bold tracking-tight text-sb-on-surface">{s.value}</p>
                  <p className="text-[11px] text-sb-on-surface-variant/45">{s.label}</p>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Progress */}
          <div className="bg-sb-surface rounded-2xl p-5 border border-sb-outline-variant/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-sb-on-surface">{selected?.name || "Curso"}</p>
              <span className="text-xs text-sb-on-surface-variant/50">{marked}/{students.length} marcados</span>
            </div>
            <div className="h-2 rounded-full bg-sb-surface-container overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${students.length ? (marked / students.length) * 100 : 0}%` }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="h-full bg-sb-primary rounded-full"
              />
            </div>
            <p className="text-[11px] text-sb-on-surface-variant/40 mt-2">{selected?.grade} · Sección {selected?.section}</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/30" />
            <input placeholder="Buscar alumno..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-10 pr-3 rounded-2xl bg-sb-surface border border-sb-outline-variant/15 text-sm text-sb-on-surface outline-none transition-all focus:border-sb-primary focus:ring-4 focus:ring-sb-primary/10 placeholder:text-sb-on-surface-variant/35" />
          </div>

          {/* Student list */}
          <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.03 } } }} className="bg-sb-surface rounded-2xl overflow-hidden border border-sb-outline-variant/10">
            <div className="space-y-px">
              {filtered.map((s, i) => (
                <motion.div key={s.id} variants={listItem}
                  className="flex items-center justify-between px-4 py-3 hover:bg-sb-surface-container-low/50 transition-colors border-b border-sb-outline-variant/10 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-9 w-9 rounded-xl ${getAvatarColor(`${s.nombres} ${s.apellidos}`)} flex items-center justify-center shrink-0`}>
                      <span className="text-white text-[10px] font-bold">{(s.nombres?.[0] || '') + (s.apellidos?.[0] || '')}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-sb-on-surface truncate">{s.apellidos}, {s.nombres}</p>
                      <p className="text-[10px] text-sb-on-surface-variant/35">DNI: {s.dni}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {statusChips.map(chip => (
                      <button key={chip.status} onClick={() => handleStatusClick(s.id, chip.status)} title={chip.title}
                        className={`h-8 w-8 rounded-xl text-[11px] font-bold transition-all active:scale-90 ${s.status === chip.status ? chip.activeClass : chip.inactiveClass}`}>
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Save */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <button onClick={handleGuardar} disabled={saving || students.every(s => s.status === null)}
              className="w-full h-13 py-3.5 rounded-2xl text-sm font-semibold bg-sb-on-surface text-sb-surface hover:bg-sb-on-surface/90 active:bg-sb-on-surface/95 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {saving ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Check className="h-4 w-4" />}
              Guardar asistencia
            </button>
          </motion.div>
        </>
      )}

      {loaded && students.length === 0 && (
        <div className="bg-sb-surface rounded-2xl py-14 text-center border border-sb-outline-variant/10">
          <div className="h-14 w-14 rounded-2xl bg-sb-surface-container flex items-center justify-center mx-auto mb-3">
            <UserX className="h-6 w-6 text-sb-on-surface-variant/25" />
          </div>
          <p className="text-sm font-medium text-sb-on-surface-variant/50">No hay alumnos en este curso</p>
          <p className="text-xs text-sb-on-surface-variant/30 mt-1">Verifica que el curso tenga alumnos matriculados</p>
        </div>
      )}

      {!loaded && courses.length === 0 && (
        <div className="bg-sb-surface rounded-2xl py-14 text-center border border-sb-outline-variant/10">
          <div className="h-14 w-14 rounded-2xl bg-sb-surface-container flex items-center justify-center mx-auto mb-3">
            <Sparkles className="h-6 w-6 text-sb-on-surface-variant/25" />
          </div>
          <p className="text-sm font-medium text-sb-on-surface-variant/50">Sin cursos asignados</p>
        </div>
      )}
    </motion.div>
  )
}
