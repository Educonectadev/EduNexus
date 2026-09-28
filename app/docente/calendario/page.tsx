"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Clock, BookOpen, MapPin, Video, Calendar as CalendarIcon } from "@/components/ui/proicons"
import { SbSectionHeader } from "@/components/ui/sb"

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
      .then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error || "Error al cargar"); if (!cancelled) setEvents(Array.isArray(data.events) ? data.events : []) })
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
    <div className="space-y-5">
      {/* ═══ HEADER ═══ */}
      <SbSectionHeader title="Calendario" description="Tu horario semanal y eventos de la institución" />

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm bg-sb-surface border border-sb-outline-variant/10 text-sb-on-surface">{error}</div>
      )}

      {loading ? (
        <div className="space-y-5 animate-pulse">
          <div className="h-40 rounded-2xl bg-sb-surface border border-sb-outline-variant/10" />
          <div className="h-64 rounded-2xl bg-sb-surface border border-sb-outline-variant/10" />
        </div>
      ) : (
        <>
          {/* Weekly schedule */}
          {weeklyClasses.length > 0 && (
            <div className="rounded-2xl bg-sb-surface border border-sb-outline-variant/10 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-sb-surface-container-high">
                  <BookOpen className="h-4 w-4 text-sb-on-surface-variant/50" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50">Horario semanal</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {WEEK_DAYS.map((day, idx) => {
                  const dayEvents = weeklyClasses.filter(e => e.day_of_week === idx + 1).sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""))
                  return (
                    <div key={day} className="rounded-xl p-3 min-h-[90px] transition-colors bg-sb-surface-container-high/50">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 mb-2">{day}</p>
                      {dayEvents.length === 0 ? (
                        <p className="text-xs text-sb-on-surface-variant/30">Libre</p>
                      ) : (
                        <div className="space-y-1.5">
                          {dayEvents.map(e => (
                            <div key={e.id} className="rounded-lg px-2 py-1.5 bg-sb-surface border border-sb-outline-variant/10">
                              <p className="text-xs font-medium text-sb-on-surface truncate">{e.start_time} · {e.title}</p>
                              {e.subtitle && <p className="text-[11px] text-sb-on-surface-variant/50 truncate">{e.subtitle}</p>}
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
          <div className="rounded-2xl bg-sb-surface border border-sb-outline-variant/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) } else setCurrentMonth(m => m - 1) }}
                className="h-8 w-8 rounded-lg bg-sb-surface-container-high flex items-center justify-center text-sb-on-surface-variant hover:bg-sb-surface-container-highest transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-semibold text-sb-on-surface">{monthNames[currentMonth]} {currentYear}</p>
              <button onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) } else setCurrentMonth(m => m + 1) }}
                aria-label="Mes siguiente" title="Mes siguiente"
                className="h-8 w-8 rounded-lg bg-sb-surface-container-high flex items-center justify-center text-sb-on-surface-variant hover:bg-sb-surface-container-highest transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {dayNames.map(d => <div key={d} className="text-center text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 py-1">{d}</div>)}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayEvents = eventsOnDay(day)
                const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
                return (
                  <div key={day}
                    className={`relative flex flex-col items-center justify-start py-2 rounded-xl text-sm transition-colors border ${
                      isToday
                        ? "bg-sb-on-surface text-sb-surface border-sb-on-surface"
                        : "border-sb-outline-variant/10 text-sb-on-surface/70 hover:bg-sb-surface-container-high/50"
                    }`}>
                    {day}
                    {dayEvents.length > 0 && (
                      <span className={`mt-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                        isToday ? "bg-sb-surface/20 text-sb-surface" : "bg-sb-primary/10 text-sb-primary"
                      }`}>
                        {dayEvents.length}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-sb-outline-variant/10">
              {Object.keys(typeLabels).map(t => (
                <span key={t} className="flex items-center gap-1.5 text-[11px] text-sb-on-surface-variant/50">
                  <span className="h-2 w-2 rounded-full bg-sb-on-surface-variant/40" /> {typeLabels[t]}
                </span>
              ))}
            </div>
          </div>

          {/* Upcoming events */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-sb-on-surface px-1">Próximos eventos</p>
            {upcomingEvents.length === 0 && (
              <div className="rounded-2xl py-8 text-center text-sm bg-sb-surface border border-sb-outline-variant/10 text-sb-on-surface-variant/50">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-sb-on-surface-variant/20" />
                Sin eventos próximos
              </div>
            )}
            {upcomingEvents.map((e) => (
              <div key={e.id}
                className="rounded-2xl p-4 flex items-center gap-3 transition-colors bg-sb-surface border border-sb-outline-variant/10">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-sb-surface-container-high">
                  {e.type === "virtual" ? <Video className="h-4 w-4 text-sb-on-surface-variant/60" /> : <BookOpen className="h-4 w-4 text-sb-on-surface-variant/60" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sb-on-surface truncate">{e.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs flex-wrap text-sb-on-surface-variant/50">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(e.date! + "T00:00:00").toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" })}{e.start_time ? ` · ${e.start_time}` : ""}</span>
                    {e.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</span>}
                  </div>
                </div>
                {e.meeting_url ? (
                  <a href={e.meeting_url} target="_blank" rel="noreferrer"
                    className="sb-btn tonal rounded shrink-0">Unirse</a>
                ) : (
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg shrink-0 bg-sb-surface-container-high text-sb-on-surface-variant/60">{typeLabels[e.type]}</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
