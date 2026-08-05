"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Clock, BookOpen, MapPin, Video, Calendar as CalendarIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface CalEvent {
  id: string
  title: string
  subtitle: string | null
  type: "class" | "meeting" | "exam" | "event" | "virtual"
  day_of_week?: number
  start_time: string | null
  end_time?: string | null
  classroom?: string | null
  course_id?: string | null
  date: string | null
  location?: string | null
  meeting_url?: string | null
  platform?: string | null
}

const typeColors: Record<string, string> = {
  class: "bg-blue-500/10 text-blue-400",
  meeting: "bg-violet-500/10 text-violet-400",
  exam: "bg-red-500/10 text-red-400",
  event: "bg-emerald-500/10 text-emerald-400",
  virtual: "bg-cyan-500/10 text-cyan-400",
}

const typeLabels: Record<string, string> = { class: "Clase", meeting: "Reunión", exam: "Examen", event: "Evento", virtual: "Clase virtual" }

const WEEK_DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

export default function CalendarioPage() {
  const [events, setEvents] = React.useState<CalEvent[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const today = new Date()
  const [currentMonth, setCurrentMonth] = React.useState(today.getMonth())
  const [currentYear, setCurrentYear] = React.useState(today.getFullYear())

  React.useEffect(() => {
    let cancelled = false
    fetch("/api/docente/calendario")
      .then(async r => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || "Error al cargar")
        if (!cancelled) setEvents(Array.isArray(data.events) ? data.events : [])
      })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDay = new Date(currentYear, currentMonth, 1).getDay()
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

  const datedEvents = events.filter(e => e.date)
  const weeklyClasses = events.filter(e => e.type === "class" && e.day_of_week)

  const eventsOnDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return datedEvents.filter(e => e.date === dateStr)
  }

  const upcomingEvents = datedEvents
    .filter(e => new Date(e.date! + "T00:00:00") >= today)
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
    .slice(0, 6)

  return (
    <div className="w-full space-y-6 py-2">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--sb-on-surface)]">Calendario</h2>
        <p className="text-sm text-[var(--sb-on-surface-variant)]/50 mt-1">Tu horario semanal y eventos de la institución</p>
      </motion.div>

      {error && (
        <div className="rounded-[6px] bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-40 rounded-[6px] bg-[var(--sb-surface-container)]" />
          <div className="h-64 rounded-[6px] bg-[var(--sb-surface-container)]" />
        </div>
      ) : (
        <>
          {/* Weekly schedule */}
          {weeklyClasses.length > 0 && (
            <div className="bg-[var(--sb-surface-container)] rounded-[6px] p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-[var(--sb-primary)]/60" />
                <p className="text-sm font-semibold text-[var(--sb-on-surface)]">Horario semanal</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {WEEK_DAYS.map((day, idx) => {
                  const dayEvents = weeklyClasses.filter(e => e.day_of_week === idx + 1).sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""))
                  return (
                    <div key={day} className="rounded-[6px] bg-[var(--sb-surface-container-high)]/50 p-3 min-h-[90px]">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--sb-on-surface-variant)]/40 mb-2">{day}</p>
                      {dayEvents.length === 0 ? (
                        <p className="text-[11px] text-[var(--sb-on-surface-variant)]/25">Libre</p>
                      ) : (
                        <div className="space-y-1.5">
                          {dayEvents.map(e => (
                            <div key={e.id} className="rounded-[6px] bg-blue-500/10 px-2 py-1.5">
                              <p className="text-[11px] font-medium text-[var(--sb-on-surface)]/80 truncate">{e.start_time} · {e.title}</p>
                              {e.subtitle && <p className="text-[10px] text-[var(--sb-on-surface-variant)]/40 truncate">{e.subtitle}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Calendar grid */}
          <div className="bg-[var(--sb-surface-container)] rounded-[6px] p-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) } else setCurrentMonth(m => m - 1) }} className="p-2 rounded-[6px] hover:bg-[var(--sb-surface-container-high)] transition-colors">
                <ChevronLeft className="h-4 w-4 text-[var(--sb-on-surface-variant)]" />
              </button>
              <p className="text-sm font-medium text-[var(--sb-on-surface)]">{monthNames[currentMonth]} {currentYear}</p>
              <button onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) } else setCurrentMonth(m => m + 1) }} className="p-2 rounded-[6px] hover:bg-[var(--sb-surface-container-high)] transition-colors">
                <ChevronRight className="h-4 w-4 text-[var(--sb-on-surface-variant)]" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {dayNames.map(d => <div key={d} className="text-center text-[10px] text-[var(--sb-on-surface-variant)]/40 font-medium py-1">{d}</div>)}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayEvents = eventsOnDay(day)
                const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
                return (
                  <div key={day} className={cn("relative flex flex-col items-center py-2 rounded-[6px] text-sm transition-colors", isToday ? "bg-[var(--sb-primary)] text-[var(--sb-on-primary)]" : "text-[var(--sb-on-surface)]/70 hover:bg-[var(--sb-surface-container-high)]")}>
                    {day}
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayEvents.slice(0, 3).map((e, j) => <div key={j} className={cn("h-1 w-1 rounded-[6px]", isToday ? "bg-white/80" : typeColors[e.type]?.split(" ")[1] || "bg-[var(--sb-primary)]")} />)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-[var(--sb-outline-variant)]/15">
              {Object.keys(typeLabels).map(t => (
                <span key={t} className="flex items-center gap-1.5 text-[10px] text-[var(--sb-on-surface-variant)]/50">
                  <span className={cn("h-2 w-2 rounded-[6px]", typeColors[t].split(" ")[1])} /> {typeLabels[t]}
                </span>
              ))}
            </div>
          </div>

          {/* Upcoming events */}
          <div className="space-y-3">
            <p className="text-[10px] font-medium text-[var(--sb-on-surface-variant)]/40 uppercase tracking-wider px-1">Próximos eventos</p>
            {upcomingEvents.length === 0 && (
              <div className="bg-[var(--sb-surface-container)] rounded-[6px] py-8 text-center text-sm text-[var(--sb-on-surface-variant)]/30">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-[var(--sb-on-surface-variant)]/15" />
                Sin eventos próximos
              </div>
            )}
            <AnimatePresence>
              {upcomingEvents.map((e, i) => (
                <motion.div key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-[var(--sb-surface-container)] rounded-[6px] p-4 flex items-center gap-4">
                  <div className={cn("h-10 w-10 rounded-[6px] flex items-center justify-center shrink-0", typeColors[e.type])}>
                    {e.type === "virtual" ? <Video className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--sb-on-surface)]/80 truncate">{e.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--sb-on-surface-variant)]/40 flex-wrap">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(e.date! + "T00:00:00").toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" })}{e.start_time ? ` · ${e.start_time}` : ""}</span>
                      {e.location && (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</span>
                      )}
                    </div>
                  </div>
                  {e.meeting_url ? (
                    <a href={e.meeting_url} target="_blank" rel="noreferrer"
                      className="text-[10px] font-medium px-2.5 py-1 rounded-[6px] bg-cyan-500/10 text-cyan-400 shrink-0 hover:bg-cyan-500/20 transition-colors">
                      Unirse
                    </a>
                  ) : (
                    <span className={cn("text-[10px] font-medium px-2.5 py-1 rounded-[6px] shrink-0", typeColors[e.type])}>{typeLabels[e.type]}</span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}
