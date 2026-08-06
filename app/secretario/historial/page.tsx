"use client"

import * as React from "react"
import { Clock, User, FileText, GraduationCap, Settings, Trash2, Search, X, Filter, Plus, Upload, Download, BookOpen, CalendarDays, AlertCircle, ChevronDown, Activity, Hash, Command } from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import { SbBtn } from "@/components/ui/sb"

interface LogEntry { id: string; action: string; entity: string; entity_id: string; details: string; user_name: string; created_at: string }

const actionConfig: Record<string, { icon: typeof FileText; color: string; bg: string; label: string }> = {
  create:    { icon: Plus,    color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Creación" },
  update:    { icon: Settings, color: "text-blue-500", bg: "bg-blue-500/10", label: "Actualización" },
  delete:    { icon: Trash2,  color: "text-red-500", bg: "bg-red-500/10", label: "Eliminación" },
  enroll:    { icon: GraduationCap, color: "text-violet-500", bg: "bg-violet-500/10", label: "Matrícula" },
  upload:    { icon: Upload,  color: "text-cyan-500", bg: "bg-cyan-500/10", label: "Subida" },
  download:  { icon: Download, color: "text-indigo-500", bg: "bg-indigo-500/10", label: "Descarga" },
}

const entityLabels: Record<string, string> = {
  student: "Alumno", enrollment: "Matrícula", document: "Documento",
  course: "Curso", schedule: "Horario", user: "Usuario",
  parent: "Apoderado", payment: "Pago", certificate: "Certificado",
  communication: "Comunicado", meeting: "Reunión",
}

const entityColors: Record<string, string> = {
  student: "bg-blue-500/8 text-blue-500",
  enrollment: "bg-violet-500/8 text-violet-500",
  document: "bg-cyan-500/8 text-cyan-500",
  course: "bg-amber-500/8 text-amber-500",
  schedule: "bg-emerald-500/8 text-emerald-500",
  parent: "bg-pink-500/8 text-pink-500",
  communication: "bg-indigo-500/8 text-indigo-500",
  meeting: "bg-rose-500/8 text-rose-500",
  payment: "bg-green-500/8 text-green-500",
  user: "bg-slate-500/8 text-slate-500",
}

function getEntityLabel(e: string) { return entityLabels[e.toLowerCase()] || e }

function getEntityColor(e: string) { return entityColors[e.toLowerCase()] || "bg-sb-surface-container text-sb-on-surface-variant/60" }

function formatRelativeTime(dateStr: string) {
  const now = Date.now()
  const d = new Date(dateStr).getTime()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Ahora"
  if (mins < 60) return `Hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Hace ${days}d`
  return new Date(dateStr).toLocaleDateString("es-PE", { day: "numeric", month: "short" })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
}

const listItem = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, filter: "blur(8px)", y: -10 },
}

export default function HistorialPage() {
  const [logs, setLogs] = React.useState<LogEntry[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(true)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [filter, setFilter] = React.useState("all")
  const [entityFilter, setEntityFilter] = React.useState("all")
  const [showFilters, setShowFilters] = React.useState(false)
  const [fromDate, setFromDate] = React.useState("")
  const [toDate, setToDate] = React.useState("")
  const [isFocused, setIsFocused] = React.useState(false)

  const debounceRef = React.useRef<NodeJS.Timeout | undefined>(undefined)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => { fetchLogs(1, true) }, [search, filter, entityFilter, fromDate, toDate])

  // Keyboard shortcut: Ctrl/Cmd + K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const fetchLogs = async (p: number = 1, reset: boolean = false) => {
    if (reset) { setLoading(true); setLogs([]); setPage(1) } else { setLoadingMore(true) }
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set("q", search)
      if (filter !== "all") params.set("action", filter)
      if (entityFilter !== "all") params.set("entity", entityFilter)
      if (fromDate) params.set("from", fromDate)
      if (toDate) params.set("to", toDate)
      params.set("page", String(p))
      const res = await fetch(`/api/secretario/historial?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        const newLogs = data.logs || []
        if (reset) setLogs(newLogs)
        else setLogs(prev => [...prev, ...newLogs])
        setTotal(data.total || 0)
        setPage(p)
      }
    } catch {} finally { setLoading(false); setLoadingMore(false) }
  }

  const loadMore = () => fetchLogs(page + 1, false)

  const hasMore = logs.length < total

  const onSearchChange = (val: string) => {
    setSearchInput(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(val), 400)
  }

  const clearSearch = () => { setSearchInput(""); setSearch("") }

  React.useEffect(() => () => clearTimeout(debounceRef.current), [])

  const actionFilters = [
    { value: "all", label: "Todas" },
    ...Object.entries(actionConfig).map(([value, cfg]) => ({ value, label: cfg.label }))
  ]

  const entityFilters = [
    { value: "all", label: "Todas" },
    { value: "student", label: "Alumnos" },
    { value: "enrollment", label: "Matrículas" },
    { value: "document", label: "Documentos" },
    { value: "course", label: "Cursos" },
    { value: "schedule", label: "Horarios" },
    { value: "parent", label: "Apoderados" },
    { value: "communication", label: "Comunicados" },
    { value: "meeting", label: "Reuniones" },
    { value: "payment", label: "Pagos" },
    { value: "user", label: "Usuarios" },
  ]

  const activeFilterCount = [filter !== "all", entityFilter !== "all", fromDate, toDate].filter(Boolean).length

  function parseDetails(details: string) {
    try {
      const parsed = JSON.parse(details)
      if (typeof parsed === "object" && parsed !== null) {
        return Object.entries(parsed).slice(0, 3).map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-1.5 mr-3">
            <span className="text-[10px] text-sb-on-surface-variant/40">{k}:</span>
            <span className="text-[11px] text-sb-on-surface/70 font-medium">{String(v)}</span>
          </span>
        ))
      }
    } catch {}
    return <span className="text-[11px] text-sb-on-surface/60">{details}</span>
  }

  // Group logs by date
  const groupedLogs = logs.reduce((acc, log) => {
    const date = formatDate(log.created_at)
    if (!acc[date]) acc[date] = []
    acc[date].push(log)
    return acc
  }, {} as Record<string, LogEntry[]>)

  return (
    <div className="space-y-5">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Historial</h1>
          <p className="text-sm text-sb-on-surface-variant/50 mt-1">Registro de actividades del sistema</p>
        </motion.div>

        {/* Search Bar */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
          <div className={`bg-sb-surface rounded-2xl transition-all duration-300 ${isFocused ? 'ring-2 ring-sb-on-surface/10 shadow-lg shadow-sb-on-surface/5' : ''}`}>
            <div className="flex items-center gap-2 p-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sb-on-surface-variant/30" />
                <input
                  ref={inputRef}
                  placeholder="Buscar por usuario, acción o detalle..."
                  value={searchInput}
                  onChange={e => onSearchChange(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="w-full h-12 pl-12 pr-20 bg-transparent text-sm text-sb-on-surface placeholder:text-sb-on-surface-variant/30 focus:outline-none"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {searchInput && (
                    <button
                      onClick={clearSearch}
                      className="h-7 w-7 flex items-center justify-center rounded-lg text-sb-on-surface-variant/30 hover:text-sb-on-surface-variant hover:bg-sb-surface-container transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-sb-surface-container/50 text-sb-on-surface-variant/30">
                    <Command className="h-3 w-3" />
                    <span className="text-[10px] font-medium">K</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`h-10 px-4 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
                  showFilters || activeFilterCount > 0
                    ? "bg-sb-on-surface text-sb-surface"
                    : "bg-sb-surface-container text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high"
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                Filtros
                {activeFilterCount > 0 && (
                  <span className="h-4 w-4 rounded-full bg-sb-on-surface/20 text-[9px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
              <div className="bg-sb-surface rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">Filtros avanzados</p>
                  {activeFilterCount > 0 && (
                    <button onClick={() => { setFilter("all"); setEntityFilter("all"); setFromDate(""); setToDate("") }} className="text-[10px] text-sb-on-surface hover:underline">
                      Limpiar filtros
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2">Tipo de acción</p>
                    <div className="flex flex-wrap gap-1.5">
                      {actionFilters.map(f => (
                        <button key={f.value} onClick={() => setFilter(f.value)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${filter === f.value ? "bg-sb-on-surface text-sb-surface" : "bg-sb-surface-container text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high"}`}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2">Entidad</p>
                    <div className="flex flex-wrap gap-1.5">
                      {entityFilters.map(f => (
                        <button key={f.value} onClick={() => setEntityFilter(f.value)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${entityFilter === f.value ? "bg-sb-on-surface text-sb-surface" : "bg-sb-surface-container text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high"}`}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2">Desde</p>
                      <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="sb-input rounded-xl text-xs h-9 w-full" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2">Hasta</p>
                      <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="sb-input rounded-xl text-xs h-9 w-full" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Count */}
        {!loading && total > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 flex items-center justify-between">
            <p className="text-xs text-sb-on-surface-variant/40">
              {total} registro{total !== 1 ? "s" : ""}
              {search && <> para "<span className="text-sb-on-surface font-medium">{search}</span>"</>}
            </p>
            {(search || activeFilterCount > 0) && (
              <button onClick={() => { clearSearch(); setFilter("all"); setEntityFilter("all"); setFromDate(""); setToDate("") }} className="text-[10px] text-sb-on-surface-variant/30 hover:text-sb-on-surface-variant/60 transition-colors">
                Limpiar búsqueda
              </button>
            )}
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-sb-surface rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-sb-surface-container" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-sb-surface-container rounded w-1/4" />
                    <div className="h-3 bg-sb-surface-container rounded w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && logs.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-sb-surface rounded-2xl py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-sb-surface-container flex items-center justify-center mx-auto mb-4">
              <Activity className="h-7 w-7 text-sb-on-surface-variant/20" />
            </div>
            <p className="text-sm font-medium text-sb-on-surface-variant/40">
              {search || activeFilterCount > 0 ? "Sin resultados para esta búsqueda" : "Sin registros de actividad"}
            </p>
            {(search || activeFilterCount > 0) && (
              <button onClick={() => { clearSearch(); setFilter("all"); setEntityFilter("all"); setFromDate(""); setToDate("") }} className="mt-3 text-xs text-sb-on-surface hover:underline">
                Limpiar filtros
              </button>
            )}
          </motion.div>
        )}

        {/* Logs Grouped by Date */}
        {!loading && Object.entries(groupedLogs).map(([date, dateLogs]) => (
          <motion.div key={date} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            {/* Date Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="h-7 px-3 rounded-lg bg-sb-surface flex items-center justify-center">
                <CalendarDays className="h-3.5 w-3.5 text-sb-on-surface-variant/40" />
              </div>
              <span className="text-xs font-semibold text-sb-on-surface-variant/60">{date}</span>
              <div className="flex-1 h-px bg-sb-outline-variant/15" />
              <span className="text-[10px] text-sb-on-surface-variant/30">{dateLogs.length} evento{dateLogs.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Logs List */}
            <div className="bg-sb-surface rounded-2xl overflow-hidden divide-y divide-sb-outline-variant/10">
              <AnimatePresence>
                {dateLogs.map((log, i) => {
                  const cfg = actionConfig[log.action] || { icon: FileText, color: "text-sb-on-surface-variant", bg: "bg-sb-surface-container", label: log.action }
                  const Icon = cfg.icon
                  const entColor = getEntityColor(log.entity)
                  return (
                    <motion.div
                      key={log.id}
                      variants={listItem}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      transition={{ delay: i * 0.02, duration: 0.3 }}
                      className="flex items-start gap-4 p-4 hover:bg-sb-surface-container-low/30 transition-colors group"
                    >
                      {/* Icon */}
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                        <Icon className={`h-4.5 w-4.5 ${cfg.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[11px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                          <span className="text-[10px] text-sb-on-surface-variant/20">·</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${entColor}`}>{getEntityLabel(log.entity)}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5 mb-1.5">{parseDetails(log.details)}</div>
                        <div className="flex items-center gap-3 text-[10px] text-sb-on-surface-variant/35">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {log.user_name}
                          </span>
                          <span className="flex items-center gap-1" title={log.created_at ? new Date(log.created_at).toLocaleString("es-PE") : ""}>
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(log.created_at)}
                          </span>
                          <span className="hidden sm:inline text-sb-on-surface-variant/20">{formatTime(log.created_at)}</span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}

        {/* Load More */}
        {!loading && hasMore && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4 pb-2 text-center">
            <SbBtn rounded onClick={loadMore} disabled={loadingMore} className="px-6 py-2.5 flex items-center gap-2 mx-auto">
              {loadingMore ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-sb-on-surface-variant/20 border-t-sb-on-surface-variant/60 rounded-full animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  Cargar más
                  <span className="text-[10px] opacity-60">({total - logs.length} restantes)</span>
                </>
              )}
            </SbBtn>
          </motion.div>
        )}
      </div>
  )
}
