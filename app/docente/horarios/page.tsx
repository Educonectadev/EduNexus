"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Clock, MapPin, Coffee, Calendar, BookOpen, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"

interface Horario {
  id: string; course_id: string; day_of_week: number; start_time: string; end_time: string
  classroom: string; status: string; course_name: string; course_code: string; grade: string; section: string
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m }
const isRecess = (gap: number) => gap >= 5 && gap <= 30

export default function DocenteHorariosPage() {
  const [horarios, setHorarios] = React.useState<Horario[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeDay, setActiveDay] = React.useState<number | null>(null)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch("/api/docente/horarios")
        if (!cancelled && r.ok) setHorarios(await r.json())
      } catch {}
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  const todayIdx = new Date().getDay()
  const todayDay = todayIdx >= 1 && todayIdx <= 5 ? todayIdx : null

  const scheduleByDay = DAYS.map((_, i) => {
    const day = i + 1
    const items = horarios.filter(h => h.day_of_week === day).sort((a, b) => a.start_time.localeCompare(b.start_time))
    return { day, label: DAYS[i], items }
  })

  const totalClasses = horarios.length
  const totalHours = Math.round((horarios.reduce((acc, h) => acc + (toMin(h.end_time) - toMin(h.start_time)), 0) / 60) * 10) / 10

  return (
    <div className="w-full space-y-6 py-2">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--sb-on-surface)]">Mis Horarios</h2>
        <p className="text-sm text-[var(--sb-on-surface-variant)]/50 mt-1">Tu horario de clases de la semana (Lunes a Viernes)</p>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Calendar, label: "Jornada", value: "Lun – Vie" },
          { icon: BookOpen, label: "Clases", value: `${totalClasses}` },
          { icon: Clock, label: "Horas/semana", value: `${totalHours}` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-[var(--sb-surface-container)] rounded-[6px] p-4">
            <Icon className="h-4 w-4 text-[var(--sb-primary)]" />
            <p className="text-lg font-semibold text-[var(--sb-on-surface)] mt-2">{value}</p>
            <p className="text-[11px] text-[var(--sb-on-surface-variant)]/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {scheduleByDay.map(({ day, label, items }) => (
          <button key={day} onClick={() => setActiveDay(activeDay === day ? null : day)}
            className={cn("flex items-center gap-2 px-4 py-2.5 rounded-[6px] transition-all whitespace-nowrap",
              activeDay === day
                ? "bg-[var(--sb-on-surface)] text-[var(--sb-surface)]"
                : todayDay === day
                  ? "bg-[var(--sb-surface-container)] text-[var(--sb-primary)] ring-1 ring-[var(--sb-primary)]/40"
                  : "bg-[var(--sb-surface-container)] text-[var(--sb-on-surface-variant)] hover:bg-[var(--sb-surface-container-high)]/70")}>
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{label}</span>
            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-[6px]",
              items.length > 0 ? "bg-emerald-400/10 text-emerald-400/70" : "text-[var(--sb-on-surface-variant)]/30")}>
              {items.length}
            </span>
          </button>
        ))}
      </div>

      {loading && <div className="flex justify-center py-16"><div className="w-6 h-6 rounded-full border-2 border-[var(--sb-outline-variant)] border-t-[var(--sb-primary)] animate-spin" /></div>}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {scheduleByDay.map(({ day, label, items }) => {
            if (activeDay !== null && activeDay !== day) return null
            const isToday = todayDay === day
            return (
              <div key={day} className={cn("rounded-[6px] overflow-hidden",
                isToday ? "bg-[var(--sb-surface-container)] ring-1 ring-[var(--sb-primary)]/30" : "bg-[var(--sb-surface-container)]")}>
                <div className={cn("px-4 py-3 flex items-center justify-between border-b",
                  isToday ? "border-[var(--sb-primary)]/20" : "border-[var(--sb-outline-variant)]/10")}>
                  <div className="flex items-center gap-2">
                    <Calendar className={cn("h-3.5 w-3.5", isToday ? "text-[var(--sb-primary)]" : "text-[var(--sb-on-surface-variant)]/40")} />
                    <span className={cn("text-sm font-semibold", isToday ? "text-[var(--sb-primary)]" : "text-[var(--sb-on-surface)]/80")}>{label}</span>
                    {isToday && <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-[6px] bg-[var(--sb-primary)]/10 text-[var(--sb-primary)]">Hoy</span>}
                  </div>
                </div>
                {items.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-xs text-[var(--sb-on-surface-variant)]/30">Sin clases</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--sb-outline-variant)]/10">
                    {items.map((h, idx) => {
                      const next = items[idx + 1]
                      const gap = next ? toMin(next.start_time) - toMin(h.end_time) : null
                      const showRecess = gap !== null && isRecess(gap)
                      return (
                        <div key={h.id}>
                          <div className="px-4 py-3 hover:bg-[var(--sb-surface-container-high)]/40 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-[var(--sb-on-surface)]/90 truncate">{h.course_name}</span>
                                  <span className="text-[10px] font-mono text-[var(--sb-on-surface-variant)]/30 shrink-0">{h.grade} {h.section}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-[10px] text-[var(--sb-on-surface-variant)]/40 flex-wrap">
                                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{h.start_time.slice(0, 5)} — {h.end_time.slice(0, 5)}</span>
                                  {h.classroom && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{h.classroom}</span>}
                                </div>
                              </div>
                              <GraduationCap className="h-4 w-4 shrink-0 text-[var(--sb-on-surface-variant)]/20" />
                            </div>
                          </div>
                          {showRecess && (
                            <div className="px-4 py-1.5 flex items-center gap-2 bg-[var(--sb-surface)]/30">
                              <div className="flex-1 h-px bg-[var(--sb-outline-variant)]/20" />
                              <span className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-[var(--sb-on-surface-variant)]/30">
                                <Coffee className="h-2.5 w-2.5" /> Receso {gap} min
                              </span>
                              <div className="flex-1 h-px bg-[var(--sb-outline-variant)]/20" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!loading && horarios.length === 0 && (
        <div className="text-center py-16">
          <Calendar className="h-8 w-8 mx-auto mb-3 text-[var(--sb-on-surface-variant)]/20" />
          <p className="text-sm text-[var(--sb-on-surface-variant)]/50">Aún no tienes horarios asignados</p>
          <p className="text-xs text-[var(--sb-on-surface-variant)]/30 mt-1">El secretario asignará tus cursos y horarios</p>
        </div>
      )}
    </div>
  )
}
