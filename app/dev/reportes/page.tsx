"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { SbBtn } from "@/components/ui/sb"
import {
  Building2, Users, DollarSign, TrendingUp, Download, RefreshCw,
  BarChart3, GraduationCap, UserCheck, BookOpen, FileText, School,
  ArrowUpRight, PieChart as PieChartIcon
} from "@/components/ui/proicons"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts"

interface Institution {
  id: string; name: string; code: string; status: string
  plan_name?: string; plan_price?: number
  total_students: number; total_teachers: number
  type: string; level: string
  created_at?: string
}

const planColorMap: Record<string, string> = {
  "Free": "#94a3b8",
  "Básico": "#3b82f6",
  "Pro": "#10b981",
  "Enterprise": "#f59e0b",
}

const COLORS = ["#8B5CF6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--sb-surface-container)] border border-sb-outline-variant/20 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-xl">
        <p className="text-[10px] text-sb-on-surface/40 mb-1">{label}</p>
        <p className="text-sm font-semibold text-sb-on-surface">
          {typeof payload[0].value === "number" ? payload[0].value.toLocaleString() : payload[0].value}
        </p>
      </div>
    )
  }
  return null
}

export default function ReportesPage() {
  const [institutions, setInstitutions] = React.useState<Institution[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)

  React.useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
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

  const stats = React.useMemo(() => {
    const totalStudents = institutions.reduce((s, i) => s + (i.total_students || 0), 0)
    const totalTeachers = institutions.reduce((s, i) => s + (i.total_teachers || 0), 0)
    const totalRevenue = institutions.reduce((s, i) => s + (i.plan_price || 0), 0)
    const activeCount = institutions.filter(i => i.status === "active").length
    const inactiveCount = institutions.filter(i => i.status !== "active").length
    return { totalStudents, totalTeachers, totalRevenue, activeCount, inactiveCount }
  }, [institutions])

  const planDistribution = React.useMemo(() => {
    const map: Record<string, number> = {}
    for (const inst of institutions) {
      const plan = inst.plan_name || "Free"
      map[plan] = (map[plan] || 0) + 1
    }
    return Object.entries(map).map(([name, value]) => ({
      name, value, color: planColorMap[name] || "#94a3b8"
    })).sort((a, b) => b.value - a.value)
  }, [institutions])

  const levelDistribution = React.useMemo(() => {
    const map: Record<string, number> = {}
    for (const inst of institutions) {
      const level = inst.level || "Sin definir"
      map[level] = (map[level] || 0) + 1
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value).slice(0, 6)
  }, [institutions])

  const typeDistribution = React.useMemo(() => {
    const map: Record<string, number> = {}
    for (const inst of institutions) {
      const type = inst.type || "Sin definir"
      map[type] = (map[type] || 0) + 1
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value).slice(0, 6)
  }, [institutions])

  const monthlyGrowth = React.useMemo(() => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const now = new Date()
    const counts: { month: string; count: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthIdx = d.getMonth()
      const year = d.getFullYear()
      const monthStart = new Date(year, monthIdx, 1)
      const monthEnd = new Date(year, monthIdx + 1, 0, 23, 59, 59)
      const count = institutions.filter(inst => {
        if (!inst.created_at) return false
        const cd = new Date(inst.created_at)
        return cd >= monthStart && cd <= monthEnd
      }).length
      counts.push({ month: months[monthIdx], count })
    }
    return counts
  }, [institutions])

  const formatCurrency = (n: number) => `S/ ${n.toLocaleString("es-PE")}`

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Reportes</h1>
          <p className="text-sm text-sb-on-surface-variant/50 mt-1">Analiticas y reportes globales de la plataforma</p>
        </div>
        <div className="flex items-center gap-2">
          <SbBtn variant="outlined" size="sm" rounded onClick={handleRefresh} className="h-9 px-4">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </SbBtn>
          <SbBtn variant="filled" size="sm" rounded className="h-9 px-4">
            <Download className="h-3.5 w-3.5" />
            Exportar Reportes
          </SbBtn>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Instituciones", value: institutions.length, icon: Building2, color: "text-violet-500", bg: "bg-violet-500/8" },
          { label: "Total Estudiantes", value: stats.totalStudents.toLocaleString(), icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-500/8" },
          { label: "Ingresos Mensuales", value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/8" },
          { label: "Tasa Activos", value: institutions.length ? `${Math.round(stats.activeCount / institutions.length * 100)}%` : "0%", icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-500/8" },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly Growth */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-sb-surface rounded-2xl p-5 border border-sb-outline-variant/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-sb-on-surface-variant/40" />
              <h3 className="text-sm font-semibold text-sb-on-surface">Crecimiento de Instituciones</h3>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="h-3 w-3" />
              +{monthlyGrowth[monthlyGrowth.length - 1]?.count || 0} este mes
            </div>
          </div>
          {loading ? (
            <div className="h-[280px] bg-sb-surface-container/30 rounded-2xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Plan Distribution */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="bg-sb-surface rounded-2xl p-5 border border-sb-outline-variant/10">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="h-4 w-4 text-sb-on-surface-variant/40" />
            <h3 className="text-sm font-semibold text-sb-on-surface">Distribucion por Planes</h3>
          </div>
          {loading ? (
            <div className="h-[280px] bg-sb-surface-container/30 rounded-2xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Level Distribution */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
          className="bg-sb-surface rounded-2xl p-5 border border-sb-outline-variant/10">
          <div className="flex items-center gap-2 mb-4">
            <School className="h-4 w-4 text-sb-on-surface-variant/40" />
            <h3 className="text-sm font-semibold text-sb-on-surface">Por Nivel Educativo</h3>
          </div>
          <div className="space-y-2.5">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-10 bg-sb-surface-container/30 rounded-xl animate-pulse" />)
            ) : levelDistribution.length === 0 ? (
              <div className="text-center py-8">
                <School className="h-8 w-8 text-sb-on-surface-variant/15 mx-auto mb-2" />
                <p className="text-xs text-sb-on-surface-variant/40">Sin datos</p>
              </div>
            ) : levelDistribution.map((item, i) => {
              const max = levelDistribution[0]?.value || 1
              const pct = Math.round((item.value / max) * 100)
              return (
                <motion.div key={item.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.18 + i * 0.04 }}
                  className="flex items-center gap-3">
                  <span className="text-xs text-sb-on-surface/70 w-24 truncate shrink-0">{item.name}</span>
                  <div className="flex-1 h-7 bg-sb-surface-container/30 rounded-xl overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.2 + i * 0.05 }}
                      className="h-full rounded-xl"
                      style={{ background: COLORS[i % COLORS.length] + "30" }}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-sb-on-surface/60">
                      {item.value}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Type Distribution */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
          className="bg-sb-surface rounded-2xl p-5 border border-sb-outline-variant/10">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-4 w-4 text-sb-on-surface-variant/40" />
            <h3 className="text-sm font-semibold text-sb-on-surface">Por Tipo de Institucion</h3>
          </div>
          <div className="space-y-2.5">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-10 bg-sb-surface-container/30 rounded-xl animate-pulse" />)
            ) : typeDistribution.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-8 w-8 text-sb-on-surface-variant/15 mx-auto mb-2" />
                <p className="text-xs text-sb-on-surface-variant/40">Sin datos</p>
              </div>
            ) : typeDistribution.map((item, i) => {
              const max = typeDistribution[0]?.value || 1
              const pct = Math.round((item.value / max) * 100)
              return (
                <motion.div key={item.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.04 }}
                  className="flex items-center gap-3">
                  <span className="text-xs text-sb-on-surface/70 w-24 truncate shrink-0">{item.name || "Otro"}</span>
                  <div className="flex-1 h-7 bg-sb-surface-container/30 rounded-xl overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.2 + i * 0.05 }}
                      className="h-full rounded-xl"
                      style={{ background: COLORS[(i + 2) % COLORS.length] + "30" }}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-sb-on-surface/60">
                      {item.value}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Summary Cards */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Estudiantes Totales", value: stats.totalStudents.toLocaleString(), icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-500/8" },
          { label: "Docentes Totales", value: stats.totalTeachers.toLocaleString(), icon: UserCheck, color: "text-emerald-500", bg: "bg-emerald-500/8" },
          { label: "Colegios Activos", value: stats.activeCount, icon: School, color: "text-violet-500", bg: "bg-violet-500/8" },
          { label: "Colegios Inactivos", value: stats.inactiveCount, icon: FileText, color: "text-amber-500", bg: "bg-amber-500/8" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.03 }}
            className="bg-sb-surface rounded-2xl p-4 border border-sb-outline-variant/10">
            <div className={`h-8 w-8 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-sb-on-surface">{stat.value}</p>
            <p className="text-[11px] text-sb-on-surface-variant/40 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
