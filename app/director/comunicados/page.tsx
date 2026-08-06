"use client"

import * as React from "react"
import { Megaphone, Plus, Trash2, Search, Filter, Eye, EyeOff, Send, AlertTriangle, AlertCircle, Info, Clock, CalendarDays, Edit3, FileText, MessageSquare, Users, UserCheck, GraduationCap, Building2, Pin, PinOff, X } from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { SbSectionHeader, SbModal, SbModalHeader, SbModalBody, SbModalFooter, SbBtn, SbInput, SbBadge } from "@/components/ui/sb"

interface Comunicado {
  id: string; title: string; message: string; target_role: string; status: string; priority: string; category: string; created_at: string; pinned: boolean
}

const targetOptions = [
  { value: "all", label: "Todos", icon: Users, desc: "Directivos, docentes, secretaría y apoderados" },
  { value: "docente", label: "Docentes", icon: GraduationCap, desc: "Personal docente de la institución" },
  { value: "padre", label: "Apoderados", icon: UserCheck, desc: "Padres y apoderados" },
  { value: "secretario", label: "Secretaría", icon: Building2, desc: "Personal administrativo" },
]

const priorityConfig = {
  baja: { label: "Baja", icon: Info, color: "#6b7280", badge: "bg-zinc-500/10 text-zinc-400" },
  media: { label: "Media", icon: AlertCircle, color: "#3b82f6", badge: "bg-blue-500/10 text-blue-400" },
  alta: { label: "Alta", icon: AlertTriangle, color: "#f59e0b", badge: "bg-amber-500/10 text-amber-400" },
  urgente: { label: "Urgente", icon: AlertTriangle, color: "#ef4444", badge: "bg-red-500/10 text-red-400" },
} as const

const categoryOptions = [
  { value: "general", label: "General", icon: Megaphone },
  { value: "academico", label: "Académico", icon: GraduationCap },
  { value: "evento", label: "Evento", icon: CalendarDays },
  { value: "urgente", label: "Urgente", icon: AlertTriangle },
  { value: "recordatorio", label: "Recordatorio", icon: Clock },
]

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const d = new Date(dateStr).getTime()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Ahora"
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Hace ${days}d`
  return new Date(dateStr).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })
}

const MAX_CHARS = 600

export default function ComunicadosPage() {
  const [comunicados, setComunicados] = React.useState<Comunicado[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [searchFocused, setSearchFocused] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [filterTarget, setFilterTarget] = React.useState("all")
  const [filterPriority, setFilterPriority] = React.useState("all")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Comunicado | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState<Comunicado | null>(null)
  const [preview, setPreview] = React.useState(false)
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = React.useState(false)

  const [formData, setFormData] = React.useState({
    title: "", message: "", target_role: "all", priority: "media", category: "general",
  })
  const [saving, setSaving] = React.useState(false)
  const charsLeft = MAX_CHARS - formData.message.length

  React.useEffect(() => {
    fetchData()
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); inputRef.current?.focus(); inputRef.current?.select() }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch("/api/director/comunicados")
      if (res.ok) setComunicados(await res.json())
    } catch {}
    finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditing(null)
    setFormData({ title: "", message: "", target_role: "all", priority: "media", category: "general" })
    setPreview(false)
    setDialogOpen(true)
  }

  const openEdit = (c: Comunicado) => {
    setEditing(c)
    setFormData({ title: c.title, message: c.message, target_role: c.target_role, priority: c.priority || "media", category: c.category || "general" })
    setPreview(false)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.message) return
    setSaving(true)
    try {
      const url = editing ? `/api/director/comunicados/${editing.id}` : "/api/director/comunicados"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setDialogOpen(false)
        setEditing(null)
        fetchData()
      }
    } catch {}
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/director/comunicados/${id}`, { method: "DELETE" })
      setDeleteConfirm(null)
      fetchData()
    } catch {}
  }

  const handleTogglePin = async (c: Comunicado) => {
    try {
      await fetch(`/api/director/comunicados/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !c.pinned }),
      })
      fetchData()
    } catch {}
  }

  const targetLabels: Record<string, string> = {
    all: "Todos", docente: "Docentes", padre: "Apoderados", secretario: "Secretaría",
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const filtered = comunicados.filter(c => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.message.toLowerCase().includes(search.toLowerCase())) return false
    if (filterTarget !== "all" && c.target_role !== filterTarget) return false
    if (filterPriority !== "all" && (c.priority || "media") !== filterPriority) return false
    return true
  })

  const pinned = filtered.filter(c => c.pinned)
  const unpinned = filtered.filter(c => !c.pinned)
  const sorted = [...pinned, ...unpinned]

  const priorityKey = (formData.priority || "media") as keyof typeof priorityConfig
  const PriorityIcon = priorityConfig[priorityKey]?.icon || AlertCircle

  return (
    <div className="space-y-5">
      <SbSectionHeader
        title="Comunicados"
        description="Publica y gestiona avisos para la comunidad educativa"
        action={
          <SbBtn variant="filled" rounded className="flex items-center gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nuevo comunicado
          </SbBtn>
        }
      />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/30" />
        <input
          ref={inputRef}
          placeholder="Buscar por título o mensaje..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className={cn(
            "w-full h-11 pl-11 pr-20 bg-sb-surface rounded-xl border text-sm text-sb-on-surface placeholder:text-sb-on-surface-variant/30 outline-none transition-all",
            searchFocused ? "border-sb-primary/30 ring-1 ring-sb-primary/10" : "border-sb-outline-variant/10"
          )}
        />
        {search && (
          <button onClick={() => setSearch("")}
            className="absolute right-12 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-sb-surface-container-high transition-colors">
            <X className="h-3.5 w-3.5 text-sb-on-surface-variant/30" />
          </button>
        )}
        {search && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-sb-on-surface-variant/30 font-medium">
            {filtered.length} de {comunicados.length}
          </div>
        )}
        {!search && !searchFocused && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-sb-on-surface-variant/20">
            <kbd className="px-1.5 py-0.5 rounded bg-sb-surface-container-high text-sb-on-surface-variant/30 font-mono">⌘K</kbd>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all",
            showFilters ? "bg-sb-on-surface text-sb-surface" : "bg-sb-surface-container-high text-sb-on-surface-variant/60 hover:text-sb-on-surface/80"
          )}>
          <Filter className="h-3.5 w-3.5" /> Filtros
        </button>
        {filterTarget !== "all" && (
          <button onClick={() => setFilterTarget("all")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-sb-on-surface text-sb-surface">
            {targetLabels[filterTarget]} <X className="h-3 w-3" />
          </button>
        )}
        {filterPriority !== "all" && (
          <button onClick={() => setFilterPriority("all")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-sb-on-surface text-sb-surface">
            {priorityConfig[filterPriority as keyof typeof priorityConfig]?.label} <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[140px]">
                <p className="text-[10px] text-sb-on-surface-variant/40 mb-1.5 uppercase tracking-wider">Dirigido a</p>
                <div className="flex gap-1.5 flex-wrap">
                  {targetOptions.map(t => (
                    <button key={t.value} onClick={() => setFilterTarget(filterTarget === t.value ? "all" : t.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                        filterTarget === t.value
                          ? "bg-sb-on-surface text-sb-surface"
                          : "bg-sb-surface-container-high text-sb-on-surface-variant/60 hover:text-sb-on-surface/80"
                      )}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 min-w-[140px]">
                <p className="text-[10px] text-sb-on-surface-variant/40 mb-1.5 uppercase tracking-wider">Prioridad</p>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(priorityConfig).map(([key, cfg]) => (
                    <button key={key} onClick={() => setFilterPriority(filterPriority === key ? "all" : key)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                        filterPriority === key
                          ? "bg-sb-on-surface text-sb-surface"
                          : "bg-sb-surface-container-high text-sb-on-surface-variant/60 hover:text-sb-on-surface/80"
                      )}>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && sorted.length === 0 && (search || filterTarget !== "all" || filterPriority !== "all") && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-sb-surface-container-high flex items-center justify-center mx-auto mb-4">
            <Search className="h-7 w-7 text-sb-on-surface-variant/20" />
          </div>
          <p className="text-sm font-medium text-sb-on-surface-variant/50">Sin resultados</p>
          <p className="text-xs text-sb-on-surface-variant/30 mt-1">Intenta con otros filtros o términos de búsqueda</p>
        </motion.div>
      )}

      {!loading && sorted.length === 0 && !search && filterTarget === "all" && filterPriority === "all" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="py-12">
          <div className="max-w-md mx-auto text-center mb-8">
            <div className="w-20 h-20 rounded-3xl bg-sb-on-surface flex items-center justify-center mx-auto mb-5">
              <Megaphone className="h-9 w-9 text-sb-surface" />
            </div>
            <h2 className="text-lg font-semibold text-sb-on-surface mb-2">Crea tu primer comunicado</h2>
            <p className="text-sm text-sb-on-surface-variant/50 leading-relaxed">
              Publica avisos, recordatorios y alertas importantes para docentes, apoderados y todo el equipo administrativo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {[
              { icon: Users, title: "Dirige a quién necesites", desc: "Envía a todos, docentes, apoderados o secretaría por separado" },
              { icon: AlertTriangle, title: "Define la prioridad", desc: "Desde avisos informativos hasta alertas urgentes que no se pueden ignorar" },
              { icon: Pin, title: "Fija los más importantes", desc: "Los comunicados fijados siempre aparecen primero para mayor visibilidad" },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-sb-surface rounded-xl p-5 border border-sb-outline-variant/8 text-left">
                <div className="h-9 w-9 rounded-lg bg-sb-surface-container-high flex items-center justify-center mb-3">
                  <f.icon className="h-4 w-4 text-sb-on-surface-variant/50" />
                </div>
                <p className="text-sm font-medium text-sb-on-surface mb-1">{f.title}</p>
                <p className="text-xs text-sb-on-surface-variant/40 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center">
            <SbBtn variant="filled" rounded className="flex items-center gap-2 h-11 px-6" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Nuevo comunicado
            </SbBtn>
          </div>
        </motion.div>
      )}

      <div className="space-y-2">
        {sorted.map((c, idx) => {
          const prio = (c.priority || "media") as keyof typeof priorityConfig
          const PrioIcon = priorityConfig[prio]?.icon || AlertCircle
          const isExpanded = expanded.has(c.id)
          const isLong = c.message.length > 180

          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              className={cn(
                "bg-sb-surface rounded-xl transition-all",
                c.pinned ? "ring-1 ring-sb-outline/10" : ""
              )}
            >
              <div className="px-4 py-3.5">
                <div className="flex items-start gap-3">
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${priorityConfig[prio]?.color}15` }}
                  >
                    <PrioIcon className="h-4 w-4" style={{ color: priorityConfig[prio]?.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-sb-on-surface truncate">{c.title}</h3>
                      {c.pinned && (
                        <span className="shrink-0">
                          <Pin className="h-3 w-3 text-amber-400/60" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <SbBadge color="bg-sb-surface-container-high text-sb-on-surface-variant/50 text-[10px]">
                        {targetLabels[c.target_role] || "Todos"}
                      </SbBadge>
                      <SbBadge color={priorityConfig[prio]?.badge || ""} className="text-[10px]">
                        {priorityConfig[prio]?.label || "Media"}
                      </SbBadge>
                      {c.category && (
                        <SbBadge color="bg-sb-surface-container-high text-sb-on-surface-variant/50 text-[10px]">
                          {categoryOptions.find(o => o.value === c.category)?.label || c.category}
                        </SbBadge>
                      )}
                    </div>

                    <div className="relative">
                      <p className="text-sm text-sb-on-surface-variant/60 leading-relaxed whitespace-pre-wrap">
                        {isExpanded || !isLong ? c.message : `${c.message.slice(0, 180)}...`}
                      </p>
                      {isLong && (
                        <button
                          onClick={() => toggleExpand(c.id)}
                          className="text-[11px] font-medium mt-1 opacity-60 hover:opacity-100 transition-opacity"
                          style={{ color: priorityConfig[prio]?.color || "var(--sb-on-surface-variant)" }}
                        >
                          {isExpanded ? "Mostrar menos" : "Leer más"}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2.5">
                      <span className="text-[10px] text-sb-on-surface-variant/30 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {relativeTime(c.created_at)}
                      </span>
                      <span className="text-[10px] text-sb-on-surface-variant/20">
                        {new Date(c.created_at).toLocaleDateString("es-PE", {
                          day: "2-digit", month: "long", year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleTogglePin(c)}
                      className="p-1.5 rounded-lg hover:bg-sb-surface-container-high/80 transition-colors"
                      style={{ color: c.pinned ? "#fbbf24" : "var(--sb-on-surface-variant)" }}
                      title={c.pinned ? "Desfijar" : "Fijar"}
                    >
                      {c.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5 opacity-30" />}
                    </button>
                    <button
                      onClick={() => openEdit(c)}
                      className="p-1.5 rounded-lg hover:bg-sb-surface-container-high/80 text-sb-on-surface-variant/30 hover:text-sb-on-surface/60 transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(c)}
                      className="p-1.5 rounded-lg hover:bg-sb-surface-container-high/80 text-sb-on-surface-variant/30 hover:text-red-400/60 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Create / Edit modal */}
      <SbModal open={dialogOpen} onClose={() => { setDialogOpen(false); setEditing(null) }} maxWidth="560px">
        <SbModalBody noPadding>
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-sb-on-surface">
                {editing ? "Editar comunicado" : "Nuevo comunicado"}
              </h3>
              <button
                onClick={() => setPreview(!preview)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  preview ? "bg-sb-on-surface text-sb-surface" : "bg-sb-surface-container-high text-sb-on-surface-variant/60 hover:text-sb-on-surface/80"
                )}
              >
                {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {preview ? "Editar" : "Vista previa"}
              </button>
            </div>
            <p className="text-xs text-sb-on-surface-variant/50">
              {editing ? "Modifica los campos del comunicado" : "Redacta un nuevo aviso para la comunidad educativa"}
            </p>
          </div>

          {preview ? (
            <div className="px-6 pb-4">
              <div className="bg-sb-surface-container-high/50 rounded-xl p-5 space-y-3 border border-sb-outline-variant/10">
                <div className="flex items-center gap-2">
                  <PriorityIcon className="h-4 w-4" style={{ color: priorityConfig[priorityKey]?.color }} />
                  <h4 className="text-base font-semibold text-sb-on-surface">
                    {formData.title || "Sin título"}
                  </h4>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <SbBadge color="bg-sb-surface text-sb-on-surface-variant/50">
                    {targetLabels[formData.target_role] || "Todos"}
                  </SbBadge>
                  <SbBadge color={priorityConfig[priorityKey]?.badge || ""}>
                    {priorityConfig[priorityKey]?.label || "Media"}
                  </SbBadge>
                  <SbBadge color="bg-sb-surface text-sb-on-surface-variant/50">
                    {categoryOptions.find(o => o.value === formData.category)?.label || "General"}
                  </SbBadge>
                </div>
                <div className="h-px bg-sb-outline-variant/10" />
                <p className="text-sm text-sb-on-surface-variant/70 leading-relaxed whitespace-pre-wrap">
                  {formData.message || "Sin contenido"}
                </p>
              </div>
            </div>
          ) : (
            <div className="px-6 space-y-4 pb-2">
              <div>
                <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Título del comunicado *
                </label>
                <SbInput
                  placeholder="Ej: Reunión de padres de familia"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Mensaje *
                </label>
                <div className="relative">
                  <textarea
                    placeholder="Escribe el comunicado aquí..."
                    value={formData.message}
                    onChange={e => {
                      if (e.target.value.length <= MAX_CHARS) setFormData({...formData, message: e.target.value})
                    }}
                    className="sb-input w-full min-h-[140px] resize-y"
                    style={{ paddingBottom: "28px" }}
                  />
                  <div className="absolute bottom-2 right-3 text-[10px] font-mono"
                    style={{ color: charsLeft < 50 ? (charsLeft < 20 ? "#ef4444" : "#f59e0b") : "var(--sb-on-surface-variant)" }}>
                    {charsLeft}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block flex items-center gap-1">
                    <Users className="h-3 w-3" /> Dirigido a *
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {targetOptions.map(t => {
                      const Icon = t.icon
                      const isSelected = formData.target_role === t.value
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setFormData({...formData, target_role: t.value})}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                            isSelected
                              ? "bg-sb-on-surface text-sb-surface"
                              : "bg-sb-surface-container-high text-sb-on-surface-variant/70 hover:text-sb-on-surface/90"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <div>
                            <p className="text-xs font-medium">{t.label}</p>
                            <p className="text-[10px] opacity-50">{t.desc}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Prioridad
                    </label>
                    <div className="flex flex-col gap-1.5">
                      {Object.entries(priorityConfig).map(([key, cfg]) => {
                        const Icon = cfg.icon
                        const isSelected = formData.priority === key
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setFormData({...formData, priority: key})}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                              isSelected
                                ? "bg-sb-on-surface text-sb-surface"
                                : "bg-sb-surface-container-high text-sb-on-surface-variant/70 hover:text-sb-on-surface/90"
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <div>
                              <p className="text-xs font-medium">{cfg.label}</p>
                              <p className="text-[10px] opacity-50">
                                {key === "baja" ? "Informativo" : key === "media" ? "Aviso normal" : key === "alta" ? "Requiere atención" : "Acción inmediata"}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" /> Categoría
                    </label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="sbf-native-select w-full"
                    >
                      {categoryOptions.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SbModalBody>

        <div className="px-6 py-4 flex items-center gap-2 border-t border-sb-outline-variant/10">
          <SbBtn rounded onClick={() => { setDialogOpen(false); setEditing(null) }}>
            Cancelar
          </SbBtn>
          <div className="flex-1" />
          {preview && (
            <SbBtn rounded onClick={() => setPreview(false)}>
              <Edit3 className="h-3.5 w-3.5" /> Seguir editando
            </SbBtn>
          )}
          <SbBtn
            variant="filled"
            rounded
            onClick={handleSave}
            disabled={saving || !formData.title || !formData.message}
            className="flex items-center gap-2"
          >
            {saving ? (
              <div className="h-4 w-4 rounded-full border-2 border-sb-on-primary border-t-transparent animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {saving ? "Publicando..." : editing ? "Guardar cambios" : "Publicar"}
          </SbBtn>
        </div>
      </SbModal>

      {/* Delete confirm */}
      <SbModal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="360px">
        <SbModalHeader title="Eliminar comunicado" onClose={() => setDeleteConfirm(null)} />
        <SbModalBody>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-sb-on-surface-variant/70">
                ¿Eliminar <strong className="text-sb-on-surface">{deleteConfirm?.title}</strong>?
              </p>
              <p className="text-xs text-sb-on-surface-variant/40 mt-1">
                Esta acción es irreversible. El comunicado se borrará para todos los destinatarios.
              </p>
            </div>
          </div>
        </SbModalBody>
        <SbModalFooter>
          <SbBtn rounded className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancelar</SbBtn>
          <SbBtn variant="danger" rounded className="flex-1" onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)}>Eliminar</SbBtn>
        </SbModalFooter>
      </SbModal>
    </div>
  )
}
