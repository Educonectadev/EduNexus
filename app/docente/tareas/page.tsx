"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import {
  ClipboardList, Plus, Calendar, CheckCircle2, Clock, AlertTriangle,
  BookOpen, Users, X, Eye, Search, GraduationCap, Sun, Moon, Check, ChevronDown,
} from "@/components/ui/proicons"
import NotificationBell from "@/components/layout/notification-bell"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import { useTheme } from "next-themes"

interface Task {
  id: string
  title: string
  subject: string
  start_date?: string
  due_date: string
  status: "pending" | "delivered" | "graded"
  delivered_count: number
  total_students: number
  priority: "high" | "medium" | "low"
  description?: string
  course_id?: string
}

interface StudentSubmission {
  student_id: string
  full_name: string
  dni: string
  grade: string
  section: string
  submission_status: "pending" | "submitted" | "graded"
  submission_grade: number | null
  submitted_at: string | null
  feedback: string | null
  submission_id: string | null
}

interface Course {
  id: string
  name: string
  code: string
  grade: string
  section: string
  student_count: number
}

interface TaskDetail extends Task {
  students: StudentSubmission[]
}

const statusConfig: Record<string, { label: string }> = {
  pending: { label: 'Pendiente' },
  delivered: { label: 'Entregada' },
  graded: { label: 'Calificada' },
}

const priorityConfig: Record<string, { label: string }> = {
  high: { label: 'Alta' },
  medium: { label: 'Media' },
  low: { label: 'Baja' },
}

const submissionStatusConfig: Record<string, { label: string }> = {
  pending: { label: 'Pendiente' },
  submitted: { label: 'Entregada' },
  graded: { label: 'Calificada' },
}

const FONT = "var(--app-main-font, 'DM Sans'), sans-serif"

export default function TareasPage() {
  return (
    <React.Suspense fallback={null}>
      <TareasInner />
    </React.Suspense>
  )
}

function TareasInner() {
  const searchParams = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const { theme, setTheme } = useTheme()
  const prefilterCourse = searchParams.get("curso") || ""
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [courses, setCourses] = React.useState<Course[]>([])
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [selectedTask, setSelectedTask] = React.useState<TaskDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [detailLoading, setDetailLoading] = React.useState(false)
  const [filter, setFilter] = React.useState<string>("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [courseFilter, setCourseFilter] = React.useState(prefilterCourse)
  const [formData, setFormData] = React.useState({ title: "", subject: "", start_date: "", due_date: "", priority: "medium" as "high" | "medium" | "low", description: "", course_id: prefilterCourse })
  const [editingSubmission, setEditingSubmission] = React.useState<{ studentId: string; submissionId: string | null; grade: string; feedback: string } | null>(null)
  const [gradingTaskId, setGradingTaskId] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetchTasks()
    fetchCourses()
  }, [])

  async function fetchTasks() {
    try {
      const res = await fetch("/api/docente/tareas")
      if (res.ok) {
        const data = await res.json()
        setTasks(data)
      }
    } catch (e) {
      console.error("Error fetching tasks:", e)
    } finally {
      setLoading(false)
    }
  }

  async function fetchCourses() {
    try {
      const res = await fetch("/api/docente/cursos")
      if (res.ok) {
        const data = await res.json()
        setCourses(data)
      }
    } catch (e) {
      console.error("Error fetching courses:", e)
    }
  }

  const fetchTaskDetail = async (taskId: string) => {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/docente/tareas/${taskId}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedTask(data)
        setDetailOpen(true)
      }
    } catch (e) {
      console.error("Error fetching task detail:", e)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.title || !formData.course_id) return
    try {
      const res = await fetch("/api/docente/tareas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, assigned_to_all: true }),
      })
      if (res.ok) {
        setDialogOpen(false)
        setFormData({ title: "", subject: "", start_date: "", due_date: "", priority: "medium", description: "", course_id: "" })
        fetchTasks()
      }
    } catch (e) {
      console.error("Error creating tarea:", e)
    }
  }

  const handleMarkSubmitted = async (taskId: string, studentId: string, submissionId: string | null) => {
    try {
      if (submissionId) {
        await fetch(`/api/docente/tareas/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "update_submission", submission_id: submissionId, status: "submitted" }),
        })
      } else {
        await fetch(`/api/docente/tareas/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "mark_submitted", student_id: studentId }),
        })
      }
      fetchTaskDetail(taskId)
      fetchTasks()
    } catch (e) {
      console.error("Error marking submission:", e)
    }
  }

  const handleGradeSubmission = async (taskId: string, student: StudentSubmission) => {
    if (!editingSubmission) return
    setGradingTaskId(student.student_id)
    try {
      const body: any = { action: "update_submission", status: "graded", grade: Number(editingSubmission.grade) || null, feedback: editingSubmission.feedback || null }
      if (student.submission_id) {
        body.submission_id = student.submission_id
      } else {
        body.student_id = student.student_id
        await fetch(`/api/docente/tareas/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "mark_submitted", student_id: student.student_id }),
        })
      }
      await fetch(`/api/docente/tareas/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      setEditingSubmission(null)
      fetchTaskDetail(taskId)
      fetchTasks()
    } catch (e) {
      console.error("Error grading submission:", e)
    } finally {
      setGradingTaskId(null)
    }
  }

  const filtered = tasks.filter(t => {
    const matchesFilter = filter === "all" || t.status === filter
    const matchesCourse = !courseFilter || t.course_id === courseFilter
    const matchesSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesCourse && matchesSearch
  })

  const courseTasks = courseFilter ? tasks.filter(t => t.course_id === courseFilter) : tasks
  const counts = {
    all: courseTasks.length,
    pending: courseTasks.filter(t => t.status === "pending").length,
    delivered: courseTasks.filter(t => t.status === "delivered").length,
    graded: courseTasks.filter(t => t.status === "graded").length,
  }

  return (
    <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-white dark:bg-[#1a1a1c] sb-note">
      <div className="p-6 md:p-8 pb-24 md:pb-8">
        {/* Header */}
        <header className="flex items-start justify-between mb-6 gap-4">
          <div>
            <p className="text-[14px] font-medium mb-1 text-[#a1a1aa]">Panel Docente</p>
            <h1 className="text-[36px] md:text-[48px] font-bold leading-tight text-[#f4f4f5]">Tareas</h1>
            <p className="text-[13px] mt-2 text-[#a1a1aa]">Gestiona las tareas de tus alumnos</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5">
                <div className="h-6 w-6 rounded-full flex items-center justify-center">
                  <span className="text-[9px] font-semibold text-[#f4f4f5]">
                    {user.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "D"}
                  </span>
                </div>
                <span className="text-sm md:text-base font-medium text-[#f4f4f5] whitespace-nowrap">{user.full_name}</span>
              </div>
            )}
            <NotificationBell />
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Cambiar tema" title="Cambiar tema" className="h-10 w-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity relative">
              <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-[#f4f4f5]" />
              <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-[#f4f4f5]" />
            </button>
            <button
              onClick={() => setDialogOpen(true)}
              className="h-10 px-3 sm:px-4 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 rounded-xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
              style={{ background: "var(--note-solid-bg)", color: "var(--note-solid-fg)", fontFamily: FONT }}
            >
              <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nueva tarea</span><span className="sm:hidden">Nueva</span>
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Total", value: tasks.length, icon: ClipboardList },
            { label: "Pendientes", value: counts.pending, icon: Clock },
            { label: "Entregadas", value: counts.delivered, icon: CheckCircle2 },
            { label: "Calificadas", value: counts.graded, icon: CheckCircle2 },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="p-4 transition-all duration-200 hover:shadow-md hover:scale-[1.02]" style={{
                background: "var(--note-surface)",
                borderRadius: "16px",
                border: "1px solid var(--note-hairline)",
              }}>
                <div className="h-9 w-9 rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--note-fill)" }}>
                  <Icon className="h-4 w-4" style={{ color: "var(--note-muted)" }} />
                </div>
                <p className="text-[11px] font-medium mb-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{s.label}</p>
                <p className="text-[28px] font-bold leading-none" style={{ color: "var(--note-text)", fontFamily: FONT }}>{s.value}</p>
              </div>
            )
          })}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 group">
            <div
              className="flex items-center h-11 gap-2.5 px-3 transition-all duration-200 group-hover:shadow-sm"
              style={{
                borderRadius: "14px",
                background: "var(--note-fill)",
                border: "1px solid var(--note-hairline)",
              }}
            >
              <Search className="h-4 w-4 shrink-0" style={{ color: "var(--note-muted)", opacity: 0.6 }} />
              <input
                placeholder="Buscar tarea..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder:opacity-50 focus:outline-none"
                style={{ color: "var(--note-text)", fontFamily: FONT }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}
                  className="h-6 w-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 hover:scale-110 active:scale-95"
                  style={{ background: "var(--note-fill-strong)" }}>
                  <X className="h-3.5 w-3.5" style={{ color: "var(--note-muted)" }} />
                </button>
              )}
            </div>
          </div>
          <div className="relative sm:w-56 group">
            <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}
              className="h-11 w-full px-4 pr-10 text-sm font-medium appearance-none cursor-pointer transition-all duration-200 hover:shadow-sm"
              style={{
                borderRadius: "14px",
                background: courseFilter ? "var(--note-fill)" : "transparent",
                border: `1.5px solid ${courseFilter ? "var(--note-fill-strong)" : "var(--note-hairline)"}`,
                color: courseFilter ? "var(--note-text)" : "var(--note-muted)",
                fontFamily: FONT,
              }}>
              <option value="">Todos los cursos</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.grade} {c.section}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "var(--note-muted)", opacity: 0.5 }} />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {([
            { key: 'all', label: 'Todas' },
            { key: 'pending', label: 'Pendientes' },
            { key: 'delivered', label: 'Entregadas' },
            { key: 'graded', label: 'Calificadas' },
          ]).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="h-9 px-4 text-[12px] font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 shrink-0 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                borderRadius: "10px",
                background: filter === f.key ? "var(--note-fill-strong)" : "var(--note-fill)",
                color: filter === f.key ? "var(--note-text)" : "var(--note-muted)",
                fontFamily: FONT,
              }}>
              {f.label}
              <span className="text-[10px] opacity-60">{counts[f.key as keyof typeof counts]}</span>
            </button>
          ))}
        </div>

        {/* Task list */}
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((t, i) => {
              const sc = statusConfig[t.status]
              const pc = priorityConfig[t.priority]
              const progress = t.total_students > 0 ? (t.delivered_count / t.total_students) * 100 : 0
              const daysLeft = Math.ceil((new Date(t.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              const isOverdue = t.status === 'pending' && daysLeft < 0
              const course = courses.find(c => c.id === t.course_id)

              return (
                <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  onClick={() => fetchTaskDetail(t.id)}
                  className="group overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    borderRadius: "16px",
                    background: "var(--note-surface)",
                    border: "1px solid var(--note-hairline)",
                  }}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1" style={{ borderRadius: "8px", background: "var(--note-fill)", color: "var(--note-muted)", fontFamily: FONT }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--note-muted)" }} />
                            {statusConfig[t.status].label}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5" style={{ borderRadius: "8px", background: "var(--note-fill)", color: "var(--note-muted)", fontFamily: FONT }}>
                            {priorityConfig[t.priority].label}
                          </span>
                          {isOverdue && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1" style={{ borderRadius: "8px", background: "var(--note-fill-strong)", color: "var(--note-text)", fontFamily: FONT }}>
                              <AlertTriangle className="h-3 w-3" /> Vencida
                            </span>
                          )}
                        </div>
                        <p className="text-[14px] font-bold" style={{ color: "var(--note-text)", fontFamily: FONT }}>{t.title}</p>
                        {t.description && (
                          <p className="text-[12px] mt-1 line-clamp-2" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{t.description}</p>
                        )}
                      </div>
                      <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-110" style={{ background: "var(--note-fill)" }}>
                        <Eye className="h-4 w-4" style={{ color: "var(--note-muted)" }} />
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" style={{ color: "var(--note-muted)" }} />
                          <span className="text-[10px] font-medium" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{t.delivered_count}/{t.total_students} entregas</span>
                        </div>
                        <span className="text-[10px] font-medium" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--note-fill)" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                          className="h-full rounded-full"
                          style={{ background: "var(--note-text)" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-4 px-5 py-3" style={{ borderTop: "1px solid var(--note-hairline)" }}>
                    {course && (
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" style={{ color: "var(--note-muted)" }} />
                        <span className="text-[10px] font-medium" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{course.name} - {course.grade} {course.section}</span>
                      </div>
                    )}
                    {t.subject && (
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5" style={{ color: "var(--note-muted)" }} />
                        <span className="text-[10px] font-medium" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{t.subject}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" style={{ color: "var(--note-muted)" }} />
                      {t.start_date ? (
                        <span className="text-[10px] font-medium" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
                          {new Date(t.start_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })} → {new Date(t.due_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
                          {isOverdue ? `Vencida hace ${Math.abs(daysLeft)} días` : daysLeft === 0 ? 'Vence hoy' : daysLeft === 1 ? 'Vence mañana' : `Vence en ${daysLeft} días`}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {!loading && filtered.length === 0 && (
            <div className="py-20 text-center" style={{ borderRadius: "20px", background: "var(--note-surface)", border: "1px solid var(--note-hairline)" }}>
              <div className="h-16 w-16 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--note-fill)" }}>
                <ClipboardList className="h-7 w-7" style={{ color: "var(--note-muted)" }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--note-text)", fontFamily: FONT }}>No hay tareas en esta categoría</p>
              <p className="text-xs" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Crea una nueva tarea para comenzar</p>
            </div>
          )}

          {loading && (
            <div className="py-20 text-center" style={{ borderRadius: "20px", background: "var(--note-surface)", border: "1px solid var(--note-hairline)" }}>
              <div className="h-8 w-8 border-2 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: "var(--note-fill)", borderTopColor: "var(--note-text)" }} />
              <p className="text-sm" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Cargando tareas...</p>
            </div>
          )}
        </div>

        {/* ===== CREATE MODAL ===== */}
        <AnimatePresence>
          {dialogOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setDialogOpen(false)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
                transition={{ duration: 0.25, ease: [0.37, 0.35, 0, 1] }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-[520px] max-h-[90vh] overflow-y-auto rounded-[20px] shadow-2xl" style={{ background: "var(--note-surface)", border: "1px solid var(--note-hairline)" }}>
                {/* Modal Header */}
                <div className="flex items-center justify-between p-5 pb-0">
                  <h2 className="text-[18px] font-bold" style={{ color: "var(--note-text)", fontFamily: FONT }}>Nueva tarea</h2>
                  <button onClick={() => setDialogOpen(false)} className="h-8 w-8 rounded-xl flex items-center justify-center transition-colors" style={{ background: "var(--note-fill)" }}>
                    <X className="h-4 w-4" style={{ color: "var(--note-muted)" }} />
                  </button>
                </div>
                {/* Modal Body */}
                <div className="p-5 space-y-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Curso *</label>
                    <select value={formData.course_id} onChange={e => setFormData({...formData, course_id: e.target.value})}
                      className="sbf-native-select h-11 w-full px-4 text-sm rounded-xl">
                      <option value="">Seleccionar curso</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.name} - {c.grade} {c.section} ({c.student_count} alumnos)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Título de la tarea *</label>
                    <input placeholder="Ej: Ejercicios de álgebra - Cap. 3" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                      className="sb-input h-11 w-full px-4 text-sm rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Asignatura</label>
                      <input placeholder="Ej: Matemática" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}
                        className="sb-input h-11 w-full px-4 text-sm rounded-xl" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Prioridad</label>
                      <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}
                        className="sbf-native-select h-11 w-full px-4 text-sm rounded-xl">
                        <option value="low">Baja</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                      </select>
                    </div>
                  </div>
                  <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--note-fill)" }}>
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Fechas de la tarea</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-medium mb-1 block" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Fecha de inicio</label>
                        <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})}
                          className="sb-input h-10 w-full px-3 text-sm rounded-xl" />
                        <p className="text-[9px] mt-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Desde cuándo está disponible</p>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium mb-1 block" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Fecha de vencimiento *</label>
                        <input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})}
                          className="sb-input h-10 w-full px-3 text-sm rounded-xl" />
                        <p className="text-[9px] mt-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Último día para entregar</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Descripción e instrucciones</label>
                    <textarea placeholder="Describe detalladamente la tarea..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                      className="sb-input w-full px-4 py-3 text-sm rounded-xl resize-none h-24" />
                  </div>
                </div>
                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 p-5 pt-0">
                  <button onClick={() => setDialogOpen(false)}
                    className="h-10 px-5 text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: "var(--note-fill)", color: "var(--note-muted)", fontFamily: FONT }}>
                    Cancelar
                  </button>
                  <button disabled={!formData.title || !formData.course_id} onClick={handleCreate}
                    className="h-10 px-6 text-sm font-bold rounded-xl transition-all duration-200 disabled:opacity-30 hover:scale-[1.02] active:scale-[0.97]"
                    style={{ background: "var(--note-solid-bg)", color: "var(--note-solid-fg)", fontFamily: FONT }}>
                    Crear tarea
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== DETAIL MODAL ===== */}
        <AnimatePresence>
          {detailOpen && selectedTask && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => { setDetailOpen(false); setSelectedTask(null) }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
                transition={{ duration: 0.25, ease: [0.37, 0.35, 0, 1] }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-[680px] max-h-[90vh] overflow-y-auto rounded-[20px] shadow-2xl" style={{ background: "var(--note-surface)", border: "1px solid var(--note-hairline)" }}>
                {/* Modal Header */}
                <div className="flex items-center justify-between p-5 pb-0">
                  <h2 className="text-[18px] font-bold" style={{ color: "var(--note-text)", fontFamily: FONT }}>{selectedTask.title}</h2>
                  <button onClick={() => { setDetailOpen(false); setSelectedTask(null) }} className="h-8 w-8 rounded-xl flex items-center justify-center transition-colors" style={{ background: "var(--note-fill)" }}>
                    <X className="h-4 w-4" style={{ color: "var(--note-muted)" }} />
                  </button>
                </div>
                {/* Modal Body */}
                <div className="p-5">
                  {detailLoading ? (
                    <div className="py-12 text-center">
                      <div className="h-6 w-6 border-2 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: "var(--note-fill)", borderTopColor: "var(--note-text)" }} />
                      <p className="text-[13px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Cargando detalles...</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl p-3" style={{ background: "var(--note-fill)" }}>
                          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Estado</p>
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1" style={{ borderRadius: "8px", background: "var(--note-fill-strong)", color: "var(--note-text)", fontFamily: FONT }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--note-text)" }} />
                            {statusConfig[selectedTask.status].label}
                          </span>
                        </div>
                        <div className="rounded-xl p-3" style={{ background: "var(--note-fill)" }}>
                          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Prioridad</p>
                          <span className="text-[10px] font-medium px-2 py-0.5" style={{ borderRadius: "8px", background: "var(--note-fill-strong)", color: "var(--note-text)", fontFamily: FONT }}>
                            {priorityConfig[selectedTask.priority].label}
                          </span>
                        </div>
                        <div className="col-span-2 rounded-xl p-3" style={{ background: "var(--note-fill)" }}>
                          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Fechas</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" style={{ color: "var(--note-muted)" }} />
                            <span className="text-[12px] font-medium" style={{ color: "var(--note-text)", fontFamily: FONT }}>
                              {selectedTask.start_date
                                ? `${new Date(selectedTask.start_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })} → ${new Date(selectedTask.due_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}`
                                : `Hasta el ${new Date(selectedTask.due_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}`
                              }
                            </span>
                          </div>
                        </div>
                        {selectedTask.description && (
                          <div className="col-span-2 rounded-xl p-3" style={{ background: "var(--note-fill)" }}>
                            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Descripción</p>
                            <p className="text-[12px] whitespace-pre-line" style={{ color: "var(--note-text)", fontFamily: FONT }}>{selectedTask.description}</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-[13px] font-bold flex items-center gap-2" style={{ color: "var(--note-text)", fontFamily: FONT }}>
                            <Users className="h-4 w-4" style={{ color: "var(--note-muted)" }} />
                            Alumnos ({selectedTask.students?.length || 0})
                          </h3>
                          <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: "var(--note-text)" }} /> {selectedTask.delivered_count} entregadas</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: "var(--note-muted)", opacity: 0.4 }} /> {(selectedTask.total_students || 0) - selectedTask.delivered_count} pendientes</span>
                          </div>
                        </div>

                        <div className="rounded-xl overflow-hidden" style={{ background: "var(--note-fill)" }}>
                          {selectedTask.students && selectedTask.students.length > 0 ? (
                            <div>
                              {selectedTask.students.map((student, i) => {
                                const ss = submissionStatusConfig[student.submission_status] || submissionStatusConfig.pending
                                const isEditing = editingSubmission?.studentId === student.student_id
                                return (
                                  <motion.div key={student.student_id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="px-4 py-3 transition-colors"
                                    style={{ borderBottom: i < (selectedTask.students?.length || 0) - 1 ? "1px solid var(--note-hairline)" : "none" }}>
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-8 w-8 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "var(--note-fill-strong)", color: "var(--note-text)" }}>
                                          {student.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-[12px] font-semibold truncate" style={{ color: "var(--note-text)", fontFamily: FONT }}>{student.full_name}</p>
                                          <p className="text-[10px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>DNI: {student.dni || 'N/A'} - {student.grade} {student.section}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {student.submission_grade != null && (
                                          <span className="text-[10px] font-bold px-2 py-0.5" style={{ borderRadius: "8px", background: "var(--note-fill-strong)", color: "var(--note-text)", fontFamily: FONT }}>
                                            {student.submission_grade}
                                          </span>
                                        )}
                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1" style={{ borderRadius: "8px", background: "var(--note-fill-strong)", color: "var(--note-text)", fontFamily: FONT }}>
                                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--note-text)" }} />
                                          {ss.label}
                                        </span>
                                        {student.submission_status === 'pending' && (
                                          <button onClick={(e) => { e.stopPropagation(); handleMarkSubmitted(selectedTask.id, student.student_id, student.submission_id) }}
                                            className="text-[10px] font-semibold px-2.5 py-1 rounded-xl transition-all duration-200 hover:scale-[1.05] active:scale-[0.95]"
                                            style={{ background: "var(--note-fill-strong)", color: "var(--note-text)", fontFamily: FONT }}>
                                            Marcar entrega
                                          </button>
                                        )}
                                        {student.submission_status !== 'pending' && (
                                          <button onClick={(e) => {
                                            e.stopPropagation()
                                            setEditingSubmission(isEditing ? null : {
                                              studentId: student.student_id,
                                              submissionId: student.submission_id,
                                              grade: student.submission_grade?.toString() || "",
                                              feedback: student.feedback || "",
                                            })
                                          }}
                                            className="text-[10px] font-semibold px-2.5 py-1 rounded-xl transition-all duration-200 hover:scale-[1.05] active:scale-[0.95]"
                                            style={{
                                              background: isEditing ? "var(--note-fill)" : "var(--note-fill-strong)",
                                              color: "var(--note-text)",
                                              fontFamily: FONT,
                                            }}>
                                            {student.submission_status === 'graded' ? (isEditing ? 'Cerrar' : 'Editar nota') : (isEditing ? 'Cerrar' : 'Calificar')}
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {isEditing && (
                                      <div className="mt-3 pl-11 flex items-start gap-2">
                                        <div className="w-20">
                                          <label className="text-[9px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Nota</label>
                                          <input type="number" min={0} max={20} step="0.5" value={editingSubmission.grade}
                                            onChange={e => setEditingSubmission(prev => prev ? { ...prev, grade: e.target.value } : prev)}
                                            placeholder="0-20"
                                            className="sb-input h-9 w-full px-2 text-sm rounded-xl text-center" />
                                        </div>
                                        <div className="flex-1">
                                          <label className="text-[9px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Comentario</label>
                                          <input value={editingSubmission.feedback}
                                            onChange={e => setEditingSubmission(prev => prev ? { ...prev, feedback: e.target.value } : prev)}
                                            placeholder="Retroalimentación para el alumno"
                                            className="sb-input h-9 w-full px-3 text-sm rounded-xl" />
                                        </div>
                                        <button onClick={() => handleGradeSubmission(selectedTask.id, student)} disabled={gradingTaskId === student.student_id}
                                          className="h-9 px-4 rounded-xl text-xs font-bold transition-all duration-200 disabled:opacity-50 mt-5 shrink-0 hover:scale-[1.03] active:scale-[0.97]"
                                          style={{ background: "var(--note-solid-bg)", color: "var(--note-solid-fg)", fontFamily: FONT }}>
                                          {gradingTaskId === student.student_id ? "Guardando..." : "Guardar"}
                                        </button>
                                      </div>
                                    )}
                                  </motion.div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="py-20 text-center">
                              <Users className="h-12 w-12 mx-auto mb-4" style={{ color: "var(--note-muted)", opacity: 0.3 }} />
                              <p className="text-[13px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>No hay alumnos inscritos en este curso</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
