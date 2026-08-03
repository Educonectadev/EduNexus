"use client"

import * as React from "react"
import { MobileNavbar } from "@/components/ui/mobile-navbar"
import { LayoutDashboard, BookOpen, UserCheck, GraduationCap, CreditCard, Calendar, Settings } from "lucide-react"

export default function NavbarTestPage() {
  return (
    <div className="min-h-screen bg-sb-background p-6">
      <h1 className="text-lg font-semibold text-sb-on-surface mb-4">Test navbar móvil</h1>
      <p className="text-sm text-sb-on-surface-variant mb-10">
        Abre DevTools en modo móvil (&lt;768px) y pulsa el botón ⋯ de la derecha.
      </p>
      <MobileNavbar
        role="docente"
        activeHref="/docente/dashboard"
        items={[
          { title: "Dashboard", href: "/docente/dashboard", icon: LayoutDashboard },
          { title: "Cursos", href: "/docente/cursos", icon: BookOpen },
          { title: "Asistencia", href: "/docente/asistencia", icon: UserCheck },
          { title: "Notas", href: "/docente/calificaciones", icon: GraduationCap },
          { title: "Tareas", href: "/docente/tareas", icon: CreditCard },
          { title: "Materiales", href: "/docente/materiales", icon: Calendar },
          { title: "Calendario", href: "/docente/calendario", icon: Settings },
        ]}
      />
    </div>
  )
}
