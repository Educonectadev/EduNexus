"use client"

import * as React from "react"
import { Plus, BookMarked, TrendingUp, TrendingDown, X, Pencil, Trash2, BarChart3, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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

const staggerItem = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }
const listItem = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, filter: "blur(8px)", y: -10 },
}

function getInitials(name: string) { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) }

function getAvatarColor(name: string) {
  const colors = ["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-amber-500", "bg-pink-500", "bg-cyan-500", "bg-rose-500"]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function getGradeColor(g: number) { return g >= 18 ? "text-emerald-600" : g >= 11 ? "text-sb-on-surface" : "text-red-500" }
function getGradeBg(g: number) { return g >= 18 ? "bg-emerald-500/10" : g >= 11 ? "bg-sb-surface-container" : "bg-red-500/10" }
function getGradeBarColor(g: number) { return g >= 18 ? "bg-emerald-400" : g >= 11 ? "bg-amber-400" : "bg-red-400" }

function calcAverage(grades: Grade[]) {
  if (grades.length === 0) return 0
  return Number((grades.reduce((a, g) => a + g.score, 0) / grades.length).toFixed(1))
}

function studentName(s: Student) { return `${s.first_name} ${s.last_name}` }

export default function CalificacionesPage() {
  const [courses, setCourses] = React.useState<Course[]>([])
  const [courseId, setCourseId] = React.useState("")
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

  const loadCourses = React.useCallback(async () => {
    try {
      const res = await fetch("/api/docente/calificaciones")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al cargar")
      setCourses(Array.isArray(data.courses) ? data.courses : [])
      if (Array.isArray(data.courses) && data.courses.length > 0) {
        setCourseId(data.courses[0].id)
        setRegisterCourseId(data.courses[0].id)
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
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Calificaciones</h1>
          <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">Gestiona las notas de tus alumnos</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative min-w-[220px]">
            <select
              value={courseId}
              onChange={e => setCourseId(e.target.value)}
              disabled={loading}
              className="sb-input rounded-[6px] text-sm h-10 w-full appearance-none pr-9 disabled:opacity-50"
            >
              {courses.length === 0 && <option value="">Sin cursos asignados</option>}
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name} · {c.grade} &quot;{c.section}&quot;</option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 text-sb-on-surface-variant/40 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <SbBtn variant="filled" rounded className="flex items-center gap-2" onClick={() => setRegisterOpen(true)} disabled={!courses.length}>
            <Plus className="h-4 w-4" /> Registrar
          </SbBtn>
        </div>
      </motion.div>

      {error && (
        <div className="rounded-[6px] bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-[6px] bg-sb-surface-container" />)}
          </div>
          <div className="bg-sb-surface rounded-[6px] h-64 animate-pulse" />
        </div>
      ) : students.length === 0 ? (
        <div className="bg-sb-surface rounded-[6px] py-16 text-center border border-sb-outline-variant/8">
          <BookMarked className="h-10 w-10 mx-auto mb-3 text-sb-on-surface-variant/20" />
          <p className="text-sm font-medium text-sb-on-surface-variant/40">
            {courseLabel ? "Sin alumnos matriculados en este curso" : "Selecciona un curso para ver calificaciones"}
          </p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-3 gap-3">
            {[
              { label: "Promedio General", value: avgGeneral.toFixed(1), color: "text-sb-on-surface", bg: "bg-sb-on-surface/8" },
              { label: "Mejor Nota", value: bestScore, color: "text-emerald-600", bg: "bg-emerald-500/8" },
              { label: "Total Alumnos", value: students.length, color: "text-blue-600", bg: "bg-blue-500/8" },
            ].map(s => (
              <motion.div key={s.label} variants={staggerItem} className="bg-sb-surface rounded-[6px] p-4">
                <div className={`h-9 w-9 rounded-[6px] flex items-center justify-center mb-3 ${s.bg}`}>
                  <BookMarked className={`h-4.5 w-4.5 ${s.color}`} />
                </div>
                <p className="text-xl font-bold tracking-tight text-sb-on-surface">{s.value}</p>
                <p className="text-[11px] text-sb-on-surface-variant/45 mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Student list */}
          <div className="bg-sb-surface rounded-[6px] overflow-hidden border border-sb-outline-variant/8">
            <AnimatePresence>
              {students.map((s, i) => {
                const avg = calcAverage(s.grades)
                const trend = getTrend(s.grades)
                return (
                  <motion.div key={s.id} variants={listItem} initial="hidden" animate="show" exit="exit"
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                    onClick={() => { setSelected(s); setEditGradeId(null); setNewPeriod(""); setNewScore(""); setNewNotes(""); setDetailOpen(true) }}
                    className="flex items-center justify-between px-5 py-4 hover:bg-sb-surface-container-low/50 transition-colors border-b border-sb-outline-variant/10 last:border-0 cursor-pointer group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-10 w-10 rounded-[6px] ${getAvatarColor(studentName(s))} flex items-center justify-center shrink-0`}>
                        <span className="text-[10px] font-bold text-white">{getInitials(studentName(s))}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-sb-on-surface truncate">{studentName(s)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-sb-on-surface-variant/30">{s.grades.length} notas</span>
                          {s.grades.slice(-4).map((g, j) => (
                            <span key={j} className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${getGradeBg(g.score)} ${getGradeColor(g.score)}`}>{g.score}</span>
                          ))}
                          {s.grades.length > 4 && <span className="text-[10px] text-sb-on-surface-variant/30">+{s.grades.length - 4}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {trend ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> : <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
                      <span className={`text-lg font-bold ${avg === 0 ? "text-sb-on-surface-variant/30" : getGradeColor(avg)}`}>{avg === 0 ? "—" : avg}</span>
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
                {/* Student header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`h-14 w-14 rounded-[6px] ${getAvatarColor(studentName(selected))} flex items-center justify-center`}>
                    <span className="text-base font-bold text-white">{getInitials(studentName(selected))}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-sb-on-surface">{studentName(selected)}</p>
                    <p className="text-xs text-sb-on-surface-variant/50 mt-0.5">{courseLabel} · {selected.grades.length} calificaciones</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${selected.grades.length ? getGradeColor(calcAverage(selected.grades)) : "text-sb-on-surface-variant/30"}`}>
                      {selected.grades.length ? calcAverage(selected.grades) : "—"}
                    </p>
                    <p className="text-[10px] text-sb-on-surface-variant/40">Promedio</p>
                  </div>
                </div>

                {/* Performance bar */}
                {selected.grades.length > 0 && (
                  <div className="bg-sb-surface-container/50 rounded-[6px] p-4 mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-sb-on-surface-variant/40" />
                        <span className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">Rendimiento</span>
                      </div>
                      <span className={`text-sm font-bold ${getGradeColor(calcAverage(selected.grades))}`}>{calcAverage(selected.grades)}/{MAX_SCORE}</span>
                    </div>
                    <div className="h-3 rounded-[6px] bg-sb-surface-container overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(calcAverage(selected.grades) / MAX_SCORE) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className={`h-full rounded-[6px] ${getGradeBarColor(calcAverage(selected.grades))}`}
                      />
                    </div>
                  </div>
                )}

                {/* Grades list */}
                <div className="mb-5">
                  <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-3">Historial de Notas</p>
                  <div className="space-y-2">
                    {selected.grades.map((g) => (
                      <div key={g.id} className="flex items-center gap-3 bg-sb-surface-container/30 rounded-[6px] px-4 py-3 group">
                        {editGradeId === g.id ? (
                          <>
                            <input type="number" min={0} max={MAX_SCORE} value={editScore} onChange={e => setEditScore(e.target.value)}
                              className="sb-input rounded-[6px] text-sm h-8 w-16 text-center" autoFocus />
                            <button onClick={() => handleSaveGrade(selected.id, g.id, Number(editScore))}
                              className="h-8 px-3 rounded-[6px] bg-sb-on-surface text-sb-surface text-xs font-medium hover:bg-sb-on-surface/90 transition-colors">
                              Guardar
                            </button>
                            <button onClick={() => { setEditGradeId(null); setEditScore("") }}
                              className="h-8 px-3 rounded-[6px] bg-sb-surface-container text-sb-on-surface-variant/60 text-xs font-medium hover:bg-sb-surface-container-high transition-colors">
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <div className={`h-9 w-9 rounded-[6px] flex items-center justify-center shrink-0 ${getGradeBg(g.score)}`}>
                              <span className={`text-sm font-bold ${getGradeColor(g.score)}`}>{g.score}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-sb-on-surface">{g.period}</p>
                              <p className="text-[10px] text-sb-on-surface-variant/40">
                                {new Date(g.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                                {g.notes ? ` · ${g.notes}` : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditGradeId(g.id); setEditScore(g.score.toString()) }}
                                className="h-7 w-7 rounded-[6px] flex items-center justify-center text-sb-on-surface-variant/40 hover:text-sb-on-surface hover:bg-sb-surface-container transition-colors">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => handleDeleteGrade(g.id)}
                                className="h-7 w-7 rounded-[6px] flex items-center justify-center text-sb-on-surface-variant/40 hover:text-red-500 hover:bg-red-500/10 transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    {selected.grades.length === 0 && (
                      <div className="text-center py-8 rounded-[6px] border border-dashed border-sb-outline-variant/30">
                        <BookMarked className="h-8 w-8 mx-auto mb-2 text-sb-on-surface-variant/20" />
                        <p className="text-sm text-sb-on-surface-variant/40">Sin calificaciones</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Add new grade */}
                <div className="bg-sb-surface-container/30 rounded-[6px] p-4">
                  <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-3">Agregar Nota</p>
                  <div className="grid grid-cols-3 gap-2">
                    <select value={newPeriod} onChange={e => setNewPeriod(e.target.value)}
                      className="sbf-native-select text-sm">
                      <option value="">Bimestre</option>
                      {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <input type="number" min={0} max={MAX_SCORE} placeholder="Nota" value={newScore} onChange={e => setNewScore(e.target.value)}
                      className="sb-input rounded-[6px] text-sm h-9" />
                    <input placeholder="Comentario" value={newNotes} onChange={e => setNewNotes(e.target.value)}
                      className="sb-input rounded-[6px] text-sm h-9" />
                  </div>
                  <button onClick={() => handleAddGrade(selected.id)} disabled={!newPeriod || !newScore}
                    className="w-full mt-2 h-9 rounded-[6px] bg-sb-on-surface text-sb-surface text-xs font-medium disabled:opacity-30 hover:bg-sb-on-surface/90 transition-colors">
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
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Curso</label>
              <select value={registerCourseId} onChange={e => { setRegisterCourseId(e.target.value); setRegisterStudentId("") }}
                className="sbf-native-select w-full">
                {courses.map(c => <option key={c.id} value={c.id}>{c.name} · {c.grade} &quot;{c.section}&quot;</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Alumno</label>
              <select value={registerStudentId} onChange={e => setRegisterStudentId(e.target.value)} disabled={registerCourseId !== courseId}
                className="sbf-native-select w-full disabled:opacity-50">
                <option value="">{registerCourseId === courseId ? "Seleccionar alumno..." : "Selecciona primero el curso en la vista"}</option>
                {registerStudents.map(s => <option key={s.id} value={s.id}>{studentName(s)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Bimestre</label>
              <select value={registerPeriod} onChange={e => setRegisterPeriod(e.target.value)} className="sbf-native-select w-full">
                <option value="">Seleccionar bimestre...</option>
                {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Nota (0-{MAX_SCORE})</label>
              <input type="number" min={0} max={MAX_SCORE} placeholder="15" value={registerScore} onChange={e => setRegisterScore(e.target.value)}
                className="sb-input rounded-[6px] text-sm h-10 w-full" />
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
  )
}
