"use client"

import * as React from "react"
import { Terminal, Play, Clock, CheckCircle, XCircle, Copy, Database } from "@/components/ui/proicons"
import { motion } from "framer-motion"

interface QueryResult {
  columns: string[]
  rows: any[]
  affectedRows?: number
  error?: string
  duration: number
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function DevDatabasePage() {
  const [query, setQuery] = React.useState("SELECT * FROM institutions LIMIT 10")
  const [result, setResult] = React.useState<QueryResult | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [history, setHistory] = React.useState<{ query: string; time: string; success: boolean }[]>([])

  const presetQueries = [
    { label: "Ver tablas", query: "SHOW TABLES" },
    { label: "Instituciones", query: "SELECT * FROM institutions" },
    { label: "Usuarios", query: "SELECT id, email, full_name, role FROM users" },
    { label: "Estudiantes", query: "SELECT * FROM students LIMIT 20" },
    { label: "Estructura users", query: "DESCRIBE users" },
    { label: "Conteo por tabla", query: `SELECT 'institutions' as tabla, COUNT(*) as total FROM institutions UNION ALL SELECT 'users', COUNT(*) FROM users UNION ALL SELECT 'students', COUNT(*) FROM students UNION ALL SELECT 'courses', COUNT(*) FROM courses` },
  ]

  const executeQuery = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/dev/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })
      const data = await res.json()
      setResult(data)
      setHistory(prev => [
        { query: query.slice(0, 80), time: new Date().toLocaleTimeString("es-PE"), success: !data.error },
        ...prev.slice(0, 9),
      ])
    } catch (e: any) {
      setResult({ columns: [], rows: [], error: e.message, duration: 0 })
    } finally {
      setLoading(false)
    }
  }

  const copyQuery = (text: string) => { navigator.clipboard.writeText(text) }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full space-y-6 py-2">
      <motion.div variants={fadeUp}>
        <h2 className="text-[26px] font-bold tracking-tight text-sb-on-surface">Base de Datos</h2>
        <p className="text-[14px] text-sb-on-surface/60 mt-1">Ejecuta consultas SQL directamente</p>
      </motion.div>

      {/* SQL Console */}
      <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Terminal className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-[14px] font-medium text-sb-on-surface/80">SQL Console</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10">
            <Database className="h-3 w-3 text-emerald-600" />
            <span className="text-[11px] font-mono text-emerald-600">educonecta</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {presetQueries.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setQuery(preset.query)}
                className="px-3 py-1.5 rounded-lg bg-sb-surface-container-high text-[12px] font-mono text-sb-on-surface/60 hover:text-sb-on-surface hover:bg-sb-on-surface/5 transition-colors border border-sb-outline-variant/10"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-36 p-4 rounded-xl bg-sb-surface-container-high border border-sb-outline-variant/10 font-mono text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-sb-primary/20 text-sb-on-surface placeholder:text-sb-on-surface/30 transition-all"
              placeholder="Escribe tu consulta SQL aquí..."
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) executeQuery() }}
            />
            <div className="absolute bottom-3 right-3 flex gap-2">
              <button
                onClick={executeQuery}
                disabled={loading || !query.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sb-on-surface text-white text-[13px] font-medium hover:bg-sb-on-surface/90 transition-all disabled:opacity-50 shadow-lg shadow-sb-on-surface/10"
              >
                {loading ? <Clock className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                Ejecutar
              </button>
            </div>
          </div>

          <p className="text-[12px] text-sb-on-surface/40">
            Presiona <kbd className="px-1.5 py-0.5 rounded bg-sb-surface-container-high text-[11px] font-mono">Ctrl+Enter</kbd> para ejecutar
          </p>
        </div>
      </motion.div>

      {/* Result */}
      {result && (
        <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              {result.error ? (
                <>
                  <div className="h-9 w-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <XCircle className="h-4 w-4 text-red-500" />
                  </div>
                  <p className="text-[14px] font-medium text-red-500">Error</p>
                </>
              ) : (
                <>
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="text-[14px] font-medium text-emerald-600">Resultado</p>
                </>
              )}
            </div>
            <span className="text-[12px] text-sb-on-surface/40 font-mono">{result.duration}ms</span>
          </div>

          {result.error ? (
            <pre className="p-4 rounded-xl bg-red-500/5 text-red-500 text-[13px] font-mono whitespace-pre-wrap border border-red-500/10">{result.error}</pre>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-sb-outline-variant/15">
                      {result.columns.map((col) => (
                        <th key={col} className="text-left py-2.5 px-3 text-[11px] font-semibold text-sb-on-surface/50 uppercase tracking-wider">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sb-outline-variant/8">
                    {result.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-sb-surface-container-low/30 transition-colors">
                        {result.columns.map((col) => (
                          <td key={col} className="py-2.5 px-3 font-mono text-[12px] text-sb-on-surface/70">
                            {row[col] === null ? (
                              <span className="text-sb-on-surface/30 italic">NULL</span>
                            ) : typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-2">
                {result.rows.map((row, i) => (
                  <div key={i} className="rounded-xl bg-sb-surface-container-high/50 p-3 space-y-1.5">
                    {result.columns.map((col) => (
                      <div key={col} className="flex items-start gap-2 text-[12px]">
                        <span className="font-mono text-sb-on-surface/40 shrink-0 min-w-[80px]">{col}</span>
                        <span className="font-mono text-sb-on-surface/70 break-all">
                          {row[col] === null ? (
                            <span className="text-sb-on-surface/30 italic">NULL</span>
                          ) : typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {result.rows.length === 0 && <p className="text-center text-sb-on-surface/30 py-8 text-[13px]">Sin resultados</p>}
            </>
          )}
        </motion.div>
      )}

      {/* History */}
      {history.length > 0 && (
        <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-5">
          <p className="text-[14px] font-medium text-sb-on-surface/80 mb-4">Historial</p>
          <div className="space-y-1.5">
            {history.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-sb-surface-container-high/50 group transition-colors">
                {item.success ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                <code className="text-[12px] font-mono text-sb-on-surface/50 flex-1 truncate">{item.query}</code>
                <span className="text-[11px] text-sb-on-surface/30 font-mono shrink-0">{item.time}</span>
                <button
                  onClick={() => copyQuery(item.query)}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-sb-on-surface/5 transition-all shrink-0"
                >
                  <Copy className="h-3 w-3 text-sb-on-surface/40" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
