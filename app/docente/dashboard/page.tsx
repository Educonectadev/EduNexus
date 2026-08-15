"use client"

import * as React from "react"
import { useAuthStore } from "@/stores/auth-store"
import { TeacherHeader } from "@/components/docente/teacher-header"
import { TeacherStats } from "@/components/docente/teacher-stats"
import { TodaySchedule, type ScheduleItem } from "@/components/docente/today-schedule"
import { TodayAttendance } from "@/components/docente/today-attendance"
import { TeacherCourses, type TeacherCourse } from "@/components/docente/teacher-courses"
import { QuickActions } from "@/components/docente/quick-actions"

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

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

export default function DocenteDashboard() {
  const user = useAuthStore((s) => s.user)

  const [courses, setCourses] = React.useState<TeacherCourse[]>([])
  const [horarios, setHorarios] = React.useState<Horario[]>([])
  const [teacherAtt, setTeacherAtt] = React.useState<any>(null)
  const [schedule, setSchedule] = React.useState<any>(null)
  const [studentSummary, setStudentSummary] = React.useState<{
    present: number
    absent: number
    late: number
    justified?: number
    total: number
  } | null>(null)
  const [loading, setLoading] = React.useState(true)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches"
  const dateStr = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
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

        // Carga el resumen de asistencia de alumnos por cada curso del día.
        // Si la API no está disponible, no rompe el dashboard (queda null).
        try {
          const todayIdx = new Date().getDay()
          const todayCourses = (Array.isArray(h) ? h : [])
            .filter((hr: Horario) => hr.day_of_week === todayIdx)
          const courseIds = Array.from(new Set(todayCourses.map((hr: any) => hr.course_id).filter(Boolean)))
          if (courseIds.length > 0) {
            const summaries = await Promise.all(
              courseIds.map((cid: string) =>
                fetch(`/api/docente/student-attendance?course_id=${cid}&date=${today}`)
                  .then((r) => r.json())
                  .catch(() => null)
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
        } catch {
          /* silent: el dashboard funciona sin este resumen */
        }
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const totalStudents = courses.reduce((acc, c) => acc + (c.students || 0), 0)

  const todayIdx = new Date().getDay()
  const todaySchedule: ScheduleItem[] = horarios
    .filter((h) => h.day_of_week === todayIdx)
    .map((h) => ({
      id: h.id,
      start_time: h.start_time,
      end_time: h.end_time,
      course_name: h.course_name,
      grade: h.grade,
      section: h.section,
      classroom: h.classroom,
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
    } catch {
      /* silent */
    }
  }

  return (
    <div data-td-scope="dashboard" className="td-fade-in">
      <TeacherHeader
        title="Inicio"
        greeting={greeting}
        teacherName={teacherName}
        dateStr={dateStr}
      />

      <div className="td-container">
        <TeacherStats
          courses={courses.length}
          totalStudents={totalStudents}
          classesToday={todaySchedule.length}
          hoursToday={hoursToday}
          loading={loading}
        />

        <div className="td-main-grid">
          <div className="td-col">
            <TodaySchedule items={todaySchedule} loading={loading} />
            <TeacherCourses courses={courses} loading={loading} />
          </div>

          <div className="td-col">
            <TodayAttendance
              teacherAttendance={teacherAtt}
              scheduleStart={schedule?.start_time}
              scheduleEnd={schedule?.end_time}
              studentSummary={studentSummary}
              loading={loading}
              onCheckIn={() => handleCheck("check-in")}
              onCheckOut={() => handleCheck("check-out")}
            />
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  )
}
