"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Database, Server, Link2, User, Globe, Lock, Layers, RefreshCw, HardDrive } from "@/components/ui/proicons"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts"
import { cn } from "@/lib/utils"

interface DbInfo {
  connection: {
    database: string
    host: string
    port: string
    user: string
    socket: string | null
    ssl: boolean
    engine: string
    poolLimit: number
  }
  health: {
    status: string
    latency: number
    activeConnections: number
    poolLimit: number
    error?: string
  }
  tables: { table_name: string; column_count: number }[]
  counts: Record<string, number>
}

const COUNT_COLORS = ["#8B5CF6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"]

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function DevBasedatosPage() {
  const [info, setInfo] = React.useState<DbInfo | null>(null)
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(() => {
    setLoading(true)
    return fetch("/api/dev/db-info")
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d?.ok) setInfo(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    const t = setTimeout(load, 0)
    return () => clearTimeout(t)
  }, [load])

  const conn = info?.connection

  const infoCards = conn ? [
    { label: "Database", value: conn.database, icon: Database, color: "text-violet-500" },
    { label: "DB Host", value: `${conn.host}:${conn.port}`, icon: Server, color: "text-blue-500" },
    { label: "DB Socket", value: conn.socket || "TCP/IP (remoto)", icon: Link2, color: "text-emerald-500" },
    { label: "Usuario", value: conn.user, icon: User, color: "text-amber-500" },
    { label: "Motor", value: conn.engine, icon: HardDrive, color: "text-cyan-500" },
    { label: `${conn.ssl ? "SSL activo" : "SSL desactivado"} · pool ${conn.poolLimit}`, value: conn.ssl ? "Cifrado" : "Sin cifrar", icon: Lock, color: "text-emerald-500" },
  ] : []

  const tablePie = (info?.tables || []).slice(0, 10).map(t => ({ name: t.table_name, cols: t.column_count }))
  const countsData = info?.counts
    ? Object.entries(info.counts).map(([k, v]) => ({ name: k, value: v }))
    : []

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full space-y-6 py-2 md:py-4">
      <motion.div variants={fadeUp} className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] md:text-[24px] font-bold tracking-tight text-sb-on-surface">Base de Datos</h2>
          <p className="text-[13px] text-sb-on-surface/70 mt-1">Datos reales de la conexión, estado del pool y tablas</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 h-9 rounded-xl bg-sb-surface-container text-sb-on-surface text-[12px] font-medium hover:bg-sb-surface-container-high transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Actualizar
        </button>
      </motion.div>

      {/* Estado / Health */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-sb-surface rounded-2xl p-4 border border-sb-outline-variant/10 flex items-center gap-3">
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center",
            info?.health.status === 'healthy' ? "bg-emerald-500/10" : "bg-red-500/10")}>
            <div className={cn("h-2.5 w-2.5 rounded-full",
              info?.health.status === 'healthy' ? "bg-emerald-500" : "bg-red-500")} />
          </div>
          <div>
            <p className="text-[12px] text-sb-on-surface/70">Estado</p>
            <p className={cn("text-[15px] font-bold",
              info?.health.status === 'healthy' ? "text-emerald-600" : "text-red-500")}>
              {loading ? "—" : info?.health.status === 'healthy' ? "Conectado" : "Error"}
            </p>
          </div>
        </div>
        <div className="bg-sb-surface rounded-2xl p-4 border border-sb-outline-variant/10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Globe className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <p className="text-[12px] text-sb-on-surface/70">Latencia</p>
            <p className="text-[15px] font-bold text-sb-on-surface">{loading ? "—" : `${info?.health.latency ?? 0}ms`}</p>
          </div>
        </div>
        <div className="bg-sb-surface rounded-2xl p-4 border border-sb-outline-variant/10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Layers className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <p className="text-[12px] text-sb-on-surface/70">Tablas</p>
            <p className="text-[15px] font-bold text-sb-on-surface">{loading ? "—" : info?.tables?.length ?? 0}</p>
          </div>
        </div>
        <div className="bg-sb-surface rounded-2xl p-4 border border-sb-outline-variant/10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Link2 className="h-4 w-4 text-purple-500" />
          </div>
          <div>
            <p className="text-[12px] text-sb-on-surface/70">Conexiones activas</p>
            <p className="text-[15px] font-bold text-sb-on-surface">{loading ? "—" : `${info?.health.activeConnections ?? 0}`}</p>
          </div>
        </div>
      </motion.div>

      {/* Conexión real */}
      <motion.div variants={fadeUp}>
        <p className="text-[11px] font-semibold text-sb-on-surface/60 uppercase tracking-wider mb-2">Conexión</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {infoCards.map(card => (
            <div key={card.label} className="bg-sb-surface rounded-2xl p-4 border border-sb-outline-variant/10">
              <div className="h-9 w-9 rounded-xl bg-sb-surface-container flex items-center justify-center mb-3">
                <card.icon className={cn("h-4 w-4", card.color)} />
              </div>
              <p className="text-[13px] font-semibold text-sb-on-surface break-all">{loading ? "—" : card.value}</p>
              <p className="text-[11px] text-sb-on-surface/60 mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Diagramas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Database className="h-4 w-4 text-violet-500" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-sb-on-surface">Registros por módulo</p>
              <p className="text-[11px] text-sb-on-surface/60">institutions · users · students · teachers · courses · enrollments · payments</p>
            </div>
          </div>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-[12px] text-sb-on-surface/50">Cargando...</div>
          ) : countsData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-[12px] text-sb-on-surface/50">Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={264}>
              <BarChart data={countsData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--sb-outline-variant)" strokeOpacity={0.25} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--sb-on-surface-variant)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--sb-on-surface-variant)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "var(--sb-surface-container-low)", opacity: 0.4 }}
                  contentStyle={{ background: "var(--sb-surface-container)", border: "1px solid var(--sb-outline-variant)", borderRadius: 14, fontSize: 12 }}
                />
                <Bar dataKey="value" name="Registros" radius={[6, 6, 0, 0]} maxBarSize={44}>
                  {countsData.map((_, i) => (
                    <Cell key={i} fill={COUNT_COLORS[i % COUNT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Layers className="h-4 w-4 text-cyan-500" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-sb-on-surface">Tablas del esquema</p>
              <p className="text-[11px] text-sb-on-surface/60">columnas por tabla (top 10)</p>
            </div>
          </div>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-[12px] text-sb-on-surface/50">Cargando...</div>
          ) : tablePie.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-[12px] text-sb-on-surface/50">Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={264}>
              <PieChart>
                <Pie data={tablePie} dataKey="cols" nameKey="name" cx="50%" cy="50%" outerRadius={86} innerRadius={50} paddingAngle={2}>
                  {tablePie.map((_, i) => (
                    <Cell key={i} fill={COUNT_COLORS[i % COUNT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "var(--sb-surface-container)", border: "1px solid var(--sb-outline-variant)", borderRadius: 14, fontSize: 12 }}
                  formatter={(v, k) => [`${v} columna(s)`, k]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Lista de tablas */}
      <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-sb-outline-variant/10">
          <Database className="h-4 w-4 text-sb-on-surface/60" />
          <p className="text-[13px] font-semibold text-sb-on-surface">Tablas ({info?.tables?.length ?? 0})</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-wider text-sb-on-surface/50 border-b border-sb-outline-variant/10">
                <th className="px-4 py-2 font-medium">Tabla</th>
                <th className="px-3 py-2 font-medium text-right">Columnas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sb-outline-variant/8">
              {(info?.tables || []).map(t => (
                <tr key={t.table_name} className="hover:bg-sb-surface-container-low/50 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-[12px] text-sb-on-surface/80">{t.table_name}</td>
                  <td className="px-3 py-2.5 text-right text-sb-on-surface/80">{t.column_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}