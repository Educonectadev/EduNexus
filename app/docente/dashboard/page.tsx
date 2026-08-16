"use client"

import * as React from "react"
import Link from "next/link"
import { useAuthStore } from "@/stores/auth-store"
import { Calendar, Clock, BookOpen, GraduationCap, TrendingUp, Users, ChevronDown, ArrowUpRight, Search, Bell } from "@/components/ui/proicons"
import { motion } from "framer-motion"

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
}

const FONT = "var(--app-main-font, 'DM Sans'), sans-serif"

const WEEK_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie"]

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

export default function DocenteDashboard() {
  const user = useAuthStore((s) => s.user)
  const [courses, setCourses] = React.useState<TeacherCourse[]>([])
  const [horarios, setHorarios] = React.useState<Horario[]>([])
  const [teacherAtt, setTeacherAtt] = React.useState<any>(null)
  const [studentSummary, setStudentSummary] = React.useState<{
    present: number; absent: number; late: number; justified?: number; total: number
  } | null>(null)
  const [loading, setLoading] = React.useState(true)

  const today = new Date()
  const hour = today.getHours()
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches"
  const teacherName = user?.full_name || "Docente"

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const dateStr = today.toISOString().split("T")[0]
        const [c, h, a] = await Promise.all([
          fetch("/api/docente/cursos").then(r => r.json()),
          fetch("/api/docente/horarios").then(r => r.json()),
          fetch(`/api/docente/attendance?date=${dateStr}`).then(r => r.json()),
        ])
        if (cancelled) return
        setCourses(Array.isArray(c) ? c : [])
        setHorarios(Array.isArray(h) ? h : [])
        setTeacherAtt(a.attendance)

        try {
          const todayIdx = today.getDay() === 0 ? 7 : today.getDay()
          const todayCourses = (Array.isArray(h) ? h : []).filter((hr: Horario) => hr.day_of_week === todayIdx)
          const courseIds = Array.from(new Set(todayCourses.map((hr: any) => hr.course_id).filter(Boolean)))
          if (courseIds.length > 0) {
            const summaries = await Promise.all(
              courseIds.map((cid: string) =>
                fetch(`/api/docente/student-attendance?course_id=${cid}&date=${dateStr}`)
                  .then(r => r.json()).catch(() => null)
              )
            )
            const totals = { present: 0, absent: 0, late: 0, justified: 0, total: 0 }
            let any = false
            for (const s of summaries) {
              if (s?.summary) {
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
        } catch {}
      } catch {} finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  const totalStudents = courses.reduce((a, c) => a + (c.students || 0), 0)
  const todayIdx = today.getDay() === 0 ? 7 : today.getDay()
  const todaySchedule = horarios
    .filter(h => h.day_of_week === todayIdx)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  const hoursToday = Math.round(
    (todaySchedule.reduce((a, h) => a + (toMin(h.end_time) - toMin(h.start_time)), 0) / 60) * 10
  ) / 10

  const attendancePct = studentSummary && studentSummary.total > 0
    ? Math.round((studentSummary.present / studentSummary.total) * 100)
    : 0

  const weeklyCounts = [1, 2, 3, 4, 5].map(d => horarios.filter(h => h.day_of_week === d).length)
  const maxWeekly = Math.max(...weeklyCounts, 1)

  const dateLabel = `${today.toLocaleDateString("es-PE", { day: "numeric", month: "short" })} - ${today.toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}`

  return (
    <div className="w-full min-h-screen">
      <div className="w-full max-w-[1200px] mx-auto py-6">

        {/* ═══ TOP BAR ═══ */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3 flex-1 max-w-[320px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#999" }} />
              <input
                placeholder="Buscar cursos, alumnos..."
                className="w-full h-10 pl-10 pr-4 text-sm rounded-full border-none outline-none"
                style={{ background: "#fff", color: "#1a1a1a", fontFamily: FONT, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative flex items-center gap-2 text-sm" style={{ color: "#666", fontFamily: FONT }}>
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
              <span className="h-5 w-5 flex items-center justify-center text-[10px] font-bold text-white rounded-full" style={{ background: "#1a1a1a" }}>2</span>
            </button>
            <div className="h-10 w-10 rounded-full overflow-hidden" style={{ background: "#ddd" }}>
              {user?.full_name && (
                <div className="h-full w-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "#1a1a1a" }}>
                  {teacherName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ═══ HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6"
        >
          <h1 className="text-[36px] sm:text-[44px] font-bold leading-[1.05]" style={{ color: "#1a1a1a", fontFamily: FONT, letterSpacing: "-0.03em" }}>
            Tu Resumen<br />Docente
          </h1>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium rounded-xl" style={{
              background: "#fff",
              color: "#666",
              fontFamily: FONT,
              border: "1px solid #e5e5e5",
            }}>
              <Calendar className="h-4 w-4" />
              <span>{dateLabel}</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium rounded-xl" style={{
              background: "#fff",
              color: "#666",
              fontFamily: FONT,
              border: "1px solid #e5e5e5",
            }}>
              <span>Filtro</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            <Link href="/docente/asistencia" className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium rounded-xl" style={{
              background: "#1a1a1a",
              color: "#fff",
              fontFamily: FONT,
            }}>
              <span>Exportar</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        {/* ═══ 3 STAT CARDS ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6"
        >
          {/* Dark Card - Asistencia */}
          <div className="p-5 rounded-[20px]" style={{ background: "#1a1a1a" }}>
            <div className="flex items-center justify-between mb-6">
              <span className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.5)", fontFamily: FONT }}>
                Asistencia hoy
              </span>
              <div className="h-8 w-8 flex items-center justify-center rounded-lg" style={{ background: "rgba(255,255,255,0.1)" }}>
                <ArrowUpRight className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className="text-[40px] font-bold text-white leading-none" style={{ fontFamily: FONT, letterSpacing: "-0.03em" }}>
              {loading ? "—" : `${attendancePct}%`}
            </p>
            <p className="text-[12px] mt-3" style={{ color: "rgba(255,255,255,0.4)", fontFamily: FONT }}>
              {studentSummary ? `${studentSummary.present} presentes de ${studentSummary.total}` : "Sin datos de hoy"}
            </p>
          </div>

          {/* Light Card - Alumnos */}
          <div className="p-5 rounded-[20px]" style={{ background: "#fff", border: "1px solid #eee" }}>
            <div className="flex items-center justify-between mb-6">
              <span className="text-[12px] font-medium" style={{ color: "#999", fontFamily: FONT }}>
                Total alumnos
              </span>
              <div className="h-8 w-8 flex items-center justify-center rounded-lg" style={{ background: "#f5f5f5" }}>
                <ArrowUpRight className="h-4 w-4" style={{ color: "#999" }} />
              </div>
            </div>
            <p className="text-[40px] font-bold leading-none" style={{ color: "#1a1a1a", fontFamily: FONT, letterSpacing: "-0.03em" }}>
              {loading ? "—" : totalStudents.toLocaleString()}
            </p>
            <p className="text-[12px] mt-3" style={{ color: "#999", fontFamily: FONT }}>
              {courses.length} cursos activos
            </p>
          </div>

          {/* Light Card - Clases */}
          <div className="p-5 rounded-[20px]" style={{ background: "#fff", border: "1px solid #eee" }}>
            <div className="flex items-center justify-between mb-6">
              <span className="text-[12px] font-medium" style={{ color: "#999", fontFamily: FONT }}>
                Clases hoy
              </span>
              <div className="h-8 w-8 flex items-center justify-center rounded-lg" style={{ background: "#f5f5f5" }}>
                <ArrowUpRight className="h-4 w-4" style={{ color: "#999" }} />
              </div>
            </div>
            <p className="text-[40px] font-bold leading-none" style={{ color: "#1a1a1a", fontFamily: FONT, letterSpacing: "-0.03em" }}>
              {loading ? "—" : todaySchedule.length}
            </p>
            <p className="text-[12px] mt-3" style={{ color: "#999", fontFamily: FONT }}>
              {hoursToday}h de carga horaria
            </p>
          </div>
        </motion.div>

        {/* ═══ TWO COLUMNS: Chart + Table ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6"
        >
          {/* ═══ SALES FUNNEL → Horario Semanal ═══ */}
          <div className="p-5 rounded-[20px]" style={{ background: "#fff", border: "1px solid #eee" }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[15px] font-semibold" style={{ color: "#1a1a1a", fontFamily: FONT }}>Horario semanal</p>
                <p className="text-[12px] mt-0.5" style={{ color: "#999", fontFamily: FONT }}>Clases por día</p>
              </div>
              <button className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg" style={{
                background: "#f5f5f5",
                color: "#666",
                fontFamily: FONT,
              }}>
                Semanal <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Bar Chart */}
            <div className="flex items-end justify-between gap-3 h-[180px] pt-4">
              {WEEK_DAYS.map((day, i) => {
                const count = weeklyCounts[i]
                const pct = maxWeekly > 0 ? (count / maxWeekly) * 100 : 0
                const isToday = i + 1 === todayIdx
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-3">
                    <div className="w-full relative" style={{ height: "150px" }}>
                      <div
                        className="absolute bottom-0 w-full transition-all duration-700 ease-out"
                        style={{
                          height: `${Math.max(pct, 8)}%`,
                          borderRadius: "10px 10px 6px 6px",
                          background: isToday ? "#4ADE80" : "#e5e5e5",
                        }}
                      />
                      {isToday && count > 0 && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md text-[11px] font-bold text-white whitespace-nowrap" style={{ background: "#1a1a1a" }}>
                          {count}h
                        </div>
                      )}
                    </div>
                    <span className="text-[12px] font-medium" style={{
                      color: isToday ? "#4ADE80" : "#999",
                      fontFamily: FONT,
                    }}>
                      {day}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ═══ ORDERS → Asistencia ═══ */}
          <div className="p-5 rounded-[20px]" style={{ background: "#fff", border: "1px solid #eee" }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[15px] font-semibold" style={{ color: "#1a1a1a", fontFamily: FONT }}>Asistencia de alumnos</p>
                <p className="text-[12px] mt-0.5" style={{ color: "#999", fontFamily: FONT }}>Resumen por curso</p>
              </div>
              <button className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg" style={{
                background: "#f5f5f5",
                color: "#666",
                fontFamily: FONT,
              }}>
                Hoy <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Table with colored cells */}
            <div className="space-y-0">
              {/* Header */}
              <div className="flex items-center gap-2 pb-2 mb-2" style={{ borderBottom: "1px solid #eee" }}>
                <span className="flex-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#bbb", fontFamily: FONT }}>Curso</span>
                <span className="w-10 text-center text-[10px] font-semibold uppercase" style={{ color: "#bbb", fontFamily: FONT }}>P</span>
                <span className="w-10 text-center text-[10px] font-semibold uppercase" style={{ color: "#bbb", fontFamily: FONT }}>T</span>
                <span className="w-10 text-center text-[10px] font-semibold uppercase" style={{ color: "#bbb", fontFamily: FONT }}>F</span>
                <span className="w-10 text-center text-[10px] font-semibold uppercase" style={{ color: "#bbb", fontFamily: FONT }}>J</span>
              </div>

              {courses.length === 0 && !loading ? (
                <div className="py-8 text-center">
                  <p className="text-[12px]" style={{ color: "#bbb", fontFamily: FONT }}>Sin cursos registrados</p>
                </div>
              ) : courses.slice(0, 5).map((c, i) => {
                const cellColors = [
                  ["#4ADE80", "#1a1a1a", "#e5e5e5", "#bbb"],
                  ["#4ADE80", "#4ADE80", "#1a1a1a", "#e5e5e5"],
                  ["#e5e5e5", "#4ADE80", "#4ADE80", "#1a1a1a"],
                  ["#1a1a1a", "#e5e5e5", "#bbb", "#4ADE80"],
                  ["#4ADE80", "#1a1a1a", "#e5e5e5", "#bbb"],
                ]
                const colors = cellColors[i % cellColors.length]
                return (
                  <div key={c.id} className="flex items-center gap-2 py-2.5" style={{
                    borderBottom: i < Math.min(courses.length, 5) - 1 ? "1px solid #f0f0f0" : "none",
                  }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: "#1a1a1a", fontFamily: FONT }}>{c.name}</p>
                      <p className="text-[11px]" style={{ color: "#999", fontFamily: FONT }}>{c.grade} {c.section}</p>
                    </div>
                    {colors.map((bg, j) => (
                      <div key={j} className="w-10 flex justify-center">
                        <div className="h-5 w-8 rounded-md" style={{ background: bg }} />
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* ═══ TRANSACTIONS → Próximas Clases ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="p-5 rounded-[20px]" style={{ background: "#fff", border: "1px solid #eee" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <p className="text-[15px] font-semibold" style={{ color: "#1a1a1a", fontFamily: FONT }}>Próximas clases</p>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md" style={{
                background: "#f5f5f5",
                color: "#999",
                fontFamily: FONT,
              }}>
                {todaySchedule.length} Total
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg" style={{
                background: "#f5f5f5",
                color: "#666",
                fontFamily: FONT,
              }}>
                Hoy <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button className="h-8 w-8 flex items-center justify-center rounded-lg" style={{ background: "#f5f5f5" }}>
                <Search className="h-4 w-4" style={{ color: "#999" }} />
              </button>
            </div>
          </div>

          {todaySchedule.length === 0 ? (
            <div className="py-8 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2" style={{ color: "#ddd" }} />
              <p className="text-[12px]" style={{ color: "#bbb", fontFamily: FONT }}>Sin clases programadas hoy</p>
            </div>
          ) : (
            <div className="space-y-0">
              {todaySchedule.map((cls, i) => (
                <div key={cls.id} className="flex items-center gap-3 py-3" style={{
                  borderBottom: i < todaySchedule.length - 1 ? "1px solid #f0f0f0" : "none",
                }}>
                  <div className="h-9 w-9 flex items-center justify-center rounded-xl" style={{ background: "#f5f5f5" }}>
                    <BookOpen className="h-4 w-4" style={{ color: "#999" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium" style={{ color: "#1a1a1a", fontFamily: FONT }}>{cls.course_name}</p>
                    <p className="text-[11px]" style={{ color: "#999", fontFamily: FONT }}>{cls.grade} {cls.section}{cls.classroom ? ` · ${cls.classroom}` : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-medium" style={{ color: "#1a1a1a", fontFamily: FONT }}>{cls.start_time}</p>
                    <p className="text-[11px]" style={{ color: "#bbb", fontFamily: FONT }}>{cls.end_time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  )
}
