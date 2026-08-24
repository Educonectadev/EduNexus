"use client"

import * as React from "react"
import { Handshake, Calendar, Clock, MapPin, Video, Users, ListChecks, Copy, Check, X, Megaphone } from "@/components/ui/proicons"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { SbSectionHeader, SbModal, SbModalHeader, SbModalBody, SbModalFooter, SbBtn, SbBadge } from "@/components/ui/sb"

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
  type: string
}

interface Comunicado {
  id: string
  title: string
  message: string
  target_role: string
  status: string
  priority: string
  category: string
  created_at: string
  type: string
}

const targetLabels: Record<string, string> = {
  all: "Todos", docente: "Docentes", padre: "Apoderados", secretario: "Secretaría",
}

const priorityLabels: Record<string, { label: string; color: string }> = {
  baja: { label: "Baja", color: "bg-blue-400/10 text-blue-400/80" },
  media: { label: "Media", color: "bg-yellow-400/10 text-yellow-400/80" },
  alta: { label: "Alta", color: "bg-orange-400/10 text-orange-400/80" },
  urgente: { label: "Urgente", color: "bg-red-400/10 text-red-400/80" },
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "Ahora"
  if (m < 60) return `Hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `Hace ${d} días`
  return new Date(dateStr).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })
}

export default function DocenteReunionesPage() {
  const [reuniones, setReuniones] = React.useState<Reunion[]>([])
  const [comunicados, setComunicados] = React.useState<Comunicado[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showDetails, setShowDetails] = React.useState<Reunion | Comunicado | null>(null)
  const [detailType, setDetailType] = React.useState<"reunion" | "comunicado">("reunion")
  const [copiedLink, setCopiedLink] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<"reuniones" | "comunicados">("reuniones")

  React.useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [resR, resC] = await Promise.all([
        fetch("/api/docente/reuniones"),
        fetch("/api/docente/comunicados"),
      ])
      if (resR.ok) setReuniones(await resR.json())
      if (resC.ok) setComunicados(await resC.json())
    } catch {}
    finally { setLoading(false) }
  }

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link)
    setCopiedLink(link)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const openReunion = (r: Reunion) => { setShowDetails(r); setDetailType("reunion") }
  const openComunicado = (c: Comunicado) => { setShowDetails(c); setDetailType("comunicado") }

  const upcoming = reuniones.filter(r => isTodayOrFuture(r.meeting_date))
  const past = reuniones.filter(r => !isTodayOrFuture(r.meeting_date))

  return (
    <div className="space-y-5">
      <SbSectionHeader
        title="Reuniones y Comunicados"
        description="Reuniones y comunicados de la dirección"
      />

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("reuniones")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
            activeTab === "reuniones"
              ? "bg-sb-on-surface text-sb-surface"
              : "bg-sb-surface-container-high text-sb-on-surface-variant/60 hover:text-sb-on-surface/80"
          )}
        >
          <Handshake className="h-4 w-4" /> Reuniones
        </button>
        <button
          onClick={() => setActiveTab("comunicados")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
            activeTab === "comunicados"
              ? "bg-sb-on-surface text-sb-surface"
              : "bg-sb-surface-container-high text-sb-on-surface-variant/60 hover:text-sb-on-surface/80"
          )}
        >
          <Megaphone className="h-4 w-4" /> Comunicados
        </button>
      </div>

      {/* ═══ TAB REUNIONES ═══ */}
      {activeTab === "reuniones" && (
        <>
          {!loading && reuniones.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="py-12">
              <div className="max-w-md mx-auto text-center">
                <div className="w-20 h-20 rounded-3xl bg-sb-on-surface flex items-center justify-center mx-auto mb-5">
                  <Handshake className="h-9 w-9 text-sb-surface" />
                </div>
                <h2 className="text-lg font-semibold text-sb-on-surface mb-2">Sin reuniones programadas</h2>
                <p className="text-sm text-sb-on-surface-variant/50 leading-relaxed">
                  La dirección no ha programado reuniones recientes.
                </p>
              </div>
            </motion.div>
          )}

          {upcoming.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Check className="h-4 w-4 text-emerald-400/70" />
                <h3 className="text-sm font-semibold text-sb-on-surface/80">Próximas reuniones</h3>
                <span className="text-[10px] text-sb-on-surface-variant/30 ml-auto">{upcoming.length}</span>
              </div>
              <div className="space-y-2">
                {upcoming.map(r => (
                  <ReunionCard key={r.id} reunion={r} onViewDetails={openReunion} onCopyLink={handleCopyLink} copiedLink={copiedLink} />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-sb-on-surface-variant/30" />
                <h3 className="text-sm font-semibold text-sb-on-surface/50">Reuniones pasadas</h3>
                <span className="text-[10px] text-sb-on-surface-variant/30 ml-auto">{past.length}</span>
              </div>
              <div className="space-y-2">
                {past.map(r => (
                  <ReunionCard key={r.id} reunion={r} onViewDetails={openReunion} onCopyLink={handleCopyLink} copiedLink={copiedLink} past />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ═══ TAB COMUNICADOS ═══ */}
      {activeTab === "comunicados" && (
        <>
          {!loading && comunicados.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="py-12">
              <div className="max-w-md mx-auto text-center">
                <div className="w-20 h-20 rounded-3xl bg-sb-on-surface flex items-center justify-center mx-auto mb-5">
                  <Megaphone className="h-9 w-9 text-sb-surface" />
                </div>
                <h2 className="text-lg font-semibold text-sb-on-surface mb-2">Sin comunicados</h2>
                <p className="text-sm text-sb-on-surface-variant/50 leading-relaxed">
                  No hay comunicados de la dirección en este momento.
                </p>
              </div>
            </motion.div>
          )}

          {comunicados.length > 0 && (
            <div className="space-y-2">
              {comunicados.map(c => (
                <ComunicadoCard key={c.id} comunicado={c} onViewDetails={openComunicado} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══ MODAL DETALLE ═══ */}
      <SbModal open={!!showDetails} onClose={() => setShowDetails(null)} maxWidth="480px">
        {showDetails && detailType === "reunion" && (
          <>
            <SbModalHeader title={(showDetails as Reunion).title} onClose={() => setShowDetails(null)} />
            <SbModalBody>
              <ReunionDetail r={showDetails as Reunion} copiedLink={copiedLink} onCopyLink={handleCopyLink} />
            </SbModalBody>
            <SbModalFooter>
              <SbBtn variant="filled" rounded className="w-full" onClick={() => setShowDetails(null)}>Cerrar</SbBtn>
            </SbModalFooter>
          </>
        )}
        {showDetails && detailType === "comunicado" && (
          <>
            <SbModalHeader title={(showDetails as Comunicado).title} onClose={() => setShowDetails(null)} />
            <SbModalBody>
              <ComunicadoDetail c={showDetails as Comunicado} />
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

/* ═══ REUNION DETAIL ═══ */
function ReunionDetail({ r, copiedLink, onCopyLink }: { r: Reunion; copiedLink: string | null; onCopyLink: (l: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <SbBadge color={isTodayOrFuture(r.meeting_date) ? "bg-emerald-400/10 text-emerald-400/80" : "bg-sb-surface-container-high text-sb-on-surface-variant/50"}>
          {isTodayOrFuture(r.meeting_date) ? "Próxima" : "Finalizada"}
        </SbBadge>
        <SbBadge color="bg-sb-surface-container-high text-sb-on-surface-variant/50">
          {targetLabels[r.target_role] || "Todos"}
        </SbBadge>
        {r.priority && (
          <SbBadge color={priorityLabels[r.priority]?.color || ""}>
            {priorityLabels[r.priority]?.label || r.priority}
          </SbBadge>
        )}
      </div>
      <div className="bg-sb-surface-container-high/50 rounded-xl p-4 space-y-3 border border-sb-outline-variant/10">
        <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">Fecha y hora</p>
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-sb-on-surface-variant/40" />
          <span className="text-sm text-sb-on-surface">
            {new Date(r.meeting_date).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {r.meeting_time && <> — {formatTime(r.meeting_time)}</>}
          </span>
        </div>
      </div>
      {r.location && (
        <div className="bg-sb-surface-container-high/50 rounded-xl p-4 space-y-2 border border-sb-outline-variant/10">
          <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">Ubicación</p>
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-sb-on-surface-variant/40" />
            <span className="text-sm text-sb-on-surface">{r.location}</span>
          </div>
        </div>
      )}
      {r.virtual_link && (
        <div className="bg-sb-surface-container-high/50 rounded-xl p-4 space-y-2 border border-sb-outline-variant/10">
          <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">Enlace virtual</p>
          <div className="flex items-center gap-2">
            <a href={r.virtual_link} target="_blank" rel="noopener noreferrer" className="text-sm text-sb-primary truncate flex-1 hover:underline">{r.virtual_link}</a>
            <button onClick={() => onCopyLink(r.virtual_link!)} className="p-1.5 rounded-lg hover:bg-sb-surface-container-high transition-colors">
              {copiedLink === r.virtual_link ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-sb-on-surface-variant/40" />}
            </button>
          </div>
        </div>
      )}
      {r.agenda && (
        <div className="bg-sb-surface-container-high/50 rounded-xl p-4 space-y-2 border border-sb-outline-variant/10">
          <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">Agenda</p>
          <p className="text-sm text-sb-on-surface whitespace-pre-wrap leading-relaxed">{r.agenda}</p>
        </div>
      )}
      {r.message && (
        <div className="bg-sb-surface-container-high/50 rounded-xl p-4 space-y-2 border border-sb-outline-variant/10">
          <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">Detalles</p>
          <p className="text-sm text-sb-on-surface whitespace-pre-wrap leading-relaxed">{r.message}</p>
        </div>
      )}
    </div>
  )
}

/* ═══ COMUNICADO DETAIL ═══ */
function ComunicadoDetail({ c }: { c: Comunicado }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <SbBadge color="bg-sb-primary/10 text-sb-primary">{targetLabels[c.target_role] || "Todos"}</SbBadge>
        {c.priority && c.priority !== "media" && (
          <SbBadge color={priorityLabels[c.priority]?.color || ""}>
            {priorityLabels[c.priority]?.label || c.priority}
          </SbBadge>
        )}
        {c.category && (
          <SbBadge color="bg-sb-surface-container-high text-sb-on-surface-variant/50">{c.category}</SbBadge>
        )}
      </div>
      <div className="bg-sb-surface-container-high/50 rounded-xl p-4 space-y-2 border border-sb-outline-variant/10">
        <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">Mensaje</p>
        <p className="text-sm text-sb-on-surface whitespace-pre-wrap leading-relaxed">{c.message}</p>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-sb-on-surface-variant/40">
        <Clock className="h-3 w-3" />
        <span>{timeAgo(c.created_at)}</span>
      </div>
    </div>
  )
}

/* ═══ REUNION CARD ═══ */
function ReunionCard({ reunion: r, onViewDetails, onCopyLink, copiedLink, past }: {
  reunion: Reunion; onViewDetails: (r: Reunion) => void; onCopyLink: (l: string) => void; copiedLink: string | null; past?: boolean
}) {
  return (
    <motion.div layout
      className={cn("bg-white dark:bg-[#1a1a1c] sb-note rounded-[25px] p-4 space-y-2.5 transition-all cursor-pointer", past ? "opacity-50" : "")}
      onClick={() => onViewDetails(r)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", past ? "bg-sb-surface-container-high" : "bg-emerald-500/10")}>
            <Handshake className={cn("h-5 w-5", past ? "text-sb-on-surface-variant/30" : "text-emerald-500/70")} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-black dark:text-white truncate">{r.title}</h3>
            {r.location && (
              <p className="text-xs text-black/60 dark:text-white/60 flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" /> {r.location}
              </p>
            )}
          </div>
        </div>
        {r.virtual_link && (
          <button onClick={e => { e.stopPropagation(); onCopyLink(r.virtual_link!) }}
            className="p-1.5 rounded-lg hover:bg-sb-surface-container-high/80 transition-colors text-sb-primary/60 hover:text-sb-primary">
            {copiedLink === r.virtual_link ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SbBadge color={past ? "bg-black/10 dark:bg-white/10 text-black/40 dark:text-white/40" : "bg-emerald-400/10 text-emerald-400/80"}>
          {past ? "Finalizada" : "Próxima"}
        </SbBadge>
        <SbBadge color="bg-black/10 dark:bg-white/10 text-black/50 dark:text-white/50">
          {targetLabels[r.target_role] || "Todos"}
        </SbBadge>
        {r.priority && r.priority !== "media" && (
          <SbBadge color={priorityLabels[r.priority]?.color || ""}>{priorityLabels[r.priority]?.label || r.priority}</SbBadge>
        )}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-black/40 dark:text-white/40">
        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(r.meeting_date).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}</span>
        {r.meeting_time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(r.meeting_time)}</span>}
      </div>
      {r.agenda && <p className="text-[11px] text-black/40 dark:text-white/40 line-clamp-2">{r.agenda}</p>}
    </motion.div>
  )
}

/* ═══ COMUNICADO CARD ═══ */
function ComunicadoCard({ comunicado: c, onViewDetails }: { comunicado: Comunicado; onViewDetails: (c: Comunicado) => void }) {
  return (
    <motion.div layout
      className="bg-white dark:bg-[#1a1a1c] sb-note rounded-[25px] p-4 space-y-2.5 transition-all cursor-pointer"
      onClick={() => onViewDetails(c)}
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-sb-primary/10 flex items-center justify-center shrink-0">
          <Megaphone className="h-5 w-5 text-sb-primary/70" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-black dark:text-white truncate">{c.title}</h3>
          <p className="text-xs text-black/50 dark:text-white/50 line-clamp-2 mt-0.5">{c.message}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SbBadge color="bg-sb-primary/10 text-sb-primary">{targetLabels[c.target_role] || "Todos"}</SbBadge>
        {c.priority && c.priority !== "media" && (
          <SbBadge color={priorityLabels[c.priority]?.color || ""}>{priorityLabels[c.priority]?.label || c.priority}</SbBadge>
        )}
      </div>
      <div className="flex items-center gap-2 text-[10px] text-black/40 dark:text-white/40">
        <Clock className="h-3 w-3" />
        <span>{timeAgo(c.created_at)}</span>
      </div>
    </motion.div>
  )
}
