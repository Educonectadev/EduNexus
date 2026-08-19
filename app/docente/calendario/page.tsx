"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Clock, BookOpen, MapPin, Video, Calendar as CalendarIcon, Bell, Sun, Moon } from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import { useTheme } from "next-themes"

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
  class: "bg-[var(--note-fill-strong)] text-[var(--note-text)]",
  meeting: "bg-[var(--note-fill-strong)] text-[var(--note-text)]",
  exam: "bg-[var(--note-fill-strong)] text-[var(--note-text)]",
  event: "bg-[var(--note-fill-strong)] text-[var(--note-text)]",
  virtual: "bg-[var(--note-fill-strong)] text-[var(--note-text)]",
}

const typeDot: Record<string, string> = {
  class: "bg-[var(--note-muted)]",
  meeting: "bg-[var(--note-muted)]",
  exam: "bg-[var(--note-muted)]",
  event: "bg-[var(--note-muted)]",
  virtual: "bg-[var(--note-muted)]",
}

const typeLabels: Record<string, string> = { class: "Clase", meeting: "Reunión", exam: "Examen", event: "Evento", virtual: "Clase virtual" }

const WEEK_DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

export default function CalendarioPage() {
  const user = useAuthStore((s) => s.user)
  const { theme, setTheme } = useTheme()
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
    <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-[#BABABA] dark:bg-[#1a1a1c] sb-note">
      <div className="p-6 md:p-8 pb-24 md:pb-8 space-y-5">
        {/* Header */}
        <header className="flex items-start justify-between pt-2 gap-4">
          <div>
            <p className="text-[14px] font-medium mb-1 text-[#666] dark:text-[#a1a1aa]">Panel Docente</p>
            <h1 className="text-[36px] md:text-[48px] font-bold leading-tight text-[#000] dark:text-[#f4f4f5]">
              Calendario
            </h1>
            <p className="text-[13px] mt-2 text-[#666] dark:text-[#a1a1aa]">
              Tu horario semanal y eventos de la institución
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5">
                <div className="h-6 w-6 rounded-full flex items-center justify-center">
                  <span className="text-[9px] font-semibold text-[#000] dark:text-[#f4f4f5]">
                    {user.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "D"}
                  </span>
                </div>
                <span className="text-[11px] text-[#666] dark:text-[#a1a1aa] truncate max-w-[160px]">
                  {user.full_name}
                </span>
              </div>
            )}
            <button aria-label="Notificaciones" className="h-10 w-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity">
              <Bell className="h-[18px] w-[18px] text-[#000] dark:text-[#f4f4f5]" />
            </button>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Cambiar tema" title="Cambiar tema" className="h-10 w-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity relative">
              <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-[#000] dark:text-[#f4f4f5]" />
              <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-[#000] dark:text-[#f4f4f5]" />
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-[12px] bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-40 rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)]" />
            <div className="h-64 rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)]" />
          </div>
        ) : (
          <>
            {/* Weekly schedule */}
            {weeklyClasses.length > 0 && (
              <div className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-[12px] bg-[var(--note-fill)] flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-[var(--note-text)]" />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--note-muted)]">Horario semanal</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  {WEEK_DAYS.map((day, idx) => {
                    const dayEvents = weeklyClasses.filter(e => e.day_of_week === idx + 1).sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""))
                    return (
                      <div key={day} className="rounded-[16px] bg-[var(--note-fill)] p-3 min-h-[90px]">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--note-muted)] mb-2">{day}</p>
                        {dayEvents.length === 0 ? (
                          <p className="text-[11px] text-[var(--note-muted)]/40">Libre</p>
                        ) : (
                          <div className="space-y-1.5">
                            {dayEvents.map(e => (
                              <div key={e.id} className="rounded-[12px] bg-[var(--note-fill-strong)] px-2 py-1.5">
                                <p className="text-[11px] font-medium text-[var(--note-text)] truncate">{e.start_time} · {e.title}</p>
                                {e.subtitle && <p className="text-[10px] text-[var(--note-muted)] truncate">{e.subtitle}</p>}
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
            <div className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] p-5">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) } else setCurrentMonth(m => m - 1) }}
                  className="p-2 rounded-[12px] hover:bg-[var(--note-fill)] transition-colors">
                  <ChevronLeft className="h-4 w-4 text-[var(--note-muted)]" />
                </button>
                <p className="text-sm font-medium text-[var(--note-text)]">{monthNames[currentMonth]} {currentYear}</p>
                <button onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) } else setCurrentMonth(m => m + 1) }}
                  className="p-2 rounded-[12px] hover:bg-[var(--note-fill)] transition-colors">
                  <ChevronRight className="h-4 w-4 text-[var(--note-muted)]" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {dayNames.map(d => <div key={d} className="text-center text-[10px] text-[var(--note-muted)] font-medium py-1">{d}</div>)}
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const dayEvents = eventsOnDay(day)
                  const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
                  return (
                    <div key={day} className={cn("relative flex flex-col items-center py-2 rounded-[12px] text-sm transition-colors",
                      isToday ? "bg-[var(--note-solid-bg)] text-[var(--note-solid-fg)]" : "text-[var(--note-text)]/70 hover:bg-[var(--note-fill)]")}>
                      {day}
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {dayEvents.slice(0, 3).map((e, j) => <div key={j} className={cn("h-1 w-1 rounded-full", isToday ? "bg-[var(--note-solid-fg)]/80" : typeDot[e.type])} />)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-[var(--note-hairline)]">
                {Object.keys(typeLabels).map(t => (
                  <span key={t} className="flex items-center gap-1.5 text-[10px] text-[var(--note-muted)]">
                    <span className={cn("h-2 w-2 rounded-full", typeDot[t])} /> {typeLabels[t]}
                  </span>
                ))}
              </div>
            </div>

            {/* Upcoming events */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--note-muted)] px-1">Próximos eventos</p>
              {upcomingEvents.length === 0 && (
                <div className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] py-8 text-center text-sm text-[var(--note-muted)]">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-[var(--note-muted)]/40" />
                  Sin eventos próximos
                </div>
              )}
              <AnimatePresence>
                {upcomingEvents.map((e, i) => (
                  <motion.div key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] p-4 flex items-center gap-4 hover:border-[var(--note-hairline-strong)] transition-colors">
                    <div className={cn("h-10 w-10 rounded-[12px] flex items-center justify-center shrink-0", typeColors[e.type])}>
                      {e.type === "virtual" ? <Video className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--note-text)] truncate">{e.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--note-muted)] flex-wrap">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(e.date! + "T00:00:00").toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" })}{e.start_time ? ` · ${e.start_time}` : ""}</span>
                        {e.location && (
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</span>
                        )}
                      </div>
                    </div>
                    {e.meeting_url ? (
                      <a href={e.meeting_url} target="_blank" rel="noreferrer"
                        className="text-[10px] font-medium px-2.5 py-1 rounded-[12px] bg-[var(--note-fill-strong)] text-[var(--note-text)] shrink-0 hover:opacity-90 transition-opacity">
                        Unirse
                      </a>
                    ) : (
                      <span className="text-[10px] font-medium px-2.5 py-1 rounded-[12px] bg-[var(--note-fill)] text-[var(--note-muted)] shrink-0">{typeLabels[e.type]}</span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  )
}