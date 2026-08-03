"use client"

import * as React from "react"
import { Building2, Database, Users, Key, LayoutDashboard, Clock, ArrowRight, Zap, RefreshCw, Eye, ChevronDown, Server, Table2, Hash, Lock, Mail, UserCheck } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Institution {
  id: string; name: string; code: string; status: string
  total_students: number; total_teachers: number
  type: string; level: string; director_name: string
  created_at?: string
}

interface AuditEvent {
  id: string
  type: "institution_created" | "user_created" | "dashboard_created" | "system_init"
  institution?: string
  detail: string
  icon: string
  timestamp: Date
  tables?: string[]
}

const schemaNodes = [
  { id: "institutions", label: "institutions", icon: Building2, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
  { id: "users", label: "users", icon: Users, color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20" },
  { id: "dashboards", label: "institution_dashboards", icon: LayoutDashboard, color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20" },
  { id: "plans", label: "plans", icon: Database, color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20" },
]

const schemaColumns: Record<string, { name: string; type: string; icon: React.ElementType }[]> = {
  institutions: [
    { name: "id", type: "UUID", icon: Hash },
    { name: "code", type: "VARCHAR", icon: Key },
    { name: "name", type: "VARCHAR", icon: Building2 },
    { name: "status", type: "ENUM", icon: Zap },
    { name: "director_name", type: "VARCHAR", icon: UserCheck },
    { name: "created_at", type: "TIMESTAMP", icon: Clock },
  ],
  users: [
    { name: "id", type: "UUID", icon: Hash },
    { name: "email", type: "VARCHAR", icon: Mail },
    { name: "full_name", type: "VARCHAR", icon: Users },
    { name: "password_hash", type: "VARCHAR", icon: Lock },
    { name: "role", type: "ENUM", icon: UserCheck },
    { name: "institution_id", type: "UUID FK", icon: Building2 },
  ],
  dashboards: [
    { name: "id", type: "UUID", icon: Hash },
    { name: "institution_id", type: "UUID FK", icon: Building2 },
    { name: "name", type: "VARCHAR", icon: LayoutDashboard },
    { name: "type", type: "ENUM", icon: Zap },
    { name: "role", type: "ENUM", icon: UserCheck },
    { name: "status", type: "ENUM", icon: Zap },
  ],
  plans: [
    { name: "id", type: "UUID", icon: Hash },
    { name: "name", type: "VARCHAR", icon: Database },
    { name: "price", type: "DECIMAL", icon: Database },
    { name: "max_students", type: "INT", icon: Users },
    { name: "features", type: "JSON", icon: Database },
  ],
}

const flowSteps = [
  { label: "Crear Institución", sub: "INSERT INTO institutions", icon: Building2, color: "from-blue-500 to-blue-600" },
  { label: "Director + Secre.", sub: "INSERT INTO users × 2", icon: Users, color: "from-purple-500 to-purple-600" },
  { label: "Dashboards", sub: "INSERT INTO dashboards × 5", icon: LayoutDashboard, color: "from-emerald-500 to-emerald-600" },
  { label: "Credenciales", sub: "bcrypt.hash + generate", icon: Key, color: "from-amber-500 to-amber-600" },
]

export default function AuditPage() {
  const [institutions, setInstitutions] = React.useState<Institution[]>([])
  const [events, setEvents] = React.useState<AuditEvent[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedTable, setSelectedTable] = React.useState<string | null>(null)
  const [expandedFlow, setExpandedFlow] = React.useState(true)
  const [pulseActive, setPulseActive] = React.useState(false)

  React.useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch("/api/super-admin/instituciones?limit=50")
      if (res.ok) {
        const data = await res.json()
        const insts = data.data || []
        setInstitutions(insts)

        const newEvents: AuditEvent[] = []
        for (const inst of insts.slice(0, 8)) {
          newEvents.push({
            id: `${inst.id}-created`,
            type: "institution_created",
            institution: inst.name,
            detail: `Colegio "${inst.name}" registrado con código ${inst.code}`,
            icon: "building",
            timestamp: inst.created_at ? new Date(inst.created_at) : new Date(),
            tables: ["institutions", "users", "dashboards"],
          })
          if (inst.director_name) {
            newEvents.push({
              id: `${inst.id}-director`,
              type: "user_created",
              institution: inst.name,
              detail: `Director ${inst.director_name} vinculado`,
              icon: "user",
              timestamp: inst.created_at ? new Date(Date.parse(inst.created_at) + 1000) : new Date(),
              tables: ["users"],
            })
          }
          newEvents.push({
            id: `${inst.id}-dashboards`,
            type: "dashboard_created",
            institution: inst.name,
            detail: `5 dashboards generados automáticamente`,
            icon: "layout",
            timestamp: inst.created_at ? new Date(Date.parse(inst.created_at) + 2000) : new Date(),
            tables: ["institution_dashboards"],
          })
        }
        setEvents(newEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()))
      }
    } catch {} finally { setLoading(false) }
  }

  const triggerPulse = () => {
    setPulseActive(true)
    setTimeout(() => setPulseActive(false), 2000)
  }

  const timeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "ahora"
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Auditoría en Vivo</h1>
          <p className="text-sm text-sb-on-surface-variant/50 mt-1">Flujo de creación de colegios en tiempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { fetchData(); triggerPulse() }}
            className="h-9 px-4 rounded-xl text-xs font-medium flex items-center gap-2 bg-sb-surface border border-sb-outline-variant/20 text-sb-on-surface-variant/60 hover:bg-sb-surface-container transition-all">
            <RefreshCw className={`h-3.5 w-3.5 ${pulseActive ? "animate-spin" : ""}`} />
            Actualizar
          </button>
          <div className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold text-emerald-600">En vivo</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Colegios registrados", value: institutions.length, icon: Building2, color: "text-blue-500", bg: "bg-blue-500/8" },
          { label: "Usuarios creados", value: institutions.length * 2, icon: Users, color: "text-purple-500", bg: "bg-purple-500/8" },
          { label: "Dashboards activos", value: institutions.length * 5, icon: LayoutDashboard, color: "text-emerald-500", bg: "bg-emerald-500/8" },
          { label: "Tablas afectadas", value: 4, icon: Database, color: "text-amber-500", bg: "bg-amber-500/8" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.03 }}
            className="bg-sb-surface rounded-2xl p-4 border border-sb-outline-variant/10">
            <div className={`h-8 w-8 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-sb-on-surface">{stat.value}</p>
            <p className="text-[11px] text-sb-on-surface-variant/40 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Creation Flow Diagram */}
        <div className="lg:col-span-2 space-y-5">
          {/* Flow Diagram */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-sb-surface rounded-2xl p-5 border border-sb-outline-variant/10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-sb-on-surface-variant/40" />
                <h3 className="text-sm font-semibold text-sb-on-surface">Flujo de Creación</h3>
              </div>
              <button onClick={() => setExpandedFlow(!expandedFlow)}
                className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-sb-surface-container transition-colors">
                <ChevronDown className={`h-4 w-4 text-sb-on-surface-variant/40 transition-transform ${expandedFlow ? "" : "-rotate-90"}`} />
              </button>
            </div>

            <AnimatePresence>
              {expandedFlow && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden">
                  {/* Flow Steps */}
                  <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                    {flowSteps.map((step, i) => (
                      <React.Fragment key={step.label}>
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + i * 0.1 }}
                          className="flex-shrink-0">
                          <div className={`bg-gradient-to-br ${step.color} rounded-2xl p-4 min-w-[140px] text-white shadow-lg`}>
                            <step.icon className="h-5 w-5 mb-2 opacity-90" />
                            <p className="text-xs font-semibold">{step.label}</p>
                            <p className="text-[10px] opacity-70 mt-0.5 font-mono">{step.sub}</p>
                          </div>
                        </motion.div>
                        {i < flowSteps.length - 1 && (
                          <ArrowRight className="h-4 w-4 text-sb-on-surface-variant/20 flex-shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Schema Visualization */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {schemaNodes.map((node, i) => (
                      <motion.button key={node.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                        onClick={() => setSelectedTable(selectedTable === node.id ? null : node.id)}
                        className={`text-left rounded-2xl p-4 border transition-all ${selectedTable === node.id ? `${node.bgColor} ${node.borderColor} shadow-sm` : `bg-sb-surface-container/30 border-transparent hover:border-sb-outline-variant/20`}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Table2 className={`h-3.5 w-3.5 ${node.color}`} />
                          <span className={`text-[11px] font-semibold ${node.color}`}>{node.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-sb-on-surface-variant/35">
                          <Database className="h-3 w-3" />
                          <span>{schemaColumns[node.id]?.length || 0} columnas</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Selected Table Columns */}
                  <AnimatePresence>
                    {selectedTable && schemaColumns[selectedTable] && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-4">
                        <div className="bg-sb-surface-container/30 rounded-2xl p-4 border border-sb-outline-variant/10">
                          <div className="flex items-center gap-2 mb-3">
                            <Table2 className="h-3.5 w-3.5 text-sb-on-surface-variant/40" />
                            <span className="text-xs font-semibold text-sb-on-surface">Schema: {selectedTable}</span>
                          </div>
                          <div className="space-y-1.5">
                            {schemaColumns[selectedTable].map((col) => (
                              <div key={col.name} className="flex items-center gap-3 py-1.5 px-3 rounded-xl hover:bg-sb-surface/50 transition-colors">
                                <col.icon className="h-3.5 w-3.5 text-sb-on-surface-variant/30" />
                                <span className="text-xs font-mono text-sb-on-surface/80 flex-1">{col.name}</span>
                                <span className="text-[10px] font-mono text-sb-on-surface-variant/30 px-2 py-0.5 rounded bg-sb-surface-container/50">{col.type}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Recent Institutions */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-sb-surface rounded-2xl p-5 border border-sb-outline-variant/10">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-4 w-4 text-sb-on-surface-variant/40" />
              <h3 className="text-sm font-semibold text-sb-on-surface">Colegios Recientes</h3>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-sb-surface-container/30 rounded-2xl animate-pulse" />)}
              </div>
            ) : institutions.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-10 w-10 text-sb-on-surface-variant/15 mx-auto mb-3" />
                <p className="text-sm text-sb-on-surface-variant/40">Sin colegios registrados</p>
              </div>
            ) : (
              <div className="space-y-2">
                {institutions.slice(0, 6).map((inst, i) => (
                  <motion.div key={inst.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.04 }}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-sb-surface-container/30 transition-colors group">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/15 to-purple-500/15 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-blue-500/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-sb-on-surface truncate">{inst.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-sb-on-surface-variant/35">{inst.code}</span>
                        <span className="text-[10px] text-sb-on-surface-variant/20">·</span>
                        <span className="text-[10px] text-sb-on-surface-variant/35">{inst.type || "—"}</span>
                        <span className="text-[10px] text-sb-on-surface-variant/20">·</span>
                        <span className="text-[10px] text-sb-on-surface-variant/35">{inst.level || "—"}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${inst.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-500/10 text-slate-500"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${inst.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {inst.status === "active" ? "Activo" : inst.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right: Activity Timeline */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="bg-sb-surface rounded-2xl p-5 border border-sb-outline-variant/10">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-sb-on-surface-variant/40" />
            <h3 className="text-sm font-semibold text-sb-on-surface">Actividad en Vivo</h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-sb-surface-container/30 rounded-2xl animate-pulse" />)}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-10 w-10 text-sb-on-surface-variant/15 mx-auto mb-3" />
              <p className="text-sm text-sb-on-surface-variant/40">Sin actividad reciente</p>
            </div>
          ) : (
            <div className="space-y-0">
              {events.slice(0, 12).map((event, i) => {
                const colors = {
                  institution_created: { bg: "bg-blue-500/10", text: "text-blue-500", dot: "bg-blue-500" },
                  user_created: { bg: "bg-purple-500/10", text: "text-purple-500", dot: "bg-purple-500" },
                  dashboard_created: { bg: "bg-emerald-500/10", text: "text-emerald-500", dot: "bg-emerald-500" },
                  system_init: { bg: "bg-amber-500/10", text: "text-amber-500", dot: "bg-amber-500" },
                }
                const c = colors[event.type] || colors.system_init
                return (
                  <motion.div key={event.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.03 }}
                    className="flex gap-3 py-3 relative">
                    {/* Timeline line */}
                    {i < events.slice(0, 12).length - 1 && (
                      <div className="absolute left-[11px] top-[28px] bottom-0 w-px bg-sb-outline-variant/15" />
                    )}
                    {/* Dot */}
                    <div className="relative z-10 mt-0.5">
                      <div className={`h-[22px] w-[22px] rounded-full ${c.bg} flex items-center justify-center`}>
                        <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                      </div>
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-sb-on-surface/80 leading-relaxed">{event.detail}</p>
                      {event.institution && (
                        <p className="text-[10px] text-sb-on-surface-variant/30 mt-0.5 truncate">{event.institution}</p>
                      )}
                      {event.tables && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {event.tables.map(t => (
                            <span key={t} className="text-[9px] font-mono text-sb-on-surface-variant/25 px-1.5 py-0.5 rounded bg-sb-surface-container/40">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-sb-on-surface-variant/25 shrink-0 mt-0.5">{timeAgo(event.timestamp)}</span>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
