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
  if (nowMin >= start && nowMin < end) return { label: "En curso", cls: "bg-foreground text-background" }
  if (end <= nowMin) return { label: "Finalizada", cls: "bg-foreground/10 text-muted-foreground" }
  return { label: "Próxima", cls: "bg-foreground/5 text-muted-foreground" }
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
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12 lg:py-16">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 lg:mb-16"
        >
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-4">
            <span className="w-8 h-px bg-foreground/30" />
            Panel Docente
          </span>
          <h1 className="text-4xl lg:text-5xl font-display tracking-tight">
            {greeting}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            <span className="font-medium text-foreground">{teacherName}</span> — {new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </motion.header>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-foreground/10 rounded-xl overflow-hidden mb-12 lg:mb-16"
        >
          {[
            { label: "Cursos", value: loading ? "—" : courses.length, icon: BookOpen },
            { label: "Alumnos", value: loading ? "—" : totalStudents, icon: GraduationCap },
            { label: "Clases hoy", value: loading ? "—" : todaySchedule.length, icon: Calendar },
            { label: "Horas hoy", value: loading ? "—" : `${hoursToday}h`, icon: Clock },
          ].map((stat) => (
            <div key={stat.label} className="bg-background p-5 lg:p-6">
              <div className="flex items-center gap-2 mb-3">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-mono text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl lg:text-3xl font-display tracking-tight">{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-8"
        >
          <PrettyTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} size="small" />
        </motion.div>

        {/* Tab: General */}
        {activeTab === "general" && (
          <motion.div
            key="general"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Row 1: Horario + Distribución */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-foreground/10 rounded-xl overflow-hidden">
              {/* Horario de hoy */}
              <div className="bg-background p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-display">Horario de Hoy</h3>
                  <Link href="/docente/horarios" className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                    Ver semana <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-foreground/5 animate-pulse" />)}
                  </div>
                ) : todaySchedule.length === 0 ? (
                  <div className="py-12 text-center">
                    <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No hay clases hoy</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todaySchedule.map((it) => {
                      const status = classStatus(it)
                      return (
                        <div key={it.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-foreground/5 transition-colors">
                          <div className="text-center shrink-0 w-14">
                            <p className="text-sm font-mono font-medium">{it.start_time.slice(0, 5)}</p>
                            <p className="text-xs text-muted-foreground">{it.end_time.slice(0, 5)}</p>
                          </div>
                          <div className="flex-1 min-w-0 border-l border-foreground/10 pl-4">
                            <p className="text-sm font-display truncate">{it.course_name}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {it.grade} {it.section} {it.classroom && `· ${it.classroom}`}
                            </p>
                          </div>
                          {status && (
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg ${status.cls}`}>
                              {status.label}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Distribución */}
              <div className="bg-background p-6">
                <h3 className="text-lg font-display mb-6">Distribución Asistencia</h3>
                {studentSummary && studentSummary.total > 0 ? (
                  <div className="space-y-5">
                    {[
                      { label: "Presentes", value: studentSummary.present, total: studentSummary.total },
                      { label: "Ausentes", value: studentSummary.absent, total: studentSummary.total },
                      { label: "Tardanzas", value: studentSummary.late, total: studentSummary.total },
                    ].map((item) => {
                      const pct = item.total > 0 ? (item.value / item.total) * 100 : 0
                      return (
                        <div key={item.label}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">{item.label}</span>
                            <span className="text-sm font-mono font-medium">{item.value}</span>
                          </div>
                          <div className="h-2 bg-foreground/5 rounded-full overflow-hidden">
                            <div className="h-full bg-foreground/40 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                    <div className="pt-4 border-t border-foreground/10">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tasa de asistencia</span>
                        <span className="text-xl font-display font-bold">{attendancePct}%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <UserCheck className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Sin datos hoy</p>
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Resumen + Asistencia docente */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-foreground/10 rounded-xl overflow-hidden">
              {/* Resumen rápido */}
              <div className="bg-background p-6">
                <h3 className="text-lg font-display mb-6">Resumen Rápido</h3>
                <div className="space-y-4">
                  {[
                    { label: "Horarios asignados", value: loading ? "—" : horarios.length, icon: Calendar },
                    { label: "Horas programadas", value: loading ? "—" : `${hoursToday}h`, icon: Clock },
                    { label: "Cursos activos", value: loading ? "—" : courses.length, icon: BookOpen },
                    { label: "Total alumnos", value: loading ? "—" : totalStudents, icon: GraduationCap },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-foreground/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                      </div>
                      <span className="text-sm font-mono font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Asistencia docente */}
              <div className="bg-background p-6">
                <h3 className="text-lg font-display mb-6">Mi Asistencia</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-foreground/5">
                    <p className="text-xs font-mono text-muted-foreground mb-1">Entrada</p>
                    <p className="text-2xl font-display font-bold">{checkedIn ? checkedIn.slice(0, 5) : "—"}</p>
                    {schedule?.start_time && <p className="text-xs text-muted-foreground mt-1">Prog. {schedule.start_time.slice(0, 5)}</p>}
                  </div>
                  <div className="p-4 rounded-xl bg-foreground/5">
                    <p className="text-xs font-mono text-muted-foreground mb-1">Salida</p>
                    <p className="text-2xl font-display font-bold">{checkedOut ? checkedOut.slice(0, 5) : "—"}</p>
                    {schedule?.end_time && <p className="text-xs text-muted-foreground mt-1">Prog. {schedule.end_time.slice(0, 5)}</p>}
                  </div>
                </div>
                {!checkedIn && (
                  <button onClick={() => handleCheck("check-in")} disabled={loading}
                    className="w-full h-11 rounded-xl bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50">
                    Marcar entrada
                  </button>
                )}
                {checkedIn && !checkedOut && (
                  <button onClick={() => handleCheck("check-out")} disabled={loading}
                    className="w-full h-11 rounded-xl bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50">
                    Marcar salida
                  </button>
                )}
                {checkedIn && checkedOut && (
                  <Link href="/docente/asistencia"
                    className="w-full h-11 rounded-xl border border-foreground/10 text-sm font-medium flex items-center justify-center hover:bg-foreground/5 transition-colors">
                    Ver detalle de asistencia
                  </Link>
                )}
              </div>
            </div>

            {/* Row 3: Cursos */}
            <div className="bg-background rounded-xl border border-foreground/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-display">Mis Cursos</h3>
                <Link href="/docente/cursos" className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                  Ver todos <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 rounded-xl bg-foreground/5 animate-pulse" />)}
                </div>
              ) : courses.length === 0 ? (
                <div className="py-12 text-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No tienes cursos asignados</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {courses.map((c) => (
                    <Link key={c.id} href={`/docente/cursos/${c.id}`}
                      className="p-4 rounded-xl border border-foreground/10 hover:border-foreground/20 hover:bg-foreground/5 transition-all group">
                      <div className="h-10 w-10 rounded-lg bg-foreground/5 flex items-center justify-center mb-3 group-hover:bg-foreground/10 transition-colors">
                        <BookOpen className="h-5 w-5 text-foreground/70" />
                      </div>
                      <p className="text-sm font-display font-medium truncate group-hover:translate-x-0.5 transition-transform">{c.name}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{c.grade} {c.section}</p>
                      <div className="mt-3 pt-3 border-t border-foreground/5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <GraduationCap className="h-3 w-3" /> {c.students} alumnos
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
          <motion.div
            key="horario"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Barras por día */}
            <div className="bg-background rounded-xl border border-foreground/10 p-6">
              <h3 className="text-lg font-display mb-6">Horarios por Día</h3>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-10 rounded-xl bg-foreground/5 animate-pulse" />)}
                </div>
              ) : horarios.length === 0 ? (
                <div className="py-12 text-center">
                  <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No hay horarios</p>
                </div>
              ) : (() => {
                const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
                const maxCount = Math.max(...dayNames.map((_, i) => horarios.filter(h => h.day_of_week === i + 1).length), 1)
                return (
                  <div className="space-y-3">
                    {dayNames.map((day, i) => {
                      const count = horarios.filter(h => h.day_of_week === i + 1).length
                      const pct = (count / maxCount) * 100
                      return (
                        <div key={day} className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground w-24 shrink-0">{day}</span>
                          <div className="flex-1 h-8 bg-foreground/5 rounded-lg overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5, delay: i * 0.05 }}
                              className="h-full bg-foreground/20 rounded-lg"
                            />
                          </div>
                          <span className="text-sm font-mono text-muted-foreground w-8 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>

            {/* Lista detallada */}
            <div className="bg-background rounded-xl border border-foreground/10 p-6">
              <h3 className="text-lg font-display mb-6">Detalle Semanal</h3>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 rounded-xl bg-foreground/5 animate-pulse" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {horarios
                    .sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time))
                    .map((h) => (
                      <div key={h.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-foreground/5 transition-colors">
                        <span className="text-xs font-mono text-muted-foreground w-12 shrink-0">
                          {["Lun", "Mar", "Mié", "Jue", "Vie"][h.day_of_week - 1]}
                        </span>
                        <div className="text-center shrink-0 w-14">
                          <p className="text-sm font-mono font-medium">{h.start_time.slice(0, 5)}</p>
                          <p className="text-xs text-muted-foreground">{h.end_time.slice(0, 5)}</p>
                        </div>
                        <div className="flex-1 min-w-0 border-l border-foreground/10 pl-4">
                          <p className="text-sm font-display truncate">{h.course_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {h.grade} {h.section} {h.classroom && `· ${h.classroom}`}
                          </p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab: Asistencia */}
        {activeTab === "asistencia" && (
          <motion.div
            key="asistencia"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Stats resumen */}
            <div className="grid grid-cols-3 gap-px bg-foreground/10 rounded-xl overflow-hidden">
              {[
                { label: "Presentes", value: studentSummary?.present || 0, icon: UserCheck },
                { label: "Ausentes", value: studentSummary?.absent || 0, icon: UserCheck },
                { label: "Tardanzas", value: studentSummary?.late || 0, icon: Clock },
              ].map((stat) => (
                <div key={stat.label} className="bg-background p-5 lg:p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-mono text-muted-foreground">{stat.label}</span>
                  </div>
                  <p className="text-2xl lg:text-3xl font-display tracking-tight">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-foreground/10 rounded-xl overflow-hidden">
              {/* Asistencia docente */}
              <div className="bg-background p-6">
                <h3 className="text-lg font-display mb-6">Mi Asistencia</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-foreground/5">
                    <p className="text-xs font-mono text-muted-foreground mb-1">Entrada</p>
                    <p className="text-2xl font-display font-bold">{checkedIn ? checkedIn.slice(0, 5) : "—"}</p>
                    {schedule?.start_time && <p className="text-xs text-muted-foreground mt-1">Prog. {schedule.start_time.slice(0, 5)}</p>}
                  </div>
                  <div className="p-4 rounded-xl bg-foreground/5">
                    <p className="text-xs font-mono text-muted-foreground mb-1">Salida</p>
                    <p className="text-2xl font-display font-bold">{checkedOut ? checkedOut.slice(0, 5) : "—"}</p>
                    {schedule?.end_time && <p className="text-xs text-muted-foreground mt-1">Prog. {schedule.end_time.slice(0, 5)}</p>}
                  </div>
                </div>
                {!checkedIn && (
                  <button onClick={() => handleCheck("check-in")} disabled={loading}
                    className="w-full h-11 rounded-xl bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50">
                    Marcar entrada
                  </button>
                )}
                {checkedIn && !checkedOut && (
                  <button onClick={() => handleCheck("check-out")} disabled={loading}
                    className="w-full h-11 rounded-xl bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50">
                    Marcar salida
                  </button>
                )}
                {checkedIn && checkedOut && (
                  <Link href="/docente/asistencia"
                    className="w-full h-11 rounded-xl border border-foreground/10 text-sm font-medium flex items-center justify-center hover:bg-foreground/5 transition-colors">
                    Ver detalle de asistencia
                  </Link>
                )}
              </div>

              {/* Distribución */}
              <div className="bg-background p-6">
                <h3 className="text-lg font-display mb-6">Distribución del Día</h3>
                {studentSummary && studentSummary.total > 0 ? (
                  <div className="space-y-5">
                    {[
                      { label: "Presentes", value: studentSummary.present, total: studentSummary.total },
                      { label: "Ausentes", value: studentSummary.absent, total: studentSummary.total },
                      { label: "Tardanzas", value: studentSummary.late, total: studentSummary.total },
                    ].map((item) => {
                      const pct = item.total > 0 ? (item.value / item.total) * 100 : 0
                      return (
                        <div key={item.label}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">{item.label}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-mono font-medium">{item.value}</span>
                              <span className="text-xs font-mono text-muted-foreground w-10 text-right">{Math.round(pct)}%</span>
                            </div>
                          </div>
                          <div className="h-2 bg-foreground/5 rounded-full overflow-hidden">
                            <div className="h-full bg-foreground/40 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <UserCheck className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Sin datos hoy</p>
                    <Link href="/docente/asistencia"
                      className="mt-4 inline-flex h-10 px-4 rounded-xl bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors">
                      Tomar asistencia
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
