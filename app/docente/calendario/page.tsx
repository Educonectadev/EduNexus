"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Clock, BookOpen, MapPin, Video, Calendar as CalendarIcon, Sun, Moon } from "@/components/ui/proicons"
import NotificationBell from "@/components/layout/notification-bell"
import { useAuthStore } from "@/stores/auth-store"
import { useTheme } from "next-themes"

const FONT = "var(--app-main-font, 'DM Sans'), sans-serif"

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
    <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-white dark:bg-[#1a1a1c] sb-note">
      <div className="p-6 md:p-8 pb-24 md:pb-8 space-y-4">

        {/* ═══ HEADER ═══ */}
        <header className="flex items-start justify-between mb-2 gap-4">
          <div>
            <p className="text-[14px] font-medium mb-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Académico</p>
            <h1 className="text-[36px] md:text-[48px] font-bold leading-tight" style={{ color: "var(--note-text)", fontFamily: FONT }}>Calendario</h1>
            <p className="text-[13px] mt-2" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Tu horario semanal y eventos de la institución</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5">
                <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ background: "var(--note-fill-strong)" }}>
                  <span className="text-[9px] font-semibold" style={{ color: "var(--note-text)" }}>{user.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "D"}</span>
                </div>
                <span className="text-sm md:text-base font-medium whitespace-nowrap" style={{ color: "var(--note-text)", fontFamily: FONT }}>{user.full_name}</span>
              </div>
            )}
            <NotificationBell />
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Cambiar tema" title="Cambiar tema" className="h-10 w-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity relative">
              <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" style={{ color: "var(--note-text)" }} />
              <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" style={{ color: "var(--note-text)" }} />
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-[12px] px-4 py-3 text-sm" style={{ background: "var(--note-fill)", border: "1px solid var(--note-hairline)", color: "var(--note-text)", fontFamily: FONT }}>{error}</div>
        )}

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-40 rounded-[24px]" style={{ border: "1px solid var(--note-hairline)", background: "var(--note-surface)" }} />
            <div className="h-64 rounded-[24px]" style={{ border: "1px solid var(--note-hairline)", background: "var(--note-surface)" }} />
          </div>
        ) : (
          <>
            {/* Weekly schedule */}
            {weeklyClasses.length > 0 && (
              <div className="rounded-[24px] p-5" style={{ border: "1px solid var(--note-hairline)", background: "var(--note-surface)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "var(--note-fill)" }}>
                    <BookOpen className="h-4 w-4" style={{ color: "var(--note-muted)" }} />
                  </div>
                  <p className="text-[15px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Horario semanal</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {WEEK_DAYS.map((day, idx) => {
                    const dayEvents = weeklyClasses.filter(e => e.day_of_week === idx + 1).sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""))
                    return (
                      <div key={day} className="rounded-[16px] p-3 min-h-[90px] transition-colors" style={{ background: "var(--note-fill)" }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{day}</p>
                        {dayEvents.length === 0 ? (
                          <p className="text-[11px]" style={{ color: "var(--note-muted)", opacity: 0.4, fontFamily: FONT }}>Libre</p>
                        ) : (
                          <div className="space-y-1.5">
                            {dayEvents.map(e => (
                              <div key={e.id} className="rounded-[12px] px-2 py-1.5" style={{ background: "var(--note-fill-strong)" }}>
                                <p className="text-[11px] font-medium truncate" style={{ color: "var(--note-text)", fontFamily: FONT }}>{e.start_time} · {e.title}</p>
                                {e.subtitle && <p className="text-[10px] truncate" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{e.subtitle}</p>}
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
            <div className="rounded-[24px] p-5" style={{ border: "1px solid var(--note-hairline)", background: "var(--note-surface)" }}>
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) } else setCurrentMonth(m => m - 1) }}
                  className="p-2 rounded-xl transition-colors" style={{ background: "var(--note-fill)" }}>
                  <ChevronLeft className="h-4 w-4" style={{ color: "var(--note-muted)" }} />
                </button>
                <p className="text-sm font-medium" style={{ color: "var(--note-text)", fontFamily: FONT }}>{monthNames[currentMonth]} {currentYear}</p>
                <button onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) } else setCurrentMonth(m => m + 1) }}
                  className="p-2 rounded-xl transition-colors" style={{ background: "var(--note-fill)" }}>
                  <ChevronRight className="h-4 w-4" style={{ color: "var(--note-muted)" }} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {dayNames.map(d => <div key={d} className="text-center text-[10px] font-medium py-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{d}</div>)}
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const dayEvents = eventsOnDay(day)
                  const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
                  return (
                    <div key={day} className="relative flex flex-col items-center py-2 rounded-[12px] text-sm transition-colors"
                      style={{ background: isToday ? "var(--note-solid-bg)" : "transparent", color: isToday ? "var(--note-solid-fg)" : "var(--note-text)", opacity: isToday ? 1 : 0.7 }}>
                      {day}
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {dayEvents.slice(0, 3).map((e, j) => <div key={j} className="h-1 w-1 rounded-full" style={{ background: isToday ? "var(--note-solid-fg)" : "var(--note-muted)" }} />)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-3 mt-4 pt-3" style={{ borderTop: "1px solid var(--note-hairline)" }}>
                {Object.keys(typeLabels).map(t => (
                  <span key={t} className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
                    <span className="h-2 w-2 rounded-full" style={{ background: "var(--note-muted)" }} /> {typeLabels[t]}
                  </span>
                ))}
              </div>
            </div>

            {/* Upcoming events */}
            <div className="space-y-2.5">
              <p className="text-[15px] font-bold uppercase tracking-[0.12em] px-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Próximos eventos</p>
              {upcomingEvents.length === 0 && (
                <div className="rounded-[24px] py-8 text-center text-sm" style={{ border: "1px solid var(--note-hairline)", background: "var(--note-surface)", color: "var(--note-muted)", fontFamily: FONT }}>
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2" style={{ opacity: 0.3 }} />
                  Sin eventos próximos
                </div>
              )}
              {upcomingEvents.map((e) => (
                <div key={e.id}
                  className="rounded-[24px] p-4 flex items-center gap-3 transition-colors"
                  style={{ border: "1px solid var(--note-hairline)", background: "var(--note-surface)" }}>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--note-fill)" }}>
                    {e.type === "virtual" ? <Video className="h-4 w-4" style={{ color: "var(--note-muted)" }} /> : <BookOpen className="h-4 w-4" style={{ color: "var(--note-muted)" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--note-text)", fontFamily: FONT }}>{e.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs flex-wrap" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
                      <Clock className="h-3 w-3" />
                      <span>{new Date(e.date! + "T00:00:00").toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" })}{e.start_time ? ` · ${e.start_time}` : ""}</span>
                      {e.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</span>}
                    </div>
                  </div>
                  {e.meeting_url ? (
                    <a href={e.meeting_url} target="_blank" rel="noreferrer"
                      className="text-[10px] font-medium px-2.5 py-1 rounded-xl shrink-0 transition-opacity hover:opacity-80"
                      style={{ background: "var(--note-fill-strong)", color: "var(--note-text)", fontFamily: FONT }}>Unirse</a>
                  ) : (
                    <span className="text-[10px] font-medium px-2.5 py-1 rounded-xl shrink-0" style={{ background: "var(--note-fill)", color: "var(--note-muted)", fontFamily: FONT }}>{typeLabels[e.type]}</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
