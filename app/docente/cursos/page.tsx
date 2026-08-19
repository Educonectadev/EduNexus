"use client"

import * as React from "react"
import { BookOpen, Users, GraduationCap, Clock, Calendar, ChevronDown, Sun, Moon } from "@/components/ui/proicons"
import NotificationBell from "@/components/layout/notification-bell"
import { motion } from "framer-motion"
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
        setCourses(Array.isArray(c) ? c : [])
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
    <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-black dark:bg-[#1a1a1c]">
      <div className="p-6 md:p-8 pb-24 md:pb-8">

        {/* ═══════════════ HEADER ═══════════════ */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <p className="text-[14px] font-medium mb-1 text-[#a1a1aa]">Panel Docente</p>
            <h1 className="text-[36px] md:text-[48px] font-bold leading-tight text-[#f4f4f5]">
              Mis Cursos
            </h1>
            <p className="text-[13px] mt-2 text-[#a1a1aa]">
              Cursos asignados este periodo académico
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5">
                <div className="h-6 w-6 rounded-full flex items-center justify-center">
                  <span className="text-[9px] font-semibold text-[#f4f4f5]">
                    {user.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "D"}
                  </span>
                </div>
                <span className="text-sm md:text-base font-medium text-[#f4f4f5] whitespace-nowrap">
                  {user.full_name}
                </span>
              </div>
            )}
            <NotificationBell />
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Cambiar tema"
              title="Cambiar tema"
              className="h-10 w-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity relative"
            >
              <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-[#f4f4f5]" />
              <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-[#f4f4f5]" />
            </button>
          </div>
        </div>

        {/* ═══════════════ 4 STAT CARDS ═══════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-[20px] bg-white dark:bg-[#17171a] hover:shadow-lg transition-shadow">
            <div className="h-9 w-9 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center mb-3">
              <BookOpen className="h-4 w-4 text-[#666] dark:text-[#a1a1aa]" />
            </div>
            <p className="text-[11px] font-medium text-[#666] dark:text-[#a1a1aa] mb-1">Mis cursos</p>
            <p className="text-[28px] font-bold text-[#000] dark:text-[#f4f4f5] leading-none">
              {loading ? "—" : courses.length}
            </p>
          </div>
          <div className="p-4 rounded-[20px] bg-white dark:bg-[#17171a] hover:shadow-lg transition-shadow">
            <div className="h-9 w-9 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center mb-3">
              <Users className="h-4 w-4 text-[#666] dark:text-[#a1a1aa]" />
            </div>
            <p className="text-[11px] font-medium text-[#666] dark:text-[#a1a1aa] mb-1">Total alumnos</p>
            <p className="text-[28px] font-bold text-[#000] dark:text-[#f4f4f5] leading-none">
              {loading ? "—" : totalStudents.toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-[20px] bg-white dark:bg-[#17171a] hover:shadow-lg transition-shadow">
            <div className="h-9 w-9 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center mb-3">
              <GraduationCap className="h-4 w-4 text-[#666] dark:text-[#a1a1aa]" />
            </div>
            <p className="text-[11px] font-medium text-[#666] dark:text-[#a1a1aa] mb-1">Promedio/curso</p>
            <p className="text-[28px] font-bold text-[#000] dark:text-[#f4f4f5] leading-none">
              {loading ? "—" : avgStudents}
            </p>
          </div>
          <div className="p-4 rounded-[20px] bg-white dark:bg-[#17171a] hover:shadow-lg transition-shadow">
            <div className="h-9 w-9 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center mb-3">
              <Flame className="h-4 w-4 text-[#666] dark:text-[#a1a1aa]" />
            </div>
            <p className="text-[11px] font-medium text-[#666] dark:text-[#a1a1aa] mb-1">Grados</p>
            <p className="text-[28px] font-bold text-[#000] dark:text-[#f4f4f5] leading-none">
              {loading ? "—" : gradesCount}
            </p>
          </div>
        </div>

        {/* ═══════════════ BOTTOM GRID (idéntico al dashboard) ═══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-4">

          {/* ──── LEFT COLUMN: Acciones rápidas + Mis Cursos ──── */}
          <div className="flex flex-col gap-4">

            {/* Acciones rápidas */}
            <div className="p-5 rounded-[20px] bg-white dark:bg-[#17171a]">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[15px] font-bold text-[#000] dark:text-[#f4f4f5]">Acciones rápidas</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/docente/asistencia" className="flex items-center gap-3 p-3 rounded-[16px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors group">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-black/10 dark:bg-white/10 group-hover:scale-110 transition-transform">
                    <Calendar className="h-4 w-4 text-[#666] dark:text-[#a1a1aa]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate text-[#000] dark:text-[#f4f4f5]">Asistencia</p>
                    <p className="text-[10px] text-[#666] dark:text-[#a1a1aa]">Tomar lista</p>
                  </div>
                </Link>
                <Link href="/docente/calificaciones" className="flex items-center gap-3 p-3 rounded-[16px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors group">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-black/10 dark:bg-white/10 group-hover:scale-110 transition-transform">
                    <GraduationCap className="h-4 w-4 text-[#666] dark:text-[#a1a1aa]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate text-[#000] dark:text-[#f4f4f5]">Notas</p>
                    <p className="text-[10px] text-[#666] dark:text-[#a1a1aa]">Registrar</p>
                  </div>
                </Link>
                <Link href="/docente/tareas" className="flex items-center gap-3 p-3 rounded-[16px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors group">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-black/10 dark:bg-white/10 group-hover:scale-110 transition-transform">
                    <Clock className="h-4 w-4 text-[#666] dark:text-[#a1a1aa]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate text-[#000] dark:text-[#f4f4f5]">Tareas</p>
                    <p className="text-[10px] text-[#666] dark:text-[#a1a1aa]">Crear / revisar</p>
                  </div>
                </Link>
                <Link href="/docente/materiales" className="flex items-center gap-3 p-3 rounded-[16px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors group">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-black/10 dark:bg-white/10 group-hover:scale-110 transition-transform">
                    <BookOpen className="h-4 w-4 text-[#666] dark:text-[#a1a1aa]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate text-[#000] dark:text-[#f4f4f5]">Materiales</p>
                    <p className="text-[10px] text-[#666] dark:text-[#a1a1aa]">Subir archivos</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Resumen */}
            <div className="p-5 rounded-[20px] bg-white dark:bg-[#17171a]">
              <p className="text-[15px] font-bold mb-4 text-[#000] dark:text-[#f4f4f5]">Resumen</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#666] dark:text-[#a1a1aa]">Total cursos</span>
                  <span className="text-[13px] font-bold text-[#000] dark:text-[#f4f4f5]">
                    {loading ? "—" : courses.length}
                  </span>
                </div>
                <div className="h-px bg-black/5 dark:bg-white/10" />
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#666] dark:text-[#a1a1aa]">Total alumnos</span>
                  <span className="text-[13px] font-bold text-[#000] dark:text-[#f4f4f5]">
                    {loading ? "—" : totalStudents}
                  </span>
                </div>
                <div className="h-px bg-black/5 dark:bg-white/10" />
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#666] dark:text-[#a1a1aa]">Promedio por curso</span>
                  <span className="text-[13px] font-bold text-[#000] dark:text-[#f4f4f5]">
                    {loading ? "—" : `${avgStudents} alumnos`}
                  </span>
                </div>
                <div className="h-px bg-black/5 dark:bg-white/10" />
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#666] dark:text-[#a1a1aa]">Grados diferentes</span>
                  <span className="text-[13px] font-bold text-[#000] dark:text-[#f4f4f5]">
                    {loading ? "—" : gradesCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ──── RIGHT COLUMN: Mis Cursos (lista) + Horario ──── */}
          <div className="flex flex-col gap-4">

            {/* Mis Cursos */}
            <div className="p-5 rounded-[20px] bg-white dark:bg-[#17171a]">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[15px] font-bold text-[#000] dark:text-[#f4f4f5]">Mis Cursos</p>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-[#666] dark:text-[#a1a1aa]">
                  {courses.length} cursos
                </span>
              </div>
              {courses.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <GraduationCap className="h-5 w-5 text-[#D9D9D9] dark:text-[#3f3f46]" />
                  </div>
                  <p className="text-[13px] text-[#999] dark:text-[#71717a]">Sin cursos registrados</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {courses.map((c) => (
                    <Link
                      key={c.id}
                      href={`/docente/cursos/${c.id}`}
                      className="flex items-center gap-3 p-3 rounded-[16px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors group"
                    >
                      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-black/10 dark:bg-white/10 group-hover:scale-110 transition-transform">
                        <GraduationCap className="h-4 w-4 text-[#666] dark:text-[#a1a1aa]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate text-[#000] dark:text-[#f4f4f5]">{c.name}</p>
                        <p className="text-[11px] text-[#666] dark:text-[#a1a1aa]">{c.grade} &quot;{c.section}&quot;</p>
                      </div>
                      <span className="text-[11px] font-semibold text-[#666] dark:text-[#a1a1aa] shrink-0">{c.students} alumnos</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Horario de hoy */}
            <div className="p-5 rounded-[20px] flex-1 bg-white dark:bg-[#17171a]">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[15px] font-bold text-[#000] dark:text-[#f4f4f5]">Horario de hoy</p>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-[#666] dark:text-[#a1a1aa]">
                  {todaySchedule.length} clases
                </span>
              </div>
              {todaySchedule.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <Clock className="h-5 w-5 text-[#D9D9D9] dark:text-[#3f3f46]" />
                  </div>
                  <p className="text-[13px] text-[#999] dark:text-[#71717a]">Sin clases hoy</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {todaySchedule.map((cls) => (
                    <div key={cls.id} className="flex items-center gap-3 p-3 rounded-[16px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors group">
                      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-black/10 dark:bg-white/10 group-hover:scale-110 transition-transform">
                        <BookOpen className="h-4 w-4 text-[#666] dark:text-[#a1a1aa]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate text-[#000] dark:text-[#f4f4f5]">{cls.course_name}</p>
                        <p className="text-[11px] text-[#666] dark:text-[#a1a1aa]">{cls.grade} {cls.section}{cls.classroom ? ` · ${cls.classroom}` : ""}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-semibold text-[#000] dark:text-[#f4f4f5]">{cls.start_time?.slice(0, 5)}</p>
                        <p className="text-[10px] text-[#666] dark:text-[#a1a1aa]">{cls.end_time?.slice(0, 5)}</p>
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
