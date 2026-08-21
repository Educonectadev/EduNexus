"use client"

import * as React from "react"
import { BookOpen, Users, GraduationCap, Clock, Calendar, Sun, Moon, Flame } from "@/components/ui/proicons"
import NotificationBell from "@/components/layout/notification-bell"
import Link from "next/link"
import { useAuthStore } from "@/stores/auth-store"
import { useTheme } from "next-themes"

interface Course {
  id: string
  name: string
  grade: string
  section: string
  students: number
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

const FONT = "var(--app-main-font, 'DM Sans'), sans-serif"

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
  const gradesCount = new Set(courses.map(c => c.grade)).size

  const today = new Date()
  const todayIdx = today.getDay() === 0 ? 7 : today.getDay()
  const todaySchedule = horarios
    .filter(h => h.day_of_week === todayIdx)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  return (
    <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-black dark:bg-[#1a1a1c] sb-note">
      <div className="p-6 md:p-8 pb-24 md:pb-8">

        {/* ═══════════════ HEADER ═══════════════ */}
        <header className="flex items-start justify-between mb-6 gap-4">
          <div>
            <p className="text-[14px] font-medium mb-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Panel Docente</p>
            <h1 className="text-[36px] md:text-[48px] font-bold leading-tight" style={{ color: "var(--note-text)", fontFamily: FONT }}>
              Mis Cursos
            </h1>
            <p className="text-[13px] mt-2" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
              Cursos asignados este periodo académico
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

        {/* ═══════════════ 4 STAT CARDS ═══════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: BookOpen, label: "Mis cursos", value: loading ? "—" : courses.length },
            { icon: Users, label: "Total alumnos", value: loading ? "—" : totalStudents.toLocaleString() },
            { icon: GraduationCap, label: "Promedio/curso", value: loading ? "—" : avgStudents },
            { icon: Flame, label: "Grados", value: loading ? "—" : gradesCount },
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

          {/* ──── LEFT COLUMN: Acciones rápidas + Resumen ──── */}
          <div className="flex flex-col gap-4">

            {/* Acciones rápidas */}
            <div className="p-5" style={{ borderRadius: "24px", background: "var(--note-surface)", border: "1px solid var(--note-hairline)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[15px] font-bold" style={{ color: "var(--note-text)", fontFamily: FONT }}>Acciones rápidas</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/docente/asistencia" className="flex items-center gap-3 p-3 transition-colors group" style={{ borderRadius: "16px", background: "var(--note-fill)" }}>
                  <div className="h-10 w-10 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ borderRadius: "12px", background: "var(--note-fill-strong)" }}>
                    <Calendar className="h-4 w-4" style={{ color: "var(--note-text)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "var(--note-text)", fontFamily: FONT }}>Asistencia</p>
                    <p className="text-[10px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Tomar lista</p>
                  </div>
                </Link>
                <Link href="/docente/calificaciones" className="flex items-center gap-3 p-3 transition-colors group" style={{ borderRadius: "16px", background: "var(--note-fill)" }}>
                  <div className="h-10 w-10 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ borderRadius: "12px", background: "var(--note-fill-strong)" }}>
                    <GraduationCap className="h-4 w-4" style={{ color: "var(--note-text)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "var(--note-text)", fontFamily: FONT }}>Notas</p>
                    <p className="text-[10px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Registrar</p>
                  </div>
                </Link>
                <Link href="/docente/tareas" className="flex items-center gap-3 p-3 transition-colors group" style={{ borderRadius: "16px", background: "var(--note-fill)" }}>
                  <div className="h-10 w-10 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ borderRadius: "12px", background: "var(--note-fill-strong)" }}>
                    <Clock className="h-4 w-4" style={{ color: "var(--note-text)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "var(--note-text)", fontFamily: FONT }}>Tareas</p>
                    <p className="text-[10px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Crear / revisar</p>
                  </div>
                </Link>
                <Link href="/docente/materiales" className="flex items-center gap-3 p-3 transition-colors group" style={{ borderRadius: "16px", background: "var(--note-fill)" }}>
                  <div className="h-10 w-10 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ borderRadius: "12px", background: "var(--note-fill-strong)" }}>
                    <BookOpen className="h-4 w-4" style={{ color: "var(--note-text)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "var(--note-text)", fontFamily: FONT }}>Materiales</p>
                    <p className="text-[10px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Subir archivos</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Resumen */}
            <div className="p-5" style={{ borderRadius: "24px", background: "var(--note-surface)", border: "1px solid var(--note-hairline)" }}>
              <p className="text-[15px] font-bold mb-4" style={{ color: "var(--note-text)", fontFamily: FONT }}>Resumen</p>
              <div className="space-y-3">
                {[
                  { label: "Total cursos", value: loading ? "—" : courses.length },
                  { label: "Total alumnos", value: loading ? "—" : totalStudents },
                  { label: "Promedio por curso", value: loading ? "—" : `${avgStudents} alumnos` },
                  { label: "Grados diferentes", value: loading ? "—" : gradesCount },
                ].map((item, i) => (
                  <React.Fragment key={item.label}>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{item.label}</span>
                      <span className="text-[13px] font-bold" style={{ color: "var(--note-text)", fontFamily: FONT }}>
                        {item.value}
                      </span>
                    </div>
                    {i < 3 && <div className="h-px" style={{ background: "var(--note-hairline)" }} />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* ──── RIGHT COLUMN: Mis Cursos (lista) + Horario ──── */}
          <div className="flex flex-col gap-4">

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
                    <Link
                      key={c.id}
                      href={`/docente/cursos/${c.id}`}
                      className="flex items-center gap-3 p-3 transition-colors group"
                      style={{ borderRadius: "16px", background: "var(--note-fill)" }}
                    >
                      <div className="h-10 w-10 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ borderRadius: "12px", background: "var(--note-fill-strong)" }}>
                        <GraduationCap className="h-4 w-4" style={{ color: "var(--note-text)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: "var(--note-text)", fontFamily: FONT }}>{c.name}</p>
                        <p className="text-[11px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{c.grade} &quot;{c.section}&quot;</p>
                      </div>
                      <span className="text-[11px] font-semibold shrink-0" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{c.students} alumnos</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Horario de hoy */}
            <div className="p-5 flex-1" style={{ borderRadius: "24px", background: "var(--note-surface)", border: "1px solid var(--note-hairline)" }}>
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
                    <div key={cls.id} className="flex items-center gap-3 p-3 transition-colors group" style={{ borderRadius: "16px", background: "var(--note-fill)" }}>
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
          </div>
        </div>
      </div>
    </div>
  )
}
