"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Plus, BookMarked, TrendingUp, TrendingDown, Pencil, Trash2, BarChart3, Sun, Moon } from "@/components/ui/proicons"
import NotificationBell from "@/components/layout/notification-bell"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { SbBtn, SbModal, SbModalHeader, SbModalBody, SbModalFooter } from "@/components/ui/sb"
import { useAuthStore } from "@/stores/auth-store"
import { useTheme } from "next-themes"

interface Grade {
  id: string
  student_id: string
  course_id: string
  period: string
  score: number
  max_score: number
  notes: string | null
  created_at: string
}

interface Student {
  id: string
  code: string
  first_name: string
  last_name: string
  document_number: string
  grade: string
  section: string
  grades: Grade[]
}

interface Course {
  id: string
  name: string
  code: string
  grade: string
  section: string
}

const PERIODS = ["Bimestre 1", "Bimestre 2", "Bimestre 3", "Bimestre 4"]
const MAX_SCORE = 20
const FONT = "var(--app-main-font, 'DM Sans'), sans-serif"

function getInitials(name: string) { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) }

function getAvatarColor(_name: string) {
  return "bg-foreground/10"
}

function getGradeColor(g: number) { return g >= 18 ? "font-bold" : g >= 11 ? "" : "opacity-60" }
function getGradeBg(g: number) { return g >= 18 ? "bg-foreground/10" : g >= 11 ? "bg-foreground/5" : "bg-foreground/10" }
function getGradeBarColor(g: number) { return g >= 18 ? "bg-foreground" : g >= 11 ? "bg-muted-foreground" : "bg-muted-foreground" }

function calcAverage(grades: Grade[]) {
  if (grades.length === 0) return 0
  const sum = grades.reduce((a, g) => a + Number(g.score), 0)
  return Number((sum / grades.length).toFixed(1))
}

function studentName(s: Student) { return `${s.first_name} ${s.last_name}` }

export default function CalificacionesPage() {
  return (
    <React.Suspense fallback={null}>
      <CalificacionesInner />
    </React.Suspense>
  )
}

function CalificacionesInner() {
  const searchParams = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const { theme, setTheme } = useTheme()
  const prefilterCourse = searchParams.get("curso") || ""
  const [courses, setCourses] = React.useState<Course[]>([])
  const [courseId, setCourseId] = React.useState(prefilterCourse)
  const [students, setStudents] = React.useState<Student[]>([])
  const [courseLabel, setCourseLabel] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [detailOpen, setDetailOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<Student | null>(null)
  const [editGradeId, setEditGradeId] = React.useState<string | null>(null)
  const [editScore, setEditScore] = React.useState("")
  const [newPeriod, setNewPeriod] = React.useState("")
  const [newScore, setNewScore] = React.useState("")
  const [newNotes, setNewNotes] = React.useState("")

  const [registerOpen, setRegisterOpen] = React.useState(false)
  const [registerCourseId, setRegisterCourseId] = React.useState("")
  const [registerStudentId, setRegisterStudentId] = React.useState("")
  const [registerPeriod, setRegisterPeriod] = React.useState("")
  const [registerScore, setRegisterScore] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<"lista" | "tabla">("lista")
  const [savingCell, setSavingCell] = React.useState<string | null>(null)
  const [saveError, setSaveError] = React.useState<string | null>(null)
  const [registerStudents, setRegisterStudents] = React.useState<Student[]>([])

  const loadCourses = React.useCallback(async () => {
    try {
      const res = await fetch("/api/docente/calificaciones")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al cargar")
      setCourses(Array.isArray(data.courses) ? data.courses : [])
      if (Array.isArray(data.courses) && data.courses.length > 0) {
        setCourseId(prev => prev && data.courses.some((c: Course) => c.id === prev) ? prev : data.courses[0].id)
        setRegisterCourseId(prev => prev && data.courses.some((c: Course) => c.id === prev) ? prev : data.courses[0].id)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCourseData = React.useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/docente/calificaciones?course_id=${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al cargar")
      setStudents(Array.isArray(data.students) ? data.students : [])
      if (data.course) {
        setCourseLabel(`${data.course.name} · ${data.course.grade} "${data.course.section}"`)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { ;(async () => { await loadCourses() })() }, [loadCourses])
  React.useEffect(() => { if (courseId) { ;(async () => { await loadCourseData(courseId) })() } }, [courseId, loadCourseData])

  React.useEffect(() => {
    if (!registerCourseId || !registerOpen) { setRegisterStudents([]); return }
    if (registerCourseId === courseId) { setRegisterStudents(students); return }
    ;(async () => {
      try {
        const res = await fetch(`/api/docente/calificaciones?course_id=${registerCourseId}`)
        const data = await res.json()
        setRegisterStudents(Array.isArray(data.students) ? data.students : [])
      } catch { setRegisterStudents([]) }
    })()
  }, [registerCourseId, registerOpen, courseId, students])

  const handleSaveGrade = async (studentId: string, gradeId: string, newScore: number) => {
    try {
      const target = selected?.grades.find(g => g.id === gradeId)
      if (!target) return
      await fetch("/api/docente/calificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, course_id: target.course_id, period: target.period, score: newScore, max_score: MAX_SCORE }),
      })
      setStudents(prev => prev.map(s => s.id !== studentId ? s : { ...s, grades: s.grades.map(g => g.id !== gradeId ? g : { ...g, score: newScore }) }))
      setSelected(prev => prev ? { ...prev, grades: prev.grades.map(g => g.id !== gradeId ? g : { ...g, score: newScore }) } : null)
      if (courseId) loadCourseData(courseId)
    } catch {}
    setEditGradeId(null); setEditScore("")
  }

  const handleDeleteGrade = async (gradeId: string) => {
    try {
      await fetch(`/api/docente/calificaciones?id=${gradeId}`, { method: "DELETE" })
      setStudents(prev => prev.map(s => ({ ...s, grades: s.grades.filter(g => g.id !== gradeId) })))
      setSelected(prev => prev ? { ...prev, grades: prev.grades.filter(g => g.id !== gradeId) } : null)
      if (courseId) loadCourseData(courseId)
    } catch {}
  }

  const handleAddGrade = async (studentId: string) => {
    if (!newPeriod || !newScore) return
    const res = await fetch("/api/docente/calificaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: studentId, course_id: courseId, period: newPeriod, score: Number(newScore), max_score: MAX_SCORE, notes: newNotes || null }),
    })
    const data = await res.json()
    if (data.success && data.id) {
      const newGrade = { id: data.id, student_id: studentId, course_id: courseId, period: newPeriod, score: Number(newScore), max_score: MAX_SCORE, notes: newNotes || null, created_at: new Date().toISOString() }
      setStudents(prev => prev.map(s => s.id !== studentId ? s : { ...s, grades: [...s.grades, newGrade] }))
      setSelected(prev => prev ? { ...prev, grades: [...prev.grades, newGrade] } : null)
    }
    setNewPeriod(""); setNewScore(""); setNewNotes("")
    if (courseId) loadCourseData(courseId)
  }

  const handleRegister = async () => {
    if (!registerStudentId || !registerScore || !registerPeriod) return
    setSaving(true)
    try {
      await fetch("/api/docente/calificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: registerStudentId, course_id: registerCourseId, period: registerPeriod, score: Number(registerScore), max_score: MAX_SCORE }),
      })
      setRegisterOpen(false)
      setRegisterStudentId(""); setRegisterPeriod(""); setRegisterScore("")
      if (registerCourseId === courseId) loadCourseData(courseId)
      else { setCourseId(registerCourseId); setRegisterCourseId(registerCourseId) }
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCell = async (studentId: string, period: string, rawValue: string) => {
    const value = Number(rawValue)
    if (rawValue === "" || isNaN(value) || value < 0 || value > MAX_SCORE) return
    const cellKey = `${studentId}:${period}`
    setSavingCell(cellKey)
    setSaveError(null)
    try {
      const res = await fetch("/api/docente/calificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, course_id: courseId, period, score: value, max_score: MAX_SCORE }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al guardar")
      loadCourseData(courseId)
    } catch (e: any) {
      setSaveError(e.message)
    } finally {
      setSavingCell(null)
    }
  }

  const getTrend = (grades: Grade[]) => {
    if (grades.length < 2) return true
    const sorted = [...grades].sort((a, b) => a.period.localeCompare(b.period))
    return sorted[sorted.length - 1].score >= sorted[sorted.length - 2].score
  }

  const averages = students.map(s => calcAverage(s.grades))
  const avgGeneral = averages.length ? (averages.reduce((a, b) => a + b, 0) / averages.length) : 0
  const bestScore = students.length ? Math.max(...students.map(s => s.grades.length ? Math.max(...s.grades.map(g => g.score)) : 0)) : 0



  return (
    <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-white dark:bg-[#1a1a1c] sb-note">
      <div className="p-5 md:p-8 pb-24 md:pb-8 space-y-5">
        {/* Header */}
        <header className="mb-4">
          <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[14px] font-medium mb-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Panel Docente</p>
            <h1 className="text-[36px] md:text-[48px] font-bold leading-tight" style={{ color: "var(--note-text)", fontFamily: FONT }}>
              Calificaciones
            </h1>
            <p className="text-[13px] mt-2" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
              Gestiona las notas de tus alumnos
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5">
                <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ background: "var(--note-fill-strong)" }}>
                  <span className="text-[9px] font-semibold" style={{ color: "var(--note-text)" }}>
                    {user.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "D"}
                  </span>
                </div>
                <span className="text-sm md:text-base font-medium whitespace-nowrap" style={{ color: "var(--note-text)", fontFamily: FONT }}>
                  {user.full_name}
                </span>
              </div>
            )}
            <NotificationBell />
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Cambiar tema" title="Cambiar tema" className="h-10 w-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity relative">
              <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" style={{ color: "var(--note-text)" }} />
              <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" style={{ color: "var(--note-text)" }} />
            </button>
          </div>
          </div>

          {/* Controls - Mobile responsive */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-4">
            <div className="sm:w-56">
              <select
                value={courseId}
                onChange={e => setCourseId(e.target.value)}
                disabled={loading}
                className="w-full h-10 px-3 text-[13px] font-medium rounded-xl transition-all"
                style={{ border: `1.5px solid ${courseId ? "var(--note-text)" : "var(--note-hairline)"}`, background: courseId ? "var(--note-fill)" : "transparent", color: courseId ? "var(--note-text)" : "var(--note-muted)", fontFamily: FONT }}
              >
                {courses.length === 0 && <option value="">Sin cursos asignados</option>}
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name} · {c.grade} &quot;{c.section}&quot;</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              {students.length > 0 && (
                <div className="flex items-center gap-1 p-1 rounded-full" style={{ background: "var(--note-fill)" }}>
                  {([["lista", "Lista"], ["tabla", "Notas"]] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setViewMode(key)}
                      className="h-9 px-4 text-[13px] font-semibold flex items-center justify-center rounded-full transition-all duration-200"
                      style={{
                        background: viewMode === key ? "var(--note-text)" : "transparent",
                        color: viewMode === key ? "var(--note-surface)" : "var(--note-muted)",
                        fontFamily: FONT
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <button className="h-10 px-5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-all disabled:opacity-30 hover:opacity-90 active:scale-[0.97]" style={{ background: "var(--note-text)", color: "var(--note-surface)", fontFamily: FONT }} onClick={() => setRegisterOpen(true)} disabled={!courses.length}>
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Registrar</span>
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-28" style={{ background: "var(--note-fill)", borderRadius: "16px" }} />
              ))}
            </div>
            <div className="h-64 animate-pulse" style={{ background: "var(--note-fill)", borderRadius: "16px" }} />
          </div>
        ) : students.length === 0 ? (
          <div
            className="py-16 text-center"
            style={{
              background: "var(--note-surface)",
              borderRadius: "24px",
              border: "1px solid var(--note-hairline)"
            }}
          >
            <BookMarked
              className="h-10 w-10 mx-auto mb-3"
              style={{ color: "var(--note-muted)", opacity: 0.3 }}
            />
            <p className="text-xs font-medium" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
              {courseLabel ? "Sin alumnos matriculados en este curso" : "Selecciona un curso para ver calificaciones"}
            </p>
          </div>
        ) : viewMode === "tabla" ? (
          <TablaNotas
            key={courseId}
            students={students}
            courseId={courseId}
            maxScore={MAX_SCORE}
            savingCell={savingCell}
            saveError={saveError}
            onSaveCell={handleSaveCell}
          />
        ) : (
          <>
            {/* Stats */}
            <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: "Promedio", value: avgGeneral.toFixed(1), icon: BarChart3 },
                { label: "Mejor Nota", value: bestScore, icon: TrendingUp },
                { label: "Alumnos", value: students.length, icon: BookMarked },
              ].map(s => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="p-3 sm:p-4"
                  style={{
                    background: "var(--note-surface)",
                    borderRadius: "16px",
                    border: "1px solid var(--note-hairline)"
                  }}
                >
                  <div className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center mb-2" style={{ borderRadius: "10px", background: "var(--note-fill)" }}>
                    <s.icon className="h-4 w-4" style={{ color: "var(--note-muted)" }} />
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.8px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
                    {s.label}
                  </p>
                  <p className="mt-1 text-base sm:text-lg font-bold leading-none" style={{ color: "var(--note-text)", fontFamily: FONT }}>
                    {s.value}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* Student list */}
            <div
              className="overflow-hidden"
              style={{
                background: "var(--note-surface)",
                borderRadius: "24px",
                border: "1px solid var(--note-hairline)"
              }}
            >
              <AnimatePresence>
                {students.map((s, i) => {
                  const avg = calcAverage(s.grades)
                  const trend = getTrend(s.grades)
                  return (
                    <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25, delay: i * 0.03 }}
                      onClick={() => { setSelected(s); setEditGradeId(null); setNewPeriod(""); setNewScore(""); setNewNotes(""); setDetailOpen(true) }}
                      className="flex items-center justify-between px-3 sm:px-4 py-3 transition-colors cursor-pointer group"
                      style={{ borderBottom: i < students.length - 1 ? "1px solid var(--note-hairline)" : "none" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--note-fill)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--note-fill-strong)" }}>
                          <span className="text-[9px] sm:text-[10px] font-bold" style={{ color: "var(--note-text)" }}>{getInitials(studentName(s))}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--note-text)", fontFamily: FONT }}>{studentName(s)}</p>
                          <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                            <span className="text-[9px] sm:text-[10px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{s.grades.length} notas</span>
                            {s.grades.slice(-3).map((g, j) => (
                              <span key={j} className={`text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded-xl ${getGradeBg(g.score)} ${getGradeColor(g.score)}`}>{g.score}</span>
                            ))}
                            {s.grades.length > 3 && <span className="text-[9px] sm:text-[10px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>+{s.grades.length - 3}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {trend ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> : <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
                        <span className={`text-base sm:text-lg font-bold ${avg === 0 ? "opacity-40" : getGradeColor(avg)}`} style={{ color: "var(--note-text)" }}>{avg === 0 ? "—" : avg}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* ===== DETAIL MODAL ===== */}
        <SbModal open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="560px">
          {selected && (
            <>
              <SbModalHeader title="" onClose={() => setDetailOpen(false)} />
              <SbModalBody>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-2.5 sm:gap-3 mb-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center" style={{ background: "var(--note-fill-strong)" }}>
                      <span className="text-sm sm:text-base font-bold" style={{ color: "var(--note-text)" }}>{getInitials(studentName(selected))}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base sm:text-lg font-semibold truncate" style={{ color: "var(--note-text)", fontFamily: FONT }}>{studentName(selected)}</p>
                      <p className="text-[10px] sm:text-xs mt-0.5 truncate" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{courseLabel} · {selected.grades.length} calificaciones</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xl sm:text-2xl font-bold ${selected.grades.length ? getGradeColor(calcAverage(selected.grades)) : "opacity-40"}`} style={{ color: "var(--note-text)" }}>
                        {selected.grades.length ? calcAverage(selected.grades) : "—"}
                      </p>
                      <p className="text-[9px] sm:text-[10px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Promedio</p>
                    </div>
                  </div>

                  {selected.grades.length > 0 && (
                    <div className="rounded-xl p-3 mb-4" style={{ background: "var(--note-fill)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" style={{ color: "var(--note-muted)" }} />
                          <span className="text-[15px] font-bold uppercase tracking-wider" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Rendimiento</span>
                        </div>
                        <span className={`text-sm font-bold ${getGradeColor(calcAverage(selected.grades))}`} style={{ fontFamily: FONT }}>{calcAverage(selected.grades)}/{MAX_SCORE}</span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--note-fill-strong)" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(calcAverage(selected.grades) / MAX_SCORE) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          className="h-full rounded-full"
                          style={{ background: "var(--note-text)" }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="text-[15px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Historial de Notas</p>
                    <div className="space-y-2">
                      {selected.grades.map((g) => (
                        <div key={g.id} className="flex items-center gap-2 sm:gap-3 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 group transition-colors"
                          style={{ background: "var(--note-fill)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--note-fill-strong)" }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--note-fill)" }}
                        >
                          {editGradeId === g.id ? (
                            <>
                              <input type="number" min={0} max={MAX_SCORE} value={editScore} onChange={e => setEditScore(e.target.value)}
                                className="sb-input rounded-xl text-sm h-8 w-14 sm:w-16 text-center" autoFocus />
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleSaveGrade(selected.id, g.id, Number(editScore))}
                                  className="h-8 px-3 rounded-lg text-xs font-semibold transition-all hover:opacity-90 active:scale-[0.97]"
                                  style={{ background: "var(--note-text)", color: "var(--note-surface)", fontFamily: FONT }}>
                                  Guardar
                                </button>
                                <button onClick={() => { setEditGradeId(null); setEditScore("") }}
                                  className="h-8 px-3 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                                  style={{ background: "var(--note-fill-strong)", color: "var(--note-muted)", fontFamily: FONT }}>
                                  Cancelar
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--note-fill-strong)" }}>
                                <span className={`text-xs sm:text-sm font-bold ${getGradeColor(g.score)}`}>{g.score}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium" style={{ color: "var(--note-text)", fontFamily: FONT }}>{g.period}</p>
                                <p className="text-[9px] sm:text-[10px] truncate" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
                                  {new Date(g.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                                  {g.notes ? ` · ${g.notes}` : ""}
                                </p>
                              </div>
                              <div className="flex items-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditGradeId(g.id); setEditScore(g.score.toString()) }}
                                  className="h-7 w-7 rounded-xl flex items-center justify-center transition-colors"
                                  style={{ color: "var(--note-muted)" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--note-text)"; e.currentTarget.style.background = "var(--note-fill)" }}
                                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--note-muted)"; e.currentTarget.style.background = "transparent" }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => handleDeleteGrade(g.id)}
                                  className="h-7 w-7 rounded-xl flex items-center justify-center transition-colors"
                                  style={{ color: "var(--note-muted)" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.1)" }}
                                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--note-muted)"; e.currentTarget.style.background = "transparent" }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      {selected.grades.length === 0 && (
                        <div className="text-center py-20 rounded-xl" style={{ border: "1px dashed var(--note-hairline)" }}>
                          <BookMarked className="h-12 w-12 mx-auto mb-4" style={{ color: "var(--note-muted)", opacity: 0.3 }} />
                          <p className="text-sm" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Sin calificaciones</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl p-3 sm:p-4" style={{ background: "var(--note-fill)" }}>
                    <p className="text-[15px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Agregar Nota</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select value={newPeriod} onChange={e => setNewPeriod(e.target.value)}
                        className="text-sm rounded-xl h-9 px-3"
                        style={{ background: "var(--note-fill-strong)", color: "var(--note-text)", border: "1px solid var(--note-hairline)", fontFamily: FONT }}>
                        <option value="">Bimestre</option>
                        {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <input type="number" min={0} max={MAX_SCORE} placeholder="Nota" value={newScore} onChange={e => setNewScore(e.target.value)}
                        className="rounded-xl text-sm h-9 px-3" style={{ background: "var(--note-fill-strong)", color: "var(--note-text)", border: "1px solid var(--note-hairline)", fontFamily: FONT }} />
                      <input placeholder="Comentario" value={newNotes} onChange={e => setNewNotes(e.target.value)}
                        className="rounded-xl text-sm h-9 px-3" style={{ background: "var(--note-fill-strong)", color: "var(--note-text)", border: "1px solid var(--note-hairline)", fontFamily: FONT }} />
                    </div>
                    <button onClick={() => handleAddGrade(selected.id)} disabled={!newPeriod || !newScore}
                      className="w-full mt-2 h-9 rounded-lg text-xs font-semibold disabled:opacity-30 transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{ background: "var(--note-text)", color: "var(--note-surface)", fontFamily: FONT }}>
                      Agregar
                    </button>
                  </div>
                </motion.div>
              </SbModalBody>
            </>
          )}
        </SbModal>

        {/* ===== REGISTER DIALOG ===== */}
        <SbModal open={registerOpen} onClose={() => setRegisterOpen(false)} maxWidth="400px">
          <SbModalHeader title="Registrar calificacion" onClose={() => setRegisterOpen(false)} />
          <SbModalBody>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div>
                <label className="text-[15px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Curso</label>
                <select value={registerCourseId} onChange={e => { setRegisterCourseId(e.target.value); setRegisterStudentId("") }}
                  className="w-full h-10 px-3 text-sm rounded-xl" style={{ background: "var(--note-fill-strong)", color: "var(--note-text)", border: "1px solid var(--note-hairline)", fontFamily: FONT }}>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name} · {c.grade} &quot;{c.section}&quot;</option>)}
                </select>
              </div>
              <div>
                <label className="text-[15px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Alumno</label>
                <select value={registerStudentId} onChange={e => setRegisterStudentId(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-xl" style={{ background: "var(--note-fill-strong)", color: "var(--note-text)", border: "1px solid var(--note-hairline)", fontFamily: FONT }}>
                  <option value="">{registerStudents.length > 0 ? "Seleccionar alumno..." : "Cargando alumnos..."}</option>
                  {registerStudents.map(s => <option key={s.id} value={s.id}>{studentName(s)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[15px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Bimestre</label>
                <select value={registerPeriod} onChange={e => setRegisterPeriod(e.target.value)} className="w-full h-10 px-3 text-sm rounded-xl" style={{ background: "var(--note-fill-strong)", color: "var(--note-text)", border: "1px solid var(--note-hairline)", fontFamily: FONT }}>
                  <option value="">Seleccionar bimestre...</option>
                  {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[15px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Nota (0-{MAX_SCORE})</label>
                <input type="number" min={0} max={MAX_SCORE} placeholder="15" value={registerScore} onChange={e => setRegisterScore(e.target.value)}
                  className="rounded-xl text-sm h-10 w-full px-3" style={{ background: "var(--note-fill-strong)", color: "var(--note-text)", border: "1px solid var(--note-hairline)", fontFamily: FONT }} />
              </div>
            </motion.div>
          </SbModalBody>
          <SbModalFooter>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <button className="h-10 px-5 text-sm font-semibold rounded-lg transition-all hover:opacity-80" style={{ background: "var(--note-fill)", color: "var(--note-muted)", fontFamily: FONT }} onClick={() => setRegisterOpen(false)}>Cancelar</button>
              <button className="h-10 px-5 text-sm font-bold rounded-lg transition-all disabled:opacity-30 hover:opacity-90 active:scale-[0.97]" style={{ background: "var(--note-text)", color: "var(--note-surface)", fontFamily: FONT }} disabled={!registerStudentId || !registerScore || !registerPeriod || saving} onClick={handleRegister}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </SbModalFooter>
        </SbModal>
      </div>
    </div>
  )
}

/* ===== LIBRO DE NOTAS (matriz por bimestres) ===== */
function TablaNotas({
  students,
  courseId,
  maxScore,
  savingCell,
  saveError,
  onSaveCell,
}: {
  students: Student[]
  courseId: string
  maxScore: number
  savingCell: string | null
  saveError: string | null
  onSaveCell: (studentId: string, period: string, rawValue: string) => void
}) {
  const [drafts, setDrafts] = React.useState<Record<string, string>>({})

  const approvedCount = students.filter(s => {
    const avg = calcAverage(s.grades)
    return avg >= 11
  }).length
  const disapprovedCount = students.filter(s => {
    const avg = calcAverage(s.grades)
    return avg > 0 && avg < 11
  }).length
  const noGradeCount = students.filter(s => s.grades.length === 0).length

  const gradeFor = (s: Student, period: string) => s.grades.find(g => g.period === period)

  const cellKey = (studentId: string, period: string) => `${studentId}:${period}`

  const commit = (studentId: string, period: string) => {
    const key = cellKey(studentId, period)
    const value = drafts[key]
    if (value === undefined) return
    onSaveCell(studentId, period, value)
  }

  const avgClass = (avg: number) => avg === 0 ? "text-[var(--note-muted)] opacity-40" : avg >= 11 ? "text-[var(--note-text)]" : "text-[var(--note-muted)]"

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "var(--note-fill)", border: "1px solid var(--note-hairline)" }}>
      {saveError && (
        <div className="px-5 pt-4">
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-600">{saveError}</div>
        </div>
      )}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid var(--note-hairline)" }}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Libro de notas</p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Escribe la nota (0-{maxScore}) y presiona Enter o haz clic fuera para guardar</p>
          </div>
          <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> {approvedCount} Aprobados</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" /> {disapprovedCount} Desaprobados</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "var(--note-fill-strong)" }} /> {noGradeCount} Sin nota</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr style={{ background: "var(--note-fill-strong)" }}>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Alumno</th>
              {PERIODS.map(p => (
                <th key={p} className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
                  B{p.split(" ")[1]}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Promedio</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => {
              const avg = calcAverage(s.grades)
              const isLast = i === students.length - 1
              return (
                <tr key={s.id} className="transition-colors" style={{ borderBottom: isLast ? "none" : "1px solid var(--note-hairline)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--note-fill-strong)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--note-fill-strong)" }}>
                        <span className="text-[9px] font-bold" style={{ color: "var(--note-text)" }}>{getInitials(studentName(s))}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate max-w-[160px]" style={{ color: "var(--note-text)", fontFamily: FONT }}>{studentName(s)}</p>
                        <p className="text-[9px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{s.code}</p>
                      </div>
                    </div>
                  </td>
                  {PERIODS.map(p => {
                    const g = gradeFor(s, p)
                    const key = cellKey(s.id, p)
                    const value = drafts[key] !== undefined ? drafts[key] : g ? String(g.score) : ""
                    const isSaving = savingCell === key
                    const color = g ? (g.score >= 11 ? "text-emerald-600" : "text-red-500") : "text-[var(--note-muted)] opacity-50"
                    return (
                      <td key={p} className="px-3 py-2 text-center">
                        <div className="relative inline-block">
                          <input
                            type="number"
                            min={0}
                            max={maxScore}
                            step="0.5"
                            value={value}
                            placeholder="—"
                            onChange={e => setDrafts(prev => ({ ...prev, [key]: e.target.value }))}
                            onBlur={() => commit(s.id, p)}
                            onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
                            className={`w-14 h-9 rounded-xl text-center text-sm font-semibold focus:outline-none focus:ring-2 transition-all ${color}`}
                            style={{ background: "var(--note-fill-strong)", "--tw-ring-color": "var(--note-muted)" } as any}
                          />
                          {isSaving && (
                            <span className="absolute -top-1 -right-1 h-2.5 w-2.5">
                              <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "var(--note-muted)", opacity: 0.3 }} />
                              <span className="absolute inset-0 rounded-full" style={{ background: "var(--note-text)" }} />
                            </span>
                          )}
                        </div>
                      </td>
                    )
                  })}
                  <td className="px-4 py-2 text-center">
                    <span className={`text-base font-bold ${avgClass(avg)}`}>{avg === 0 ? "—" : avg.toFixed(1)}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
