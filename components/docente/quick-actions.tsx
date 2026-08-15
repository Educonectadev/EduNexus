"use client"

import * as React from "react"
import Link from "next/link"
import {
  UserCheck,
  BookMarked,
  ClipboardList,
  FileText,
  Calendar,
  ChevronRight,
  type LucideIcon,
} from "@/components/ui/proicons"

interface QuickAction {
  label: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
  href: string
}

const actions: QuickAction[] = [
  {
    label: "Tomar asistencia",
    desc: "Registra la asistencia de tus alumnos",
    icon: UserCheck,
    href: "/docente/asistencia",
  },
  {
    label: "Ver notas",
    desc: "Revisa calificaciones por curso",
    icon: BookMarked,
    href: "/docente/calificaciones",
  },
  {
    label: "Crear tarea",
    desc: "Asigna una nueva tarea a tus cursos",
    icon: ClipboardList,
    href: "/docente/tareas",
  },
  {
    label: "Ver tareas",
    desc: "Lista de tareas asignadas",
    icon: ClipboardList,
    href: "/docente/tareas",
  },
  {
    label: "Ver materiales",
    desc: "Recursos y documentos",
    icon: FileText,
    href: "/docente/materiales",
  },
  {
    label: "Ver calendario",
    desc: "Eventos y fechas importantes",
    icon: Calendar,
    href: "/docente/calendario",
  },
]

export function QuickActions() {
  return (
    <section className="td-card" aria-label="Acciones rápidas">
      <header className="td-card-head">
        <div className="td-card-title-wrap">
          <UserCheck className="td-card-title-icon" />
          <h3 className="td-card-title">Acciones rápidas</h3>
        </div>
      </header>

      <div className="td-actions-grid">
        {actions.map((a) => {
          const Icon = a.icon
          return (
            <Link key={a.label + a.href} href={a.href} className="td-action">
              <div className="td-action-icon" aria-hidden="true">
                <Icon className="td-action-icon-svg" />
              </div>
              <div className="td-action-body">
                <p className="td-action-label">{a.label}</p>
                <p className="td-action-desc">{a.desc}</p>
              </div>
              <ChevronRight className="td-action-chevron" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default QuickActions
