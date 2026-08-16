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
    <div className="min-h-screen" style={{ background: "var(--sb-surface)" }}>
      <div className="max-w-[800px] mx-auto px-4 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <span
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.8px]"
            style={{ color: "var(--sb-on-surface-variant)", opacity: 0.45 }}
          >
            <span className="w-6 h-px" style={{ background: "var(--sb-outline-variant)" }} />
            Panel Docente
          </span>
          <h1
            className="text-2xl font-semibold mt-2"
            style={{
              color: "var(--sb-on-surface)",
              fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif",
              letterSpacing: "-0.02em"
            }}
          >
            Mis Cursos
          </h1>
          <p
            className="text-sm mt-1"
            style={{
              color: "var(--sb-on-surface-variant)",
              fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
            }}
          >
            Cursos asignados este periodo académico
          </p>
        </motion.header>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-3 gap-2 mb-8"
        >
          {[
            { label: "Cursos", value: loading ? "—" : courses.length, icon: BookOpen },
            { label: "Alumnos", value: loading ? "—" : totalStudents, icon: Users },
            { label: "Promedio", value: loading ? "—" : `${avgStudents}/curso`, icon: Clock },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4"
              style={{
                background: "var(--sb-surface-container)",
                borderRadius: "16px",
                border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)"
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <stat.icon
                  className="h-3.5 w-3.5"
                  style={{ color: "var(--sb-on-surface-variant)" }}
                />
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.8px]"
                  style={{
                    color: "var(--sb-on-surface-variant)",
                    opacity: 0.45,
                    fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                  }}
                >
                  {stat.label}
                </span>
              </div>
              <p
                className="text-xl font-semibold"
                style={{
                  color: "var(--sb-on-surface)",
                  fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Section Label */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-4"
        >
          <span
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.8px]"
            style={{
              color: "var(--sb-on-surface-variant)",
              opacity: 0.45,
              fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
            }}
          >
            <span className="w-6 h-px" style={{ background: "var(--sb-outline-variant)" }} />
            {courses.length} cursos asignados
          </span>
        </motion.div>

        {/* Course List */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="py-4 animate-pulse"
                style={{
                  borderBottom: "1px solid color-mix(in srgb, var(--sb-outline-variant) 25%, transparent)"
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="h-10 w-10 shrink-0"
                    style={{
                      background: "var(--sb-surface-container-high)",
                      borderRadius: "12px"
                    }}
                  />
                  <div className="flex-1 space-y-2">
                    <div
                      className="h-4 w-40"
                      style={{
                        background: "var(--sb-surface-container-high)",
                        borderRadius: "8px"
                      }}
                    />
                    <div
                      className="h-3 w-28"
                      style={{
                        background: "var(--sb-surface-container-high)",
                        borderRadius: "8px"
                      }}
                    />
                  </div>
                  <div
                    className="h-3 w-20"
                    style={{
                      background: "var(--sb-surface-container-high)",
                      borderRadius: "8px"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div
            className="py-16 text-center"
            style={{
              background: "var(--sb-surface-container)",
              borderRadius: "20px",
              border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)"
            }}
          >
            <BookOpen
              className="h-10 w-10 mx-auto mb-3"
              style={{ color: "var(--sb-on-surface-variant)", opacity: 0.3 }}
            />
            <p
              className="text-sm font-medium"
              style={{
                color: "var(--sb-on-surface)",
                fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
              }}
            >
              Sin cursos asignados
            </p>
            <p
              className="text-xs mt-1"
              style={{
                color: "var(--sb-on-surface-variant)",
                opacity: 0.5,
                fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
              }}
            >
              Contacta al administrador para asignar cursos
            </p>
          </div>
        ) : (
          <div
            style={{
              background: "var(--sb-surface-container)",
              borderRadius: "20px",
              border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)",
              overflow: "hidden"
            }}
          >
            {courses.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
              >
                <Link
                  href={`/docente/cursos/${c.id}`}
                  className="group flex items-center gap-4 py-4 px-4"
                  style={{
                    borderBottom: i < courses.length - 1
                      ? "1px solid color-mix(in srgb, var(--sb-outline-variant) 25%, transparent)"
                      : "none",
                    transition: "background 200ms ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--sb-surface-container-high)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent"
                  }}
                >
                  {/* Icon */}
                  <div
                    className="h-10 w-10 flex items-center justify-center shrink-0"
                    style={{
                      background: "var(--sb-surface-container-high)",
                      borderRadius: "12px",
                      transition: "background 200ms ease"
                    }}
                  >
                    <BookOpen
                      className="h-4 w-4"
                      style={{ color: "var(--sb-on-surface-variant)" }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3
                        className="text-sm font-medium"
                        style={{
                          color: "var(--sb-on-surface)",
                          fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif",
                          transition: "transform 300ms cubic-bezier(0.34, 1.45, 0.5, 1)"
                        }}
                      >
                        {c.name}
                      </h3>
                      <ArrowUpRight
                        className="h-3.5 w-3.5"
                        style={{
                          color: "var(--sb-on-surface-variant)",
                          opacity: 0,
                          transition: "opacity 200ms, transform 200ms",
                          transform: "translateX(-4px)"
                        }}
                      />
                    </div>
                    <p
                      className="text-xs mt-0.5"
                      style={{
                        color: "var(--sb-on-surface-variant)",
                        fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                      }}
                    >
                      {c.grade} &quot;{c.section}&quot;
                    </p>
                  </div>

                  {/* Meta */}
                  <div
                    className="flex items-center gap-4 text-xs shrink-0"
                    style={{
                      color: "var(--sb-on-surface-variant)",
                      fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                    }}
                  >
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span style={{ fontWeight: 600 }}>{c.students}</span>
                      <span className="hidden sm:inline">alumnos</span>
                    </span>
                    {c.schedule && (
                      <span className="hidden md:flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span style={{ fontWeight: 600 }}>{c.schedule}</span>
                      </span>
                    )}
                  </div>

                  {/* Arrow */}
                  <ChevronRight
                    className="h-4 w-4 shrink-0"
                    style={{
                      color: "var(--sb-on-surface-variant)",
                      opacity: 0.3,
                      transition: "opacity 200ms"
                    }}
                  />
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
