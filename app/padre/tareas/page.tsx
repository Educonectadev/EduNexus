"use client"

import * as React from "react"
import {
  ClipboardList, Calendar, CheckCircle2, Clock, AlertTriangle,
  BookOpen, Eye, X, Sun, Moon, Check,
} from "@/components/ui/proicons"
import NotificationBell from "@/components/layout/notification-bell"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import { useTheme } from "next-themes"

interface Homework {
  id: string
  title: string
  description: string
  subject: string
  due_date: string
  status: string
  priority: string
  assigned_by: string
  student_id: string
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: 'Pendiente', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  delivered: { label: 'Entregada', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  graded: { label: 'Calificada', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
}

const priorityConfig: Record<string, { label: string; bg: string; text: string }> = {
  high: { label: 'Alta', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
  medium: { label: 'Media', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' },
  low: { label: 'Baja', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' },
}

export default function PadreTareasPage() {
  const user = useAuthStore((s) => s.user)
  const { theme, setTheme } = useTheme()
  const [tasks, setTasks] = React.useState<Homework[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState("all")
  const [detailTask, setDetailTask] = React.useState<Homework | null>(null)

  React.useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 8000)

    fetch("/api/padre/tareas", { signal: controller.signal })
      .then(r => r.json())
      .then(data => setTasks(Array.isArray(data) ? data : []))
      .catch(() => setTasks([]))
      .finally(() => {
        window.clearTimeout(timeout)
        setLoading(false)
      })

    return () => { window.clearTimeout(timeout); controller.abort() }
  }, [])

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.status === filter)
  const counts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === "pending").length,
    delivered: tasks.filter(t => t.status === "delivered").length,
    graded: tasks.filter(t => t.status === "graded").length,
  }

  return (
    <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-black dark:bg-[#1a1a1c]">
      <div className="p-6 md:p-8 pb-24 md:pb-8">
        {/* Header */}
        <header className="flex items-start justify-between mb-6 gap-4">
          <div>
            <p className="text-[14px] font-medium mb-1 text-[#a1a1aa]">Panel Padre</p>
            <h1 className="text-[36px] md:text-[48px] font-bold leading-tight text-[#f4f4f5]">Tareas</h1>
            <p className="text-[13px] mt-2 text-[#a1a1aa]">Tareas asignadas a tu hijo</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5">
                <div className="h-6 w-6 rounded-full flex items-center justify-center">
                  <span className="text-[9px] font-semibold text-[#f4f4f5]">
                    {user.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "P"}
                  </span>
                </div>
                <span className="text-sm md:text-base font-medium text-[#f4f4f5] whitespace-nowrap">{user.full_name}</span>
              </div>
            )}
            <NotificationBell />
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Cambiar tema" title="Cambiar tema" className="h-10 w-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity relative">
              <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-[#f4f4f5]" />
              <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-[#f4f4f5]" />
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Total", value: tasks.length, icon: ClipboardList, iconBg: "bg-black/5 dark:bg-white/10" },
            { label: "Pendientes", value: counts.pending, icon: Clock, iconBg: "bg-amber-500/15" },
            { label: "Entregadas", value: counts.delivered, icon: CheckCircle2, iconBg: "bg-blue-500/15" },
            { label: "Calificadas", value: counts.graded, icon: CheckCircle2, iconBg: "bg-emerald-500/15" },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="p-4 rounded-[20px] bg-white dark:bg-[#17171a] hover:shadow-lg transition-shadow">
                <div className={`h-9 w-9 rounded-xl ${s.iconBg} flex items-center justify-center mb-3`}>
                  <Icon className="h-4 w-4 text-[#666] dark:text-[#a1a1aa]" />
                </div>
                <p className="text-[11px] font-medium text-[#666] dark:text-[#a1a1aa] mb-1">{s.label}</p>
                <p className="text-[28px] font-bold text-[#000] dark:text-[#f4f4f5] leading-none">{s.value}</p>
              </div>
            )
          })}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/5 mb-5">
          {([
            { key: 'all', label: 'Todas' },
            { key: 'pending', label: 'Pendientes' },
            { key: 'delivered', label: 'Entregadas' },
            { key: 'graded', label: 'Calificadas' },
          ]).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={cn(
                "flex-1 h-10 text-[12px] font-semibold flex items-center justify-center gap-1.5 rounded-xl transition-all duration-200",
                filter === f.key
                  ? "bg-white text-black shadow-md"
                  : "text-[#a1a1aa] hover:text-white hover:bg-white/10"
              )}>
              <Check className="h-3.5 w-3.5" />
              {f.label}
              <span className="text-[10px] opacity-60">{counts[f.key as keyof typeof counts]}</span>
            </button>
          ))}
        </div>

        {/* Task list */}
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((t, i) => {
              const sc = statusConfig[t.status] || statusConfig.pending
              const pc = priorityConfig[t.priority] || priorityConfig.medium
              const daysLeft = Math.ceil((new Date(t.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              const isOverdue = t.status === 'pending' && daysLeft < 0

              return (
                <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  onClick={() => setDetailTask(t)}
                  className={cn(
                    "group rounded-[20px] bg-white dark:bg-[#17171a] overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg",
                    isOverdue && 'ring-1 ring-red-500/30'
                  )}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-xl", sc.bg, sc.text)}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", sc.dot)} />
                            {sc.label}
                          </span>
                          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-xl", pc.bg, pc.text)}>
                            {pc.label}
                          </span>
                          {isOverdue && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300">
                              <AlertTriangle className="h-3 w-3" /> Vencida
                            </span>
                          )}
                        </div>
                        <p className="text-[14px] font-bold text-[#000] dark:text-[#f4f4f5]">{t.title}</p>
                        {t.description && (
                          <p className="text-[12px] text-[#666] dark:text-[#a1a1aa] mt-1 line-clamp-2">{t.description}</p>
                        )}
                      </div>
                      <div className="h-9 w-9 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                        <Eye className="h-4 w-4 text-[#666] dark:text-[#a1a1aa]" />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-4 px-5 py-3 bg-black/[0.03] dark:bg-white/[0.03] border-t border-black/5 dark:border-white/5">
                    {t.subject && (
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-[#666] dark:text-[#a1a1aa]" />
                        <span className="text-[10px] text-[#666] dark:text-[#a1a1aa] font-medium">{t.subject}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#666] dark:text-[#a1a1aa]" />
                      <span className={cn(
                        "text-[10px] font-medium",
                        isOverdue ? 'text-red-400' : daysLeft <= 3 ? 'text-amber-400' : 'text-[#666] dark:text-[#a1a1aa]'
                      )}>
                        {isOverdue ? `Vencida hace ${Math.abs(daysLeft)} días` : daysLeft === 0 ? 'Vence hoy' : daysLeft === 1 ? 'Vence mañana' : `Vence en ${daysLeft} días`}
                      </span>
                    </div>
                    {t.assigned_by && (
                      <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-[10px] text-[#666] dark:text-[#a1a1aa] font-medium">Por: {t.assigned_by}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {!loading && filtered.length === 0 && (
            <div className="py-20 text-center rounded-[20px] bg-white dark:bg-[#17171a]">
              <div className="h-16 w-16 rounded-3xl bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="h-7 w-7 text-[#666] dark:text-[#a1a1aa]" />
              </div>
              <p className="text-sm font-medium text-[#000] dark:text-[#f4f4f5] mb-1">No hay tareas en esta categoría</p>
              <p className="text-xs text-[#666] dark:text-[#a1a1aa]">Las tareas asignadas por los docentes aparecerán aquí</p>
            </div>
          )}

          {loading && (
            <div className="py-20 text-center rounded-[20px] bg-white dark:bg-[#17171a]">
              <div className="h-8 w-8 border-2 border-black/10 dark:border-white/10 border-t-[#000] dark:border-t-white rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-[#666] dark:text-[#a1a1aa]">Cargando tareas...</p>
            </div>
          )}
        </div>

        {/* ===== DETAIL MODAL ===== */}
        <AnimatePresence>
          {detailTask && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setDetailTask(null)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
                transition={{ duration: 0.25, ease: [0.37, 0.35, 0, 1] }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-[520px] max-h-[90vh] overflow-y-auto rounded-[20px] bg-white dark:bg-[#1a1a1c] shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-5 pb-0">
                  <h2 className="text-[18px] font-bold text-[#000] dark:text-[#f4f4f5]">{detailTask.title}</h2>
                  <button onClick={() => setDetailTask(null)} className="h-8 w-8 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                    <X className="h-4 w-4 text-[#666] dark:text-[#a1a1aa]" />
                  </button>
                </div>
                {/* Modal Body */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-3">
                      <p className="text-[10px] text-[#666] dark:text-[#a1a1aa] uppercase tracking-wider mb-1">Estado</p>
                      <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-xl", (statusConfig[detailTask.status] || statusConfig.pending).bg, (statusConfig[detailTask.status] || statusConfig.pending).text)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", (statusConfig[detailTask.status] || statusConfig.pending).dot)} />
                        {(statusConfig[detailTask.status] || statusConfig.pending).label}
                      </span>
                    </div>
                    <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-3">
                      <p className="text-[10px] text-[#666] dark:text-[#a1a1aa] uppercase tracking-wider mb-1">Prioridad</p>
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-xl", (priorityConfig[detailTask.priority] || priorityConfig.medium).bg, (priorityConfig[detailTask.priority] || priorityConfig.medium).text)}>
                        {(priorityConfig[detailTask.priority] || priorityConfig.medium).label}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-3">
                    <p className="text-[10px] text-[#666] dark:text-[#a1a1aa] uppercase tracking-wider mb-1">Fecha de vencimiento</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-[#666] dark:text-[#a1a1aa]" />
                      <span className="text-[12px] font-medium text-[#000] dark:text-[#f4f4f5]">
                        {new Date(detailTask.due_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {detailTask.subject && (
                    <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-3">
                      <p className="text-[10px] text-[#666] dark:text-[#a1a1aa] uppercase tracking-wider mb-1">Asignatura</p>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5 text-[#666] dark:text-[#a1a1aa]" />
                        <span className="text-[12px] font-medium text-[#000] dark:text-[#f4f4f5]">{detailTask.subject}</span>
                      </div>
                    </div>
                  )}

                  {detailTask.assigned_by && (
                    <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-3">
                      <p className="text-[10px] text-[#666] dark:text-[#a1a1aa] uppercase tracking-wider mb-1">Asignada por</p>
                      <span className="text-[12px] font-medium text-[#000] dark:text-[#f4f4f5]">{detailTask.assigned_by}</span>
                    </div>
                  )}

                  {detailTask.description && (
                    <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-3">
                      <p className="text-[10px] text-[#666] dark:text-[#a1a1aa] uppercase tracking-wider mb-1">Descripción</p>
                      <p className="text-[12px] text-[#000] dark:text-[#f4f4f5] whitespace-pre-line leading-relaxed">{detailTask.description}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
