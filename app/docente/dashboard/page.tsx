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
  if (nowMin >= start && nowMin < end) {
    return { label: "En curso", cls: "bg-emerald-500/10 text-emerald-600" }
  }
  if (end <= nowMin) {
    return { label: "Finalizada", cls: "bg-sb-surface-container-high text-sb-on-surface-variant/50" }
  }
  return { label: "Próxima", cls: "bg-amber-500/10 text-amber-600" }
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
          const todayIdx = new Date().getDay()
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

  const todayIdx = new Date().getDay()
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

  const statCards = [
    { label: "Mis cursos", value: loading ? "—" : courses.length, icon: BookOpen, color: "text-sb-primary", bg: "bg-sb-primary/8" },
    { label: "Alumnos", value: loading ? "—" : totalStudents, icon: GraduationCap, color: "text-emerald-500", bg: "bg-emerald-500/8" },
    { label: "Clases hoy", value: loading ? "—" : todaySchedule.length, icon: Calendar, color: "text-amber-500", bg: "bg-amber-500/8" },
    { label: "Horas hoy", value: loading ? "—" : `${hoursToday}h`, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/8" },
  ]

  const checkedIn = teacherAtt?.check_in
  const checkedOut = teacherAtt?.check_out

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-sb-on-surface">Panel de Docente</h1>
          <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">
            {greeting}, <span className="text-sb-on-surface-variant/70 font-medium">{teacherName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sb-on-surface/[0.04]">
            <Calendar className="h-3 w-3 text-sb-on-surface-variant/40" />
            <span className="text-[11px] text-sb-on-surface-variant font-medium">
              {new Date().toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Hero Stats */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 + i * 0.04 }}>
            <div className="bg-sb-surface rounded-2xl p-5 border border-sb-outline-variant/8 hover:border-sb-outline-variant/15 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight text-sb-on-surface">{stat.value}</p>
              <p className="text-[11px] text-sb-on-surface-variant/50 mt-1">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <PrettyTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} size="small" />
      </motion.div>

      {/* Tab: General */}
      {activeTab === "general" && (
        <motion.div key="general"
          initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.2, ease: [0.37, 0.35, 0, 1] }}
          className="grid gap-3 md:grid-cols-2">
          {/* Horario de hoy */}
          <div className="bg-sb-surface rounded-2xl p-6 border border-sb-outline-variant/8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[11px] font-semibold text-sb-on-surface-variant/50 uppercase tracking-widest">Horario de Hoy</h3>
              <Link href="/docente/horarios" className="text-[11px] text-sb-on-surface-variant/40 hover:text-sb-on-surface-variant transition-colors flex items-center gap-1">
                Ver semana <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-xl bg-sb-surface-container-high/50 animate-pulse" />
                ))}
              </div>
            ) : todaySchedule.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-8 w-8 text-sb-on-surface-variant/20 mx-auto mb-2" />
                <p className="text-[13px] text-sb-on-surface-variant/40">No hay clases hoy</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todaySchedule.map((it) => {
                  const status = classStatus(it)
                  return (
                    <div key={it.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-sb-surface-container-high/50 transition-colors">
                      <div className="text-center shrink-0 w-14">
                        <p className="text-sm font-bold text-sb-on-surface">{it.start_time.slice(0, 5)}</p>
                        <p className="text-[10px] text-sb-on-surface-variant/40">{it.end_time.slice(0, 5)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-sb-on-surface truncate">{it.course_name}</p>
                        <p className="text-[11px] text-sb-on-surface-variant/50">
                          {it.grade} {it.section && `· ${it.section}`}
                          {it.classroom && ` · ${it.classroom}`}
                        </p>
                      </div>
                      {status && (
                        <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full shrink-0 ${status.cls}`}>
                          {status.label}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Mis cursos */}
          <div className="bg-sb-surface rounded-2xl p-6 border border-sb-outline-variant/8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[11px] font-semibold text-sb-on-surface-variant/50 uppercase tracking-widest">Mis Cursos</h3>
              <Link href="/docente/cursos" className="text-[11px] text-sb-on-surface-variant/40 hover:text-sb-on-surface-variant transition-colors flex items-center gap-1">
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 rounded-xl bg-sb-surface-container-high/50 animate-pulse" />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-8 w-8 text-sb-on-surface-variant/20 mx-auto mb-2" />
                <p className="text-[13px] text-sb-on-surface-variant/40">No tienes cursos asignados</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {courses.slice(0, 4).map((c) => (
                  <Link key={c.id} href={`/docente/cursos/${c.id}`}
                    className="p-4 rounded-xl bg-sb-surface-container-high/30 hover:bg-sb-surface-container-high/60 border border-sb-outline-variant/5 transition-all">
                    <div className="h-8 w-8 rounded-lg bg-sb-surface-container-high flex items-center justify-center mb-3">
                      <BookOpen className="h-4 w-4 text-sb-on-surface-variant/60" />
                    </div>
                    <p className="text-sm font-medium text-sb-on-surface truncate">{c.name}</p>
                    <p className="text-[11px] text-sb-on-surface-variant/50 mt-0.5">{c.grade} {c.section && `· ${c.section}`}</p>
                    <p className="text-[10px] text-sb-on-surface-variant/40 mt-2">{c.students} alumnos</p>
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
          transition={{ duration: 0.2, ease: [0.37, 0.35, 0, 1] }}>
          <div className="bg-sb-surface rounded-2xl overflow-hidden border border-sb-outline-variant/8">
            <div className="px-6 pt-5 pb-3">
              <h3 className="text-[11px] font-semibold text-sb-on-surface-variant/50 uppercase tracking-widest">Horario Semanal</h3>
            </div>
            <div className="px-6 pb-6">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 rounded-xl bg-sb-surface-container-high/50 animate-pulse" />
                  ))}
                </div>
              ) : horarios.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-8 w-8 text-sb-on-surface-variant/20 mx-auto mb-2" />
                  <p className="text-[13px] text-sb-on-surface-variant/40">No hay horarios asignados</p>
                </div>
              ) : (
                <div className="divide-y divide-sb-outline-variant/8">
                  {horarios
                    .sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time))
                    .map((h, i) => (
                      <motion.div key={h.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-4 py-3 hover:bg-sb-surface-container-high/40 transition-colors -mx-2 px-2 rounded-lg">
                        <div className="w-20 shrink-0">
                          <span className="text-xs font-medium text-sb-on-surface/50">
                            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][h.day_of_week - 1]}
                          </span>
                        </div>
                        <div className="text-center shrink-0 w-16">
                          <p className="text-sm font-bold text-sb-on-surface">{h.start_time.slice(0, 5)}</p>
                          <p className="text-[10px] text-sb-on-surface-variant/40">{h.end_time.slice(0, 5)}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-sb-on-surface truncate">{h.course_name}</p>
                          <p className="text-[11px] text-sb-on-surface-variant/50">{h.grade} {h.section && `· ${h.section}`}{h.classroom && ` · ${h.classroom}`}</p>
                        </div>
                      </motion.div>
                    ))
                  }
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab: Asistencia */}
      {activeTab === "asistencia" && (
        <motion.div key="asistencia"
          initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.2, ease: [0.37, 0.35, 0, 1] }}
          className="grid gap-3 md:grid-cols-2">
          {/* Asistencia del docente */}
          <div className="bg-sb-surface rounded-2xl p-6 border border-sb-outline-variant/8">
            <h3 className="text-[11px] font-semibold text-sb-on-surface-variant/50 uppercase tracking-widest mb-5">Mi Asistencia</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-4 rounded-xl bg-sb-surface-container-high/30 text-center">
                <p className="text-[10px] text-sb-on-surface-variant/40 uppercase mb-1">Entrada</p>
                <p className={`text-xl font-bold ${checkedIn ? "text-sb-on-surface" : "text-sb-on-surface-variant/20"}`}>
                  {checkedIn ? checkedIn.slice(0, 5) : "--:--"}
                </p>
                {schedule?.start_time && (
                  <p className="text-[10px] text-sb-on-surface-variant/40 mt-1">Prog. {schedule.start_time.slice(0, 5)}</p>
                )}
              </div>
              <div className="p-4 rounded-xl bg-sb-surface-container-high/30 text-center">
                <p className="text-[10px] text-sb-on-surface-variant/40 uppercase mb-1">Salida</p>
                <p className={`text-xl font-bold ${checkedOut ? "text-sb-on-surface" : "text-sb-on-surface-variant/20"}`}>
                  {checkedOut ? checkedOut.slice(0, 5) : "--:--"}
                </p>
                {schedule?.end_time && (
                  <p className="text-[10px] text-sb-on-surface-variant/40 mt-1">Prog. {schedule.end_time.slice(0, 5)}</p>
                )}
              </div>
            </div>
            {!checkedIn && (
              <button onClick={() => handleCheck("check-in")} disabled={loading}
                className="w-full py-2.5 rounded-xl bg-sb-on-surface text-sb-surface text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                Marcar entrada
              </button>
            )}
            {checkedIn && !checkedOut && (
              <button onClick={() => handleCheck("check-out")} disabled={loading}
                className="w-full py-2.5 rounded-xl bg-sb-on-surface text-sb-surface text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                Marcar salida
              </button>
            )}
            {checkedIn && checkedOut && (
              <Link href="/docente/asistencia"
                className="block w-full py-2.5 rounded-xl border border-sb-outline-variant/20 text-center text-[13px] font-medium text-sb-on-surface hover:bg-sb-surface-container-high/50 transition-colors">
                Ver detalle de asistencia
              </Link>
            )}
          </div>

          {/* Asistencia de alumnos */}
          <div className="bg-sb-surface rounded-2xl p-6 border border-sb-outline-variant/8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[11px] font-semibold text-sb-on-surface-variant/50 uppercase tracking-widest">Asistencia Alumnos</h3>
              <Link href="/docente/asistencia" className="text-[11px] text-sb-on-surface-variant/40 hover:text-sb-on-surface-variant transition-colors flex items-center gap-1">
                Tomar asistencia <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {studentSummary && studentSummary.total > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-center">
                  <p className="text-xl font-bold text-emerald-600">{studentSummary.present}</p>
                  <p className="text-[10px] text-sb-on-surface-variant/50 mt-1">Presentes</p>
                </div>
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15 text-center">
                  <p className="text-xl font-bold text-red-600">{studentSummary.absent}</p>
                  <p className="text-[10px] text-sb-on-surface-variant/50 mt-1">Ausentes</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 text-center">
                  <p className="text-xl font-bold text-amber-600">{studentSummary.late}</p>
                  <p className="text-[10px] text-sb-on-surface-variant/50 mt-1">Tardanzas</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <UserCheck className="h-8 w-8 text-sb-on-surface-variant/20 mx-auto mb-2" />
                <p className="text-[13px] text-sb-on-surface-variant/40 mb-3">Aún no se ha registrado asistencia hoy</p>
                <Link href="/docente/asistencia"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sb-on-surface text-sb-surface text-[12px] font-medium hover:opacity-90 transition-opacity">
                  <UserCheck className="h-3.5 w-3.5" /> Tomar asistencia
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
