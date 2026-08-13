"use client"

import * as React from "react"
import { BookOpen, Users, Clock, ChevronRight } from "@/components/ui/proicons"
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

function NoteIconChip({ icon: Icon, className }: { icon: React.ComponentType<{ className?: string }>; className?: string }) {
  return (
    <div className={`h-10 w-10 rounded-[12px] bg-[var(--note-fill)] flex items-center justify-center shrink-0 ${className || ""}`}>
      <Icon className="h-5 w-5 text-[var(--note-text)]" />
    </div>
  )
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

  const metrics = [
    { label: "Total Cursos", value: loading ? "—" : courses.length, icon: BookOpen },
    { label: "Total Alumnos", value: loading ? "—" : courses.reduce((a, c) => a + (c.students || 0), 0), icon: Users },
    { label: "Promedio x Curso", value: loading ? "—" : courses.length > 0 ? Math.round(courses.reduce((a, c) => a + (c.students || 0), 0) / courses.length) : 0, icon: Clock },
  ]

  return (
    <div className="sb-note">
      <div className="mx-auto w-full max-w-[1034px] px-2 pb-4 space-y-5">
        {/* Header */}
        <header className="pt-2">
          <h1 className="text-[26px] sm:text-[30px] leading-tight tracking-[-0.03em] text-[var(--note-text)]">Mis Cursos</h1>
          <p className="mt-1 text-sm text-[var(--note-muted)]">Cursos asignados este periodo</p>
        </header>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3">
          {metrics.map((m) => {
            const Icon = m.icon
            return (
              <div key={m.label} className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] p-6">
                <NoteIconChip icon={Icon} />
                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--note-muted)]">{m.label}</p>
                <p className="mt-1.5 text-[22px] font-bold leading-none tracking-tight text-[var(--note-text)]">{m.value}</p>
              </div>
            )
          })}
        </div>

        {/* Course list */}
        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-[12px] bg-[var(--note-fill-strong)]" />
                  <div className="space-y-2">
                    <div className="h-4 w-40 rounded bg-[var(--note-fill-strong)]" />
                    <div className="h-3 w-24 rounded bg-[var(--note-fill-strong)]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] py-12 text-center">
            <BookOpen className="h-10 w-10 text-[var(--note-muted)]/40 mx-auto mb-3" />
            <p className="text-sm text-[var(--note-muted)]">Sin cursos asignados</p>
          </div>
        ) : (
          <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.04 } } }} className="space-y-2.5">
            {courses.map((c) => (
              <motion.div key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}>
                <Link href={`/docente/cursos/${c.id}`} className="group block">
                  <div className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] p-4 transition-all duration-150 group-hover:-translate-y-px group-hover:opacity-90 group-hover:border-[var(--note-hairline-strong)]">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-[12px] bg-[var(--note-fill-strong)] flex items-center justify-center shrink-0">
                        <BookOpen className="h-5 w-5 text-[var(--note-text)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--note-text)] truncate">{c.name}</p>
                        <p className="text-[11px] text-[var(--note-muted)]">{c.grade} · Sección {c.section}</p>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-[var(--note-muted)] shrink-0">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" /> {c.students} alumnos
                        </span>
                        {c.schedule && (
                          <span className="hidden sm:flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" /> {c.schedule}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-[var(--note-muted)]/40 group-hover:text-[var(--note-text)] transition-colors shrink-0" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}