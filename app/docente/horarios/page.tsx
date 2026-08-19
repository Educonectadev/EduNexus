"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, MapPin, Coffee, Calendar, BookOpen, GraduationCap, X, Users, Bell, Sun, Moon, ChevronDown } from "@/components/ui/proicons"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import { useTheme } from "next-themes"

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
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0, 0, 0, 0.6)" }}
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
              className="w-full max-w-md overflow-hidden"
              style={{
                background: "var(--sb-surface)",
                borderRadius: "20px",
                border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)"
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ borderBottom: "1px solid color-mix(in srgb, var(--sb-outline-variant) 25%, transparent)" }}
              >
                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.8px]"
                    style={{
                      color: "var(--sb-on-surface-variant)",
                      opacity: 0.45,
                      fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                    }}
                  >
                    {DAYS[horario.day_of_week - 1]}
                  </p>
                  <h2
                    className="text-base font-semibold mt-1"
                    style={{
                      color: "var(--sb-on-surface)",
                      fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                    }}
                  >
                    {horario.course_name}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="h-8 w-8 flex items-center justify-center transition-colors"
                  style={{
                    borderRadius: "10px",
                    color: "var(--sb-on-surface-variant)"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sb-surface-container-high)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="px-5 py-4 space-y-4">
                {/* Time Block */}
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 flex items-center justify-center"
                    style={{
                      background: "var(--sb-surface-container-high)",
                      borderRadius: "12px"
                    }}
                  >
                    <Clock className="h-4 w-4" style={{ color: "var(--sb-on-surface-variant)" }} />
                  </div>
                  <div>
                    <p
                      className="text-lg font-semibold"
                      style={{
                        color: "var(--sb-on-surface)",
                        fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                      }}
                    >
                      {horario.start_time.slice(0, 5)} — {horario.end_time.slice(0, 5)}
                    </p>
                    <p
                      className="text-xs"
                      style={{
                        color: "var(--sb-on-surface-variant)",
                        fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                      }}
                    >
                      {durationStr} de duración
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className="p-3"
                    style={{
                      background: "var(--sb-surface-container)",
                      borderRadius: "12px"
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <GraduationCap className="h-3.5 w-3.5" style={{ color: "var(--sb-on-surface-variant)" }} />
                      <span
                        className="text-[10px] font-bold uppercase tracking-[0.8px]"
                        style={{
                          color: "var(--sb-on-surface-variant)",
                          opacity: 0.45,
                          fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                        }}
                      >
                        Grado
                      </span>
                    </div>
                    <p
                      className="text-sm font-medium"
                      style={{
                        color: "var(--sb-on-surface)",
                        fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                      }}
                    >
                      {horario.grade} &quot;{horario.section}&quot;
                    </p>
                  </div>
                  <div
                    className="p-3"
                    style={{
                      background: "var(--sb-surface-container)",
                      borderRadius: "12px"
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <MapPin className="h-3.5 w-3.5" style={{ color: "var(--sb-on-surface-variant)" }} />
                      <span
                        className="text-[10px] font-bold uppercase tracking-[0.8px]"
                        style={{
                          color: "var(--sb-on-surface-variant)",
                          opacity: 0.45,
                          fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                        }}
                      >
                        Aula
                      </span>
                    </div>
                    <p
                      className="text-sm font-medium"
                      style={{
                        color: "var(--sb-on-surface)",
                        fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                      }}
                    >
                      {horario.classroom || "Sin asignar"}
                    </p>
                  </div>
                </div>

                {/* Course Info */}
                <div
                  className="p-3"
                  style={{
                    borderRadius: "12px",
                    border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)"
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-8 w-8 flex items-center justify-center"
                      style={{
                        background: "var(--sb-surface-container)",
                        borderRadius: "10px"
                      }}
                    >
                      <BookOpen className="h-4 w-4" style={{ color: "var(--sb-on-surface-variant)" }} />
                    </div>
                    <div>
                      <p
                        className="text-xs font-medium"
                        style={{
                          color: "var(--sb-on-surface)",
                          fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                        }}
                      >
                        {horario.course_name}
                      </p>
                      <p
                        className="text-[10px]"
                        style={{
                          color: "var(--sb-on-surface-variant)",
                          fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                        }}
                      >
                        {horario.course_code}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                className="px-5 py-3"
                style={{
                  borderTop: "1px solid color-mix(in srgb, var(--sb-outline-variant) 25%, transparent)",
                  background: "var(--sb-surface-container)"
                }}
              >
                <p
                  className="text-[10px] text-center"
                  style={{
                    color: "var(--sb-on-surface-variant)",
                    opacity: 0.5,
                    fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                  }}
                >
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
  const user = useAuthStore((s) => s.user)
  const { theme, setTheme } = useTheme()
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
    <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-[#BABABA] dark:bg-[#1a1a1c]">
      <div className="p-6 md:p-8 pb-24 md:pb-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <p className="text-[14px] font-medium mb-1 text-[#666] dark:text-[#a1a1aa]">Panel Docente</p>
            <h1 className="text-[36px] md:text-[48px] font-bold leading-tight text-[#000] dark:text-[#f4f4f5]">
              Horarios
            </h1>
            <p className="text-[13px] mt-2 text-[#666] dark:text-[#a1a1aa]">
              Tu horario semanal de clases
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
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-5 rounded-[30px] bg-white dark:bg-[#17171a]">
            <p className="text-[12px] font-medium mb-3 text-[#666] dark:text-[#a1a1aa]">Jornada</p>
            <p className="text-[32px] font-bold text-[#000] dark:text-[#f4f4f5]">Lun – Vie</p>
          </div>
          <div className="p-5 rounded-[30px] bg-white dark:bg-[#17171a]">
            <p className="text-[12px] font-medium mb-3 text-[#666] dark:text-[#a1a1aa]">Clases</p>
            <p className="text-[32px] font-bold text-[#000] dark:text-[#f4f4f5]">{totalClasses}</p>
          </div>
          <div className="p-5 rounded-[30px] bg-white dark:bg-[#17171a]">
            <p className="text-[12px] font-medium mb-3 text-[#666] dark:text-[#a1a1aa]">Horas/sem</p>
            <p className="text-[32px] font-bold text-[#000] dark:text-[#f4f4f5]">{totalHours}h</p>
          </div>
          <div className="p-5 rounded-[30px] bg-white dark:bg-[#17171a]">
            <p className="text-[12px] font-medium mb-3 text-[#666] dark:text-[#a1a1aa]">Cursos</p>
            <p className="text-[32px] font-bold text-[#000] dark:text-[#f4f4f5]">{new Set(horarios.map(h => h.course_id)).size}</p>
          </div>
        </div>

        {/* Day Filters */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-2"
        >
          <button
            onClick={() => setActiveDay(null)}
            className="px-3 py-1.5 text-xs font-medium transition-all shrink-0"
            style={{
              borderRadius: "10px",
              border: "1.5px solid",
              borderColor: activeDay === null ? "transparent" : "var(--sb-outline-variant)",
              background: activeDay === null ? "var(--sb-on-surface)" : "transparent",
              color: activeDay === null ? "var(--sb-surface)" : "var(--sb-on-surface-variant)",
              fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
            }}
          >
            Todos
          </button>
          {scheduleByDay.map(({ day, label, items }) => (
            <button
              key={day}
              onClick={() => setActiveDay(activeDay === day ? null : day)}
              className="px-3 py-1.5 text-xs font-medium transition-all shrink-0 flex items-center gap-1.5"
              style={{
                borderRadius: "10px",
                border: "1.5px solid",
                borderColor: activeDay === day ? "transparent" : "var(--sb-outline-variant)",
                background: activeDay === day
                  ? "var(--sb-on-surface)"
                  : todayDay === day
                    ? "var(--sb-surface-container-high)"
                    : "transparent",
                color: activeDay === day
                  ? "var(--sb-surface)"
                  : todayDay === day
                    ? "var(--sb-on-surface)"
                    : "var(--sb-on-surface-variant)",
                fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
              }}
            >
              {label}
              <span style={{ opacity: 0.6 }}>{items.length}</span>
            </button>
          ))}
        </motion.div>

        {/* Schedule Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="p-4 animate-pulse"
                style={{
                  background: "var(--sb-surface-container)",
                  borderRadius: "16px"
                }}
              >
                <div
                  className="h-4 w-20 mb-4"
                  style={{
                    background: "var(--sb-surface-container-high)",
                    borderRadius: "8px"
                  }}
                />
                <div className="space-y-2">
                  <div
                    className="h-14"
                    style={{
                      background: "var(--sb-surface-container-high)",
                      borderRadius: "10px"
                    }}
                  />
                  <div
                    className="h-14"
                    style={{
                      background: "var(--sb-surface-container-high)",
                      borderRadius: "10px"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {scheduleByDay.map(({ day, label, items }) => {
              if (activeDay !== null && activeDay !== day) return null
              const isToday = todayDay === day
              return (
                <div
                  key={day}
                  style={{
                    background: isToday ? "var(--sb-surface-container-high)" : "var(--sb-surface-container)",
                    borderRadius: "16px",
                    border: isToday
                      ? "1px solid color-mix(in srgb, var(--sb-primary) 30%, transparent)"
                      : "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)"
                  }}
                >
                  {/* Day Header */}
                  <div
                    className="px-4 py-3 flex items-center justify-between"
                    style={{ borderBottom: "1px solid color-mix(in srgb, var(--sb-outline-variant) 25%, transparent)" }}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" style={{ color: "var(--sb-on-surface-variant)" }} />
                      <span
                        className="text-xs font-medium"
                        style={{
                          color: "var(--sb-on-surface)",
                          fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                        }}
                      >
                        {label}
                      </span>
                    </div>
                    {isToday && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5"
                        style={{
                          borderRadius: "8px",
                          background: "var(--sb-on-surface)",
                          color: "var(--sb-surface)",
                          fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                        }}
                      >
                        HOY
                      </span>
                    )}
                  </div>

                  {/* Classes */}
                  {items.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p
                        className="text-xs"
                        style={{
                          color: "var(--sb-on-surface-variant)",
                          opacity: 0.4,
                          fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                        }}
                      >
                        Sin clases
                      </p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1.5">
                      {items.map((h, idx) => {
                        const next = items[idx + 1]
                        const gap = next ? toMin(next.start_time) - toMin(h.end_time) : null
                        const showRecess = gap !== null && isRecess(gap)
                        return (
                          <React.Fragment key={h.id}>
                            <button
                              onClick={() => handleHorarioClick(h)}
                              className="w-full text-left p-3 transition-all"
                              style={{
                                borderRadius: "12px",
                                border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "var(--sb-surface-container-high)"
                                e.currentTarget.style.borderColor = "color-mix(in srgb, var(--sb-outline-variant) 50%, transparent)"
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent"
                                e.currentTarget.style.borderColor = "color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)"
                              }}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <h3
                                  className="text-xs font-medium"
                                  style={{
                                    color: "var(--sb-on-surface)",
                                    fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                                  }}
                                >
                                  {h.course_name}
                                </h3>
                                <span
                                  className="text-[10px] shrink-0"
                                  style={{
                                    color: "var(--sb-on-surface-variant)",
                                    fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                                  }}
                                >
                                  {h.grade} {h.section}
                                </span>
                              </div>
                              <div
                                className="flex items-center gap-2.5 text-[11px]"
                                style={{
                                  color: "var(--sb-on-surface-variant)",
                                  fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                                }}
                              >
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{h.start_time.slice(0, 5)} — {h.end_time.slice(0, 5)}</span>
                                </span>
                                {h.classroom && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {h.classroom}
                                  </span>
                                )}
                              </div>
                            </button>
                            {showRecess && (
                              <div className="flex items-center gap-1.5 px-2 py-0.5">
                                <div className="flex-1 h-px" style={{ background: "var(--sb-outline-variant)", opacity: 0.3 }} />
                                <span
                                  className="flex items-center gap-1 text-[9px] uppercase tracking-wider"
                                  style={{
                                    color: "var(--sb-on-surface-variant)",
                                    opacity: 0.3,
                                    fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
                                  }}
                                >
                                  <Coffee className="h-2.5 w-2.5" /> Receso {gap}m
                                </span>
                                <div className="flex-1 h-px" style={{ background: "var(--sb-outline-variant)", opacity: 0.3 }} />
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
          <div
            className="py-16 text-center"
            style={{
              background: "var(--sb-surface-container)",
              borderRadius: "20px",
              border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)"
            }}
          >
            <Calendar
              className="h-10 w-10 mx-auto mb-3"
              style={{ color: "var(--sb-on-surface-variant)", opacity: 0.3 }}
            />
            <p
              className="text-sm font-medium"
              style={{
                color: "var(--sb-on-surface)",
                fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
              }}
            >
              Aún no tienes horarios asignados
            </p>
            <p
              className="text-xs mt-1"
              style={{
                color: "var(--sb-on-surface-variant)",
                opacity: 0.5,
                fontFamily: "var(--app-main-font, 'DM Sans'), sans-serif"
              }}
            >
              El secretario asignará tus cursos y horarios
            </p>
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
