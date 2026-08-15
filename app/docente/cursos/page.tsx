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
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12 lg:py-16">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 lg:mb-16"
        >
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-4">
            <span className="w-8 h-px bg-foreground/30" />
            Panel Docente
          </span>
          <h1 className="text-4xl lg:text-5xl font-display tracking-tight">
            Mis Cursos
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-xl">
            Cursos asignados este periodo academic
          </p>
        </motion.header>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-3 gap-px bg-foreground/10 rounded-2xl overflow-hidden mb-12 lg:mb-16"
        >
          {[
            { label: "Cursos", value: loading ? "—" : courses.length, icon: BookOpen },
            { label: "Alumnos", value: loading ? "—" : totalStudents, icon: Users },
            { label: "Promedio", value: loading ? "—" : `${avgStudents} alumnos/curso`, icon: Clock },
          ].map((stat) => (
            <div key={stat.label} className="bg-background p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-4">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-mono text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-3xl lg:text-4xl font-display tracking-tight">{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Section Label */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground">
            <span className="w-8 h-px bg-foreground/30" />
            {courses.length} cursos asignados
          </span>
        </motion.div>

        {/* Course List */}
        {loading ? (
          <div className="space-y-px">
            {[1, 2, 3].map(i => (
              <div key={i} className="border-b border-foreground/10 py-6 animate-pulse">
                <div className="flex items-center gap-6">
                  <div className="h-12 w-12 rounded-xl bg-foreground/5" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-48 rounded bg-foreground/5" />
                    <div className="h-4 w-32 rounded bg-foreground/5" />
                  </div>
                  <div className="h-4 w-24 rounded bg-foreground/5" />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="py-20 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Sin cursos asignados</p>
            <p className="text-sm text-muted-foreground/60 mt-2">Contacta al administrador para asignar cursos</p>
          </div>
        ) : (
          <div>
            {courses.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
              >
                <Link
                  href={`/docente/cursos/${c.id}`}
                  className="group flex items-center gap-6 py-6 border-b border-foreground/10 hover:bg-foreground/5 -mx-6 px-6 transition-colors"
                >
                  {/* Icon */}
                  <div className="h-12 w-12 rounded-xl bg-foreground/5 flex items-center justify-center shrink-0 group-hover:bg-foreground/10 transition-colors">
                    <BookOpen className="h-5 w-5 text-foreground/70" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-display tracking-tight group-hover:translate-x-1 transition-transform duration-300">
                        {c.name}
                      </h3>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-all duration-300 -translate-x-2 group-hover:translate-x-0" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {c.grade} &quot;{c.section}&quot;
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-6 text-sm text-muted-foreground shrink-0">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="font-mono">{c.students}</span>
                      <span className="hidden sm:inline">alumnos</span>
                    </span>
                    {c.schedule && (
                      <span className="hidden md:flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono">{c.schedule}</span>
                      </span>
                    )}
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-foreground/60 transition-colors shrink-0" />
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
