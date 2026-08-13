"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Clock, MapPin, Coffee, Calendar, BookOpen, GraduationCap, Check } from "@/components/ui/proicons"
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

  const metrics = [
    { icon: Calendar, label: "Jornada", value: "Lun – Vie" },
    { icon: BookOpen, label: "Clases", value: `${totalClasses}` },
    { icon: Clock, label: "Horas/semana", value: `${totalHours}` },
  ]

  return (
    <div className="sb-note">
      <div className="mx-auto w-full max-w-[1034px] px-2 pb-4 space-y-5">
        {/* Header */}
        <header className="pt-2">
          <h1 className="text-[26px] sm:text-[30px] leading-tight tracking-[-0.03em] text-[var(--note-text)]">Mis Horarios</h1>
          <p className="mt-1 text-sm text-[var(--note-muted)]">Tu horario de clases de la semana (Lunes a Viernes)</p>
        </header>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3">
          {metrics.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] p-6">
              <div className="h-10 w-10 rounded-[12px] bg-[var(--note-fill)] flex items-center justify-center">
                <Icon className="h-5 w-5 text-[var(--note-text)]" />
              </div>
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--note-muted)]">{label}</p>
              <p className="mt-1.5 text-[22px] font-bold leading-none tracking-tight text-[var(--note-text)]">{value}</p>
            </div>
          ))}
        </div>

        {/* Day pills */}
        <div className="nb-rail">
          {scheduleByDay.map(({ day, label, items }) => (
            <button key={day} onClick={() => setActiveDay(activeDay === day ? null : day)}
              className={cn(
                "nb-chip",
                activeDay === day && "active",
                todayDay === day && activeDay !== day && "is-today")}>
              <Check className="nb-chip-check" />
              <Calendar className="h-3.5 w-3.5 opacity-60" />
              <span className="text-xs font-medium">{label}</span>
              <span className="nb-chip-count">{items.length}</span>
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-[var(--note-hairline-strong)] border-t-[var(--note-text)] animate-spin" />
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {scheduleByDay.map(({ day, label, items }) => {
              if (activeDay !== null && activeDay !== day) return null
              const isToday = todayDay === day
              return (
                <div key={day} className={cn(
                  "rounded-[24px] border overflow-hidden",
                  isToday ? "border-[var(--note-hairline-strong)] bg-[var(--note-fill)]" : "border-[var(--note-hairline)] bg-[var(--note-surface)]")}>
                  <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--note-hairline)]">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-[var(--note-muted)]" />
                      <span className="text-sm font-semibold text-[var(--note-text)]">{label}</span>
                      {isToday && <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-[6px] bg-[var(--note-solid-bg)] text-[var(--note-solid-fg)]">Hoy</span>}
                    </div>
                  </div>
                  {items.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-xs text-[var(--note-muted)]/50">Sin clases</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--note-hairline)]">
                      {items.map((h, idx) => {
                        const next = items[idx + 1]
                        const gap = next ? toMin(next.start_time) - toMin(h.end_time) : null
                        const showRecess = gap !== null && isRecess(gap)
                        return (
                          <div key={h.id}>
                            <div className="px-4 py-3 transition-colors hover:bg-[var(--note-fill)]">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-[var(--note-text)] truncate">{h.course_name}</span>
                                    <span className="text-[10px] text-[var(--note-muted)]/50 shrink-0">{h.grade} {h.section}</span>
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 text-[10px] text-[var(--note-muted)] flex-wrap">
                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{h.start_time.slice(0, 5)} — {h.end_time.slice(0, 5)}</span>
                                    {h.classroom && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{h.classroom}</span>}
                                  </div>
                                </div>
                                <GraduationCap className="h-4 w-4 shrink-0 text-[var(--note-muted)]/30" />
                              </div>
                            </div>
                            {showRecess && (
                              <div className="px-4 py-1.5 flex items-center gap-2">
                                <div className="flex-1 h-px bg-[var(--note-hairline)]" />
                                <span className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-[var(--note-muted)]/50">
                                  <Coffee className="h-2.5 w-2.5" /> Receso {gap} min
                                </span>
                                <div className="flex-1 h-px bg-[var(--note-hairline)]" />
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
          <div className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] py-16 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-3 text-[var(--note-muted)]/40" />
            <p className="text-sm text-[var(--note-muted)]">Aún no tienes horarios asignados</p>
            <p className="text-xs text-[var(--note-muted)]/50 mt-1">El secretario asignará tus cursos y horarios</p>
          </div>
        )}
      </div>
    </div>
  )
}