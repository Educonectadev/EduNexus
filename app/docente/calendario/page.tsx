"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Clock, BookOpen } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface Event {
  id: string
  title: string
  date: string
  time: string
  type: "class" | "meeting" | "exam" | "event"
}

const defaultEvents: Event[] = [
  { id: "1", title: "Clase de Matemática 3°A", date: "2026-07-22", time: "08:00", type: "class" },
  { id: "2", title: "Reunión de apoderados", date: "2026-07-22", time: "14:00", type: "meeting" },
  { id: "3", title: "Examen de Historia 2°B", date: "2026-07-23", time: "10:00", type: "exam" },
  { id: "4", title: "Clase de Matemática 2°B", date: "2026-07-23", time: "08:00", type: "class" },
  { id: "5", title: "Capacitación docente", date: "2026-07-25", time: "15:00", type: "event" },
  { id: "6", title: "Clase de Matemática 3°A", date: "2026-07-25", time: "08:00", type: "class" },
]

const typeColors: Record<string, string> = {
  class: "bg-blue-500/10 text-blue-400",
  meeting: "bg-violet-500/10 text-violet-400",
  exam: "bg-red-500/10 text-red-400",
  event: "bg-emerald-500/10 text-emerald-400",
}

const typeLabels: Record<string, string> = { class: "Clase", meeting: "Reunión", exam: "Examen", event: "Evento" }

export default function CalendarioPage() {
  const [events] = React.useState<Event[]>(defaultEvents)
  const today = new Date()
  const [currentMonth, setCurrentMonth] = React.useState(today.getMonth())
  const [currentYear, setCurrentYear] = React.useState(today.getFullYear())

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDay = new Date(currentYear, currentMonth, 1).getDay()
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

  const eventsOnDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return events.filter(e => e.date === dateStr)
  }

  const upcomingEvents = events.filter(e => new Date(e.date) >= today).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5)

  return (
    <div className="w-full space-y-6 py-2">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--sb-on-surface)]">Calendario</h2>
        <p className="text-sm text-[var(--sb-on-surface-variant)]/50 mt-1">Próximos eventos y clases</p>
      </motion.div>

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
                    {dayEvents.slice(0, 3).map((_, j) => <div key={j} className="h-1 w-1 rounded-[6px] bg-[var(--sb-primary)]" />)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming events */}
      <div className="space-y-3">
        <p className="text-[10px] font-medium text-[var(--sb-on-surface-variant)]/40 uppercase tracking-wider px-1">Próximos eventos</p>
        {upcomingEvents.map((e, i) => (
          <motion.div key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-[var(--sb-surface-container)] rounded-[6px] p-4 flex items-center gap-4">
            <div className={cn("h-10 w-10 rounded-[6px] flex items-center justify-center shrink-0", typeColors[e.type])}>
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--sb-on-surface)]/80">{e.title}</p>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--sb-on-surface-variant)]/40">
                <Clock className="h-3 w-3" />
                <span>{new Date(e.date).toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" })} · {e.time}</span>
              </div>
            </div>
            <span className={cn("text-[10px] font-medium px-2.5 py-1 rounded-[6px] shrink-0", typeColors[e.type])}>{typeLabels[e.type]}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
