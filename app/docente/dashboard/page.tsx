"use client"

import * as React from "react"
import Link from "next/link"
import { useAuthStore } from "@/stores/auth-store"
import { Calendar, Clock, BookOpen, GraduationCap, TrendingUp, Users, ChevronDown, Download } from "@/components/ui/proicons"
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

const FONT = "var(--app-main-font, 'DM Sans'), sans-serif"

const WEEK_DAYS_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie"]

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

  const attendancePct = studentSummary && studentSummary.total > 0
    ? Math.round((studentSummary.present / studentSummary.total) * 100)
    : 0

  // Weekly class count per day
  const weeklyCounts = [1, 2, 3, 4, 5].map(day =>
    horarios.filter(h => h.day_of_week === day).length
  )
  const maxWeekly = Math.max(...weeklyCounts, 1)

  // Today's classes grouped by time slot
  const classSlots = todaySchedule.map(s => ({
    ...s,
    label: `${s.start_time} · ${s.course_name}`,
    sub: `${s.grade} ${s.section}`,
  }))

  return (
    <div className="w-full py-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
      >
        <div>
          <h1
            className="text-[28px] sm:text-[34px] font-semibold leading-tight"
            style={{ color: "var(--sb-on-surface)", fontFamily: FONT, letterSpacing: "-0.03em" }}
          >
            {greeting}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>
            <span style={{ color: "var(--sb-on-surface)", fontWeight: 500 }}>{teacherName}</span> — {new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 text-xs" style={{
            borderRadius: "12px",
            border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)",
            background: "var(--sb-surface)",
            color: "var(--sb-on-surface-variant)",
            fontFamily: FONT,
          }}>
            <Calendar className="h-3.5 w-3.5" />
            <span>{new Date().toLocaleDateString("es-PE", { day: "numeric", month: "short" })} - {new Date().toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </div>
          <Link href="/docente/cursos" className="flex items-center gap-2 px-4 py-2 text-xs font-medium transition-colors" style={{
            borderRadius: "12px",
            background: "var(--sb-on-surface)",
            color: "var(--sb-surface)",
            fontFamily: FONT,
          }}>
            <Download className="h-3.5 w-3.5" />
            Exportar
          </Link>
        </div>
      </motion.header>

      {/* Stats Row - 3 cards like the design */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6"
      >
        {/* Dark card - Attendance Rate */}
        <div className="p-5" style={{
          background: "var(--sb-on-surface)",
          borderRadius: "20px",
        }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.6)", fontFamily: FONT }}>
              Asistencia hoy
            </span>
            <div className="h-7 w-7 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)", borderRadius: "8px" }}>
              <TrendingUp className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
          <p className="text-[32px] font-bold text-white leading-none" style={{ fontFamily: FONT, letterSpacing: "-0.03em" }}>
            {loading ? "—" : `${attendancePct}%`}
          </p>
          <p className="text-[11px] mt-2" style={{ color: "rgba(255,255,255,0.5)", fontFamily: FONT }}>
            {studentSummary ? `${studentSummary.present} presentes` : "Sin datos"}
          </p>
        </div>

        {/* Light card - Total Students */}
        <div className="p-5" style={{
          background: "var(--sb-surface)",
          borderRadius: "20px",
          border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 25%, transparent)",
        }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-medium" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>
              Total alumnos
            </span>
            <div className="h-7 w-7 flex items-center justify-center" style={{ background: "var(--sb-surface-container-high)", borderRadius: "8px" }}>
              <Users className="h-3.5 w-3.5" style={{ color: "var(--sb-on-surface-variant)" }} />
            </div>
          </div>
          <p className="text-[32px] font-bold leading-none" style={{ color: "var(--sb-on-surface)", fontFamily: FONT, letterSpacing: "-0.03em" }}>
            {loading ? "—" : totalStudents}
          </p>
          <p className="text-[11px] mt-2" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>
            {courses.length} cursos activos
          </p>
        </div>

        {/* Light card - Classes Today */}
        <div className="p-5" style={{
          background: "var(--sb-surface)",
          borderRadius: "20px",
          border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 25%, transparent)",
        }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-medium" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>
              Clases hoy
            </span>
            <div className="h-7 w-7 flex items-center justify-center" style={{ background: "var(--sb-surface-container-high)", borderRadius: "8px" }}>
              <Clock className="h-3.5 w-3.5" style={{ color: "var(--sb-on-surface-variant)" }} />
            </div>
          </div>
          <p className="text-[32px] font-bold leading-none" style={{ color: "var(--sb-on-surface)", fontFamily: FONT, letterSpacing: "-0.03em" }}>
            {loading ? "—" : todaySchedule.length}
          </p>
          <p className="text-[11px] mt-2" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>
            {hoursToday}h de carga horaria
          </p>
        </div>
      </motion.div>

      {/* Two columns: Weekly Chart + Attendance Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6"
      >
        {/* Weekly Schedule Chart */}
        <div className="p-5" style={{
          background: "var(--sb-surface)",
          borderRadius: "20px",
          border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 25%, transparent)",
        }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--sb-on-surface)", fontFamily: FONT }}>Horario semanal</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>Clases por día</p>
            </div>
            <span className="text-[10px] font-medium px-2.5 py-1" style={{
              borderRadius: "8px",
              background: "var(--sb-surface-container-high)",
              color: "var(--sb-on-surface-variant)",
              fontFamily: FONT,
            }}>
              Semanal
            </span>
          </div>

          {/* Bar chart */}
          <div className="flex items-end justify-between gap-2 h-[140px] mb-3">
            {WEEK_DAYS_SHORT.map((day, i) => {
              const count = weeklyCounts[i]
              const pct = maxWeekly > 0 ? (count / maxWeekly) * 100 : 0
              const isToday = i + 1 === todayIdx
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full relative" style={{ height: "120px" }}>
                    <div
                      className="absolute bottom-0 w-full transition-all duration-500"
                      style={{
                        height: `${pct}%`,
                        borderRadius: "8px 8px 4px 4px",
                        background: isToday
                          ? "#4ADE80"
                          : count > 0
                            ? "var(--sb-surface-container-high)"
                            : "color-mix(in srgb, var(--sb-outline-variant) 15%, transparent)",
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-medium" style={{
                    color: isToday ? "#4ADE80" : "var(--sb-on-surface-variant)",
                    fontFamily: FONT,
                  }}>
                    {day}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Attendance Table */}
        <div className="p-5" style={{
          background: "var(--sb-surface)",
          borderRadius: "20px",
          border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 25%, transparent)",
        }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--sb-on-surface)", fontFamily: FONT }}>Asistencia de alumnos</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>Resumen por curso</p>
            </div>
            <span className="text-[10px] font-medium px-2.5 py-1" style={{
              borderRadius: "8px",
              background: "var(--sb-surface-container-high)",
              color: "var(--sb-on-surface-variant)",
              fontFamily: FONT,
            }}>
              Hoy
            </span>
          </div>

          {/* Table */}
          <div className="space-y-0">
            {/* Header */}
            <div className="flex items-center gap-2 pb-2 mb-1" style={{ borderBottom: "1px solid color-mix(in srgb, var(--sb-outline-variant) 20%, transparent)" }}>
              <span className="flex-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--sb-on-surface-variant)", opacity: 0.5, fontFamily: FONT }}>Curso</span>
              <span className="w-12 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--sb-on-surface-variant)", opacity: 0.5, fontFamily: FONT }}>P</span>
              <span className="w-12 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--sb-on-surface-variant)", opacity: 0.5, fontFamily: FONT }}>T</span>
              <span className="w-12 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--sb-on-surface-variant)", opacity: 0.5, fontFamily: FONT }}>F</span>
              <span className="w-12 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--sb-on-surface-variant)", opacity: 0.5, fontFamily: FONT }}>J</span>
            </div>

            {/* Rows */}
            {courses.length === 0 && !loading ? (
              <div className="py-8 text-center">
                <p className="text-xs" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>Sin cursos registrados</p>
              </div>
            ) : courses.slice(0, 5).map((c, i) => (
              <div key={c.id} className="flex items-center gap-2 py-2" style={{
                borderBottom: i < Math.min(courses.length, 5) - 1 ? "1px solid color-mix(in srgb, var(--sb-outline-variant) 12%, transparent)" : "none",
              }}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "var(--sb-on-surface)", fontFamily: FONT }}>{c.name}</p>
                  <p className="text-[10px]" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>{c.grade} {c.section}</p>
                </div>
                {/* Status cells - colored blocks like the design */}
                <div className="w-12 flex justify-center">
                  <div className="h-5 w-8 rounded" style={{ background: "#4ADE80" }} />
                </div>
                <div className="w-12 flex justify-center">
                  <div className="h-5 w-8 rounded" style={{ background: i % 2 === 0 ? "var(--sb-on-surface)" : "var(--sb-surface-container-high)" }} />
                </div>
                <div className="w-12 flex justify-center">
                  <div className="h-5 w-8 rounded" style={{ background: "var(--sb-surface-container-high)" }} />
                </div>
                <div className="w-12 flex justify-center">
                  <div className="h-5 w-8 rounded" style={{ background: i % 3 === 0 ? "var(--sb-on-surface)" : "var(--sb-surface-container-high)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Bottom Section - Transactions style */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="p-5" style={{
          background: "var(--sb-surface)",
          borderRadius: "20px",
          border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 25%, transparent)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold" style={{ color: "var(--sb-on-surface)", fontFamily: FONT }}>Próximas clases</p>
            <span className="text-[10px] font-medium px-2 py-0.5" style={{
              borderRadius: "6px",
              background: "var(--sb-surface-container-high)",
              color: "var(--sb-on-surface-variant)",
              fontFamily: FONT,
            }}>
              {todaySchedule.length} Total
            </span>
          </div>
          <span className="text-[10px] font-medium px-2.5 py-1" style={{
            borderRadius: "8px",
            background: "var(--sb-surface-container-high)",
            color: "var(--sb-on-surface-variant)",
            fontFamily: FONT,
          }}>
            Hoy
          </span>
        </div>

        {classSlots.length === 0 ? (
          <div className="py-8 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--sb-on-surface-variant)", opacity: 0.3 }} />
            <p className="text-xs" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>Sin clases programadas hoy</p>
          </div>
        ) : (
          <div className="space-y-0">
            {classSlots.map((cls, i) => (
              <div key={cls.id} className="flex items-center gap-3 py-2.5" style={{
                borderBottom: i < classSlots.length - 1 ? "1px solid color-mix(in srgb, var(--sb-outline-variant) 12%, transparent)" : "none",
              }}>
                <div className="h-8 w-8 flex items-center justify-center" style={{
                  background: "var(--sb-surface-container-high)",
                  borderRadius: "10px",
                }}>
                  <BookOpen className="h-4 w-4" style={{ color: "var(--sb-on-surface-variant)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: "var(--sb-on-surface)", fontFamily: FONT }}>{cls.course_name}</p>
                  <p className="text-[10px]" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>{cls.sub}{cls.classroom ? ` · ${cls.classroom}` : ""}</p>
                </div>
                <span className="text-[11px] font-medium" style={{ color: "var(--sb-on-surface-variant)", fontFamily: FONT }}>
                  {cls.start_time}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}
