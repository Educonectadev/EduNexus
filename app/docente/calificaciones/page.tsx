"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Plus, BookMarked, TrendingUp, TrendingDown, Check, Pencil, Trash2, BarChart3 } from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { SbBtn, SbModal, SbModalHeader, SbModalBody, SbModalFooter } from "@/components/ui/sb"

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
  return "bg-[var(--note-fill-strong)]"
}

function getGradeColor(g: number) { return g >= 18 ? "font-bold" : g >= 11 ? "" : "opacity-60" }
function getGradeBg(g: number) { return g >= 18 ? "bg-[var(--note-fill-strong)]" : g >= 11 ? "bg-[var(--note-fill)]" : "bg-[var(--note-fill-strong)]" }
function getGradeBarColor(g: number) { return g >= 18 ? "bg-[var(--note-text)]" : g >= 11 ? "bg-[var(--note-muted)]" : "bg-[var(--note-muted)]" }

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
    <div className="sb-note">
      <div className="mx-auto w-full max-w-[1034px] px-2 pb-4 space-y-3">
        {/* Header */}
        <header className="pt-2 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-[26px] sm:text-[30px] leading-tight tracking-[-0.03em] text-[var(--note-text)]">Calificaciones</h1>
            <p className="mt-1 text-sm text-[var(--note-muted)]">Gestiona las notas de tus alumnos</p>
          </div>
          <div className="flex items-center gap-2">
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
            <SbBtn variant="filled" rounded className="flex items-center gap-2" onClick={() => setRegisterOpen(true)} disabled={!courses.length}>
              <Plus className="h-4 w-4" /> Registrar
            </SbBtn>
          </div>
        </header>

        {error && (
          <div className="rounded-[12px] bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)]" />)}
            </div>
            <div className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] h-64 animate-pulse" />
          </div>
        ) : students.length === 0 ? (
          <div className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] py-8 text-center">
            <BookMarked className="h-10 w-10 mx-auto mb-3 text-[var(--note-muted)]/40" />
            <p className="text-sm font-medium text-[var(--note-muted)]">
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
            <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-3 gap-3">
              {[
                { label: "Promedio General", value: avgGeneral.toFixed(1), icon: BarChart3 },
                { label: "Mejor Nota", value: bestScore, icon: TrendingUp },
                { label: "Total Alumnos", value: students.length, icon: BookMarked },
              ].map(s => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] p-4">
                  <div className="h-10 w-10 rounded-[12px] bg-[var(--note-fill)] flex items-center justify-center mb-3">
                    <s.icon className="h-5 w-5 text-[var(--note-text)]" />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--note-muted)]">{s.label}</p>
                  <p className="mt-1.5 text-[22px] font-bold leading-none tracking-tight text-[var(--note-text)]">{s.value}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Student list */}
            <div className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] overflow-hidden">
              <AnimatePresence>
                {students.map((s, i) => {
                  const avg = calcAverage(s.grades)
                  const trend = getTrend(s.grades)
                  return (
                    <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25, delay: i * 0.03 }}
                      onClick={() => { setSelected(s); setEditGradeId(null); setNewPeriod(""); setNewScore(""); setNewNotes(""); setDetailOpen(true) }}
                      className="flex items-center justify-between px-4 py-3 hover:bg-[var(--note-fill)] transition-colors border-b border-[var(--note-hairline)] last:border-0 cursor-pointer group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-10 w-10 rounded-[12px] ${getAvatarColor(studentName(s))} flex items-center justify-center shrink-0`}>
                          <span className="text-[10px] font-bold text-white">{getInitials(studentName(s))}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--note-text)] truncate">{studentName(s)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-[var(--note-muted)]">{s.grades.length} notas</span>
                            {s.grades.slice(-4).map((g, j) => (
                              <span key={j} className={`text-[10px] font-mono px-1.5 py-0.5 rounded-[6px] ${getGradeBg(g.score)} ${getGradeColor(g.score)}`}>{g.score}</span>
                            ))}
                            {s.grades.length > 4 && <span className="text-[10px] text-[var(--note-muted)]">+{s.grades.length - 4}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {trend ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> : <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
                        <span className={`text-lg font-bold ${avg === 0 ? "text-[var(--note-muted)]/40" : getGradeColor(avg)}`}>{avg === 0 ? "—" : avg}</span>
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
                    <div className={`h-12 w-12 rounded-[16px] ${getAvatarColor(studentName(selected))} flex items-center justify-center`}>
                      <span className="text-base font-bold text-white">{getInitials(studentName(selected))}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-[var(--note-text)]">{studentName(selected)}</p>
                      <p className="text-xs text-[var(--note-muted)] mt-0.5">{courseLabel} · {selected.grades.length} calificaciones</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${selected.grades.length ? getGradeColor(calcAverage(selected.grades)) : "text-[var(--note-muted)]/40"}`}>
                        {selected.grades.length ? calcAverage(selected.grades) : "—"}
                      </p>
                      <p className="text-[10px] text-[var(--note-muted)]">Promedio</p>
                    </div>
                  </div>

                  {selected.grades.length > 0 && (
                    <div className="rounded-[16px] bg-[var(--note-fill)] p-3 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-[var(--note-muted)]" />
                          <span className="text-[10px] font-semibold text-[var(--note-muted)] uppercase tracking-wider">Rendimiento</span>
                        </div>
                        <span className={`text-sm font-bold ${getGradeColor(calcAverage(selected.grades))}`}>{calcAverage(selected.grades)}/{MAX_SCORE}</span>
                      </div>
                      <div className="h-3 rounded-full bg-[var(--note-fill-strong)] overflow-hidden">
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
                    <p className="text-[10px] font-semibold text-[var(--note-muted)] uppercase tracking-wider mb-3">Historial de Notas</p>
                    <div className="space-y-2">
                      {selected.grades.map((g) => (
                        <div key={g.id} className="flex items-center gap-3 rounded-[16px] bg-[var(--note-fill)] px-4 py-3 group">
                          {editGradeId === g.id ? (
                            <>
                              <input type="number" min={0} max={MAX_SCORE} value={editScore} onChange={e => setEditScore(e.target.value)}
                                className="sb-input rounded-[12px] text-sm h-8 w-16 text-center" autoFocus />
                              <button onClick={() => handleSaveGrade(selected.id, g.id, Number(editScore))}
                                className="h-8 px-3 rounded-[12px] bg-[var(--note-solid-bg)] text-[var(--note-solid-fg)] text-xs font-medium hover:opacity-90 transition-all">
                                Guardar
                              </button>
                              <button onClick={() => { setEditGradeId(null); setEditScore("") }}
                                className="h-8 px-3 rounded-[12px] bg-[var(--note-fill-strong)] text-[var(--note-muted)] text-xs font-medium hover:opacity-90 transition-all">
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <div className={`h-9 w-9 rounded-[12px] flex items-center justify-center shrink-0 ${getGradeBg(g.score)}`}>
                                <span className={`text-sm font-bold ${getGradeColor(g.score)}`}>{g.score}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[var(--note-text)]">{g.period}</p>
                                <p className="text-[10px] text-[var(--note-muted)]">
                                  {new Date(g.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                                  {g.notes ? ` · ${g.notes}` : ""}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditGradeId(g.id); setEditScore(g.score.toString()) }}
                                  className="h-7 w-7 rounded-[12px] flex items-center justify-center text-[var(--note-muted)] hover:text-[var(--note-text)] hover:bg-[var(--note-fill-strong)] transition-colors">
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => handleDeleteGrade(g.id)}
                                  className="h-7 w-7 rounded-[12px] flex items-center justify-center text-[var(--note-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      {selected.grades.length === 0 && (
                        <div className="text-center py-8 rounded-[16px] border border-dashed border-[var(--note-hairline-strong)]">
                          <BookMarked className="h-8 w-8 mx-auto mb-2 text-[var(--note-muted)]/40" />
                          <p className="text-sm text-[var(--note-muted)]">Sin calificaciones</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[16px] bg-[var(--note-fill)] p-4">
                    <p className="text-[10px] font-semibold text-[var(--note-muted)] uppercase tracking-wider mb-3">Agregar Nota</p>
                    <div className="grid grid-cols-3 gap-2">
                      <select value={newPeriod} onChange={e => setNewPeriod(e.target.value)}
                        className="sbf-native-select text-sm">
                        <option value="">Bimestre</option>
                        {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <input type="number" min={0} max={MAX_SCORE} placeholder="Nota" value={newScore} onChange={e => setNewScore(e.target.value)}
                        className="sb-input rounded-[12px] text-sm h-9" />
                      <input placeholder="Comentario" value={newNotes} onChange={e => setNewNotes(e.target.value)}
                        className="sb-input rounded-[12px] text-sm h-9" />
                    </div>
                    <button onClick={() => handleAddGrade(selected.id)} disabled={!newPeriod || !newScore}
                      className="w-full mt-2 h-9 rounded-[12px] bg-[var(--note-solid-bg)] text-[var(--note-solid-fg)] text-xs font-medium disabled:opacity-30 hover:opacity-90 transition-all">
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
                <label className="text-[10px] font-semibold text-[var(--note-muted)] uppercase tracking-wider mb-1.5 block">Curso</label>
                <select value={registerCourseId} onChange={e => { setRegisterCourseId(e.target.value); setRegisterStudentId("") }}
                  className="sbf-native-select w-full">
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name} · {c.grade} &quot;{c.section}&quot;</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[var(--note-muted)] uppercase tracking-wider mb-1.5 block">Alumno</label>
                <select value={registerStudentId} onChange={e => setRegisterStudentId(e.target.value)} disabled={registerCourseId !== courseId}
                  className="sbf-native-select w-full disabled:opacity-50">
                  <option value="">{registerCourseId === courseId ? "Seleccionar alumno..." : "Selecciona primero el curso en la vista"}</option>
                  {registerStudents.map(s => <option key={s.id} value={s.id}>{studentName(s)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[var(--note-muted)] uppercase tracking-wider mb-1.5 block">Bimestre</label>
                <select value={registerPeriod} onChange={e => setRegisterPeriod(e.target.value)} className="sbf-native-select w-full">
                  <option value="">Seleccionar bimestre...</option>
                  {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[var(--note-muted)] uppercase tracking-wider mb-1.5 block">Nota (0-{MAX_SCORE})</label>
                <input type="number" min={0} max={MAX_SCORE} placeholder="15" value={registerScore} onChange={e => setRegisterScore(e.target.value)}
                  className="sb-input rounded-[12px] text-sm h-10 w-full" />
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

  const avgClass = (avg: number) => avg === 0 ? "text-[var(--note-muted)]/40" : avg >= 11 ? "text-emerald-600" : "text-red-500"

  return (
    <div className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] overflow-hidden">
      {saveError && (
        <div className="px-5 pt-4">
          <div className="rounded-[12px] bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-600">{saveError}</div>
        </div>
      )}
      <div className="px-5 pt-5 pb-4 border-b border-[var(--note-hairline)]">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-[10px] font-semibold text-[var(--note-muted)] uppercase tracking-[0.12em]">Libro de notas</p>
            <p className="text-[11px] text-[var(--note-muted)] mt-0.5">Escribe la nota (0-{maxScore}) y presiona Enter o haz clic fuera para guardar</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-[var(--note-muted)]">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Aprobado (11+)</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" /> Desaprobado</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--note-fill-strong)]" /> Sin nota</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-[var(--note-fill)] text-left">
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--note-muted)]">Alumno</th>
              {PERIODS.map(p => (
                <th key={p} className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--note-muted)]">
                  B{p.split(" ")[1]}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--note-muted)]">Promedio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--note-hairline)]">
            {students.map(s => {
              const avg = calcAverage(s.grades)
              return (
                <tr key={s.id} className="hover:bg-[var(--note-fill)] transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`h-8 w-8 rounded-[12px] ${getAvatarColor(studentName(s))} flex items-center justify-center shrink-0`}>
                        <span className="text-[9px] font-bold text-white">{getInitials(studentName(s))}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[var(--note-text)] truncate max-w-[160px]">{studentName(s)}</p>
                        <p className="text-[9px] text-[var(--note-muted)]">{s.code}</p>
                      </div>
                    </div>
                  </td>
                  {PERIODS.map(p => {
                    const g = gradeFor(s, p)
                    const key = cellKey(s.id, p)
                    const value = drafts[key] !== undefined ? drafts[key] : g ? String(g.score) : ""
                    const isSaving = savingCell === key
                    const color = g ? (g.score >= 11 ? "text-emerald-600" : "text-red-500") : "text-[var(--note-muted)]/50"
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
                            className={`w-14 h-9 rounded-[12px] text-center text-sm font-semibold bg-[var(--note-fill)] focus:outline-none focus:ring-2 focus:ring-[var(--note-muted)]/40 transition-all ${color}`}
                          />
                          {isSaving && (
                            <span className="absolute -top-1 -right-1 h-2.5 w-2.5">
                              <span className="absolute inset-0 rounded-full bg-[var(--note-muted)]/30 animate-ping" />
                              <span className="absolute inset-0 rounded-full bg-[var(--note-text)]" />
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