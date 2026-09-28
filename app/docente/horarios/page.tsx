"use client"

import * as React from "react"
import { Clock, MapPin, Coffee, Calendar, BookOpen, GraduationCap, X, Users, ArrowLeftRight, ChevronRight } from "@/components/ui/proicons"
import { SbSectionHeader } from "@/components/ui/sb"

interface Horario {
  id: string; course_id: string; day_of_week: number; start_time: string; end_time: string
  classroom: string; status: string; course_name: string; course_code: string; grade: string; section: string
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
const DAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie"]

const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m }
const isRecess = (gap: number) => gap >= 5 && gap <= 30
const formatTime = (t: string) => t?.slice(0, 5) || ""

/* ═══ DETAIL MODAL ═══ */
function DetailModal({ horario, open, onClose }: { horario: Horario | null; open: boolean; onClose: () => void }) {
  if (!horario) return null

  const duration = toMin(horario.end_time) - toMin(horario.start_time)
  const hours = Math.floor(duration / 60)
  const mins = duration % 60
  const durationStr = hours > 0 ? `${hours}h ${mins > 0 ? ` ${mins}min` : ""}` : `${mins}min`

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center p-4 transition-all duration-300 ${open ? "opacity-100 bg-black/40" : "opacity-0 bg-black/0 pointer-events-none"}`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-2xl bg-sb-surface border border-sb-outline-variant/10 overflow-hidden transition-all duration-300 ease-out ${open ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Accent bar */}
        <div className="h-1 w-full bg-sb-primary/40" />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 mb-1">
              {DAYS[horario.day_of_week - 1]}
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-sb-on-surface">
              {horario.course_name}
            </h2>
            <p className="text-xs text-sb-on-surface-variant/50 mt-0.5">
              {horario.course_code}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg bg-sb-surface-container text-sb-on-surface-variant hover:bg-sb-surface-container-high transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Time hero */}
        <div className="mx-6 p-4 mb-4 rounded-xl bg-sb-surface-container-high/50">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-[28px] font-semibold leading-none tracking-tight text-sb-on-surface">
                {formatTime(horario.start_time)}
              </p>
              <p className="text-[11px] mt-1 text-sb-on-surface-variant/50">Inicio</p>
            </div>
            <div className="flex-1 mx-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-sb-outline-variant/30" />
                <Clock className="h-3.5 w-3.5 text-sb-on-surface-variant/40" />
                <div className="flex-1 h-px bg-sb-outline-variant/30" />
              </div>
              <p className="text-center text-[11px] font-semibold mt-1.5 text-sb-on-surface-variant/60">{durationStr}</p>
            </div>
            <div className="text-center">
              <p className="text-[28px] font-semibold leading-none tracking-tight text-sb-on-surface">
                {formatTime(horario.end_time)}
              </p>
              <p className="text-[11px] mt-1 text-sb-on-surface-variant/50">Fin</p>
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
            <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-sb-surface-container-high/50">
              <item.icon className="h-4 w-4 shrink-0 text-sb-on-surface-variant/50" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50">{item.label}</p>
                <p className="text-sm font-medium text-sb-on-surface mt-0.5">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-sb-outline-variant/10">
          <p className="text-[11px] text-center text-sb-on-surface-variant/40">
            Horario recurrente · Cada {DAYS[horario.day_of_week - 1]}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ═══ MAIN PAGE ═══ */
export default function DocenteHorariosPage() {
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
    <div className="space-y-5">
      {/* ═══ HEADER ═══ */}
      <SbSectionHeader
        title="Horarios"
        description={
          totalClasses > 0
            ? `${totalClasses} clases · ${totalHours}h semanales`
            : "Tu horario semanal de clases"
        }
      />

      {/* ═══ STATS ═══ */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Clases", value: totalClasses },
          { label: "Horas/sem", value: `${totalHours}h` },
          { label: "Cursos", value: uniqueCourses },
        ].map((stat) => (
          <div key={stat.label} className="p-4 text-center rounded-2xl bg-sb-surface border border-sb-outline-variant/10">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 mb-1.5">{stat.label}</p>
            <p className="text-xl font-semibold leading-none text-sb-on-surface">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ═══ DAY FILTERS ═══ */}
      <div className="flex gap-1 p-1 bg-sb-surface-container rounded-2xl overflow-x-auto w-fit max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          onClick={() => setActiveDay(null)}
          className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 shrink-0 ${
            activeDay === null
              ? "bg-sb-on-surface text-sb-surface"
              : "text-sb-on-surface-variant/60 hover:text-sb-on-surface/70"
          }`}
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
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 shrink-0 flex items-center gap-2 ${
                isActive
                  ? "bg-sb-on-surface text-sb-surface"
                  : isToday
                    ? "bg-sb-surface-container-high text-sb-on-surface"
                    : "text-sb-on-surface-variant/60 hover:text-sb-on-surface/70"
              }`}
            >
              <span>{short}</span>
              <span
                className={`h-5 min-w-5 px-1 flex items-center justify-center text-[10px] font-semibold rounded-md ${
                  isActive
                    ? "bg-sb-surface/20 text-sb-surface"
                    : isToday
                      ? "bg-sb-on-surface text-sb-surface"
                      : "bg-sb-surface text-sb-on-surface-variant/50"
                }`}
              >
                {items.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* ═══ SUBSTITUTIONS ═══ */}
      {substitutions.length > 0 && (
        <div className="p-5 rounded-2xl bg-sb-surface border border-sb-outline-variant/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 flex items-center justify-center rounded-lg bg-sb-surface-container-high">
              <ArrowLeftRight className="h-3.5 w-3.5 text-sb-on-surface-variant/50" />
            </div>
            <span className="text-sm font-semibold text-sb-on-surface">Suplencias</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-sb-surface-container text-sb-on-surface-variant/60">
              {substitutions.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {substitutions.map((sub) => (
              <div key={sub.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-sb-surface-container-high/50 transition-colors">
                <div className={`w-1 h-8 rounded-full shrink-0 ${sub.my_role === 'substitute' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-sb-on-surface truncate">
                    {sub.course_name} — {sub.grade} {sub.section}
                  </p>
                  <p className="text-[11px] text-sb-on-surface-variant/50 truncate">
                    {sub.my_role === 'substitute'
                      ? `Sustituyendo a ${sub.original_teacher_name}`
                      : `Sustituido por ${sub.substitute_teacher_name}`
                    } · {new Date(sub.date).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-1 shrink-0 rounded-md ${sub.my_role === 'substitute' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
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
            <div key={i} className="p-5 animate-pulse rounded-2xl bg-sb-surface border border-sb-outline-variant/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-3 w-16 rounded-md bg-sb-surface-container-high" />
                <div className="h-3 w-8 rounded-md bg-sb-surface-container-high" />
              </div>
              <div className="space-y-2.5">
                <div className="h-16 rounded-xl bg-sb-surface-container-high" />
                <div className="h-16 rounded-xl bg-sb-surface-container-high" />
              </div>
            </div>
          ))}
        </div>
      ) : horarios.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-sb-surface border border-sb-outline-variant/10">
          <div className="h-16 w-16 flex items-center justify-center mx-auto mb-4 rounded-2xl bg-sb-surface-container-high">
            <Calendar className="h-7 w-7 text-sb-on-surface-variant/30" />
          </div>
          <p className="text-sm font-semibold text-sb-on-surface">Sin horarios asignados</p>
          <p className="text-xs text-sb-on-surface-variant/50 mt-1 max-w-[240px] mx-auto">
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
                className={`rounded-2xl bg-sb-surface overflow-hidden transition-all duration-300 border ${isToday ? "border-sb-on-surface/30" : "border-sb-outline-variant/10"}`}
              >
                {/* Day header */}
                <div className={`px-5 py-3.5 flex items-center justify-between ${items.length > 0 ? "border-b border-sb-outline-variant/10" : ""}`}>
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all duration-200 ${
                        isToday ? "bg-sb-on-surface text-sb-surface" : "bg-sb-surface-container-high text-sb-on-surface-variant/60"
                      }`}
                    >
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-sb-on-surface">{label}</p>
                      <p className="text-[11px] text-sb-on-surface-variant/50">
                        {items.length === 0 ? "Sin clases" : `${items.length} clase${items.length !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </div>
                  {isToday && (
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-sb-on-surface text-sb-surface">
                      HOY
                    </span>
                  )}
                </div>

                {/* Classes */}
                {items.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <Coffee className="h-6 w-6 mx-auto mb-2 text-sb-on-surface-variant/20" />
                    <p className="text-xs text-sb-on-surface-variant/40">Día libre</p>
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
                            <p className="text-[11px] font-semibold w-12 text-right shrink-0 tabular-nums text-sb-on-surface-variant/50">
                              {formatTime(h.start_time)}
                            </p>
                            <div className="flex-1 h-px bg-sb-outline-variant/20" />
                            <p className="text-[11px] font-semibold w-12 text-left shrink-0 tabular-nums text-sb-on-surface-variant/50">
                              {formatTime(h.end_time)}
                            </p>
                          </div>

                          {/* Class card */}
                          <button
                            onClick={() => handleHorarioClick(h)}
                            className={`w-full text-left p-4 rounded-xl transition-all duration-200 group ${
                              isNowClass
                                ? "bg-sb-on-surface text-sb-surface"
                                : "bg-sb-surface-container-high/50 border border-sb-outline-variant/10 hover:border-sb-on-surface/30"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                <div
                                  className={`h-10 w-10 flex items-center justify-center shrink-0 rounded-xl transition-transform duration-200 group-hover:scale-110 ${
                                    isNowClass ? "bg-sb-surface/15" : "bg-sb-surface"
                                  }`}
                                >
                                  <BookOpen className={`h-4 w-4 ${isNowClass ? "text-sb-surface/80" : "text-sb-on-surface-variant/60"}`} />
                                </div>
                                <div className="min-w-0">
                                  <p className={`text-sm font-semibold truncate ${isNowClass ? "text-sb-surface" : "text-sb-on-surface"}`}>
                                    {h.course_name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[11px] ${isNowClass ? "text-sb-surface/60" : "text-sb-on-surface-variant/50"}`}>
                                      {h.grade} {h.section}
                                    </span>
                                    {h.classroom && (
                                      <>
                                        <span className={isNowClass ? "text-sb-surface/30" : "text-sb-on-surface-variant/30"}>·</span>
                                        <span className={`flex items-center gap-1 text-[11px] ${isNowClass ? "text-sb-surface/60" : "text-sb-on-surface-variant/50"}`}>
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
                                  <span className="text-[9px] font-bold px-2 py-0.5 mr-1 rounded-md bg-sb-surface/20 text-sb-surface">
                                    AHORA
                                  </span>
                                )}
                                <ChevronRight
                                  className={`h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 ${isNowClass ? "text-sb-surface/40" : "text-sb-on-surface-variant/40"}`}
                                />
                              </div>
                            </div>
                          </button>

                          {/* Recess indicator */}
                          {showRecess && (
                            <div className="flex items-center gap-2.5 px-4 py-2 my-0.5">
                              <div className="flex-1 h-px bg-sb-outline-variant/20" />
                              <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-sb-on-surface-variant/30">
                                <Coffee className="h-3 w-3" />
                                Receso {gap}m
                              </span>
                              <div className="flex-1 h-px bg-sb-outline-variant/20" />
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

      {/* ═══ DETAIL MODAL ═══ */}
      <DetailModal
        horario={selectedHorario}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedHorario(null) }}
      />
    </div>
  )
}
