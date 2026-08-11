"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Key, RefreshCw, Layers, Table2, Search, ArrowRight } from "@/components/ui/proicons"
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

interface EdgeLine {
  from: { x: number; y: number }
  to: { x: number; y: number }
  c1: { x: number; y: number }
  c2: { x: number; y: number }
  mid: { x: number; y: number }
  color: string
  source: string
  target: string
  label: string
}

const PALETTE = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#6366f1", "#14b8a6"]

// Abrevia tipos de Postgres para leerlos de un vistazo
function shortType(t: string): string {
  const s = t || ""
  const m = s.match(/\((\d+)\)/)
  const arg = m ? `(${m[1]})` : ""
  if (s.startsWith("character varying")) return `varchar${arg}`
  if (s.startsWith("character")) return `char${arg}`
  if (s.startsWith("timestamp")) return "timestamp"
  if (s.startsWith("time")) return "time"
  if (s.startsWith("smallint")) return "smallint"
  if (s.startsWith("bigint")) return "bigint"
  if (s.startsWith("integer")) return "int"
  if (s.startsWith("numeric") || s.startsWith("decimal")) return `numeric${arg}`
  if (s.startsWith("boolean")) return "bool"
  if (s.startsWith("double")) return "float8"
  if (s.startsWith("real")) return "float4"
  if (s.startsWith("jsonb")) return "jsonb"
  if (s.startsWith("json")) return "json"
  if (s.startsWith("uuid")) return "uuid"
  if (s.startsWith("bytea")) return "bytea"
  return s.split(" ")[0]
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function DevEsquemaPage() {
  const [data, setData] = React.useState<SchemaData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [view, setView] = React.useState<"erd" | "list">("erd")
  const [query, setQuery] = React.useState("")
  const [hovered, setHovered] = React.useState<string | null>(null)
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const cardRefs = React.useRef<Record<string, HTMLDivElement | null>>({})
  const [lines, setLines] = React.useState<EdgeLine[]>([])

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

  const tableColor = React.useCallback((name: string) => PALETTE[Math.abs(hash(name)) % PALETTE.length], [])

  const relatedTables = React.useCallback((table: string) => {
    const out = new Set<string>()
    if (!data?.tables) return out
    for (const t of data.tables) {
      if (t.name === table) t.relations.forEach(r => out.add(r.refTable))
      for (const r of t.relations) if (r.refTable === table) out.add(t.name)
    }
    return out
  }, [data])

  const computeLines = React.useCallback(() => {
    if (view !== "erd" || !data?.tables) return
    const wrap = wrapRef.current
    if (!wrap) return
    const wrapRect = wrap.getBoundingClientRect()
    const out: EdgeLine[] = []

    data.tables.forEach(t => {
      const src = cardRefs.current[t.name]
      if (!src) return
      const s = src.getBoundingClientRect()
      const sCx = s.left - wrapRect.left + s.width / 2
      const sCy = s.top - wrapRect.top + s.height / 2

      t.relations.forEach(rel => {
        const dst = cardRefs.current[rel.refTable]
        if (!dst) return
        const d = dst.getBoundingClientRect()
        const dCx = d.left - wrapRect.left + d.width / 2
        const dCy = d.top - wrapRect.top + d.height / 2

        const dx = dCx - sCx
        const dy = dCy - sCy
        const len = Math.max(1, Math.sqrt(dx * dx + dy * dy))
        const nx = dx / len
        const ny = dy / len

        const fromX = sCx + nx * 24
        const fromY = sCy + ny * 24
        const toX = dCx - nx * 24
        const toY = dCy - ny * 24

        const px = -ny
        const py = nx
        const bend = Math.min(56, len * 0.2)
        const c1 = { x: fromX + dx * 0.35 + px * bend, y: fromY + dy * 0.35 + py * bend }
        const c2 = { x: toX - dx * 0.35 + px * bend, y: toY - dy * 0.35 + py * bend }
        const midX = (fromX + 3 * c1.x + 3 * c2.x + toX) / 8
        const midY = (fromY + 3 * c1.y + 3 * c2.y + toY) / 8

        out.push({
          from: { x: fromX, y: fromY },
          to: { x: toX, y: toY },
          c1, c2,
          mid: { x: midX, y: midY },
          color: tableColor(t.name),
          source: t.name,
          target: rel.refTable,
          label: rel.column,
        })
      })
    })

    setLines(out)
  }, [data, view, tableColor])

  React.useEffect(() => {
    if (loading || !data?.tables) return
    const t = setTimeout(computeLines, 120)
    window.addEventListener("resize", computeLines)
    return () => { clearTimeout(t); window.removeEventListener("resize", computeLines) }
  }, [loading, data, computeLines])

  const allTables = data?.tables || []
  const q = query.trim().toLowerCase()
  const tables = q
    ? allTables.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.columns.some(c => c.name.toLowerCase().includes(q)) ||
        t.relations.some(r => r.refTable.toLowerCase().includes(q)))
    : allTables

  const isDimmed = React.useCallback((name: string) => {
    if (!hovered) return false
    if (name === hovered) return false
    return !relatedTables(hovered).has(name)
  }, [hovered, relatedTables])

  const lineActive = React.useCallback((ln: EdgeLine) => {
    if (!hovered) return true
    return ln.source === hovered || ln.target === hovered
  }, [hovered])

  const renderEdge = (ln: EdgeLine, i: number) => {
    const active = lineActive(ln)
    const path = `M ${ln.from.x} ${ln.from.y} C ${ln.c1.x} ${ln.c1.y} ${ln.c2.x} ${ln.c2.y} ${ln.to.x} ${ln.to.y}`
    const showLabel = hovered && active
    const labelW = ln.label.length * 5.2 + 12
    const labelH = 14

    return (
      <g key={`${ln.source}-${ln.target}-${i}`} opacity={active ? 1 : 0.1} style={{ transition: "opacity 0.2s" }}>
        <path
          d={path}
          fill="none"
          stroke={ln.color}
          strokeOpacity={0.4}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
        {(() => {
          const a = Math.atan2(ln.to.y - ln.c2.y, ln.to.x - ln.c2.x)
          const size = 5
          return (
            <path
              d={`M ${ln.to.x} ${ln.to.y} L ${ln.to.x - size * Math.cos(a - 0.42)} ${ln.to.y - size * Math.sin(a - 0.42)} L ${ln.to.x - size * Math.cos(a + 0.42)} ${ln.to.y - size * Math.sin(a + 0.42)} Z`}
              fill={ln.color}
              fillOpacity={0.7}
            />
          )
        })()}
        {showLabel && (
          <g>
            <rect
              x={ln.mid.x - labelW / 2}
              y={ln.mid.y - labelH / 2 - 4}
              width={labelW}
              height={labelH}
              rx={7}
              fill="var(--sb-surface)"
              stroke={ln.color}
              strokeOpacity={0.35}
            />
            <text
              x={ln.mid.x}
              y={ln.mid.y + 0.5 - 4}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={9}
              fill={ln.color}
              style={{ fontFamily: "monospace", fontWeight: 600 }}
            >
              {ln.label}
            </text>
          </g>
        )}
      </g>
    )
  }

  return (
    <div className="w-full space-y-6 py-2 md:py-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] md:text-[24px] font-bold tracking-tight text-sb-on-surface">Esquema de Base de Datos</h2>
          <p className="text-[13px] text-sb-on-surface/70 mt-1">
            Diagrama entidad-relación real del esquema {data?.schema ? `«${data.schema}»` : ""}
            {data?.tableCount ? ` · ${data.tableCount} tablas` : ""} — PK, columnas y relaciones FK
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-sb-surface-container">
            <button
              onClick={() => setView("erd")}
              className={cn("flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-medium transition-colors",
                view === "erd" ? "bg-sb-on-surface text-sb-surface shadow-sm" : "text-sb-on-surface/70 hover:text-sb-on-surface")}
            >
              <Layers className="h-3.5 w-3.5" /> Diagrama
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-medium transition-colors",
                view === "list" ? "bg-sb-on-surface text-sb-surface shadow-sm" : "text-sb-on-surface/70 hover:text-sb-on-surface")}
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
        <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-10 flex items-center justify-center gap-3">
          <RefreshCw className="h-5 w-5 text-sb-on-surface/40 animate-spin" />
          <p className="text-[12.5px] text-sb-on-surface/60">Leyendo el esquema de la base de datos...</p>
        </div>
      )}

      {data && !data.ok && (
        <div className="bg-red-500/5 rounded-2xl border border-red-500/20 p-5 text-[12.5px] text-red-600">
          No se pudo leer el esquema: {data.error}
        </div>
      )}

      {data?.ok && allTables.length > 0 && (
        <>
          {/* Búsqueda */}
          <div className="relative max-w-xs">
            <Search className="h-3.5 w-3.5 text-sb-on-surface/45 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar tabla o columna..."
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-sb-surface-container text-sb-on-surface text-[12.5px] placeholder:text-sb-on-surface/40 outline-none focus:ring-2 ring-sb-primary/20 transition-shadow border border-sb-outline-variant/10 focus:border-sb-primary/30"
            />
            {q && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-sb-on-surface/50 hover:text-sb-on-surface"
              >
                limpiar
              </button>
            )}
          </div>

          {tables.length === 0 ? (
            <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-10 text-center text-[12.5px] text-sb-on-surface/60">
              Sin coincidencias para «{query}».
            </div>
          ) : view === "erd" ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
              ref={wrapRef}
            >
              <svg className="pointer-events-none absolute inset-0 h-full w-full z-0" style={{ overflow: "visible" }}>
                {lines.map((ln, i) => renderEdge(ln, i))}
              </svg>

              <div className="relative z-10 flex flex-wrap gap-4">
                {tables.map(t => {
                  const color = tableColor(t.name)
                  const dimmed = isDimmed(t.name)
                  return (
                    <motion.div
                      key={t.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(tables.indexOf(t) * 0.02, 0.3) }}
                      ref={el => { cardRefs.current[t.name] = el }}
                      onMouseEnter={() => setHovered(t.name)}
                      onMouseLeave={() => setHovered(null)}
                      className={cn(
                        "w-[248px] rounded-xl bg-sb-surface border border-sb-outline-variant/10 overflow-hidden transition-all duration-200",
                        dimmed && "opacity-40 saturate-50",
                        !dimmed && hovered && hovered !== t.name && "shadow-sm"
                      )}
                    >
                      {/* Header */}
                      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-sb-outline-variant/10">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
                        <p className="text-[12.5px] font-semibold text-sb-on-surface truncate font-mono">{t.name}</p>
                        <span className="ml-auto shrink-0 text-[9.5px] font-mono text-sb-on-surface/35">{t.columns.length}</span>
                      </div>
                      {/* Columnas */}
                      <div className="divide-y divide-sb-outline-variant/[0.06]">
                        {t.columns.map(c => {
                          const rel = t.relations.find(r => r.column === c.name)
                          return (
                            <div key={c.name} className="flex items-center gap-2 px-3.5 py-[5px]">
                              {c.primary ? (
                                <Key className="h-2.5 w-2.5 shrink-0 text-amber-500/90" />
                              ) : rel ? (
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
                              ) : (
                                <span className="w-2.5 shrink-0" />
                              )}
                              <span className={cn("text-[11.5px] font-mono flex-1 min-w-0 truncate",
                                c.primary ? "text-sb-on-surface font-semibold" : "text-sb-on-surface/75")}>
                                {c.name}
                              </span>
                              {rel ? (
                                <span className="shrink-0 max-w-[92px] truncate text-[9px] font-mono px-1.5 py-px rounded-full" style={{ color, background: `${color}14` }}>
                                  → {rel.refTable}
                                </span>
                              ) : (
                                <span className="shrink-0 text-[9.5px] font-mono text-sb-on-surface/35">{shortType(c.type)}</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Leyenda */}
              <div className="flex flex-wrap items-center gap-4 mt-5 text-[11px] text-sb-on-surface/60">
                <span className="flex items-center gap-1.5"><Key className="h-3 w-3 text-amber-500/90" /> PK</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-500" /> FK</span>
                <span className="flex items-center gap-1.5">
                  <svg width="18" height="8"><line x1="0" y1="4" x2="13" y2="4" stroke="var(--sb-on-surface-variant)" strokeOpacity="0.5" strokeWidth="1.4" /></svg>
                  <ArrowRight className="h-3 w-3" /> Relación
                </span>
                {hovered && <span className="text-[11px] text-sb-on-surface/40">hover para aislar relaciones</span>}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {tables.map(t => {
                const color = tableColor(t.name)
                return (
                  <motion.div
                    key={t.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-sb-surface rounded-xl border border-sb-outline-variant/10 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-sb-outline-variant/10">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                        <p className="text-[13px] font-semibold text-sb-on-surface font-mono">{t.name}</p>
                        <span className="text-[10px] text-sb-on-surface/50">({t.columns.length} col)</span>
                      </div>
                      {t.relations.length > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-sky-600 bg-sky-500/10 px-2 py-0.5 rounded-full">
                          <Link2Chip /> {t.relations.length} FK
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
                        <tbody className="divide-y divide-sb-outline-variant/[0.06]">
                          {t.columns.map(c => {
                            const rel = t.relations.find(r => r.column === c.name)
                            return (
                              <tr key={c.name} className="hover:bg-sb-surface-container-low/50 transition-colors">
                                <td className="px-4 py-2 font-mono text-sb-on-surface/80">{c.name}</td>
                                <td className="px-3 py-2 font-mono text-[11px] text-sb-on-surface/60">{shortType(c.type)}</td>
                                <td className="px-3 py-2">{c.primary ? <Key className="h-3.5 w-3.5 text-amber-500/90" /> : "—"}</td>
                                <td className="px-3 py-2 text-sb-on-surface/60">{c.nullable ? "Sí" : "No"}</td>
                                <td className="px-4 py-2 font-mono text-[11px]" style={{ color: rel ? tableColor(t.name) : "transparent" }}>
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
        </>
      )}

      {data?.ok && allTables.length === 0 && (
        <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-10 text-center text-[12.5px] text-sb-on-surface/60">
          No hay tablas en el esquema.
        </div>
      )}
    </div>
  )
}

function Link2Chip() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-600">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

// hash simple para asignar color por nombre de tabla
function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}