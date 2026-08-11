"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Database, Key, Link2, RefreshCw, Layers, Table2 } from "@/components/ui/proicons"
import { cn } from "@/lib/utils"

interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  primary: boolean
}

interface RelationInfo {
  column: string
  refTable: string
  refColumn: string
}

interface TableInfo {
  name: string
  columns: ColumnInfo[]
  relations: RelationInfo[]
}

interface SchemaData {
  ok: boolean
  schema?: string
  tableCount?: number
  tables?: TableInfo[]
  error?: string
}

const PALETTE = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#6366f1", "#14b8a6"]

export default function DevEsquemaPage() {
  const [data, setData] = React.useState<SchemaData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [view, setView] = React.useState<"erd" | "list">("erd")
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const cardRefs = React.useRef<Record<string, HTMLDivElement | null>>({})
  const [lines, setLines] = React.useState<{ from: { x: number; y: number }; to: { x: number; y: number }; color: string; label: string }[]>([])

  const load = React.useCallback(() => {
    setLoading(true)
    return fetch("/api/dev/schema")
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d?.ok) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    const t = setTimeout(load, 0)
    return () => clearTimeout(t)
  }, [load])

  // Calcula las líneas de relación entre tarjetas una vez renderizadas
  const computeLines = React.useCallback(() => {
    if (view !== "erd" || !data?.tables) return
    const wrap = wrapRef.current
    if (!wrap) return
    const wrapRect = wrap.getBoundingClientRect()
    const out: typeof lines = []

    data.tables.forEach(t => {
      const src = cardRefs.current[t.name]
      if (!src) return
      t.relations.forEach(rel => {
        const dst = cardRefs.current[rel.refTable]
        if (!dst) return
        const s = src.getBoundingClientRect()
        const d = dst.getBoundingClientRect()
        const sCx = s.left - wrapRect.left + s.width / 2
        const sCy = s.top - wrapRect.top + s.height / 2
        const dCx = d.left - wrapRect.left + d.width / 2
        const dCy = d.top - wrapRect.top + d.height / 2
        const color = PALETTE[Math.abs(hash(t.name)) % PALETTE.length]
        out.push({
          from: { x: sCx, y: sCy },
          to: { x: dCx, y: dCy },
          color,
          label: `${rel.column} → ${rel.refTable}.${rel.refColumn}`,
        })
      })
    })
    setLines(out)
  }, [data, view])

  React.useEffect(() => {
    if (loading || !data?.tables) return
    const t = setTimeout(computeLines, 120)
    window.addEventListener("resize", computeLines)
    return () => { clearTimeout(t); window.removeEventListener("resize", computeLines) }
  }, [loading, data, computeLines])

  const tables = data?.tables || []

  return (
    <div className="w-full space-y-6 py-2 md:py-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] md:text-[24px] font-bold tracking-tight text-sb-on-surface flex items-center gap-2">
            <Layers className="h-5 w-5 text-sb-primary" />
            Esquema de Base de Datos
          </h2>
          <p className="text-[13px] text-sb-on-surface/70 mt-1">
            Diagrama entidad-relación real del esquema {data?.schema ? `«${data.schema}»` : ""}
            {data?.tableCount ? ` · ${data.tableCount} tablas` : ""} — PK, columnas y relaciones FK.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-sb-surface-container">
            <button
              onClick={() => setView("erd")}
              className={cn("flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-medium transition-colors",
                view === "erd" ? "bg-sb-on-surface text-sb-surface" : "text-sb-on-surface/70 hover:text-sb-on-surface")}
            >
              <Layers className="h-3.5 w-3.5" /> Diagrama
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-medium transition-colors",
                view === "list" ? "bg-sb-on-surface text-sb-surface" : "text-sb-on-surface/70 hover:text-sb-on-surface")}
            >
              <Table2 className="h-3.5 w-3.5" /> Lista
            </button>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 h-9 rounded-xl bg-sb-surface-container text-sb-on-surface text-[12px] font-medium hover:bg-sb-surface-container-high transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Recargar
          </button>
        </div>
      </div>

      {loading && !data && (
        <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-10 flex flex-col items-center gap-3">
          <RefreshCw className="h-5 w-5 text-sb-on-surface/40 animate-spin" />
          <p className="text-[12.5px] text-sb-on-surface/60">Leyendo el esquema de la base de datos...</p>
        </div>
      )}

      {data && !data.ok && (
        <div className="bg-red-500/5 rounded-2xl border border-red-500/20 p-5 text-[12.5px] text-red-600">
          No se pudo leer el esquema: {data.error}
        </div>
      )}

      {data?.ok && tables.length === 0 && (
        <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-10 text-center text-[12.5px] text-sb-on-surface/60">
          No hay tablas en el esquema.
        </div>
      )}

      {data?.ok && tables.length > 0 && view === "erd" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
          ref={wrapRef}
        >
          {/* Líneas de relación */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full z-0"
            style={{ overflow: "visible" }}
          >
            {lines.map((ln, i) => {
              const dx = ln.to.x - ln.from.x
              const dy = ln.to.y - ln.from.y
              const len = Math.max(1, Math.sqrt(dx * dx + dy * dy))
              const nx = dx / len
              const ny = dy / len
              // acorta para no dibujar sobre las tarjetas
              const fromX = ln.from.x + nx * 28
              const fromY = ln.from.y + ny * 28
              const toX = ln.to.x - nx * 28
              const toY = ln.to.y - ny * 28
              const midX = (fromX + toX) / 2
              const midY = (fromY + toY) / 2
              const path = `M ${fromX} ${fromY} Q ${midX + ny * -24} ${midY + nx * 24} ${toX} ${toY}`
              return (
                <g key={i}>
                  <path d={path} fill="none" stroke={ln.color} strokeOpacity={0.45} strokeWidth={1.5} strokeDasharray="5 4" />
                  <circle cx={toX} cy={toY} r={3} fill={ln.color} fillOpacity={0.8} />
                  <text
                    x={midX}
                    y={midY - 8}
                    textAnchor="middle"
                    fontSize={8.5}
                    fill={ln.color}
                    fillOpacity={0.75}
                    style={{ fontFamily: "monospace" }}
                  >
                    {ln.label}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Tarjetas de tablas */}
          <div className="relative z-10 flex flex-wrap gap-4">
            {tables.map((t, i) => {
              const color = PALETTE[i % PALETTE.length]
              return (
                <div
                  key={t.name}
                  ref={el => { cardRefs.current[t.name] = el }}
                  className="w-[260px] rounded-2xl bg-sb-surface border border-sb-outline-variant/10 overflow-hidden shadow-sm"
                  style={{ borderTop: `3px solid ${color}` }}
                >
                  <div className="flex items-center gap-2 px-3.5 py-2.5 bg-sb-surface-container/60">
                    <Database className="h-3.5 w-3.5 shrink-0" style={{ color }} />
                    <p className="text-[13px] font-semibold text-sb-on-surface truncate font-mono">{t.name}</p>
                  </div>
                  <div className="divide-y divide-sb-outline-variant/8">
                    {t.columns.map(c => (
                      <div key={c.name} className="flex items-center gap-2 px-3.5 py-1.5">
                        {c.primary ? (
                          <Key className="h-3 w-3 shrink-0 text-amber-500" />
                        ) : t.relations.some(r => r.column === c.name) ? (
                          <Link2 className="h-3 w-3 shrink-0 text-sky-500" />
                        ) : (
                          <span className="h-3 w-3 shrink-0" />
                        )}
                        <span className={cn("text-[12px] font-mono flex-1 min-w-0 truncate",
                          c.primary ? "text-sb-on-surface font-semibold" : "text-sb-on-surface/80")}>
                          {c.name}
                        </span>
                        <span className="text-[10px] font-mono text-sb-on-surface/45">{c.type}</span>
                        {c.nullable && <span className="text-[9px] text-sb-on-surface/40 font-medium">NULL</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Leyenda */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-[11px] text-sb-on-surface/60">
            <span className="flex items-center gap-1.5"><Key className="h-3 w-3 text-amber-500" /> Primary key</span>
            <span className="flex items-center gap-1.5"><Link2 className="h-3 w-3 text-sky-500" /> Foreign key</span>
            <span className="flex items-center gap-1.5">
              <svg width="18" height="8"><line x1="0" y1="4" x2="18" y2="4" stroke="var(--sb-on-surface-variant)" strokeOpacity="0.5" strokeDasharray="5 4" strokeWidth="1.5" /></svg>
              Relación FK
            </span>
          </div>
        </motion.div>
      )}

      {data?.ok && view === "list" && (
        <div className="space-y-4">
          {tables.map((t, i) => {
            const color = PALETTE[i % PALETTE.length]
            return (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-sb-outline-variant/10">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${color}1a` }}>
                      <Database className="h-3.5 w-3.5" style={{ color }} />
                    </div>
                    <p className="text-[13px] font-semibold text-sb-on-surface font-mono">{t.name}</p>
                    <span className="text-[10px] text-sb-on-surface/50">({t.columns.length} col)</span>
                  </div>
                  {t.relations.length > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-sky-600 bg-sky-500/10 px-2 py-0.5 rounded-full">
                      <Link2 className="h-3 w-3" /> {t.relations.length} FK
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[12px]">
                    <thead>
                      <tr className="text-[10.5px] uppercase tracking-wider text-sb-on-surface/50 border-b border-sb-outline-variant/10">
                        <th className="px-4 py-2 font-medium">Columna</th>
                        <th className="px-3 py-2 font-medium">Tipo</th>
                        <th className="px-3 py-2 font-medium">PK</th>
                        <th className="px-3 py-2 font-medium">Nullable</th>
                        <th className="px-4 py-2 font-medium">Relación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sb-outline-variant/8">
                      {t.columns.map(c => {
                        const rel = t.relations.find(r => r.column === c.name)
                        return (
                          <tr key={c.name} className="hover:bg-sb-surface-container-low/50 transition-colors">
                            <td className="px-4 py-2 font-mono text-sb-on-surface/80">{c.name}</td>
                            <td className="px-3 py-2 font-mono text-[11px] text-sb-on-surface/60">{c.type}</td>
                            <td className="px-3 py-2">{c.primary ? <Key className="h-3.5 w-3.5 text-amber-500" /> : "—"}</td>
                            <td className="px-3 py-2 text-sb-on-surface/60">{c.nullable ? "Sí" : "No"}</td>
                            <td className="px-4 py-2 font-mono text-[11px] text-sky-600">
                              {rel ? `${rel.refTable}.${rel.refColumn}` : ""}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// hash simple para asignar color por nombre de tabla
function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}