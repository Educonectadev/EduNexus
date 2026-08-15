"use client"

import * as React from "react"
import { useAuthStore } from "@/stores/auth-store"
import { Bell, Calendar, Settings, ChevronDown, User } from "@/components/ui/proicons"
import { cn } from "@/lib/utils"

interface TeacherHeaderProps {
  title?: string
}

export function TeacherHeader({ title = "Inicio" }: TeacherHeaderProps = {}) {
  const user = useAuthStore((s) => s.user)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches"
  const teacherName = user?.full_name || "Docente"
  const dateStr = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const initials = React.useMemo(() => {
    return teacherName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }, [teacherName])

  return (
    <header className="td-header">
      <div className="td-header-top">
        <h1 className="td-title">{title}</h1>

        <div className="td-header-actions">
          <button
            type="button"
            className="td-icon-btn"
            aria-label="Notificaciones"
            title="Notificaciones"
          >
            <Bell className="td-icon-btn-svg" />
          </button>
          <button
            type="button"
            className="td-icon-btn"
            aria-label="Configuración"
            title="Configuración"
          >
            <Settings className="td-icon-btn-svg" />
          </button>
          <div className="td-user">
            <div className="td-avatar" aria-hidden="true">
              <User className="h-4 w-4 text-black" />
              <span className="sr-only">{teacherName}</span>
            </div>
            <span className="sr-only">Docente</span>
          </div>
        </div>
      </div>

      <div className="td-greeting-wrap">
        <div>
          <h2 className="td-greeting">
            {greeting}, <span className="td-greeting-name">{teacherName}</span>
          </h2>
          <div className="td-date-row">
            <Calendar className="td-date-icon" />
            <span className="td-date">{dateStr}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default TeacherHeader