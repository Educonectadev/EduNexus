"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { SbBtn } from "@/components/ui/sb"
import {
  DollarSign, CreditCard, TrendingUp, Download, ArrowUpRight,
  Building2, Clock, Receipt, BarChart3, Wallet, RefreshCw,
  TrendingDown, ArrowDownRight,
} from "@/components/ui/proicons"

interface Institution {
  id: string; name: string; code: string; status: string
  plan_name?: string; plan_price?: number
  total_students: number; total_teachers: number
  type: string; level: string; director_name: string
  created_at?: string
}

const planColors: Record<string, { icon: string; text: string; bg: string; border: string }> = {
  "Free": { icon: "text-slate-400", text: "text-slate-500", bg: "bg-slate-500/8", border: "border-slate-500/15" },
  "Básico": { icon: "text-blue-500", text: "text-blue-500", bg: "bg-blue-500/8", border: "border-blue-500/15" },
  "Pro": { icon: "text-emerald-500", text: "text-emerald-500", bg: "bg-emerald-500/8", border: "border-emerald-500/15" },
  "Enterprise": { icon: "text-amber-500", text: "text-amber-500", bg: "bg-amber-500/8", border: "border-amber-500/15" },
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.08 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function FacturacionPage() {
  const [institutions, setInstitutions] = React.useState<Institution[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filterPlan, setFilterPlan] = React.useState<string>("")
  const [refreshing, setRefreshing] = React.useState(false)

  React.useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 20000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dev/institutions")
      if (res.ok) {
        const data = await res.json()
        setInstitutions(Array.isArray(data) ? data : data.data || [])
      }
    } catch {} finally { setLoading(false) }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData().finally(() => setTimeout(() => setRefreshing(false), 800))
  }

  const planStats = React.useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {}
    for (const inst of institutions) {
      const plan = inst.plan_name || "Free"
      if (!map[plan]) map[plan] = { count: 0, revenue: 0 }
      map[plan].count++
      map[plan].revenue += inst.plan_price || 0
    }
    return map
  }, [institutions])

  const totalRevenue = Object.values(planStats).reduce((s, p) => s + p.revenue, 0)
  const activeInstitutions = institutions.filter(i => i.status === "active").length
  const avgRevenue = institutions.length > 0 ? Math.round(totalRevenue / institutions.length) : 0

  const filteredInstitutions = React.useMemo(() => {
    if (!filterPlan) return institutions
    return institutions.filter(i => (i.plan_name || "Free") === filterPlan)
  }, [institutions, filterPlan])

  const formatCurrency = (n: number) => `S/ ${n.toLocaleString("es-PE")}`

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full space-y-6 py-2">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-[22px] md:text-[24px] font-bold tracking-tight text-sb-on-surface">Facturación</h2>
          <p className="text-[13px] text-sb-on-surface/70 mt-1">Ingresos y suscripciones de colegios</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SbBtn variant="outlined" onClick={handleRefresh} className="h-10 px-4 rounded-xl flex-1 sm:flex-none">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </SbBtn>
          <SbBtn variant="filled" className="h-10 px-4 rounded-xl flex-1 sm:flex-none">
            <Download className="h-4 w-4" />
            Exportar
          </SbBtn>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Ingresos Totales", value: formatCurrency(totalRevenue), icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/8" },
          { label: "Colegios Activos", value: activeInstitutions, icon: Building2, color: "text-blue-500", bg: "bg-blue-500/8" },
          { label: "Ingreso Promedio", value: formatCurrency(avgRevenue), icon: BarChart3, color: "text-violet-500", bg: "bg-violet-500/8" },
          { label: "Planes Activos", value: Object.keys(planStats).length, icon: Wallet, color: "text-amber-500", bg: "bg-amber-500/8" },
        ].map((stat, i) => (
          <motion.div key={stat.label} variants={fadeUp}
            className="bg-sb-surface rounded-2xl p-4 border border-sb-outline-variant/10">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-[22px] font-bold text-sb-on-surface leading-none">{stat.value}</p>
            <p className="text-[12px] text-sb-on-surface/70 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Plan Cards */}
      <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl p-5 border border-sb-outline-variant/10">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-4 w-4 text-sb-on-surface-variant/50" />
          <h3 className="text-[13px] font-semibold text-sb-on-surface">Distribución por Planes</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(planStats).sort((a, b) => b[1].revenue - a[1].revenue).map(([plan, data], i) => {
            const colors = planColors[plan] || planColors["Free"]
            const isActive = filterPlan === plan
            return (
              <motion.button key={plan} variants={fadeUp}
                onClick={() => setFilterPlan(isActive ? "" : plan)}
                className={`text-left rounded-2xl p-4 border transition-all ${
                  isActive
                    ? `${colors.bg} ${colors.border} border shadow-sm`
                    : "bg-sb-surface-container-low/50 border-transparent hover:border-sb-outline-variant/15"
                }`}>
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-3 ${
                  isActive ? colors.bg : "bg-sb-surface-container-high"
                }`}>
                  <CreditCard className={`h-4 w-4 ${isActive ? colors.icon : "text-sb-on-surface/50"}`} />
                </div>
                <p className="text-[20px] font-bold text-sb-on-surface leading-none">{data.count}</p>
                <p className="text-[11px] text-sb-on-surface/70 mt-1">{plan}</p>
                <p className={`text-[12px] font-semibold mt-1.5 ${isActive ? colors.text : "text-sb-on-surface/70"}`}>
                  {formatCurrency(data.revenue)}/mes
                </p>
              </motion.button>
            )
          })}
          {Object.keys(planStats).length === 0 && !loading && (
            <div className="col-span-full text-center py-8">
              <Wallet className="h-10 w-10 text-sb-on-surface-variant/50 mx-auto mb-2" />
              <p className="text-[13px] text-sb-on-surface/70">Sin datos de planes</p>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Institutions Table */}
        <motion.div variants={fadeUp} className="lg:col-span-2 bg-sb-surface rounded-2xl border border-sb-outline-variant/10 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-sb-outline-variant/10">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-sb-on-surface-variant/50" />
              <h3 className="text-[13px] font-semibold text-sb-on-surface">Detalle por Colegio</h3>
              {filterPlan && (
                <button onClick={() => setFilterPlan("")}
                  className="text-[10px] font-medium text-sb-on-surface bg-sb-surface-container-high px-2 py-0.5 rounded-full hover:bg-sb-surface-container-highest transition-colors">
                  {filterPlan} ×
                </button>
              )}
            </div>
            <span className="text-[11px] text-sb-on-surface/60">{filteredInstitutions.length} colegios</span>
          </div>

          {loading ? (
            <div className="p-5 space-y-2">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-sb-surface-container/30 rounded-2xl animate-pulse" />)}
            </div>
          ) : filteredInstitutions.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="h-10 w-10 text-sb-on-surface-variant/50 mx-auto mb-2" />
              <p className="text-[13px] text-sb-on-surface/70">Sin colegios para este plan</p>
            </div>
          ) : (
            <div className="divide-y divide-sb-outline-variant/5">
              {filteredInstitutions.slice(0, 10).map((inst, i) => {
                const plan = inst.plan_name || "Free"
                const colors = planColors[plan] || planColors["Free"]
                return (
                  <motion.div key={inst.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-sb-surface-container-low/30 transition-colors">
                    <div className={`h-10 w-10 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
                      <Building2 className={`h-4 w-4 ${colors.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-sb-on-surface truncate">{inst.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-sb-on-surface/70">{inst.code}</span>
                        <span className="text-[10px] text-sb-on-surface/40">·</span>
                        <span className="text-[10px] text-sb-on-surface/70">{inst.total_students || 0} alumnos</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-semibold text-sb-on-surface">
                        {formatCurrency(inst.plan_price || 0)}
                      </p>
                      <span className={`text-[10px] font-medium ${colors.text}`}>{plan}</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Right: Summary + Activity */}
        <div className="space-y-5">
          {/* Revenue Summary */}
          <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl p-5 border border-sb-outline-variant/10">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-sb-on-surface-variant/50" />
              <h3 className="text-[13px] font-semibold text-sb-on-surface">Resumen Mensual</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-sb-on-surface rounded-2xl p-4">
                <p className="text-[11px] text-sb-surface/70 mb-1">Facturación Mensual Est.</p>
                <p className="text-[28px] font-bold text-sb-surface leading-none">{formatCurrency(totalRevenue)}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                  <span className="text-[11px] font-medium text-emerald-400">+12% vs mes anterior</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-sb-surface-container-low/50 rounded-2xl p-3">
                  <p className="text-[10px] text-sb-on-surface/60 mb-1">Anual Proy.</p>
                  <p className="text-[18px] font-bold text-sb-on-surface">{formatCurrency(totalRevenue * 12)}</p>
                </div>
                <div className="bg-sb-surface-container-low/50 rounded-2xl p-3">
                  <p className="text-[10px] text-sb-on-surface/60 mb-1">Por Colegio</p>
                  <p className="text-[18px] font-bold text-sb-on-surface">{formatCurrency(avgRevenue)}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl p-5 border border-sb-outline-variant/10">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-sb-on-surface-variant/50" />
              <h3 className="text-[13px] font-semibold text-sb-on-surface">Actividad Reciente</h3>
            </div>
            <div className="space-y-0">
              {institutions.slice(0, 5).map((inst, i) => {
                const plan = inst.plan_name || "Free"
                const colors = planColors[plan] || planColors["Free"]
                return (
                  <motion.div key={inst.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 py-3 relative">
                    {i < 4 && <div className="absolute left-[11px] top-[28px] bottom-0 w-px bg-sb-outline-variant/15" />}
                    <div className="relative z-10 shrink-0">
                      <div className={`h-[22px] w-[22px] rounded-full ${colors.bg} flex items-center justify-center`}>
                        <span className={`h-2 w-2 rounded-full ${colors.text.replace("text-", "bg-")}`} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-sb-on-surface/80 leading-relaxed truncate">{inst.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-medium ${colors.text}`}>{plan}</span>
                        <span className="text-[10px] text-sb-on-surface/40">·</span>
                        <span className="text-[10px] text-sb-on-surface/60">{formatCurrency(inst.plan_price || 0)}/mes</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-1 rounded-md shrink-0 ${
                      inst.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-sb-surface-container-high text-sb-on-surface/70"
                    }`}>
                      {inst.status === "active" ? "Activo" : "Inactivo"}
                    </span>
                  </motion.div>
                )
              })}
              {institutions.length === 0 && (
                <div className="py-6 text-center">
                  <Clock className="h-8 w-8 text-sb-on-surface/40 mx-auto mb-2" />
                  <p className="text-[12px] text-sb-on-surface/70">Sin actividad</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
