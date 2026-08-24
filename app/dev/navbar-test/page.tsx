"use client"

import * as React from "react"
import { MobileNavbar } from "@/components/ui/mobile-navbar"
import { LayoutDashboard, BookOpen, UserCheck, GraduationCap, CreditCard, Calendar, Settings, Terminal, Shield } from "@/components/ui/proicons"

export default function NavbarTestPage() {
  return (
    <div className="w-full space-y-6 py-2 md:py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-[22px] md:text-[24px] font-bold tracking-tight text-sb-on-surface">
            Test navbar móvil
          </h2>
          <p className="text-[13px] text-sb-on-surface/70 mt-1">
            Abre DevTools en modo móvil (&lt;768px) y pulsa un botón de sección.
          </p>
        </div>
      </div>
      <MobileNavbar
        role="docente"
        activeHref="/docente/dashboard"
        groups={[
          {
            title: "Académico",
            icon: GraduationCap,
            items: [
              { title: "Dashboard", href: "/docente/dashboard", icon: LayoutDashboard },
              { title: "Cursos", href: "/docente/cursos", icon: BookOpen },
              { title: "Asistencia", href: "/docente/asistencia", icon: UserCheck },
              { title: "Notas", href: "/docente/calificaciones", icon: GraduationCap },
            ],
          },
          {
            title: "Herramientas",
            icon: Terminal,
            items: [
              { title: "Tareas", href: "/docente/tareas", icon: CreditCard },
              { title: "Materiales", href: "/docente/materiales", icon: Calendar },
              { title: "Calendario", href: "/docente/calendario", icon: Settings },
            ],
          },
          {
            title: "Sistema",
            icon: Shield,
            items: [
              { title: "Mensajes", href: "/docente/mensajes", icon: Calendar },
              { title: "Horarios", href: "/docente/horarios", icon: Calendar },
              { title: "Reuniones", href: "/docente/reuniones", icon: Calendar },
            ],
          },
        ]}
      />
    </div>
  )
}
