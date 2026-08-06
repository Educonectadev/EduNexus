"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, MapPin, Clock, BookOpen, Users, PartyPopper, AlertTriangle, GraduationCap, X } from "@/components/ui/proicons"

interface CalendarEvent {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  type: string
  location: string
}

const staggerItem = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }

const typeConfig: Record<string, { icon: typeof Calendar; color: string; bg: string; label: string }> = {
  reunion: { icon: Users, color: 'text-blue-600', bg: 'bg-blue-500/10', label: 'Reunión' },
  examen: { icon: BookOpen, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Examen' },
  academico: { icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-500/10', label: 'Académico' },
  feriado: { icon: PartyPopper, color: 'text-purple-600', bg: 'bg-purple-500/10', label: 'Feriado' },
  evento: { icon: PartyPopper, color: 'text-amber-600', bg: 'bg-amber-500/10', label: 'Evento' },
  taller: { icon: AlertTriangle, color: 'text-cyan-600', bg: 'bg-cyan-500/10', label: 'Taller' },
}

export default function CalendarioPage() {
  const [events, setEvents] = React.useState<CalendarEvent[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedMonth, setSelectedMonth] = React.useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [selectedDay, setSelectedDay] = React.useState<number | null>(null)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch("/api/padre/calendario")
        const data = await r.json()
        if (!cancelled && Array.isArray(data)) setEvents(data)
        else if (!cancelled) setEvents([])
      } catch {}
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  const filteredEvents = events.filter(e => {
    const d = new Date(e.start_date)
    return d.getFullYear() === selectedMonth.year && d.getMonth() === selectedMonth.month
  }).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())

  const upcomingEvents = events.filter(e => new Date(e.start_date) >= new Date()).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).slice(0, 5)

  const prevMonth = () => {
    setSelectedMonth(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 }
      return { year: prev.year, month: prev.month - 1 }
    })
  }

  const nextMonth = () => {
    setSelectedMonth(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 }
      return { year: prev.year, month: prev.month + 1 }
    })
  }

  const firstDay = new Date(selectedMonth.year, selectedMonth.month, 1).getDay()
  const daysInMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate()
  const today = new Date()

  const calendarDays: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const hasEvent = (day: number) => {
    const dateStr = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.some(e => {
      const start = e.start_date
      const end = e.end_date || e.start_date
      return dateStr >= start && dateStr <= end
    })
  }

  const isToday = (day: number) => {
    return today.getFullYear() === selectedMonth.year && today.getMonth() === selectedMonth.month && today.getDate() === day
  }

  const getDayEvents = (day: number): CalendarEvent[] => {
    const dateStr = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => dateStr >= e.start_date && dateStr <= (e.end_date || e.start_date))
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="animate-pulse space-y-5">
          <div className="h-7 w-48 rounded-xl bg-sb-surface-container" />
          <div className="h-72 rounded-2xl bg-sb-surface-container" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Calendario</h1>
        <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">Eventos y actividades escolares</p>
      </motion.div>

      {/* Month selector + Calendar grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="bg-sb-surface rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-5">
          <button onClick={prevMonth} className="h-8 w-8 rounded-full bg-sb-surface-container flex items-center justify-center text-sb-on-surface-variant/50 hover:bg-sb-surface-container-high transition-colors">
            ←
          </button>
          <p className="text-sm font-medium text-sb-on-surface">
            {months[selectedMonth.month]} {selectedMonth.year}
          </p>
          <button onClick={nextMonth} className="h-8 w-8 rounded-full bg-sb-surface-container flex items-center justify-center text-sb-on-surface-variant/50 hover:bg-sb-surface-container-high transition-colors">
            →
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
            <div key={i} className="text-center text-[10px] text-sb-on-surface-variant/40 font-medium py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => (
            <button
              key={i}
              onClick={day !== null ? () => setSelectedDay(day) : undefined}
              disabled={day === null}
              className={`aspect-square flex items-center justify-center rounded-xl text-xs relative transition-colors ${
                day === null ? 'cursor-default' :
                isToday(day) ? 'bg-sb-on-surface text-sb-surface font-semibold cursor-pointer hover:opacity-80' :
                hasEvent(day) ? 'text-sb-on-surface font-medium cursor-pointer hover:bg-sb-surface-container' :
                'text-sb-on-surface-variant/40 cursor-pointer hover:bg-sb-surface-container'
              }`}
            >
              {day}
              {day && hasEvent(day) && !isToday(day) && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-sb-primary/60" />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Events for selected month */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-sb-surface rounded-2xl"
      >
        <div className="px-5 pt-5 pb-3">
          <p className="text-[10px] text-sb-on-surface-variant/40 font-medium uppercase tracking-wider">
            Eventos de {months[selectedMonth.month]}
          </p>
        </div>
        {filteredEvents.length > 0 ? (
          <div className="space-y-px">
            {filteredEvents.map((e, i) => {
              const cfg = typeConfig[e.type] || typeConfig.academico
              const startD = new Date(e.start_date + 'T12:00:00')
              const endD = new Date(e.end_date + 'T12:00:00')
              const isRange = e.start_date !== e.end_date

              return (
                <motion.div key={e.id} variants={staggerItem} initial="hidden" animate="show" transition={{ delay: 0.1 + i * 0.03 }} className="flex items-start gap-3 px-5 py-4 hover:bg-sb-surface-container-low/50 transition-colors">
                  <div className={`h-9 w-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                    <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-sb-on-surface">{e.title}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-sb-on-surface-variant/40 mt-1 leading-relaxed">{e.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-sb-on-surface-variant/30" />
                        <span className="text-[10px] text-sb-on-surface-variant/35">
                          {startD.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                          {isRange && ` — ${endD.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}`}
                        </span>
                      </div>
                      {e.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-sb-on-surface-variant/30" />
                          <span className="text-[10px] text-sb-on-surface-variant/35">{e.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="px-5 py-10 text-center">
            <Calendar className="h-10 w-10 text-sb-on-surface-variant/15 mx-auto mb-3" />
            <p className="text-sm text-sb-on-surface-variant/30">No hay eventos este mes</p>
          </div>
        )}
      </motion.div>

      {/* Upcoming quick view */}
      {upcomingEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-sb-surface rounded-2xl"
        >
          <div className="px-5 pt-5 pb-3">
            <p className="text-[10px] text-sb-on-surface-variant/40 font-medium uppercase tracking-wider">Próximos Eventos</p>
          </div>
          <div className="space-y-px">
            {upcomingEvents.map((e, i) => {
              const cfg = typeConfig[e.type] || typeConfig.academico
              const d = new Date(e.start_date + 'T12:00:00')
              const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

              return (
                <div key={e.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-sb-surface-container-low/50 transition-colors">
                  <div className={`h-9 w-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                    <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-sb-on-surface truncate">{e.title}</p>
                    <p className="text-[10px] text-sb-on-surface-variant/35 mt-0.5">
                      {d.toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long' })}
                    </p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    diffDays <= 3 ? 'bg-amber-500/15 text-amber-600' :
                    diffDays <= 7 ? 'bg-blue-500/15 text-blue-600' :
                    'bg-sb-surface-container text-sb-on-surface-variant/40'
                  }`}>
                    {diffDays === 0 ? 'Hoy' : diffDays === 1 ? 'Mañana' : `En ${diffDays} días`}
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Day events modal */}
      <AnimatePresence>
        {selectedDay !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4 md:p-6"
            onClick={() => setSelectedDay(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-sb-surface rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-sb-outline/10">
                <div>
                  <p className="text-sm font-semibold text-sb-on-surface">
                    {new Date(selectedMonth.year, selectedMonth.month, selectedDay).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-[10px] text-sb-on-surface-variant/40 font-medium uppercase tracking-wider mt-0.5">
                    Actividades del día
                  </p>
                </div>
                <button onClick={() => setSelectedDay(null)} className="h-8 w-8 rounded-xl bg-sb-surface-container flex items-center justify-center text-sb-on-surface-variant/50 hover:bg-sb-surface-container-high transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {getDayEvents(selectedDay).length > 0 ? (
                  <div className="divide-y divide-sb-outline/10">
                    {getDayEvents(selectedDay).map(e => {
                      const cfg = typeConfig[e.type] || typeConfig.academico
                      const startD = new Date(e.start_date + 'T12:00:00')
                      return (
                        <div key={e.id} className="flex items-start gap-3 px-5 py-4">
                          <div className={`h-9 w-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                            <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-sb-on-surface">{e.title}</p>
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                                {cfg.label}
                              </span>
                            </div>
                            <p className="text-xs text-sb-on-surface-variant/40 mt-1 leading-relaxed">{e.description}</p>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3 w-3 text-sb-on-surface-variant/30" />
                                <span className="text-[10px] text-sb-on-surface-variant/35">
                                  {startD.toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'short' })}
                                </span>
                              </div>
                              {e.location && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="h-3 w-3 text-sb-on-surface-variant/30" />
                                  <span className="text-[10px] text-sb-on-surface-variant/35">{e.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="px-5 py-10 text-center">
                    <Calendar className="h-10 w-10 text-sb-on-surface-variant/15 mx-auto mb-3" />
                    <p className="text-sm text-sb-on-surface-variant/30">No hay actividades este día</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
