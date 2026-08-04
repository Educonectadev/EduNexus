"use client"

import * as React from "react"
import { BookOpen, Users, Clock, ChevronRight } from "lucide-react"
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

const staggerItem = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }
const listItem = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0 },
}

function getAvatarColor(name: string) {
  const colors = ["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-amber-500", "bg-pink-500", "bg-cyan-500", "bg-rose-500"]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
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

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Mis Cursos</h1>
        <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">Cursos asignados este periodo</p>
      </motion.div>

      {/* Stats */}
      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Cursos", value: courses.length, color: "text-sb-on-surface", bg: "bg-sb-on-surface/8" },
          { label: "Total Alumnos", value: courses.reduce((a, c) => a + (c.students || 0), 0), color: "text-blue-600", bg: "bg-blue-500/8" },
          { label: "Promedio x Curso", value: courses.length > 0 ? Math.round(courses.reduce((a, c) => a + (c.students || 0), 0) / courses.length) : 0, color: "text-emerald-600", bg: "bg-emerald-500/8" },
        ].map(s => (
          <motion.div key={s.label} variants={staggerItem} className="bg-sb-surface rounded-md p-4">
            <div className={`h-9 w-9 rounded-md flex items-center justify-center mb-3 ${s.bg}`}>
              <BookOpen className={`h-4.5 w-4.5 ${s.color}`} />
            </div>
            <p className="text-xl font-bold tracking-tight text-sb-on-surface">{s.value}</p>
            <p className="text-[11px] text-sb-on-surface-variant/45 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Course list */}
      <div className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="bg-sb-surface rounded-md p-5 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-md bg-sb-surface-container" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 rounded bg-sb-surface-container" />
                    <div className="h-3 w-20 rounded bg-sb-surface-container" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-sb-surface rounded-md py-12 text-center">
            <BookOpen className="h-10 w-10 text-sb-on-surface-variant/15 mx-auto mb-3" />
            <p className="text-sm text-sb-on-surface-variant/30">Sin cursos asignados</p>
          </div>
        ) : (
          <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.04 } } }} className="space-y-2">
            {courses.map((c) => (
              <Link key={c.id} href={`/docente/cursos/${c.id}`} className="block">
                <motion.div variants={listItem}
                  className="bg-sb-surface rounded-md p-5 hover:bg-sb-surface-container-low/50 transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-md ${getAvatarColor(c.name)} flex items-center justify-center shrink-0`}>
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-sb-on-surface">{c.name}</p>
                        <p className="text-xs text-sb-on-surface-variant/50">{c.grade} - Seccion {c.section}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-sb-on-surface-variant/20 mt-1 group-hover:text-sb-on-surface-variant/40 transition-colors" />
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-sb-on-surface-variant/45">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>{c.students} alumnos</span>
                    </div>
                    {c.schedule && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{c.schedule}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </Link>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
