"use client"

import * as React from "react"
import Link from "next/link"
import { Building2, Users, Database, Terminal, ChevronRight, Server, CreditCard, GraduationCap, Shield, Settings, Handshake, AlertTriangle, RefreshCw, CheckCircle, Clock } from "@/components/ui/proicons"
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

interface AnomaliaItem {
  id: string
  type: string
  severity: string
  title: string
  detail: string
  institution_id: string | null
  institution_name: string | null
  first_seen_at: string
  last_seen_at: string
}

interface AuditData {
  scan: { at: string; nuevos: number }
  constitution: { list: any[]; agg: any }
  anomalias: AnomaliaItem[]
  resolvedCount: number
}

const sevConfig: Record<string, { label: string; cls: string; dot: string }> = {
  alta: { label: "Alta", cls: "bg-red-500/10 text-red-600", dot: "bg-red-500" },
  media: { label: "Media", cls: "bg-amber-500/10 text-amber-600", dot: "bg-amber-500" },
  baja: { label: "Baja", cls: "bg-sky-500/10 text-sky-600", dot: "bg-sky-500" },
}

export default function DevDashboard() {
  const [stats, setStats] = React.useState<Stats>({ institutions: 0, users: 0, students: 0, tables: 0 })
  const [loading, setLoading] = React.useState(true)
  const [requests, setRequests] = React.useState<TrialRequest[]>([])
  const [audit, setAudit] = React.useState<AuditData | null>(null)
  const [auditLoading, setAuditLoading] = React.useState(true)

  const loadAudit = React.useCallback(() => {
    setAuditLoading(true)
    return fetch("/api/dev/anomalias")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setAudit(d) })
      .finally(() => setAuditLoading(false))
  }, [])

  React.useEffect(() => {
    fetch("/api/dev/stats")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d) })
      .finally(() => setLoading(false))

    fetch("/api/dev/trial-requests")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setRequests(d.requests || []) })
      .catch(() => {})

    const t = setTimeout(loadAudit, 0)
    return () => clearTimeout(t)
  }, [loadAudit])

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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="text-[11px] font-semibold text-sb-on-surface/60 uppercase tracking-wider mb-2">Acciones</p>
          <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 divide-y divide-sb-outline-variant/8 overflow-hidden">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-4 hover:bg-sb-surface-container-low/50 transition-colors group"
              >
                <div className="h-9 w-9 rounded-xl bg-sb-surface-container flex items-center justify-center shrink-0 group-hover:bg-sb-surface-container-high transition-colors">
                  <action.icon className="h-4 w-4 text-sb-on-surface/70 group-hover:text-sb-on-surface transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-sb-on-surface">{action.label}</p>
                  <p className="text-[12px] text-sb-on-surface/70 truncate">{action.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-sb-on-surface/40 shrink-0 group-hover:translate-x-0.5 group-hover:text-sb-on-surface/70 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
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
      </div>

      {/* ===== Constitución de Colegios + Anomalías ===== */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-[16px] font-bold tracking-tight text-sb-on-surface flex items-center gap-2">
              <Shield className="h-4 w-4 text-sb-primary" />
              Constitución de Colegios y Anomalías
            </h2>
            <p className="text-[12px] text-sb-on-surface/60 mt-0.5">
              Cómo está formado cada colegio, cruces de datos entre instituciones y errores detectados.
              Las anomalías nuevas te llegan a la campana y por push.
            </p>
          </div>
          <button
            onClick={loadAudit}
            disabled={auditLoading}
            className="flex items-center gap-2 px-3 h-9 rounded-xl bg-sb-surface-container text-sb-on-surface text-[12px] font-medium hover:bg-sb-surface-container-high transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", auditLoading && "animate-spin")} />
            Escanear
          </button>
        </div>

        {audit && (
          <>
            {/* Resumen constitutivo */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Colegios", value: audit.constitution.agg.total, cls: "text-sb-on-surface" },
                { label: "Con plan", value: audit.constitution.agg.conPlan, cls: "text-emerald-600" },
                { label: "Sin plan · trial", value: audit.constitution.agg.sinPlan, cls: "text-amber-600" },
                { label: "Trial vencido", value: audit.constitution.agg.trialVencido, cls: "text-red-600" },
                { label: "Demo", value: audit.constitution.agg.demo, cls: "text-purple-600" },
                { label: "Usuarios", value: audit.constitution.agg.usuarios, cls: "text-blue-600" },
                { label: "Alumnos", value: audit.constitution.agg.alumnos, cls: "text-emerald-600" },
                { label: "Docentes", value: audit.constitution.agg.docentes, cls: "text-cyan-600" },
                { label: "Cursos", value: audit.constitution.agg.cursos, cls: "text-indigo-600" },
                { label: "Matrículas", value: audit.constitution.agg.matriculas, cls: "text-purple-600" },
                { label: "Pagos", value: audit.constitution.agg.pagos, cls: "text-sky-600" },
              ].map((s) => (
                <div key={s.label} className="bg-sb-surface rounded-2xl p-3.5 border border-sb-outline-variant/10">
                  <p className={`text-lg font-bold tracking-tight ${s.cls}`}>{auditLoading ? "—" : s.value.toLocaleString()}</p>
                  <p className="text-[11px] text-sb-on-surface/60 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Anomalías */}
            <div className={cn(
              "rounded-2xl border p-4",
              audit.anomalias.length > 0 ? "bg-red-500/[0.03] border-red-500/20" : "bg-sb-surface border-sb-outline-variant/10"
            )}>
              <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={cn("h-4 w-4", audit.anomalias.length > 0 ? "text-red-500" : "text-emerald-500")} />
                  <p className="text-[13px] font-semibold text-sb-on-surface">Anomalías detectadas</p>
                  {audit.anomalias.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 text-[10px] font-bold">
                      {audit.anomalias.length} activa(s)
                    </span>
                  )}
                  {audit.resolvedCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                      {audit.resolvedCount} resuelta(s)
                    </span>
                  )}
                </div>
                {audit.scan.nuevos > 0 && (
                  <span className="text-[10.5px] text-sb-primary font-medium">
                    {audit.scan.nuevos} nueva(s) notificadas en esta revisión
                  </span>
                )}
              </div>

              {audit.anomalias.length === 0 ? (
                <div className="flex items-center gap-2 py-4 text-center justify-center">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <p className="text-[12.5px] text-emerald-600">Sin anomalías ni cruces detectados. Todos los colegios están bien constituidos.</p>
                </div>
              ) : (
                <div className="divide-y divide-sb-outline-variant/10 max-h-80 overflow-auto">
                  {audit.anomalias.map(a => {
                    const sev = sevConfig[a.severity] || sevConfig.media
                    return (
                      <div key={a.id} className="py-2.5 first:pt-0 last:pb-0">
                        <div className="flex items-start gap-2.5">
                          <span className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", sev.dot)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0", sev.cls)}>{sev.label}</span>
                              <p className="text-[12.5px] font-medium text-sb-on-surface truncate">{a.title}</p>
                            </div>
                            {a.detail && <p className="text-[11px] text-sb-on-surface/60 mt-0.5 break-words">{a.detail}</p>}
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {a.institution_name && (
                                <span className="text-[10px] text-sb-on-surface/50 bg-sb-surface-container px-1.5 py-0.5 rounded-md">
                                  {a.institution_name}
                                </span>
                              )}
                              <span className="text-[10px] text-sb-on-surface/40">desde {new Date(a.first_seen_at).toLocaleDateString("es-PE")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Tabla de colegios */}
            <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-sb-outline-variant/10">
                <Building2 className="h-4 w-4 text-sb-on-surface/60" />
                <p className="text-[13px] font-semibold text-sb-on-surface">Colegios ({audit.constitution.list.length})</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="text-[10.5px] uppercase tracking-wider text-sb-on-surface/50 border-b border-sb-outline-variant/10">
                      <th className="px-4 py-2 font-medium">Código</th>
                      <th className="px-3 py-2 font-medium">Colegio</th>
                      <th className="px-3 py-2 font-medium">Plan / Trial</th>
                      <th className="px-3 py-2 font-medium text-right">Usu</th>
                      <th className="px-3 py-2 font-medium text-right">Alu</th>
                      <th className="px-3 py-2 font-medium text-right">Doc</th>
                      <th className="px-3 py-2 font-medium text-right">Cur</th>
                      <th className="px-3 py-2 font-medium text-right">Mat</th>
                      <th className="px-4 py-2 font-medium text-right">Pag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sb-outline-variant/8">
                    {audit.constitution.list.map(inst => {
                      const trialVencido = inst.trial_vencido
                      return (
                        <tr key={inst.id} className="hover:bg-sb-surface-container-low/50 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-[11px] text-sb-on-surface/70">{inst.code || "—"}</td>
                          <td className="px-3 py-2.5">
                            <Link href="/dev/instituciones" className="text-sb-on-surface font-medium hover:text-sb-primary truncate block max-w-[220px]">
                              {inst.name}
                            </Link>
                          </td>
                          <td className="px-3 py-2.5">
                            {inst.plan_id ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                                <CreditCard className="h-3 w-3" /> {inst.plan_name || "Plan"}
                              </span>
                            ) : trialVencido ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-600 bg-red-500/10 px-1.5 py-0.5 rounded-md">
                                <Clock className="h-3 w-3" /> Trial vencido
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                                <Clock className="h-3 w-3" /> Trial
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right text-sb-on-surface/80">{inst.users ?? 0}</td>
                          <td className="px-3 py-2.5 text-right text-sb-on-surface/80">{inst.students ?? 0}</td>
                          <td className="px-3 py-2.5 text-right text-sb-on-surface/80">{inst.teachers ?? 0}</td>
                          <td className="px-3 py-2.5 text-right text-sb-on-surface/80">{inst.courses ?? 0}</td>
                          <td className="px-3 py-2.5 text-right text-sb-on-surface/80">{inst.enrollments ?? 0}</td>
                          <td className="px-4 py-2.5 text-right text-sb-on-surface/80">{inst.payments ?? 0}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {auditLoading && !audit && (
          <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-10 flex flex-col items-center gap-3">
            <RefreshCw className="h-5 w-5 text-sb-on-surface/40 animate-spin" />
            <p className="text-[12.5px] text-sb-on-surface/60">Auditando datos de los colegios...</p>
          </div>
        )}
      </div>
    </div>
  )
}
