"use client"

import * as React from "react"
import { BookOpen, GraduationCap, Calendar, Clock, type LucideIcon } from "@/components/ui/proicons"

interface StatItem {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
}

interface TeacherStatsProps {
  courses: number
  totalStudents: number
  classesToday: number
  hoursToday: number
  loading?: boolean
}

export function TeacherStats({
  courses,
  totalStudents,
  classesToday,
  hoursToday,
  loading,
}: TeacherStatsProps) {
  const stats: StatItem[] = [
    { label: "Mis cursos", value: loading ? "—" : courses, icon: BookOpen },
    { label: "Total alumnos", value: loading ? "—" : totalStudents, icon: GraduationCap },
    { label: "Clases hoy", value: loading ? "—" : classesToday, icon: Calendar },
    {
      label: "Horas hoy",
      value: loading ? "—" : `${hoursToday} ${hoursToday === 1 ? "hr" : "hrs"}`,
      icon: Clock,
    },
  ]

  return (
    <section className="td-stats-grid" aria-label="Estadísticas del docente">
      {stats.map((s) => {
        const Icon = s.icon
        return (
          <div key={s.label} className="td-stat-card">
            <div className="td-stat-icon" aria-hidden="true">
              <Icon className="td-stat-icon-svg" />
            </div>
            <p className="td-stat-label">{s.label}</p>
            <p className="td-stat-value">{s.value}</p>
          </div>
        )
      })}
    </section>
  )
}

export default TeacherStats
