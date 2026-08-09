"use client"

import * as React from "react"
import { FileText, Download, BarChart3, Users, GraduationCap, Calendar, BookOpen, UserCheck, Building2, Search, Printer, FileSpreadsheet, Loader2, ArrowUpDown, CheckCircle2, Clock, Hash } from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { SbSectionHeader, SbBtn, SbBadge } from "@/components/ui/sb"

type ReportType = "resumen" | "staff" | "alumnos" | "matricula" | "reuniones" | "documentos"

interface ReportConfig {
  type: ReportType
  label: string
  icon: React.ElementType
  desc: string
  color: string
}

const reportTypes: ReportConfig[] = [
  { type: "resumen", label: "Resumen general", icon: BarChart3, desc: "Estadísticas globales de la institución", color: "bg-blue-500/10 text-blue-500" },
  { type: "staff", label: "Personal", icon: Users, desc: "Docentes, secretarios y directivos activos", color: "bg-purple-500/10 text-purple-500" },
  { type: "alumnos", label: "Alumnos", icon: GraduationCap, desc: "Matrícula por grado, sección y género", color: "bg-emerald-500/10 text-emerald-500" },
  { type: "matricula", label: "Matrícula", icon: BookOpen, desc: "Historial de matrículas por periodo", color: "bg-amber-500/10 text-amber-500" },
  { type: "reuniones", label: "Reuniones", icon: Calendar, desc: "Historial de reuniones agendadas", color: "bg-pink-500/10 text-pink-500" },
  { type: "documentos", label: "Documentos", icon: FileText, desc: "Documentos generados por tipo y estado", color: "bg-cyan-500/10 text-cyan-500" },
]

const periodPresets = [
  { label: "Todo", days: 0 },
  { label: "7 días", days: 7 },
  { label: "30 días", days: 30 },
  { label: "90 días", days: 90 },
  { label: "Este año", days: 365 },
]

function todayISO(): string { return new Date().toISOString().split("T")[0] }
function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split("T")[0]
}

const roleLabels: Record<string, string> = {
  director: "Director", secretario: "Secretario", docente: "Docente", padre: "Apoderado",
}
const statusLabels: Record<string, string> = { active: "Activo", inactive: "Inactivo", pending: "Pendiente" }

export default function ReportesPage() {
  const [activeType, setActiveType] = React.useState<ReportType | null>(null)
  const [reportData, setReportData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [periodPreset, setPeriodPreset] = React.useState(0)
  const [fromDate, setFromDate] = React.useState("")
  const [toDate, setToDate] = React.useState(todayISO())
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchFocused, setSearchFocused] = React.useState(false)

  const fetchReport = async (type: ReportType) => {
    setActiveType(type)
    setLoading(true)
    setError("")
    setSearchQuery("")

    const params = new URLSearchParams({ type })
    if (fromDate) params.set("from", fromDate)
    if (toDate) params.set("to", toDate)

    try {
      const res = await fetch(`/api/director/reportes?${params}`)
      if (!res.ok) { setError("Error al generar el reporte"); setLoading(false); return }
      const data = await res.json()
      setReportData(data)
    } catch {
      setError("Error de conexión")
    }
    finally { setLoading(false) }
  }

  const applyPreset = (days: number) => {
    setPeriodPreset(days)
    if (days === 0) { setFromDate(""); setToDate("") }
    else { setFromDate(daysAgoISO(days)); setToDate(todayISO()) }
  }

  const handleDownloadCSV = () => {
    if (!reportData?.data) return
    const items = Array.isArray(reportData.data) ? reportData.data : reportData.data.students || reportData.data.docs || []
    if (!items.length) return

    const headers = Object.keys(items[0])
    const csv = [
      headers.join(","),
      ...items.map((row: any) => headers.map(h => `"${String(row[h] || "").replace(/"/g, '""')}"`).join(",")),
    ].join("\n")

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `${reportData.title.replace(/\s+/g, "_")}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    const printContent = document.getElementById("report-content")
    if (!printContent) return
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`
      <html><head><title>${reportData?.title || "Reporte"}</title>
      <style>
        body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a1a1a; }
        h1 { font-size: 24px; margin-bottom: 4px; }
        .meta { font-size: 12px; color: #666; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { text-align: left; padding: 8px 10px; background: #f5f5f5; border-bottom: 2px solid #ddd; font-weight: 600; }
        td { padding: 7px 10px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) td { background: #fafafa; }
        .footer { margin-top: 24px; font-size: 11px; color: #999; text-align: center; }
        .summary { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
        .summary-item { background: #f5f5f5; padding: 12px 20px; border-radius: 8px; }
        .summary-item .num { font-size: 24px; font-weight: 700; }
        .summary-item .lbl { font-size: 11px; color: #666; }
      </style></head><body>
      <h1>${reportData?.title || "Reporte"}</h1>
      <p class="meta">Generado el ${new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
      ${printContent.innerHTML}
      <p class="footer">EduNexus — Reporte generado automáticamente</p>
      </body></html>
    `)
    win.document.close()
    setTimeout(() => { win.print() }, 300)
  }

  const items = (() => {
    if (!reportData?.data) return []
    if (Array.isArray(reportData.data)) return reportData.data
    if (reportData.data.students) return reportData.data.students
    if (reportData.data.docs) return reportData.data.docs
    if (reportData.data.byGrade) return []
    return []
  })()

  const filteredItems = searchQuery
    ? items.filter((item: any) =>
        Object.values(item).some(v => String(v || "").toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : items

  const activeConfig = reportTypes.find(r => r.type === activeType)

  return (
    <div className="space-y-5">
      <SbSectionHeader title="Reportes" description="Genera reportes detallados de la institución" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {reportTypes.map(r => {
          const Icon = r.icon
          const isActive = activeType === r.type
          return (
            <button key={r.type} onClick={() => fetchReport(r.type)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all",
                isActive
                  ? "bg-sb-on-surface text-sb-surface"
                  : "bg-sb-surface text-sb-on-surface-variant hover:bg-sb-surface-container-high/80 border border-sb-outline-variant/8"
              )}>
              <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", isActive ? "bg-sb-primary/10" : r.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-medium leading-tight">{r.label}</span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-sb-surface rounded-lg p-1 border border-sb-outline-variant/8">
          {periodPresets.map(p => (
            <button key={p.days} onClick={() => applyPreset(p.days)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                periodPreset === p.days
                  ? "bg-sb-on-surface text-sb-surface"
                  : "text-sb-on-surface-variant/60 hover:text-sb-on-surface/80"
              )}>{p.label}</button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPeriodPreset(-1) }}
            className="sb-input" style={{ width: 130, padding: "6px 10px", fontSize: 11 }} />
          <span className="text-sb-on-surface-variant/30">—</span>
          <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPeriodPreset(-1) }}
            className="sb-input" style={{ width: 130, padding: "6px 10px", fontSize: 11 }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!activeType && !loading && (
          <motion.div key="empty" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="py-16">
            <div className="max-w-lg mx-auto">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-sb-on-surface flex items-center justify-center shrink-0">
                  <BarChart3 className="h-7 w-7 text-sb-surface" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-sb-on-surface">Reportes institucionales</h2>
                  <p className="text-sm text-sb-on-surface-variant/50">Obtén estadísticas detalladas de tu institución</p>
                </div>
              </div>

              <div className="bg-sb-surface rounded-xl border border-sb-outline-variant/8 divide-y divide-sb-outline-variant/8">
                {[
                  { icon: Clock, title: "Filtra por período", desc: "Selecciona un rango de fechas o usa los presets rápidos (7 días, 30 días, este año)" },
                  { icon: Download, title: "Exporta a CSV", desc: "Descarga los datos en formato CSV para abrir en Excel o Google Sheets" },
                  { icon: Printer, title: "Imprime o comparte", desc: "Genera una vista limpia para imprimir o enviar por correo electrónico" },
                ].map((f, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                    className="flex items-start gap-4 px-5 py-4">
                    <div className="h-9 w-9 rounded-lg bg-sb-surface-container-high flex items-center justify-center shrink-0 mt-0.5">
                      <f.icon className="h-4 w-4 text-sb-on-surface-variant/50" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-sb-on-surface">{f.title}</p>
                      <p className="text-xs text-sb-on-surface-variant/40 mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <p className="text-center text-xs text-sb-on-surface-variant/30 mt-6">
                Selecciona un tipo de reporte arriba para comenzar
              </p>
            </div>
          </motion.div>
        )}

        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
            <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-sb-on-surface-variant/30" />
            <p className="text-sm text-sb-on-surface-variant/40">Generando reporte...</p>
          </motion.div>
        )}

        {error && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-red-500/10 rounded-xl p-5 text-center text-sm text-red-400">{error}</motion.div>
        )}

        {activeType && reportData && !loading && !error && (
          <motion.div key="report" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-sb-on-surface">{reportData.title}</h3>
                <p className="text-xs text-sb-on-surface-variant/40 mt-0.5">
                  {fromDate ? `${new Date(fromDate).toLocaleDateString("es-PE")} — ${new Date(toDate).toLocaleDateString("es-PE")}` : "Todo el historial"}
                  {" · "}{items.length} registro(s)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sb-on-surface-variant/30" />
                  <input placeholder="Buscar en reporte..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    className={cn(
                      "sb-input pl-9 pr-3 py-2 text-xs",
                      searchFocused ? "ring-1 ring-sb-primary/10" : ""
                    )}
                    style={{ width: 180 }} />
                </div>
                <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-sb-surface-container-high text-sb-on-surface-variant/60 hover:text-sb-on-surface/80 transition-all">
                  <Printer className="h-3.5 w-3.5" /> Imprimir
                </button>
                <button onClick={handleDownloadCSV} disabled={!items.length} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-sb-surface-container-high text-sb-on-surface-variant/60 hover:text-sb-on-surface/80 transition-all disabled:opacity-40">
                  <FileSpreadsheet className="h-3.5 w-3.5" /> CSV
                </button>
              </div>
            </div>

            {activeType === "resumen" && <ResumenReport data={reportData.data} />}
            {activeType === "alumnos" && <AlumnosSummary data={reportData.data} />}
            {activeType === "documentos" && <DocumentosSummary data={reportData.data} />}

            <div id="report-content">
              {activeType === "staff" && <StaffTable data={filteredItems as any[]} />}
              {activeType === "alumnos" && <AlumnosTable data={filteredItems as any[]} />}
              {activeType === "matricula" && <MatriculaTable data={filteredItems as any[]} />}
              {activeType === "reuniones" && <ReunionesTable data={filteredItems as any[]} />}
              {activeType === "documentos" && <DocumentosTable data={filteredItems as any[]} />}
              {activeType === "resumen" && items.length > 0 && <ResumenTable data={reportData.data} />}
            </div>

            {filteredItems.length === 0 && items.length > 0 && (
              <div className="text-center py-12 text-sm text-sb-on-surface-variant/30">Sin resultados para &ldquo;{searchQuery}&rdquo;</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Resumen ─── */

function ResumenReport({ data }: { data: any }) {
  const cards = [
    { label: "Alumnos", value: data.students || 0, icon: GraduationCap, color: "bg-emerald-500/10 text-emerald-500" },
    { label: "Docentes", value: data.teachers || 0, icon: Users, color: "bg-purple-500/10 text-purple-500" },
    { label: "Secretarios", value: data.secretary || 0, icon: Building2, color: "bg-blue-500/10 text-blue-500" },
    { label: "Apoderados", value: data.parents || 0, icon: UserCheck, color: "bg-amber-500/10 text-amber-500" },
    { label: "Matrículas", value: data.enrollments || 0, icon: BookOpen, color: "bg-pink-500/10 text-pink-500" },
    { label: "Documentos", value: data.documents || 0, icon: FileText, color: "bg-cyan-500/10 text-cyan-500" },
    { label: "Reuniones", value: data.meetings || 0, icon: Calendar, color: "bg-orange-500/10 text-orange-500" },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
      {cards.map(c => {
        const Icon = c.icon
        return (
          <div key={c.label} className="bg-sb-surface rounded-xl p-4 text-center border border-sb-outline-variant/8">
            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center mx-auto mb-2", c.color)}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold text-sb-on-surface/80">{c.value}</p>
            <p className="text-[10px] text-sb-on-surface-variant/40 mt-0.5">{c.label}</p>
          </div>
        )
      })}
    </div>
  )
}

function ResumenTable({ data }: { data: any }) {
  if (!data.byGrade || !data.byGrade.length) return null
  return (
    <div className="bg-sb-surface rounded-xl p-4 space-y-3 border border-sb-outline-variant/8">
      <p className="text-xs font-semibold text-sb-on-surface/60 uppercase tracking-wider">Alumnos por grado</p>
      <div className="space-y-1.5">
        {data.byGrade.map((g: any) => {
          const max = Math.max(...data.byGrade.map((x: any) => x.count))
          const pct = max > 0 ? (g.count / max) * 100 : 0
          return (
            <div key={g.grade} className="flex items-center gap-3">
              <span className="text-xs text-sb-on-surface-variant/60 w-32 shrink-0">{g.grade}</span>
              <div className="flex-1 h-5 rounded-lg bg-sb-surface-container-high overflow-hidden">
                <div className="h-full rounded-lg bg-sb-primary/30" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs font-medium text-sb-on-surface/60 w-8 text-right">{g.count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Staff ─── */

function StaffTable({ data }: { data: any[] }) {
  const [sortKey, setSortKey] = React.useState<string>("role")
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc")
  const sorted = [...data].sort((a, b) => {
    const va = (a[sortKey] || "").toString().toLowerCase()
    const vb = (b[sortKey] || "").toString().toLowerCase()
    return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va)
  })

  const toggleSort = (k: string) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(k); setSortDir("asc") }
  }

  return (
    <TableWrapper>
      <Thead>
        <Th sortable onClick={() => toggleSort("full_name")} active={sortKey === "full_name"} dir={sortDir}>Nombre</Th>
        <Th sortable onClick={() => toggleSort("role")} active={sortKey === "role"} dir={sortDir}>Rol</Th>
        <Th sortable onClick={() => toggleSort("subject")} active={sortKey === "subject"} dir={sortDir}>Asignatura</Th>
        <Th sortable onClick={() => toggleSort("contract_type")} active={sortKey === "contract_type"} dir={sortDir}>Contrato</Th>
        <Th sortable onClick={() => toggleSort("status")} active={sortKey === "status"} dir={sortDir}>Estado</Th>
      </Thead>
      <Tbody>
        {sorted.map((s, i) => (
          <Tr key={i}>
            <Td>
              <p className="text-sm font-medium text-sb-on-surface/80">{s.full_name}</p>
              <p className="text-[11px] text-sb-on-surface-variant/40">{s.email}</p>
            </Td>
            <Td><Badge>{roleLabels[s.role] || s.role}</Badge></Td>
            <Td><span className="text-sm text-sb-on-surface-variant/60">{s.subject || "—"}</span></Td>
            <Td><span className="text-sm text-sb-on-surface-variant/60 capitalize">{(s.contract_type || "—").trim()}</span></Td>
            <Td><StatusBadge status={s.status} /></Td>
          </Tr>
        ))}
      </Tbody>
    </TableWrapper>
  )
}

/* ─── Alumnos ─── */

function AlumnosSummary({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {(data.byGrade || []).map((g: any) => (
        <div key={g.grade} className="bg-sb-surface rounded-xl p-4 text-center border border-sb-outline-variant/8">
          <p className="text-xl font-bold text-sb-on-surface/80">{g.count}</p>
          <p className="text-[10px] text-sb-on-surface-variant/40 mt-0.5">{g.grade}</p>
        </div>
      ))}
      {(data.byGender || []).map((g: any) => (
        <div key={g.gender} className="bg-sb-surface rounded-xl p-4 text-center border border-sb-outline-variant/8">
          <p className="text-xl font-bold text-sb-on-surface/80">{g.count}</p>
          <p className="text-[10px] text-sb-on-surface-variant/40 mt-0.5 capitalize">{g.gender === "M" ? "Masculino" : g.gender === "F" ? "Femenino" : g.gender || "Sin especificar"}</p>
        </div>
      ))}
    </div>
  )
}

function AlumnosTable({ data }: { data: any[] }) {
  const [sortKey, setSortKey] = React.useState<string>("grade")
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc")
  const sorted = [...data].sort((a, b) => {
    const va = (a[sortKey] || "").toString().toLowerCase()
    const vb = (b[sortKey] || "").toString().toLowerCase()
    return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va)
  })

  const toggleSort = (k: string) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(k); setSortDir("asc") }
  }

  return (
    <TableWrapper>
      <Thead>
        <Th sortable onClick={() => toggleSort("full_name")} active={sortKey === "full_name"} dir={sortDir}>Nombre</Th>
        <Th sortable onClick={() => toggleSort("document_number")} active={sortKey === "document_number"} dir={sortDir}>DNI</Th>
        <Th sortable onClick={() => toggleSort("grade")} active={sortKey === "grade"} dir={sortDir}>Grado</Th>
        <Th sortable onClick={() => toggleSort("section")} active={sortKey === "section"} dir={sortDir}>Sección</Th>
        <Th sortable onClick={() => toggleSort("gender")} active={sortKey === "gender"} dir={sortDir}>Género</Th>
        <Th sortable onClick={() => toggleSort("status")} active={sortKey === "status"} dir={sortDir}>Estado</Th>
      </Thead>
      <Tbody>
        {sorted.map((s, i) => (
          <Tr key={i}>
            <Td><span className="text-sm font-medium text-sb-on-surface/80">{s.full_name}</span></Td>
            <Td><span className="text-sm text-sb-on-surface-variant/60">{s.document_number || "—"}</span></Td>
            <Td><Badge>{s.grade || "—"}</Badge></Td>
            <Td><span className="text-sm text-sb-on-surface-variant/60">{s.section || "—"}</span></Td>
            <Td><span className="text-sm text-sb-on-surface-variant/60 capitalize">{s.gender === "M" ? "M" : s.gender === "F" ? "F" : "—"}</span></Td>
            <Td><StatusBadge status={s.status} /></Td>
          </Tr>
        ))}
      </Tbody>
    </TableWrapper>
  )
}

/* ─── Matrícula ─── */

function MatriculaTable({ data }: { data: any[] }) {
  const [sortKey, setSortKey] = React.useState<string>("created_at")
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc")
  const sorted = [...data].sort((a, b) => {
    const va = (a[sortKey] || "").toString().toLowerCase()
    const vb = (b[sortKey] || "").toString().toLowerCase()
    return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va)
  })
  const toggleSort = (k: string) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(k); setSortDir("desc") }
  }

  return (
    <TableWrapper>
      <Thead>
        <Th sortable onClick={() => toggleSort("student_name")} active={sortKey === "student_name"} dir={sortDir}>Alumno</Th>
        <Th sortable onClick={() => toggleSort("document_number")} active={sortKey === "document_number"} dir={sortDir}>DNI</Th>
        <Th sortable onClick={() => toggleSort("grade")} active={sortKey === "grade"} dir={sortDir}>Grado</Th>
        <Th sortable onClick={() => toggleSort("section")} active={sortKey === "section"} dir={sortDir}>Sección</Th>
        <Th sortable onClick={() => toggleSort("year")} active={sortKey === "year"} dir={sortDir}>Año</Th>
        <Th sortable onClick={() => toggleSort("status")} active={sortKey === "status"} dir={sortDir}>Estado</Th>
        <Th sortable onClick={() => toggleSort("created_at")} active={sortKey === "created_at"} dir={sortDir}>Fecha</Th>
      </Thead>
      <Tbody>
        {sorted.map((e, i) => (
          <Tr key={i}>
            <Td><span className="text-sm font-medium text-sb-on-surface/80">{e.student_name}</span></Td>
            <Td><span className="text-sm text-sb-on-surface-variant/60">{e.document_number || "—"}</span></Td>
            <Td><Badge>{e.grade}</Badge></Td>
            <Td><span className="text-sm text-sb-on-surface-variant/60">{e.section}</span></Td>
            <Td><span className="text-sm text-sb-on-surface-variant/60">{e.year || "—"}</span></Td>
            <Td><StatusBadge status={e.status} /></Td>
            <Td><span className="text-sm text-sb-on-surface-variant/40">{new Date(e.created_at).toLocaleDateString("es-PE")}</span></Td>
          </Tr>
        ))}
      </Tbody>
    </TableWrapper>
  )
}

/* ─── Reuniones ─── */

function ReunionesTable({ data }: { data: any[] }) {
  const targetLabels: Record<string, string> = { all: "Todos", docente: "Docentes", padre: "Apoderados", secretario: "Secretaría" }
  return (
    <TableWrapper>
      <Thead>
        <Th>Título</Th>
        <Th>Dirigido a</Th>
        <Th>Fecha</Th>
        <Th>Hora</Th>
        <Th>Estado</Th>
      </Thead>
      <Tbody>
        {data.map((r, i) => (
          <Tr key={i}>
            <Td><span className="text-sm font-medium text-sb-on-surface/80">{r.title}</span></Td>
            <Td><Badge>{targetLabels[r.target_role] || "Todos"}</Badge></Td>
            <Td><span className="text-sm text-sb-on-surface-variant/60">{new Date(r.meeting_date).toLocaleDateString("es-PE")}</span></Td>
            <Td><span className="text-sm text-sb-on-surface-variant/60">{r.meeting_time ? r.meeting_time.slice(0, 5) : "—"}</span></Td>
            <Td><StatusBadge status={new Date(r.meeting_date) >= new Date() ? "active" : "inactive"} /></Td>
          </Tr>
        ))}
      </Tbody>
    </TableWrapper>
  )
}

/* ─── Documentos ─── */

function DocumentosSummary({ data }: { data: any }) {
  if (!data.byType || !data.byType.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {data.byType.map((t: any) => (
        <div key={t.type} className="bg-sb-surface rounded-xl px-4 py-3 text-center min-w-[100px] border border-sb-outline-variant/8">
          <p className="text-lg font-bold text-sb-on-surface/80">{t.count}</p>
          <p className="text-[10px] text-sb-on-surface-variant/40 mt-0.5 capitalize">{t.type}</p>
        </div>
      ))}
    </div>
  )
}

function DocumentosTable({ data }: { data: any[] }) {
  const typeLabels: Record<string, string> = { certificate: "Certificado", report: "Reporte", enrollment: "Matrícula", other: "Otro" }
  return (
    <TableWrapper>
      <Thead>
        <Th>Tipo</Th>
        <Th>Estudiante</Th>
        <Th>Estado</Th>
        <Th>Fecha</Th>
      </Thead>
      <Tbody>
        {data.map((d, i) => (
          <Tr key={i}>
            <Td><Badge>{typeLabels[d.type] || d.type}</Badge></Td>
            <Td><span className="text-sm text-sb-on-surface/80">{d.student_name || "—"}</span></Td>
            <Td><StatusBadge status={d.status} /></Td>
            <Td><span className="text-sm text-sb-on-surface-variant/40">{new Date(d.created_at).toLocaleDateString("es-PE")}</span></Td>
          </Tr>
        ))}
      </Tbody>
    </TableWrapper>
  )
}

/* ─── Table primitives ─── */

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-sb-surface rounded-xl overflow-hidden border border-sb-outline-variant/8">
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          {children}
        </table>
      </div>
      <style>{`
        @media print {
          .sb-input, .sb-btn { display: none !important; }
        }
      `}</style>
    </div>
  )
}

function Thead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-sb-outline-variant/20">{children}</tr>
    </thead>
  )
}

function Th({ children, sortable, onClick, active, dir }: {
  children: React.ReactNode; sortable?: boolean; onClick?: () => void; active?: boolean; dir?: string
}) {
  return (
    <th onClick={onClick}
      className={cn(
        "text-left text-[10px] uppercase tracking-wider text-sb-on-surface-variant/40 font-medium px-4 py-3",
        sortable && "cursor-pointer hover:text-sb-on-surface/60 select-none"
      )}>
      <span className="inline-flex items-center gap-1">
        {children}
        {sortable && active && (
          <ArrowUpDown className={cn("h-3 w-3 transition-transform", dir === "desc" && "rotate-180")} />
        )}
      </span>
    </th>
  )
}

function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>
}

function Tr({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-sb-outline-variant/10 last:border-0 hover:bg-sb-surface-container-high/30 transition-colors">{children}</tr>
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3">{children}</td>
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-block px-2.5 py-1 rounded-lg bg-sb-surface-container-high text-sb-on-surface-variant/60 text-[11px] font-medium">{children}</span>
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active"
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium",
      isActive ? "bg-emerald-400/10 text-emerald-400/80" : "bg-sb-surface-container-high text-sb-on-surface-variant/40"
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-emerald-400" : "bg-sb-on-surface/20")} />
      {isActive ? "Activo" : status === "inactive" ? "Inactivo" : statusLabels[status] || status}
    </span>
  )
}
