"use client"

import * as React from "react"
import {
  BookOpen, GraduationCap, UserCheck, ClipboardList, MessageSquare,
  Calendar, Clock, ChevronRight, LogIn, LogOut, BookMarked, MapPin,
} from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useAuthStore } from "@/stores/auth-store"
import { cn } from "@/lib/utils"

interface Course {
  id: string
  name: string
  grade: string
  section: string
  students: number
  schedule: string
}

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

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m }

function getAvatarColor(name: string) {
  const colors = ["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-amber-500", "bg-pink-500", "bg-cyan-500", "bg-rose-500"]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default function DocenteDashboard() {
  const user = useAuthStore((s) => s.user)
  const [courses, setCourses] = React.useState<Course[]>([])
  const [horarios, setHorarios] = React.useState<Horario[]>([])
  const [attendance, setAttendance] = React.useState<any>(null)
  const [schedule, setSchedule] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches"
  const dateStr = new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const today = new Date().toISOString().split("T")[0]
        const [c, h, a] = await Promise.all([
          fetch("/api/docente/cursos").then(r => r.json()),
          fetch("/api/docente/horarios").then(r => r.json()),
          fetch(`/api/docente/attendance?date=${today}`).then(r => r.json()),
        ])
        if (cancelled) return
        setCourses(Array.isArray(c) ? c : [])
        setHorarios(Array.isArray(h) ? h : [])
        setAttendance(a.attendance)
        setSchedule(a.schedule)
      } catch {} finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  const totalStudents = courses.reduce((acc, c) => acc + (c.students || 0), 0)

  const todayIdx = new Date().getDay()
  const todaySchedule = horarios.filter(h => h.day_of_week === todayIdx).sort((a, b) => a.start_time.localeCompare(b.start_time))

  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const nextClass = todaySchedule.find(h => toMin(h.end_time) > nowMin)

  const checkedIn = attendance?.check_in
  const checkedOut = attendance?.check_out
  const attendanceStatus = attendance?.status

  const handleCheck = async (action: "check-in" | "check-out") => {
    try {
      const res = await fetch("/api/docente/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (data.success) {
        setAttendance(data.attendance)
        if (data.schedule) setSchedule(data.schedule)
      }
    } catch {}
  }

  const metrics = [
    { label: "Mis Cursos", value: loading ? "—" : courses.length, icon: BookOpen, href: "/docente/cursos", color: "text-sb-primary", bg: "bg-sb-primary/8" },
    { label: "Total Alumnos", value: loading ? "—" : totalStudents, icon: GraduationCap, href: "/docente/cursos", color: "text-blue-600", bg: "bg-blue-500/8" },
    { label: "Clases Hoy", value: loading ? "—" : todaySchedule.length, icon: Calendar, href: "/docente/horarios", color: "text-amber-600", bg: "bg-amber-500/8" },
    { label: "Horas Hoy", value: loading ? "—" : `${todaySchedule.reduce((a, h) => a + (toMin(h.end_time) - toMin(h.start_time)), 0) / 60} h`, icon: Clock, href: "/docente/horarios", color: "text-emerald-600", bg: "bg-emerald-500/8" },
  ]

  const quickActions = [
    { label: "Tomar asistencia", desc: "Registrar asistencia del día", icon: UserCheck, href: "/docente/asistencia" },
    { label: "Ingresar notas", desc: "Calificaciones de alumnos", icon: BookMarked, href: "/docente/calificaciones" },
    { label: "Asignar tareas", desc: "Crear tareas para tus cursos", icon: ClipboardList, href: "/docente/tareas" },
    { label: "Mis cursos", desc: `${courses.length} cursos asignados`, icon: BookOpen, href: "/docente/cursos" },
    { label: "Horarios", desc: "Tu horario de la semana", icon: Calendar, href: "/docente/horarios" },
    { label: "Mensajes", desc: "Bandeja de entrada", icon: MessageSquare, href: "/docente/mensajes" },
  ]

  const attConfig: Record<string, { label: string; color: string; dot: string }> = {
    present: { label: "A tiempo", color: "bg-emerald-500/10 text-emerald-600", dot: "bg-emerald-500" },
    late: { label: "Tardanza", color: "bg-amber-500/10 text-amber-600", dot: "bg-amber-500" },
    absent: { label: "Ausente", color: "bg-red-500/10 text-red-600", dot: "bg-red-500" },
    justified: { label: "Justificado", color: "bg-blue-500/10 text-blue-600", dot: "bg-blue-500" },
    early_leave: { label: "Salida anticipada", color: "bg-orange-500/10 text-orange-600", dot: "bg-orange-500" },
  }
  const attS = attendanceStatus ? attConfig[attendanceStatus] : null

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="animate-pulse space-y-5">
          <div className="h-8 w-56 rounded-md bg-sb-surface-container" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-md bg-sb-surface-container" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-sb-on-surface">{greeting}, {user?.full_name?.split(" ")[0] || "Docente"}</h1>
          <p className="text-sm text-sb-on-surface-variant/50 mt-0.5 capitalize">{dateStr}</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sb-on-surface/[0.04]">
          <div className="h-1.5 w-1.5 rounded-md bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-sb-on-surface-variant font-medium">Activo</span>
        </div>
      </motion.div>

      {/* Metrics */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((m, i) => {
          const Icon = m.icon
          return (
            <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 + i * 0.04 }}>
              <Link href={m.href} className="block">
                <div className="bg-sb-surface rounded-md p-5 border border-sb-outline-variant/8 hover:border-sb-outline-variant/15 transition-all group">
                  <div className={`h-10 w-10 rounded-md ${m.bg} flex items-center justify-center mb-4`}>
                    <Icon className={`h-5 w-5 ${m.color}`} />
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-sb-on-surface">{m.value}</p>
                  <p className="text-[11px] text-sb-on-surface-variant/50 mt-1">{m.label}</p>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: horario de hoy + cursos */}
        <div className="lg:col-span-3 space-y-6">
          {/* Horario de hoy */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <div className="bg-sb-surface rounded-md overflow-hidden border border-sb-outline-variant/8">
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-sb-primary/60" />
                  <p className="text-sm font-semibold text-sb-on-surface">Horario de hoy</p>
                </div>
                <Link href="/docente/horarios" className="text-[11px] font-medium text-sb-primary hover:underline">Ver semana</Link>
              </div>
              {todaySchedule.length === 0 ? (
                <div className="px-5 pb-5">
                  <div className="rounded-md bg-sb-surface-container p-4 text-center">
                    <Calendar className="h-6 w-6 mx-auto text-sb-on-surface-variant/20 mb-1.5" />
                    <p className="text-xs text-sb-on-surface-variant/40">No tienes clases hoy</p>
                  </div>
                </div>
              ) : (
                <div className="px-5 pb-5 space-y-2">
                  {todaySchedule.map(h => {
                    const isNext = nextClass?.id === h.id
                    return (
                      <div key={h.id} className={cn(
                        "flex items-center gap-3 p-3 rounded-md transition-colors",
                        isNext ? "bg-sb-primary/5 ring-1 ring-sb-primary/20" : "bg-sb-surface-container hover:bg-sb-surface-container-high/60"
                      )}>
                        <div className={cn("h-10 w-14 rounded-md flex flex-col items-center justify-center shrink-0", isNext ? "bg-sb-primary text-sb-on-primary" : "bg-sb-surface-container-high text-sb-on-surface-variant")}>
                          <span className="text-[10px] font-bold leading-none">{h.start_time.slice(0, 5)}</span>
                          <span className="text-[8px] opacity-70 mt-0.5">—</span>
                          <span className="text-[10px] font-bold leading-none">{h.end_time.slice(0, 5)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-sb-on-surface truncate">{h.course_name}</p>
                          <p className="text-[11px] text-sb-on-surface-variant/50 truncate">{h.grade} · Sección {h.section}</p>
                        </div>
                        {h.classroom && (
                          <div className="hidden sm:flex items-center gap-1 text-[11px] text-sb-on-surface-variant/50">
                            <MapPin className="h-3 w-3" /> {h.classroom}
                          </div>
                        )}
                        {isNext && (
                          <span className="text-[9px] font-semibold uppercase px-2 py-1 rounded-md bg-sb-primary/10 text-sb-primary">Siguiente</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Mis cursos */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
            <div className="bg-sb-surface rounded-md overflow-hidden border border-sb-outline-variant/8">
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-sb-primary/60" />
                  <p className="text-sm font-semibold text-sb-on-surface">Mis cursos</p>
                </div>
                <Link href="/docente/cursos" className="text-[11px] font-medium text-sb-primary hover:underline">Ver todos</Link>
              </div>
              <div className="divide-y divide-sb-outline-variant/8">
                {courses.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <BookOpen className="h-8 w-8 mx-auto text-sb-on-surface-variant/15 mb-2" />
                    <p className="text-sm text-sb-on-surface-variant/30">Sin cursos asignados</p>
                  </div>
                ) : courses.slice(0, 4).map(c => (
                  <Link key={c.id} href={`/docente/cursos/${c.id}`}>
                    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-sb-surface-container-low/50 transition-colors group">
                      <div className={cn("h-9 w-9 rounded-md flex items-center justify-center shrink-0", getAvatarColor(c.name))}>
                        <BookOpen className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-sb-on-surface truncate">{c.name}</p>
                        <p className="text-[11px] text-sb-on-surface-variant/50">{c.grade} · Sección {c.section}</p>
                      </div>
                      <span className="text-[11px] text-sb-on-surface-variant/50 shrink-0">{c.students} alumnos</span>
                      <ChevronRight className="h-4 w-4 text-sb-on-surface-variant/25 group-hover:text-sb-on-surface-variant/50 transition-colors shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: asistencia + acciones */}
        <div className="lg:col-span-2 space-y-6">
          {/* Asistencia hoy */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
            <div className="bg-sb-surface rounded-md overflow-hidden border border-sb-outline-variant/8">
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-sb-primary/60" />
                  <p className="text-sm font-semibold text-sb-on-surface">Asistencia de hoy</p>
                </div>
                {attS && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${attS.color}`}>
                    <span className={`h-1 w-1 rounded-md ${attS.dot}`} /> {attS.label}
                  </span>
                )}
              </div>
              <div className="px-5 pb-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md bg-sb-surface-container p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <LogIn className={`h-3 w-3 ${checkedIn ? "text-emerald-500" : "text-sb-on-surface-variant/30"}`} />
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-sb-on-surface-variant/40">Entrada</span>
                    </div>
                    <p className={`text-lg font-bold ${checkedIn ? "text-sb-on-surface" : "text-sb-on-surface-variant/30"}`}>{checkedIn?.slice(0, 5) || "--:--"}</p>
                    {schedule && <p className="text-[9px] text-sb-on-surface-variant/40 mt-0.5">Prog. {schedule.start_time}</p>}
                  </div>
                  <div className="rounded-md bg-sb-surface-container p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <LogOut className={`h-3 w-3 ${checkedOut ? "text-amber-500" : "text-sb-on-surface-variant/30"}`} />
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-sb-on-surface-variant/40">Salida</span>
                    </div>
                    <p className={`text-lg font-bold ${checkedOut ? "text-sb-on-surface" : "text-sb-on-surface-variant/30"}`}>{checkedOut?.slice(0, 5) || "--:--"}</p>
                    {schedule && <p className="text-[9px] text-sb-on-surface-variant/40 mt-0.5">Prog. {schedule.end_time}</p>}
                  </div>
                </div>
                {!checkedIn && (
                  <button onClick={() => handleCheck("check-in")}
                    className="w-full h-11 rounded-md bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all">
                    <LogIn className="h-4 w-4" /> Marcar Entrada
                  </button>
                )}
                {checkedIn && !checkedOut && (
                  <button onClick={() => handleCheck("check-out")}
                    className="w-full h-11 rounded-md bg-amber-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-amber-400 transition-all">
                    <LogOut className="h-4 w-4" /> Marcar Salida
                  </button>
                )}
                {checkedIn && checkedOut && (
                  <Link href="/docente/asistencia">
                    <div className="w-full h-11 rounded-md bg-emerald-500/10 text-emerald-600 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-emerald-500/15 transition-all">
                      <LogIn className="h-4 w-4" /> Ver detalle de asistencia
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>

          {/* Quick actions */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <div className="bg-sb-surface rounded-md overflow-hidden border border-sb-outline-variant/8">
              <div className="px-5 pt-5 pb-3">
                <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">Acciones rápidas</p>
              </div>
              <div className="divide-y divide-sb-outline-variant/8">
                {quickActions.map(a => {
                  const Icon = a.icon
                  return (
                    <Link key={a.label} href={a.href}>
                      <div className="flex items-center gap-3 px-5 py-3 hover:bg-sb-surface-container-low/50 transition-colors group">
                        <div className="h-8 w-8 rounded-md bg-sb-surface-container flex items-center justify-center shrink-0 group-hover:bg-sb-primary/10 transition-colors">
                          <Icon className="h-4 w-4 text-sb-on-surface-variant/50 group-hover:text-sb-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-sb-on-surface">{a.label}</p>
                          <p className="text-[11px] text-sb-on-surface-variant/50">{a.desc}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-sb-on-surface-variant/25 group-hover:text-sb-on-surface-variant/50 transition-colors shrink-0" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
