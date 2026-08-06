"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { ClipboardList, Clock, CheckCircle2, Star, BookOpen, Calendar, AlertTriangle } from "@/components/ui/proicons"

interface Homework {
  id: string
  title: string
  subject: string
  description: string
  due_date: string
  status: string
  priority: string
  assigned_by: string
  grade?: number
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string; bg: string; dot: string }> = {
  pending: { icon: Clock, color: 'text-amber-600', label: 'Pendiente', bg: 'bg-amber-500/10', dot: 'bg-amber-500' },
  delivered: { icon: CheckCircle2, color: 'text-blue-600', label: 'Entregada', bg: 'bg-blue-500/10', dot: 'bg-blue-500' },
  graded: { icon: Star, color: 'text-emerald-600', label: 'Calificada', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500' },
}

const priorityConfig: Record<string, { color: string; label: string; bg: string }> = {
  high: { color: 'text-red-500', label: 'Alta', bg: 'bg-red-500/10' },
  medium: { color: 'text-amber-500', label: 'Media', bg: 'bg-amber-500/10' },
  low: { color: 'text-sb-on-surface-variant/40', label: 'Baja', bg: 'bg-sb-surface-container' },
}

export default function TareasPage() {
  const [tareas, setTareas] = React.useState<Homework[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'delivered' | 'graded'>('all')

  React.useEffect(() => {
    fetch("/api/padre/tareas")
      .then(r => r.json())
      .then(setTareas)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? tareas : tareas.filter(t => t.status === filter)
  const counts = {
    all: tareas.length,
    pending: tareas.filter(t => t.status === 'pending').length,
    delivered: tareas.filter(t => t.status === 'delivered').length,
    graded: tareas.filter(t => t.status === 'graded').length,
  }

  const tabs = [
    { key: 'all', label: 'Todas' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'delivered', label: 'Entregadas' },
    { key: 'graded', label: 'Calificadas' },
  ] as const

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="animate-pulse space-y-5">
          <div className="h-7 w-48 rounded-xl bg-sb-surface-container" />
          <div className="h-12 rounded-xl bg-sb-surface-container" />
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-32 rounded-2xl bg-sb-surface-container" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Tareas</h1>
        <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">Tareas asignadas y calificaciones</p>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === tab.key
                ? 'bg-sb-on-surface text-sb-surface'
                : 'bg-sb-surface-container text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high'
            }`}
          >
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
              filter === tab.key ? 'bg-white/20' : 'bg-sb-surface-container-high text-sb-on-surface-variant/40'
            }`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Task list */}
      <div className="space-y-3">
        {filtered.map((tarea, i) => {
          const sc = statusConfig[tarea.status] || statusConfig.pending
          const pc = priorityConfig[tarea.priority] || priorityConfig.medium
          const isOverdue = tarea.status === 'pending' && new Date(tarea.due_date) < new Date()

          return (
            <motion.div
              key={tarea.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 + i * 0.04 }}
              className={`bg-sb-surface rounded-2xl overflow-hidden ${
                isOverdue ? 'ring-1 ring-red-500/20' : ''
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </span>
                      {isOverdue && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-red-500/10 text-red-500">
                          <AlertTriangle className="h-3 w-3" /> Vencida
                        </span>
                      )}
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${pc.bg} ${pc.color}`}>
                        {pc.label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-sb-on-surface">{tarea.title}</p>
                    <p className="text-xs text-sb-on-surface-variant/40 mt-1 leading-relaxed line-clamp-2">{tarea.description}</p>
                  </div>
                  {tarea.grade !== undefined && (
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex flex-col items-center justify-center shrink-0">
                      <span className="text-lg font-bold text-emerald-600">{tarea.grade}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 px-5 py-3 bg-sb-surface-container/50">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3 w-3 text-sb-on-surface-variant/30" />
                  <span className="text-[10px] text-sb-on-surface-variant/40 font-medium">{tarea.subject}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-sb-on-surface-variant/30" />
                  <span className="text-[10px] text-sb-on-surface-variant/40 font-medium">
                    {new Date(tarea.due_date + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <span className="text-[10px] text-sb-on-surface-variant/25 ml-auto">{tarea.assigned_by}</span>
              </div>
            </motion.div>
          )
        })}
        {filtered.length === 0 && (
          <div className="bg-sb-surface rounded-2xl px-5 py-12 text-center">
            <ClipboardList className="h-10 w-10 text-sb-on-surface-variant/15 mx-auto mb-3" />
            <p className="text-sm text-sb-on-surface-variant/30">No hay tareas en esta categoría</p>
          </div>
        )}
      </div>
    </div>
  )
}
