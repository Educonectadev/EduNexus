"use client"

import * as React from "react"
import { useAuthStore } from "@/stores/auth-store"
import { Calendar, Bell, Settings, ChevronDown } from "@/components/ui/proicons"
import { cn } from "@/lib/utils"

interface TeacherHeaderProps {
  title?: string
  greeting: string
  teacherName: string
  dateStr: string
}

export function TeacherHeader({ title = "Inicio", greeting, teacherName, dateStr }: TeacherHeaderProps) {
  const user = useAuthStore((s) => s.user)
  const initials = React.useMemo(() => {
    const name = teacherName || user?.full_name || "Docente"
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }, [teacherName, user])

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
            <div className="td-avatar" aria-hidden="true">{initials}</div>
            <div className="td-user-info">
              <span className="td-user-name">{teacherName}</span>
              <span className="td-user-role">Docente</span>
            </div>
            <ChevronDown className="td-user-chevron" />
          </div>
        </div>
      </div>

      <div className="td-greeting-wrap">
        <div>
          <h2 className="td-greeting">
            {greeting}, <span className="td-greeting-name">{teacherName?.split(" ")[0] || "Docente"}</span>
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
