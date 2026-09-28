"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import {
  ClipboardList, Plus, Calendar, CheckCircle2, Clock, AlertTriangle,
  BookOpen, Users, X, Eye, Search, GraduationCap, ChevronDown, Trash2,
} from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import { SbSectionHeader, SbBtn, SbModal, SbModalHeader, SbModalBody, SbModalFooter } from "@/components/ui/sb"

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

export default function TareasPage() {
  return (
    <React.Suspense fallback={null}>
      <TareasInner />
    </React.Suspense>
  )
}

function TareasInner() {
  const searchParams = useSearchParams()
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

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("¿Eliminar esta tarea? Esta acción no se puede deshacer.")) return
    try {
      const res = await fetch(`/api/docente/tareas/${taskId}`, { method: "DELETE" })
      if (res.ok) {
        setDetailOpen(false)
        setSelectedTask(null)
        fetchTasks()
      }
    } catch (e) {
      console.error("Error deleting task:", e)
    }
  }

  const handleToggleStatus = async (taskId: string, newStatus: string) => {
    try {
      await fetch(`/api/docente/tareas/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      fetchTaskDetail(taskId)
      fetchTasks()
    } catch (e) {
      console.error("Error updating status:", e)
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
    <div className="space-y-5">
      <SbSectionHeader
        title="Tareas"
        description="Gestiona las tareas de tus alumnos"
        action={
          <SbBtn variant="filled" rounded className="flex items-center gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Nueva tarea
          </SbBtn>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[
          { label: "Total", value: tasks.length, icon: ClipboardList },
          { label: "Pendientes", value: counts.pending, icon: Clock },
          { label: "Entregadas", value: counts.delivered, icon: CheckCircle2 },
          { label: "Calificadas", value: counts.graded, icon: CheckCircle2 },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-2xl bg-sb-surface border border-sb-outline-variant/10 p-5">
              <div className="h-9 w-9 rounded-xl bg-sb-surface-container-high flex items-center justify-center mb-3">
                <Icon className="h-4 w-4 text-sb-on-surface-variant/60" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 mb-1">{s.label}</p>
              <p className="text-2xl font-semibold leading-none text-sb-on-surface">{s.value}</p>
            </div>
          )
        })}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/30 pointer-events-none" />
          <input
            placeholder="Buscar tarea..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-11 bg-sb-surface rounded-xl border border-sb-outline-variant/10 text-sm text-sb-on-surface placeholder:text-sb-on-surface-variant/30 outline-none transition-all focus:border-sb-primary/30 ring-1 ring-sb-primary/10"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-lg flex items-center justify-center transition-colors hover:bg-sb-surface-container-high">
              <X className="h-3.5 w-3.5 text-sb-on-surface-variant/50" />
            </button>
          )}
        </div>
        <div className="relative sm:w-56">
          <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}
            className="h-11 w-full px-4 pr-10 appearance-none cursor-pointer rounded-xl bg-sb-surface border border-sb-outline-variant/10 text-sm text-sb-on-surface outline-none transition-all focus:border-sb-primary/30">
            <option value="">Todos los cursos</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name} - {c.grade} {c.section}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-sb-on-surface-variant/40" />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-sb-surface-container rounded-2xl overflow-x-auto">
        {([
          { key: 'all', label: 'Todas' },
          { key: 'pending', label: 'Pendientes' },
          { key: 'delivered', label: 'Entregadas' },
          { key: 'graded', label: 'Calificadas' },
        ]).map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium whitespace-nowrap flex items-center gap-1.5 shrink-0 transition-colors ${
              filter === f.key
                ? "bg-sb-on-surface text-sb-surface"
                : "text-sb-on-surface-variant/60 hover:text-sb-on-surface"
            }`}>
            {f.label}
            <span className={`text-[10px] ${filter === f.key ? "text-sb-surface/60" : "text-sb-on-surface-variant/30"}`}>{counts[f.key as keyof typeof counts]}</span>
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
            const statusTone = t.status === 'pending'
              ? 'bg-amber-500/10 text-amber-600'
              : t.status === 'delivered'
                ? 'bg-emerald-500/10 text-emerald-600'
                : 'bg-blue-500/10 text-blue-600'

            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                onClick={() => fetchTaskDetail(t.id)}
                className="group rounded-2xl bg-sb-surface border border-sb-outline-variant/10 overflow-hidden cursor-pointer transition-colors hover:bg-sb-surface-container-low/50">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusTone}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {sc.label}
                        </span>
                        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-sb-surface-container-high text-sb-on-surface-variant/60">
                          {pc.label}
                        </span>
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-red-500/10 text-red-600">
                            <AlertTriangle className="h-3 w-3" /> Vencida
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-sb-on-surface">{t.title}</p>
                      {t.description && (
                        <p className="text-xs mt-1 line-clamp-2 text-sb-on-surface-variant/50">{t.description}</p>
                      )}
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-sb-surface-container-high flex items-center justify-center shrink-0 transition-colors group-hover:bg-sb-surface-container-highest">
                      <Eye className="h-4 w-4 text-sb-on-surface-variant/50" />
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-sb-on-surface-variant/40" />
                        <span className="text-[11px] text-sb-on-surface-variant/50">{t.delivered_count}/{t.total_students} entregas</span>
                      </div>
                      <span className="text-[11px] text-sb-on-surface-variant/50">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-sb-surface-container-high">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                        className="h-full rounded-full bg-sb-on-surface"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-4 px-5 py-3 border-t border-sb-outline-variant/10">
                  {course && (
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-sb-on-surface-variant/40" />
                      <span className="text-[11px] text-sb-on-surface-variant/50">{course.name} - {course.grade} {course.section}</span>
                    </div>
                  )}
                  {t.subject && (
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-sb-on-surface-variant/40" />
                      <span className="text-[11px] text-sb-on-surface-variant/50">{t.subject}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-sb-on-surface-variant/40" />
                    {t.start_date ? (
                      <span className="text-[11px] text-sb-on-surface-variant/50">
                        {new Date(t.start_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })} → {new Date(t.due_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                      </span>
                    ) : (
                      <span className="text-[11px] text-sb-on-surface-variant/50">
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
          <div className="rounded-2xl bg-sb-surface border border-sb-outline-variant/10 py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-sb-surface-container flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="h-7 w-7 text-sb-on-surface-variant/20" />
            </div>
            <p className="text-sm font-medium text-sb-on-surface-variant/50">No hay tareas en esta categoría</p>
            <p className="text-xs text-sb-on-surface-variant/30 mt-1">Crea una nueva tarea para comenzar</p>
          </div>
        )}

        {loading && (
          <div className="rounded-2xl bg-sb-surface border border-sb-outline-variant/10 py-20 text-center">
            <div className="h-6 w-6 border-2 border-sb-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-sb-on-surface-variant/50">Cargando tareas...</p>
          </div>
        )}
      </div>

      {/* ===== CREATE MODAL ===== */}
      <SbModal open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="520px">
        <SbModalHeader title="Nueva tarea" onClose={() => setDialogOpen(false)} />
        <SbModalBody>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 mb-2 block">Curso *</label>
              <select value={formData.course_id} onChange={e => setFormData({...formData, course_id: e.target.value})}
                className="sbf-native-select h-11 w-full px-4 text-sm rounded-xl">
                <option value="">Seleccionar curso</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.grade} {c.section} ({c.student_count} alumnos)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 mb-2 block">Título de la tarea *</label>
              <input placeholder="Ej: Ejercicios de álgebra - Cap. 3" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                className="sb-input h-11 w-full px-4 text-sm rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 mb-2 block">Asignatura</label>
                <input placeholder="Ej: Matemática" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}
                  className="sb-input h-11 w-full px-4 text-sm rounded-xl" />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 mb-2 block">Prioridad</label>
                <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}
                  className="sbf-native-select h-11 w-full px-4 text-sm rounded-xl">
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>
            </div>
            <div className="rounded-xl bg-sb-surface-container p-4 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50">Fechas de la tarea</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium mb-1 block text-sb-on-surface-variant/50">Fecha de inicio</label>
                  <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})}
                    className="sb-input h-10 w-full px-3 text-sm rounded-xl" />
                  <p className="text-[10px] mt-1 text-sb-on-surface-variant/40">Desde cuándo está disponible</p>
                </div>
                <div>
                  <label className="text-[11px] font-medium mb-1 block text-sb-on-surface-variant/50">Fecha de vencimiento *</label>
                  <input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})}
                    className="sb-input h-10 w-full px-3 text-sm rounded-xl" />
                  <p className="text-[10px] mt-1 text-sb-on-surface-variant/40">Último día para entregar</p>
                </div>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 mb-2 block">Descripción e instrucciones</label>
              <textarea placeholder="Describe detalladamente la tarea..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                className="sb-input w-full px-4 py-3 text-sm rounded-xl resize-none h-24" />
            </div>
          </div>
        </SbModalBody>
        <SbModalFooter>
          <SbBtn rounded onClick={() => setDialogOpen(false)}>Cancelar</SbBtn>
          <SbBtn variant="filled" rounded disabled={!formData.title || !formData.course_id} onClick={handleCreate}>Crear tarea</SbBtn>
        </SbModalFooter>
      </SbModal>

      {/* ===== DETAIL MODAL ===== */}
      <SbModal open={detailOpen && !!selectedTask} onClose={() => { setDetailOpen(false); setSelectedTask(null) }} maxWidth="680px">
        {selectedTask && (
          <>
            <SbModalHeader title={selectedTask.title} onClose={() => { setDetailOpen(false); setSelectedTask(null) }}>
              <button onClick={() => handleDeleteTask(selectedTask.id)} className="sb-btn-icon text-red-500 hover:text-red-600" title="Eliminar tarea">
                <Trash2 className="h-4 w-4" />
              </button>
            </SbModalHeader>
            <SbModalBody>
              {detailLoading ? (
                <div className="py-12 text-center">
                  <div className="h-6 w-6 border-2 border-sb-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-[13px] text-sb-on-surface-variant/50">Cargando detalles...</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-sb-surface-container p-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 mb-1.5">Estado</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(['pending', 'delivered', 'graded'] as const).map((s) => (
                          <button key={s} onClick={() => handleToggleStatus(selectedTask.id, s)}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                              selectedTask.status === s
                                ? "bg-sb-on-surface text-sb-surface"
                                : "bg-sb-surface-container-high text-sb-on-surface-variant/60 hover:text-sb-on-surface"
                            }`}>
                            {statusConfig[s].label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl bg-sb-surface-container p-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 mb-1.5">Prioridad</p>
                      <span className="rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-sb-surface-container-high text-sb-on-surface-variant/60">
                        {priorityConfig[selectedTask.priority].label}
                      </span>
                    </div>
                    <div className="col-span-2 rounded-xl bg-sb-surface-container p-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 mb-1.5">Fechas</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-sb-on-surface-variant/40" />
                        <span className="text-[13px] font-medium text-sb-on-surface">
                          {selectedTask.start_date
                            ? `${new Date(selectedTask.start_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })} → ${new Date(selectedTask.due_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}`
                            : `Hasta el ${new Date(selectedTask.due_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}`
                          }
                        </span>
                      </div>
                    </div>
                    {selectedTask.description && (
                      <div className="col-span-2 rounded-xl bg-sb-surface-container p-3.5">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 mb-1.5">Descripción</p>
                        <p className="text-[13px] whitespace-pre-line text-sb-on-surface">{selectedTask.description}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2 text-sb-on-surface">
                        <Users className="h-4 w-4 text-sb-on-surface-variant/50" />
                        Alumnos ({selectedTask.students?.length || 0})
                      </h3>
                      <div className="flex items-center gap-3 text-[11px] text-sb-on-surface-variant/50">
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sb-on-surface" /> {selectedTask.delivered_count} entregadas</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sb-on-surface/20" /> {(selectedTask.total_students || 0) - selectedTask.delivered_count} pendientes</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-sb-surface border border-sb-outline-variant/10 divide-y divide-sb-outline-variant/10 overflow-hidden">
                      {selectedTask.students && selectedTask.students.length > 0 ? (
                        <div>
                          {selectedTask.students.map((student, i) => {
                            const ss = submissionStatusConfig[student.submission_status] || submissionStatusConfig.pending
                            const isEditing = editingSubmission?.studentId === student.student_id
                            const submissionTone = student.submission_status === 'pending'
                              ? 'bg-amber-500/10 text-amber-600'
                              : student.submission_status === 'submitted'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-blue-500/10 text-blue-600'
                            return (
                              <motion.div key={student.student_id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="px-4 py-3 transition-colors">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-8 w-8 rounded-lg bg-sb-surface-container-high flex items-center justify-center text-[10px] font-semibold text-sb-on-surface-variant shrink-0">
                                      {student.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[13px] font-medium text-sb-on-surface truncate">{student.full_name}</p>
                                      <p className="text-[11px] text-sb-on-surface-variant/50">DNI: {student.dni || 'N/A'} - {student.grade} {student.section}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {student.submission_grade != null && (
                                      <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold bg-sb-surface-container-high text-sb-on-surface">
                                        {student.submission_grade}
                                      </span>
                                    )}
                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${submissionTone}`}>
                                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                      {ss.label}
                                    </span>
                                    {student.submission_status === 'pending' && (
                                      <button onClick={(e) => { e.stopPropagation(); handleMarkSubmitted(selectedTask.id, student.student_id, student.submission_id) }}
                                        className="rounded-xl px-2.5 py-1 text-[11px] font-medium bg-sb-surface-container-high text-sb-on-surface transition-colors hover:bg-sb-surface-container-highest">
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
                                        className={`rounded-xl px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                          isEditing
                                            ? "bg-sb-on-surface text-sb-surface"
                                            : "bg-sb-surface-container-high text-sb-on-surface hover:bg-sb-surface-container-highest"
                                        }`}>
                                        {student.submission_status === 'graded' ? (isEditing ? 'Cerrar' : 'Editar nota') : (isEditing ? 'Cerrar' : 'Calificar')}
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {isEditing && (
                                  <div className="mt-3 pl-11 flex items-start gap-2">
                                    <div className="w-20">
                                      <label className="text-[10px] font-semibold uppercase tracking-widest mb-1 block text-sb-on-surface-variant/50">Nota</label>
                                      <input type="number" min={0} max={20} step="0.5" value={editingSubmission.grade}
                                        onChange={e => setEditingSubmission(prev => prev ? { ...prev, grade: e.target.value } : prev)}
                                        placeholder="0-20"
                                        className="sb-input h-9 w-full px-2 text-sm rounded-xl text-center" />
                                    </div>
                                    <div className="flex-1">
                                      <label className="text-[10px] font-semibold uppercase tracking-widest mb-1 block text-sb-on-surface-variant/50">Comentario</label>
                                      <input value={editingSubmission.feedback}
                                        onChange={e => setEditingSubmission(prev => prev ? { ...prev, feedback: e.target.value } : prev)}
                                        placeholder="Retroalimentación para el alumno"
                                        className="sb-input h-9 w-full px-3 text-sm rounded-xl" />
                                    </div>
                                    <SbBtn variant="filled" size="sm" rounded disabled={gradingTaskId === student.student_id}
                                      className="mt-5 shrink-0" onClick={() => handleGradeSubmission(selectedTask.id, student)}>
                                      {gradingTaskId === student.student_id ? "Guardando..." : "Guardar"}
                                    </SbBtn>
                                  </div>
                                )}
                              </motion.div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="py-20 text-center">
                          <Users className="h-12 w-12 mx-auto mb-4 text-sb-on-surface-variant/20" />
                          <p className="text-[13px] text-sb-on-surface-variant/50">No hay alumnos inscritos en este curso</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </SbModalBody>
          </>
        )}
      </SbModal>
    </div>
  )
}
