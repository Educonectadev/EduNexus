"use client"

import * as React from "react"
import { Search, User, GraduationCap, Phone, BadgeCheck, ChevronRight, FileText, Calendar, BookOpen, Filter, X, Command, ArrowRight, Hash, CreditCard, Sparkles, Info } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { SbBtn, SbModal, SbModalBody } from "@/components/ui/sb"
import { useRouter } from "next/navigation"
import { SbfChipGroup, SbfResultsCount, SbfFilterPanel } from "@/components/ui/search-filter-bar"
import { PageCard } from "@/components/secretario/minimalist-page"
import "@/frontend.css"

interface Student {
  id: string; full_name: string; dni: string; grade_level: string; section: string
  status: string; code: string; gender: string; birth_date: string
  parent_name: string; parent_phone: string
  active_enrollments: number; total_documents: number
  academic_condition: string
}

const conditionConfig: Record<string, { label: string; color: string; bg: string }> = {
  studying: { label: "En curso", color: "text-blue-600", bg: "bg-blue-500/10" },
  promoted: { label: "Promovido", color: "text-emerald-600", bg: "bg-emerald-500/10" },
  repeating: { label: "Repitente", color: "text-rose-600", bg: "bg-rose-500/10" },
  recovery: { label: "Recuperación", color: "text-amber-600", bg: "bg-amber-500/10" },
}

const statusConfig: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  active: { label: "Activo", color: "text-emerald-600", dot: "bg-emerald-500", bg: "bg-emerald-500/8" },
  inactive: { label: "Inactivo", color: "text-sb-on-surface-variant/50", dot: "bg-sb-on-surface-variant/30", bg: "bg-sb-surface-container" },
  transferred: { label: "Trasladado", color: "text-amber-600", dot: "bg-amber-500", bg: "bg-amber-500/8" },
  graduated: { label: "Graduado", color: "text-blue-600", dot: "bg-blue-500", bg: "bg-blue-500/8" },
}

const listItem = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, filter: "blur(8px)", y: -10 },
}

function getAvatarColor(name: string) {
  const colors = ["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-amber-500", "bg-pink-500", "bg-cyan-500", "bg-rose-500"]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

const QUICK_TIPS = [
  { icon: User, text: "Por nombre", hint: "Busca por el nombre o apellidos del alumno" },
  { icon: CreditCard, text: "Por DNI", hint: "Busca por el número de DNI del alumno" },
  { icon: Hash, text: "Por código", hint: "Busca por el código único que tiene cada alumno" },
]

export default function BusquedaPage() {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<Student[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searched, setSearched] = React.useState(false)
  const [selected, setSelected] = React.useState<Student | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [showFilters, setShowFilters] = React.useState(false)
  const [filterGrade, setFilterGrade] = React.useState("")
  const [filterStatus, setFilterStatus] = React.useState("")
  const [isFocused, setIsFocused] = React.useState(false)

  const [grades, setGrades] = React.useState<string[]>([])
  const debounceRef = React.useRef<NodeJS.Timeout | undefined>(undefined)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    fetch('/api/secretario/academic-grades')
      .then(res => res.ok ? res.json() : [])
      .then(data => setGrades((data || []).map((g: any) => g.name)))
      .catch(() => {})
  }, [])

  React.useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(timer)
  }, [])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
      if (e.key === "Escape" && isFocused) {
        inputRef.current?.blur()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isFocused])

  const doSearch = React.useCallback(async (q: string, grade: string, status: string) => {
    if (!q.trim() && !grade && !status) { setResults([]); setSearched(false); return }
    setLoading(true); setSearched(true)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set("q", q)
      if (grade) params.set("grade", grade)
      if (status) params.set("status", status)
      const res = await fetch(`/api/secretario/busqueda?${params.toString()}`)
      if (res.ok) setResults(await res.json())
    } catch {} finally { setLoading(false) }
  }, [])

  const updateCondition = async (studentId: string, cond: string) => {
    try {
      const res = await fetch(`/api/secretario/busqueda?student_id=${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ academic_condition: cond })
      })
      if (res.ok) {
        setResults(prev => prev.map(s => s.id === studentId ? { ...s, academic_condition: cond } : s))
        if (selected?.id === studentId) setSelected({ ...selected, academic_condition: cond })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const onQueryChange = (val: string) => {
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val, filterGrade, filterStatus), 300)
  }

  React.useEffect(() => { return () => clearTimeout(debounceRef.current) }, [])

  React.useEffect(() => {
    if (searched) doSearch(query, filterGrade, filterStatus)
  }, [filterGrade, filterStatus])

  const statuses = [
    { value: "", label: "Todos" },
    { value: "active", label: "Activos" },
    { value: "inactive", label: "Inactivos" },
    { value: "transferred", label: "Trasladados" },
    { value: "graduated", label: "Graduados" },
  ]

  const activeFilters = [filterGrade, filterStatus].filter(Boolean).length
  const clearFilters = () => { setFilterGrade(""); setFilterStatus("") }

  const statusCounts = statuses
    .filter(s => s.value)
    .map(s => ({ ...s, count: results.filter(r => r.status === s.value).length }))
    .filter(s => s.count > 0)

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark class="bg-sb-on-surface/15 text-sb-on-surface rounded px-0.5">$1</mark>')
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* HERO SEARCH */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl bg-sb-surface border border-sb-outline-variant/10"
      >
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-sb-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-sb-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sb-on-surface-variant/60">
              Expediente académico
            </span>
          </div>
          <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight text-sb-on-surface">
            Busca a cualquier alumno
          </h2>
          <p className="text-sm text-sb-on-surface-variant/50 mt-1.5 max-w-xl">
            Encuentra su expediente completo por nombre, DNI o código, y accede a su matrícula, documentos y apoderado en segundos.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sb-on-surface-variant/40 transition-colors group-focus-within:text-sb-primary" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Nombre, DNI o código..."
                  className="w-full h-14 pl-12 pr-24 rounded-2xl bg-sb-surface-container-low border border-sb-outline-variant/15 text-[15px] text-sb-on-surface outline-none transition-all placeholder:text-sb-on-surface-variant/35 focus:bg-sb-surface focus:border-sb-primary focus:ring-4 focus:ring-sb-primary/10"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {query && (
                    <button
                      onClick={() => { setQuery(""); onQueryChange("") }}
                      className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-sb-surface-container-high transition-colors"
                    >
                      <X className="h-4 w-4 text-sb-on-surface-variant/50" />
                    </button>
                  )}
                  <kbd className="hidden sm:flex items-center gap-1 h-8 px-2.5 rounded-lg bg-sb-surface-container-high text-[10px] font-semibold text-sb-on-surface-variant/50">
                    <Command className="h-3 w-3" /> K
                  </kbd>
                </div>
              </div>
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`h-14 px-4 rounded-2xl border flex items-center justify-center gap-2 text-[13px] font-medium transition-all ${
                  showFilters || activeFilters > 0
                    ? "bg-sb-primary text-sb-on-primary border-sb-primary shadow-lg shadow-sb-primary/15"
                    : "bg-sb-surface-container-low border-sb-outline-variant/15 text-sb-on-surface-variant/70 hover:border-sb-on-surface/30 hover:text-sb-on-surface"
                }`}
              >
                <Filter className="h-4 w-4" />
                Filtros
                {activeFilters > 0 && (
                  <span className="h-5 min-w-5 px-1.5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                    {activeFilters}
                  </span>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-sb-on-surface-variant/40 mr-1">Estado:</span>
              {[
                { value: "", label: "Todos", dot: "bg-sb-outline" },
                { value: "active", label: "Activos", dot: "bg-emerald-500" },
                { value: "inactive", label: "Inactivos", dot: "bg-sb-on-surface-variant/30" },
                { value: "transferred", label: "Trasladados", dot: "bg-amber-500" },
                { value: "graduated", label: "Graduados", dot: "bg-blue-500" },
              ].map((chip) => (
                <button
                  key={chip.value}
                  onClick={() => setFilterStatus(chip.value)}
                  className={`flex items-center gap-1.5 h-8 px-3 rounded-full border text-[12px] font-medium transition-all ${
                    filterStatus === chip.value
                      ? "bg-sb-primary text-sb-on-primary border-sb-primary"
                      : "border-sb-outline-variant/15 text-sb-on-surface-variant/60 hover:border-sb-on-surface/30 hover:text-sb-on-surface"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${chip.dot} ${filterStatus === chip.value ? "bg-white" : ""}`} />
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Info: condición académica */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="flex items-start gap-3 rounded-2xl bg-sb-surface border border-sb-outline-variant/10 p-4"
      >
        <div className="h-8 w-8 rounded-xl bg-sb-primary/8 flex items-center justify-center shrink-0">
          <Info className="h-4 w-4 text-sb-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-sb-on-surface">¿Cómo se aprueba o pasa de grado a un alumno?</p>
          <p className="text-[12px] text-sb-on-surface-variant/60 mt-0.5 leading-snug">
            Al final del año, abre el expediente de cada alumno y usa la <span className="font-medium text-sb-on-surface">Condición Académica</span> para marcarlo como <span className="font-medium text-emerald-600">Promovido</span>, <span className="font-medium text-rose-600">Repite de Grado</span> o <span className="font-medium text-amber-600">Recuperación</span>. La condición se determina según el promedio de las notas que registran los docentes.
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <SbfFilterPanel
              title="Filtros avanzados"
              showClear={activeFilters > 0}
              onClear={clearFilters}
            >
              <div className="sbf-filter-grid">
                <div>
                  <p className="sbf-filter-row-label">Grado</p>
                  <SbfChipGroup
                    options={grades.map(g => ({ value: g, label: g }))}
                    value={filterGrade}
                    onChange={setFilterGrade}
                    allLabel="Todos"
                  />
                </div>
                <div>
                  <p className="sbf-filter-row-label">Estado</p>
                  <SbfChipGroup
                    options={statuses.filter(s => s.value).map(s => ({ value: s.value, label: s.label }))}
                    value={filterStatus}
                    onChange={setFilterStatus}
                    allLabel="Todos"
                  />
                </div>
              </div>
            </SbfFilterPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <div className="space-y-3">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-sb-surface rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!searched && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <PageCard>
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.15 }}
                  className="h-16 w-16 rounded-2xl bg-gradient-to-br from-sb-surface-container to-sb-primary/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-sb-outline-variant/10"
                >
                  <Sparkles className="h-7 w-7 text-sb-primary" />
                </motion.div>
                <p className="text-sm font-medium text-sb-on-surface-variant/40">¿Qué estás buscando?</p>
                <p className="text-xs text-sb-on-surface-variant/25 mt-1">Escribe un nombre, DNI o código para encontrar al alumno</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {QUICK_TIPS.map((tip, i) => {
                  const TipIcon = tip.icon
                  return (
                    <motion.button
                      key={tip.text}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.05 }}
                      onClick={() => inputRef.current?.focus()}
                      whileHover={{ y: -2 }}
                      className="flex items-center gap-3 p-4 rounded-xl bg-sb-surface-container hover:bg-sb-surface-container-high transition-colors text-left group border border-sb-outline-variant/20"
                    >
                      <div className="h-10 w-10 rounded-xl bg-sb-primary/8 flex items-center justify-center shrink-0 transition-colors group-hover:bg-sb-primary/15">
                        <TipIcon className="h-5 w-5 text-sb-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-sb-on-surface/80">{tip.text}</p>
                        <p className="text-[11px] text-sb-on-surface/50 font-medium truncate mt-0.5">{tip.hint}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-sb-on-surface/30 group-hover:translate-x-0.5 transition-transform" />
                    </motion.button>
                  )
                })}
              </div>

              <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-sb-on-surface-variant/25">
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-sb-surface-container/50 font-mono">Ctrl</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-sb-surface-container/50 font-mono">K</kbd>
                  <span>para buscar</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-sb-surface-container/50 font-mono">Esc</kbd>
                  <span>para limpiar</span>
                </span>
              </div>
            </PageCard>
          </motion.div>
        )}

        {searched && !loading && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-sb-surface rounded-2xl py-20 text-center border border-sb-outline-variant/10"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.1 }}
              className="h-16 w-16 rounded-2xl bg-gradient-to-br from-sb-surface-container to-sb-primary/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-sb-outline-variant/10"
            >
              <Search className="h-7 w-7 text-sb-primary" />
            </motion.div>
            <p className="text-sm font-medium text-sb-on-surface-variant/40">
              {query ? `Sin resultados para "${query}"` : "No hay alumnos que coincidan"}
            </p>
            <p className="text-xs text-sb-on-surface-variant/25 mt-1">Revisa la ortografía o prueba con otros filtros</p>
            {activeFilters > 0 && (
              <button onClick={clearFilters} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sb-surface-container text-xs font-medium text-sb-on-surface hover:bg-sb-surface-container-high transition-colors">
                <X className="h-3 w-3" />
                Limpiar filtros
              </button>
            )}
          </motion.div>
        )}

        {searched && !loading && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-2"
          >
            <p className="text-sm text-sb-on-surface-variant/60 mr-1">
              <span className="font-bold text-sb-on-surface">{results.length}</span>
              {results.length !== 1 ? " alumnos encontrados" : " alumno encontrado"}
              {query && <> para <span className="font-semibold text-sb-primary">"{query}"</span></>}
            </p>
            <div className="flex items-center gap-1.5 ml-auto">
              {statusCounts.map((s) => {
                const st = statusConfig[s.value]
                return (
                  <span key={s.value} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${st.color} ${st.bg}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                    {s.count} {st.label.toLowerCase()}
                  </span>
                )
              })}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {results.map((s, i) => {
            const st = statusConfig[s.status] || statusConfig.inactive
            const avatarColor = getAvatarColor(s.full_name)
            return (
              <motion.button
                key={s.id}
                variants={listItem}
                initial="hidden"
                animate="show"
                exit="exit"
                transition={{ delay: i * 0.03, duration: 0.3 }}
                onClick={() => { setSelected(s); setDetailOpen(true) }}
                className="w-full relative overflow-hidden bg-sb-surface rounded-2xl p-4 pl-5 flex items-center gap-4 hover:bg-sb-surface-container-low/60 transition-all text-left group border border-sb-outline-variant/10 hover:border-sb-outline-variant/25 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5"
              >
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-transparent group-hover:bg-sb-primary transition-all duration-300" />
                <div className={`h-12 w-12 rounded-2xl ${avatarColor} flex items-center justify-center shrink-0 ring-4 ring-sb-surface shadow-sm`}>
                  <span className="text-sm font-bold text-white">
                    {s.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className="text-sm font-semibold text-sb-on-surface truncate"
                      dangerouslySetInnerHTML={{ __html: highlightMatch(s.full_name, query) }}
                    />
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${st.color} ${st.bg}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                    {s.academic_condition && s.academic_condition !== 'studying' && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${conditionConfig[s.academic_condition]?.color || ''} ${conditionConfig[s.academic_condition]?.bg || 'bg-sb-surface-container'}`}>
                        {conditionConfig[s.academic_condition]?.label || s.academic_condition}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span
                      className="text-[11px] text-sb-on-surface-variant/50"
                      dangerouslySetInnerHTML={{ __html: highlightMatch(`DNI: ${s.dni}`, query) }}
                    />
                    {s.grade_level && (
                      <>
                        <span className="text-[10px] text-sb-on-surface-variant/20">·</span>
                        <span className="text-[11px] text-sb-on-surface-variant/50">{s.grade_level} {s.section}</span>
                      </>
                    )}
                    {s.code && (
                      <>
                        <span className="text-[10px] text-sb-on-surface-variant/20">·</span>
                        <span
                          className="text-[11px] text-sb-on-surface-variant/50"
                          dangerouslySetInnerHTML={{ __html: highlightMatch(`Cód: ${s.code}`, query) }}
                        />
                      </>
                    )}
                  </div>
                  {s.parent_name && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <User className="h-3 w-3 text-sb-on-surface-variant/25" />
                      <span className="text-[10px] text-sb-on-surface-variant/35 truncate">{s.parent_name}</span>
                    </div>
                  )}
                </div>
                <div className="hidden md:flex flex-col gap-1.5 shrink-0 mr-1">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sb-surface-container text-[11px] font-medium text-sb-on-surface-variant/60">
                    <GraduationCap className="h-3 w-3" /> {s.active_enrollments}
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sb-surface-container text-[11px] font-medium text-sb-on-surface-variant/60">
                    <FileText className="h-3 w-3" /> {s.total_documents}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-sb-on-surface-variant/20 group-hover:translate-x-0.5 group-hover:text-sb-primary transition-all shrink-0" />
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      {/* DETAIL MODAL */}
      <SbModal open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="520px">
        {selected && (
          <>
            <SbModalBody>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`h-16 w-16 rounded-2xl ${getAvatarColor(selected.full_name)} flex items-center justify-center ring-4 ring-sb-surface shadow-sm`}>
                      <span className="text-lg font-bold text-white">
                        {selected.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-sb-on-surface">{selected.full_name}</p>
                      <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">
                        {selected.grade_level || "Sin grado"} · {selected.section || "—"}
                        {selected.code && <> · Cód: {selected.code}</>}
                      </p>
                    </div>
                  </div>
                  {(() => {
                    const st = statusConfig[selected.status] || statusConfig.inactive
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${st.color} ${st.bg}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    )
                  })()}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  <PageCard>
                    <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-3">Datos personales</p>
                    <div className="space-y-3">
                      {[
                        { icon: BadgeCheck, label: "DNI", value: selected.dni },
                        { icon: GraduationCap, label: "Grado", value: selected.grade_level },
                        { icon: User, label: "Sección", value: selected.section },
                        { icon: BookOpen, label: "Género", value: selected.gender },
                        { icon: Calendar, label: "Nacimiento", value: selected.birth_date ? new Date(selected.birth_date).toLocaleDateString("es-PE") : "—" },
                      ].map((item, i) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.03 }}
                          className="flex items-center gap-3"
                        >
                          <div className="h-7 w-7 rounded-lg bg-sb-surface flex items-center justify-center shrink-0">
                            <item.icon className="h-3.5 w-3.5 text-sb-on-surface-variant/40" />
                          </div>
                          <div>
                            <p className="text-[10px] text-sb-on-surface-variant/40">{item.label}</p>
                            <p className="text-sm text-sb-on-surface">{item.value || "—"}</p>
                          </div>
                        </motion.div>
                      ))}

                      <div className="flex items-center gap-3 pt-2 border-t border-sb-outline-variant/10">
                        <div className="h-7 w-7 rounded-lg bg-sb-surface flex items-center justify-center shrink-0">
                          <BookOpen className="h-3.5 w-3.5 text-sb-on-surface-variant/40" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-sb-on-surface-variant/40">Condición Académica</p>
                          <select
                            value={selected.academic_condition || "studying"}
                            onChange={(e) => updateCondition(selected.id, e.target.value)}
                            className="sbf-native-select w-full mt-1"
                          >
                            <option value="studying">En curso</option>
                            <option value="promoted">Aprobado / Promovido</option>
                            <option value="repeating">Repite de Grado</option>
                            <option value="recovery">Requiere Recuperación</option>
                          </select>
                          <div className="mt-2 flex items-start gap-1.5 bg-sb-surface-container rounded-lg px-2.5 py-2">
                            <Info className="h-3.5 w-3.5 text-sb-on-surface-variant/40 mt-0.5 shrink-0" />
                            <p className="text-[11px] leading-snug text-sb-on-surface-variant/50">
                              Se usa para aprobar al alumno o hacerlo pasar de grado al final del año. Se determina según el promedio de las notas que registran los docentes.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </PageCard>

                  <div className="space-y-3">
                    <PageCard>
                      <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-3">Apoderado</p>
                      {selected.parent_name ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="h-7 w-7 rounded-lg bg-sb-surface flex items-center justify-center shrink-0">
                              <User className="h-3.5 w-3.5 text-sb-on-surface-variant/40" />
                            </div>
                            <div>
                              <p className="text-[10px] text-sb-on-surface-variant/40">Nombre</p>
                              <p className="text-sm text-sb-on-surface">{selected.parent_name}</p>
                            </div>
                          </div>
                          {selected.parent_phone && (
                            <div className="flex items-center gap-3">
                              <div className="h-7 w-7 rounded-lg bg-sb-surface flex items-center justify-center shrink-0">
                                <Phone className="h-3.5 w-3.5 text-sb-on-surface-variant/40" />
                              </div>
                              <div>
                                <p className="text-[10px] text-sb-on-surface-variant/40">Teléfono</p>
                                <p className="text-sm text-sb-on-surface">{selected.parent_phone}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-sb-on-surface-variant/40">Sin apoderado registrado</p>
                      )}
                    </PageCard>

                    <PageCard>
                      <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-3">Estadísticas</p>
                      <div className="flex gap-6">
                        <div>
                          <p className="text-2xl font-bold text-sb-on-surface">{selected.active_enrollments}</p>
                          <p className="text-[10px] text-sb-on-surface-variant/40">Matrículas</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-sb-on-surface">{selected.total_documents}</p>
                          <p className="text-[10px] text-sb-on-surface-variant/40">Documentos</p>
                        </div>
                      </div>
                    </PageCard>
                  </div>
                </div>

                <div className="flex gap-2">
                  <SbBtn
                    variant="filled"
                    rounded
                    onClick={() => { setDetailOpen(false); router.push(`/secretario/matriculas?student=${selected.id}`) }}
                    className="flex-1 flex items-center justify-center gap-2 h-10"
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    Ver matrícula
                  </SbBtn>
                  <SbBtn
                    rounded
                    onClick={() => { setDetailOpen(false); router.push(`/secretario/documentos?student=${selected.id}`) }}
                    className="flex-1 flex items-center justify-center gap-2 h-10"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Documentos
                  </SbBtn>
                </div>
              </motion.div>
            </SbModalBody>
          </>
        )}
      </SbModal>
    </div>
  )
}
