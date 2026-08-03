"use client"

import * as React from "react"
import { Users, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { SbBtn, SbInput } from "@/components/ui/sb"
import { cn } from "@/lib/utils"

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  present:    { label: "Presente",   color: "bg-emerald-500/10 text-emerald-600",   dot: "bg-emerald-500" },
  late:       { label: "Tardanza",   color: "bg-amber-500/10 text-amber-600",       dot: "bg-amber-500" },
  absent:     { label: "Ausente",    color: "bg-red-500/10 text-red-600",           dot: "bg-red-500" },
  justified:  { label: "Justificado",color: "bg-blue-500/10 text-blue-600",         dot: "bg-blue-500" },
}

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

function MiniCalendar({ date, onSelect }: { date: string; onSelect: (d: string) => void }) {
  const current = new Date(date + "T12:00:00")
  const [viewDate, setViewDate] = React.useState(new Date(current.getFullYear(), current.getMonth(), 1))

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()

  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const today = new Date().toISOString().split("T")[0]
  const selectedDate = date

  const days: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  const handlePrev = () => setViewDate(new Date(year, month - 1, 1))
  const handleNext = () => setViewDate(new Date(year, month + 1, 1))

  const selectDate = (day: number) => {
    const d = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    onSelect(d)
  }

  return (
    <div className="px-5 py-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-sb-on-surface capitalize">
          {viewDate.toLocaleDateString("es-PE", { month: "long", year: "numeric" })}
        </p>
        <div className="flex gap-0.5">
          <button onClick={handlePrev}
            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-sb-surface-container-high transition-colors text-sb-on-surface-variant/50">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleNext}
            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-sb-surface-container-high transition-colors text-sb-on-surface-variant/50">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center py-1.5">
            <span className="text-[10px] font-semibold text-sb-on-surface-variant/30 uppercase tracking-wider">{d}</span>
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-px">
        {days.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          const isToday = dateStr === today
          const isSelected = dateStr === selectedDate
          const isFuture = dateStr > today

          return (
            <button
              key={day}
              onClick={() => !isFuture && selectDate(day)}
              disabled={isFuture}
              className={cn(
                "h-8 w-full rounded-lg flex items-center justify-center text-[12px] font-medium transition-all duration-150",
                isFuture && "text-sb-on-surface-variant/15 cursor-not-allowed",
                isSelected && !isToday && "bg-sb-on-surface text-sb-surface",
                isToday && !isSelected && "bg-sb-primary/10 text-sb-primary ring-1 ring-sb-primary/30",
                isToday && isSelected && "bg-sb-primary text-sb-on-primary",
                !isSelected && !isToday && !isFuture && "text-sb-on-surface/70 hover:bg-sb-surface-container-high"
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function AsistenciaDocentesPage() {
  const [date, setDate] = React.useState(new Date().toISOString().split("T")[0])
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/secretario/teacher-attendance?date=${date}`)
      const json = await res.json()
      setData(json)
    } catch {} finally { setLoading(false) }
  }

  React.useEffect(() => { fetchData() }, [date])

  const teachers = data?.teachers || []
  const filtered = teachers.filter((t: any) => {
    const q = searchTerm.toLowerCase()
    const matchSearch = !q || t.full_name?.toLowerCase().includes(q) || t.dni?.includes(q) || t.email?.toLowerCase().includes(q)
    const matchStatus = statusFilter === "all" || t.attendance?.status === statusFilter
    return matchSearch && matchStatus
  })

  const summary = data?.summary || { present: 0, late: 0, absent: 0, justified: 0, pending: 0 }
  const total = summary.present + summary.late + summary.absent + summary.justified + summary.pending
  const pctPresent = total > 0 ? Math.round(((summary.present + summary.late) / total) * 100) : 0

  const navigateDate = (dir: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + dir)
    setDate(d.toISOString().split("T")[0])
  }

  const isToday = date === new Date().toISOString().split("T")[0]

  return (
    <div className="space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Asistencia de Docentes</h1>
              <p className="text-sm text-sb-on-surface-variant/50 mt-1">
                Registro de entrada y salida del personal docente
              </p>
            </div>
            <SbBtn variant="outlined" className="gap-2 text-xs">
              <Download className="h-3.5 w-3.5" />
              Exportar
            </SbBtn>
          </div>
        </motion.div>

        {/* Date Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <div className="bg-sb-surface rounded-2xl overflow-hidden">
            {/* Top bar with month/year and nav */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-sb-outline-variant/8">
              <div>
                <p className="text-lg font-bold text-sb-on-surface capitalize">
                  {new Date(date + "T12:00:00").toLocaleDateString("es-PE", { weekday: "long" })}
                </p>
                <p className="text-[11px] text-sb-on-surface-variant/50 mt-0.5">
                  {new Date(date + "T12:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}
                  {isToday && <span className="ml-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sb-on-surface/8 text-sb-on-surface text-[9px] font-semibold">HOY</span>}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {!isToday && (
                  <SbBtn rounded className="text-[11px] h-8 px-3" onClick={() => setDate(new Date().toISOString().split("T")[0])}>
                    Hoy
                  </SbBtn>
                )}
                <button onClick={() => navigateDate(-1)}
                  className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-sb-surface-container-high transition-colors text-sb-on-surface-variant">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => navigateDate(1)} disabled={isToday}
                  className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-sb-surface-container-high transition-colors text-sb-on-surface-variant disabled:opacity-25">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Mini Calendar */}
            <MiniCalendar date={date} onSelect={setDate} />
          </div>
        </motion.div>

        {/* Summary Bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="bg-sb-surface rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-sb-on-surface/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-sb-on-surface" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-sb-on-surface">{total} docentes</p>
                  <p className="text-[11px] text-sb-on-surface-variant/50">{pctPresent}% asistencia</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-sb-surface-container rounded-full overflow-hidden flex mb-5">
              {summary.present > 0 && (
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${total > 0 ? (summary.present / total) * 100 : 0}%` }}
                />
              )}
              {summary.late > 0 && (
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${total > 0 ? (summary.late / total) * 100 : 0}%` }}
                />
              )}
              {summary.justified > 0 && (
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${total > 0 ? (summary.justified / total) * 100 : 0}%` }}
                />
              )}
              {summary.absent > 0 && (
                <div
                  className="h-full bg-red-500 transition-all duration-500"
                  style={{ width: `${total > 0 ? (summary.absent / total) * 100 : 0}%` }}
                />
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4">
              {[
                { label: "Presentes", count: summary.present, color: "bg-emerald-500", textColor: "text-emerald-600", filterKey: "present" },
                { label: "Tardanzas", count: summary.late, color: "bg-amber-500", textColor: "text-amber-600", filterKey: "late" },
                { label: "Ausentes", count: summary.absent, color: "bg-red-500", textColor: "text-red-600", filterKey: "absent" },
                { label: "Justificados", count: summary.justified, color: "bg-blue-500", textColor: "text-blue-600", filterKey: "justified" },
                { label: "Sin marcar", count: summary.pending, color: "bg-sb-on-surface-variant/30", textColor: "text-sb-on-surface-variant/60", filterKey: "pending" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => setStatusFilter(statusFilter === item.filterKey ? "all" : item.filterKey)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === item.filterKey
                      ? "bg-sb-surface-container ring-1 ring-sb-outline-variant/30"
                      : "hover:bg-sb-surface-container-low"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${item.color}`} />
                  <span className={`text-xs font-medium ${item.textColor}`}>{item.label}</span>
                  <span className="text-xs font-bold text-sb-on-surface">{item.count}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-4"
        >
          <div className="relative max-w-md">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre, DNI o email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="sb-input rounded-xl text-sm pl-10 h-10"
            />
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-sb-surface rounded-2xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_120px_120px_120px_100px] gap-4 px-5 py-3 border-b border-sb-outline-variant/10">
              <span className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">Docente</span>
              <span className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">Entrada</span>
              <span className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">Salida</span>
              <span className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">Horas</span>
              <span className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider text-right">Estado</span>
            </div>

            {/* Table Body */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-6 w-6 rounded-full border-2 border-sb-primary border-t-transparent animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <Users className="h-12 w-12 mx-auto mb-3 text-sb-on-surface-variant/10" />
                <p className="text-sm font-medium text-sb-on-surface-variant/40">No se encontraron docentes</p>
                <p className="text-xs text-sb-on-surface-variant/25 mt-1">Intenta con otra fecha o búsqueda</p>
              </div>
            ) : (
              <div className="divide-y divide-sb-outline-variant/8">
                {filtered.map((teacher: any, i: number) => {
                  const att = teacher.attendance
                  const status = att?.status
                  const statusCfg = status ? STATUS_CONFIG[status] : null

                  const calcHours = () => {
                    if (!att?.check_in || !att?.check_out) return "--"
                    const inTime = new Date(`2000-01-01T${att.check_in}`)
                    const outTime = new Date(`2000-01-01T${att.check_out}`)
                    const diff = outTime.getTime() - inTime.getTime()
                    const hours = Math.floor(diff / 3600000)
                    const mins = Math.floor((diff % 3600000) / 60000)
                    return `${hours}h ${mins}m`
                  }

                  return (
                    <motion.div
                      key={teacher.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="grid grid-cols-[1fr_120px_120px_120px_100px] gap-4 px-5 py-4 hover:bg-sb-surface-container-low/40 transition-colors items-center"
                    >
                      {/* Teacher Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-sb-surface-container flex items-center justify-center shrink-0">
                          <span className="text-[11px] font-semibold text-sb-on-surface-variant/50">
                            {teacher.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-sb-on-surface truncate">{teacher.full_name}</p>
                          <p className="text-[11px] text-sb-on-surface-variant/40 truncate">{teacher.dni || teacher.email}</p>
                        </div>
                      </div>

                      {/* Check In */}
                      <div className="flex items-center gap-1.5">
                        {att?.check_in ? (
                          <>
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span className="text-xs font-medium text-sb-on-surface/70">{att.check_in.slice(0, 5)}</span>
                          </>
                        ) : (
                          <span className="text-xs text-sb-on-surface-variant/20">--:--</span>
                        )}
                      </div>

                      {/* Check Out */}
                      <div className="flex items-center gap-1.5">
                        {att?.check_out ? (
                          <>
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            <span className="text-xs font-medium text-sb-on-surface/70">{att.check_out.slice(0, 5)}</span>
                          </>
                        ) : (
                          <span className="text-xs text-sb-on-surface-variant/20">--:--</span>
                        )}
                      </div>

                      {/* Hours */}
                      <span className="text-xs font-medium text-sb-on-surface/60">{calcHours()}</span>

                      {/* Status */}
                      <div className="flex justify-end">
                        {statusCfg ? (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${statusCfg.color}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                            {statusCfg.label}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-sb-surface-container text-sb-on-surface-variant/40">
                            <span className="h-1.5 w-1.5 rounded-full bg-sb-on-surface-variant/20" />
                            Sin marca
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
    </div>
  )
}
