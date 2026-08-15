"use client"

import * as React from "react"
import Link from "next/link"
import { useAuthStore } from "@/stores/auth-store"
import { Calendar, Clock, BookOpen, GraduationCap, UserCheck, ArrowRight } from "@/components/ui/proicons"
import { motion } from "framer-motion"
import { PrettyTabs } from "@/components/dashboard/pretty-tabs"

interface Horario {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  classroom: string
  course_name: string
  grade: string
  section: string
}

interface TeacherCourse {
  id: string
  name: string
  grade: string
  section: string
  students: number
  schedule?: string
}

interface ScheduleItem {
  id: string
  start_time: string
  end_time: string
  course_name: string
  grade: string
  section: string
  classroom?: string
}

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

function classStatus(item: ScheduleItem): { label: string; cls: string } | null {
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const start = toMin(item.start_time)
  const end = toMin(item.end_time)
  if (nowMin >= start && nowMin < end) return { label: "En curso", cls: "note-badge--active" }
  if (end <= nowMin) return { label: "Finalizada", cls: "note-badge--muted" }
  return { label: "Próxima", cls: "note-badge--next" }
}

const tabs = [
  { id: "general", label: "General", icon: BookOpen },
  { id: "horario", label: "Horario", icon: Calendar },
  { id: "asistencia", label: "Asistencia", icon: UserCheck },
]

export default function DocenteDashboard() {
  const user = useAuthStore((s) => s.user)

  const [courses, setCourses] = React.useState<TeacherCourse[]>([])
  const [horarios, setHorarios] = React.useState<Horario[]>([])
  const [teacherAtt, setTeacherAtt] = React.useState<any>(null)
  const [schedule, setSchedule] = React.useState<any>(null)
  const [studentSummary, setStudentSummary] = React.useState<{
    present: number; absent: number; late: number; justified?: number; total: number
  } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState("general")

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches"
  const dateStr = new Date().toLocaleDateString("es-PE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })
  const teacherName = user?.full_name || "Docente"

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const today = new Date().toISOString().split("T")[0]
        const [c, h, a] = await Promise.all([
          fetch("/api/docente/cursos").then((r) => r.json()),
          fetch("/api/docente/horarios").then((r) => r.json()),
          fetch(`/api/docente/attendance?date=${today}`).then((r) => r.json()),
        ])
        if (cancelled) return
        setCourses(Array.isArray(c) ? c : [])
        setHorarios(Array.isArray(h) ? h : [])
        setTeacherAtt(a.attendance)
        setSchedule(a.schedule)

        try {
          const todayIdx = new Date().getDay() === 0 ? 7 : new Date().getDay()
          const todayCourses = (Array.isArray(h) ? h : [])
            .filter((hr: Horario) => hr.day_of_week === todayIdx)
          const courseIds = Array.from(new Set(todayCourses.map((hr: any) => hr.course_id).filter(Boolean)))
          if (courseIds.length > 0) {
            const summaries = await Promise.all(
              courseIds.map((cid: string) =>
                fetch(`/api/docente/student-attendance?course_id=${cid}&date=${today}`)
                  .then((r) => r.json()).catch(() => null)
              )
            )
            const totals = { present: 0, absent: 0, late: 0, justified: 0, total: 0 }
            let any = false
            for (const s of summaries) {
              if (s && s.summary) {
                any = true
                totals.present += s.summary.present || 0
                totals.absent += s.summary.absent || 0
                totals.late += s.summary.late || 0
                totals.justified += s.summary.justified || 0
                totals.total += s.summary.total || 0
              }
            }
            if (any) setStudentSummary(totals)
          }
        } catch { /* silent */ }
      } catch { /* silent */ } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const totalStudents = courses.reduce((acc, c) => acc + (c.students || 0), 0)

  const todayIdx = new Date().getDay() === 0 ? 7 : new Date().getDay()
  const todaySchedule: ScheduleItem[] = horarios
    .filter((h) => h.day_of_week === todayIdx)
    .map((h) => ({
      id: h.id, start_time: h.start_time, end_time: h.end_time,
      course_name: h.course_name, grade: h.grade, section: h.section, classroom: h.classroom,
    }))
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  const hoursToday = Math.round(
    (todaySchedule.reduce((a, h) => a + (toMin(h.end_time) - toMin(h.start_time)), 0) / 60) * 10
  ) / 10

  const handleCheck = async (action: "check-in" | "check-out") => {
    try {
      const res = await fetch("/api/docente/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (data.success) {
        setTeacherAtt(data.attendance)
        if (data.schedule) setSchedule(data.schedule)
      }
    } catch { /* silent */ }
  }

  const checkedIn = teacherAtt?.check_in
  const checkedOut = teacherAtt?.check_out

  const attendancePct = studentSummary && studentSummary.total > 0
    ? Math.round((studentSummary.present / studentSummary.total) * 100)
    : 0

  return (
    <div className="sb-note-dash space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight" style={{ color: "var(--note-text)" }}>
              Panel de Docente
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: "var(--note-muted)" }}>
              {greeting}, <span className="font-medium" style={{ color: "var(--note-text)" }}>{teacherName}</span>
            </p>
          </div>
          <div className="note-chip">
            <Calendar className="h-3 w-3" />
            <span>{new Date().toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
        </div>
      </motion.div>

      {/* Hero Stats */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
        className="note-stats-grid">
        {[
          { label: "Cursos", value: loading ? "—" : courses.length, icon: BookOpen },
          { label: "Alumnos", value: loading ? "—" : totalStudents, icon: GraduationCap },
          { label: "Clases hoy", value: loading ? "—" : todaySchedule.length, icon: Calendar },
          { label: "Horas hoy", value: loading ? "—" : `${hoursToday}h`, icon: Clock },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 + i * 0.04 }}>
            <div className="note-stat-card">
              <div className="note-stat-icon">
                <stat.icon className="h-4 w-4" />
              </div>
              <p className="note-stat-value">{stat.value}</p>
              <p className="note-stat-label">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <PrettyTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} size="small" />
      </motion.div>

      {/* Tab: General */}
      {activeTab === "general" && (
        <motion.div key="general"
          initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.2, ease: [0.37, 0.35, 0, 1] }}
          className="space-y-5">

          {/* Row 1: Horario + Distribución */}
          <div className="note-grid-2">
            {/* Horario de hoy */}
            <div className="note-card">
              <div className="note-card-head">
                <h3 className="note-card-title">Horario de Hoy</h3>
                <Link href="/docente/horarios" className="note-link">
                  Ver semana <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="note-skeleton h-12" />)}
                </div>
              ) : todaySchedule.length === 0 ? (
                <div className="note-empty">
                  <Calendar className="h-6 w-6" />
                  <p>No hay clases hoy</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {todaySchedule.map((it) => {
                    const status = classStatus(it)
                    return (
                      <div key={it.id} className="note-row">
                        <div className="note-row-time">
                          <span className="note-row-time-start">{it.start_time.slice(0, 5)}</span>
                          <span className="note-row-time-end">{it.end_time.slice(0, 5)}</span>
                        </div>
                        <div className="note-row-body">
                          <p className="note-row-title">{it.course_name}</p>
                          <p className="note-row-meta">
                            {it.grade} {it.section && `· ${it.section}`}
                            {it.classroom && ` · ${it.classroom}`}
                          </p>
                        </div>
                        {status && <span className={`note-badge ${status.cls}`}>{status.label}</span>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Distribución */}
            <div className="note-card">
              <h3 className="note-card-title mb-4">Distribución Asistencia</h3>
              {studentSummary && studentSummary.total > 0 ? (
                <div className="space-y-4">
                  {[
                    { label: "Presentes", value: studentSummary.present, total: studentSummary.total },
                    { label: "Ausentes", value: studentSummary.absent, total: studentSummary.total },
                    { label: "Tardanzas", value: studentSummary.late, total: studentSummary.total },
                  ].map((item) => {
                    const pct = item.total > 0 ? (item.value / item.total) * 100 : 0
                    return (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="note-text-sm">{item.label}</span>
                          <span className="note-text-sm font-semibold">{item.value}</span>
                        </div>
                        <div className="note-bar">
                          <div className="note-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                  <div className="pt-3" style={{ borderTop: "1px solid var(--note-hairline)" }}>
                    <div className="flex items-center justify-between">
                      <span className="note-text-sm">Tasa de asistencia</span>
                      <span className="note-text-lg font-bold">{attendancePct}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="note-empty">
                  <UserCheck className="h-6 w-6" />
                  <p>Sin datos hoy</p>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Resumen + Asistencia docente */}
          <div className="note-grid-2">
            {/* Resumen rápido */}
            <div className="note-card">
              <h3 className="note-card-title mb-4">Resumen Rápido</h3>
              <div className="space-y-0.5">
                {[
                  { label: "Horarios asignados", value: loading ? "—" : horarios.length, icon: Calendar },
                  { label: "Horas programadas", value: loading ? "—" : `${hoursToday}h`, icon: Clock },
                  { label: "Cursos activos", value: loading ? "—" : courses.length, icon: BookOpen },
                  { label: "Total alumnos", value: loading ? "—" : totalStudents, icon: GraduationCap },
                ].map((item) => (
                  <div key={item.label} className="note-row-flat">
                    <div className="flex items-center gap-2.5">
                      <item.icon className="h-3.5 w-3.5" style={{ color: "var(--note-muted)" }} />
                      <span className="note-text-sm">{item.label}</span>
                    </div>
                    <span className="note-text-sm font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Asistencia docente */}
            <div className="note-card">
              <h3 className="note-card-title mb-4">Mi Asistencia</h3>
              <div className="note-grid-2-inner mb-3">
                <div className="note-att-cell">
                  <p className="note-att-label">Entrada</p>
                  <p className="note-att-time">{checkedIn ? checkedIn.slice(0, 5) : "—"}</p>
                  {schedule?.start_time && <p className="note-att-prog">Prog. {schedule.start_time.slice(0, 5)}</p>}
                </div>
                <div className="note-att-cell">
                  <p className="note-att-label">Salida</p>
                  <p className="note-att-time">{checkedOut ? checkedOut.slice(0, 5) : "—"}</p>
                  {schedule?.end_time && <p className="note-att-prog">Prog. {schedule.end_time.slice(0, 5)}</p>}
                </div>
              </div>
              {!checkedIn && (
                <button onClick={() => handleCheck("check-in")} disabled={loading} className="note-btn-primary">
                  Marcar entrada
                </button>
              )}
              {checkedIn && !checkedOut && (
                <button onClick={() => handleCheck("check-out")} disabled={loading} className="note-btn-primary">
                  Marcar salida
                </button>
              )}
              {checkedIn && checkedOut && (
                <Link href="/docente/asistencia" className="note-btn-outline block text-center">
                  Ver detalle de asistencia
                </Link>
              )}
            </div>
          </div>

          {/* Row 3: Cursos */}
          <div className="note-card">
            <div className="note-card-head">
              <h3 className="note-card-title">Mis Cursos</h3>
              <Link href="/docente/cursos" className="note-link">
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {loading ? (
              <div className="note-grid-4">
                {[1, 2, 3, 4].map((i) => <div key={i} className="note-skeleton h-28" />)}
              </div>
            ) : courses.length === 0 ? (
              <div className="note-empty">
                <BookOpen className="h-6 w-6" />
                <p>No tienes cursos asignados</p>
              </div>
            ) : (
              <div className="note-grid-4">
                {courses.map((c) => (
                  <Link key={c.id} href={`/docente/cursos/${c.id}`} className="note-course-card">
                    <div className="note-course-icon">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <p className="note-course-name">{c.name}</p>
                    <p className="note-course-meta">{c.grade} {c.section && `· ${c.section}`}</p>
                    <div className="note-course-foot">
                      <span className="note-course-students">
                        <GraduationCap className="h-3 w-3" />
                        {c.students} alumnos
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Tab: Horario */}
      {activeTab === "horario" && (
        <motion.div key="horario"
          initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.2, ease: [0.37, 0.35, 0, 1] }}
          className="space-y-5">

          {/* Barras por día */}
          <div className="note-card">
            <h3 className="note-card-title mb-4">Horarios por Día</h3>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => <div key={i} className="note-skeleton h-8" />)}
              </div>
            ) : horarios.length === 0 ? (
              <div className="note-empty">
                <Calendar className="h-6 w-6" />
                <p>No hay horarios</p>
              </div>
            ) : (() => {
              const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
              const maxCount = Math.max(...dayNames.map((_, i) => horarios.filter(h => h.day_of_week === i + 1).length), 1)
              return (
                <div className="space-y-2.5">
                  {dayNames.map((day, i) => {
                    const count = horarios.filter(h => h.day_of_week === i + 1).length
                    const pct = (count / maxCount) * 100
                    return (
                      <motion.div key={day} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }} className="note-bar-row">
                        <span className="note-bar-label">{day}</span>
                        <div className="note-bar"><div className="note-bar-fill" style={{ width: `${pct}%` }} /></div>
                        <span className="note-bar-value">{count}</span>
                      </motion.div>
                    )
                  })}
                </div>
              )
            })()}
          </div>

          {/* Lista detallada */}
          <div className="note-card">
            <h3 className="note-card-title mb-4">Detalle Semanal</h3>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => <div key={i} className="note-skeleton h-12" />)}
              </div>
            ) : (
              <div className="space-y-0.5">
                {horarios
                  .sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time))
                  .map((h, i) => (
                    <motion.div key={h.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }} className="note-row">
                      <div className="note-row-day">
                        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][h.day_of_week - 1]}
                      </div>
                      <div className="note-row-time">
                        <span className="note-row-time-start">{h.start_time.slice(0, 5)}</span>
                        <span className="note-row-time-end">{h.end_time.slice(0, 5)}</span>
                      </div>
                      <div className="note-row-body">
                        <p className="note-row-title">{h.course_name}</p>
                        <p className="note-row-meta">{h.grade} {h.section && `· ${h.section}`}{h.classroom && ` · ${h.classroom}`}</p>
                      </div>
                    </motion.div>
                  ))
                }
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Tab: Asistencia */}
      {activeTab === "asistencia" && (
        <motion.div key="asistencia"
          initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.2, ease: [0.37, 0.35, 0, 1] }}
          className="space-y-5">

          {/* Stats resumen */}
          <div className="note-stats-grid-3">
            {[
              { label: "Presentes", value: studentSummary?.present || 0, icon: UserCheck },
              { label: "Ausentes", value: studentSummary?.absent || 0, icon: UserCheck },
              { label: "Tardanzas", value: studentSummary?.late || 0, icon: Clock },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 + i * 0.04 }}>
                <div className="note-stat-card">
                  <div className="note-stat-icon">
                    <stat.icon className="h-4 w-4" />
                  </div>
                  <p className="note-stat-value">{stat.value}</p>
                  <p className="note-stat-label">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="note-grid-2">
            {/* Asistencia docente */}
            <div className="note-card">
              <h3 className="note-card-title mb-4">Mi Asistencia</h3>
              <div className="note-grid-2-inner mb-3">
                <div className="note-att-cell">
                  <p className="note-att-label">Entrada</p>
                  <p className="note-att-time">{checkedIn ? checkedIn.slice(0, 5) : "—"}</p>
                  {schedule?.start_time && <p className="note-att-prog">Prog. {schedule.start_time.slice(0, 5)}</p>}
                </div>
                <div className="note-att-cell">
                  <p className="note-att-label">Salida</p>
                  <p className="note-att-time">{checkedOut ? checkedOut.slice(0, 5) : "—"}</p>
                  {schedule?.end_time && <p className="note-att-prog">Prog. {schedule.end_time.slice(0, 5)}</p>}
                </div>
              </div>
              {!checkedIn && (
                <button onClick={() => handleCheck("check-in")} disabled={loading} className="note-btn-primary">
                  Marcar entrada
                </button>
              )}
              {checkedIn && !checkedOut && (
                <button onClick={() => handleCheck("check-out")} disabled={loading} className="note-btn-primary">
                  Marcar salida
                </button>
              )}
              {checkedIn && checkedOut && (
                <Link href="/docente/asistencia" className="note-btn-outline block text-center">
                  Ver detalle de asistencia
                </Link>
              )}
            </div>

            {/* Distribución */}
            <div className="note-card">
              <h3 className="note-card-title mb-4">Distribución del Día</h3>
              {studentSummary && studentSummary.total > 0 ? (
                <div className="space-y-4">
                  {[
                    { label: "Presentes", value: studentSummary.present, total: studentSummary.total },
                    { label: "Ausentes", value: studentSummary.absent, total: studentSummary.total },
                    { label: "Tardanzas", value: studentSummary.late, total: studentSummary.total },
                  ].map((item) => {
                    const pct = item.total > 0 ? (item.value / item.total) * 100 : 0
                    return (
                      <div key={item.label} className="flex items-center gap-3">
                        <span className="note-text-sm w-20 shrink-0">{item.label}</span>
                        <div className="note-bar flex-1"><div className="note-bar-fill" style={{ width: `${pct}%` }} /></div>
                        <span className="note-text-sm font-semibold w-8 text-right">{item.value}</span>
                        <span className="note-text-xs w-10 text-right" style={{ color: "var(--note-muted)" }}>{Math.round(pct)}%</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="note-empty">
                  <UserCheck className="h-6 w-6" />
                  <p>Sin datos hoy</p>
                  <Link href="/docente/asistencia" className="note-btn-primary mt-3 inline-flex">
                    <UserCheck className="h-3.5 w-3.5" /> Tomar asistencia
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
