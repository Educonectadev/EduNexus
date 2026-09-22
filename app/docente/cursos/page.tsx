"use client"

import * as React from "react"
import { BookOpen, Users, GraduationCap, Clock, Calendar, Sun, Moon, ChevronRight, MapPin } from "@/components/ui/proicons"
import NotificationBell from "@/components/layout/notification-bell"
import Link from "next/link"
import { useAuthStore } from "@/stores/auth-store"
import { useTheme } from "next-themes"

const FONT = "var(--app-main-font, 'DM Sans'), sans-serif"
const DAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

interface Course {
  id: string; name: string; grade: string; section: string; students: number
}

interface Horario {
  id: string; day_of_week: number; start_time: string; end_time: string
  classroom: string; course_name: string; grade: string; section: string
}

const formatTime = (t: string) => t?.slice(0, 5) || ""

/* ═══ COURSE CARD ═══ */
function CourseCard({ course, schedule, index }: { course: Course; schedule: Horario[]; index: number }) {
  const sorted = [...schedule].sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time))
  const totalWeeklyMins = sorted.reduce((acc, h) => {
    const [sh, sm] = h.start_time.split(":").map(Number)
    const [eh, em] = h.end_time.split(":").map(Number)
    return acc + ((eh * 60 + em) - (sh * 60 + sm))
  }, 0)
  const weeklyHours = Math.round((totalWeeklyMins / 60) * 10) / 10

  return (
    <Link
      href={`/docente/cursos/${course.id}`}
      className="block p-5 transition-all duration-300 group"
      style={{
        borderRadius: "20px",
        background: "var(--note-surface)",
        border: "1px solid var(--note-hairline)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--note-text)" }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--note-hairline)" }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="h-12 w-12 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110"
            style={{ borderRadius: "14px", background: "var(--note-fill)" }}
          >
            <GraduationCap className="h-5 w-5" style={{ color: "var(--note-muted)" }} />
          </div>
          <div className="min-w-0">
            <h3 className="text-[16px] font-bold truncate" style={{ color: "var(--note-text)", fontFamily: FONT }}>
              {course.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[10px] font-bold px-2 py-0.5"
                style={{ borderRadius: "6px", background: "var(--note-fill)", color: "var(--note-muted)", fontFamily: FONT }}
              >
                {course.grade} {course.section}
              </span>
              <span className="text-[11px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
                {course.students} alumno{course.students !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
        <ChevronRight
          className="h-5 w-5 shrink-0 transition-all duration-300 group-hover:translate-x-1"
          style={{ color: "var(--note-muted)", opacity: 0.4 }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5 px-2.5 py-1" style={{ borderRadius: "8px", background: "var(--note-fill)" }}>
          <Users className="h-3 w-3" style={{ color: "var(--note-muted)" }} />
          <span className="text-[11px] font-semibold" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{course.students}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1" style={{ borderRadius: "8px", background: "var(--note-fill)" }}>
          <Clock className="h-3 w-3" style={{ color: "var(--note-muted)" }} />
          <span className="text-[11px] font-semibold" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{weeklyHours}h/sem</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1" style={{ borderRadius: "8px", background: "var(--note-fill)" }}>
          <Calendar className="h-3 w-3" style={{ color: "var(--note-muted)" }} />
          <span className="text-[11px] font-semibold" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{sorted.length} días</span>
        </div>
      </div>

      {/* Weekly preview */}
      {sorted.length > 0 && (
        <div className="pt-3" style={{ borderTop: "1px solid var(--note-hairline)" }}>
          <div className="flex gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {sorted.map((h) => {
              const dayLabel = DAY_SHORT[h.day_of_week] || ""
              const today = new Date().getDay()
              const isToday = h.day_of_week === today
              return (
                <div
                  key={h.id}
                  className="flex items-center gap-1.5 px-2 py-1 shrink-0 transition-all duration-200"
                  style={{
                    borderRadius: "8px",
                    background: isToday ? "var(--note-text)" : "var(--note-fill)",
                    color: isToday ? "var(--note-surface)" : "var(--note-muted)",
                  }}
                >
                  <span className="text-[9px] font-bold" style={{ fontFamily: FONT }}>{dayLabel}</span>
                  <span className="text-[9px] font-semibold tabular-nums" style={{ fontFamily: FONT }}>{formatTime(h.start_time)}</span>
                  {h.classroom && (
                    <>
                      <span style={{ opacity: 0.3 }}>·</span>
                      <MapPin className="h-2.5 w-2.5" style={{ opacity: 0.5 }} />
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Link>
  )
}

/* ═══ QUICK ACTION ═══ */
function QuickAction({ href, icon: Icon, label, sub }: { href: string; icon: React.ElementType; label: string; sub: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3.5 transition-all duration-200 group"
      style={{ borderRadius: "14px", background: "var(--note-fill)" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--note-fill-strong)" }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--note-fill)" }}
    >
      <div
        className="h-10 w-10 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
        style={{ borderRadius: "12px", background: "var(--note-fill-strong)" }}
      >
        <Icon className="h-4 w-4" style={{ color: "var(--note-text)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold truncate" style={{ color: "var(--note-text)", fontFamily: FONT }}>{label}</p>
        <p className="text-[10px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{sub}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: "var(--note-muted)", opacity: 0.3 }} />
    </Link>
  )
}

/* ═══ MAIN PAGE ═══ */
export default function CursosPage() {
  const user = useAuthStore((s) => s.user)
  const { theme, setTheme } = useTheme()
  const [courses, setCourses] = React.useState<Course[]>([])
  const [horarios, setHorarios] = React.useState<Horario[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [c, h] = await Promise.all([
          fetch("/api/docente/cursos").then(r => r.json()),
          fetch("/api/docente/horarios").then(r => r.json()),
        ])
        if (cancelled) return
        setCourses(Array.isArray(c) ? c.map((course: any) => ({ ...course, students: course.student_count ?? course.students ?? 0 })) : [])
        setHorarios(Array.isArray(h) ? h : [])
      } catch {} finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  const totalStudents = courses.reduce((a, c) => a + (c.students || 0), 0)
  const avgStudents = courses.length > 0 ? Math.round(totalStudents / courses.length) : 0

  const today = new Date()
  const todayIdx = today.getDay() === 0 ? 7 : today.getDay()
  const todaySchedule = horarios
    .filter(h => h.day_of_week === todayIdx)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const getScheduleForCourse = (courseId: string) =>
    horarios.filter(h => h.course_id === courseId)

  return (
    <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-white dark:bg-[#1a1a1c] sb-note">
      <div className="p-6 md:p-8 pb-24 md:pb-8">

        {/* ═══ HEADER ═══ */}
        <header className="flex items-start justify-between mb-7 gap-4">
          <div>
            <p className="text-[14px] font-medium mb-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Académico</p>
            <h1 className="text-[36px] md:text-[48px] font-bold leading-tight" style={{ color: "var(--note-text)", fontFamily: FONT }}>
              Mis Cursos
            </h1>
            <p className="text-[13px] mt-2" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
              {courses.length > 0
                ? `${courses.length} curso${courses.length !== 1 ? "s" : ""} · ${totalStudents} alumno${totalStudents !== 1 ? "s" : ""}`
                : "Cursos asignados este periodo académico"
              }
            </p>
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

        {/* ═══ STATS ═══ */}
        <div className="grid grid-cols-3 gap-3 mb-7">
          {[
            { label: "Cursos", value: loading ? "—" : courses.length },
            { label: "Alumnos", value: loading ? "—" : totalStudents },
            { label: "Promedio", value: loading ? "—" : `${avgStudents}` },
          ].map((stat) => (
            <div key={stat.label} className="p-4 text-center" style={{ borderRadius: "20px", background: "var(--note-fill)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{stat.label}</p>
              <p className="text-[24px] font-bold leading-none" style={{ color: "var(--note-text)", fontFamily: FONT }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ═══ QUICK ACTIONS ═══ */}
        <div className="mb-7">
          <p className="text-[13px] font-bold mb-3 px-1" style={{ color: "var(--note-text)", fontFamily: FONT }}>Acciones rápidas</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <QuickAction href="/docente/asistencia" icon={Calendar} label="Asistencia" sub="Tomar lista" />
            <QuickAction href="/docente/calificaciones" icon={GraduationCap} label="Notas" sub="Registrar" />
            <QuickAction href="/docente/tareas" icon={Clock} label="Tareas" sub="Crear / revisar" />
            <QuickAction href="/docente/materiales" icon={BookOpen} label="Materiales" sub="Subir archivos" />
          </div>
        </div>

        {/* ═══ COURSE GRID ═══ */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-5 animate-pulse" style={{ borderRadius: "20px", background: "var(--note-fill)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12" style={{ borderRadius: "14px", background: "var(--note-fill-strong)" }} />
                  <div className="flex-1">
                    <div className="h-4 w-32 mb-2" style={{ borderRadius: "6px", background: "var(--note-fill-strong)" }} />
                    <div className="h-3 w-20" style={{ borderRadius: "6px", background: "var(--note-fill-strong)" }} />
                  </div>
                </div>
                <div className="flex gap-2 mb-4">
                  <div className="h-6 w-16" style={{ borderRadius: "8px", background: "var(--note-fill-strong)" }} />
                  <div className="h-6 w-16" style={{ borderRadius: "8px", background: "var(--note-fill-strong)" }} />
                </div>
                <div className="h-8 w-full" style={{ borderRadius: "8px", background: "var(--note-fill-strong)" }} />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="py-16 text-center" style={{ borderRadius: "24px", background: "var(--note-surface)", border: "1px solid var(--note-hairline)" }}>
            <div className="h-16 w-16 flex items-center justify-center mx-auto mb-4" style={{ borderRadius: "16px", background: "var(--note-fill)" }}>
              <GraduationCap className="h-7 w-7" style={{ color: "var(--note-muted)", opacity: 0.3 }} />
            </div>
            <p className="text-[15px] font-bold" style={{ color: "var(--note-text)", fontFamily: FONT }}>Sin cursos asignados</p>
            <p className="text-[12px] mt-1 max-w-[240px] mx-auto" style={{ color: "var(--note-muted)", opacity: 0.5, fontFamily: FONT }}>
              El secretario asignará tus cursos y horarios
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {courses.map((course, i) => (
              <CourseCard
                key={course.id}
                course={course}
                schedule={getScheduleForCourse(course.id)}
                index={i}
              />
            ))}
          </div>
        )}

        {/* ═══ TODAY'S SCHEDULE ═══ */}
        {todaySchedule.length > 0 && (
          <div className="mt-7">
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-[13px] font-bold" style={{ color: "var(--note-text)", fontFamily: FONT }}>Horario de hoy</p>
              <span className="text-[10px] font-bold px-2 py-0.5" style={{ borderRadius: "6px", background: "var(--note-fill)", color: "var(--note-muted)", fontFamily: FONT }}>
                {todaySchedule.length} clases
              </span>
            </div>
            <div className="p-4" style={{ borderRadius: "20px", background: "var(--note-surface)", border: "1px solid var(--note-hairline)" }}>
              <div className="space-y-0">
                {todaySchedule.map((cls, idx) => {
                  const isNow = toMin(cls.start_time) <= nowMin && nowMin <= toMin(cls.end_time)
                  return (
                    <React.Fragment key={cls.id}>
                      {/* Time row */}
                      <div className="flex items-center gap-3 px-2 py-1">
                        <p className="text-[11px] font-semibold w-12 text-right shrink-0 tabular-nums" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
                          {formatTime(cls.start_time)}
                        </p>
                        <div className="flex-1 h-px" style={{ background: "var(--note-hairline)" }} />
                        <p className="text-[11px] font-semibold w-12 text-left shrink-0 tabular-nums" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
                          {formatTime(cls.end_time)}
                        </p>
                      </div>
                      {/* Class item */}
                      <div
                        className="flex items-center gap-3 p-3 mx-0 transition-all duration-200"
                        style={{
                          borderRadius: "12px",
                          background: isNow ? "var(--note-text)" : "transparent",
                        }}
                      >
                        <div
                          className="h-9 w-9 flex items-center justify-center shrink-0"
                          style={{
                            borderRadius: "10px",
                            background: isNow ? "rgba(255,255,255,0.15)" : "var(--note-fill)",
                          }}
                        >
                          <BookOpen className="h-4 w-4" style={{ color: isNow ? "rgba(255,255,255,0.8)" : "var(--note-muted)" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold truncate" style={{ color: isNow ? "#fff" : "var(--note-text)", fontFamily: FONT }}>
                            {cls.course_name}
                          </p>
                          <p className="text-[10px]" style={{ color: isNow ? "rgba(255,255,255,0.5)" : "var(--note-muted)", fontFamily: FONT }}>
                            {cls.grade} {cls.section}{cls.classroom ? ` · ${cls.classroom}` : ""}
                          </p>
                        </div>
                        {isNow && (
                          <span className="text-[9px] font-bold px-2 py-0.5" style={{ borderRadius: "6px", background: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.9)", fontFamily: FONT }}>
                            AHORA
                          </span>
                        )}
                      </div>
                      {/* Recess */}
                      {idx < todaySchedule.length - 1 && (
                        <div className="flex items-center gap-2 px-4 py-0.5 my-0.5">
                          <div className="flex-1 h-px" style={{ background: "var(--note-hairline)" }} />
                          <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--note-muted)", opacity: 0.25, fontFamily: FONT }}>· · ·</span>
                          <div className="flex-1 h-px" style={{ background: "var(--note-hairline)" }} />
                        </div>
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function toMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m }
