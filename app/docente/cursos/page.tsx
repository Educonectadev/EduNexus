"use client"

import * as React from "react"
import { BookOpen, Users, Clock, ChevronRight, ArrowUpRight } from "@/components/ui/proicons"
import { motion } from "framer-motion"
import Link from "next/link"

interface Course {
  id: string
  name: string
  grade: string
  section: string
  students: number
  schedule: string
  next_class: string
}

export default function CursosPage() {
  const [courses, setCourses] = React.useState<Course[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/docente/cursos")
      .then(r => r.json())
      .then(setCourses)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalStudents = courses.reduce((a, c) => a + (c.students || 0), 0)
  const avgStudents = courses.length > 0 ? Math.round(totalStudents / courses.length) : 0

  return (
    <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-[#BABABA] dark:bg-[#1a1a1c]">
      <div className="p-6 md:p-8 pb-24 md:pb-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <p className="text-[14px] font-medium mb-1 text-[#666] dark:text-[#a1a1aa]">Panel Docente</p>
          <h1 className="text-[36px] md:text-[48px] font-bold leading-tight text-[#000] dark:text-[#f4f4f5]">
            Mis Cursos
          </h1>
          <p className="text-[13px] mt-2 text-[#666] dark:text-[#a1a1aa]">
            Cursos asignados este periodo académico
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <div className="p-5 rounded-[30px] bg-white dark:bg-[#17171a]">
            <p className="text-[12px] font-medium mb-3 text-[#666] dark:text-[#a1a1aa]">Cursos</p>
            <p className="text-[32px] font-bold text-[#000] dark:text-[#f4f4f5]">
              {loading ? "—" : courses.length}
            </p>
          </div>
          <div className="p-5 rounded-[30px] bg-white dark:bg-[#17171a]">
            <p className="text-[12px] font-medium mb-3 text-[#666] dark:text-[#a1a1aa]">Alumnos</p>
            <p className="text-[32px] font-bold text-[#000] dark:text-[#f4f4f5]">
              {loading ? "—" : totalStudents}
            </p>
          </div>
          <div className="p-5 rounded-[30px] bg-white dark:bg-[#17171a]">
            <p className="text-[12px] font-medium mb-3 text-[#666] dark:text-[#a1a1aa]">Promedio</p>
            <p className="text-[32px] font-bold text-[#000] dark:text-[#f4f4f5]">
              {loading ? "—" : `${avgStudents}/curso`}
            </p>
          </div>
        </motion.div>

        {/* Course List */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="p-6 rounded-[30px] bg-white dark:bg-[#17171a]"
        >
          <p className="text-[16px] font-semibold mb-5 text-[#000] dark:text-[#f4f4f5]">
            {courses.length} cursos asignados
          </p>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 rounded-[20px] animate-pulse bg-[#D9D9D9] dark:bg-[#27272a]" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen className="h-10 w-10 mx-auto mb-3 text-[#D9D9D9] dark:text-[#3f3f46]" />
              <p className="text-[14px] font-medium text-[#000] dark:text-[#f4f4f5]">Sin cursos asignados</p>
              <p className="text-[12px] mt-1 text-[#999] dark:text-[#71717a]">Contacta al administrador para asignar cursos</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {courses.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
                >
                  <Link
                    href={`/docente/cursos/${c.id}`}
                    className="group flex items-center gap-4 p-4 rounded-[20px] bg-[#D9D9D9] dark:bg-[#27272a] hover:bg-[#c9c9c9] dark:hover:bg-[#333] transition-colors"
                  >
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-[#3f3f46]">
                      <BookOpen className="h-5 w-5 text-[#666] dark:text-[#a1a1aa]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-medium text-[#000] dark:text-[#f4f4f5]">{c.name}</h3>
                      <p className="text-[12px] text-[#666] dark:text-[#a1a1aa]">{c.grade} &quot;{c.section}&quot;</p>
                    </div>
                    <div className="flex items-center gap-4 text-[12px] text-[#666] dark:text-[#a1a1aa] shrink-0">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <span className="font-semibold">{c.students}</span>
                        <span className="hidden sm:inline">alumnos</span>
                      </span>
                      {c.schedule && (
                        <span className="hidden md:flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="font-semibold">{c.schedule}</span>
                        </span>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#666] dark:text-[#a1a1aa] shrink-0" />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
