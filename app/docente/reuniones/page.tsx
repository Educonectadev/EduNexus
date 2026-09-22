"use client"

import * as React from "react"
import { Handshake, Calendar, Clock, MapPin, Video, Copy, Check, Megaphone, Sun, Moon } from "@/components/ui/proicons"
import NotificationBell from "@/components/layout/notification-bell"
import { useAuthStore } from "@/stores/auth-store"
import { useTheme } from "next-themes"

const FONT = "var(--app-main-font, 'DM Sans'), sans-serif"

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
  const { theme, setTheme } = useTheme()
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
    <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-white dark:bg-[#1a1a1c] sb-note">
      <div className="p-6 md:p-8 pb-24 md:pb-8">

        {/* ═══════════════ HEADER ═══════════════ */}
        <header className="flex items-start justify-between mb-6 gap-4">
          <div>
            <p className="text-[14px] font-medium mb-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Comunicación</p>
            <h1 className="text-[36px] md:text-[48px] font-bold leading-tight" style={{ color: "var(--note-text)", fontFamily: FONT }}>
              Reuniones
            </h1>
            <p className="text-[13px] mt-2" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Reuniones y avisos de la dirección</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5">
                <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ background: "var(--note-fill-strong)" }}>
                  <span className="text-[9px] font-semibold" style={{ color: "var(--note-text)" }}>
                    {user.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "D"}
                  </span>
                </div>
                <span className="text-sm md:text-base font-medium whitespace-nowrap" style={{ color: "var(--note-text)", fontFamily: FONT }}>
                  {user.full_name}
                </span>
              </div>
            )}
            <NotificationBell />
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Cambiar tema" title="Cambiar tema" className="h-10 w-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity relative">
              <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" style={{ color: "var(--note-text)" }} />
              <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" style={{ color: "var(--note-text)" }} />
            </button>
          </div>
        </header>

        {/* ═══════════════ TOGGLE ═══════════════ */}
        <div className="flex mb-6 p-1" style={{ borderRadius: "16px", background: "var(--note-fill)" }}>
          <button
            onClick={() => setTab("reuniones")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold transition-all duration-200"
            style={{
              borderRadius: "12px",
              background: tab === "reuniones" ? "var(--note-surface)" : "transparent",
              color: tab === "reuniones" ? "var(--note-text)" : "var(--note-muted)",
              boxShadow: tab === "reuniones" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              fontFamily: FONT,
            }}
          >
            <Handshake className="h-4 w-4" />
            Reuniones
            {upcoming.length > 0 && (
              <span className="h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] font-bold" style={{ borderRadius: "999px", background: "var(--note-fill-strong)", color: "var(--note-text)", fontFamily: FONT }}>
                {upcoming.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("comunicados")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold transition-all duration-200"
            style={{
              borderRadius: "12px",
              background: tab === "comunicados" ? "var(--note-surface)" : "transparent",
              color: tab === "comunicados" ? "var(--note-text)" : "var(--note-muted)",
              boxShadow: tab === "comunicados" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              fontFamily: FONT,
            }}
          >
            <Megaphone className="h-4 w-4" />
            Comunicados
            {comunicados.length > 0 && (
              <span className="h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] font-bold" style={{ borderRadius: "999px", background: "var(--note-fill-strong)", color: "var(--note-text)", fontFamily: FONT }}>
                {comunicados.length}
              </span>
            )}
          </button>
        </div>

        {/* ═══════════════ CONTENT ═══════════════ */}
        {tab === "reuniones" && (
          <div className="space-y-4">
            {!loading && reuniones.length === 0 && (
              <EmptyState icon={Handshake} title="Sin reuniones" desc="La dirección no ha programado reuniones" />
            )}

            {upcoming.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full" style={{ background: "#22c55e" }} />
                  <h3 className="text-[12px] font-bold" style={{ color: "var(--note-text)", fontFamily: FONT }}>Próximas</h3>
                  <span className="text-[10px] ml-auto" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{upcoming.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {upcoming.map(r => <ReunionCard key={r.id} r={r} onCopyLink={handleCopyLink} copiedLink={copiedLink} onClick={() => { setShowDetails(r); setDetailType("reunion") }} />)}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-3 w-3" style={{ color: "var(--note-muted)", opacity: 0.4 }} />
                  <h3 className="text-[12px] font-bold" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Pasadas</h3>
                  <span className="text-[10px] ml-auto" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{past.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {past.map(r => <ReunionCard key={r.id} r={r} onCopyLink={handleCopyLink} copiedLink={copiedLink} onClick={() => { setShowDetails(r); setDetailType("reunion") }} past />)}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "comunicados" && (
          <div className="flex flex-col gap-2">
            {!loading && comunicados.length === 0 && (
              <EmptyState icon={Megaphone} title="Sin comunicados" desc="No hay avisos de la dirección" />
            )}
            {comunicados.map(c => <ComunicadoCard key={c.id} c={c} onClick={() => { setShowDetails(c); setDetailType("comunicado") }} />)}
          </div>
        )}

        {/* ═══════════════ MODAL ═══════════════ */}
        {showDetails && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
            <div
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              style={{ borderRadius: "24px", background: "var(--note-surface)", border: "1px solid var(--note-hairline)" }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[18px] font-bold truncate pr-4" style={{ color: "var(--note-text)", fontFamily: FONT }}>
                    {showDetails.title}
                  </h2>
                  <button
                    onClick={() => setShowDetails(null)}
                    className="h-8 w-8 flex items-center justify-center shrink-0 text-[14px] font-bold transition-opacity hover:opacity-60"
                    style={{ borderRadius: "999px", background: "var(--note-fill)", color: "var(--note-muted)" }}
                  >
                    ×
                  </button>
                </div>

                {detailType === "reunion" && (
                  <ReunionDetail r={showDetails as Reunion} copiedLink={copiedLink} onCopyLink={handleCopyLink} />
                )}
                {detailType === "comunicado" && (
                  <ComunicadoDetail c={showDetails as Comunicado} />
                )}

                <button
                  onClick={() => setShowDetails(null)}
                  className="w-full mt-6 py-3 text-[13px] font-semibold transition-opacity hover:opacity-80"
                  style={{ borderRadius: "999px", background: "var(--note-solid-bg)", color: "var(--note-solid-fg)", fontFamily: FONT }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══ EMPTY STATE ═══ */
function EmptyState({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; title: string; desc: string }) {
  return (
    <div className="text-center py-12" style={{ borderRadius: "24px", background: "var(--note-surface)", border: "1px solid var(--note-hairline)" }}>
      <div className="w-16 h-16 flex items-center justify-center mx-auto mb-3" style={{ borderRadius: "16px", background: "var(--note-fill)" }}>
        <Icon className="h-7 w-7" style={{ color: "var(--note-muted)", opacity: 0.2 }} />
      </div>
      <p className="text-[14px] font-semibold" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{title}</p>
      <p className="text-[12px] mt-0.5" style={{ color: "var(--note-muted)", fontFamily: FONT, opacity: 0.6 }}>{desc}</p>
    </div>
  )
}

/* ═══ REUNION DETAIL ═══ */
function ReunionDetail({ r, copiedLink, onCopyLink }: { r: Reunion; copiedLink: string | null; onCopyLink: (l: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge label={isTodayOrFuture(r.meeting_date) ? "Próxima" : "Finalizada"} />
        <Badge label={targetLabels[r.target_role] || "Todos"} />
        {r.priority && r.priority !== "media" && <Badge label={priorityLabels[r.priority] || r.priority} />}
      </div>

      <InfoBlock label="Fecha y hora">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" style={{ color: "var(--note-muted)" }} />
          <span className="text-[13px]" style={{ color: "var(--note-text)", fontFamily: FONT }}>
            {new Date(r.meeting_date).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {r.meeting_time && <> — {formatTime(r.meeting_time)}</>}
          </span>
        </div>
      </InfoBlock>

      {r.location && (
        <InfoBlock label="Ubicación">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" style={{ color: "var(--note-muted)" }} />
            <span className="text-[13px]" style={{ color: "var(--note-text)", fontFamily: FONT }}>{r.location}</span>
          </div>
        </InfoBlock>
      )}

      {r.virtual_link && (
        <InfoBlock label="Enlace virtual">
          <div className="flex items-center gap-2">
            <a href={r.virtual_link} target="_blank" rel="noopener noreferrer" className="text-[13px] truncate flex-1" style={{ color: "var(--note-text)", fontFamily: FONT }}>{r.virtual_link}</a>
            <button onClick={() => onCopyLink(r.virtual_link!)} className="h-7 w-7 flex items-center justify-center shrink-0 transition-opacity hover:opacity-60" style={{ borderRadius: "8px", background: "var(--note-fill)" }}>
              {copiedLink === r.virtual_link ? <Check className="h-3.5 w-3.5" style={{ color: "#22c55e" }} /> : <Copy className="h-3.5 w-3.5" style={{ color: "var(--note-muted)" }} />}
            </button>
          </div>
        </InfoBlock>
      )}

      {r.agenda && (
        <InfoBlock label="Agenda">
          <p className="text-[13px] whitespace-pre-wrap leading-relaxed" style={{ color: "var(--note-text)", fontFamily: FONT }}>{r.agenda}</p>
        </InfoBlock>
      )}

      {r.message && (
        <InfoBlock label="Detalles">
          <p className="text-[13px] whitespace-pre-wrap leading-relaxed" style={{ color: "var(--note-text)", fontFamily: FONT }}>{r.message}</p>
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
        {c.priority && c.priority !== "media" && <Badge label={priorityLabels[c.priority] || c.priority} />}
      </div>

      <InfoBlock label="Mensaje">
        <p className="text-[13px] whitespace-pre-wrap leading-relaxed" style={{ color: "var(--note-text)", fontFamily: FONT }}>{c.message}</p>
      </InfoBlock>

      <div className="flex items-center gap-2">
        <Clock className="h-3 w-3" style={{ color: "var(--note-muted)" }} />
        <span className="text-[11px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{timeAgo(c.created_at)}</span>
      </div>
    </div>
  )
}

/* ═══ REUNION CARD ═══ */
function ReunionCard({ r, onCopyLink, copiedLink, onClick, past }: { r: Reunion; onCopyLink: (l: string) => void; copiedLink: string | null; onClick: () => void; past?: boolean }) {
  return (
    <div
      className="p-3 transition-all cursor-pointer group"
      style={{
        borderRadius: "16px",
        background: "var(--note-fill)",
        opacity: past ? 0.5 : 1,
      }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform" style={{ borderRadius: "12px", background: past ? "var(--note-fill-strong)" : "var(--note-fill-strong)" }}>
            <Handshake className="h-4 w-4" style={{ color: "var(--note-text)" }} />
          </div>
          <div className="min-w-0">
            <h3 className="text-[13px] font-semibold truncate" style={{ color: "var(--note-text)", fontFamily: FONT }}>{r.title}</h3>
            {r.location && <p className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: "var(--note-muted)", fontFamily: FONT }}><MapPin className="h-2.5 w-2.5" /> {r.location}</p>}
          </div>
        </div>
        {r.virtual_link && (
          <button onClick={e => { e.stopPropagation(); onCopyLink(r.virtual_link!) }} className="h-7 w-7 flex items-center justify-center shrink-0 transition-opacity hover:opacity-60" style={{ borderRadius: "8px", background: "var(--note-fill-strong)" }}>
            {copiedLink === r.virtual_link ? <Check className="h-3 w-3" style={{ color: "#22c55e" }} /> : <Copy className="h-3 w-3" style={{ color: "var(--note-muted)" }} />}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge label={past ? "Finalizada" : "Próxima"} />
        <Badge label={targetLabels[r.target_role] || "Todos"} />
        {r.priority && r.priority !== "media" && <Badge label={priorityLabels[r.priority] || r.priority} />}
        <span className="text-[10px] ml-auto flex items-center gap-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
          <Calendar className="h-2.5 w-2.5" />
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
      className="p-3 transition-all cursor-pointer group"
      style={{ borderRadius: "16px", background: "var(--note-fill)" }}
      onClick={onClick}
    >
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform" style={{ borderRadius: "12px", background: "var(--note-fill-strong)" }}>
          <Megaphone className="h-4 w-4" style={{ color: "var(--note-text)" }} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-semibold truncate" style={{ color: "var(--note-text)", fontFamily: FONT }}>{c.title}</h3>
          <p className="text-[11px] line-clamp-1 mt-0.5" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{c.message}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Badge label={targetLabels[c.target_role] || "Todos"} />
        {c.priority && c.priority !== "media" && <Badge label={priorityLabels[c.priority] || c.priority} />}
        <span className="text-[10px] ml-auto flex items-center gap-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
          <Clock className="h-2.5 w-2.5" />{timeAgo(c.created_at)}
        </span>
      </div>
    </div>
  )
}

/* ═══ SHARED: Badge ═══ */
function Badge({ label }: { label: string }) {
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5" style={{ borderRadius: "8px", background: "var(--note-fill-strong)", color: "var(--note-text)", fontFamily: FONT }}>
      {label}
    </span>
  )
}

/* ═══ SHARED: InfoBlock ═══ */
function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="p-3 space-y-1.5" style={{ borderRadius: "12px", background: "var(--note-fill)", border: "1px solid var(--note-hairline)" }}>
      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{label}</p>
      {children}
    </div>
  )
}
