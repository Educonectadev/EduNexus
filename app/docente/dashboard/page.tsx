"use client"

import * as React from "react"
import { BookOpen, Users, Calendar, Clock, CheckCircle, UserCheck, BookMarked, ClipboardList, FileText, Video } from "@/components/ui/proicons"
import { MinimalistDashboardView } from "@/components/dashboard/minimalist/minimalist-dashboard-view"
import { useAuthStore } from "@/stores/auth-store"

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

  const today = React.useMemo(() => new Date(), [])
  const teacherName = user?.full_name?.split(" ")[0] || "Docente"

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
  }, [today])

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

  const metrics = [
    { label: "Mis cursos", value: loading ? "—" : courses.length, icon: BookOpen, href: "/docente/cursos" },
    { label: "Total alumnos", value: loading ? "—" : totalStudents.toLocaleString(), icon: Users },
    { label: "Clases hoy", value: loading ? "—" : todaySchedule.length, icon: Calendar, href: "/docente/horarios" },
    { label: "Horas hoy", value: loading ? "—" : `${hoursToday}h`, icon: Clock },
    {
      label: "Asistencia hoy",
      value: loading ? "—" : `${attendancePct}%`,
      icon: CheckCircle,
      href: "/docente/asistencia",
      trend: studentSummary && studentSummary.total > 0 ? `${studentSummary.present}/${studentSummary.total}` : "sin datos",
      trendUp: attendancePct >= 80,
    },
  ]

  const quickActions = [
    { label: "Tomar asistencia", desc: "Registrar presentes del día", icon: UserCheck, href: "/docente/asistencia" },
    { label: "Registrar notas", desc: "Ingresar calificaciones", icon: BookMarked, href: "/docente/calificaciones" },
    { label: "Crear tarea", desc: "Nueva tarea para un curso", icon: ClipboardList, href: "/docente/tareas" },
    { label: "Subir material", desc: "Recursos y archivos", icon: FileText, href: "/docente/materiales" },
    { label: "Iniciar clase virtual", desc: "Aula en línea", icon: Video, href: "/docente/virtual-classes" },
  ]

  const activities = todaySchedule.map((cls) => ({
    id: cls.id,
    title: cls.course_name,
    description: `${cls.grade} ${cls.section}${cls.classroom ? ` · ${cls.classroom}` : ""}`,
    time: `${cls.start_time?.slice(0, 5)} – ${cls.end_time?.slice(0, 5)}`,
    icon: Calendar,
  }))

  return (
    <div className="w-full pt-4">
      <MinimalistDashboardView
        userName={teacherName}
        metrics={metrics}
        quickActions={quickActions}
        activities={activities}
        emptyState={
          <div className="bg-sb-surface rounded-2xl p-8 text-center border border-sb-outline-variant/10">
            <p className="text-sm text-sb-on-surface-variant/50">Sin clases programadas para hoy</p>
            <p className="text-[12px] text-sb-on-surface-variant/40 mt-1">Tu horario del día aparecerá aquí</p>
          </div>
        }
      />
    </div>
  )
}
