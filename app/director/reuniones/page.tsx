"use client"

import * as React from "react"
import { Handshake, Plus, Trash2, Search, Filter, Calendar, Clock, MapPin, Video, Users, Edit3, AlertTriangle, CheckCircle2, XCircle, ListChecks, Globe, Copy, Check, X, Pin, PinOff } from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { SbSectionHeader, SbModal, SbModalHeader, SbModalBody, SbModalFooter, SbBtn, SbInput, SbBadge } from "@/components/ui/sb"

interface Reunion {
  id: string
  title: string
  message: string
  agenda: string
  meeting_date: string
  meeting_time: string
  location: string
  virtual_link: string
  target_role: string
  status: string
  priority: string
  created_at: string
  pinned: boolean
  created_by: string
}

const targetOptions = [
  { value: "all", label: "Todos", icon: Users, desc: "Directivos, docentes, secretaría y apoderados" },
  { value: "docente", label: "Docentes", icon: Users, desc: "Personal docente de la institución" },
  { value: "padre", label: "Apoderados", icon: Users, desc: "Padres y apoderados" },
  { value: "secretario", label: "Secretaría", icon: Users, desc: "Personal administrativo" },
]

const targetLabels: Record<string, string> = {
  all: "Todos", docente: "Docentes", padre: "Apoderados", secretario: "Secretaría",
}

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

function formatTime(time: string): string {
  if (!time) return ""
  return time.slice(0, 5)
}

function isTodayOrFuture(dateStr: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const meeting = new Date(dateStr)
  meeting.setHours(0, 0, 0, 0)
  return meeting >= today
}

const MAX_CHARS = 800

export default function ReunionesPage() {
  const [reuniones, setReuniones] = React.useState<Reunion[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [searchFocused, setSearchFocused] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [filterTarget, setFilterTarget] = React.useState("all")
  const [filterStatus, setFilterStatus] = React.useState<string>("all")
  const [showFilters, setShowFilters] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Reunion | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState<Reunion | null>(null)
  const [copiedLink, setCopiedLink] = React.useState<string | null>(null)
  const [showDetails, setShowDetails] = React.useState<Reunion | null>(null)

  const [formData, setFormData] = React.useState({
    title: "", message: "", agenda: "", meeting_date: "", meeting_time: "",
    location: "", virtual_link: "", target_role: "all", priority: "media",
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
      const res = await fetch("/api/director/reuniones")
      if (res.ok) {
        const data = await res.json()
        const enriched = (data as any[]).map(r => ({
          ...r,
          priority: r.priority || "media",
          pinned: Boolean(r.pinned),
          location: r.location || "",
          virtual_link: r.virtual_link || "",
          agenda: r.agenda || "",
        }))
        setReuniones(enriched)
      }
    } catch {}
    finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditing(null)
    const today = new Date().toISOString().split("T")[0]
    setFormData({ title: "", message: "", agenda: "", meeting_date: today, meeting_time: "", location: "", virtual_link: "", target_role: "all", priority: "media" })
    setDialogOpen(true)
  }

  const openEdit = (r: Reunion) => {
    setEditing(r)
    setFormData({
      title: r.title, message: r.message || "", agenda: r.agenda || "",
      meeting_date: r.meeting_date, meeting_time: r.meeting_time || "",
      location: r.location || "", virtual_link: r.virtual_link || "",
      target_role: r.target_role, priority: r.priority || "media",
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.meeting_date) return
    setSaving(true)
    try {
      const url = editing ? `/api/director/reuniones/${editing.id}` : "/api/director/reuniones"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData),
      })
      if (res.ok) { setDialogOpen(false); setEditing(null); fetchData() }
    } catch {}
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try { await fetch(`/api/director/reuniones/${id}`, { method: "DELETE" }); setDeleteConfirm(null); fetchData() } catch {}
  }

  const handleTogglePin = async (r: Reunion) => {
    try {
      await fetch(`/api/director/reuniones/${r.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pinned: !r.pinned }),
      })
      fetchData()
    } catch {}
  }

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link)
    setCopiedLink(link)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const filtered = reuniones.filter(r => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.message?.toLowerCase().includes(search.toLowerCase())) return false
    if (filterTarget !== "all" && r.target_role !== filterTarget) return false
    if (filterStatus === "upcoming" && !isTodayOrFuture(r.meeting_date)) return false
    if (filterStatus === "past" && isTodayOrFuture(r.meeting_date)) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    const dateA = new Date(`${a.meeting_date}T${a.meeting_time || "00:00"}`).getTime()
    const dateB = new Date(`${b.meeting_date}T${b.meeting_time || "00:00"}`).getTime()
    return dateA - dateB
  })

  const upcoming = sorted.filter(r => isTodayOrFuture(r.meeting_date))
  const past = sorted.filter(r => !isTodayOrFuture(r.meeting_date))

  return (
    <div className="space-y-5">
      <SbSectionHeader
        title="Reuniones"
        description="Agenda y gestiona reuniones con la comunidad educativa"
        action={
          <SbBtn variant="filled" rounded className="flex items-center gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nueva reunión
          </SbBtn>
        }
      />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/30" />
        <input
          ref={inputRef}
          placeholder="Buscar reuniones..."
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
            {filtered.length} de {reuniones.length}
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
        {filterStatus !== "all" && (
          <button onClick={() => setFilterStatus("all")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-sb-on-surface text-sb-surface">
            {filterStatus === "upcoming" ? "Próximas" : "Pasadas"} <X className="h-3 w-3" />
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
                      )}>{t.label}</button>
                  ))}
                </div>
              </div>
              <div className="flex-1 min-w-[140px]">
                <p className="text-[10px] text-sb-on-surface-variant/40 mb-1.5 uppercase tracking-wider">Estado</p>
                <div className="flex gap-1.5 flex-wrap">
                  {[{ value: "all", label: "Todas" }, { value: "upcoming", label: "Próximas" }, { value: "past", label: "Pasadas" }].map(s => (
                    <button key={s.value} onClick={() => setFilterStatus(filterStatus === s.value ? "all" : s.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                        filterStatus === s.value
                          ? "bg-sb-on-surface text-sb-surface"
                          : "bg-sb-surface-container-high text-sb-on-surface-variant/60 hover:text-sb-on-surface/80"
                      )}>{s.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && sorted.length === 0 && (search || filterTarget !== "all" || filterStatus !== "all") && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-sb-surface-container-high flex items-center justify-center mx-auto mb-4">
            <Search className="h-7 w-7 text-sb-on-surface-variant/20" />
          </div>
          <p className="text-sm font-medium text-sb-on-surface-variant/50">Sin resultados</p>
          <p className="text-xs text-sb-on-surface-variant/30 mt-1">Intenta con otros filtros o términos de búsqueda</p>
        </motion.div>
      )}

      {!loading && sorted.length === 0 && !search && filterTarget === "all" && filterStatus === "all" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="py-12">
          <div className="max-w-md mx-auto text-center mb-8">
            <div className="w-20 h-20 rounded-3xl bg-sb-on-surface flex items-center justify-center mx-auto mb-5">
              <Handshake className="h-9 w-9 text-sb-surface" />
            </div>
            <h2 className="text-lg font-semibold text-sb-on-surface mb-2">Agenda tu primera reunión</h2>
            <p className="text-sm text-sb-on-surface-variant/50 leading-relaxed">
              Organiza reuniones con docentes, apoderados y equipo administrativo. Define fecha, hora, ubicación y agenda de temas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {[
              { icon: Calendar, title: "Fecha y hora", desc: "Programa la reunión en la fecha y hora que mejor se adapte a los asistentes" },
              { icon: MapPin, title: "Ubicación presencial o virtual", desc: "Define un salón o comparte un enlace de Google Meet, Zoom o similar" },
              { icon: ListChecks, title: "Agenda de temas", desc: "Enumera los puntos a tratar para que todos lleguen preparados" },
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
              <Plus className="h-4 w-4" /> Nueva reunión
            </SbBtn>
          </div>
        </motion.div>
      )}

      {upcoming.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400/70" />
            <h3 className="text-sm font-semibold text-sb-on-surface/80">Próximas reuniones</h3>
            <span className="text-[10px] text-sb-on-surface-variant/30 ml-auto">{upcoming.length} reunión(es)</span>
          </div>
          <div className="space-y-2">
            {upcoming.map(r => <ReunionCard key={r.id} reunion={r} onEdit={openEdit} onDelete={setDeleteConfirm} onPin={handleTogglePin} onCopyLink={handleCopyLink} copiedLink={copiedLink} onViewDetails={setShowDetails} />)}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-sb-on-surface-variant/30" />
            <h3 className="text-sm font-semibold text-sb-on-surface-variant/50">Reuniones pasadas</h3>
            <span className="text-[10px] text-sb-on-surface-variant/20 ml-auto">{past.length} reunión(es)</span>
          </div>
          <div className="space-y-2 opacity-60">
            {past.map(r => <ReunionCard key={r.id} reunion={r} onEdit={openEdit} onDelete={setDeleteConfirm} onPin={handleTogglePin} onCopyLink={handleCopyLink} copiedLink={copiedLink} onViewDetails={setShowDetails} past />)}
          </div>
        </section>
      )}

      {/* Create / Edit modal */}
      <SbModal open={dialogOpen} onClose={() => { setDialogOpen(false); setEditing(null) }} maxWidth="600px">
        <SbModalBody noPadding>
          <div className="px-6 pt-6 pb-4">
            <h3 className="text-lg font-semibold text-sb-on-surface">
              {editing ? "Editar reunión" : "Agendar nueva reunión"}
            </h3>
            <p className="text-xs text-sb-on-surface-variant/50 mt-1">
              {editing ? "Modifica los detalles de la reunión" : "Completa los datos para programar una reunión"}
            </p>
          </div>

          <div className="px-6 space-y-4 pb-2">
            <div>
              <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Título de la reunión *</label>
              <SbInput placeholder="Ej: Reunión de coordinación docente" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Fecha *
                </label>
                <SbInput type="date" value={formData.meeting_date} onChange={e => setFormData({...formData, meeting_date: e.target.value})} />
              </div>
              <div>
                <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Hora
                </label>
                <SbInput type="time" value={formData.meeting_time} onChange={e => setFormData({...formData, meeting_time: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Ubicación / Salón
                </label>
                <SbInput placeholder="Ej: Sala de reuniones 2do piso" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
              <div>
                <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block flex items-center gap-1">
                  <Video className="h-3 w-3" /> Enlace virtual (opcional)
                </label>
                <SbInput placeholder="https://meet.google.com/..." value={formData.virtual_link} onChange={e => setFormData({...formData, virtual_link: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block flex items-center gap-1">
                <ListChecks className="h-3 w-3" /> Agenda / Temas a tratar
              </label>
              <textarea
                placeholder="Escribe los puntos de la agenda, uno por línea..."
                value={formData.agenda}
                onChange={e => setFormData({...formData, agenda: e.target.value})}
                className="sb-input w-full min-h-[100px] resize-y"
              />
            </div>

            <div>
              <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block flex items-center gap-1">
                <Users className="h-3 w-3" /> Mensaje / Detalles adicionales
                <span className="text-[10px] font-mono ml-auto" style={{ color: charsLeft < 50 ? "#f59e0b" : "var(--sb-on-surface-variant)" }}>{charsLeft}</span>
              </label>
              <textarea
                placeholder="Información complementaria para los asistentes..."
                value={formData.message}
                onChange={e => { if (e.target.value.length <= MAX_CHARS) setFormData({...formData, message: e.target.value}) }}
                className="sb-input w-full min-h-[80px] resize-y"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Dirigido a *</label>
                <select value={formData.target_role} onChange={e => setFormData({...formData, target_role: e.target.value})} className="sbf-native-select w-full">
                  <option value="all">Todos</option>
                  <option value="docente">Docentes</option>
                  <option value="padre">Apoderados</option>
                  <option value="secretario">Secretaría</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Prioridad</label>
                <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="sbf-native-select w-full">
                  <option value="baja">Baja — Informativa</option>
                  <option value="media">Media — Ordinaria</option>
                  <option value="alta">Alta — Importante</option>
                  <option value="urgente">Urgente — Imprescindible</option>
                </select>
              </div>
            </div>
          </div>
        </SbModalBody>

        <div className="px-6 py-4 flex items-center gap-2 border-t border-sb-outline-variant/10">
          <SbBtn rounded onClick={() => { setDialogOpen(false); setEditing(null) }}>Cancelar</SbBtn>
          <div className="flex-1" />
          <SbBtn variant="filled" rounded onClick={handleSave} disabled={saving || !formData.title || !formData.meeting_date} className="flex items-center gap-2">
            {saving ? (
              <div className="h-4 w-4 rounded-full border-2 border-sb-on-primary border-t-transparent animate-spin" />
            ) : (
              <Calendar className="h-3.5 w-3.5" />
            )}
            {saving ? "Guardando..." : editing ? "Guardar cambios" : "Agendar reunión"}
          </SbBtn>
        </div>
      </SbModal>

      {/* Delete confirm */}
      <SbModal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="360px">
        <SbModalHeader title="Eliminar reunión" onClose={() => setDeleteConfirm(null)} />
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
                Esta acción es irreversible. La reunión se eliminará para todos los invitados.
              </p>
            </div>
          </div>
        </SbModalBody>
        <SbModalFooter>
          <SbBtn rounded className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancelar</SbBtn>
          <SbBtn variant="danger" rounded className="flex-1" onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)}>Eliminar</SbBtn>
        </SbModalFooter>
      </SbModal>

      {/* Detail modal */}
      <SbModal open={!!showDetails} onClose={() => setShowDetails(null)} maxWidth="480px">
        {showDetails && (
          <>
            <SbModalHeader title={showDetails.title} onClose={() => setShowDetails(null)} />
            <SbModalBody>
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <SbBadge color={isTodayOrFuture(showDetails.meeting_date) ? "bg-emerald-400/10 text-emerald-400/80" : "bg-sb-surface-container-high text-sb-on-surface-variant/50"}>
                    {isTodayOrFuture(showDetails.meeting_date) ? "Próxima" : "Finalizada"}
                  </SbBadge>
                  <SbBadge color="bg-sb-surface-container-high text-sb-on-surface-variant/50">
                    {targetLabels[showDetails.target_role] || "Todos"}
                  </SbBadge>
                </div>

                <div className="bg-sb-surface-container-high/50 rounded-xl p-4 space-y-3 border border-sb-outline-variant/10">
                  <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">Fecha y hora</p>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-sb-on-surface-variant/40" />
                    <span className="text-sm text-sb-on-surface">
                      {new Date(showDetails.meeting_date).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      {showDetails.meeting_time && <> — {formatTime(showDetails.meeting_time)}</>}
                    </span>
                  </div>
                </div>

                {showDetails.location && (
                  <div className="bg-sb-surface-container-high/50 rounded-xl p-4 space-y-2 border border-sb-outline-variant/10">
                    <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">Ubicación</p>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-sb-on-surface-variant/40" />
                      <span className="text-sm text-sb-on-surface">{showDetails.location}</span>
                    </div>
                  </div>
                )}

                {showDetails.virtual_link && (
                  <div className="bg-sb-surface-container-high/50 rounded-xl p-4 space-y-2 border border-sb-outline-variant/10">
                    <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">Enlace virtual</p>
                    <div className="flex items-center gap-2">
                      <a href={showDetails.virtual_link} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-sb-primary truncate flex-1 hover:underline">{showDetails.virtual_link}</a>
                      <button onClick={() => handleCopyLink(showDetails.virtual_link!)}
                        className="p-1.5 rounded-lg hover:bg-sb-surface-container-high transition-colors">
                        {copiedLink === showDetails.virtual_link ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-sb-on-surface-variant/40" />}
                      </button>
                    </div>
                  </div>
                )}

                {showDetails.agenda && (
                  <div className="bg-sb-surface-container-high/50 rounded-xl p-4 space-y-2 border border-sb-outline-variant/10">
                    <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">Agenda</p>
                    <p className="text-sm text-sb-on-surface whitespace-pre-wrap leading-relaxed">{showDetails.agenda}</p>
                  </div>
                )}

                {showDetails.message && (
                  <div className="bg-sb-surface-container-high/50 rounded-xl p-4 space-y-2 border border-sb-outline-variant/10">
                    <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">Notas</p>
                    <p className="text-sm text-sb-on-surface whitespace-pre-wrap leading-relaxed">{showDetails.message}</p>
                  </div>
                )}
              </div>
            </SbModalBody>
            <SbModalFooter>
              <SbBtn variant="filled" rounded className="w-full" onClick={() => setShowDetails(null)}>Cerrar</SbBtn>
            </SbModalFooter>
          </>
        )}
      </SbModal>
    </div>
  )
}

function ReunionCard({
  reunion: r, onEdit, onDelete, onPin, onCopyLink, copiedLink, onViewDetails, past,
}: {
  reunion: Reunion
  onEdit: (r: Reunion) => void
  onDelete: (r: Reunion) => void
  onPin: (r: Reunion) => void
  onCopyLink: (link: string) => void
  copiedLink: string | null
  onViewDetails: (r: Reunion) => void
  past?: boolean
}) {
  return (
    <motion.div layout
      className={cn(
        "bg-sb-surface rounded-xl p-4 space-y-2.5 transition-all hover:bg-sb-surface-container-high/50 cursor-pointer",
        r.pinned ? "ring-1 ring-sb-outline/10" : "",
        past ? "opacity-50" : ""
      )}
      onClick={() => onViewDetails(r)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", past ? "bg-sb-surface-container-high" : "bg-emerald-500/10")}>
            <Handshake className={cn("h-5 w-5", past ? "text-sb-on-surface-variant/30" : "text-emerald-500/70")} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-sb-on-surface truncate">{r.title}</h3>
              {r.pinned && <span className="text-[10px] text-amber-400/60">📌</span>}
            </div>
            {r.location && (
              <p className="text-xs text-sb-on-surface-variant/40 flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" /> {r.location}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={e => { e.stopPropagation(); onPin(r) }}
            className="p-1.5 rounded-lg hover:bg-sb-surface-container-high/80 transition-colors"
            style={{ color: r.pinned ? "#fbbf24" : "var(--sb-on-surface-variant)" }}
            title={r.pinned ? "Desfijar" : "Fijar"}>
            <Pin className="h-3.5 w-3.5" />
          </button>
          <button onClick={e => { e.stopPropagation(); onEdit(r) }}
            className="p-1.5 rounded-lg hover:bg-sb-surface-container-high/80 text-sb-on-surface-variant/30 hover:text-sb-on-surface/60 transition-colors" title="Editar">
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(r) }}
            className="p-1.5 rounded-lg hover:bg-sb-surface-container-high/80 text-sb-on-surface-variant/30 hover:text-red-400/60 transition-colors" title="Eliminar">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SbBadge color={past ? "bg-sb-surface-container-high text-sb-on-surface-variant/30" : "bg-emerald-400/10 text-emerald-400/80"}>
          {past ? "Finalizada" : "Próxima"}
        </SbBadge>
        <SbBadge color="bg-sb-surface-container-high text-sb-on-surface-variant/50">
          {targetLabels[r.target_role] || "Todos"}
        </SbBadge>
      </div>

      <div className="flex items-center gap-3 text-[10px] text-sb-on-surface-variant/40">
        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(r.meeting_date).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}</span>
        {r.meeting_time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(r.meeting_time)}</span>}
      </div>

      {r.virtual_link && (
        <button onClick={e => { e.stopPropagation(); onCopyLink(r.virtual_link!) }}
          className="flex items-center gap-1.5 text-[10px] text-sb-primary/60 hover:text-sb-primary transition-colors">
          {copiedLink === r.virtual_link ? <Check className="h-3 w-3" /> : <Video className="h-3 w-3" />}
          {copiedLink === r.virtual_link ? "Copiado" : "Copiar enlace virtual"}
        </button>
      )}
    </motion.div>
  )
}
