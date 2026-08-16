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

function classStatus(item: ScheduleItem): { label: string; bg: string; color: string } | null {
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const start = toMin(item.start_time)
  const end = toMin(item.end_time)
  if (nowMin >= start && nowMin < end) return { label: "En curso", bg: "var(--sb-on-surface)", color: "var(--sb-surface)" }
  if (end <= nowMin) return { label: "Finalizada", bg: "var(--sb-surface-container-high)", color: "var(--sb-on-surface-variant)" }
  return { label: "Próxima", bg: "var(--sb-surface-container)", color: "var(--sb-on-surface-variant)" }
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
    <div className="min-h-screen" style={{ background: "var(--sb-surface)" }}>
      <div className="mx-auto px-4 sm:px-6 lg:px-10 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <span
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.8px]"
            style={{ color: "var(--sb-on-surface-variant)", opacity: 0.45 }}
          >
            <span className="w-6 h-px" style={{ background: "var(--sb-outline-variant)" }} />
            Panel Docente
          </span>
          <h1
            className="text-2xl font-semibold mt-2"
            style={{
              color: "var(--sb-on-surface)",
              fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif",
              letterSpacing: "-0.02em"
            }}
          >
            {greeting}
          </h1>
          <p
            className="text-sm mt-1"
            style={{
              color: "var(--sb-on-surface-variant)",
              fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
            }}
          >
            <span style={{ color: "var(--sb-on-surface)", fontWeight: 500 }}>{teacherName}</span> — {new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </motion.header>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-8"
        >
          {[
            { label: "Cursos", value: loading ? "—" : courses.length, icon: BookOpen },
            { label: "Alumnos", value: loading ? "—" : totalStudents, icon: GraduationCap },
            { label: "Clases hoy", value: loading ? "—" : todaySchedule.length, icon: Calendar },
            { label: "Horas hoy", value: loading ? "—" : `${hoursToday}h`, icon: Clock },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4"
              style={{
                background: "var(--sb-surface-container)",
                borderRadius: "16px",
                border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)"
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <stat.icon className="h-3.5 w-3.5" style={{ color: "var(--sb-on-surface-variant)" }} />
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.8px]"
                  style={{
                    color: "var(--sb-on-surface-variant)",
                    opacity: 0.45,
                    fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                  }}
                >
                  {stat.label}
                </span>
              </div>
              <p
                className="text-lg font-semibold"
                style={{
                  color: "var(--sb-on-surface)",
                  fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-6"
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
            className="space-y-4"
          >
            {/* Row 1: Horario + Distribución */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {/* Horario de hoy */}
              <div
                className="p-4"
                style={{
                  background: "var(--sb-surface-container)",
                  borderRadius: "16px",
                  border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)"
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-sm font-medium"
                    style={{
                      color: "var(--sb-on-surface)",
                      fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                    }}
                  >
                    Horario de Hoy
                  </h3>
                  <Link
                    href="/docente/horarios"
                    className="text-[11px] flex items-center gap-1 transition-colors"
                    style={{
                      color: "var(--sb-on-surface-variant)",
                      fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                    }}
                  >
                    Ver semana <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-14 animate-pulse"
                        style={{
                          background: "var(--sb-surface-container-high)",
                          borderRadius: "10px"
                        }}
                      />
                    ))}
                  </div>
                ) : todaySchedule.length === 0 ? (
                  <div className="py-8 text-center">
                    <Calendar
                      className="h-8 w-8 mx-auto mb-2"
                      style={{ color: "var(--sb-on-surface-variant)", opacity: 0.3 }}
                    />
                    <p
                      className="text-xs"
                      style={{
                        color: "var(--sb-on-surface-variant)",
                        fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                      }}
                    >
                      No hay clases hoy
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {todaySchedule.map((it) => {
                      const status = classStatus(it)
                      return (
                        <div
                          key={it.id}
                          className="flex items-center gap-3 p-2.5 transition-colors"
                          style={{ borderRadius: "10px" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sb-surface-container-high)" }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                        >
                          <div
                            className="text-center shrink-0 w-12"
                            style={{ fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif" }}
                          >
                            <p className="text-xs font-medium">{it.start_time.slice(0, 5)}</p>
                            <p className="text-[10px]" style={{ color: "var(--sb-on-surface-variant)" }}>{it.end_time.slice(0, 5)}</p>
                          </div>
                          <div
                            className="flex-1 min-w-0 pl-3"
                            style={{ borderLeft: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)" }}
                          >
                            <p
                              className="text-xs font-medium truncate"
                              style={{
                                color: "var(--sb-on-surface)",
                                fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                              }}
                            >
                              {it.course_name}
                            </p>
                            <p
                              className="text-[10px]"
                              style={{
                                color: "var(--sb-on-surface-variant)",
                                fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                              }}
                            >
                              {it.grade} {it.section} {it.classroom && `· ${it.classroom}`}
                            </p>
                          </div>
                          {status && (
                            <span
                              className="text-[10px] font-medium px-2 py-0.5"
                              style={{
                                borderRadius: "8px",
                                background: status.bg,
                                color: status.color,
                                fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                              }}
                            >
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
              <div
                className="p-4"
                style={{
                  background: "var(--sb-surface-container)",
                  borderRadius: "16px",
                  border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)"
                }}
              >
                <h3
                  className="text-sm font-medium mb-4"
                  style={{
                    color: "var(--sb-on-surface)",
                    fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                  }}
                >
                  Distribución Asistencia
                </h3>
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
                            <span
                              className="text-xs"
                              style={{
                                color: "var(--sb-on-surface-variant)",
                                fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                              }}
                            >
                              {item.label}
                            </span>
                            <span
                              className="text-xs font-medium"
                              style={{
                                fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                              }}
                            >
                              {item.value}
                            </span>
                          </div>
                          <div
                            className="h-1.5 overflow-hidden"
                            style={{
                              background: "var(--sb-surface-container-high)",
                              borderRadius: "999px"
                            }}
                          >
                            <div
                              className="h-full transition-all"
                              style={{
                                width: `${pct}%`,
                                background: "var(--sb-on-surface-variant)",
                                opacity: 0.4,
                                borderRadius: "999px"
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                    <div
                      className="pt-3"
                      style={{ borderTop: "1px solid color-mix(in srgb, var(--sb-outline-variant) 25%, transparent)" }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs"
                          style={{
                            color: "var(--sb-on-surface-variant)",
                            fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                          }}
                        >
                          Tasa de asistencia
                        </span>
                        <span
                          className="text-lg font-bold"
                          style={{
                            color: "var(--sb-on-surface)",
                            fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                          }}
                        >
                          {attendancePct}%
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <UserCheck
                      className="h-8 w-8 mx-auto mb-2"
                      style={{ color: "var(--sb-on-surface-variant)", opacity: 0.3 }}
                    />
                    <p
                      className="text-xs"
                      style={{
                        color: "var(--sb-on-surface-variant)",
                        fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                      }}
                    >
                      Sin datos hoy
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Resumen + Asistencia docente */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {/* Resumen rápido */}
              <div
                className="p-4"
                style={{
                  background: "var(--sb-surface-container)",
                  borderRadius: "16px",
                  border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)"
                }}
              >
                <h3
                  className="text-sm font-medium mb-4"
                  style={{
                    color: "var(--sb-on-surface)",
                    fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                  }}
                >
                  Resumen Rápido
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Horarios asignados", value: loading ? "—" : horarios.length, icon: Calendar },
                    { label: "Horas programadas", value: loading ? "—" : `${hoursToday}h`, icon: Clock },
                    { label: "Cursos activos", value: loading ? "—" : courses.length, icon: BookOpen },
                    { label: "Total alumnos", value: loading ? "—" : totalStudents, icon: GraduationCap },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between py-2 last:border-0"
                      style={{ borderBottom: "1px solid color-mix(in srgb, var(--sb-outline-variant) 15%, transparent)" }}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-3.5 w-3.5" style={{ color: "var(--sb-on-surface-variant)" }} />
                        <span
                          className="text-xs"
                          style={{
                            color: "var(--sb-on-surface-variant)",
                            fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                          }}
                        >
                          {item.label}
                        </span>
                      </div>
                      <span
                        className="text-xs font-medium"
                        style={{
                          fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                        }}
                      >
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Asistencia docente */}
              <div
                className="p-4"
                style={{
                  background: "var(--sb-surface-container)",
                  borderRadius: "16px",
                  border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)"
                }}
              >
                <h3
                  className="text-sm font-medium mb-4"
                  style={{
                    color: "var(--sb-on-surface)",
                    fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                  }}
                >
                  Mi Asistencia
                </h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div
                    className="p-3"
                    style={{
                      background: "var(--sb-surface-container-high)",
                      borderRadius: "12px"
                    }}
                  >
                    <p
                      className="text-[10px] font-bold uppercase tracking-[0.8px] mb-1"
                      style={{
                        color: "var(--sb-on-surface-variant)",
                        opacity: 0.45,
                        fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                      }}
                    >
                      Entrada
                    </p>
                    <p
                      className="text-lg font-bold"
                      style={{
                        color: "var(--sb-on-surface)",
                        fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                      }}
                    >
                      {checkedIn ? checkedIn.slice(0, 5) : "—"}
                    </p>
                    {schedule?.start_time && (
                      <p
                        className="text-[10px] mt-0.5"
                        style={{
                          color: "var(--sb-on-surface-variant)",
                          fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                        }}
                      >
                        Prog. {schedule.start_time.slice(0, 5)}
                      </p>
                    )}
                  </div>
                  <div
                    className="p-3"
                    style={{
                      background: "var(--sb-surface-container-high)",
                      borderRadius: "12px"
                    }}
                  >
                    <p
                      className="text-[10px] font-bold uppercase tracking-[0.8px] mb-1"
                      style={{
                        color: "var(--sb-on-surface-variant)",
                        opacity: 0.45,
                        fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                      }}
                    >
                      Salida
                    </p>
                    <p
                      className="text-lg font-bold"
                      style={{
                        color: "var(--sb-on-surface)",
                        fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                      }}
                    >
                      {checkedOut ? checkedOut.slice(0, 5) : "—"}
                    </p>
                    {schedule?.end_time && (
                      <p
                        className="text-[10px] mt-0.5"
                        style={{
                          color: "var(--sb-on-surface-variant)",
                          fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                        }}
                      >
                        Prog. {schedule.end_time.slice(0, 5)}
                      </p>
                    )}
                  </div>
                </div>
                {!checkedIn && (
                  <button
                    onClick={() => handleCheck("check-in")}
                    disabled={loading}
                    className="w-full h-10 text-xs font-medium transition-all disabled:opacity-50"
                    style={{
                      borderRadius: "12px",
                      background: "var(--sb-on-surface)",
                      color: "var(--sb-surface)",
                      fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                    }}
                  >
                    Marcar entrada
                  </button>
                )}
                {checkedIn && !checkedOut && (
                  <button
                    onClick={() => handleCheck("check-out")}
                    disabled={loading}
                    className="w-full h-10 text-xs font-medium transition-all disabled:opacity-50"
                    style={{
                      borderRadius: "12px",
                      background: "var(--sb-on-surface)",
                      color: "var(--sb-surface)",
                      fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                    }}
                  >
                    Marcar salida
                  </button>
                )}
                {checkedIn && checkedOut && (
                  <Link
                    href="/docente/asistencia"
                    className="w-full h-10 text-xs font-medium flex items-center justify-center transition-colors"
                    style={{
                      borderRadius: "12px",
                      border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)",
                      color: "var(--sb-on-surface-variant)",
                      fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                    }}
                  >
                    Ver detalle de asistencia
                  </Link>
                )}
              </div>
            </div>

            {/* Row 3: Cursos */}
            <div
              className="p-4"
              style={{
                background: "var(--sb-surface-container)",
                borderRadius: "16px",
                border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)"
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-sm font-medium"
                  style={{
                    color: "var(--sb-on-surface)",
                    fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                  }}
                >
                  Mis Cursos
                </h3>
                <Link
                  href="/docente/cursos"
                  className="text-[11px] flex items-center gap-1 transition-colors"
                  style={{
                    color: "var(--sb-on-surface-variant)",
                    fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                  }}
                >
                  Ver todos <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-28 animate-pulse"
                      style={{
                        background: "var(--sb-surface-container-high)",
                        borderRadius: "12px"
                      }}
                    />
                  ))}
                </div>
              ) : courses.length === 0 ? (
                <div className="py-8 text-center">
                  <BookOpen
                    className="h-8 w-8 mx-auto mb-2"
                    style={{ color: "var(--sb-on-surface-variant)", opacity: 0.3 }}
                  />
                  <p
                    className="text-xs"
                    style={{
                      color: "var(--sb-on-surface-variant)",
                      fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                    }}
                  >
                    No tienes cursos asignados
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {courses.map((c) => (
                    <Link
                      key={c.id}
                      href={`/docente/cursos/${c.id}`}
                      className="p-3 transition-all"
                      style={{
                        borderRadius: "12px",
                        border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--sb-surface-container-high)"
                        e.currentTarget.style.borderColor = "color-mix(in srgb, var(--sb-outline-variant) 50%, transparent)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent"
                        e.currentTarget.style.borderColor = "color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)"
                      }}
                    >
                      <div
                        className="h-8 w-8 flex items-center justify-center mb-2"
                        style={{
                          background: "var(--sb-surface-container-high)",
                          borderRadius: "10px"
                        }}
                      >
                        <BookOpen className="h-4 w-4" style={{ color: "var(--sb-on-surface-variant)" }} />
                      </div>
                      <p
                        className="text-xs font-medium truncate"
                        style={{
                          color: "var(--sb-on-surface)",
                          fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                        }}
                      >
                        {c.name}
                      </p>
                      <p
                        className="text-[10px] mt-0.5"
                        style={{
                          color: "var(--sb-on-surface-variant)",
                          fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                        }}
                      >
                        {c.grade} {c.section}
                      </p>
                      <div
                        className="mt-2 pt-2"
                        style={{ borderTop: "1px solid color-mix(in srgb, var(--sb-outline-variant) 15%, transparent)" }}
                      >
                        <span
                          className="text-[10px] flex items-center gap-1"
                          style={{
                            color: "var(--sb-on-surface-variant)",
                            fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                          }}
                        >
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
            className="space-y-4"
          >
            {/* Barras por día */}
            <div
              className="p-4"
              style={{
                background: "var(--sb-surface-container)",
                borderRadius: "16px",
                border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)"
              }}
            >
              <h3
                className="text-sm font-medium mb-4"
                style={{
                  color: "var(--sb-on-surface)",
                  fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                }}
              >
                Horarios por Día
              </h3>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-8 animate-pulse"
                      style={{
                        background: "var(--sb-surface-container-high)",
                        borderRadius: "10px"
                      }}
                    />
                  ))}
                </div>
              ) : horarios.length === 0 ? (
                <div className="py-8 text-center">
                  <Calendar
                    className="h-8 w-8 mx-auto mb-2"
                    style={{ color: "var(--sb-on-surface-variant)", opacity: 0.3 }}
                  />
                  <p
                    className="text-xs"
                    style={{
                      color: "var(--sb-on-surface-variant)",
                      fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                    }}
                  >
                    No hay horarios
                  </p>
                </div>
              ) : (() => {
                const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
                const maxCount = Math.max(...dayNames.map((_, i) => horarios.filter(h => h.day_of_week === i + 1).length), 1)
                return (
                  <div className="space-y-2">
                    {dayNames.map((day, i) => {
                      const count = horarios.filter(h => h.day_of_week === i + 1).length
                      const pct = (count / maxCount) * 100
                      return (
                        <div key={day} className="flex items-center gap-3">
                          <span
                            className="text-xs w-20 shrink-0"
                            style={{
                              color: "var(--sb-on-surface-variant)",
                              fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                            }}
                          >
                            {day}
                          </span>
                          <div
                            className="flex-1 h-6 overflow-hidden"
                            style={{
                              background: "var(--sb-surface-container-high)",
                              borderRadius: "8px"
                            }}
                          >
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5, delay: i * 0.05 }}
                              className="h-full"
                              style={{
                                background: "var(--sb-on-surface-variant)",
                                opacity: 0.2,
                                borderRadius: "8px"
                              }}
                            />
                          </div>
                          <span
                            className="text-xs w-6 text-right"
                            style={{
                              color: "var(--sb-on-surface-variant)",
                              fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                            }}
                          >
                            {count}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>

            {/* Lista detallada */}
            <div
              className="p-4"
              style={{
                background: "var(--sb-surface-container)",
                borderRadius: "16px",
                border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)"
              }}
            >
              <h3
                className="text-sm font-medium mb-4"
                style={{
                  color: "var(--sb-on-surface)",
                  fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                }}
              >
                Detalle Semanal
              </h3>
              {loading ? (
                <div className="space-y-1.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-12 animate-pulse"
                      style={{
                        background: "var(--sb-surface-container-high)",
                        borderRadius: "10px"
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {horarios
                    .sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time))
                    .map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center gap-3 p-2.5 transition-colors"
                        style={{ borderRadius: "10px" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sb-surface-container-high)" }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                      >
                        <span
                          className="text-[10px] w-10 shrink-0"
                          style={{
                            color: "var(--sb-on-surface-variant)",
                            fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                          }}
                        >
                          {["Lun", "Mar", "Mié", "Jue", "Vie"][h.day_of_week - 1]}
                        </span>
                        <div
                          className="text-center shrink-0 w-12"
                          style={{ fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif" }}
                        >
                          <p className="text-xs font-medium">{h.start_time.slice(0, 5)}</p>
                          <p className="text-[10px]" style={{ color: "var(--sb-on-surface-variant)" }}>{h.end_time.slice(0, 5)}</p>
                        </div>
                        <div
                          className="flex-1 min-w-0 pl-3"
                          style={{ borderLeft: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)" }}
                        >
                          <p
                            className="text-xs font-medium truncate"
                            style={{
                              color: "var(--sb-on-surface)",
                              fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                            }}
                          >
                            {h.course_name}
                          </p>
                          <p
                            className="text-[10px]"
                            style={{
                              color: "var(--sb-on-surface-variant)",
                              fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                            }}
                          >
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
            className="space-y-4"
          >
            {/* Stats resumen */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Presentes", value: studentSummary?.present || 0, icon: UserCheck },
                { label: "Ausentes", value: studentSummary?.absent || 0, icon: UserCheck },
                { label: "Tardanzas", value: studentSummary?.late || 0, icon: Clock },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-4"
                  style={{
                    background: "var(--sb-surface-container)",
                    borderRadius: "16px",
                    border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)"
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <stat.icon className="h-3.5 w-3.5" style={{ color: "var(--sb-on-surface-variant)" }} />
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.8px]"
                      style={{
                        color: "var(--sb-on-surface-variant)",
                        opacity: 0.45,
                        fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                      }}
                    >
                      {stat.label}
                    </span>
                  </div>
                  <p
                    className="text-lg font-semibold"
                    style={{
                      color: "var(--sb-on-surface)",
                      fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                    }}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {/* Asistencia docente */}
              <div
                className="p-4"
                style={{
                  background: "var(--sb-surface-container)",
                  borderRadius: "16px",
                  border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)"
                }}
              >
                <h3
                  className="text-sm font-medium mb-4"
                  style={{
                    color: "var(--sb-on-surface)",
                    fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                  }}
                >
                  Mi Asistencia
                </h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div
                    className="p-3"
                    style={{
                      background: "var(--sb-surface-container-high)",
                      borderRadius: "12px"
                    }}
                  >
                    <p
                      className="text-[10px] font-bold uppercase tracking-[0.8px] mb-1"
                      style={{
                        color: "var(--sb-on-surface-variant)",
                        opacity: 0.45,
                        fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                      }}
                    >
                      Entrada
                    </p>
                    <p
                      className="text-lg font-bold"
                      style={{
                        color: "var(--sb-on-surface)",
                        fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                      }}
                    >
                      {checkedIn ? checkedIn.slice(0, 5) : "—"}
                    </p>
                    {schedule?.start_time && (
                      <p
                        className="text-[10px] mt-0.5"
                        style={{
                          color: "var(--sb-on-surface-variant)",
                          fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                        }}
                      >
                        Prog. {schedule.start_time.slice(0, 5)}
                      </p>
                    )}
                  </div>
                  <div
                    className="p-3"
                    style={{
                      background: "var(--sb-surface-container-high)",
                      borderRadius: "12px"
                    }}
                  >
                    <p
                      className="text-[10px] font-bold uppercase tracking-[0.8px] mb-1"
                      style={{
                        color: "var(--sb-on-surface-variant)",
                        opacity: 0.45,
                        fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                      }}
                    >
                      Salida
                    </p>
                    <p
                      className="text-lg font-bold"
                      style={{
                        color: "var(--sb-on-surface)",
                        fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                      }}
                    >
                      {checkedOut ? checkedOut.slice(0, 5) : "—"}
                    </p>
                    {schedule?.end_time && (
                      <p
                        className="text-[10px] mt-0.5"
                        style={{
                          color: "var(--sb-on-surface-variant)",
                          fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                        }}
                      >
                        Prog. {schedule.end_time.slice(0, 5)}
                      </p>
                    )}
                  </div>
                </div>
                {!checkedIn && (
                  <button
                    onClick={() => handleCheck("check-in")}
                    disabled={loading}
                    className="w-full h-10 text-xs font-medium transition-all disabled:opacity-50"
                    style={{
                      borderRadius: "12px",
                      background: "var(--sb-on-surface)",
                      color: "var(--sb-surface)",
                      fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                    }}
                  >
                    Marcar entrada
                  </button>
                )}
                {checkedIn && !checkedOut && (
                  <button
                    onClick={() => handleCheck("check-out")}
                    disabled={loading}
                    className="w-full h-10 text-xs font-medium transition-all disabled:opacity-50"
                    style={{
                      borderRadius: "12px",
                      background: "var(--sb-on-surface)",
                      color: "var(--sb-surface)",
                      fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                    }}
                  >
                    Marcar salida
                  </button>
                )}
                {checkedIn && checkedOut && (
                  <Link
                    href="/docente/asistencia"
                    className="w-full h-10 text-xs font-medium flex items-center justify-center transition-colors"
                    style={{
                      borderRadius: "12px",
                      border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)",
                      color: "var(--sb-on-surface-variant)",
                      fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                    }}
                  >
                    Ver detalle de asistencia
                  </Link>
                )}
              </div>

              {/* Distribución */}
              <div
                className="p-4"
                style={{
                  background: "var(--sb-surface-container)",
                  borderRadius: "16px",
                  border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)"
                }}
              >
                <h3
                  className="text-sm font-medium mb-4"
                  style={{
                    color: "var(--sb-on-surface)",
                    fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                  }}
                >
                  Distribución del Día
                </h3>
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
                            <span
                              className="text-xs"
                              style={{
                                color: "var(--sb-on-surface-variant)",
                                fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                              }}
                            >
                              {item.label}
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs font-medium"
                                style={{ fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif" }}
                              >
                                {item.value}
                              </span>
                              <span
                                className="text-[10px] w-8 text-right"
                                style={{
                                  color: "var(--sb-on-surface-variant)",
                                  fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                                }}
                              >
                                {Math.round(pct)}%
                              </span>
                            </div>
                          </div>
                          <div
                            className="h-1.5 overflow-hidden"
                            style={{
                              background: "var(--sb-surface-container-high)",
                              borderRadius: "999px"
                            }}
                          >
                            <div
                              className="h-full transition-all"
                              style={{
                                width: `${pct}%`,
                                background: "var(--sb-on-surface-variant)",
                                opacity: 0.4,
                                borderRadius: "999px"
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <UserCheck
                      className="h-8 w-8 mx-auto mb-2"
                      style={{ color: "var(--sb-on-surface-variant)", opacity: 0.3 }}
                    />
                    <p
                      className="text-xs"
                      style={{
                        color: "var(--sb-on-surface-variant)",
                        fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                      }}
                    >
                      Sin datos hoy
                    </p>
                    <Link
                      href="/docente/asistencia"
                      className="mt-2 inline-flex h-9 px-4 text-xs font-medium transition-colors"
                      style={{
                        borderRadius: "12px",
                        background: "var(--sb-on-surface)",
                        color: "var(--sb-surface)",
                        fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                      }}
                    >
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
