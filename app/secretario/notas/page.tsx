"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GraduationCap, BookOpen, Check, X, Search, TrendingUp, TrendingDown, Minus, Save, ChevronDown } from "lucide-react"
import { SbInput, SbBtn } from "@/components/ui/sb"

interface Course { id: string; name: string; code: string; grade: string; section: string; teacher_name: string }
interface Grade { id?: string; student_id: string; student_name: string; score: number | null; max_score: number; course_name?: string }
interface Student { id: string; nombre: string; apellido: string; grade: string; section: string }

const PERIODS = ["Bimestre 1", "Bimestre 2", "Bimestre 3", "Bimestre 4"]

function normalizeGrade(grade?: string): number | null {
  if (!grade) return null
  const m = grade.match(/(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

export default function NotasSecretarioPage() {
  const [cursos, setCursos] = React.useState<Course[]>([])
  const [courseId, setCourseId] = React.useState("")
  const [period, setPeriod] = React.useState("Bimestre 1")
  const [students, setStudents] = React.useState<Student[]>([])
  const [grades, setGrades] = React.useState<Grade[]>([])
  const [scores, setScores] = React.useState<Record<string, string>>({})
  const [saving, setSaving] = React.useState<Record<string, boolean>>({})
  const [savingAll, setSavingAll] = React.useState(false)
  const [bulkValue, setBulkValue] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [toast, setToast] = React.useState<{ msg: string; type: "success" | "error" } | null>(null)
  const autoSaveTimer = React.useRef<Record<string, NodeJS.Timeout>>({})

  const selectedCourse = cursos.find(c => c.id === courseId)

  React.useEffect(() => {
    fetch("/api/secretario/cursos")
      .then(r => r.ok ? r.json() : [])
      .then(setCursos)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    if (!courseId || !period) { setStudents([]); setGrades([]); setScores({}); return }
    setLoading(true)
    setError("")
    const course = cursos.find(c => c.id === courseId)
    const courseGrade = normalizeGrade(course?.grade)
    const courseSection = course?.section || ""
    Promise.all([
      fetch(`/api/secretario/busqueda`).then(r => r.ok ? r.json() : []),
      fetch(`/api/secretario/grades?course_id=${courseId}&period=${encodeURIComponent(period)}`).then(r => r.ok ? r.json() : []),
    ])
      .then(([studentsData, gradesData]) => {
        const all = Array.isArray(studentsData) ? studentsData : []
        const filtered = all.filter((s: any) => {
          const gNum = normalizeGrade(s.grade_level || s.grade)
          if (gNum === null || courseGrade === null) return false
          if (gNum !== courseGrade) return false
          if (courseSection && (s.section || "") !== courseSection) return false
          return true
        })
        setStudents(filtered.map((s: any) => ({
          id: s.id,
          nombre: (s.full_name || "").split(" ")[0] || s.full_name || "",
          apellido: (s.full_name || "").split(" ").slice(1).join(" "),
          grade: s.grade_level || s.grade,
          section: s.section || "",
        })))
        setGrades(Array.isArray(gradesData) ? gradesData : [])
        const scoreMap: Record<string, string> = {}
        if (Array.isArray(gradesData)) {
          for (const g of gradesData) {
            if (g.score !== null && g.score !== undefined) scoreMap[g.student_id] = String(g.score)
          }
        }
        setScores(scoreMap)
      })
      .catch(() => setError("Error al cargar datos"))
      .finally(() => setLoading(false))
  }, [courseId, period, cursos])

  const combined = students.map(s => ({
    id: s.id,
    name: `${s.nombre} ${s.apellido}`,
    gradeId: grades.find(g => g.student_id === s.id)?.id,
    score: scores[s.id] !== undefined ? scores[s.id] : "",
    maxScore: grades.find(g => g.student_id === s.id)?.max_score ?? 20,
  }))

  const numericScores = combined.map(c => parseFloat(c.score)).filter(n => !isNaN(n))
  const avg = numericScores.length ? (numericScores.reduce((a, b) => a + b, 0) / numericScores.length) : 0
  const maxScore = numericScores.length ? Math.max(...numericScores) : 0
  const minScore = numericScores.length ? Math.min(...numericScores) : 0
  const passingCount = numericScores.filter(n => n >= 14).length
  const failCount = numericScores.filter(n => n < 11).length
  const riskCount = numericScores.filter(n => n >= 11 && n < 14).length

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const saveScore = async (studentId: string, value: string) => {
    const num = parseFloat(value)
    if (isNaN(num) || num < 0 || num > 20) return

    setSaving(prev => ({ ...prev, [studentId]: true }))
    const existing = grades.find(g => g.student_id === studentId)

    try {
      if (existing?.id) {
        const res = await fetch(`/api/secretario/grades/${existing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score: num, notes: "" }),
        })
        if (!res.ok) throw new Error()
      } else {
        const res = await fetch("/api/secretario/grades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student_id: studentId, course_id: courseId, period, score: num, max_score: 20 }),
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setGrades(prev => [...prev, { id: data.id, student_id: studentId, student_name: data.student_name || "", score: num, max_score: 20 }])
      }
    } catch {
      showToast("Error al guardar", "error")
    } finally {
      setSaving(prev => ({ ...prev, [studentId]: false }))
    }
  }

  const handleScoreChange = (studentId: string, value: string) => {
    if (value !== "" && (isNaN(Number(value)) || value.startsWith(".") || value.endsWith("."))) return
    const num = parseFloat(value)
    if (value !== "" && (num < 0 || num > 20)) return

    setScores(prev => ({ ...prev, [studentId]: value }))

    if (autoSaveTimer.current[studentId]) clearTimeout(autoSaveTimer.current[studentId])
    autoSaveTimer.current[studentId] = setTimeout(() => {
      if (value !== "") saveScore(studentId, value)
    }, 800)
  }

  const handleBlur = (studentId: string) => {
    if (autoSaveTimer.current[studentId]) {
      clearTimeout(autoSaveTimer.current[studentId])
      delete autoSaveTimer.current[studentId]
    }
    const val = scores[studentId]
    if (val !== undefined && val !== "") saveScore(studentId, val)
  }

  const handleBulkFill = () => {
    const num = parseFloat(bulkValue)
    if (isNaN(num) || num < 0 || num > 20) return
    const newScores: Record<string, string> = {}
    for (const s of students) newScores[s.id] = String(num)
    setScores(prev => ({ ...prev, ...newScores }))
  }

  const handleSaveAll = async () => {
    setSavingAll(true)
    const entries = Object.entries(scores).filter(([, v]) => v !== "")
    let success = true
    for (const [sid, val] of entries) {
      try {
        const num = parseFloat(val)
        if (isNaN(num)) continue
        const existing = grades.find(g => g.student_id === sid)
        if (existing?.id) {
          const res = await fetch(`/api/secretario/grades/${existing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ score: num, notes: "" }),
          })
          if (!res.ok) { success = false; break }
        } else {
          const res = await fetch("/api/secretario/grades", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ student_id: sid, course_id: courseId, period, score: num, max_score: 20 }),
          })
          if (!res.ok) { success = false; break }
          const data = await res.json()
          setGrades(prev => [...prev, { id: data.id, student_id: sid, student_name: data.student_name || "", score: num, max_score: 20 }])
        }
      } catch { success = false; break }
    }
    showToast(success ? "Notas guardadas correctamente" : "Error al guardar algunas notas", success ? "success" : "error")
    setSavingAll(false)
  }

  const getScoreStyle = (val: string) => {
    const n = parseFloat(val)
    if (isNaN(n)) return { color: "text-sb-on-surface/60", bg: "", ring: "" }
    if (n >= 14) return { color: "text-emerald-600", bg: "bg-emerald-500/8", ring: "ring-emerald-500/20" }
    if (n >= 11) return { color: "text-amber-600", bg: "bg-amber-500/8", ring: "ring-amber-500/20" }
    return { color: "text-red-600", bg: "bg-red-500/8", ring: "ring-red-500/20" }
  }

  const getScoreLabel = (val: string) => {
    const n = parseFloat(val)
    if (isNaN(n)) return null
    if (n >= 14) return { label: "Aprobado", color: "text-emerald-600", bg: "bg-emerald-500/10" }
    if (n >= 11) return { label: "En riesgo", color: "text-amber-600", bg: "bg-amber-500/10" }
    return { label: "Desaprobado", color: "text-red-600", bg: "bg-red-500/10" }
  }

  return (
    <div className="space-y-5">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Registro de Notas</h1>
              <p className="text-sm text-sb-on-surface-variant/50 mt-1">
                Ingresa y gestiona las calificaciones de los estudiantes
              </p>
            </div>
            <SbBtn
              variant="filled"
              className="gap-2 text-xs"
              onClick={handleSaveAll}
              disabled={savingAll || !courseId || combined.length === 0}
            >
              <Save className="h-3.5 w-3.5" />
              {savingAll ? "Guardando..." : "Guardar todo"}
            </SbBtn>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
          <div className="bg-sb-surface rounded-2xl p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Course */}
              <div className="md:col-span-2">
                <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2 block">Curso</label>
                <div className="relative">
                  <select
                    value={courseId}
                    onChange={e => setCourseId(e.target.value)}
                    className="sbf-native-select w-full"
                  >
                    <option value="">Seleccionar curso...</option>
                    {cursos.map(c => (
                      <option key={c.id} value={c.id}>{c.name} — {c.grade} {c.section}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Period */}
              <div>
                <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2 block">Periodo</label>
                <div className="flex gap-1.5">
                  {PERIODS.map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`flex-1 px-2 py-2 rounded-lg text-[11px] font-medium transition-all ${
                        period === p
                          ? "bg-sb-on-surface text-sb-surface"
                          : "bg-sb-surface-container text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high"
                      }`}
                    >
                      {p.replace("Bimestre ", "B")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bulk Fill */}
              <div>
                <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2 block">Llenado rápido</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={20}
                    step={0.5}
                    placeholder="0-20"
                    value={bulkValue}
                    onChange={e => setBulkValue(e.target.value === "" ? "" : String(Math.min(20, Math.max(0, Number(e.target.value)))))}
                    className="sb-input rounded-xl text-sm h-10 w-20 text-center"
                  />
                  <button
                    onClick={handleBulkFill}
                    disabled={!bulkValue || !courseId || students.length === 0}
                    className="h-10 px-4 rounded-xl text-xs font-medium bg-sb-surface-container text-sb-on-surface-variant/70 hover:bg-sb-surface-container-high transition-colors disabled:opacity-40"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        {courseId && combined.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-px rounded-2xl overflow-hidden bg-sb-outline-variant/15">
              {[
                { label: "Total", value: numericScores.length || "—", icon: GraduationCap, color: "text-sb-on-surface" },
                { label: "Promedio", value: avg ? avg.toFixed(1) : "—", icon: TrendingUp, color: "text-sb-on-surface" },
                { label: "Máxima", value: maxScore ? maxScore.toFixed(1) : "—", icon: TrendingUp, color: "text-emerald-600" },
                { label: "Mínima", value: minScore ? minScore.toFixed(1) : "—", icon: TrendingDown, color: "text-red-600" },
                { label: "Aprobados", value: passingCount || "—", icon: Check, color: "text-emerald-600" },
              ].map((s, i) => {
                const Icon = s.icon
                return (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.12 + i * 0.03 }}
                    className="bg-sb-surface p-4 text-center"
                  >
                    <Icon className={`h-4 w-4 mx-auto mb-1.5 ${s.color}/60`} />
                    <p className="text-lg font-bold tracking-tight text-sb-on-surface">{s.value}</p>
                    <p className="text-[10px] text-sb-on-surface-variant/40 mt-0.5">{s.label}</p>
                  </motion.div>
                )
              })}
            </div>

            {/* Progress Bar */}
            <div className="mt-3 bg-sb-surface rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">Distribución de notas</p>
              </div>
              <div className="h-2 bg-sb-surface-container rounded-full overflow-hidden flex">
                {passingCount > 0 && (
                  <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(passingCount / numericScores.length) * 100}%` }} />
                )}
                {riskCount > 0 && (
                  <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${(riskCount / numericScores.length) * 100}%` }} />
                )}
                {failCount > 0 && (
                  <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${(failCount / numericScores.length) * 100}%` }} />
                )}
              </div>
              <div className="flex gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-[11px] text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Aprobados ({passingCount})
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-amber-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> En riesgo ({riskCount})
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-red-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Desaprobados ({failCount})
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/8 border border-red-500/15 text-sm text-red-600">
            <X className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="h-6 w-6 rounded-full border-2 border-sb-primary/30 border-t-sb-primary animate-spin mx-auto" />
            <p className="text-xs text-sb-on-surface-variant/30 mt-3">Cargando...</p>
          </div>
        )}

        {/* Empty States */}
        {!loading && !courseId && (
          <div className="text-center py-20">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-sb-on-surface-variant/10" />
            <p className="text-sm font-medium text-sb-on-surface-variant/40">Selecciona un curso para comenzar</p>
          </div>
        )}

        {!loading && courseId && combined.length === 0 && !error && (
          <div className="text-center py-20">
            <Search className="h-12 w-12 mx-auto mb-3 text-sb-on-surface-variant/10" />
            <p className="text-sm font-medium text-sb-on-surface-variant/40">No se encontraron estudiantes</p>
          </div>
        )}

        {/* Grades Table */}
        {!loading && combined.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="bg-sb-surface rounded-2xl overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[1fr_100px_120px] gap-4 px-5 py-3 border-b border-sb-outline-variant/10">
                <span className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">Estudiante</span>
                <span className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider text-center">Nota</span>
                <span className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider text-center">Estado</span>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-sb-outline-variant/8">
                {combined.map((item, i) => {
                  const isSaving = saving[item.id]
                  const style = getScoreStyle(item.score)
                  const label = getScoreLabel(item.score)

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="grid grid-cols-[1fr_100px_120px] gap-4 px-5 py-3.5 items-center hover:bg-sb-surface-container-low/40 transition-colors"
                    >
                      {/* Student */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-xl bg-sb-on-surface/8 flex items-center justify-center shrink-0">
                          <span className="text-[11px] font-semibold text-sb-on-surface/60">
                            {item.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-sb-on-surface truncate">{item.name}</span>
                      </div>

                      {/* Score Input */}
                      <div className="flex justify-center">
                        <div className="relative w-20">
                          <input
                            type="number"
                            min={0}
                            max={20}
                            step={0.5}
                            placeholder="—"
                            value={item.score}
                            onChange={e => handleScoreChange(item.id, e.target.value === "" ? "" : String(Math.min(20, Math.max(0, Number(e.target.value)))))}
                            onBlur={() => handleBlur(item.id)}
                            className={`w-full h-9 rounded-lg text-center text-sm font-semibold tabular-nums border transition-all ${style.bg} ${style.color} ${
                              item.score ? `ring-1 ${style.ring}` : "border-sb-outline-variant/20"
                            }`}
                          />
                          {isSaving && (
                            <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                              <div className="h-3 w-3 rounded-full border-2 border-sb-primary/30 border-t-sb-primary animate-spin" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex justify-center">
                        {label ? (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${label.color} ${label.bg}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${label.color.replace("text-", "bg-")}`} />
                            {label.label}
                          </span>
                        ) : (
                          <span className="text-xs text-sb-on-surface-variant/20">—</span>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-lg max-w-sm ${
                toast.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                  : "bg-red-500/10 border-red-500/20 text-red-600"
              }`}
            >
              {toast.type === "success" ? <Check className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
              <p className="text-sm font-medium">{toast.msg}</p>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  )
}
