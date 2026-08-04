"use client"

import * as React from "react"
import { Plus, BookMarked, TrendingUp, TrendingDown, X, Pencil, Trash2, BarChart3 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { SbBtn, SbModal, SbModalHeader, SbModalBody, SbModalFooter } from "@/components/ui/sb"

interface Grade {
  id: string
  subject: string
  score: number
  term: string
  date: string
}

interface Student {
  id: string
  name: string
  grades: Grade[]
  average: number
}

const defaultStudents: Student[] = [
  { id: "1", name: "Carlos García López", grades: [
    { id: "g1", subject: "Matemática", score: 15, term: "1er Bimestre", date: "2026-04-15" },
    { id: "g2", subject: "Matemática", score: 17, term: "2do Bimestre", date: "2026-06-10" },
    { id: "g3", subject: "Comunicación", score: 14, term: "1er Bimestre", date: "2026-04-18" },
    { id: "g4", subject: "Comunicación", score: 18, term: "2do Bimestre", date: "2026-06-12" },
  ], average: 16 },
  { id: "2", name: "María Fernández Ruiz", grades: [
    { id: "g5", subject: "Matemática", score: 18, term: "1er Bimestre", date: "2026-04-15" },
    { id: "g6", subject: "Matemática", score: 19, term: "2do Bimestre", date: "2026-06-10" },
    { id: "g7", subject: "Ciencia", score: 17, term: "1er Bimestre", date: "2026-04-20" },
    { id: "g8", subject: "Ciencia", score: 20, term: "2do Bimestre", date: "2026-06-14" },
  ], average: 18.5 },
  { id: "3", name: "Juan Pérez Díaz", grades: [
    { id: "g9", subject: "Matemática", score: 12, term: "1er Bimestre", date: "2026-04-15" },
    { id: "g10", subject: "Matemática", score: 10, term: "2do Bimestre", date: "2026-06-10" },
    { id: "g11", subject: "Historia", score: 13, term: "1er Bimestre", date: "2026-04-22" },
    { id: "g12", subject: "Historia", score: 11, term: "2do Bimestre", date: "2026-06-16" },
  ], average: 11.5 },
  { id: "4", name: "Ana Torres Vega", grades: [
    { id: "g13", subject: "Matemática", score: 16, term: "1er Bimestre", date: "2026-04-15" },
    { id: "g14", subject: "Matemática", score: 15, term: "2do Bimestre", date: "2026-06-10" },
    { id: "g15", subject: "Comunicación", score: 16, term: "1er Bimestre", date: "2026-04-18" },
    { id: "g16", subject: "Comunicación", score: 17, term: "2do Bimestre", date: "2026-06-12" },
  ], average: 16 },
  { id: "5", name: "Luis Morales Campos", grades: [
    { id: "g17", subject: "Ciencia", score: 14, term: "1er Bimestre", date: "2026-04-20" },
    { id: "g18", subject: "Ciencia", score: 13, term: "2do Bimestre", date: "2026-06-14" },
    { id: "g19", subject: "Historia", score: 15, term: "1er Bimestre", date: "2026-04-22" },
    { id: "g20", subject: "Historia", score: 12, term: "2do Bimestre", date: "2026-06-16" },
  ], average: 13.5 },
  { id: "6", name: "Sofía Castillo Ríos", grades: [
    { id: "g21", subject: "Matemática", score: 19, term: "1er Bimestre", date: "2026-04-15" },
    { id: "g22", subject: "Matemática", score: 18, term: "2do Bimestre", date: "2026-06-10" },
    { id: "g23", subject: "Comunicación", score: 20, term: "1er Bimestre", date: "2026-04-18" },
    { id: "g24", subject: "Comunicación", score: 19, term: "2do Bimestre", date: "2026-06-12" },
  ], average: 19 },
]

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

export default function CalificacionesPage() {
  const [students, setStudents] = React.useState<Student[]>(defaultStudents)
  const [registerOpen, setRegisterOpen] = React.useState(false)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<Student | null>(null)
  const [editGradeId, setEditGradeId] = React.useState<string | null>(null)
  const [editScore, setEditScore] = React.useState("")
  const [newSubject, setNewSubject] = React.useState("")
  const [newScore, setNewScore] = React.useState("")
  const [newTerm, setNewTerm] = React.useState("")
  const [registerStudentId, setRegisterStudentId] = React.useState("")
  const [registerScore, setRegisterScore] = React.useState("")

  const openDetail = (student: Student) => {
    setSelected(student)
    setDetailOpen(true)
    setEditGradeId(null)
  }

  const updateGrade = (studentId: string, gradeId: string, newScore: number) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s
      const updated = s.grades.map(g => g.id === gradeId ? { ...g, score: newScore } : g)
      return { ...s, grades: updated, average: calcAverage(updated) }
    }))
    setSelected(prev => {
      if (!prev || prev.id !== studentId) return prev
      const updated = prev.grades.map(g => g.id === gradeId ? { ...g, score: newScore } : g)
      return { ...prev, grades: updated, average: calcAverage(updated) }
    })
    setEditGradeId(null); setEditScore("")
  }

  const deleteGrade = (studentId: string, gradeId: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s
      const updated = s.grades.filter(g => g.id !== gradeId)
      return { ...s, grades: updated, average: calcAverage(updated) }
    }))
    setSelected(prev => {
      if (!prev || prev.id !== studentId) return prev
      const updated = prev.grades.filter(g => g.id !== gradeId)
      return { ...prev, grades: updated, average: calcAverage(updated) }
    })
  }

  const addGrade = (studentId: string) => {
    if (!newSubject || !newScore || !newTerm) return
    const grade: Grade = {
      id: `g-${Date.now()}`,
      subject: newSubject,
      score: Number(newScore),
      term: newTerm,
      date: new Date().toISOString().split("T")[0],
    }
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s
      const updated = [...s.grades, grade]
      return { ...s, grades: updated, average: calcAverage(updated) }
    }))
    setSelected(prev => {
      if (!prev || prev.id !== studentId) return prev
      const updated = [...prev.grades, grade]
      return { ...prev, grades: updated, average: calcAverage(updated) }
    })
    setNewSubject(""); setNewScore(""); setNewTerm("")
  }

  const handleRegister = () => {
    if (!registerStudentId || !registerScore) return
    const grade: Grade = {
      id: `g-${Date.now()}`,
      subject: "General",
      score: Number(registerScore),
      term: "Actual",
      date: new Date().toISOString().split("T")[0],
    }
    setStudents(prev => prev.map(s => {
      if (s.id !== registerStudentId) return s
      const updated = [...s.grades, grade]
      return { ...s, grades: updated, average: calcAverage(updated) }
    }))
    setRegisterOpen(false); setRegisterStudentId(""); setRegisterScore("")
  }

  const getTrend = (grades: Grade[]) => {
    if (grades.length < 2) return true
    return grades[grades.length - 1].score > grades[grades.length - 2].score
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Calificaciones</h1>
          <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">Gestiona las notas de tus alumnos</p>
        </div>
        <SbBtn variant="filled" rounded className="flex items-center gap-2" onClick={() => setRegisterOpen(true)}>
          <Plus className="h-4 w-4" /> Registrar
        </SbBtn>
      </motion.div>

      {/* Stats */}
      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-3 gap-3">
        {[
          { label: "Promedio General", value: (students.reduce((a, s) => a + s.average, 0) / students.length).toFixed(1), color: "text-sb-on-surface", bg: "bg-sb-on-surface/8" },
          { label: "Mejor Nota", value: Math.max(...students.map(s => Math.max(...s.grades.map(g => g.score)))), color: "text-emerald-600", bg: "bg-emerald-500/8" },
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
      <div className="bg-sb-surface rounded-[6px] overflow-hidden">
        <AnimatePresence>
          {students.map((s, i) => {
            const trend = getTrend(s.grades)
            return (
              <motion.div key={s.id} variants={listItem} initial="hidden" animate="show" exit="exit"
                transition={{ duration: 0.3, delay: i * 0.03 }}
                onClick={() => openDetail(s)}
                className="flex items-center justify-between px-5 py-4 hover:bg-sb-surface-container-low/50 transition-colors border-b border-sb-outline-variant/10 last:border-0 cursor-pointer group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-10 w-10 rounded-[6px] ${getAvatarColor(s.name)} flex items-center justify-center shrink-0`}>
                    <span className="text-[10px] font-bold text-white">{getInitials(s.name)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-sb-on-surface truncate">{s.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {s.grades.slice(-4).map((g, j) => (
                        <span key={j} className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${getGradeBg(g.score)} ${getGradeColor(g.score)}`}>{g.score}</span>
                      ))}
                      {s.grades.length > 4 && <span className="text-[10px] text-sb-on-surface-variant/30">+{s.grades.length - 4}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {trend ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> : <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
                  <span className={`text-lg font-bold ${getGradeColor(s.average)}`}>{s.average}</span>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* ===== DETAIL MODAL ===== */}
      <SbModal open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="560px">
        {selected && (
          <>
            <SbModalHeader title="" onClose={() => setDetailOpen(false)} />
            <SbModalBody>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                {/* Student header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`h-14 w-14 rounded-[6px] ${getAvatarColor(selected.name)} flex items-center justify-center`}>
                    <span className="text-base font-bold text-white">{getInitials(selected.name)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-sb-on-surface">{selected.name}</p>
                    <p className="text-xs text-sb-on-surface-variant/50 mt-0.5">{selected.grades.length} calificaciones registradas</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${getGradeColor(selected.average)}`}>{selected.average}</p>
                    <p className="text-[10px] text-sb-on-surface-variant/40">Promedio</p>
                  </div>
                </div>

                {/* Performance bar */}
                <div className="bg-sb-surface-container/50 rounded-[6px] p-4 mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-sb-on-surface-variant/40" />
                      <span className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">Rendimiento</span>
                    </div>
                    <span className={`text-sm font-bold ${getGradeColor(selected.average)}`}>{selected.average}/20</span>
                  </div>
                  <div className="h-3 rounded-[6px] bg-sb-surface-container overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(selected.average / 20) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className={`h-full rounded-[6px] ${getGradeBarColor(selected.average)}`}
                    />
                  </div>
                </div>

                {/* Grades list */}
                <div className="mb-5">
                  <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-3">Historial de Notas</p>
                  <div className="space-y-2">
                    {selected.grades.map((g) => (
                      <div key={g.id} className="flex items-center gap-3 bg-sb-surface-container/30 rounded-[6px] px-4 py-3 group">
                        {editGradeId === g.id ? (
                          <>
                            <input type="number" min={0} max={20} value={editScore} onChange={e => setEditScore(e.target.value)}
                              className="sb-input rounded-[6px] text-sm h-8 w-16 text-center" autoFocus />
                            <button onClick={() => updateGrade(selected.id, g.id, Number(editScore))}
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
                              <p className="text-sm font-medium text-sb-on-surface">{g.subject}</p>
                              <p className="text-[10px] text-sb-on-surface-variant/40">{g.term} · {g.date}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditGradeId(g.id); setEditScore(g.score.toString()) }}
                                className="h-7 w-7 rounded-[6px] flex items-center justify-center text-sb-on-surface-variant/40 hover:text-sb-on-surface hover:bg-sb-surface-container transition-colors">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => deleteGrade(selected.id, g.id)}
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
                    <input placeholder="Materia" value={newSubject} onChange={e => setNewSubject(e.target.value)}
                      className="sb-input rounded-[6px] text-sm h-9" />
                    <input type="number" min={0} max={20} placeholder="Nota" value={newScore} onChange={e => setNewScore(e.target.value)}
                      className="sb-input rounded-[6px] text-sm h-9" />
                    <input placeholder="Bimestre" value={newTerm} onChange={e => setNewTerm(e.target.value)}
                      className="sb-input rounded-[6px] text-sm h-9" />
                  </div>
                  <button onClick={() => addGrade(selected.id)} disabled={!newSubject || !newScore || !newTerm}
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
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Alumno</label>
              <select value={registerStudentId} onChange={e => setRegisterStudentId(e.target.value)}
                className="sbf-native-select w-full">
                <option value="">Seleccionar alumno...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Nota (0-20)</label>
              <input type="number" min={0} max={20} placeholder="15" value={registerScore} onChange={e => setRegisterScore(e.target.value)}
                className="sb-input rounded-[6px] text-sm h-10 w-full" />
            </div>
          </motion.div>
        </SbModalBody>
        <SbModalFooter>
          <SbBtn rounded onClick={() => setRegisterOpen(false)}>Cancelar</SbBtn>
          <SbBtn variant="filled" rounded disabled={!registerStudentId || !registerScore} onClick={handleRegister}>
            Guardar
          </SbBtn>
        </SbModalFooter>
      </SbModal>
    </div>
  )
}
