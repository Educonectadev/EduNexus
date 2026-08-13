"use client"

import * as React from "react"
import {
  BookOpen, GraduationCap, UserCheck, ClipboardList, MessageSquare,
  Calendar, Clock, ChevronRight, LogIn, LogOut, BookMarked, MapPin,
} from "@/components/ui/proicons"
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

function SectionHeader({ icon: Icon, title, action }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--note-muted)]" />
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--note-muted)]">{title}</h2>
      </div>
      {action}
    </div>
  )
}

function CardRow({ href, onClick, children, className, highlight }: {
  href?: string
  onClick?: () => void
  children: React.ReactNode
  className?: string
  highlight?: boolean
}) {
  const base = cn(
    "block rounded-[24px] border bg-[var(--note-surface)] p-4 transition-all duration-150 hover:-translate-y-px hover:opacity-90",
    highlight
      ? "border-[var(--note-hairline-strong)] bg-[var(--note-fill)]"
      : "border-[var(--note-hairline)] hover:border-[var(--note-hairline-strong)]",
    className
  )
  if (href) return <Link href={href} className={base}>{children}</Link>
  return <button type="button" onClick={onClick} className={cn(base, "w-full text-left")}>{children}</button>
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
    { label: "Mis Cursos", value: loading ? "—" : courses.length, icon: BookOpen, href: "/docente/cursos" },
    { label: "Total Alumnos", value: loading ? "—" : totalStudents, icon: GraduationCap, href: "/docente/cursos" },
    { label: "Clases Hoy", value: loading ? "—" : todaySchedule.length, icon: Calendar, href: "/docente/horarios" },
    { label: "Horas Hoy", value: loading ? "—" : `${todaySchedule.reduce((a, h) => a + (toMin(h.end_time) - toMin(h.start_time)), 0) / 60} h`, icon: Clock, href: "/docente/horarios" },
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
    present: { label: "A tiempo", color: "bg-emerald-500/10 text-emerald-500", dot: "bg-emerald-500" },
    late: { label: "Tardanza", color: "bg-amber-500/10 text-amber-500", dot: "bg-amber-500" },
    absent: { label: "Ausente", color: "bg-red-500/10 text-red-500", dot: "bg-red-500" },
    justified: { label: "Justificado", color: "bg-blue-500/10 text-blue-500", dot: "bg-blue-500" },
    early_leave: { label: "Salida anticipada", color: "bg-orange-500/10 text-orange-500", dot: "bg-orange-500" },
  }
  const attS = attendanceStatus ? attConfig[attendanceStatus] : null

  if (loading) {
    return (
      <div className="sb-note-dash">
        <div className="mx-auto w-full max-w-[1034px] px-2 pb-4 animate-pulse space-y-5">
          <div className="h-9 w-64 rounded-[24px] bg-[var(--note-fill)]" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-[24px] bg-[var(--note-fill)]" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3 h-64 rounded-[24px] bg-[var(--note-fill)]" />
            <div className="lg:col-span-2 h-64 rounded-[24px] bg-[var(--note-fill)]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="sb-note-dash">
      <div className="mx-auto w-full max-w-[1034px] px-2 pb-4 space-y-5">
        {/* Header */}
        <header className="flex items-end justify-between gap-3 pt-2">
          <div>
            <h1 className="text-[26px] sm:text-[30px] leading-tight tracking-[-0.03em] text-[var(--note-text)]">
              {greeting}, {user?.full_name?.split(" ")[0] || "Docente"}
            </h1>
            <p className="mt-1 text-sm text-[var(--note-muted)] capitalize">{dateStr}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[var(--note-hairline)] bg-[var(--note-fill)] px-3.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium text-[var(--note-muted)]">Activo</span>
          </div>
        </header>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map((m) => {
            const Icon = m.icon
            return (
              <Link key={m.label} href={m.href} className="group block">
                <div className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] p-6 transition-all duration-150 group-hover:-translate-y-px group-hover:opacity-90 group-hover:border-[var(--note-hairline-strong)]">
                  <div className="mb-5 h-10 w-10 rounded-[12px] bg-[var(--note-fill)] flex items-center justify-center">
                    <Icon className="h-5 w-5 text-[var(--note-text)]" />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--note-muted)]">{m.label}</p>
                  <p className="mt-1.5 text-[22px] font-bold leading-none tracking-tight text-[var(--note-text)]">{m.value}</p>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left: horario de hoy + cursos */}
          <div className="lg:col-span-3 space-y-5">
            {/* Horario de hoy */}
            <section className="space-y-2.5">
              <SectionHeader
                icon={Calendar}
                title="Horario de hoy"
                action={<Link href="/docente/horarios" className="text-xs font-medium text-[var(--note-text)] opacity-50 transition-opacity duration-150 hover:opacity-100">Ver semana</Link>}
              />
              {todaySchedule.length === 0 ? (
                <CardRow>
                  <div className="flex items-center justify-center gap-2 py-4 text-sm text-[var(--note-muted)]">
                    <Calendar className="h-5 w-5 text-[var(--note-muted)]/40" />
                    No tienes clases hoy
                  </div>
                </CardRow>
              ) : (
                todaySchedule.map(h => {
                  const isNext = nextClass?.id === h.id
                  return (
                    <CardRow key={h.id} highlight={isNext} href="/docente/horarios">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-16 rounded-[12px] flex flex-col items-center justify-center shrink-0",
                          isNext ? "bg-[var(--note-solid-bg)] text-[var(--note-solid-fg)]" : "bg-[var(--note-fill-strong)] text-[var(--note-muted)]"
                        )}>
                          <span className="text-[10px] font-bold leading-none">{h.start_time.slice(0, 5)}</span>
                          <span className="text-[8px] opacity-60 mt-0.5">—</span>
                          <span className="text-[10px] font-bold leading-none">{h.end_time.slice(0, 5)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--note-text)] truncate">{h.course_name}</p>
                          <p className="text-[11px] text-[var(--note-muted)] truncate">{h.grade} · Sección {h.section}</p>
                        </div>
                        {h.classroom && (
                          <div className="hidden sm:flex items-center gap-1 text-[11px] text-[var(--note-muted)]">
                            <MapPin className="h-3 w-3" /> {h.classroom}
                          </div>
                        )}
                        {isNext && (
                          <span className="text-[9px] font-semibold uppercase tracking-wider rounded-full bg-[var(--note-solid-bg)] text-[var(--note-solid-fg)] px-2.5 py-1">Siguiente</span>
                        )}
                      </div>
                    </CardRow>
                  )
                })
              )}
            </section>

            {/* Mis cursos */}
            <section className="space-y-2.5">
              <SectionHeader
                icon={BookOpen}
                title="Mis cursos"
                action={<Link href="/docente/cursos" className="text-xs font-medium text-[var(--note-text)] opacity-50 transition-opacity duration-150 hover:opacity-100">Ver todos</Link>}
              />
              {courses.length === 0 ? (
                <CardRow>
                  <div className="flex items-center justify-center gap-2 py-4 text-sm text-[var(--note-muted)]">
                    <BookOpen className="h-5 w-5 text-[var(--note-muted)]/40" />
                    Sin cursos asignados
                  </div>
                </CardRow>
              ) : (
                courses.slice(0, 4).map(c => (
                  <CardRow key={c.id} href={`/docente/cursos/${c.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-[12px] bg-[var(--note-fill-strong)] flex items-center justify-center shrink-0">
                        <BookOpen className="h-4 w-4 text-[var(--note-muted)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--note-text)] truncate">{c.name}</p>
                        <p className="text-[11px] text-[var(--note-muted)]">{c.grade} · Sección {c.section}</p>
                      </div>
                      <span className="text-[11px] text-[var(--note-muted)] shrink-0">{c.students} alumnos</span>
                      <ChevronRight className="h-4 w-4 text-[var(--note-muted)]/40 group-hover:text-[var(--note-text)] transition-colors shrink-0" />
                    </div>
                  </CardRow>
                ))
              )}
            </section>
          </div>

          {/* Right: asistencia + acciones */}
          <div className="lg:col-span-2 space-y-5">
            {/* Asistencia hoy */}
            <section className="space-y-2.5">
              <SectionHeader
                icon={Clock}
                title="Asistencia de hoy"
                action={attS ? (
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${attS.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${attS.dot}`} /> {attS.label}
                  </span>
                ) : undefined}
              />
              <div className="grid grid-cols-2 gap-3">
                <CardRow>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <LogIn className={`h-3 w-3 ${checkedIn ? "text-emerald-500" : "text-[var(--note-muted)]/40"}`} />
                    <span className="text-[9px] font-semibold uppercase tracking-widest text-[var(--note-muted)]">Entrada</span>
                  </div>
                  <p className={`text-[22px] font-bold leading-none tracking-tight ${checkedIn ? "text-[var(--note-text)]" : "text-[var(--note-muted)]/40"}`}>{checkedIn?.slice(0, 5) || "--:--"}</p>
                  {schedule && <p className="text-[9px] text-[var(--note-muted)] mt-1.5">Prog. {schedule.start_time}</p>}
                </CardRow>
                <CardRow>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <LogOut className={`h-3 w-3 ${checkedOut ? "text-amber-500" : "text-[var(--note-muted)]/40"}`} />
                    <span className="text-[9px] font-semibold uppercase tracking-widest text-[var(--note-muted)]">Salida</span>
                  </div>
                  <p className={`text-[22px] font-bold leading-none tracking-tight ${checkedOut ? "text-[var(--note-text)]" : "text-[var(--note-muted)]/40"}`}>{checkedOut?.slice(0, 5) || "--:--"}</p>
                  {schedule && <p className="text-[9px] text-[var(--note-muted)] mt-1.5">Prog. {schedule.end_time}</p>}
                </CardRow>
              </div>
              {!checkedIn && (
                <button onClick={() => handleCheck("check-in")}
                  className="w-full h-11 rounded-[12px] bg-[var(--note-solid-bg)] text-[var(--note-solid-fg)] text-sm font-medium flex items-center justify-center gap-2 transition-all duration-150 hover:-translate-y-px hover:opacity-90">
                  <LogIn className="h-4 w-4" /> Marcar Entrada
                </button>
              )}
              {checkedIn && !checkedOut && (
                <button onClick={() => handleCheck("check-out")}
                  className="w-full h-11 rounded-[12px] bg-[var(--note-solid-bg)] text-[var(--note-solid-fg)] text-sm font-medium flex items-center justify-center gap-2 transition-all duration-150 hover:-translate-y-px hover:opacity-90">
                  <LogOut className="h-4 w-4" /> Marcar Salida
                </button>
              )}
              {checkedIn && checkedOut && (
                <Link href="/docente/asistencia">
                  <div className="w-full h-11 rounded-[12px] border border-[var(--note-hairline-strong)] text-[var(--note-text)] text-sm font-medium flex items-center justify-center gap-2 transition-all duration-150 hover:-translate-y-px hover:bg-[var(--note-fill)]">
                    <LogIn className="h-4 w-4" /> Ver detalle de asistencia
                  </div>
                </Link>
              )}
            </section>

            {/* Quick actions */}
            <section className="space-y-2.5">
              <SectionHeader icon={UserCheck} title="Acciones rápidas" />
              {quickActions.map(a => {
                const Icon = a.icon
                return (
                  <CardRow key={a.label} href={a.href}>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-[12px] bg-[var(--note-fill-strong)] flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-[var(--note-muted)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--note-text)]">{a.label}</p>
                        <p className="text-[11px] text-[var(--note-muted)]">{a.desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[var(--note-muted)]/40 group-hover:text-[var(--note-text)] transition-colors shrink-0" />
                    </div>
                  </CardRow>
                )
              })}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
