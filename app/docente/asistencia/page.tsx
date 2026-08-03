"use client"

import * as React from "react"
import { Clock, LogIn, LogOut, Check, UserCheck, UserX, Search, XCircle, Calendar } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type Tab = "personal" | "alumnos"
type StudentStatus = "present" | "late" | "absent" | "justified" | null

const staggerItem = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }

export default function AsistenciaPage() {
  const [tab, setTab] = React.useState<Tab>("personal")
  const tabs: { key: Tab; label: string }[] = [
    { key: "personal", label: "Mi Asistencia" },
    { key: "alumnos", label: "Asistencia de Alumnos" },
  ]

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Asistencia</h1>
        <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">Control de asistencia personal y de alumnos</p>
      </motion.div>

      <div className="flex gap-1 p-1 bg-sb-surface rounded-2xl w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.key ? "bg-sb-on-surface text-sb-surface" : "text-sb-on-surface-variant/60 hover:text-sb-on-surface-variant"}`}>
            {t.label}
          </button>
        ))}
      </div>

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

  const fetchData = async () => {
    setLoading(true)
    try {
      const [attRes, histRes] = await Promise.all([
        fetch(`/api/docente/attendance?date=${today}`).then(r => r.json()),
        fetch(`/api/docente/attendance-history`).then(r => r.json()).catch(() => ({ records: [] })),
      ])
      setAttendance(attRes.attendance)
      setHistory(histRes.records || [])
    } catch {} finally { setLoading(false) }
  }

  React.useEffect(() => { fetchData() }, [])

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
          {[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl bg-sb-surface-container" />)}
        </div>
      </div>
    )
  }

  const checkedIn = attendance?.check_in
  const checkedOut = attendance?.check_out

  const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    present: { label: "A tiempo", color: "text-emerald-600", bg: "bg-emerald-500/10", dot: "bg-emerald-500" },
    late: { label: "Tardanza", color: "text-amber-600", bg: "bg-amber-500/10", dot: "bg-amber-500" },
    absent: { label: "Ausente", color: "text-red-500", bg: "bg-red-500/10", dot: "bg-red-500" },
    justified: { label: "Justificado", color: "text-blue-600", bg: "bg-blue-500/10", dot: "bg-blue-500" },
  }
  const s = attendance?.status ? statusConfig[attendance.status] : null

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
      {/* Summary cards */}
      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-3 gap-3">
        {[
          { label: "Fecha", value: today, icon: Calendar, color: "text-sb-on-surface", bg: "bg-sb-on-surface/8" },
          { label: "Entrada", value: checkedIn || "--:--", icon: LogIn, color: checkedIn ? "text-emerald-600" : "text-sb-on-surface-variant/30", bg: checkedIn ? "bg-emerald-500/8" : "bg-sb-surface-container" },
          { label: "Salida", value: checkedOut || "--:--", icon: LogOut, color: checkedOut ? "text-amber-600" : "text-sb-on-surface-variant/30", bg: checkedOut ? "bg-amber-500/8" : "bg-sb-surface-container" },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <motion.div key={stat.label} variants={staggerItem} className="bg-sb-surface rounded-2xl p-4 flex flex-col items-center text-center">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-2 ${stat.bg}`}>
                <Icon className={`h-4.5 w-4.5 ${stat.color}`} />
              </div>
              <p className="text-sm font-semibold text-sb-on-surface">{stat.value}</p>
              <p className="text-[10px] text-sb-on-surface-variant/45 mt-0.5">{stat.label}</p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Status badge */}
      {s && (
        <div className="flex justify-center">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${s.bg} ${s.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {s.label}
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-center gap-4">
        {!checkedIn && (
          <button onClick={() => handleCheck("check-in")} disabled={actionLoading}
            className="h-14 px-8 rounded-2xl bg-emerald-500 text-white text-sm font-medium flex items-center gap-3 hover:bg-emerald-400 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20">
            {actionLoading ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <LogIn className="h-5 w-5" />}
            Marcar Entrada
          </button>
        )}
        {checkedIn && !checkedOut && (
          <button onClick={() => handleCheck("check-out")} disabled={actionLoading}
            className="h-14 px-8 rounded-2xl bg-amber-500 text-white text-sm font-medium flex items-center gap-3 hover:bg-amber-400 transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20">
            {actionLoading ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <LogOut className="h-5 w-5" />}
            Marcar Salida
          </button>
        )}
        {checkedIn && checkedOut && (
          <div className="h-14 px-8 rounded-2xl bg-emerald-500/10 text-emerald-600 text-sm font-medium flex items-center gap-3">
            <Check className="h-5 w-5" />
            Jornada completada
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-sb-surface rounded-2xl overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">Historial reciente</p>
          </div>
          <div className="space-y-px">
            {history.slice(0, 10).map((h: any) => {
              const sc = statusConfig[h.status] || statusConfig.present
              return (
                <div key={h.id} className="flex items-center justify-between px-5 py-3 hover:bg-sb-surface-container-low/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-3.5 w-3.5 text-sb-on-surface-variant/30" />
                    <span className="text-sm text-sb-on-surface">{h.date}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-sb-on-surface-variant/50">{h.check_in ? `Ent: ${h.check_in.slice(0, 5)}` : '--'}</span>
                    <span className="text-xs text-sb-on-surface-variant/50">{h.check_out ? `Sal: ${h.check_out.slice(0, 5)}` : '--'}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                      <span className={`h-1 w-1 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
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
      await fetch("/api/docente/student-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: selectedCourse, date, records }),
      })
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

  const statusChips: { status: StudentStatus; label: string; activeClass: string; inactiveClass: string }[] = [
    { status: "present", label: "P", activeClass: "bg-emerald-500 text-white", inactiveClass: "bg-sb-surface-container text-sb-on-surface-variant/30" },
    { status: "late", label: "T", activeClass: "bg-amber-500 text-white", inactiveClass: "bg-sb-surface-container text-sb-on-surface-variant/30" },
    { status: "absent", label: "F", activeClass: "bg-red-500 text-white", inactiveClass: "bg-sb-surface-container text-sb-on-surface-variant/30" },
    { status: "justified", label: "J", activeClass: "bg-blue-500 text-white", inactiveClass: "bg-sb-surface-container text-sb-on-surface-variant/30" },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
      {/* Course/Date selector */}
      <div className="bg-sb-surface rounded-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-sb-primary" />
            <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">Seleccionar curso y fecha</p>
          </div>
        </div>
        <div className="px-5 pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-sb-on-surface-variant/60">Curso</p>
              <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
                className="sbf-native-select w-full">
                <option value="">Seleccionar curso</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name} - {c.grade} {c.section}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-sb-on-surface-variant/60">Fecha</p>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="sb-input rounded-xl text-sm h-10 w-full" />
            </div>
            <button onClick={handleCargar} disabled={loading || !selectedCourse}
              className="h-10 px-4 rounded-xl bg-sb-on-surface text-sb-surface text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-30 hover:bg-sb-on-surface/90 transition-colors">
              {loading ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Search className="h-4 w-4" />}
              Cargar alumnos
            </button>
          </div>
        </div>
      </div>

      {loaded && students.length > 0 && (
        <>
          {/* Summary */}
          <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-4 gap-3">
            {[
              { label: "Presentes", value: counts.present, color: "text-emerald-600", bg: "bg-emerald-500/8", icon: UserCheck },
              { label: "Tardanzas", value: counts.late, color: "text-amber-600", bg: "bg-amber-500/8", icon: Clock },
              { label: "Faltas", value: counts.absent, color: "text-red-500", bg: "bg-red-500/8", icon: XCircle },
              { label: "Justificados", value: counts.justified, color: "text-blue-600", bg: "bg-blue-500/8", icon: Check },
            ].map(s => {
              const Icon = s.icon
              return (
                <motion.div key={s.label} variants={staggerItem} className="bg-sb-surface rounded-2xl p-3 text-center">
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center mx-auto mb-1.5 ${s.bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${s.color}`} />
                  </div>
                  <p className="text-lg font-bold text-sb-on-surface">{s.value}</p>
                  <p className="text-[10px] text-sb-on-surface-variant/45">{s.label}</p>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/30" />
            <input placeholder="Buscar alumno..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="sb-input rounded-xl text-sm h-10 w-full pl-10" />
          </div>

          {/* Student list */}
          <div className="bg-sb-surface rounded-2xl overflow-hidden">
            <div className="space-y-px">
              {filtered.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="flex items-center justify-between px-4 py-3 hover:bg-sb-surface-container-low/50 transition-colors border-b border-sb-outline-variant/10 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-xl bg-sb-surface-container flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-medium text-sb-on-surface-variant/60">
                        {(s.nombres?.[0] || '') + (s.apellidos?.[0] || '')}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-sb-on-surface truncate">{s.apellidos}, {s.nombres}</p>
                      <p className="text-[10px] text-sb-on-surface-variant/35">DNI: {s.dni}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {statusChips.map(chip => (
                      <button key={chip.status} onClick={() => handleStatusClick(s.id, chip.status)}
                        className={`h-7 w-7 rounded-lg text-[10px] font-semibold transition-all ${s.status === chip.status ? chip.activeClass : chip.inactiveClass}`}>
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Save button */}
          <button onClick={handleGuardar} disabled={saving || students.every(s => s.status === null)}
            className="w-full h-12 rounded-xl text-sm font-semibold bg-sb-on-surface text-sb-surface hover:bg-sb-on-surface/90 active:bg-sb-on-surface/95 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {saving ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : "Guardar asistencia"}
          </button>
        </>
      )}

      {loaded && students.length === 0 && (
        <div className="bg-sb-surface rounded-2xl py-12 text-center">
          <UserCheck className="h-10 w-10 mx-auto text-sb-on-surface-variant/15 mb-3" />
          <p className="text-sm text-sb-on-surface-variant/30">No hay alumnos en este curso</p>
        </div>
      )}
    </motion.div>
  )
}
