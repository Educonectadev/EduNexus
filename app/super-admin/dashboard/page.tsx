"use client"

import * as React from "react"
import { Building2, Users, DollarSign, UserPlus, TrendingUp, TrendingDown, School, CreditCard, Download } from "@/components/ui/proicons"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts"
import { motion } from "framer-motion"
import { DashboardView } from "@/components/dashboard/dashboard-view"

const revenueData = [
  { month: "Ene", revenue: 32000 },
  { month: "Feb", revenue: 35000 },
  { month: "Mar", revenue: 38000 },
  { month: "Abr", revenue: 42000 },
  { month: "May", revenue: 45230 },
  { month: "Jun", revenue: 48000 },
]

const institutionsData = [
  { month: "Ene", count: 120 },
  { month: "Feb", count: 125 },
  { month: "Mar", count: 132 },
  { month: "Abr", count: 138 },
  { month: "May", count: 145 },
  { month: "Jun", count: 148 },
]

const recentInstitutions = [
  { name: "Colegio San Martín", plan: "Pro", status: "active" },
  { name: "IEP Santa María", plan: "Básico", status: "active" },
  { name: "Colegio Los Andes", plan: "Enterprise", status: "active" },
  { name: "IEP San Juan", plan: "Básico", status: "inactive" },
  { name: "Colegio Nacional", plan: "Pro", status: "active" },
]

const stats = [
  { label: "Instituciones", value: "148", trend: "+12%", icon: Building2, color: "bg-violet-500/10" },
  { label: "Usuarios Activos", value: "12,847", trend: "+8%", icon: Users, color: "bg-blue-500/10" },
  { label: "Ingresos Mensuales", value: "S/ 45,230", trend: "+15%", icon: DollarSign, color: "bg-emerald-500/10" },
  { label: "Nuevos Usuarios", value: "+234", trend: "+5%", icon: UserPlus, color: "bg-amber-500/10" },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--sb-surface-container)] border border-sb-outline-variant/20 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-xl">
        <p className="text-xs text-sb-on-surface/40 mb-1">{label}</p>
        <p className="text-sm font-semibold text-sb-on-surface">
          {payload[0].name === "revenue" ? `S/ ${payload[0].value.toLocaleString()}` : payload[0].value}
        </p>
      </div>
    )
  }
  return null
}

export default function SuperAdminDashboard() {
  const [downloadingCarnet, setDownloadingCarnet] = React.useState(false)

  const handleDownloadCarnet = async () => {
    setDownloadingCarnet(true)
    try {
      const res = await fetch('/api/dev/carnet')
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'carnet-dev.pdf'
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (e) {
      console.error('Error downloading carnet:', e)
    } finally {
      setDownloadingCarnet(false)
    }
  }

  return (
    <DashboardView
      title="Dashboard"
      description="Vista general de la plataforma Educonecta"
      stats={stats}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-[var(--sb-surface-container)] rounded-[24px] p-6 border border-sb-outline-variant/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-semibold text-sb-on-surface/40 uppercase tracking-[0.5px]">Mi Carnet</h3>
              <button
                onClick={handleDownloadCarnet}
                disabled={downloadingCarnet}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-xs font-medium hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
              >
                <CreditCard className="h-4 w-4" />
                {downloadingCarnet ? 'Generando...' : 'Descargar Carnet'}
              </button>
            </div>
            <p className="text-sm text-sb-on-surface/60">Tu carnet de desarrollador con acceso total al sistema</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-[var(--sb-surface-container)] rounded-[24px] p-6 border border-sb-outline-variant/20">
            <h3 className="text-[11px] font-semibold text-sb-on-surface/40 uppercase tracking-[0.5px] mb-4">Ingresos Mensuales</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={2.5} dot={{ fill: '#8B5CF6', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#8B5CF6', stroke: '#000', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="bg-[var(--sb-surface-container)] rounded-[24px] p-6 border border-sb-outline-variant/20">
            <h3 className="text-[11px] font-semibold text-sb-on-surface/40 uppercase tracking-[0.5px] mb-4">Instituciones Registradas</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={institutionsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="bg-[var(--sb-surface-container)] rounded-[24px] overflow-hidden border border-sb-outline-variant/20">
          <div className="px-6 pt-5 pb-3">
            <h3 className="text-[11px] font-semibold text-sb-on-surface/40 uppercase tracking-[0.5px]">Instituciones Recientes</h3>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {recentInstitutions.map((inst) => (
              <div key={inst.name} className="flex items-center justify-between px-6 py-4 hover:bg-sb-surface-container-highest/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-sb-surface-container-highest flex items-center justify-center">
                    <School className="h-[18px] w-[18px] text-sb-on-surface/40" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-sb-on-surface/80">{inst.name}</p>
                    <p className="text-[11px] text-sb-on-surface/30">Plan {inst.plan}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-3 py-1.5 rounded-full ${
                  inst.status === "active"
                    ? "bg-green-500/10 text-green-400"
                    : "bg-sb-surface-container-highest text-sb-on-surface/30"
                }`}>
                  {inst.status === "active" ? "Activo" : "Inactivo"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </DashboardView>
  )
}
