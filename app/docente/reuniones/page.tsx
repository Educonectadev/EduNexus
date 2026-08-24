"use client"

import * as React from "react"
import { Handshake, Calendar, Clock, MapPin, Video, Users, ListChecks, Copy, Check, X, Megaphone } from "@/components/ui/proicons"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { SbSectionHeader, SbModal, SbModalHeader, SbModalBody, SbModalFooter, SbBtn, SbBadge } from "@/components/ui/sb"

interface Reunion {
  id: string; title: string; message: string; agenda: string; meeting_date: string; meeting_time: string
  location: string; virtual_link: string; target_role: string; status: string; priority: string; created_at: string; type: string
}

interface Comunicado {
  id: string; title: string; message: string; target_role: string; status: string; priority: string
  category: string; created_at: string; type: string
}

const targetLabels: Record<string, string> = { all: "Todos", docente: "Docentes", padre: "Apoderados", secretario: "Secretaría" }
const priorityLabels: Record<string, { label: string; color: string }> = {
  baja: { label: "Baja", color: "bg-blue-400/10 text-blue-400/80" },
  media: { label: "Media", color: "bg-yellow-400/10 text-yellow-400/80" },
  alta: { label: "Alta", color: "bg-orange-400/10 text-orange-400/80" },
  urgente: { label: "Urgente", color: "bg-red-400/10 text-red-400/80" },
}

function formatTime(t: string) { return t ? t.slice(0, 5) : "" }
function isTodayOrFuture(d: string) { const t = new Date(); t.setHours(0,0,0,0); const m = new Date(d); m.setHours(0,0,0,0); return m >= t }
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime(); const m = Math.floor(diff / 60000)
  if (m < 1) return "Ahora"; if (m < 60) return `Hace ${m} min`
  const h = Math.floor(m / 60); if (h < 24) return `Hace ${h}h`
  const dy = Math.floor(h / 24); if (dy < 7) return `Hace ${dy}d`
  return new Date(d).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })
}

export default function DocenteReunionesPage() {
  const [reuniones, setReuniones] = React.useState<Reunion[]>([])
  const [comunicados, setComunicados] = React.useState<Comunicado[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showDetails, setShowDetails] = React.useState<Reunion | Comunicado | null>(null)
  const [detailType, setDetailType] = React.useState<"reunion" | "comunicado">("reunion")
  const [copiedLink, setCopiedLink] = React.useState<string | null>(null)

  React.useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [resR, resC] = await Promise.all([fetch("/api/docente/reuniones"), fetch("/api/docente/comunicados")])
      if (resR.ok) setReuniones(await resR.json())
      if (resC.ok) setComunicados(await resC.json())
    } catch {} finally { setLoading(false) }
  }

  const handleCopyLink = (link: string) => { navigator.clipboard.writeText(link); setCopiedLink(link); setTimeout(() => setCopiedLink(null), 2000) }

  const upcoming = reuniones.filter(r => isTodayOrFuture(r.meeting_date))
  const past = reuniones.filter(r => !isTodayOrFuture(r.meeting_date))

  return (
    <div className="space-y-8">
      <SbSectionHeader title="Reuniones y Comunicados" description="Reuniones y comunicados de la dirección" />

      {/* ═══ SECCIÓN REUNIONES ═══ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Handshake className="h-4 w-4 text-emerald-500/70" />
          </div>
          <h2 className="text-base font-bold text-black dark:text-white">Reuniones</h2>
        </div>

        {!loading && reuniones.length === 0 && (
          <div className="text-center py-8 bg-white dark:bg-[#1a1a1c] sb-note rounded-[25px]">
            <Handshake className="h-8 w-8 text-black/20 dark:text-white/20 mx-auto mb-2" />
            <p className="text-sm text-black/40 dark:text-white/40">Sin reuniones programadas</p>
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Check className="h-3.5 w-3.5 text-emerald-400/70" />
              <h3 className="text-xs font-semibold text-black/60 dark:text-white/60">Próximas</h3>
              <span className="text-[10px] text-black/30 dark:text-white/30 ml-auto">{upcoming.length}</span>
            </div>
            <div className="space-y-2">
              {upcoming.map(r => <ReunionCard key={r.id} r={r} onCopyLink={handleCopyLink} copiedLink={copiedLink} onClick={() => { setShowDetails(r); setDetailType("reunion") }} />)}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-3.5 w-3.5 text-black/20 dark:text-white/20" />
              <h3 className="text-xs font-semibold text-black/40 dark:text-white/40">Pasadas</h3>
              <span className="text-[10px] text-black/30 dark:text-white/30 ml-auto">{past.length}</span>
            </div>
            <div className="space-y-2">
              {past.map(r => <ReunionCard key={r.id} r={r} onCopyLink={handleCopyLink} copiedLink={copiedLink} onClick={() => { setShowDetails(r); setDetailType("reunion") }} past />)}
            </div>
          </div>
        )}
      </section>

      {/* ═══ SECCIÓN COMUNICADOS ═══ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-xl bg-sb-primary/10 flex items-center justify-center">
            <Megaphone className="h-4 w-4 text-sb-primary/70" />
          </div>
          <h2 className="text-base font-bold text-black dark:text-white">Comunicados del Director</h2>
        </div>

        {!loading && comunicados.length === 0 && (
          <div className="text-center py-8 bg-white dark:bg-[#1a1a1c] sb-note rounded-[25px]">
            <Megaphone className="h-8 w-8 text-black/20 dark:text-white/20 mx-auto mb-2" />
            <p className="text-sm text-black/40 dark:text-white/40">Sin comunicados</p>
          </div>
        )}

        {comunicados.length > 0 && (
          <div className="space-y-2">
            {comunicados.map(c => <ComunicadoCard key={c.id} c={c} onClick={() => { setShowDetails(c); setDetailType("comunicado") }} />)}
          </div>
        )}
      </section>

      {/* ═══ MODAL ═══ */}
      <SbModal open={!!showDetails} onClose={() => setShowDetails(null)} maxWidth="480px">
        {showDetails && detailType === "reunion" && (
          <>
            <SbModalHeader title={(showDetails as Reunion).title} onClose={() => setShowDetails(null)} />
            <SbModalBody><ReunionDetail r={showDetails as Reunion} copiedLink={copiedLink} onCopyLink={handleCopyLink} /></SbModalBody>
            <SbModalFooter><SbBtn variant="filled" rounded className="w-full" onClick={() => setShowDetails(null)}>Cerrar</SbBtn></SbModalFooter>
          </>
        )}
        {showDetails && detailType === "comunicado" && (
          <>
            <SbModalHeader title={(showDetails as Comunicado).title} onClose={() => setShowDetails(null)} />
            <SbModalBody><ComunicadoDetail c={showDetails as Comunicado} /></SbModalBody>
            <SbModalFooter><SbBtn variant="filled" rounded className="w-full" onClick={() => setShowDetails(null)}>Cerrar</SbBtn></SbModalFooter>
          </>
        )}
      </SbModal>
    </div>
  )
}

function ReunionDetail({ r, copiedLink, onCopyLink }: { r: Reunion; copiedLink: string | null; onCopyLink: (l: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <SbBadge color={isTodayOrFuture(r.meeting_date) ? "bg-emerald-400/10 text-emerald-400/80" : "bg-sb-surface-container-high text-sb-on-surface-variant/50"}>
          {isTodayOrFuture(r.meeting_date) ? "Próxima" : "Finalizada"}
        </SbBadge>
        <SbBadge color="bg-sb-surface-container-high text-sb-on-surface-variant/50">{targetLabels[r.target_role] || "Todos"}</SbBadge>
        {r.priority && <SbBadge color={priorityLabels[r.priority]?.color || ""}>{priorityLabels[r.priority]?.label || r.priority}</SbBadge>}
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
          <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-sb-on-surface-variant/40" /><span className="text-sm text-sb-on-surface">{r.location}</span></div>
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
      {r.agenda && <div className="bg-sb-surface-container-high/50 rounded-xl p-4 space-y-2 border border-sb-outline-variant/10"><p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">Agenda</p><p className="text-sm text-sb-on-surface whitespace-pre-wrap leading-relaxed">{r.agenda}</p></div>}
      {r.message && <div className="bg-sb-surface-container-high/50 rounded-xl p-4 space-y-2 border border-sb-outline-variant/10"><p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">Detalles</p><p className="text-sm text-sb-on-surface whitespace-pre-wrap leading-relaxed">{r.message}</p></div>}
    </div>
  )
}

function ComunicadoDetail({ c }: { c: Comunicado }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <SbBadge color="bg-sb-primary/10 text-sb-primary">{targetLabels[c.target_role] || "Todos"}</SbBadge>
        {c.priority && c.priority !== "media" && <SbBadge color={priorityLabels[c.priority]?.color || ""}>{priorityLabels[c.priority]?.label || c.priority}</SbBadge>}
      </div>
      <div className="bg-sb-surface-container-high/50 rounded-xl p-4 space-y-2 border border-sb-outline-variant/10">
        <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">Mensaje</p>
        <p className="text-sm text-sb-on-surface whitespace-pre-wrap leading-relaxed">{c.message}</p>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-sb-on-surface-variant/40"><Clock className="h-3 w-3" /><span>{timeAgo(c.created_at)}</span></div>
    </div>
  )
}

function ReunionCard({ r, onCopyLink, copiedLink, onClick, past }: { r: Reunion; onCopyLink: (l: string) => void; copiedLink: string | null; onClick: () => void; past?: boolean }) {
  return (
    <motion.div layout className={cn("bg-white dark:bg-[#1a1a1c] sb-note rounded-[25px] p-4 space-y-2.5 transition-all cursor-pointer", past && "opacity-50")} onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", past ? "bg-black/5 dark:bg-white/5" : "bg-emerald-500/10")}>
            <Handshake className={cn("h-5 w-5", past ? "text-black/20 dark:text-white/20" : "text-emerald-500/70")} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-black dark:text-white truncate">{r.title}</h3>
            {r.location && <p className="text-xs text-black/50 dark:text-white/50 flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> {r.location}</p>}
          </div>
        </div>
        {r.virtual_link && (
          <button onClick={e => { e.stopPropagation(); onCopyLink(r.virtual_link!) }} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-sb-primary/60 hover:text-sb-primary">
            {copiedLink === r.virtual_link ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SbBadge color={past ? "bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40" : "bg-emerald-400/10 text-emerald-400/80"}>{past ? "Finalizada" : "Próxima"}</SbBadge>
        <SbBadge color="bg-black/5 dark:bg-white/5 text-black/50 dark:text-white/50">{targetLabels[r.target_role] || "Todos"}</SbBadge>
        {r.priority && r.priority !== "media" && <SbBadge color={priorityLabels[r.priority]?.color || ""}>{priorityLabels[r.priority]?.label || r.priority}</SbBadge>}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-black/40 dark:text-white/40">
        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(r.meeting_date).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}</span>
        {r.meeting_time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(r.meeting_time)}</span>}
      </div>
      {r.agenda && <p className="text-[11px] text-black/40 dark:text-white/40 line-clamp-2">{r.agenda}</p>}
    </motion.div>
  )
}

function ComunicadoCard({ c, onClick }: { c: Comunicado; onClick: () => void }) {
  return (
    <motion.div layout className="bg-white dark:bg-[#1a1a1c] sb-note rounded-[25px] p-4 space-y-2.5 transition-all cursor-pointer" onClick={onClick}>
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
        {c.priority && c.priority !== "media" && <SbBadge color={priorityLabels[c.priority]?.color || ""}>{priorityLabels[c.priority]?.label || c.priority}</SbBadge>}
      </div>
      <div className="flex items-center gap-2 text-[10px] text-black/40 dark:text-white/40"><Clock className="h-3 w-3" /><span>{timeAgo(c.created_at)}</span></div>
    </motion.div>
  )
}
