"use client"

import * as React from "react"
import { BookOpen, Users, GraduationCap, Clock, Calendar, ArrowUpRight, Plus, ChevronRight } from "@/components/ui/proicons"
import { motion } from "framer-motion"
import Link from "next/link"
import { useAuthStore } from "@/stores/auth-store"

interface Course {
  id: string
  name: string
  grade: string
  section: string
  students: number
}

interface Horario {
  id: string
  id_course?: string
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
  const totalSchedules = horarios.length
  const gradesCount = new Set(courses.map(c => c.grade)).size

  const today = new Date()
  const todayIdx = today.getDay() === 0 ? 7 : today.getDay()
  const todaySchedule = horarios
    .filter(h => h.day_of_week === todayIdx)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  return (
    <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-[#BABABA] dark:bg-[#1a1a1c]">
      <div className="p-6 md:p-8 pb-24 md:pb-8 space-y-4">

        {/* ═══════════════ HEADER ═══════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-2"
        >
          <p className="text-[14px] font-medium mb-1 text-[#666] dark:text-[#a1a1aa]">Panel Docente</p>
          <h1 className="text-[36px] md:text-[48px] font-bold leading-tight text-[#000] dark:text-[#f4f4f5]">
            Mis Cursos
          </h1>
          <p className="text-[13px] mt-2 text-[#666] dark:text-[#a1a1aa]">
            Gestiona tus cursos asignados y revisa la información detallada de cada uno
          </p>
        </motion.div>

        {/* ═══════════════ STATS CARD (todo dentro de la misma card blanca) ═══════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="p-6 rounded-[30px] bg-white dark:bg-[#17171a]"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="p-4 rounded-[20px] bg-[#F5F5F5] dark:bg-[#27272a]">
              <div className="h-9 w-9 mb-3 flex items-center justify-center rounded-[14px] bg-white dark:bg-[#3f3f46]">
                <BookOpen className="h-4 w-4 text-[#000] dark:text-[#f4f4f5]" />
              </div>
              <p className="text-[12px] font-medium mb-1 text-[#666] dark:text-[#a1a1aa]">Cursos</p>
              <p className="text-[24px] font-bold text-[#000] dark:text-[#f4f4f5]">
                {loading ? "—" : courses.length}
              </p>
            </div>
            <div className="p-4 rounded-[20px] bg-[#F5F5F5] dark:bg-[#27272a]">
              <div className="h-9 w-9 mb-3 flex items-center justify-center rounded-[14px] bg-white dark:bg-[#3f3f46]">
                <Users className="h-4 w-4 text-[#000] dark:text-[#f4f4f5]" />
              </div>
              <p className="text-[12px] font-medium mb-1 text-[#666] dark:text-[#a1a1aa]">Alumnos</p>
              <p className="text-[24px] font-bold text-[#000] dark:text-[#f4f4f5]">
                {loading ? "—" : totalStudents}
              </p>
            </div>
            <div className="p-4 rounded-[20px] bg-[#F5F5F5] dark:bg-[#27272a]">
              <div className="h-9 w-9 mb-3 flex items-center justify-center rounded-[14px] bg-white dark:bg-[#3f3f46]">
                <GraduationCap className="h-4 w-4 text-[#000] dark:text-[#f4f4f5]" />
              </div>
              <p className="text-[12px] font-medium mb-1 text-[#666] dark:text-[#a1a1aa]">Grados</p>
              <p className="text-[24px] font-bold text-[#000] dark:text-[#f4f4f5]">
                {loading ? "—" : gradesCount}
              </p>
            </div>
            <div className="p-4 rounded-[20px] bg-[#F5F5F5] dark:bg-[#27272a]">
              <div className="h-9 w-9 mb-3 flex items-center justify-center rounded-[14px] bg-white dark:bg-[#3f3f46]">
                <Clock className="h-4 w-4 text-[#000] dark:text-[#f4f4f5]" />
              </div>
              <p className="text-[12px] font-medium mb-1 text-[#666] dark:text-[#a1a1aa]">Horarios</p>
              <p className="text-[24px] font-bold text-[#000] dark:text-[#f4f4f5]">
                {loading ? "—" : totalSchedules}
              </p>
            </div>
          </div>

          {/* Lista de cursos - mismo fondo blanco, items en gris */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-[16px] font-semibold text-[#000] dark:text-[#f4f4f5]">
              {courses.length} cursos asignados
            </p>
            <span className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-[#F5F5F5] dark:bg-[#27272a] text-[#666] dark:text-[#a1a1aa]">
              Periodo activo
            </span>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-[64px] rounded-[20px] animate-pulse bg-[#F5F5F5] dark:bg-[#27272a]" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen className="h-10 w-10 mx-auto mb-3 text-[#D9D9D9] dark:text-[#3f3f46]" />
              <p className="text-[14px] font-medium text-[#000] dark:text-[#f4f4f5]">Sin cursos asignados</p>
              <p className="text-[12px] mt-1 text-[#999] dark:text-[#71717a]">Contacta al administrador para asignar cursos</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {courses.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * i }}
                >
                  <Link
                    href={`/docente/cursos/${c.id}`}
                    className="group flex items-center gap-4 p-3 rounded-[20px] bg-[#F5F5F5] dark:bg-[#27272a] hover:bg-[#ebebeb] dark:hover:bg-[#333] transition-colors"
                  >
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-[#3f3f46]">
                      <BookOpen className="h-5 w-5 text-[#666] dark:text-[#a1a1aa]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-medium text-[#000] dark:text-[#f4f4f5] truncate">{c.name}</h3>
                      <p className="text-[12px] text-[#666] dark:text-[#a1a1aa]">
                        {c.grade} &quot;{c.section}&quot; · {avgStudents > 0 ? `${avgStudents} alumnos prom.` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="hidden sm:inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1 rounded-full bg-white dark:bg-[#3f3f46] text-[#666] dark:text-[#a1a1aa]">
                        <Users className="h-3 w-3" />
                        {c.students}
                      </span>
                      <ChevronRight className="h-4 w-4 text-[#666] dark:text-[#a1a1aa] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ═══════════════ BOTTOM GRID (igual al dashboard) ═══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-4">

          {/* ──── LEFT: Resumen + Acciones ──── */}
          <div className="flex flex-col gap-4">

            {/* Resumen */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="p-6 rounded-[30px] bg-white dark:bg-[#17171a]"
            >
              <p className="text-[16px] font-semibold mb-5 text-[#000] dark:text-[#f4f4f5]">Resumen</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#666] dark:text-[#a1a1aa]">Total cursos</span>
                  <span className="text-[14px] font-semibold text-[#000] dark:text-[#f4f4f5]">
                    {loading ? "—" : courses.length}
                  </span>
                </div>
                <div className="h-px bg-[#F5F5F5] dark:bg-[#27272a]" />
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#666] dark:text-[#a1a1aa]">Total alumnos</span>
                  <span className="text-[14px] font-semibold text-[#000] dark:text-[#f4f4f5]">
                    {loading ? "—" : totalStudents}
                  </span>
                </div>
                <div className="h-px bg-[#F5F5F5] dark:bg-[#27272a]" />
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#666] dark:text-[#a1a1aa]">Promedio por curso</span>
                  <span className="text-[14px] font-semibold text-[#000] dark:text-[#f4f4f5]">
                    {loading ? "—" : `${avgStudents} alumnos`}
                  </span>
                </div>
                <div className="h-px bg-[#F5F5F5] dark:bg-[#27272a]" />
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#666] dark:text-[#a1a1aa]">Grados diferentes</span>
                  <span className="text-[14px] font-semibold text-[#000] dark:text-[#f4f4f5]">
                    {loading ? "—" : gradesCount}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Acciones rápidas */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="p-6 rounded-[30px] bg-white dark:bg-[#17171a]"
            >
              <p className="text-[16px] font-semibold mb-4 text-[#000] dark:text-[#f4f4f5]">Acciones rápidas</p>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/docente/asistencia" className="flex flex-col items-start gap-2 p-4 rounded-[20px] bg-[#F5F5F5] dark:bg-[#27272a] hover:bg-[#ebebeb] dark:hover:bg-[#333] transition-colors">
                  <Calendar className="h-4 w-4 text-[#000] dark:text-[#f4f4f5]" />
                  <span className="text-[12px] font-medium text-[#000] dark:text-[#f4f4f5]">Asistencia</span>
                </Link>
                <Link href="/docente/calificaciones" className="flex flex-col items-start gap-2 p-4 rounded-[20px] bg-[#F5F5F5] dark:bg-[#27272a] hover:bg-[#ebebeb] dark:hover:bg-[#333] transition-colors">
                  <GraduationCap className="h-4 w-4 text-[#000] dark:text-[#f4f4f5]" />
                  <span className="text-[12px] font-medium text-[#000] dark:text-[#f4f4f5]">Notas</span>
                </Link>
                <Link href="/docente/tareas" className="flex flex-col items-start gap-2 p-4 rounded-[20px] bg-[#F5F5F5] dark:bg-[#27272a] hover:bg-[#ebebeb] dark:hover:bg-[#333] transition-colors">
                  <Plus className="h-4 w-4 text-[#000] dark:text-[#f4f4f5]" />
                  <span className="text-[12px] font-medium text-[#000] dark:text-[#f4f4f5]">Tareas</span>
                </Link>
                <Link href="/docente/materiales" className="flex flex-col items-start gap-2 p-4 rounded-[20px] bg-[#F5F5F5] dark:bg-[#27272a] hover:bg-[#ebebeb] dark:hover:bg-[#333] transition-colors">
                  <BookOpen className="h-4 w-4 text-[#000] dark:text-[#f4f4f5]" />
                  <span className="text-[12px] font-medium text-[#000] dark:text-[#f4f4f5]">Materiales</span>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* ──── RIGHT: Horario de hoy ──── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="p-6 rounded-[30px] bg-white dark:bg-[#17171a]"
          >
            <div className="flex items-center justify-between mb-5">
              <p className="text-[16px] font-semibold text-[#000] dark:text-[#f4f4f5]">Horario de hoy</p>
              <Link href="/docente/horarios" className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full bg-[#F5F5F5] dark:bg-[#27272a] text-[#666] dark:text-[#a1a1aa]">
                Ver todos <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-[64px] rounded-[20px] animate-pulse bg-[#F5F5F5] dark:bg-[#27272a]" />
                ))}
              </div>
            ) : todaySchedule.length === 0 ? (
              <div className="py-12 text-center">
                <Clock className="h-10 w-10 mx-auto mb-3 text-[#D9D9D9] dark:text-[#3f3f46]" />
                <p className="text-[14px] font-medium text-[#000] dark:text-[#f4f4f5]">Sin clases hoy</p>
                <p className="text-[12px] mt-1 text-[#999] dark:text-[#71717a]">No tienes clases programadas para hoy</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {todaySchedule.map((cls) => (
                  <div key={cls.id} className="flex items-center gap-4 p-4 rounded-[20px] bg-[#F5F5F5] dark:bg-[#27272a]">
                    <div className="h-11 w-11 flex items-center justify-center rounded-full bg-white dark:bg-[#3f3f46]">
                      <BookOpen className="h-5 w-5 text-[#666] dark:text-[#a1a1aa]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium truncate text-[#000] dark:text-[#f4f4f5]">{cls.course_name}</p>
                      <p className="text-[12px] text-[#666] dark:text-[#a1a1aa]">
                        {cls.grade} &quot;{cls.section}&quot;{cls.classroom ? ` · ${cls.classroom}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[14px] font-semibold text-[#000] dark:text-[#f4f4f5]">{cls.start_time}</p>
                      <p className="text-[12px] text-[#666] dark:text-[#a1a1aa]">{cls.end_time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  )
}
