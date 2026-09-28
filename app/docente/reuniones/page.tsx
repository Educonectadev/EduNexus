"use client"

import * as React from "react"
import { Handshake, Calendar, Clock, MapPin, Copy, Check, Megaphone } from "@/components/ui/proicons"
import { SbSectionHeader, SbModal, SbModalHeader, SbModalBody, SbModalFooter, SbBtn, SbBadge } from "@/components/ui/sb"
import { useAuthStore } from "@/stores/auth-store"

interface Reunion {
  id: string; title: string; message: string; agenda: string; meeting_date: string; meeting_time: string
  location: string; virtual_link: string; target_role: string; status: string; priority: string; created_at: string
}

interface Comunicado {
  id: string; title: string; message: string; target_role: string; status: string; priority: string
  category: string; created_at: string
}

const targetLabels: Record<string, string> = { all: "Todos", docente: "Docentes", padre: "Apoderados", secretario: "Secretaría" }
const priorityLabels: Record<string, string> = { baja: "Baja", media: "Media", alta: "Alta", urgente: "Urgente" }
const priorityTone: Record<string, string> = {
  baja: "bg-blue-500/10 text-blue-400",
  alta: "bg-amber-500/10 text-amber-400",
  urgente: "bg-red-500/10 text-red-400",
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
  const user = useAuthStore((s) => s.user)
  const [reuniones, setReuniones] = React.useState<Reunion[]>([])
  const [comunicados, setComunicados] = React.useState<Comunicado[]>([])
  const [loading, setLoading] = React.useState(true)
  const [tab, setTab] = React.useState<"reuniones" | "comunicados">("reuniones")
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
    <div className="space-y-5">
      <SbSectionHeader title="Reuniones" description="Reuniones y avisos de la dirección" />

      {/* ═══════════════ TOGGLE ═══════════════ */}
      <div className="flex gap-1 p-1 bg-sb-surface-container rounded-2xl">
        <button
          onClick={() => setTab("reuniones")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 ${tab === "reuniones" ? "bg-sb-on-surface text-sb-surface" : "text-sb-on-surface-variant/50 hover:text-sb-on-surface/70"}`}
        >
          <Handshake className="h-3.5 w-3.5" />
          Reuniones
          {upcoming.length > 0 && (
            <span className={`h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full text-[10px] font-semibold ${tab === "reuniones" ? "bg-sb-surface/20 text-sb-surface" : "bg-sb-surface-container-high text-sb-on-surface-variant/60"}`}>
              {upcoming.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("comunicados")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 ${tab === "comunicados" ? "bg-sb-on-surface text-sb-surface" : "text-sb-on-surface-variant/50 hover:text-sb-on-surface/70"}`}
        >
          <Megaphone className="h-3.5 w-3.5" />
          Comunicados
          {comunicados.length > 0 && (
            <span className={`h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full text-[10px] font-semibold ${tab === "comunicados" ? "bg-sb-surface/20 text-sb-surface" : "bg-sb-surface-container-high text-sb-on-surface-variant/60"}`}>
              {comunicados.length}
            </span>
          )}
        </button>
      </div>

      {/* ═══════════════ CONTENT ═══════════════ */}
      {tab === "reuniones" && (
        <div className="space-y-5">
          {!loading && reuniones.length === 0 && (
            <EmptyState icon={Handshake} title="Sin reuniones" desc="La dirección no ha programado reuniones" />
          )}

          {upcoming.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50">Próximas</h3>
                <span className="text-[11px] ml-auto text-sb-on-surface-variant/40">{upcoming.length}</span>
              </div>
              <div className="space-y-2">
                {upcoming.map(r => <ReunionCard key={r.id} r={r} onCopyLink={handleCopyLink} copiedLink={copiedLink} onClick={() => { setShowDetails(r); setDetailType("reunion") }} />)}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-3.5 w-3.5 text-sb-on-surface-variant/30" />
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50">Pasadas</h3>
                <span className="text-[11px] ml-auto text-sb-on-surface-variant/40">{past.length}</span>
              </div>
              <div className="space-y-2">
                {past.map(r => <ReunionCard key={r.id} r={r} onCopyLink={handleCopyLink} copiedLink={copiedLink} onClick={() => { setShowDetails(r); setDetailType("reunion") }} past />)}
              </div>
            </section>
          )}
        </div>
      )}

      {tab === "comunicados" && (
        <div className="space-y-2">
          {!loading && comunicados.length === 0 && (
            <EmptyState icon={Megaphone} title="Sin comunicados" desc="No hay avisos de la dirección" />
          )}
          {comunicados.map(c => <ComunicadoCard key={c.id} c={c} onClick={() => { setShowDetails(c); setDetailType("comunicado") }} />)}
        </div>
      )}

      {/* ═══════════════ MODAL ═══════════════ */}
      <SbModal open={!!showDetails} onClose={() => setShowDetails(null)} maxWidth="480px">
        {showDetails && (
          <>
            <SbModalHeader title={showDetails.title} onClose={() => setShowDetails(null)} />
            <SbModalBody>
              {detailType === "reunion" && (
                <ReunionDetail r={showDetails as Reunion} copiedLink={copiedLink} onCopyLink={handleCopyLink} />
              )}
              {detailType === "comunicado" && (
                <ComunicadoDetail c={showDetails as Comunicado} />
              )}
            </SbModalBody>
            <SbModalFooter>
              <SbBtn variant="filled" rounded className="w-full" onClick={() => setShowDetails(null)}>
                Cerrar
              </SbBtn>
            </SbModalFooter>
          </>
        )}
      </SbModal>
    </div>
  )
}

/* ═══ EMPTY STATE ═══ */
function EmptyState({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; title: string; desc: string }) {
  return (
    <div className="rounded-2xl bg-sb-surface border border-sb-outline-variant/10 py-12 text-center">
      <div className="h-16 w-16 flex items-center justify-center mx-auto mb-3 rounded-2xl bg-sb-surface-container">
        <Icon className="h-7 w-7 text-sb-on-surface-variant/20" />
      </div>
      <p className="text-sm font-semibold text-sb-on-surface-variant/60">{title}</p>
      <p className="text-xs mt-0.5 text-sb-on-surface-variant/40">{desc}</p>
    </div>
  )
}

/* ═══ REUNION DETAIL ═══ */
function ReunionDetail({ r, copiedLink, onCopyLink }: { r: Reunion; copiedLink: string | null; onCopyLink: (l: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge label={isTodayOrFuture(r.meeting_date) ? "Próxima" : "Finalizada"} tone={isTodayOrFuture(r.meeting_date) ? "bg-emerald-500/10 text-emerald-400" : "bg-sb-surface-container-high text-sb-on-surface-variant/50"} />
        <Badge label={targetLabels[r.target_role] || "Todos"} />
        {r.priority && r.priority !== "media" && <Badge label={priorityLabels[r.priority] || r.priority} tone={priorityTone[r.priority]} />}
      </div>

      <InfoBlock label="Fecha y hora">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-sb-on-surface-variant/50" />
          <span className="text-sm text-sb-on-surface">
            {new Date(r.meeting_date).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {r.meeting_time && <> — {formatTime(r.meeting_time)}</>}
          </span>
        </div>
      </InfoBlock>

      {r.location && (
        <InfoBlock label="Ubicación">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-sb-on-surface-variant/50" />
            <span className="text-sm text-sb-on-surface">{r.location}</span>
          </div>
        </InfoBlock>
      )}

      {r.virtual_link && (
        <InfoBlock label="Enlace virtual">
          <div className="flex items-center gap-2">
            <a href={r.virtual_link} target="_blank" rel="noopener noreferrer" className="text-sm text-sb-primary truncate flex-1 hover:underline">{r.virtual_link}</a>
            <button onClick={() => onCopyLink(r.virtual_link!)} className="sb-btn-icon shrink-0">
              {copiedLink === r.virtual_link ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-sb-on-surface-variant/50" />}
            </button>
          </div>
        </InfoBlock>
      )}

      {r.agenda && (
        <InfoBlock label="Agenda">
          <p className="text-sm text-sb-on-surface whitespace-pre-wrap leading-relaxed">{r.agenda}</p>
        </InfoBlock>
      )}

      {r.message && (
        <InfoBlock label="Detalles">
          <p className="text-sm text-sb-on-surface whitespace-pre-wrap leading-relaxed">{r.message}</p>
        </InfoBlock>
      )}
    </div>
  )
}

/* ═══ COMUNICADO DETAIL ═══ */
function ComunicadoDetail({ c }: { c: Comunicado }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge label={targetLabels[c.target_role] || "Todos"} />
        {c.priority && c.priority !== "media" && <Badge label={priorityLabels[c.priority] || c.priority} tone={priorityTone[c.priority]} />}
      </div>

      <InfoBlock label="Mensaje">
        <p className="text-sm text-sb-on-surface whitespace-pre-wrap leading-relaxed">{c.message}</p>
      </InfoBlock>

      <div className="flex items-center gap-2">
        <Clock className="h-3 w-3 text-sb-on-surface-variant/50" />
        <span className="text-[11px] text-sb-on-surface-variant/50">{timeAgo(c.created_at)}</span>
      </div>
    </div>
  )
}

/* ═══ REUNION CARD ═══ */
function ReunionCard({ r, onCopyLink, copiedLink, onClick, past }: { r: Reunion; onCopyLink: (l: string) => void; copiedLink: string | null; onClick: () => void; past?: boolean }) {
  return (
    <div
      className={`rounded-2xl bg-sb-surface border border-sb-outline-variant/10 p-5 transition-all cursor-pointer group ${past ? "opacity-50" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${past ? "bg-sb-surface-container-high text-sb-on-surface-variant/50" : "bg-emerald-500/10 text-emerald-500/80"}`}>
            <Handshake className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate text-sb-on-surface">{r.title}</h3>
            {r.location && <p className="text-[11px] flex items-center gap-1 mt-0.5 text-sb-on-surface-variant/50"><MapPin className="h-3 w-3" /> {r.location}</p>}
          </div>
        </div>
        {r.virtual_link && (
          <button onClick={e => { e.stopPropagation(); onCopyLink(r.virtual_link!) }} className="sb-btn-icon shrink-0">
            {copiedLink === r.virtual_link ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-sb-on-surface-variant/50" />}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge label={past ? "Finalizada" : "Próxima"} tone={past ? "bg-sb-surface-container-high text-sb-on-surface-variant/50" : "bg-emerald-500/10 text-emerald-400"} />
        <Badge label={targetLabels[r.target_role] || "Todos"} />
        {r.priority && r.priority !== "media" && <Badge label={priorityLabels[r.priority] || r.priority} tone={priorityTone[r.priority]} />}
        <span className="text-[11px] ml-auto flex items-center gap-1 text-sb-on-surface-variant/50">
          <Calendar className="h-3 w-3" />
          {new Date(r.meeting_date).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
          {r.meeting_time && <>{formatTime(r.meeting_time)}</>}
        </span>
      </div>
    </div>
  )
}

/* ═══ COMUNICADO CARD ═══ */
function ComunicadoCard({ c, onClick }: { c: Comunicado; onClick: () => void }) {
  return (
    <div
      className="rounded-2xl bg-sb-surface border border-sb-outline-variant/10 p-5 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-sb-surface-container flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <Megaphone className="h-4 w-4 text-sb-on-surface-variant/60" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold truncate text-sb-on-surface">{c.title}</h3>
          <p className="text-[11px] line-clamp-1 mt-0.5 text-sb-on-surface-variant/50">{c.message}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <Badge label={targetLabels[c.target_role] || "Todos"} />
        {c.priority && c.priority !== "media" && <Badge label={priorityLabels[c.priority] || c.priority} tone={priorityTone[c.priority]} />}
        <span className="text-[11px] ml-auto flex items-center gap-1 text-sb-on-surface-variant/50">
          <Clock className="h-3 w-3" />{timeAgo(c.created_at)}
        </span>
      </div>
    </div>
  )
}

/* ═══ SHARED: Badge ═══ */
function Badge({ label, tone }: { label: string; tone?: string }) {
  return (
    <SbBadge color={tone} className="px-2.5 py-0.5 text-[11px] font-medium">
      {label}
    </SbBadge>
  )
}

/* ═══ SHARED: InfoBlock ═══ */
function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-sb-surface-container-high/50 border border-sb-outline-variant/10 p-4 space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50">{label}</p>
      {children}
    </div>
  )
}
