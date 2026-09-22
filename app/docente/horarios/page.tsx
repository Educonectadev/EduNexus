"use client"

import * as React from "react"
import { Clock, MapPin, Coffee, Calendar, BookOpen, GraduationCap, X, Users, Sun, Moon, ArrowLeftRight, ChevronRight } from "@/components/ui/proicons"
import NotificationBell from "@/components/layout/notification-bell"
import { useAuthStore } from "@/stores/auth-store"
import { useTheme } from "next-themes"

const FONT = "var(--app-main-font, 'DM Sans'), sans-serif"

interface Horario {
  id: string; course_id: string; day_of_week: number; start_time: string; end_time: string
  classroom: string; status: string; course_name: string; course_code: string; grade: string; section: string
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
const DAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie"]

const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m }
const isRecess = (gap: number) => gap >= 5 && gap <= 30
const formatTime = (t: string) => t?.slice(0, 5) || ""

/* ═══ TIMELINE DOT ═══ */
function TimelineDot({ active, isNow }: { active: boolean; isNow: boolean }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 12, height: 12 }}>
      {isNow && (
        <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "var(--note-text)", opacity: 0.15 }} />
      )}
      <span
        className="relative block rounded-full transition-all duration-300"
        style={{
          width: active ? 10 : 6,
          height: active ? 10 : 6,
          background: active ? "var(--note-text)" : "var(--note-muted)",
          opacity: active ? 1 : 0.3,
        }}
      />
    </div>
  )
}

/* ═══ DETAIL MODAL ═══ */
function DetailModal({ horario, open, onClose }: { horario: Horario | null; open: boolean; onClose: () => void }) {
  if (!horario) return null

  const duration = toMin(horario.end_time) - toMin(horario.start_time)
  const hours = Math.floor(duration / 60)
  const mins = duration % 60
  const durationStr = hours > 0 ? `${hours}h ${mins > 0 ? ` ${mins}min` : ""}` : `${mins}min`

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      style={{ background: open ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0)" }}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md transition-all duration-300 ease-out ${open ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"}`}
        style={{ borderRadius: "24px", background: "var(--note-surface)", border: "1px solid var(--note-hairline)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Accent bar */}
        <div className="h-1 w-full" style={{ borderRadius: "24px 24px 0 0", background: "var(--note-text)", opacity: 0.08 }} />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[1px] mb-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
              {DAYS[horario.day_of_week - 1]}
            </p>
            <h2 className="text-[18px] font-bold" style={{ color: "var(--note-text)", fontFamily: FONT }}>
              {horario.course_name}
            </h2>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
              {horario.course_code}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
            style={{ borderRadius: "10px", background: "var(--note-fill)", color: "var(--note-muted)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Time hero */}
        <div className="mx-6 p-4 mb-4" style={{ borderRadius: "16px", background: "var(--note-fill)" }}>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-[28px] font-bold leading-none tracking-tight" style={{ color: "var(--note-text)", fontFamily: FONT }}>
                {formatTime(horario.start_time)}
              </p>
              <p className="text-[10px] mt-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Inicio</p>
            </div>
            <div className="flex-1 mx-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px" style={{ background: "var(--note-hairline)" }} />
                <Clock className="h-3.5 w-3.5" style={{ color: "var(--note-muted)", opacity: 0.4 }} />
                <div className="flex-1 h-px" style={{ background: "var(--note-hairline)" }} />
              </div>
              <p className="text-center text-[10px] font-semibold mt-1.5" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{durationStr}</p>
            </div>
            <div className="text-center">
              <p className="text-[28px] font-bold leading-none tracking-tight" style={{ color: "var(--note-text)", fontFamily: FONT }}>
                {formatTime(horario.end_time)}
              </p>
              <p className="text-[10px] mt-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Fin</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="px-6 pb-5 space-y-2.5">
          {[
            { icon: GraduationCap, label: "Grado y sección", value: `${horario.grade} "${horario.section}"` },
            { icon: MapPin, label: "Aula", value: horario.classroom || "Sin asignar" },
            { icon: Users, label: "Código", value: horario.course_code },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 p-3" style={{ borderRadius: "12px", background: "var(--note-fill)" }}>
              <item.icon className="h-4 w-4 shrink-0" style={{ color: "var(--note-muted)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{item.label}</p>
                <p className="text-[13px] font-medium mt-0.5" style={{ color: "var(--note-text)", fontFamily: FONT }}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5" style={{ borderTop: "1px solid var(--note-hairline)" }}>
          <p className="text-[10px] text-center" style={{ color: "var(--note-muted)", opacity: 0.4, fontFamily: FONT }}>
            Horario recurrente · Cada {DAYS[horario.day_of_week - 1]}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ═══ MAIN PAGE ═══ */
export default function DocenteHorariosPage() {
  const user = useAuthStore((s) => s.user)
  const { theme, setTheme } = useTheme()
  const [horarios, setHorarios] = React.useState<Horario[]>([])
  const [substitutions, setSubstitutions] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeDay, setActiveDay] = React.useState<number | null>(null)
  const [selectedHorario, setSelectedHorario] = React.useState<Horario | null>(null)
  const [modalOpen, setModalOpen] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [r, rSub] = await Promise.all([
          fetch("/api/docente/horarios"),
          fetch("/api/docente/substitutions?range=week"),
        ])
        if (!cancelled && r.ok) setHorarios(await r.json())
        if (!cancelled && rSub.ok) setSubstitutions(await rSub.json())
      } catch {}
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  const todayIdx = new Date().getDay()
  const todayDay = todayIdx >= 1 && todayIdx <= 5 ? todayIdx : null
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const scheduleByDay = DAYS.map((_, i) => {
    const day = i + 1
    const items = horarios.filter(h => h.day_of_week === day).sort((a, b) => a.start_time.localeCompare(b.start_time))
    return { day, label: DAYS[i], short: DAY_SHORT[i], items }
  })

  const totalClasses = horarios.length
  const totalHours = Math.round((horarios.reduce((acc, h) => acc + (toMin(h.end_time) - toMin(h.start_time)), 0) / 60) * 10) / 10
  const uniqueCourses = new Set(horarios.map(h => h.course_id)).size

  const handleHorarioClick = (h: Horario) => {
    setSelectedHorario(h)
    setModalOpen(true)
  }

  const visibleDays = activeDay !== null
    ? scheduleByDay.filter(d => d.day === activeDay)
    : scheduleByDay

  return (
    <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-white dark:bg-[#1a1a1c] sb-note">
      <div className="p-6 md:p-8 pb-24 md:pb-8">

        {/* ═══ HEADER ═══ */}
        <header className="flex items-start justify-between mb-7 gap-4">
          <div>
            <p className="text-[14px] font-medium mb-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Académico</p>
            <h1 className="text-[36px] md:text-[48px] font-bold leading-tight" style={{ color: "var(--note-text)", fontFamily: FONT }}>
              Horarios
            </h1>
            <p className="text-[13px] mt-2" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
              {totalClasses > 0
                ? `${totalClasses} clases · ${totalHours}h semanales`
                : "Tu horario semanal de clases"
              }
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5">
                <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ background: "var(--note-fill-strong)" }}>
                  <span className="text-[9px] font-semibold" style={{ color: "var(--note-text)" }}>
                    {user.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "D"}
                  </span>
                </div>
                <span className="text-sm md:text-base font-medium whitespace-nowrap" style={{ color: "var(--note-text)", fontFamily: FONT }}>
                  {user.full_name}
                </span>
              </div>
            )}
            <NotificationBell />
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Cambiar tema" title="Cambiar tema" className="h-10 w-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity relative">
              <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" style={{ color: "var(--note-text)" }} />
              <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" style={{ color: "var(--note-text)" }} />
            </button>
          </div>
        </header>

        {/* ═══ STATS ═══ */}
        <div className="grid grid-cols-3 gap-3 mb-7">
          {[
            { label: "Clases", value: totalClasses },
            { label: "Horas/sem", value: `${totalHours}h` },
            { label: "Cursos", value: uniqueCourses },
          ].map((stat) => (
            <div key={stat.label} className="p-4 text-center" style={{ borderRadius: "20px", background: "var(--note-fill)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{stat.label}</p>
              <p className="text-[24px] font-bold leading-none" style={{ color: "var(--note-text)", fontFamily: FONT }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ═══ DAY FILTERS ═══ */}
        <div className="flex gap-2 mb-7 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            onClick={() => setActiveDay(null)}
            className="px-4 py-2.5 text-[12px] font-semibold transition-all duration-200 shrink-0"
            style={{
              borderRadius: "14px",
              background: activeDay === null ? "var(--note-text)" : "var(--note-fill)",
              color: activeDay === null ? "var(--note-surface)" : "var(--note-muted)",
              fontFamily: FONT,
            }}
          >
            Todos
          </button>
          {scheduleByDay.map(({ day, short, items }) => {
            const isActive = activeDay === day
            const isToday = todayDay === day
            return (
              <button
                key={day}
                onClick={() => setActiveDay(isActive ? null : day)}
                className="px-4 py-2.5 text-[12px] font-semibold transition-all duration-200 shrink-0 flex items-center gap-2"
                style={{
                  borderRadius: "14px",
                  background: isActive
                    ? "var(--note-text)"
                    : isToday
                      ? "var(--note-fill-strong)"
                      : "var(--note-fill)",
                  color: isActive
                    ? "var(--note-surface)"
                    : isToday
                      ? "var(--note-text)"
                      : "var(--note-muted)",
                  fontFamily: FONT,
                }}
              >
                <span>{short}</span>
                <span
                  className="h-5 min-w-5 px-1 flex items-center justify-center text-[10px] font-bold"
                  style={{
                    borderRadius: "8px",
                    background: isActive
                      ? "rgba(255,255,255,0.2)"
                      : isToday
                        ? "var(--note-text)"
                        : "var(--note-fill-strong)",
                    color: isActive
                      ? "rgba(255,255,255,0.9)"
                      : isToday
                        ? "var(--note-surface)"
                        : "var(--note-muted)",
                    fontFamily: FONT,
                  }}
                >
                  {items.length}
                </span>
              </button>
            )
          })}
        </div>

        {/* ═══ SUBSTITUTIONS ═══ */}
        {substitutions.length > 0 && (
          <div className="mb-7 p-4" style={{ borderRadius: "20px", background: "var(--note-surface)", border: "1px solid var(--note-hairline)" }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 flex items-center justify-center" style={{ borderRadius: "8px", background: "var(--note-fill)" }}>
                <ArrowLeftRight className="h-3.5 w-3.5" style={{ color: "var(--note-muted)" }} />
              </div>
              <span className="text-[13px] font-bold" style={{ color: "var(--note-text)", fontFamily: FONT }}>Suplencias</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5" style={{ borderRadius: "6px", background: "var(--note-fill)", color: "var(--note-muted)", fontFamily: FONT }}>
                {substitutions.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {substitutions.map((sub) => (
                <div key={sub.id} className="flex items-center gap-3 p-2.5 transition-colors" style={{ borderRadius: "12px", background: "var(--note-fill)" }}>
                  <div className="w-1 h-8 rounded-full shrink-0" style={{ background: sub.my_role === 'substitute' ? "#22c55e" : "#f59e0b" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold truncate" style={{ color: "var(--note-text)", fontFamily: FONT }}>
                      {sub.course_name} — {sub.grade} {sub.section}
                    </p>
                    <p className="text-[10px] truncate" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
                      {sub.my_role === 'substitute'
                        ? `Sustituyendo a ${sub.original_teacher_name}`
                        : `Sustituido por ${sub.substitute_teacher_name}`
                      } · {new Date(sub.date).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 shrink-0" style={{
                    borderRadius: "8px",
                    background: sub.my_role === 'substitute' ? "#22c55e15" : "#f59e0b15",
                    color: sub.my_role === 'substitute' ? "#22c55e" : "#f59e0b",
                    fontFamily: FONT,
                  }}>
                    {sub.my_role === 'substitute' ? 'Sustituto' : 'Original'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ SCHEDULE ═══ */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-5 animate-pulse" style={{ borderRadius: "20px", background: "var(--note-fill)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-3 w-16" style={{ borderRadius: "6px", background: "var(--note-fill-strong)" }} />
                  <div className="h-3 w-8" style={{ borderRadius: "6px", background: "var(--note-fill-strong)" }} />
                </div>
                <div className="space-y-2.5">
                  <div className="h-16" style={{ borderRadius: "12px", background: "var(--note-fill-strong)" }} />
                  <div className="h-16" style={{ borderRadius: "12px", background: "var(--note-fill-strong)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : horarios.length === 0 ? (
          <div className="py-16 text-center" style={{ borderRadius: "24px", background: "var(--note-surface)", border: "1px solid var(--note-hairline)" }}>
            <div className="h-16 w-16 flex items-center justify-center mx-auto mb-4" style={{ borderRadius: "16px", background: "var(--note-fill)" }}>
              <Calendar className="h-7 w-7" style={{ color: "var(--note-muted)", opacity: 0.3 }} />
            </div>
            <p className="text-[15px] font-bold" style={{ color: "var(--note-text)", fontFamily: FONT }}>Sin horarios asignados</p>
            <p className="text-[12px] mt-1 max-w-[240px] mx-auto" style={{ color: "var(--note-muted)", opacity: 0.5, fontFamily: FONT }}>
              El secretario asignará tus cursos y horarios
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleDays.map(({ day, label, items }) => {
              const isToday = todayDay === day
              return (
                <div
                  key={day}
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    borderRadius: "20px",
                    background: isToday ? "var(--note-surface)" : "var(--note-fill)",
                    border: isToday ? "1.5px solid var(--note-text)" : "1px solid var(--note-hairline)",
                  }}
                >
                  {/* Day header */}
                  <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: items.length > 0 ? "1px solid var(--note-hairline)" : "none" }}>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-8 w-8 flex items-center justify-center transition-all duration-200"
                        style={{
                          borderRadius: "10px",
                          background: isToday ? "var(--note-text)" : "var(--note-fill-strong)",
                        }}
                      >
                        <Calendar className="h-4 w-4" style={{ color: isToday ? "var(--note-surface)" : "var(--note-muted)" }} />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold" style={{ color: "var(--note-text)", fontFamily: FONT }}>{label}</p>
                        <p className="text-[10px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
                          {items.length === 0 ? "Sin clases" : `${items.length} clase${items.length !== 1 ? "s" : ""}`}
                        </p>
                      </div>
                    </div>
                    {isToday && (
                      <span className="text-[10px] font-bold px-2.5 py-1" style={{ borderRadius: "8px", background: "var(--note-text)", color: "var(--note-surface)", fontFamily: FONT }}>
                        HOY
                      </span>
                    )}
                  </div>

                  {/* Classes */}
                  {items.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <Coffee className="h-6 w-6 mx-auto mb-2" style={{ color: "var(--note-muted)", opacity: 0.2 }} />
                      <p className="text-[11px]" style={{ color: "var(--note-muted)", opacity: 0.4, fontFamily: FONT }}>Día libre</p>
                    </div>
                  ) : (
                    <div className="p-3">
                      {items.map((h, idx) => {
                        const next = items[idx + 1]
                        const gap = next ? toMin(next.start_time) - toMin(h.end_time) : null
                        const showRecess = gap !== null && isRecess(gap)
                        const isNowClass = isToday && toMin(h.start_time) <= nowMin && nowMin <= toMin(h.end_time)

                        return (
                          <React.Fragment key={h.id}>
                            {/* Time indicator line */}
                            <div className="flex items-center gap-3 px-2 py-1.5">
                              <p className="text-[11px] font-semibold w-12 text-right shrink-0 tabular-nums" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
                                {formatTime(h.start_time)}
                              </p>
                              <div className="flex-1 h-px" style={{ background: "var(--note-hairline)" }} />
                              <p className="text-[11px] font-semibold w-12 text-left shrink-0 tabular-nums" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
                                {formatTime(h.end_time)}
                              </p>
                            </div>

                            {/* Class card */}
                            <button
                              onClick={() => handleHorarioClick(h)}
                              className="w-full text-left mx-0 mb-0 p-4 transition-all duration-200 group"
                              style={{
                                borderRadius: "14px",
                                background: isNowClass
                                  ? "var(--note-text)"
                                  : "var(--note-surface)",
                                border: isNowClass
                                  ? "none"
                                  : "1px solid var(--note-hairline)",
                              }}
                              onMouseEnter={(e) => { if (!isNowClass) e.currentTarget.style.borderColor = "var(--note-text)" }}
                              onMouseLeave={(e) => { if (!isNowClass) e.currentTarget.style.borderColor = "var(--note-hairline)" }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0">
                                  <div
                                    className="h-10 w-10 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                                    style={{
                                      borderRadius: "12px",
                                      background: isNowClass ? "rgba(255,255,255,0.15)" : "var(--note-fill)",
                                    }}
                                  >
                                    <BookOpen className="h-4 w-4" style={{ color: isNowClass ? "rgba(255,255,255,0.8)" : "var(--note-muted)" }} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[14px] font-bold truncate" style={{ color: isNowClass ? "#fff" : "var(--note-text)", fontFamily: FONT }}>
                                      {h.course_name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[11px]" style={{ color: isNowClass ? "rgba(255,255,255,0.6)" : "var(--note-muted)", fontFamily: FONT }}>
                                        {h.grade} {h.section}
                                      </span>
                                      {h.classroom && (
                                        <>
                                          <span style={{ color: isNowClass ? "rgba(255,255,255,0.3)" : "var(--note-hairline)" }}>·</span>
                                          <span className="flex items-center gap-1 text-[11px]" style={{ color: isNowClass ? "rgba(255,255,255,0.6)" : "var(--note-muted)", fontFamily: FONT }}>
                                            <MapPin className="h-3 w-3" />
                                            {h.classroom}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {isNowClass && (
                                    <span className="text-[9px] font-bold px-2 py-0.5 mr-1" style={{ borderRadius: "6px", background: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.9)", fontFamily: FONT }}>
                                      AHORA
                                    </span>
                                  )}
                                  <ChevronRight
                                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                                    style={{ color: isNowClass ? "rgba(255,255,255,0.4)" : "var(--note-muted)", opacity: 0.5 }}
                                  />
                                </div>
                              </div>
                            </button>

                            {/* Recess indicator */}
                            {showRecess && (
                              <div className="flex items-center gap-2.5 px-4 py-2 my-0.5">
                                <div className="flex-1 h-px" style={{ background: "var(--note-hairline)" }} />
                                <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--note-muted)", opacity: 0.35, fontFamily: FONT }}>
                                  <Coffee className="h-3 w-3" />
                                  Receso {gap}m
                                </span>
                                <div className="flex-1 h-px" style={{ background: "var(--note-hairline)" }} />
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
      </div>

      {/* ═══ DETAIL MODAL ═══ */}
      <DetailModal
        horario={selectedHorario}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedHorario(null) }}
      />
    </div>
  )
}
