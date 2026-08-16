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
    <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-[#BABABA] dark:bg-[#1a1a1a]">
      <div className="p-6 md:p-8 pb-24 md:pb-8">

        {/* ═══════════════ HEADER ═══════════════ */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[14px] font-medium mb-1 text-[#666] dark:text-[#999]">Inicio</p>
            <h1 className="text-[36px] md:text-[48px] font-bold leading-tight text-[#000] dark:text-white">
              {greeting},<br />{teacherName}
            </h1>
            <p className="text-[13px] mt-2 text-[#666] dark:text-[#999]">{dateFormatted}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-[#333]">
              <Bell className="h-5 w-5 text-[#000] dark:text-white" />
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-[#333]"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-[#000] dark:text-white" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-[#000] dark:text-white" />
            </button>
            <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center bg-[#000] dark:bg-white">
              <span className="text-[12px] font-bold text-white dark:text-[#000]">
                {user?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "D"}
              </span>
            </div>
            <span className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-[#000] dark:bg-white text-white dark:text-[#000]">
              Docente
            </span>
          </div>
        </div>

        {/* ═══════════════ 4 STAT CARDS ═══════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-5 rounded-[30px] bg-white dark:bg-[#222]">
            <p className="text-[12px] font-medium mb-3 text-[#666] dark:text-[#999]">Mis cursos</p>
            <p className="text-[32px] font-bold text-[#000] dark:text-white">
              {loading ? "—" : courses.length}
            </p>
          </div>
          <div className="p-5 rounded-[30px] bg-white dark:bg-[#222]">
            <p className="text-[12px] font-medium mb-3 text-[#666] dark:text-[#999]">Total alumnos</p>
            <p className="text-[32px] font-bold text-[#000] dark:text-white">
              {loading ? "—" : totalStudents.toLocaleString()}
            </p>
          </div>
          <div className="p-5 rounded-[30px] bg-white dark:bg-[#222]">
            <p className="text-[12px] font-medium mb-3 text-[#666] dark:text-[#999]">Clases hoy</p>
            <p className="text-[32px] font-bold text-[#000] dark:text-white">
              {loading ? "—" : todaySchedule.length}
            </p>
          </div>
          <div className="p-5 rounded-[30px] bg-white dark:bg-[#222]">
            <p className="text-[12px] font-medium mb-3 text-[#666] dark:text-[#999]">Horas hoy</p>
            <p className="text-[32px] font-bold text-[#000] dark:text-white">
              {loading ? "—" : `${hoursToday}h`}
            </p>
          </div>
        </div>

        {/* ═══════════════ BOTTOM GRID ═══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-4">

          {/* ──── LEFT COLUMN: Horario + Mis Cursos ──── */}
          <div className="flex flex-col gap-4">

            {/* Horario de hoy */}
            <div className="p-6 rounded-[30px] flex-1 bg-white dark:bg-[#222]">
              <div className="flex items-center justify-between mb-5">
                <p className="text-[16px] font-semibold text-[#000] dark:text-white">Horario de hoy</p>
                <button className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full bg-[#D9D9D9] dark:bg-[#444] text-[#666] dark:text-[#ccc]">
                  Hoy <ChevronDown className="h-3 w-3" />
                </button>
              </div>
              {todaySchedule.length === 0 ? (
                <div className="py-8 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-[#D9D9D9] dark:text-[#555]" />
                  <p className="text-[13px] text-[#999] dark:text-[#666]">Sin clases hoy</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {todaySchedule.map((cls) => (
                    <div key={cls.id} className="flex items-center gap-3 p-4 rounded-[20px] bg-[#D9D9D9] dark:bg-[#333]">
                      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-[#444]">
                        <BookOpen className="h-5 w-5 text-[#666] dark:text-[#ccc]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate text-[#000] dark:text-white">{cls.course_name}</p>
                        <p className="text-[11px] text-[#666] dark:text-[#999]">{cls.grade} {cls.section}{cls.classroom ? ` · ${cls.classroom}` : ""}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-medium text-[#000] dark:text-white">{cls.start_time}</p>
                        <p className="text-[11px] text-[#666] dark:text-[#999]">{cls.end_time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mis Cursos */}
            <div className="p-6 rounded-[30px] bg-white dark:bg-[#222]">
              <p className="text-[16px] font-semibold mb-5 text-[#000] dark:text-white">Mis Cursos</p>
              {courses.length === 0 ? (
                <div className="py-6 text-center">
                  <GraduationCap className="h-8 w-8 mx-auto mb-2 text-[#D9D9D9] dark:text-[#555]" />
                  <p className="text-[13px] text-[#999] dark:text-[#666]">Sin cursos registrados</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {courses.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 p-4 rounded-[20px] bg-[#D9D9D9] dark:bg-[#333]">
                      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-[#444]">
                        <GraduationCap className="h-5 w-5 text-[#666] dark:text-[#ccc]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate text-[#000] dark:text-white">{c.name}</p>
                        <p className="text-[11px] text-[#666] dark:text-[#999]">{c.grade} {c.section}</p>
                      </div>
                      <span className="text-[12px] font-medium text-[#666] dark:text-[#999]">{c.students} alumnos</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ──── RIGHT COLUMN: Asistencia de hoy ──── */}
          <div className="p-6 rounded-[30px] bg-white dark:bg-[#222]">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[16px] font-semibold text-[#000] dark:text-white">Asistencia de hoy</p>
              <button className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full bg-[#D9D9D9] dark:bg-[#444] text-[#666] dark:text-[#ccc]">
                Resumen <ChevronDown className="h-3 w-3" />
              </button>
            </div>

            {/* Attendance summary */}
            <div className="mb-6">
              <div className="flex items-end gap-2 mb-2">
                <span className="text-[48px] font-bold leading-none text-[#000] dark:text-white">
                  {loading ? "—" : `${attendancePct}%`}
                </span>
              </div>
              <p className="text-[13px] text-[#666] dark:text-[#999]">
                {studentSummary
                  ? `${studentSummary.present} presentes de ${studentSummary.total} alumnos`
                  : "Sin datos de asistencia"}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 rounded-full mb-8 bg-[#D9D9D9] dark:bg-[#444]">
              <div
                className="h-full rounded-full transition-all duration-700 bg-[#000] dark:bg-white"
                style={{ width: `${attendancePct}%` }}
              />
            </div>

            {/* Course breakdown */}
            <p className="text-[14px] font-semibold mb-4 text-[#000] dark:text-white">Resumen por curso</p>
            {courses.length === 0 ? (
              <div className="py-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-[#D9D9D9] dark:text-[#555]" />
                <p className="text-[13px] text-[#999] dark:text-[#666]">Sin cursos</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {courses.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-4 rounded-[20px] bg-[#D9D9D9] dark:bg-[#333]">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-[#444]">
                      <GraduationCap className="h-5 w-5 text-[#666] dark:text-[#ccc]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate text-[#000] dark:text-white">{c.name}</p>
                      <p className="text-[11px] text-[#666] dark:text-[#999]">{c.grade} {c.section}</p>
                    </div>
                    <span className="text-[12px] font-medium text-[#666] dark:text-[#999]">{c.students} alumnos</span>
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
