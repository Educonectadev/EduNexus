"use client"

import * as React from "react"
import Link from "next/link"
import { useAuthStore } from "@/stores/auth-store"
import { Calendar, Clock, BookOpen, GraduationCap, Users, ChevronDown, Bell, Sun, Moon } from "@/components/ui/proicons"
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

const WEEK_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

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

  const dateStr = today.toISOString().split("T")[0]
  const dateFormatted = today.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [c, h] = await Promise.all([
          fetch("/api/docente/cursos").then(r => r.json()),
          fetch("/api/docente/horarios").then(r => r.json()),
        ])
        if (cancelled) return
        setCourses(Array.isArray(c) ? c : [])
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
    <div
      className="w-full h-full rounded-[25px] overflow-hidden"
      style={{ background: "#BABABA" }}
    >
      <div className="p-6 md:p-8">

        {/* ═══════════════ HEADER ═══════════════ */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[14px] font-medium mb-1" style={{ color: "#666" }}>Inicio</p>
            <h1 className="text-[36px] md:text-[48px] font-bold leading-tight" style={{ color: "#000" }}>
              {greeting},<br />{teacherName}
            </h1>
            <p className="text-[13px] mt-2" style={{ color: "#666" }}>{dateFormatted}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="h-10 w-10 flex items-center justify-center rounded-full" style={{ background: "#fff" }}>
              <Bell className="h-5 w-5" style={{ color: "#000" }} />
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-10 w-10 flex items-center justify-center rounded-full"
              style={{ background: "#fff" }}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" style={{ color: "#000" }} />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" style={{ color: "#000" }} />
            </button>
            <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center" style={{ background: "#000" }}>
              <span className="text-[12px] font-bold text-white">
                {user?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "D"}
              </span>
            </div>
            <span className="px-3 py-1.5 rounded-full text-[12px] font-medium" style={{ background: "#000", color: "#fff" }}>
              Docente
            </span>
          </div>
        </div>

        {/* ═══════════════ 4 STAT CARDS ═══════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Cursos */}
          <div className="p-5 rounded-[30px]" style={{ background: "#fff" }}>
            <p className="text-[12px] font-medium mb-3" style={{ color: "#666" }}>Mis cursos</p>
            <p className="text-[32px] font-bold" style={{ color: "#000" }}>
              {loading ? "—" : courses.length}
            </p>
          </div>
          {/* Alumnos */}
          <div className="p-5 rounded-[30px]" style={{ background: "#fff" }}>
            <p className="text-[12px] font-medium mb-3" style={{ color: "#666" }}>Total alumnos</p>
            <p className="text-[32px] font-bold" style={{ color: "#000" }}>
              {loading ? "—" : totalStudents.toLocaleString()}
            </p>
          </div>
          {/* Clases hoy */}
          <div className="p-5 rounded-[30px]" style={{ background: "#fff" }}>
            <p className="text-[12px] font-medium mb-3" style={{ color: "#666" }}>Clases hoy</p>
            <p className="text-[32px] font-bold" style={{ color: "#000" }}>
              {loading ? "—" : todaySchedule.length}
            </p>
          </div>
          {/* Horas */}
          <div className="p-5 rounded-[30px]" style={{ background: "#fff" }}>
            <p className="text-[12px] font-medium mb-3" style={{ color: "#666" }}>Horas hoy</p>
            <p className="text-[32px] font-bold" style={{ color: "#000" }}>
              {loading ? "—" : `${hoursToday}h`}
            </p>
          </div>
        </div>

        {/* ═══════════════ BOTTOM GRID ═══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-4">

          {/* ──── LEFT COLUMN: Horario + Mis Cursos ──── */}
          <div className="flex flex-col gap-4">

            {/* Horario de hoy */}
            <div className="p-6 rounded-[30px] flex-1" style={{ background: "#fff" }}>
              <div className="flex items-center justify-between mb-5">
                <p className="text-[16px] font-semibold" style={{ color: "#000" }}>Horario de hoy</p>
                <button className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full" style={{ background: "#D9D9D9", color: "#666" }}>
                  Hoy <ChevronDown className="h-3 w-3" />
                </button>
              </div>
              {todaySchedule.length === 0 ? (
                <div className="py-8 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2" style={{ color: "#D9D9D9" }} />
                  <p className="text-[13px]" style={{ color: "#999" }}>Sin clases hoy</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {todaySchedule.map((cls) => (
                    <div key={cls.id} className="flex items-center gap-3 p-4 rounded-[20px]" style={{ background: "#D9D9D9" }}>
                      <div className="h-10 w-10 flex items-center justify-center rounded-full" style={{ background: "#fff" }}>
                        <BookOpen className="h-5 w-5" style={{ color: "#666" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate" style={{ color: "#000" }}>{cls.course_name}</p>
                        <p className="text-[11px]" style={{ color: "#666" }}>{cls.grade} {cls.section}{cls.classroom ? ` · ${cls.classroom}` : ""}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-medium" style={{ color: "#000" }}>{cls.start_time}</p>
                        <p className="text-[11px]" style={{ color: "#666" }}>{cls.end_time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mis Cursos */}
            <div className="p-6 rounded-[30px]" style={{ background: "#fff" }}>
              <p className="text-[16px] font-semibold mb-5" style={{ color: "#000" }}>Mis Cursos</p>
              {courses.length === 0 ? (
                <div className="py-6 text-center">
                  <GraduationCap className="h-8 w-8 mx-auto mb-2" style={{ color: "#D9D9D9" }} />
                  <p className="text-[13px]" style={{ color: "#999" }}>Sin cursos registrados</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {courses.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 p-4 rounded-[20px]" style={{ background: "#D9D9D9" }}>
                      <div className="h-10 w-10 flex items-center justify-center rounded-full" style={{ background: "#fff" }}>
                        <GraduationCap className="h-5 w-5" style={{ color: "#666" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate" style={{ color: "#000" }}>{c.name}</p>
                        <p className="text-[11px]" style={{ color: "#666" }}>{c.grade} {c.section}</p>
                      </div>
                      <span className="text-[12px] font-medium" style={{ color: "#666" }}>{c.students} alumnos</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ──── RIGHT COLUMN: Asistencia de hoy ──── */}
          <div className="p-6 rounded-[30px]" style={{ background: "#fff" }}>
            <div className="flex items-center justify-between mb-5">
              <p className="text-[16px] font-semibold" style={{ color: "#000" }}>Asistencia de hoy</p>
              <button className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full" style={{ background: "#D9D9D9", color: "#666" }}>
                Resumen <ChevronDown className="h-3 w-3" />
              </button>
            </div>

            {/* Attendance summary */}
            <div className="mb-6">
              <div className="flex items-end gap-2 mb-2">
                <span className="text-[48px] font-bold leading-none" style={{ color: "#000" }}>
                  {loading ? "—" : `${attendancePct}%`}
                </span>
              </div>
              <p className="text-[13px]" style={{ color: "#666" }}>
                {studentSummary
                  ? `${studentSummary.present} presentes de ${studentSummary.total} alumnos`
                  : "Sin datos de asistencia"}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 rounded-full mb-8" style={{ background: "#D9D9D9" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${attendancePct}%`,
                  background: "#000",
                }}
              />
            </div>

            {/* Course breakdown */}
            <p className="text-[14px] font-semibold mb-4" style={{ color: "#000" }}>Resumen por curso</p>
            {courses.length === 0 ? (
              <div className="py-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-2" style={{ color: "#D9D9D9" }} />
                <p className="text-[13px]" style={{ color: "#999" }}>Sin cursos</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {courses.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-4 rounded-[20px]" style={{ background: "#D9D9D9" }}>
                    <div className="h-10 w-10 flex items-center justify-center rounded-full" style={{ background: "#fff" }}>
                      <GraduationCap className="h-5 w-5" style={{ color: "#666" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: "#000" }}>{c.name}</p>
                      <p className="text-[11px]" style={{ color: "#666" }}>{c.grade} {c.section}</p>
                    </div>
                    <span className="text-[12px] font-medium" style={{ color: "#666" }}>{c.students} alumnos</span>
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
