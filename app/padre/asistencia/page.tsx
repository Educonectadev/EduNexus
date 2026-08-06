"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { UserCheck, Calendar, Clock, AlertTriangle, CheckCircle2, XCircle, TrendingUp } from "@/components/ui/proicons"

interface AttendanceRecord {
  date: string
  status: string
  entry_time: string
  exit_time: string
  observation: string
}

interface AttendanceSummary {
  total_days: number
  present: number
  absent: number
  tardy: number
  pct: number
}

const staggerItem = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string; bg: string; dot: string }> = {
  present: { icon: CheckCircle2, color: 'text-emerald-600', label: 'Presente', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500' },
  absent: { icon: XCircle, color: 'text-red-500', label: 'Ausente', bg: 'bg-red-500/10', dot: 'bg-red-500' },
  tardy: { icon: Clock, color: 'text-amber-600', label: 'Tardanza', bg: 'bg-amber-500/10', dot: 'bg-amber-500' },
}

export default function AsistenciaPage() {
  const [records, setRecords] = React.useState<AttendanceRecord[]>([])
  const [summary, setSummary] = React.useState<AttendanceSummary | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/padre/asistencia")
      .then(r => r.json())
      .then(data => {
        if (data.summary) {
          setSummary(data.summary)
          setRecords(data.records)
        } else if (Array.isArray(data)) {
          const present = data.filter((r: AttendanceRecord) => r.status === 'present').length
          const absent = data.filter((r: AttendanceRecord) => r.status === 'absent').length
          const tardy = data.filter((r: AttendanceRecord) => r.status === 'tardy').length
          setSummary({ total_days: data.length, present, absent, tardy, pct: data.length > 0 ? Math.round((present / data.length) * 100) : 0 })
          setRecords(data)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="animate-pulse space-y-5">
          <div className="h-7 w-48 rounded-xl bg-sb-surface-container" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl bg-sb-surface-container" />)}
          </div>
          <div className="h-20 rounded-2xl bg-sb-surface-container" />
          <div className="h-48 rounded-2xl bg-sb-surface-container" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Asistencia</h1>
        <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">Registro de asistencia del mes actual</p>
      </motion.div>

      {/* Summary cards */}
      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summary && [
          { label: 'Total Días', value: summary.total_days, icon: Calendar, color: 'text-sb-on-surface', bg: 'bg-sb-on-surface/8' },
          { label: 'Presentes', value: summary.present, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/8' },
          { label: 'Ausencias', value: summary.absent, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/8' },
          { label: 'Tardanzas', value: summary.tardy, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500/8' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <motion.div key={stat.label} variants={staggerItem} className="bg-sb-surface rounded-2xl p-4">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-3 ${stat.bg}`}>
                <Icon className={`h-4.5 w-4.5 ${stat.color}`} />
              </div>
              <p className="text-xl font-bold tracking-tight text-sb-on-surface">{stat.value}</p>
              <p className="text-[11px] text-sb-on-surface-variant/45 mt-0.5">{stat.label}</p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Attendance bar */}
      {summary && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <div className="bg-sb-surface rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  summary.pct >= 90 ? 'bg-emerald-500/10' : summary.pct >= 75 ? 'bg-amber-500/10' : 'bg-red-500/10'
                }`}>
                  <TrendingUp className={`h-4 w-4 ${
                    summary.pct >= 90 ? 'text-emerald-600' : summary.pct >= 75 ? 'text-amber-600' : 'text-red-500'
                  }`} />
                </div>
                <span className="text-xs font-semibold text-sb-on-surface uppercase tracking-wider">Asistencia</span>
              </div>
              <span className={`text-xl font-bold ${
                summary.pct >= 90 ? 'text-emerald-600' : summary.pct >= 75 ? 'text-amber-600' : 'text-red-500'
              }`}>{summary.pct}%</span>
            </div>
            <div className="h-3 rounded-full bg-sb-surface-container overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${summary.pct}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className={`h-full rounded-full ${
                  summary.pct >= 90 ? 'bg-emerald-400' :
                  summary.pct >= 75 ? 'bg-amber-400' :
                  'bg-red-400'
                }`}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-sb-on-surface-variant/30">0%</span>
              <span className="text-[10px] text-sb-on-surface-variant/30">100%</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Records */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
        <div className="bg-sb-surface rounded-2xl overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">Registro Detallado</p>
          </div>
          <div className="space-y-px">
            {records.map((r, i) => {
              const cfg = statusConfig[r.status] || statusConfig.present
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.03 }}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-sb-surface-container-low/50 transition-colors"
                >
                  <div className={`h-9 w-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                    <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-sb-on-surface">
                        {new Date(r.date + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long' })}
                      </p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    {r.entry_time && (
                      <p className="text-[10px] text-sb-on-surface-variant/40 mt-1">
                        Entrada: {r.entry_time} · Salida: {r.exit_time}
                      </p>
                    )}
                    {r.observation && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                        <p className="text-[10px] text-amber-600">{r.observation}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
            {records.length === 0 && (
              <div className="px-5 py-10 text-center">
                <Calendar className="h-10 w-10 text-sb-on-surface-variant/15 mx-auto mb-3" />
                <p className="text-sm text-sb-on-surface-variant/30">No hay registros este mes</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
