"use client"

import * as React from "react"
import Link from "next/link"
import {
  Building2, CreditCard, GraduationCap, Shield, AlertTriangle, RefreshCw,
  CheckCircle, Clock, PieChart as PieChartIcon, Users, BookOpen, Wallet,
} from "@/components/ui/proicons"
import { cn } from "@/lib/utils"
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts"

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
  checks?: number
  constitution: { list: any[]; agg: any }
  anomalias: AnomaliaItem[]
  resolvedCount: number
}

const sevConfig: Record<string, { label: string; cls: string; dot: string; hex: string }> = {
  alta: { label: "Alta", cls: "bg-red-500/10 text-red-600", dot: "bg-red-500", hex: "#ef4444" },
  media: { label: "Media", cls: "bg-amber-500/10 text-amber-600", dot: "bg-amber-500", hex: "#f59e0b" },
  baja: { label: "Baja", cls: "bg-sky-500/10 text-sky-600", dot: "bg-sky-500", hex: "#0ea5e9" },
}

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]
const BAR_COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"]

export default function DevAnomaliasPage() {
  const [audit, setAudit] = React.useState<AuditData | null>(null)
  const [auditLoading, setAuditLoading] = React.useState(true)

  const loadAudit = React.useCallback(() => {
    setAuditLoading(true)
    return fetch("/api/dev/anomalias")
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d) setAudit(d) })
      .finally(() => setAuditLoading(false))
  }, [])

  React.useEffect(() => {
    const t = setTimeout(loadAudit, 0)
    return () => clearTimeout(t)
  }, [loadAudit])

  const agg = audit?.constitution.agg
  const list = audit?.constitution.list || []
  const anomalias = audit?.anomalias || []

  const planPie = agg ? [
    { name: "Con plan", value: agg.conPlan, color: "#10b981" },
    { name: "Sin plan · trial", value: agg.sinPlan - agg.trialVencido, color: "#3b82f6" },
    { name: "Trial vencido", value: agg.trialVencido, color: "#ef4444" },
  ].filter(d => d.value > 0) : []

  const sevPie = sevConfig && anomalias.length > 0
    ? ["alta", "media", "baja"].map(s => ({ name: sevConfig[s].label, value: anomalias.filter(a => a.severity === s).length, color: sevConfig[s].hex })).filter(d => d.value > 0)
    : []

  const countsData = agg ? [
    { name: "Usuarios", value: agg.usuarios },
    { name: "Alumnos", value: agg.alumnos },
    { name: "Docentes", value: agg.docentes },
    { name: "Cursos", value: agg.cursos },
    { name: "Matrículas", value: agg.matriculas },
    { name: "Pagos", value: agg.pagos },
  ] : []

  return (
    <div className="w-full space-y-6 py-2 md:py-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] md:text-[24px] font-bold tracking-tight text-sb-on-surface flex items-center gap-2">
            <Shield className="h-5 w-5 text-sb-primary" />
            Constitución de Colegios y Anomalías
          </h2>
          <p className="text-[13px] text-sb-on-surface/70 mt-1">
            Cómo está formado cada colegio, cruces de datos entre instituciones y errores detectados.
            Las anomalías nuevas te llegan a la campana y por push.
            {audit?.checks ? ` · ${audit.checks} checks por revisión.` : ""}
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
              { label: "Colegios", value: agg.total, cls: "text-sb-on-surface" },
              { label: "Con plan", value: agg.conPlan, cls: "text-emerald-600" },
              { label: "Sin plan · trial", value: agg.sinPlan, cls: "text-amber-600" },
              { label: "Trial vencido", value: agg.trialVencido, cls: "text-red-600" },
              { label: "Demo", value: agg.demo, cls: "text-purple-600" },
              { label: "Usuarios", value: agg.usuarios, cls: "text-blue-600" },
              { label: "Alumnos", value: agg.alumnos, cls: "text-emerald-600" },
              { label: "Docentes", value: agg.docentes, cls: "text-cyan-600" },
              { label: "Cursos", value: agg.cursos, cls: "text-indigo-600" },
              { label: "Matrículas", value: agg.matriculas, cls: "text-purple-600" },
              { label: "Pagos", value: agg.pagos, cls: "text-sky-600" },
            ].map((s) => (
              <div key={s.label} className="bg-sb-surface rounded-2xl p-3.5 border border-sb-outline-variant/10">
                <p className={cn("text-lg font-bold tracking-tight", s.cls)}>{auditLoading ? "—" : s.value.toLocaleString()}</p>
                <p className="text-[11px] text-sb-on-surface/60 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Diagramas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <PieChartIcon className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-sb-on-surface">Planes / Trial</p>
                  <p className="text-[11px] text-sb-on-surface/60">distribución de colegios</p>
                </div>
              </div>
              {planPie.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-[12px] text-sb-on-surface/50">Sin datos</div>
              ) : (
                <ResponsiveContainer width="100%" height={208}>
                  <PieChart>
                    <Pie data={planPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={48} paddingAngle={2}>
                      {planPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "var(--sb-surface-container)", border: "1px solid var(--sb-outline-variant)", borderRadius: 14, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="flex flex-wrap gap-2 justify-center mt-3">
                {planPie.map(d => (
                  <span key={d.name} className="flex items-center gap-1.5 text-[11px] text-sb-on-surface/70">
                    <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-sb-on-surface">Volumen por módulo</p>
                  <p className="text-[11px] text-sb-on-surface/60">registros totales del sistema</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={208}>
                <BarChart data={countsData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--sb-outline-variant)" strokeOpacity={0.25} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--sb-on-surface-variant)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--sb-on-surface-variant)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "var(--sb-surface-container-low)", opacity: 0.4 }}
                    contentStyle={{ background: "var(--sb-surface-container)", border: "1px solid var(--sb-outline-variant)", borderRadius: 14, fontSize: 12 }}
                  />
                  <Bar dataKey="value" name="Registros" radius={[6, 6, 0, 0]} maxBarSize={36}>
                    {countsData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-9 w-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-sb-on-surface">Anomalías por severidad</p>
                  <p className="text-[11px] text-sb-on-surface/60">activas ({anomalias.length})</p>
                </div>
              </div>
              {sevPie.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-[12px] text-sb-on-surface/50">Sin anomalías</div>
              ) : (
                <ResponsiveContainer width="100%" height={208}>
                  <PieChart>
                    <Pie data={sevPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={48} paddingAngle={2}>
                      {sevPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "var(--sb-surface-container)", border: "1px solid var(--sb-outline-variant)", borderRadius: 14, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="flex flex-wrap gap-2 justify-center mt-3">
                {sevPie.map(d => (
                  <span key={d.name} className="flex items-center gap-1.5 text-[11px] text-sb-on-surface/70">
                    <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Anomalías */}
          <div className={cn(
            "rounded-2xl border p-4",
            anomalias.length > 0 ? "bg-red-500/[0.03] border-red-500/20" : "bg-sb-surface border-sb-outline-variant/10"
          )}>
            <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className={cn("h-4 w-4", anomalias.length > 0 ? "text-red-500" : "text-emerald-500")} />
                <p className="text-[13px] font-semibold text-sb-on-surface">Anomalías detectadas</p>
                {anomalias.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 text-[10px] font-bold">
                    {anomalias.length} activa(s)
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

            {anomalias.length === 0 ? (
              <div className="flex items-center gap-2 py-4 text-center justify-center">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <p className="text-[12.5px] text-emerald-600">Sin anomalías ni cruces detectados. Todos los colegios están bien constituidos.</p>
              </div>
            ) : (
              <div className="divide-y divide-sb-outline-variant/10 max-h-80 overflow-auto">
                {anomalias.map(a => {
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
              <p className="text-[13px] font-semibold text-sb-on-surface">Colegios ({list.length})</p>
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
                  {list.map(inst => {
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
  )
}