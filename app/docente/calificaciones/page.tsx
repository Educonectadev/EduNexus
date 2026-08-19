"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Plus, BookMarked, TrendingUp, TrendingDown, Check, Pencil, Trash2, BarChart3, Sun, Moon } from "@/components/ui/proicons"
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

function getInitials(name: string) { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) }

function getAvatarColor(_name: string) {
  return "bg-foreground/10"
}

function getGradeColor(g: number) { return g >= 18 ? "font-bold" : g >= 11 ? "" : "opacity-60" }
function getGradeBg(g: number) { return g >= 18 ? "bg-foreground/10" : g >= 11 ? "bg-foreground/5" : "bg-foreground/10" }
function getGradeBarColor(g: number) { return g >= 18 ? "bg-foreground" : g >= 11 ? "bg-muted-foreground" : "bg-muted-foreground" }

function calcAverage(grades: Grade[]) {
  if (grades.length === 0) return 0
  return Number((grades.reduce((a, g) => a + g.score, 0) / grades.length).toFixed(1))
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

  const handleSaveGrade = async (studentId: string, gradeId: string, newScore: number) => {
    try {
      const target = selected?.grades.find(g => g.id === gradeId)
      if (!target) return
      await fetch("/api/docente/calificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, course_id: target.course_id, period: target.period, score: newScore, max_score: MAX_SCORE }),
      })
      if (courseId) loadCourseData(courseId)
    } catch {}
    setEditGradeId(null); setEditScore("")
  }

  const handleDeleteGrade = async (gradeId: string) => {
    try {
      await fetch(`/api/docente/calificaciones?id=${gradeId}`, { method: "DELETE" })
      if (courseId) loadCourseData(courseId)
    } catch {}
  }

  const handleAddGrade = async (studentId: string) => {
    if (!newPeriod || !newScore) return
    await fetch("/api/docente/calificaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: studentId, course_id: courseId, period: newPeriod, score: Number(newScore), max_score: MAX_SCORE, notes: newNotes || null }),
    })
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

  const registerStudents = registerCourseId === courseId ? students : []

  return (
    <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-black dark:bg-black">
      <div className="p-6 md:p-8 pb-24 md:pb-8 space-y-5">
        {/* Header */}
        <header className="mb-5">
          <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[14px] font-medium mb-1 text-[#666] dark:text-[#a1a1aa]">Panel Docente</p>
            <h1 className="text-[36px] md:text-[48px] font-bold leading-tight text-[#000] dark:text-[#f4f4f5]">
              Calificaciones
            </h1>
            <p className="text-[13px] mt-2 text-[#666] dark:text-[#a1a1aa]">
              Gestiona las notas de tus alumnos
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5">
                <div className="h-6 w-6 rounded-full flex items-center justify-center">
                  <span className="text-[9px] font-semibold text-[#000] dark:text-[#f4f4f5]">
                    {user.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "D"}
                  </span>
                </div>
                <span className="text-sm md:text-base font-medium text-[#000] dark:text-[#f4f4f5] whitespace-nowrap">
                  {user.full_name}
                </span>
              </div>
            )}
            <NotificationBell />
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Cambiar tema" title="Cambiar tema" className="h-10 w-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity relative">
              <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-[#000] dark:text-[#f4f4f5]" />
              <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-[#000] dark:text-[#f4f4f5]" />
            </button>
          </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <div className="nb-select-wrap">
              <select
                value={courseId}
                onChange={e => setCourseId(e.target.value)}
                disabled={loading}
                className={cn("nb-select min-w-[220px]", courseId && "has-value")}
              >
                {courses.length === 0 && <option value="">Sin cursos asignados</option>}
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name} · {c.grade} &quot;{c.section}&quot;</option>
                ))}
              </select>
            </div>
            {students.length > 0 && (
              <div className="nb-rail">
                {([["lista", "Lista"], ["tabla", "Libro de notas"]] as const).map(([key, label]) => (
                  <button key={key} onClick={() => setViewMode(key)}
                    className={cn("nb-chip", viewMode === key && "active")}>
                    <Check className="nb-chip-check" />
                    {label}
                  </button>
                ))}
              </div>
            )}
            <SbBtn variant="filled" rounded className="flex items-center gap-2 ml-auto" onClick={() => setRegisterOpen(true)} disabled={!courses.length}>
              <Plus className="h-4 w-4" /> Registrar
            </SbBtn>
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
                <div
                  key={i}
                  className="h-28"
                  style={{
                    background: "var(--sb-surface-container)",
                    borderRadius: "16px"
                  }}
                />
              ))}
            </div>
            <div
              className="h-64 animate-pulse"
              style={{
                background: "var(--sb-surface-container)",
                borderRadius: "16px"
              }}
            />
          </div>
        ) : students.length === 0 ? (
          <div
            className="py-16 text-center"
            style={{
              background: "var(--sb-surface-container)",
              borderRadius: "20px",
              border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)"
            }}
          >
            <BookMarked
              className="h-10 w-10 mx-auto mb-3"
              style={{ color: "var(--sb-on-surface-variant)", opacity: 0.3 }}
            />
            <p
              className="text-xs font-medium"
              style={{
                color: "var(--sb-on-surface-variant)",
                fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
              }}
            >
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
            <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-3 gap-2">
              {[
                { label: "Promedio General", value: avgGeneral.toFixed(1), icon: BarChart3 },
                { label: "Mejor Nota", value: bestScore, icon: TrendingUp },
                { label: "Total Alumnos", value: students.length, icon: BookMarked },
              ].map(s => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="p-4"
                  style={{
                    background: "var(--sb-surface-container)",
                    borderRadius: "16px",
                    border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)"
                  }}
                >
                  <div
                    className="h-8 w-8 flex items-center justify-center mb-2"
                    style={{
                      background: "var(--sb-surface-container-high)",
                      borderRadius: "10px"
                    }}
                  >
                    <s.icon className="h-4 w-4" style={{ color: "var(--sb-on-surface-variant)" }} />
                  </div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.8px]"
                    style={{
                      color: "var(--sb-on-surface-variant)",
                      opacity: 0.45,
                      fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                    }}
                  >
                    {s.label}
                  </p>
                  <p
                    className="mt-1.5 text-lg font-bold leading-none"
                    style={{
                      color: "var(--sb-on-surface)",
                      fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                    }}
                  >
                    {s.value}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* Student list */}
            <div
              className="overflow-hidden"
              style={{
                background: "var(--sb-surface-container)",
                borderRadius: "20px",
                border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)"
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
                      className="flex items-center justify-between px-4 py-3 hover:bg-foreground/5 transition-colors border-b border-foreground/10 last:border-0 cursor-pointer group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-10 w-10 rounded-xl ${getAvatarColor(studentName(s))} flex items-center justify-center shrink-0`}>
                          <span className="text-[10px] font-bold text-white">{getInitials(studentName(s))}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{studentName(s)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground">{s.grades.length} notas</span>
                            {s.grades.slice(-4).map((g, j) => (
                              <span key={j} className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xl ${getGradeBg(g.score)} ${getGradeColor(g.score)}`}>{g.score}</span>
                            ))}
                            {s.grades.length > 4 && <span className="text-[10px] text-muted-foreground">+{s.grades.length - 4}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {trend ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> : <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
                        <span className={`text-lg font-bold ${avg === 0 ? "text-muted-foreground/40" : getGradeColor(avg)}`}>{avg === 0 ? "—" : avg}</span>
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
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-12 w-12 rounded-xl ${getAvatarColor(studentName(selected))} flex items-center justify-center`}>
                      <span className="text-base font-bold text-white">{getInitials(studentName(selected))}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-foreground">{studentName(selected)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{courseLabel} · {selected.grades.length} calificaciones</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${selected.grades.length ? getGradeColor(calcAverage(selected.grades)) : "text-muted-foreground/40"}`}>
                        {selected.grades.length ? calcAverage(selected.grades) : "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Promedio</p>
                    </div>
                  </div>

                  {selected.grades.length > 0 && (
                    <div className="rounded-xl bg-foreground/5 p-3 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Rendimiento</span>
                        </div>
                        <span className={`text-sm font-bold ${getGradeColor(calcAverage(selected.grades))}`}>{calcAverage(selected.grades)}/{MAX_SCORE}</span>
                      </div>
                      <div className="h-3 rounded-full bg-foreground/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(calcAverage(selected.grades) / MAX_SCORE) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          className={`h-full rounded-full ${getGradeBarColor(calcAverage(selected.grades))}`}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Historial de Notas</p>
                    <div className="space-y-2">
                      {selected.grades.map((g) => (
                        <div key={g.id} className="flex items-center gap-3 rounded-xl bg-foreground/5 px-4 py-3 group">
                          {editGradeId === g.id ? (
                            <>
                              <input type="number" min={0} max={MAX_SCORE} value={editScore} onChange={e => setEditScore(e.target.value)}
                                className="sb-input rounded-xl text-sm h-8 w-16 text-center" autoFocus />
                              <button onClick={() => handleSaveGrade(selected.id, g.id, Number(editScore))}
                                className="h-8 px-3 rounded-xl bg-foreground text-background text-xs font-medium hover:opacity-90 transition-all">
                                Guardar
                              </button>
                              <button onClick={() => { setEditGradeId(null); setEditScore("") }}
                                className="h-8 px-3 rounded-xl bg-foreground/10 text-muted-foreground text-xs font-medium hover:opacity-90 transition-all">
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${getGradeBg(g.score)}`}>
                                <span className={`text-sm font-bold ${getGradeColor(g.score)}`}>{g.score}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{g.period}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(g.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                                  {g.notes ? ` · ${g.notes}` : ""}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditGradeId(g.id); setEditScore(g.score.toString()) }}
                                  className="h-7 w-7 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors">
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => handleDeleteGrade(g.id)}
                                  className="h-7 w-7 rounded-xl flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      {selected.grades.length === 0 && (
                        <div className="text-center py-20 rounded-xl border border-dashed border-foreground/10">
                          <BookMarked className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                          <p className="text-sm text-muted-foreground">Sin calificaciones</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-foreground/5 p-4">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Agregar Nota</p>
                    <div className="grid grid-cols-3 gap-2">
                      <select value={newPeriod} onChange={e => setNewPeriod(e.target.value)}
                        className="sbf-native-select text-sm">
                        <option value="">Bimestre</option>
                        {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <input type="number" min={0} max={MAX_SCORE} placeholder="Nota" value={newScore} onChange={e => setNewScore(e.target.value)}
                        className="sb-input rounded-xl text-sm h-9" />
                      <input placeholder="Comentario" value={newNotes} onChange={e => setNewNotes(e.target.value)}
                        className="sb-input rounded-xl text-sm h-9" />
                    </div>
                    <button onClick={() => handleAddGrade(selected.id)} disabled={!newPeriod || !newScore}
                      className="w-full mt-2 h-9 rounded-xl bg-foreground text-background text-xs font-medium disabled:opacity-30 hover:opacity-90 transition-all">
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
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Curso</label>
                <select value={registerCourseId} onChange={e => { setRegisterCourseId(e.target.value); setRegisterStudentId("") }}
                  className="sbf-native-select w-full">
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name} · {c.grade} &quot;{c.section}&quot;</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Alumno</label>
                <select value={registerStudentId} onChange={e => setRegisterStudentId(e.target.value)} disabled={registerCourseId !== courseId}
                  className="sbf-native-select w-full disabled:opacity-50">
                  <option value="">{registerCourseId === courseId ? "Seleccionar alumno..." : "Selecciona primero el curso en la vista"}</option>
                  {registerStudents.map(s => <option key={s.id} value={s.id}>{studentName(s)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Bimestre</label>
                <select value={registerPeriod} onChange={e => setRegisterPeriod(e.target.value)} className="sbf-native-select w-full">
                  <option value="">Seleccionar bimestre...</option>
                  {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Nota (0-{MAX_SCORE})</label>
                <input type="number" min={0} max={MAX_SCORE} placeholder="15" value={registerScore} onChange={e => setRegisterScore(e.target.value)}
                  className="sb-input rounded-xl text-sm h-10 w-full" />
              </div>
            </motion.div>
          </SbModalBody>
          <SbModalFooter>
            <SbBtn rounded onClick={() => setRegisterOpen(false)}>Cancelar</SbBtn>
            <SbBtn variant="filled" rounded disabled={!registerStudentId || !registerScore || !registerPeriod || saving} onClick={handleRegister}>
              {saving ? "Guardando..." : "Guardar"}
            </SbBtn>
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

  const gradeFor = (s: Student, period: string) => s.grades.find(g => g.period === period)

  const cellKey = (studentId: string, period: string) => `${studentId}:${period}`

  const commit = (studentId: string, period: string) => {
    const key = cellKey(studentId, period)
    const value = drafts[key]
    if (value === undefined) return
    onSaveCell(studentId, period, value)
  }

  const avgClass = (avg: number) => avg === 0 ? "text-muted-foreground/40" : avg >= 11 ? "text-emerald-600" : "text-red-500"

  return (
    <div className="rounded-xl border border-foreground/10 bg-foreground/5 overflow-hidden">
      {saveError && (
        <div className="px-5 pt-4">
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-600">{saveError}</div>
        </div>
      )}
      <div className="px-5 pt-5 pb-4 border-b border-foreground/10">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">Libro de notas</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Escribe la nota (0-{maxScore}) y presiona Enter o haz clic fuera para guardar</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Aprobado (11+)</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" /> Desaprobado</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-foreground/10" /> Sin nota</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-foreground/5 text-left">
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Alumno</th>
              {PERIODS.map(p => (
                <th key={p} className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  B{p.split(" ")[1]}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Promedio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/10">
            {students.map(s => {
              const avg = calcAverage(s.grades)
              return (
                <tr key={s.id} className="hover:bg-foreground/5 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`h-8 w-8 rounded-xl ${getAvatarColor(studentName(s))} flex items-center justify-center shrink-0`}>
                        <span className="text-[9px] font-bold text-white">{getInitials(studentName(s))}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate max-w-[160px]">{studentName(s)}</p>
                        <p className="text-[9px] text-muted-foreground">{s.code}</p>
                      </div>
                    </div>
                  </td>
                  {PERIODS.map(p => {
                    const g = gradeFor(s, p)
                    const key = cellKey(s.id, p)
                    const value = drafts[key] !== undefined ? drafts[key] : g ? String(g.score) : ""
                    const isSaving = savingCell === key
                    const color = g ? (g.score >= 11 ? "text-emerald-600" : "text-red-500") : "text-muted-foreground/50"
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
                            className={`w-14 h-9 rounded-xl text-center text-sm font-semibold bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-muted-foreground/40 transition-all ${color}`}
                          />
                          {isSaving && (
                            <span className="absolute -top-1 -right-1 h-2.5 w-2.5">
                              <span className="absolute inset-0 rounded-full bg-muted-foreground/30 animate-ping" />
                              <span className="absolute inset-0 rounded-full bg-foreground" />
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
