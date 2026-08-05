"use client"

import * as React from "react"
import Link from "next/link"
import { Building2, Users, Database, Terminal, ChevronRight, Server, CreditCard, GraduationCap, Shield, Settings } from "lucide-react"

interface Stats {
  institutions: number
  users: number
  students: number
  tables: number
}

export default function DevDashboard() {
  const [stats, setStats] = React.useState<Stats>({ institutions: 0, users: 0, students: 0, tables: 0 })
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/dev/stats")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d) })
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: "Instituciones", value: stats.institutions, icon: Building2, color: "text-blue-500" },
    { label: "Usuarios", value: stats.users, icon: Users, color: "text-emerald-500" },
    { label: "Estudiantes", value: stats.students, icon: GraduationCap, color: "text-purple-500" },
    { label: "Tablas", value: stats.tables, icon: Database, color: "text-amber-500" },
  ]

  const actions = [
    { label: "Instituciones", desc: "Crear y gestionar colegios", href: "/dev/instituciones", icon: Building2 },
    { label: "Usuarios", desc: "Administrar cuentas y roles", href: "/dev/usuarios", icon: Users },
    { label: "Planes", desc: "Planes de suscripción", href: "/dev/planes", icon: CreditCard },
    { label: "Database", desc: "Ejecutar SQL directo", href: "/dev/database", icon: Terminal },
    { label: "Seguimiento", desc: "Monitoreo y actividad", href: "/dev/seguimiento", icon: Shield },
    { label: "Configuración", desc: "Ajustes del sistema", href: "/dev/config", icon: Settings },
  ]

  return (
    <div className="w-full space-y-6 py-1">
      <h2 className="text-lg font-semibold text-sb-on-surface tracking-tight">Overview</h2>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-sb-surface rounded-xl p-3 border border-sb-outline-variant/10 sm:p-4"
          >
            <stat.icon className={`h-4 w-4 ${stat.color} mb-2`} />
            <p className="text-xl font-bold text-sb-on-surface sm:text-2xl">
              {loading ? "—" : stat.value.toLocaleString()}
            </p>
            <p className="text-[11px] text-sb-on-surface/50 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2">Acciones</p>
          <div className="bg-sb-surface rounded-xl border border-sb-outline-variant/10 divide-y divide-sb-outline-variant/8">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-3 hover:bg-sb-surface-container-low/40 transition-colors group"
              >
                <div className="h-8 w-8 rounded-lg bg-sb-surface-container-high flex items-center justify-center shrink-0 group-hover:bg-sb-primary/10 transition-colors">
                  <action.icon className="h-4 w-4 text-sb-on-surface/40 group-hover:text-sb-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-sb-on-surface/80">{action.label}</p>
                  <p className="text-[11px] text-sb-on-surface/40 truncate">{action.desc}</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-sb-on-surface/20 shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2">Estado</p>
          <div className="bg-sb-surface rounded-xl border border-sb-outline-variant/10 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-500" />
                <span className="text-[12px] text-sb-on-surface/70">PostgreSQL</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">Online</span>
            </div>
            <div className="space-y-2">
              {[
                { label: "DB", value: "postgres" },
                { label: "Host", value: "Supabase" },
                { label: "Pool", value: "50" },
                { label: "Entorno", value: "dev" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-[11px] text-sb-on-surface/40">{item.label}</span>
                  <span className="text-[11px] font-mono text-sb-on-surface/60">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-sb-outline-variant/10 space-y-1.5">
              <p className="text-[10px] font-semibold text-sb-on-surface/30 uppercase tracking-wider">Stack</p>
              <div className="space-y-1">
                {[
                  { label: "Framework", value: "Next.js 16" },
                  { label: "UI", value: "Tailwind + MD3" },
                  { label: "Auth", value: "JWT" },
                  { label: "Version", value: "v1.1.1" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-[10px] text-sb-on-surface/35">{item.label}</span>
                    <span className="text-[10px] font-mono text-sb-on-surface/50">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
