"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Plus, BookMarked, TrendingUp, TrendingDown, Pencil, Trash2, Download } from "@/components/ui/proicons"
import { useAuthStore } from "@/stores/auth-store"
import { SbSectionHeader, SbBtn } from "@/components/ui/sb"

interface Grade {
  id: string; student_id: string; course_id: string; period: string
  score: number; max_score: number; notes: string | null; created_at: string
}
interface Student {
  id: string; code: string; first_name: string; last_name: string
  document_number: string; grade: string; section: string; grades: Grade[]
}
interface Course {
  id: string; name: string; code: string; grade: string; section: string
}

const PERIODS = ["Bimestre 1", "Bimestre 2", "Bimestre 3", "Bimestre 4"]
const MAX_SCORE = 20

function getInitials(name: string) { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) }

function calcAverage(grades: Grade[]) {
  if (grades.length === 0) return 0
  return Number((grades.reduce((a, g) => a + Number(g.score), 0) / grades.length).toFixed(1))
}

function studentName(s: Student) { return `${s.first_name} ${s.last_name}` }

function gradeColor(g: number) {
  if (g >= 18) return { text: "text-emerald-600", bg: "bg-emerald-500/10", label: "AD" }
  if (g >= 14) return { text: "text-emerald-600", bg: "bg-emerald-500/8", label: "A" }
  if (g >= 11) return { text: "text-amber-600", bg: "bg-amber-500/10", label: "B" }
  return { text: "text-red-600", bg: "bg-red-500/10", label: "C" }
}

export default function CalificacionesPage() {
  return <React.Suspense fallback={null}><CalificacionesInner /></React.Suspense>
}

function CalificacionesInner() {
  const searchParams = useSearchParams()
  const user = useAuthStore((s) => s.user)
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
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }, [])

  const loadCourseData = React.useCallback(async (id: string) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/docente/calificaciones?course_id=${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al cargar")
      setStudents(Array.isArray(data.students) ? data.students : [])
      if (data.course) setCourseLabel(`${data.course.name} · ${data.course.grade} "${data.course.section}"`)
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }, [])

  React.useEffect(() => { loadCourses() }, [loadCourses])
  React.useEffect(() => { if (courseId) loadCourseData(courseId) }, [courseId, loadCourseData])

  React.useEffect(() => {
    if (!registerCourseId || !registerOpen) { setRegisterStudents([]); return }
    if (registerCourseId === courseId) { setRegisterStudents(students); return }
    ;(async () => {
      try { const res = await fetch(`/api/docente/calificaciones?course_id=${registerCourseId}`); const data = await res.json(); setRegisterStudents(Array.isArray(data.students) ? data.students : []) } catch { setRegisterStudents([]) }
    })()
  }, [registerCourseId, registerOpen, courseId, students])

  const handleSaveGrade = async (studentId: string, gradeId: string, newScore: number) => {
    try {
      const target = selected?.grades.find(g => g.id === gradeId)
      if (!target) return
      await fetch("/api/docente/calificaciones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ student_id: studentId, course_id: target.course_id, period: target.period, score: newScore, max_score: MAX_SCORE }) })
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
    const res = await fetch("/api/docente/calificaciones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ student_id: studentId, course_id: courseId, period: newPeriod, score: Number(newScore), max_score: MAX_SCORE, notes: newNotes || null }) })
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
      await fetch("/api/docente/calificaciones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ student_id: registerStudentId, course_id: registerCourseId, period: registerPeriod, score: Number(registerScore), max_score: MAX_SCORE }) })
      setRegisterOpen(false); setRegisterStudentId(""); setRegisterPeriod(""); setRegisterScore("")
      if (registerCourseId === courseId) loadCourseData(courseId)
      else { setCourseId(registerCourseId); setRegisterCourseId(registerCourseId) }
    } finally { setSaving(false) }
  }

  const handleSaveCell = async (studentId: string, period: string, rawValue: string) => {
    const value = Number(rawValue)
    if (rawValue === "" || isNaN(value) || value < 0 || value > MAX_SCORE) return
    const cellKey = `${studentId}:${period}`
    setSavingCell(cellKey); setSaveError(null)
    try {
      const res = await fetch("/api/docente/calificaciones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ student_id: studentId, course_id: courseId, period, score: value, max_score: MAX_SCORE }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al guardar")
      loadCourseData(courseId)
    } catch (e: any) { setSaveError(e.message) } finally { setSavingCell(null) }
  }

  const getTrend = (grades: Grade[]) => {
    if (grades.length < 2) return true
    const sorted = [...grades].sort((a, b) => a.period.localeCompare(b.period))
    return sorted[sorted.length - 1].score >= sorted[sorted.length - 2].score
  }

  const exportPDF = async () => {
    const { jsPDF } = await import("jspdf")
    const autoTable = (await import("jspdf-autotable")).default
    const doc = new jsPDF("landscape")
    doc.setFontSize(16); doc.text(`Libro de Calificaciones — ${courseLabel}`, 14, 15)
    doc.setFontSize(10); doc.text(`Generado: ${new Date().toLocaleDateString("es-PE")} | Docente: ${user?.full_name || ""}`, 14, 22)
    const periods = [...new Set(students.flatMap(s => s.grades.map(g => g.period)))].sort()
    const head = [["#", "Alumno", "DNI", ...periods, "Promedio"]]
    const body = students.map((s, i) => {
      const avg = calcAverage(s.grades); const row: (string | number)[] = [i + 1, studentName(s), s.document_number || ""]
      for (const p of periods) { const g = s.grades.find(gr => gr.period === p); row.push(g ? Number(g.score) : "-") }
      row.push(avg || "-"); return row
    })
    autoTable(doc, { head, body, startY: 28, styles: { fontSize: 9, cellPadding: 3 }, headStyles: { fillColor: [30, 30, 30] }, alternateRowStyles: { fillColor: [245, 245, 245] } })
    doc.save(`calificaciones_${courseLabel.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`)
  }

  const averages = students.map(s => calcAverage(s.grades))
  const avgGeneral = averages.length ? (averages.reduce((a, b) => a + b, 0) / averages.length) : 0
  const bestScore = students.length ? Math.max(...students.map(s => s.grades.length ? Math.max(...s.grades.map(g => g.score)) : 0)) : 0
  const approvedCount = students.filter(s => calcAverage(s.grades) >= 11 && calcAverage(s.grades) > 0).length
  const approvedPct = students.length ? Math.round((approvedCount / students.length) * 100) : 0

  return (
    <div className="space-y-5">
      <SbSectionHeader title="Calificaciones" description="Gestiona las notas de tus alumnos"
        action={
          <div className="flex items-center gap-2">
            <SbBtn variant="filled" rounded className="flex items-center gap-2" onClick={() => setRegisterOpen(true)} disabled={!courses.length}>
              <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Registrar</span>
            </SbBtn>
            {students.length > 0 && (
              <SbBtn variant="outlined" rounded className="flex items-center gap-2" onClick={exportPDF}>
                <Download className="h-4 w-4" /> <span className="hidden sm:inline">PDF</span>
              </SbBtn>
            )}
          </div>
        }
      />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="sm:w-64">
          <select value={courseId} onChange={e => setCourseId(e.target.value)} disabled={loading}
            className="sb-select w-full text-[13px]">
            {courses.length === 0 && <option value="">Sin cursos asignados</option>}
            {courses.map(c => <option key={c.id} value={c.id}>{c.name} · {c.grade} &quot;{c.section}&quot;</option>)}
          </select>
        </div>
        {students.length > 0 && (
          <div className="flex items-center gap-1 p-1 bg-sb-surface-container rounded-2xl">
            {([["lista", "Lista"], ["tabla", "Notas"]] as const).map(([key, label]) => (
              <button key={key} onClick={() => setViewMode(key)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${viewMode === key ? "bg-sb-on-surface text-sb-surface" : "text-sb-on-surface-variant/50 hover:text-sb-on-surface/70"}`}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="animate-pulse space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-2xl bg-sb-surface-container" />)}</div>
          <div className="h-96 rounded-2xl bg-sb-surface-container" />
        </div>
      ) : students.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-sb-surface border border-sb-outline-variant/10">
          <BookMarked className="h-12 w-12 mx-auto mb-4 text-sb-on-surface-variant/15" />
          <p className="text-sm font-medium text-sb-on-surface-variant/50">
            {courseLabel ? "Sin alumnos matriculados en este curso" : "Selecciona un curso para ver calificaciones"}
          </p>
        </div>
      ) : viewMode === "tabla" ? (
        <TablaNotas key={courseId} students={students} courseId={courseId} maxScore={MAX_SCORE} savingCell={savingCell} saveError={saveError} onSaveCell={handleSaveCell} />
      ) : (
        <>
          {/* HERO STATS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Promedio General", value: avgGeneral.toFixed(1), sub: `de ${MAX_SCORE}`, pct: (avgGeneral / MAX_SCORE) * 100 },
              { label: "Mejor Nota", value: bestScore, sub: "puntuación máxima", pct: (bestScore / MAX_SCORE) * 100 },
              { label: "Aprobados", value: `${approvedPct}%`, sub: `${approvedCount} de ${students.length}`, pct: approvedPct },
              { label: "Total Alumnos", value: students.length, sub: "matriculados", pct: 100 },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl bg-sb-surface border border-sb-outline-variant/10 p-4 transition-all duration-300 hover:scale-[1.02]">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 mb-2">{s.label}</p>
                <p className="text-2xl font-semibold leading-none text-sb-on-surface">{s.value}</p>
                <p className="text-[10px] mt-1 text-sb-on-surface-variant/50">{s.sub}</p>
                <div className="h-1 rounded-full mt-3 overflow-hidden bg-sb-surface-container">
                  <div className="h-full rounded-full transition-all duration-700 bg-sb-on-surface" style={{ width: `${Math.min(s.pct, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* STUDENT LIST */}
          <div className="rounded-2xl bg-sb-surface border border-sb-outline-variant/10 overflow-hidden divide-y divide-sb-outline-variant/10">
            {students.map(s => {
              const avg = calcAverage(s.grades)
              const trend = getTrend(s.grades)
              return (
                <div key={s.id}
                  onClick={() => { setSelected(s); setEditGradeId(null); setNewPeriod(""); setNewScore(""); setNewNotes(""); setDetailOpen(true) }}
                  className="flex items-center justify-between px-4 py-3.5 transition-all duration-200 cursor-pointer group hover:bg-sb-surface-container-low/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 bg-sb-surface-container">
                      <span className="text-[10px] font-semibold text-sb-on-surface-variant/60">{getInitials(studentName(s))}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-sb-on-surface">{studentName(s)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-sb-on-surface-variant/50">{s.grades.length} notas</span>
                        {s.grades.slice(-4).map((g, j) => (
                          <span key={j} className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${gradeColor(g.score).bg} ${gradeColor(g.score).text}`}>{g.score}</span>
                        ))}
                        {s.grades.length > 4 && <span className="text-[10px] text-sb-on-surface-variant/50">+{s.grades.length - 4}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {trend ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500/60" /> : <TrendingDown className="h-3.5 w-3.5 text-sb-on-surface-variant/40" />}
                    <div className="w-16 h-1.5 rounded-full overflow-hidden bg-sb-surface-container">
                      <div className="h-full rounded-full transition-all duration-500 bg-sb-on-surface" style={{ width: `${(avg / MAX_SCORE) * 100}%` }} />
                    </div>
                    <span className={`text-base font-semibold w-8 text-right ${avg === 0 ? "text-sb-on-surface-variant/30" : "text-sb-on-surface"}`}>{avg === 0 ? "—" : avg}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* DETAIL MODAL */}
      {detailOpen && selected && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => setDetailOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-[560px] max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:hidden rounded-2xl bg-sb-surface border border-sb-outline-variant/10" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 z-10 px-6 pt-6 pb-4 bg-sb-surface border-b border-sb-outline-variant/10">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-sb-surface-container">
                  <span className="text-sm font-semibold text-sb-on-surface-variant/60">{getInitials(studentName(selected))}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold truncate text-sb-on-surface">{studentName(selected)}</p>
                  <p className="text-[11px] mt-0.5 text-sb-on-surface-variant/50">{courseLabel} · {selected.grades.length} calificaciones</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-semibold text-sb-on-surface">{selected.grades.length ? calcAverage(selected.grades) : "—"}</p>
                  <p className="text-[10px] text-sb-on-surface-variant/50">Promedio</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Progress */}
              {selected.grades.length > 0 && (
                <div className="p-4 rounded-xl bg-sb-surface-container-low/50 border border-sb-outline-variant/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50">Rendimiento</span>
                    <span className="text-sm font-semibold text-sb-on-surface">{calcAverage(selected.grades)}/{MAX_SCORE}</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden bg-sb-surface-container">
                    <div className="h-full rounded-full transition-all duration-700 bg-sb-on-surface" style={{ width: `${(calcAverage(selected.grades) / MAX_SCORE) * 100}%` }} />
                  </div>
                </div>
              )}

              {/* Grades */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 mb-3">Historial de Notas</p>
                <div className="space-y-2">
                  {selected.grades.map(g => (
                    <div key={g.id} className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors group bg-sb-surface-container-low/50 hover:bg-sb-surface-container">
                      {editGradeId === g.id ? (
                        <>
                          <input type="number" min={0} max={MAX_SCORE} value={editScore} onChange={e => setEditScore(e.target.value)} autoFocus
                            className="h-9 w-16 text-center text-sm font-semibold rounded-xl bg-sb-surface-container text-sb-on-surface border border-sb-outline-variant/20 outline-none focus:ring-2 focus:ring-sb-primary/30 transition-all" />
                          <div className="flex-1 flex items-center gap-1">
                            <SbBtn variant="filled" rounded size="sm" onClick={() => handleSaveGrade(selected.id, g.id, Number(editScore))}>Guardar</SbBtn>
                            <SbBtn variant="tonal" rounded size="sm" onClick={() => { setEditGradeId(null); setEditScore("") }}>Cancelar</SbBtn>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${gradeColor(g.score).bg}`}>
                            <span className={`text-sm font-semibold ${gradeColor(g.score).text}`}>{g.score}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-sb-on-surface">{g.period}</p>
                            <p className="text-[10px] truncate text-sb-on-surface-variant/50">
                              {new Date(g.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}{g.notes ? ` · ${g.notes}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditGradeId(g.id); setEditScore(g.score.toString()) }} className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors text-sb-on-surface-variant/50 hover:bg-sb-surface-container-high">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDeleteGrade(g.id)} className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors text-sb-on-surface-variant/50 hover:bg-sb-surface-container-high">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {selected.grades.length === 0 && (
                    <div className="text-center py-16 rounded-xl border border-dashed border-sb-outline-variant/20">
                      <BookMarked className="h-10 w-10 mx-auto mb-3 text-sb-on-surface-variant/15" />
                      <p className="text-sm text-sb-on-surface-variant/50">Sin calificaciones</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Add Grade */}
              <div className="p-4 rounded-xl bg-sb-surface-container-low/50 border border-sb-outline-variant/10">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 mb-3">Agregar Nota</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select value={newPeriod} onChange={e => setNewPeriod(e.target.value)} className="sb-select w-full text-sm h-10">
                    <option value="">Bimestre</option>
                    {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input type="number" min={0} max={MAX_SCORE} placeholder="Nota" value={newScore} onChange={e => setNewScore(e.target.value)} className="sb-input rounded-xl text-sm h-10" />
                  <input placeholder="Comentario" value={newNotes} onChange={e => setNewNotes(e.target.value)} className="sb-input rounded-xl text-sm h-10" />
                </div>
                <SbBtn variant="filled" rounded className="w-full mt-3 h-10 text-sm font-semibold" onClick={() => handleAddGrade(selected.id)} disabled={!newPeriod || !newScore}>
                  Agregar
                </SbBtn>
              </div>
            </div>

            {/* Close */}
            <div className="sticky bottom-0 px-6 py-4 bg-sb-surface border-t border-sb-outline-variant/10">
              <SbBtn variant="tonal" rounded className="w-full h-10 text-sm font-medium" onClick={() => setDetailOpen(false)}>Cerrar</SbBtn>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER DIALOG */}
      {registerOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => setRegisterOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-[420px] rounded-2xl bg-sb-surface border border-sb-outline-variant/10" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4">
              <h3 className="text-lg font-semibold text-sb-on-surface">Registrar calificación</h3>
              <p className="text-[11px] mt-1 text-sb-on-surface-variant/50">Completa los datos para registrar una nota</p>
            </div>
            <div className="px-6 space-y-4 pb-2">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 mb-1.5 block">Curso</label>
                <select value={registerCourseId} onChange={e => { setRegisterCourseId(e.target.value); setRegisterStudentId("") }} className="sb-select w-full text-sm h-10">
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name} · {c.grade} &quot;{c.section}&quot;</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 mb-1.5 block">Alumno</label>
                <select value={registerStudentId} onChange={e => setRegisterStudentId(e.target.value)} className="sb-select w-full text-sm h-10">
                  <option value="">{registerStudents.length > 0 ? "Seleccionar alumno..." : "Cargando alumnos..."}</option>
                  {registerStudents.map(s => <option key={s.id} value={s.id}>{studentName(s)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 mb-1.5 block">Bimestre</label>
                <select value={registerPeriod} onChange={e => setRegisterPeriod(e.target.value)} className="sb-select w-full text-sm h-10">
                  <option value="">Seleccionar bimestre...</option>
                  {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 mb-1.5 block">Nota (0-{MAX_SCORE})</label>
                <input type="number" min={0} max={MAX_SCORE} placeholder="15" value={registerScore} onChange={e => setRegisterScore(e.target.value)} className="sb-input rounded-xl text-sm h-10 w-full" />
              </div>
            </div>
            <div className="px-6 py-4 flex items-center gap-2 border-t border-sb-outline-variant/10">
              <SbBtn variant="tonal" rounded className="flex-1 h-10 text-sm font-medium" onClick={() => setRegisterOpen(false)}>Cancelar</SbBtn>
              <SbBtn variant="filled" rounded className="flex-1 h-10 text-sm font-semibold" disabled={!registerStudentId || !registerScore || !registerPeriod || saving} onClick={handleRegister}>
                {saving ? "Guardando..." : "Guardar"}
              </SbBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* TABLE VIEW */
function TablaNotas({ students, courseId, maxScore, savingCell, saveError, onSaveCell }: {
  students: Student[]; courseId: string; maxScore: number; savingCell: string | null; saveError: string | null; onSaveCell: (studentId: string, period: string, rawValue: string) => void
}) {
  const [drafts, setDrafts] = React.useState<Record<string, string>>({})
  const approvedCount = students.filter(s => calcAverage(s.grades) >= 11 && calcAverage(s.grades) > 0).length
  const disapprovedCount = students.filter(s => { const a = calcAverage(s.grades); return a > 0 && a < 11 }).length
  const noGradeCount = students.filter(s => s.grades.length === 0).length
  const gradeFor = (s: Student, period: string) => s.grades.find(g => g.period === period)
  const cellKey = (studentId: string, period: string) => `${studentId}:${period}`
  const commit = (studentId: string, period: string) => { const key = cellKey(studentId, period); const value = drafts[key]; if (value === undefined) return; onSaveCell(studentId, period, value) }

  return (
    <div className="rounded-2xl bg-sb-surface border border-sb-outline-variant/10 overflow-hidden">
      {saveError && <div className="px-5 pt-4"><div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-600">{saveError}</div></div>}
      <div className="px-5 pt-5 pb-4 border-b border-sb-outline-variant/10">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50">Libro de notas</p>
            <p className="text-[11px] mt-0.5 text-sb-on-surface-variant/50">Escribe la nota (0-{maxScore}) y presiona Enter para guardar</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-sb-on-surface-variant/50">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> {approvedCount} Aprobados</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400/60" /> {disapprovedCount} Desaprobados</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sb-on-surface-variant/30" /> {noGradeCount} Sin nota</span>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-sb-surface-container/50">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50">Alumno</th>
              {PERIODS.map(p => <th key={p} className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50">B{p.split(" ")[1]}</th>)}
              <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50">Promedio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sb-outline-variant/10">
            {students.map(s => {
              const avg = calcAverage(s.grades)
              return (
                <tr key={s.id} className="transition-colors hover:bg-sb-surface-container-low/50">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 bg-sb-surface-container">
                        <span className="text-[9px] font-semibold text-sb-on-surface-variant/60">{getInitials(studentName(s))}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate max-w-[160px] text-sb-on-surface">{studentName(s)}</p>
                        <p className="text-[9px] text-sb-on-surface-variant/50">{s.code}</p>
                      </div>
                    </div>
                  </td>
                  {PERIODS.map(p => {
                    const g = gradeFor(s, p); const key = cellKey(s.id, p); const value = drafts[key] !== undefined ? drafts[key] : g ? String(g.score) : ""; const isSaving = savingCell === key
                    return (
                      <td key={p} className="px-3 py-2 text-center">
                        <div className="relative inline-block">
                          <input type="number" min={0} max={maxScore} step="0.5" value={value} placeholder="—"
                            onChange={e => setDrafts(prev => ({ ...prev, [key]: e.target.value }))}
                            onBlur={() => commit(s.id, p)} onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
                            className={`w-14 h-9 rounded-xl text-center text-sm font-semibold bg-sb-surface-container border border-sb-outline-variant/20 outline-none focus:ring-2 focus:ring-sb-primary/30 transition-all ${g ? (g.score >= 11 ? "text-sb-on-surface" : "text-amber-600") : "text-sb-on-surface-variant/50 opacity-60"}`} />
                          {isSaving && <span className="absolute -top-1 -right-1 h-2.5 w-2.5"><span className="absolute inset-0 rounded-full animate-ping bg-sb-primary/40" /><span className="absolute inset-0 rounded-full bg-sb-primary" /></span>}
                        </div>
                      </td>
                    )
                  })}
                  <td className="px-4 py-2 text-center">
                    <span className={`text-base font-semibold ${avg === 0 ? "text-sb-on-surface-variant/30" : "text-sb-on-surface"}`}>{avg === 0 ? "—" : avg.toFixed(1)}</span>
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
