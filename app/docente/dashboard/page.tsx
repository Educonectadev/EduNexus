"use client"

import * as React from "react"
import {
  BookOpen, UserCheck, ClipboardList, MessageSquare,
  Calendar, GraduationCap, Clock, BookMarked,
} from "lucide-react"
import { MinimalistDashboardView } from "@/components/dashboard/minimalist/minimalist-dashboard-view"
import { useAuthStore } from "@/stores/auth-store"

interface Course {
  id: string
  name: string
  grade: string
  section: string
  students: number
  schedule: string
}

export default function DocenteDashboard() {
  const user = useAuthStore((s) => s.user)
  const [courses, setCourses] = React.useState<Course[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/docente/cursos")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCourses(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const metrics = loading ? [] : [
    { label: "Mis Cursos", value: courses.length, icon: BookOpen, href: "/docente/cursos" },
    { label: "Total Alumnos", value: courses.reduce((acc, c) => acc + (c.students || 0), 0), icon: GraduationCap },
    { label: "Asistencia", value: "Hoy", icon: UserCheck, href: "/docente/asistencia" },
    { label: "Tareas", value: "Pendientes", icon: ClipboardList, href: "/docente/tareas" },
    { label: "Mensajes", value: "8", icon: MessageSquare, href: "/docente/mensajes" },
  ]

  const quickActions = [
    { label: "Tomar asistencia", desc: "Registrar asistencia del dia", icon: UserCheck, href: "/docente/asistencia" },
    { label: "Ingresar notas", desc: "Calificaciones de alumnos", icon: BookMarked, href: "/docente/calificaciones" },
    { label: "Mis cursos", desc: `${courses.length} cursos asignados`, icon: BookOpen, href: "/docente/cursos" },
    { label: "Tareas", desc: "Asignar y revisar tareas", icon: ClipboardList, href: "/docente/tareas" },
    { label: "Mensajes", desc: "Bandeja de entrada", icon: MessageSquare, href: "/docente/mensajes" },
    { label: "Calendario", desc: "Eventos y actividades", icon: Calendar, href: "/docente/calendario" },
  ]

  const now = new Date()
  const activities = [
    ...courses.slice(0, 4).map((c, i) => ({
      id: `course-${i}`,
      title: `${c.name} - ${c.grade} ${c.section}`,
      description: `${c.students} alumnos · ${c.schedule || 'Sin horario'}`,
      time: "Activo",
      icon: BookOpen,
    })),
    {
      id: "attendance",
      title: "Asistencia del dia",
      description: "Registra la asistencia de tus cursos",
      time: now.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
      icon: Clock,
    },
  ]

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="animate-pulse space-y-5">
          <div className="h-8 w-48 rounded-xl bg-sb-surface-container" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px rounded-2xl overflow-hidden bg-sb-outline-variant/20">
            {[1,2,3,4,5].map(i => <div key={i} className="h-28 bg-sb-surface" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <MinimalistDashboardView
      userName={user?.full_name?.split(" ")[0] || "Docente"}
      metrics={metrics}
      quickActions={quickActions}
      activities={activities}
    />
  )
}
