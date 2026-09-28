"use client"

import * as React from "react"
import { BookOpen, Users, GraduationCap, Clock, Calendar, ChevronRight, MapPin, AlertTriangle } from "@/components/ui/proicons"
import Link from "next/link"
import { useAuthStore } from "@/stores/auth-store"
import { SbSectionHeader, SbBadge } from "@/components/ui/sb"

const DAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

interface Course {
  id: string; name: string; grade: string; section: string; students: number
  level?: string; teacher_level?: string; level_mismatch?: boolean
}

interface Horario {
  id: string; day_of_week: number; start_time: string; end_time: string
  classroom: string; course_name: string; grade: string; section: string
  course_id: string
}

const formatTime = (t: string) => t?.slice(0, 5) || ""

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
      className={`block rounded-2xl bg-sb-surface border p-5 transition-all duration-300 group ${
        course.level_mismatch
          ? "border-red-500/40 hover:border-red-500/60"
          : "border-sb-outline-variant/10 hover:border-sb-outline-variant/25 hover:bg-sb-surface-container/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-12 w-12 flex items-center justify-center shrink-0 rounded-2xl bg-sb-surface-container transition-all duration-300 group-hover:scale-110">
            <GraduationCap className="h-5 w-5 text-sb-on-surface-variant/60" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate text-sb-on-surface">
              {course.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <SbBadge color="bg-sb-surface-container-high text-sb-on-surface-variant/60">
                {course.grade} {course.section}
              </SbBadge>
              {course.level_mismatch && (
                <SbBadge color="bg-red-500/15 text-red-600 dark:text-red-400">
                  Nivel no coincide
                </SbBadge>
              )}
              <span className="text-[11px] text-sb-on-surface-variant/50">
                {course.students} alumno{course.students !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-sb-on-surface-variant/30 transition-all duration-300 group-hover:translate-x-1" />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sb-surface-container text-sb-on-surface-variant/60">
          <Users className="h-3.5 w-3.5" />
          <span className="text-[11px] font-semibold">{course.students}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sb-surface-container text-sb-on-surface-variant/60">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-[11px] font-semibold">{weeklyHours}h/sem</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sb-surface-container text-sb-on-surface-variant/60">
          <Calendar className="h-3.5 w-3.5" />
          <span className="text-[11px] font-semibold">{sorted.length} días</span>
        </div>
      </div>

      {sorted.length > 0 && (
        <div className="pt-3 border-t border-sb-outline-variant/10">
          <div className="flex gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {sorted.map((h) => {
              const dayLabel = DAY_SHORT[h.day_of_week] || ""
              const today = new Date().getDay()
              const isToday = h.day_of_week === today
              return (
                <div
                  key={h.id}
                  className={`flex items-center gap-1.5 px-2 py-1 shrink-0 rounded-lg transition-all duration-200 ${isToday ? "bg-sb-on-surface text-sb-surface" : "bg-sb-surface-container text-sb-on-surface-variant/60"}`}
                >
                  <span className="text-[9px] font-bold">{dayLabel}</span>
                  <span className="text-[9px] font-semibold tabular-nums">{formatTime(h.start_time)}</span>
                  {h.classroom && (
                    <>
                      <span className="opacity-30">·</span>
                      <MapPin className="h-2.5 w-2.5 opacity-50" />
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

function QuickAction({ href, icon: Icon, label, sub }: { href: string; icon: React.ElementType; label: string; sub: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3.5 rounded-2xl bg-sb-surface border border-sb-outline-variant/10 transition-all duration-200 group hover:bg-sb-surface-container/50 hover:border-sb-outline-variant/25"
    >
      <div className="h-10 w-10 flex items-center justify-center shrink-0 rounded-xl bg-sb-surface-container transition-transform duration-200 group-hover:scale-110">
        <Icon className="h-4 w-4 text-sb-on-surface" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold truncate text-sb-on-surface">{label}</p>
        <p className="text-[11px] text-sb-on-surface-variant/50">{sub}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-sb-on-surface-variant/30 transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  )
}

export default function CursosPage() {
  const user = useAuthStore((s) => s.user)
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
  const mismatches = courses.filter((c) => c.level_mismatch)
  const teacherLevel = courses.find((c) => c.teacher_level)?.teacher_level || ""

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
    <div className="space-y-5">
      <SbSectionHeader
        title="Mis Cursos"
        description={
          courses.length > 0
            ? `${courses.length} curso${courses.length !== 1 ? "s" : ""} · ${totalStudents} alumno${totalStudents !== 1 ? "s" : ""}`
            : "Cursos asignados este periodo académico"
        }
      />

      {!loading && mismatches.length > 0 && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              {mismatches.length} curso{mismatches.length !== 1 ? "s" : ""} fuera de tu nivel
            </p>
            <p className="text-xs mt-0.5 text-sb-on-surface-variant/60">
              Tu Grado/Nivel asignado es {teacherLevel || "sin definir"}: {mismatches.map((c) => `${c.grade} ${c.section}`).join(", ")}. Revisa esta asignación con tu secretaría.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Cursos", value: loading ? "—" : courses.length },
          { label: "Alumnos", value: loading ? "—" : totalStudents },
          { label: "Promedio", value: loading ? "—" : `${avgStudents}` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-sb-surface border border-sb-outline-variant/10 p-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 mb-1">{stat.label}</p>
            <p className="text-xl font-semibold leading-none text-sb-on-surface">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50">Acciones rápidas</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <QuickAction href="/docente/asistencia" icon={Calendar} label="Asistencia" sub="Tomar lista" />
          <QuickAction href="/docente/calificaciones" icon={GraduationCap} label="Notas" sub="Registrar" />
          <QuickAction href="/docente/tareas" icon={Clock} label="Tareas" sub="Crear / revisar" />
          <QuickAction href="/docente/materiales" icon={BookOpen} label="Materiales" sub="Subir archivos" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-2xl bg-sb-surface border border-sb-outline-variant/10 p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-sb-surface-container" />
                <div className="flex-1">
                  <div className="h-4 w-32 mb-2 rounded bg-sb-surface-container" />
                  <div className="h-3 w-20 rounded bg-sb-surface-container" />
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                <div className="h-6 w-16 rounded-lg bg-sb-surface-container" />
                <div className="h-6 w-16 rounded-lg bg-sb-surface-container" />
              </div>
              <div className="h-8 w-full rounded-lg bg-sb-surface-container" />
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl bg-sb-surface border border-sb-outline-variant/10 py-16 text-center">
          <div className="h-16 w-16 flex items-center justify-center mx-auto mb-4 rounded-2xl bg-sb-surface-container">
            <GraduationCap className="h-7 w-7 text-sb-on-surface-variant/20" />
          </div>
          <p className="text-sm font-semibold text-sb-on-surface">Sin cursos asignados</p>
          <p className="text-xs mt-1 max-w-[240px] mx-auto text-sb-on-surface-variant/50">
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

      {todaySchedule.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50">Horario de hoy</p>
            <SbBadge color="bg-sb-surface-container-high text-sb-on-surface-variant/60">
              {todaySchedule.length} clases
            </SbBadge>
          </div>
          <div className="rounded-2xl bg-sb-surface border border-sb-outline-variant/10 p-4">
            <div className="space-y-0">
              {todaySchedule.map((cls, idx) => {
                const isNow = toMin(cls.start_time) <= nowMin && nowMin <= toMin(cls.end_time)
                return (
                  <React.Fragment key={cls.id}>
                    <div className="flex items-center gap-3 px-2 py-1">
                      <p className="text-[11px] font-semibold w-12 text-right shrink-0 tabular-nums text-sb-on-surface-variant/50">
                        {formatTime(cls.start_time)}
                      </p>
                      <div className="flex-1 h-px bg-sb-outline-variant/20" />
                      <p className="text-[11px] font-semibold w-12 text-left shrink-0 tabular-nums text-sb-on-surface-variant/50">
                        {formatTime(cls.end_time)}
                      </p>
                    </div>
                    <div
                      className={`flex items-center gap-3 p-3 mx-0 rounded-xl transition-all duration-200 ${isNow ? "bg-sb-on-surface text-sb-surface" : ""}`}
                    >
                      <div
                        className={`h-9 w-9 flex items-center justify-center shrink-0 rounded-lg ${isNow ? "bg-white/15" : "bg-sb-surface-container"}`}
                      >
                        <BookOpen className={`h-4 w-4 ${isNow ? "text-white/80" : "text-sb-on-surface-variant/60"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-semibold truncate ${isNow ? "text-sb-surface" : "text-sb-on-surface"}`}>
                          {cls.course_name}
                        </p>
                        <p className={`text-[11px] ${isNow ? "text-sb-surface/60" : "text-sb-on-surface-variant/50"}`}>
                          {cls.grade} {cls.section}{cls.classroom ? ` · ${cls.classroom}` : ""}
                        </p>
                      </div>
                      {isNow && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white/90">
                          AHORA
                        </span>
                      )}
                    </div>
                    {idx < todaySchedule.length - 1 && (
                      <div className="flex items-center gap-2 px-4 py-0.5 my-0.5">
                        <div className="flex-1 h-px bg-sb-outline-variant/10" />
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-sb-on-surface-variant/25">· · ·</span>
                        <div className="flex-1 h-px bg-sb-outline-variant/10" />
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
  )
}

function toMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m }
