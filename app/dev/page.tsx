"use client"

import * as React from "react"
import Link from "next/link"
import { Building2, Users, Database, Terminal, ChevronRight, Server, CreditCard, GraduationCap, Shield, Settings, Handshake, AlertTriangle, Activity } from "@/components/ui/proicons"
import { cn } from "@/lib/utils"

interface Stats {
  institutions: number
  users: number
  students: number
  tables: number
}

interface TrialRequest {
  id: string
  institution_name: string
  full_name: string
  email: string
  phone: string
  message: string
  status: string
  created_at: string
}

export default function DevDashboard() {
  const [stats, setStats] = React.useState<Stats>({ institutions: 0, users: 0, students: 0, tables: 0 })
  const [loading, setLoading] = React.useState(true)
  const [requests, setRequests] = React.useState<TrialRequest[]>([])

  React.useEffect(() => {
    fetch("/api/dev/stats")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d) })
      .finally(() => setLoading(false))

    fetch("/api/dev/trial-requests")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setRequests(d.requests || []) })
      .catch(() => {})
  }, [])

  const statCards = [
    { label: "Instituciones", value: stats.institutions, icon: Building2, color: "text-blue-500" },
    { label: "Usuarios", value: stats.users, icon: Users, color: "text-emerald-500" },
    { label: "Estudiantes", value: stats.students, icon: GraduationCap, color: "text-purple-500" },
    { label: "Tablas", value: stats.tables, icon: Database, color: "text-amber-500" },
  ]

  const actionGroups = [
    {
      title: "Gestión",
      icon: Building2,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      items: [
        { label: "Instituciones", desc: "Crear y gestionar colegios", href: "/dev/instituciones", icon: Building2 },
        { label: "Usuarios", desc: "Cuentas y roles", href: "/dev/usuarios", icon: Users },
        { label: "Planes", desc: "Suscripciones", href: "/dev/planes", icon: CreditCard },
        { label: "Facturación", desc: "Pagos y cobros", href: "/dev/facturacion", icon: CreditCard },
        { label: "Reportes", desc: "Estadísticas", href: "/dev/reportes", icon: BarChart3 },
        { label: "Solicitudes", desc: "Demo y contratación", href: "/dev/demo", icon: Inbox },
      ],
    },
    {
      title: "Base de Datos",
      icon: Database,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      items: [
        { label: "Anomalías", desc: "Constitución y errores", href: "/dev/anomalias", icon: AlertTriangle },
        { label: "Base de Datos", desc: "Conexión y tablas", href: "/dev/basedatos", icon: Database },
        { label: "Esquema BD", desc: "Diagrama ER", href: "/dev/esquema", icon: Database },
        { label: "SQL Console", desc: "Ejecutar SQL", href: "/dev/database", icon: Terminal },
        { label: "Seed", desc: "Datos de prueba", href: "/dev/seed", icon: Terminal },
      ],
    },
    {
      title: "Monitoreo",
      icon: Activity,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      items: [
        { label: "Seguimiento", desc: "Actividad del sistema", href: "/dev/seguimiento", icon: Activity },
        { label: "Contraseñas", desc: "Gestión de accesos", href: "/dev/contrasenas", icon: Key },
        { label: "Audit", desc: "Logs de auditoría", href: "/dev/audit", icon: Shield },
        { label: "Backups", desc: "Copias de seguridad", href: "/dev/backups", icon: Database },
        { label: "Configuración", desc: "Ajustes del sistema", href: "/dev/config", icon: Settings },
      ],
    },
  ]

  return (
    <div className="w-full space-y-6 py-2 md:py-4">
      <div>
        <h2 className="text-[22px] md:text-[24px] font-bold tracking-tight text-sb-on-surface">Overview</h2>
        <p className="text-[13px] text-sb-on-surface/70 mt-1">Resumen del sistema Educonecta</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-sb-surface rounded-2xl p-4 border border-sb-outline-variant/10"
          >
            <div className="w-10 h-10 rounded-xl bg-sb-surface-container flex items-center justify-center mb-3">
              <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
            </div>
            <p className="text-xl font-bold text-sb-on-surface sm:text-2xl">
              {loading ? "—" : stat.value.toLocaleString()}
            </p>
            <p className="text-[12px] text-sb-on-surface/70 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-[11px] font-semibold text-sb-on-surface/60 uppercase tracking-wider mb-3">Acciones</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {actionGroups.map((group) => (
            <div key={group.title} className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-sb-outline-variant/8">
                <div className={`h-8 w-8 rounded-lg ${group.bg} flex items-center justify-center`}>
                  <group.icon className={`h-4 w-4 ${group.color}`} />
                </div>
                <span className="text-[13px] font-semibold text-sb-on-surface">{group.title}</span>
                <span className="ml-auto text-[10px] text-sb-on-surface/40 bg-sb-surface-container px-1.5 py-0.5 rounded-full">{group.items.length}</span>
              </div>
              <div className="divide-y divide-sb-outline-variant/6">
                {group.items.map((action) => (
                  <Link key={action.href} href={action.href}
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-sb-surface-container-low/50 transition-colors group">
                    <action.icon className="h-3.5 w-3.5 text-sb-on-surface/40 group-hover:text-sb-on-surface/70 transition-colors shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-sb-on-surface truncate">{action.label}</p>
                    </div>
                    <ChevronRight className="h-3 w-3 text-sb-on-surface/30 shrink-0 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div>
          <p className="text-[11px] font-semibold text-sb-on-surface/60 uppercase tracking-wider mb-2">Solicitudes de contratación</p>
          <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-4 space-y-3">
            {requests.length === 0 ? (
              <p className="text-[12px] text-sb-on-surface/60">Sin solicitudes pendientes.</p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Handshake className="h-4 w-4 text-amber-500" />
                  <span className="text-[13px] text-sb-on-surface font-medium">
                    {requests.filter(r => r.status === 'pending').length} pendiente(s)
                  </span>
                </div>
                <div className="divide-y divide-sb-outline-variant/8 max-h-64 overflow-auto">
                  {requests.map(r => (
                    <div key={r.id} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-medium text-sb-on-surface truncate">{r.institution_name || r.full_name || 'Instituto'}</p>
                        <span className={cn(
                          "shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full",
                          r.status === 'pending' ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"
                        )}>{r.status}</span>
                      </div>
                      {r.email && <p className="text-[11px] text-sb-on-surface/60 truncate">{r.full_name} · {r.email}</p>}
                      {r.message && <p className="text-[11px] text-sb-on-surface/50 mt-0.5 line-clamp-2">{r.message}</p>}
                      <p className="text-[10px] text-sb-on-surface/40 mt-1">{new Date(r.created_at).toLocaleString('es-PE')}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-sb-on-surface/60 uppercase tracking-wider mb-2">Estado</p>
          <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-500" />
                <span className="text-[13px] text-sb-on-surface">PostgreSQL</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full">Online</span>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "DB", value: "postgres" },
                { label: "Host", value: "Supabase" },
                { label: "Pool", value: "50" },
                { label: "Entorno", value: "dev" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-[12px] text-sb-on-surface/70">{item.label}</span>
                  <span className="text-[12px] font-mono text-sb-on-surface">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-sb-outline-variant/10 space-y-2.5">
              <p className="text-[11px] font-semibold text-sb-on-surface/60 uppercase tracking-wider">Stack</p>
              <div className="space-y-2">
                {[
                  { label: "Framework", value: "Next.js 16" },
                  { label: "UI", value: "Tailwind + MD3" },
                  { label: "Auth", value: "JWT" },
                  { label: "Version", value: "v1.1.1" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-[12px] text-sb-on-surface/70">{item.label}</span>
                    <span className="text-[12px] font-mono text-sb-on-surface">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Accesos a Anomalías y Base de Datos ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/dev/anomalias"
          className="group bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-5 hover:border-red-500/30 hover:bg-red-500/[0.02] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/15 transition-colors">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-sb-on-surface">Constitución de Colegios y Anomalías</p>
              <p className="text-[12px] text-sb-on-surface/60 mt-0.5">
                Cómo está formado cada colegio, cruces de datos entre instituciones y errores detectados. Con diagramas.
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-sb-on-surface/40 shrink-0 group-hover:translate-x-0.5 group-hover:text-sb-on-surface/70 transition-all" />
          </div>
        </Link>

        <Link
          href="/dev/basedatos"
          className="group bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-5 hover:border-blue-500/30 hover:bg-blue-500/[0.02] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/15 transition-colors">
              <Database className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-sb-on-surface">Base de Datos</p>
              <p className="text-[12px] text-sb-on-surface/60 mt-0.5">
                Datos reales de la conexión, estado del pool, registros por módulo y tablas del esquema.
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-sb-on-surface/40 shrink-0 group-hover:translate-x-0.5 group-hover:text-sb-on-surface/70 transition-all" />
          </div>
        </Link>
      </div>
    </div>
  )
}
