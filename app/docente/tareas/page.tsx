"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { ClipboardList, Plus, Calendar, CheckCircle2, Clock, AlertTriangle, BookOpen, Users, X, Eye, Search, GraduationCap, ChevronDown } from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import { SbBtn, SbModal, SbModalHeader, SbModalBody, SbModalFooter } from "@/components/ui/sb"

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

const staggerItem = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }
const listItem = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, filter: "blur(8px)", y: -10 },
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string; bg: string; dot: string }> = {
  pending: { icon: Clock, color: 'text-amber-600', label: 'Pendiente', bg: 'bg-amber-500/10', dot: 'bg-amber-500' },
  delivered: { icon: CheckCircle2, color: 'text-blue-600', label: 'Entregada', bg: 'bg-blue-500/10', dot: 'bg-blue-500' },
  graded: { icon: CheckCircle2, color: 'text-emerald-600', label: 'Calificada', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500' },
}

const priorityConfig: Record<string, { color: string; label: string; bg: string }> = {
  high: { color: 'text-red-500', label: 'Alta', bg: 'bg-red-500/10' },
  medium: { color: 'text-amber-500', label: 'Media', bg: 'bg-amber-500/10' },
  low: { color: 'text-sb-on-surface-variant/40', label: 'Baja', bg: 'bg-sb-surface-container' },
}

const submissionStatusConfig: Record<string, { color: string; label: string; bg: string; dot: string }> = {
  pending: { color: 'text-amber-600', label: 'Pendiente', bg: 'bg-amber-500/10', dot: 'bg-amber-500' },
  submitted: { color: 'text-blue-600', label: 'Entregada', bg: 'bg-blue-500/10', dot: 'bg-blue-500' },
  graded: { color: 'text-emerald-600', label: 'Calificada', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500' },
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

  const selectedCourseName = courses.find(c => c.id === formData.course_id)?.name || ""

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Tareas</h1>
          <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">Gestiona las tareas de tus alumnos</p>
        </div>
        <SbBtn variant="filled" rounded className="flex items-center gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Nueva tarea
        </SbBtn>
      </motion.div>

      {/* Stats */}
      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: tasks.length, icon: ClipboardList, color: "text-sb-on-surface", bg: "bg-sb-on-surface/8" },
          { label: "Pendientes", value: counts.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-500/8" },
          { label: "Entregadas", value: counts.delivered, icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-500/8" },
          { label: "Calificadas", value: counts.graded, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/8" },
        ].map(s => {
          const Icon = s.icon
          return (
            <motion.div key={s.label} variants={staggerItem} className="bg-sb-surface rounded-[6px] p-4">
              <div className={`h-9 w-9 rounded-[6px] flex items-center justify-center mb-3 ${s.bg}`}>
                <Icon className={`h-4.5 w-4.5 ${s.color}`} />
              </div>
              <p className="text-xl font-bold tracking-tight text-sb-on-surface">{s.value}</p>
              <p className="text-[11px] text-sb-on-surface-variant/45 mt-0.5">{s.label}</p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/30" />
          <input placeholder="Buscar tarea..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="sb-input rounded-[6px] text-sm h-10 w-full pl-9" />
        </div>
        <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}
          className="sbf-native-select sm:w-56">
          <option value="">Todos los cursos</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.name} - {c.grade}{c.section}</option>
          ))}
        </select>
        <div className="flex gap-2 flex-wrap">
          {([
            { key: 'all', label: 'Todas' },
            { key: 'pending', label: 'Pendientes' },
            { key: 'delivered', label: 'Entregadas' },
            { key: 'graded', label: 'Calificadas' },
          ]).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[6px] text-sm font-medium transition-all ${
                filter === f.key
                  ? 'bg-sb-on-surface text-sb-surface'
                  : 'bg-sb-surface-container text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high'
              }`}>
              {f.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-[6px] font-semibold ${
                filter === f.key ? 'bg-white/20' : 'bg-sb-surface-container-high text-sb-on-surface-variant/40'
              }`}>
                {counts[f.key as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>
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
              <motion.div key={t.id} variants={listItem} initial="hidden" animate="show" exit="exit"
                transition={{ duration: 0.3, delay: i * 0.04 }}
                onClick={() => fetchTaskDetail(t.id)}
                className={`bg-sb-surface rounded-[6px] overflow-hidden cursor-pointer hover:bg-sb-surface-container-high/50 transition-all duration-200 ${isOverdue ? 'ring-1 ring-red-500/20' : ''}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-[6px] ${sc.bg} ${sc.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-[6px] ${sc.dot}`} />
                          {sc.label}
                        </span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-[6px] ${pc.bg} ${pc.color}`}>
                          {pc.label}
                        </span>
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-[6px] bg-red-500/10 text-red-500">
                            <AlertTriangle className="h-3 w-3" /> Vencida
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-sb-on-surface">{t.title}</p>
                      {t.description && (
                        <p className="text-xs text-sb-on-surface-variant/40 mt-1 line-clamp-2">{t.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-sb-on-surface-variant/20">
                      <Eye className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-sb-on-surface-variant/30" />
                        <span className="text-[10px] text-sb-on-surface-variant/40 font-medium">{t.delivered_count}/{t.total_students} entregas</span>
                      </div>
                      <span className="text-[10px] text-sb-on-surface-variant/40 font-medium">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-sb-surface-container rounded-[6px] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                        className={`h-full rounded-[6px] ${
                          progress >= 80 ? 'bg-emerald-400' : progress >= 40 ? 'bg-amber-400' : 'bg-red-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-4 px-5 py-3 bg-sb-surface-container/30 border-t border-sb-outline-variant/10">
                  {course && (
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-sb-on-surface-variant/30" />
                      <span className="text-[10px] text-sb-on-surface-variant/45 font-medium">{course.name} - {course.grade}{course.section}</span>
                    </div>
                  )}
                  {t.subject && (
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-sb-on-surface-variant/30" />
                      <span className="text-[10px] text-sb-on-surface-variant/45 font-medium">{t.subject}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-sb-on-surface-variant/30" />
                    {t.start_date ? (
                      <span className={`text-[10px] font-medium ${
                        isOverdue ? 'text-red-500' : daysLeft <= 3 ? 'text-amber-600' : 'text-sb-on-surface-variant/45'
                      }`}>
                        {new Date(t.start_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })} → {new Date(t.due_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                        {isOverdue ? ' (vencida)' : daysLeft === 0 ? ' (hoy)' : ''}
                      </span>
                    ) : (
                      <span className={`text-[10px] font-medium ${
                        isOverdue ? 'text-red-500' : daysLeft <= 3 ? 'text-amber-600' : 'text-sb-on-surface-variant/45'
                      }`}>
                        {isOverdue ? `Vencida hace ${Math.abs(daysLeft)} dias` : daysLeft === 0 ? 'Vence hoy' : daysLeft === 1 ? 'Vence manana' : `Vence en ${daysLeft} dias`}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {!loading && filtered.length === 0 && (
          <div className="bg-sb-surface rounded-[6px] py-12 text-center">
            <ClipboardList className="h-10 w-10 text-sb-on-surface-variant/15 mx-auto mb-3" />
            <p className="text-sm text-sb-on-surface-variant/30">No hay tareas en esta categoria</p>
          </div>
        )}

        {loading && (
          <div className="bg-sb-surface rounded-[6px] py-12 text-center">
            <div className="h-6 w-6 border-2 border-sb-primary/30 border-t-sb-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-sb-on-surface-variant/30">Cargando tareas...</p>
          </div>
        )}
      </div>

      {/* ===== CREATE DIALOG ===== */}
      <SbModal open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="520px">
        <SbModalHeader title="Nueva tarea" onClose={() => setDialogOpen(false)} />
        <SbModalBody>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Curso */}
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Curso *</label>
              <select value={formData.course_id} onChange={e => setFormData({...formData, course_id: e.target.value})}
                className="sbf-native-select w-full">
                <option value="">Seleccionar curso</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.grade}{c.section} ({c.student_count} alumnos)</option>
                ))}
              </select>
            </div>

            {/* Titulo */}
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Titulo de la tarea *</label>
              <input placeholder="Ej: Ejercicios de algebra - Cap. 3" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                className="sb-input rounded-[6px] text-sm h-10 w-full" />
            </div>

            {/* Asignatura + Prioridad */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Asignatura</label>
                <input placeholder="Ej: Matematica" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}
                  className="sb-input rounded-[6px] text-sm h-10 w-full" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Prioridad</label>
                <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}
                  className="sbf-native-select w-full">
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>
            </div>

            {/* Fechas */}
            <div className="bg-sb-surface-container/50 rounded-[6px] p-4 space-y-3">
              <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">Fechas de la tarea</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-sb-on-surface-variant/60 mb-1 block">Fecha de inicio</label>
                  <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})}
                    className="sb-input rounded-[6px] text-sm h-10 w-full" />
                  <p className="text-[9px] text-sb-on-surface-variant/30 mt-1">Desde cuando esta disponible</p>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-sb-on-surface-variant/60 mb-1 block">Fecha de vencimiento *</label>
                  <input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})}
                    className="sb-input rounded-[6px] text-sm h-10 w-full" />
                  <p className="text-[9px] text-sb-on-surface-variant/30 mt-1">Ultimo dia para entregar</p>
                </div>
              </div>
            </div>

            {/* Descripcion */}
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Descripcion e instrucciones</label>
              <textarea placeholder="Describe detalladamente la tarea: objetivos, requisitos, criterios de evaluacion, material de referencia..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                className="sb-input rounded-[6px] text-sm h-24 w-full resize-none" />
            </div>
          </motion.div>
        </SbModalBody>
        <SbModalFooter>
          <SbBtn rounded onClick={() => setDialogOpen(false)}>Cancelar</SbBtn>
          <SbBtn variant="filled" rounded disabled={!formData.title || !formData.course_id} onClick={handleCreate}>Crear tarea</SbBtn>
        </SbModalFooter>
      </SbModal>

      {/* ===== DETAIL MODAL ===== */}
      <SbModal open={detailOpen} onClose={() => { setDetailOpen(false); setSelectedTask(null) }} maxWidth="680px">
        {selectedTask && (
          <>
            <SbModalHeader title={selectedTask.title} onClose={() => { setDetailOpen(false); setSelectedTask(null) }} />
            <SbModalBody>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                {/* Task Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-sb-surface-container/50 rounded-[6px] p-3">
                    <p className="text-[10px] text-sb-on-surface-variant/40 uppercase tracking-wider mb-1">Estado</p>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-[6px] ${statusConfig[selectedTask.status].bg} ${statusConfig[selectedTask.status].color}`}>
                      <span className={`h-1.5 w-1.5 rounded-[6px] ${statusConfig[selectedTask.status].dot}`} />
                      {statusConfig[selectedTask.status].label}
                    </span>
                  </div>
                  <div className="bg-sb-surface-container/50 rounded-[6px] p-3">
                    <p className="text-[10px] text-sb-on-surface-variant/40 uppercase tracking-wider mb-1">Prioridad</p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-[6px] ${priorityConfig[selectedTask.priority].bg} ${priorityConfig[selectedTask.priority].color}`}>
                      {priorityConfig[selectedTask.priority].label}
                    </span>
                  </div>
                  <div className="col-span-2 bg-sb-surface-container/50 rounded-[6px] p-3">
                    <p className="text-[10px] text-sb-on-surface-variant/40 uppercase tracking-wider mb-1">Fechas</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-sb-on-surface-variant/40" />
                      <span className="text-xs font-medium text-sb-on-surface">
                        {selectedTask.start_date
                          ? `${new Date(selectedTask.start_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })} → ${new Date(selectedTask.due_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}`
                          : `Hasta el ${new Date(selectedTask.due_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}`
                        }
                      </span>
                    </div>
                  </div>
                  {selectedTask.description && (
                    <div className="col-span-2 bg-sb-surface-container/50 rounded-[6px] p-3">
                      <p className="text-[10px] text-sb-on-surface-variant/40 uppercase tracking-wider mb-1">Descripcion</p>
                      <p className="text-xs text-sb-on-surface whitespace-pre-line">{selectedTask.description}</p>
                    </div>
                  )}
                </div>

                {/* Students List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-sb-on-surface flex items-center gap-2">
                      <Users className="h-4 w-4 text-sb-on-surface-variant/40" />
                      Alumnos ({selectedTask.students?.length || 0})
                    </h3>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-[6px] bg-blue-500" /> {selectedTask.delivered_count} entregadas</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-[6px] bg-amber-500" /> {(selectedTask.total_students || 0) - selectedTask.delivered_count} pendientes</span>
                    </div>
                  </div>

                  <div className="bg-sb-surface-container/30 rounded-[6px] overflow-hidden">
                    {selectedTask.students && selectedTask.students.length > 0 ? (
                      <div className="divide-y divide-sb-outline-variant/10">
                        {selectedTask.students.map((student, i) => {
                          const ss = submissionStatusConfig[student.submission_status] || submissionStatusConfig.pending
                          const isEditing = editingSubmission?.studentId === student.student_id
                          return (
                            <motion.div key={student.student_id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03 }}
                              className="px-4 py-3 hover:bg-sb-surface-container/50 transition-colors">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="h-8 w-8 rounded-[6px] bg-sb-on-surface/8 flex items-center justify-center text-[10px] font-bold text-sb-on-surface-variant/60 shrink-0">
                                    {student.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-sb-on-surface truncate">{student.full_name}</p>
                                    <p className="text-[10px] text-sb-on-surface-variant/40">DNI: {student.dni || 'N/A'} - {student.grade}{student.section}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {student.submission_grade != null && (
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-[6px]">
                                      {student.submission_grade}
                                    </span>
                                  )}
                                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-[6px] ${ss.bg} ${ss.color}`}>
                                    <span className={`h-1.5 w-1.5 rounded-[6px] ${ss.dot}`} />
                                    {ss.label}
                                  </span>
                                  {student.submission_status === 'pending' && (
                                    <button onClick={(e) => { e.stopPropagation(); handleMarkSubmitted(selectedTask.id, student.student_id, student.submission_id) }}
                                      className="text-[10px] font-medium text-blue-600 hover:text-blue-700 bg-blue-500/10 px-2.5 py-1 rounded-[6px] transition-colors">
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
                                      className={`text-[10px] font-medium px-2.5 py-1 rounded-[6px] transition-colors ${
                                        isEditing ? 'text-sb-on-surface bg-sb-surface-container-high' : 'text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20'
                                      }`}>
                                      {student.submission_status === 'graded' ? (isEditing ? 'Cerrar' : 'Editar nota') : (isEditing ? 'Cerrar' : 'Calificar')}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Grading inline */}
                              {isEditing && (
                                <div className="mt-3 pl-11 flex items-start gap-2">
                                  <div className="w-20">
                                    <label className="text-[9px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1 block">Nota</label>
                                    <input type="number" min={0} max={20} step="0.5" value={editingSubmission.grade}
                                      onChange={e => setEditingSubmission(prev => prev ? { ...prev, grade: e.target.value } : prev)}
                                      placeholder="0-20"
                                      className="sb-input rounded-[6px] text-sm h-9 w-full text-center" />
                                  </div>
                                  <div className="flex-1">
                                    <label className="text-[9px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1 block">Comentario</label>
                                    <input value={editingSubmission.feedback}
                                      onChange={e => setEditingSubmission(prev => prev ? { ...prev, feedback: e.target.value } : prev)}
                                      placeholder="Retroalimentación para el alumno"
                                      className="sb-input rounded-[6px] text-sm h-9 w-full" />
                                  </div>
                                  <button onClick={() => handleGradeSubmission(selectedTask.id, student)} disabled={gradingTaskId === student.student_id}
                                    className="h-9 px-4 rounded-[6px] bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50 mt-5 shrink-0">
                                    {gradingTaskId === student.student_id ? "Guardando..." : "Guardar"}
                                  </button>
                                </div>
                              )}
                            </motion.div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <Users className="h-8 w-8 text-sb-on-surface-variant/15 mx-auto mb-2" />
                        <p className="text-xs text-sb-on-surface-variant/30">No hay alumnos inscritos en este curso</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </SbModalBody>
          </>
        )}
        {detailLoading && (
          <div className="py-12 text-center">
            <div className="h-6 w-6 border-2 border-sb-primary/30 border-t-sb-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-sb-on-surface-variant/30">Cargando detalles...</p>
          </div>
        )}
      </SbModal>
    </div>
  )
}
