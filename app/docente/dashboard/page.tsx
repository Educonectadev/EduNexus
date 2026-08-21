"use client"

import * as React from "react"
import Link from "next/link"
import { useAuthStore } from "@/stores/auth-store"
import { Calendar, Clock, BookOpen, GraduationCap, Users, Sun, Moon } from "@/components/ui/proicons"
import NotificationBell from "@/components/layout/notification-bell"
import { useTheme } from "next-themes"

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

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

export default function DocenteDashboard() {
  const user = useAuthStore((s) => s.user)
  const [courses, setCourses] = React.useState<TeacherCourse[]>([])
  const [horarios, setHorarios] = React.useState<Horario[]>([])
  const [studentSummary, setStudentSummary] = React.useState<{
    present: number; absent: number; late: number; justified?: number; total: number
  } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const { theme, setTheme } = useTheme()

  const today = new Date()
  const hour = today.getHours()
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches"
  const teacherName = user?.full_name?.split(" ")[0] || "Docente"

  const dateFormatted = today.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const dateStr = today.toISOString().split("T")[0]
        const [c, h] = await Promise.all([
          fetch("/api/docente/cursos").then(r => r.json()),
          fetch("/api/docente/horarios").then(r => r.json()),
        ])
        if (cancelled) return
        setCourses(Array.isArray(c) ? c.map((course: any) => ({ ...course, students: course.student_count ?? course.students ?? 0 })) : [])
        setHorarios(Array.isArray(h) ? h : [])

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

  return (
    <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-black dark:bg-[#1a1a1c] sb-note">
      <div className="p-6 md:p-8 pb-24 md:pb-8">

        {/* ═══════════════ HEADER ═══════════════ */}
        <header className="flex items-start justify-between mb-6 gap-4">
          <div>
            <p className="text-[14px] font-medium mb-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Inicio</p>
            <h1 className="text-[36px] md:text-[48px] font-bold leading-tight" style={{ color: "var(--note-text)", fontFamily: FONT }}>
              {greeting},<br />{teacherName}
            </h1>
            <p className="text-[13px] mt-2" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{dateFormatted}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5">
                <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ background: "var(--note-fill-strong)" }}>
                  <span className="text-[9px] font-semibold" style={{ color: "var(--note-text)" }}>
                    {user.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "D"}
                  </span>
                </div>
                <span className="text-sm md:text-base font-medium whitespace-nowrap" style={{ color: "var(--note-text)", fontFamily: FONT }}>
                  {user.full_name}
                </span>
              </div>
            )}
            <NotificationBell />
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Cambiar tema" title="Cambiar tema" className="h-10 w-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity relative">
              <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" style={{ color: "var(--note-text)" }} />
              <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" style={{ color: "var(--note-text)" }} />
            </button>
          </div>
        </header>

        {/* ═══════════════ 4 STAT CARDS ═══════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: BookOpen, label: "Mis cursos", value: loading ? "—" : courses.length },
            { icon: Users, label: "Total alumnos", value: loading ? "—" : totalStudents.toLocaleString() },
            { icon: Calendar, label: "Clases hoy", value: loading ? "—" : todaySchedule.length },
            { icon: Clock, label: "Horas hoy", value: loading ? "—" : `${hoursToday}h` },
          ].map((stat) => (
            <div key={stat.label} className="p-4" style={{ borderRadius: "16px", background: "var(--note-surface)", border: "1px solid var(--note-hairline)" }}>
              <div className="h-9 w-9 flex items-center justify-center mb-3" style={{ borderRadius: "10px", background: "var(--note-fill)" }}>
                <stat.icon className="h-4 w-4" style={{ color: "var(--note-muted)" }} />
              </div>
              <p className="text-[11px] font-medium mb-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{stat.label}</p>
              <p className="text-[28px] font-bold leading-none" style={{ color: "var(--note-text)", fontFamily: FONT }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* ═══════════════ BOTTOM GRID ═══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-4">

          {/* ──── LEFT COLUMN: Horario + Mis Cursos ──── */}
          <div className="flex flex-col gap-4">

            {/* Horario de hoy */}
            <div className="p-5" style={{ borderRadius: "24px", background: "var(--note-surface)", border: "1px solid var(--note-hairline)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[15px] font-bold" style={{ color: "var(--note-text)", fontFamily: FONT }}>Horario de hoy</p>
                <span className="text-[10px] font-semibold px-2.5 py-1" style={{ borderRadius: "8px", background: "var(--note-fill)", color: "var(--note-muted)", fontFamily: FONT }}>
                  {todaySchedule.length} clases
                </span>
              </div>
              {todaySchedule.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="h-12 w-12 flex items-center justify-center mx-auto mb-3" style={{ borderRadius: "16px", background: "var(--note-fill)" }}>
                    <Clock className="h-5 w-5" style={{ color: "var(--note-muted)", opacity: 0.3 }} />
                  </div>
                  <p className="text-[13px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Sin clases hoy</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {todaySchedule.map((cls) => (
                    <div key={cls.id} className="flex items-center gap-3 p-3 transition-colors cursor-pointer group" style={{ borderRadius: "16px", background: "var(--note-fill)" }}>
                      <div className="h-10 w-10 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ borderRadius: "12px", background: "var(--note-fill-strong)" }}>
                        <BookOpen className="h-4 w-4" style={{ color: "var(--note-text)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: "var(--note-text)", fontFamily: FONT }}>{cls.course_name}</p>
                        <p className="text-[11px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{cls.grade} {cls.section}{cls.classroom ? ` · ${cls.classroom}` : ""}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-semibold" style={{ color: "var(--note-text)", fontFamily: FONT }}>{cls.start_time?.slice(0, 5)}</p>
                        <p className="text-[10px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{cls.end_time?.slice(0, 5)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mis Cursos */}
            <div className="p-5" style={{ borderRadius: "24px", background: "var(--note-surface)", border: "1px solid var(--note-hairline)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[15px] font-bold" style={{ color: "var(--note-text)", fontFamily: FONT }}>Mis Cursos</p>
                <span className="text-[10px] font-semibold px-2.5 py-1" style={{ borderRadius: "8px", background: "var(--note-fill)", color: "var(--note-muted)", fontFamily: FONT }}>
                  {courses.length} cursos
                </span>
              </div>
              {courses.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="h-12 w-12 flex items-center justify-center mx-auto mb-3" style={{ borderRadius: "16px", background: "var(--note-fill)" }}>
                    <GraduationCap className="h-5 w-5" style={{ color: "var(--note-muted)", opacity: 0.3 }} />
                  </div>
                  <p className="text-[13px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Sin cursos registrados</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {courses.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 p-3 transition-colors cursor-pointer group" style={{ borderRadius: "16px", background: "var(--note-fill)" }}>
                      <div className="h-10 w-10 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ borderRadius: "12px", background: "var(--note-fill-strong)" }}>
                        <GraduationCap className="h-4 w-4" style={{ color: "var(--note-text)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: "var(--note-text)", fontFamily: FONT }}>{c.name}</p>
                        <p className="text-[11px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{c.grade} {c.section}</p>
                      </div>
                      <span className="text-[11px] font-semibold" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{c.students} alumnos</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ──── RIGHT COLUMN: Asistencia de hoy ──── */}
          <div className="p-5" style={{ borderRadius: "24px", background: "var(--note-surface)", border: "1px solid var(--note-hairline)" }}>
            <div className="flex items-center justify-between mb-5">
              <p className="text-[15px] font-bold" style={{ color: "var(--note-text)", fontFamily: FONT }}>Asistencia de hoy</p>
              <span className="text-[10px] font-semibold px-2.5 py-1" style={{ borderRadius: "8px", background: "var(--note-fill)", color: "var(--note-muted)", fontFamily: FONT }}>
                Resumen
              </span>
            </div>

            {/* Attendance summary */}
            <div className="mb-5">
              <div className="flex items-end gap-1 mb-1">
                <span className="text-[56px] font-bold leading-none tracking-tight" style={{ color: "var(--note-text)", fontFamily: FONT }}>
                  {loading ? "—" : `${attendancePct}%`}
                </span>
              </div>
              <p className="text-[13px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
                {studentSummary
                  ? `${studentSummary.present} presentes de ${studentSummary.total} alumnos`
                  : "Sin datos de asistencia"}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 rounded-full mb-6" style={{ background: "var(--note-fill)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${attendancePct}%`, background: "var(--note-text)", opacity: 0.8 }}
              />
            </div>

            {/* Course breakdown */}
            <p className="text-[13px] font-bold mb-3" style={{ color: "var(--note-text)", fontFamily: FONT }}>Resumen por curso</p>
            {courses.length === 0 ? (
              <div className="py-8 text-center">
                <div className="h-12 w-12 flex items-center justify-center mx-auto mb-3" style={{ borderRadius: "16px", background: "var(--note-fill)" }}>
                  <Users className="h-5 w-5" style={{ color: "var(--note-muted)", opacity: 0.3 }} />
                </div>
                <p className="text-[13px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Sin cursos</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {courses.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 transition-colors cursor-pointer group" style={{ borderRadius: "16px", background: "var(--note-fill)" }}>
                    <div className="h-10 w-10 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ borderRadius: "12px", background: "var(--note-fill-strong)" }}>
                      <GraduationCap className="h-4 w-4" style={{ color: "var(--note-text)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate" style={{ color: "var(--note-text)", fontFamily: FONT }}>{c.name}</p>
                      <p className="text-[11px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{c.grade} {c.section}</p>
                    </div>
                    <span className="text-[11px] font-semibold" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{c.students} alumnos</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
