"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, MapPin, Coffee, Calendar, BookOpen, GraduationCap, X, Users } from "@/components/ui/proicons"
import { cn } from "@/lib/utils"

interface Horario {
  id: string; course_id: string; day_of_week: number; start_time: string; end_time: string
  classroom: string; status: string; course_name: string; course_code: string; grade: string; section: string
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m }
const isRecess = (gap: number) => gap >= 5 && gap <= 30

function ScheduleDetailModal({ horario, open, onClose }: { horario: Horario | null; open: boolean; onClose: () => void }) {
  if (!horario) return null

  const duration = toMin(horario.end_time) - toMin(horario.start_time)
  const hours = Math.floor(duration / 60)
  const mins = duration % 60
  const durationStr = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}min` : ""}` : `${mins}min`

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.37, 0.35, 0, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              className="bg-background border border-foreground/10 rounded-2xl w-full max-w-md overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-foreground/10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono text-muted-foreground">{DAYS[horario.day_of_week - 1]}</p>
                  <h2 className="text-xl font-display tracking-tight mt-1">{horario.course_name}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-foreground/5 transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-5 space-y-5">
                {/* Time Block */}
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-foreground/5 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-foreground/70" />
                  </div>
                  <div>
                    <p className="text-2xl font-display tracking-tight">
                      {horario.start_time.slice(0, 5)} — {horario.end_time.slice(0, 5)}
                    </p>
                    <p className="text-sm text-muted-foreground font-mono">{durationStr} de duración</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-foreground/5">
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-mono text-muted-foreground">Grado</span>
                    </div>
                    <p className="text-lg font-display">{horario.grade} &quot;{horario.section}&quot;</p>
                  </div>
                  <div className="p-4 rounded-xl bg-foreground/5">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-mono text-muted-foreground">Aula</span>
                    </div>
                    <p className="text-lg font-display">{horario.classroom || "Sin asignar"}</p>
                  </div>
                </div>

                {/* Course Info */}
                <div className="p-4 rounded-xl border border-foreground/10">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-foreground/5 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-foreground/70" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{horario.course_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{horario.course_code}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-foreground/10 bg-foreground/5">
                <p className="text-xs text-muted-foreground text-center">
                  Horario recurrente cada {DAYS[horario.day_of_week - 1]}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default function DocenteHorariosPage() {
  const [horarios, setHorarios] = React.useState<Horario[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeDay, setActiveDay] = React.useState<number | null>(null)
  const [selectedHorario, setSelectedHorario] = React.useState<Horario | null>(null)
  const [modalOpen, setModalOpen] = React.useState(false)

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

  const handleHorarioClick = (h: Horario) => {
    setSelectedHorario(h)
    setModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12 lg:py-16">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 lg:mb-16"
        >
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-4">
            <span className="w-8 h-px bg-foreground/30" />
            Panel Docente
          </span>
          <h1 className="text-4xl lg:text-5xl font-display tracking-tight">
            Mis Horarios
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-xl">
            Tu horario de clases de la semana
          </p>
        </motion.header>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-3 gap-px bg-foreground/10 rounded-2xl overflow-hidden mb-12 lg:mb-16"
        >
          {[
            { label: "Jornada", value: "Lun – Vie", icon: Calendar },
            { label: "Clases", value: `${totalClasses}`, icon: BookOpen },
            { label: "Horas/semana", value: `${totalHours}h`, icon: Clock },
          ].map((stat) => (
            <div key={stat.label} className="bg-background p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-4">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-mono text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-3xl lg:text-4xl font-display tracking-tight">{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Day Filters */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex items-center gap-2 mb-8 overflow-x-auto pb-2"
        >
          <button
            onClick={() => setActiveDay(null)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0",
              activeDay === null
                ? "bg-foreground text-background"
                : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10"
            )}
          >
            Todos
          </button>
          {scheduleByDay.map(({ day, label, items }) => (
            <button
              key={day}
              onClick={() => setActiveDay(activeDay === day ? null : day)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 flex items-center gap-2",
                activeDay === day
                  ? "bg-foreground text-background"
                  : todayDay === day
                    ? "bg-foreground/10 text-foreground"
                    : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10"
              )}
            >
              {label}
              <span className="font-mono text-xs opacity-60">{items.length}</span>
            </button>
          ))}
        </motion.div>

        {/* Schedule Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-px bg-foreground/10 rounded-2xl overflow-hidden">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-background p-6 animate-pulse">
                <div className="h-5 w-24 rounded bg-foreground/5 mb-6" />
                <div className="space-y-4">
                  <div className="h-16 rounded-xl bg-foreground/5" />
                  <div className="h-16 rounded-xl bg-foreground/5" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-px bg-foreground/10 rounded-2xl overflow-hidden">
            {scheduleByDay.map(({ day, label, items }) => {
              if (activeDay !== null && activeDay !== day) return null
              const isToday = todayDay === day
              return (
                <div key={day} className={cn("bg-background", isToday && "bg-foreground/5")}>
                  {/* Day Header */}
                  <div className="px-5 py-4 border-b border-foreground/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-display">{label}</span>
                    </div>
                    {isToday && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-foreground text-background">
                        HOY
                      </span>
                    )}
                  </div>

                  {/* Classes */}
                  {items.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <p className="text-sm text-muted-foreground/50">Sin clases</p>
                    </div>
                  ) : (
                    <div className="p-3 space-y-2">
                      {items.map((h, idx) => {
                        const next = items[idx + 1]
                        const gap = next ? toMin(next.start_time) - toMin(h.end_time) : null
                        const showRecess = gap !== null && isRecess(gap)
                        return (
                          <React.Fragment key={h.id}>
                            <button
                              onClick={() => handleHorarioClick(h)}
                              className="w-full text-left p-4 rounded-xl border border-foreground/10 hover:border-foreground/20 hover:bg-foreground/5 transition-all group"
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="text-sm font-display group-hover:translate-x-0.5 transition-transform">
                                  {h.course_name}
                                </h3>
                                <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                                  {h.grade} {h.section}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="h-3 w-3" />
                                  <span className="font-mono">{h.start_time.slice(0, 5)} — {h.end_time.slice(0, 5)}</span>
                                </span>
                                {h.classroom && (
                                  <span className="flex items-center gap-1.5">
                                    <MapPin className="h-3 w-3" />
                                    {h.classroom}
                                  </span>
                                )}
                              </div>
                            </button>
                            {showRecess && (
                              <div className="flex items-center gap-2 px-2 py-1">
                                <div className="flex-1 h-px bg-foreground/10" />
                                <span className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-muted-foreground/40">
                                  <Coffee className="h-2.5 w-2.5" /> Receso {gap}m
                                </span>
                                <div className="flex-1 h-px bg-foreground/10" />
                              </div>
                            )}
                          </React.Fragment>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && horarios.length === 0 && (
          <div className="py-20 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Aún no tienes horarios asignados</p>
            <p className="text-sm text-muted-foreground/60 mt-2">El secretario asignará tus cursos y horarios</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <ScheduleDetailModal
        horario={selectedHorario}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedHorario(null) }}
      />
    </div>
  )
}
