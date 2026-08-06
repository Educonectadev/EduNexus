"use client"

import * as React from "react"
import { Clock, Plus, Trash2, Edit3, Calendar, MapPin, Users, BookOpen, AlertTriangle, GraduationCap, Upload, Download, AlertCircle, CheckCircle, Table, Coffee } from "@/components/ui/proicons"
import { motion } from "framer-motion"
import { SbSectionHeader, SbModal, SbModalHeader, SbModalBody, SbModalFooter, SbBtn, SbInput, SbBadge } from "@/components/ui/sb"

interface Horario {
  id: string; course_id: string; day_of_week: number; start_time: string; end_time: string
  classroom: string; status: string; course_name: string; grade: string; section: string; teacher_name: string; teacher_id: string
}

interface Course {
  id: string; name: string; code: string; grade: string; section: string; teacher_name: string
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

type HorarioTipo = 'alumnos' | 'docentes'
type HorarioColumnKey = 'teacher' | 'course' | 'day' | 'start' | 'end' | 'classroom'
const HORARIO_COLUMN_LABELS: Record<HorarioColumnKey, string> = {
  teacher: 'Docente', course: 'Curso (código)', day: 'Día', start: 'Hora inicio', end: 'Hora fin', classroom: 'Salón/Aula',
}
const HORARIO_COLUMN_KEYS: Record<HorarioTipo, HorarioColumnKey[]> = {
  alumnos: ['course', 'day', 'start', 'end', 'classroom'],
  docentes: ['teacher', 'course', 'day', 'start', 'end', 'classroom'],
}

const HORARIO_DOCENTES_SAMPLE: string[][] = [
  ['Juan Carlos Pérez López', 'MAT-5A', 'Lunes', '06:20', '08:20', 'Aula 201'],
  ['María Ana García Torres', 'COM-5A', 'Lunes', '08:35', '10:35', 'Aula 102'],
  ['Carlos Eduardo Mendoza Ruiz', 'CYT-5B', 'Lunes', '10:50', '12:50', 'Lab. Física'],
]

function parseCsv(text: string): string[][] {
  const lines = text.split('\n')
  return lines
    .map((line) => {
      const cells: string[] = []
      let current = ''
      let inQuotes = false
      for (const ch of line) {
        if (ch === '"') inQuotes = !inQuotes
        else if (ch === ',' && !inQuotes) { cells.push(current.trim()); current = '' }
        else current += ch
      }
      cells.push(current.trim())
      return cells
    })
    .filter((row) => row.some((cell) => cell.length > 0))
}

function buildHorarioSampleCsv(tipo: HorarioTipo): string {
  const week = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
  if (tipo === 'docentes') {
    const header = ['Docente', 'Curso', 'Día', 'Hora Inicio', 'Hora Fin', 'Salón'].join(',')
    const rows: string[][] = []
    week.forEach((d) => {
      HORARIO_DOCENTES_SAMPLE.forEach(([docente, curso]) => rows.push([docente, curso, d, '06:20', '08:20', 'Aula 201']))
    })
    return [header, ...rows.map((r) => r.join(','))].join('\n')
  }
  const header = ['Curso', 'Día', 'Hora Inicio', 'Hora Fin', 'Salón'].join(',')
  const rows: string[][] = []
  week.forEach((d) => {
    rows.push(['MAT-5A', d, '06:20', '08:20', 'Aula 201'])
    rows.push(['COM-5A', d, '08:35', '10:35', 'Aula 102'])
    rows.push(['CYT-5B', d, '10:50', '12:50', 'Lab. Física'])
  })
  return [header, ...rows.map((r) => r.join(','))].join('\n')
}

function autoMapColumns(header: string[], tipo: HorarioTipo): Record<HorarioColumnKey, number | null> {
  const map: Record<HorarioColumnKey, number | null> = { teacher: null, course: null, day: null, start: null, end: null, classroom: null }
  header.forEach((col, i) => {
    const c = col.trim().toLowerCase()
    if (tipo === 'docentes' && (c.includes('docente') || c.includes('profesor') || c.includes('doc') || c.includes('teacher'))) map.teacher ??= i
    else if (c.includes('curso') || c.includes('código') || c.includes('codigo') || c === 'code') map.course ??= i
    else if (c.includes('día') || c.includes('dia') || c === 'day') map.day ??= i
    else if (c.includes('inicio') || c.includes('desde') || c === 'start') map.start ??= i
    else if (c.includes('fin') || c.includes('hasta') || c === 'end') map.end ??= i
    else if (c.includes('salón') || c.includes('salon') || c.includes('aula')) map.classroom ??= i
  })
  return map
}

function HorarioImportModal({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: () => void }) {
  const [tipo, setTipo] = React.useState<HorarioTipo>('alumnos')
  const [file, setFile] = React.useState<File | null>(null)
  const [rows, setRows] = React.useState<string[][]>([])
  const [header, setHeader] = React.useState<string[]>([])
  const [mapping, setMapping] = React.useState<Record<HorarioColumnKey, number | null>>({ teacher: null, course: null, day: null, start: null, end: null, classroom: null })
  const [dragOver, setDragOver] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<{ created: number; errors: string[] } | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const keys = HORARIO_COLUMN_KEYS[tipo]

  const processFile = (f: File) => {
    setFile(f); setResult(null); setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsed = parseCsv(text)
      if (parsed.length < 2) { setError('El archivo CSV debe tener una fila de encabezado y al menos una fila de datos.'); return }
      const [h, ...data] = parsed
      setHeader(h); setRows(data); setMapping(autoMapColumns(h, tipo))
    }
    reader.onerror = () => setError('Error al leer el archivo.')
    reader.readAsText(f)
  }

  const switchTipo = (t: HorarioTipo) => {
    if (t === tipo) return
    setTipo(t); setFile(null); setRows([]); setHeader([]); setResult(null); setError(null)
    setMapping({ teacher: null, course: null, day: null, start: null, end: null, classroom: null })
  }

  const mappedCount = keys.filter((k) => mapping[k] !== null).length
  const requiredMapped = mapping.course !== null && mapping.day !== null && mapping.start !== null && mapping.end !== null && (tipo === 'alumnos' || mapping.teacher !== null)

  const handleImport = async () => {
    if (!file || !requiredMapped) return
    setLoading(true); setError(null); setResult(null)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mapping', JSON.stringify(mapping))
    formData.append('tipo', tipo)
    try {
      const res = await fetch('/api/secretario/horarios/import', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error ?? `Error del servidor (${res.status})`)
      }
      const data = await res.json()
      setResult({ created: data.created, errors: data.errors ?? [] })
      if (data.created > 0) {
        onImported()
        onClose()
        return
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al importar.')
    } finally { setLoading(false) }
  }

  const handleDownloadSample = () => {
    const blob = new Blob([buildHorarioSampleCsv(tipo)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = tipo === 'alumnos' ? 'plantilla_horario_alumnos.csv' : 'plantilla_horario_docentes.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <SbModal open={open} onClose={onClose} maxWidth="640px">
      <SbModalBody noPadding>
        <div className="px-6 pt-6 pb-4">
          <h3 className="text-lg font-semibold text-sb-on-surface">Importar horarios</h3>
          <p className="text-xs text-sb-on-surface-variant/50 mt-1">Sube un CSV para importar horarios masivamente.</p>
          <div className="flex gap-1 mt-4 rounded-xl bg-sb-surface p-1 w-fit">
            {(["alumnos", "docentes"] as const).map((t) => (
              <button key={t} onClick={() => switchTipo(t)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  tipo === t ? "bg-sb-on-surface text-sb-surface" : "text-sb-on-surface-variant/60 hover:text-sb-on-surface/70"
                }`}>
                {t === "alumnos" ? "Horario de Alumnos" : "Horario de Docentes"}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 space-y-4 pb-2">
          {tipo === "alumnos" ? (
            <ul className="space-y-1.5 text-xs text-sb-on-surface-variant/60">
              <li className="flex items-start gap-2"><span className="text-sb-on-surface-variant/20 mt-0.5">•</span>Columnas: <strong className="text-sb-on-surface">Curso (código), Día, Hora Inicio, Hora Fin, Salón</strong>.</li>
              <li className="flex items-start gap-2"><span className="text-sb-on-surface-variant/20 mt-0.5">•</span>Día: <strong className="text-sb-on-surface">Lunes a Viernes</strong> o 1-5. Horas en formato <strong className="text-sb-on-surface">HH:MM</strong>.</li>
              <li className="flex items-start gap-2"><span className="text-sb-on-surface-variant/20 mt-0.5">•</span>El alumno hereda el horario de su sección.</li>
            </ul>
          ) : (
            <ul className="space-y-1.5 text-xs text-sb-on-surface-variant/60">
              <li className="flex items-start gap-2"><span className="text-sb-on-surface-variant/20 mt-0.5">•</span>Columnas: <strong className="text-sb-on-surface">Docente, Curso (código), Día, Hora Inicio, Hora Fin, Salón</strong>.</li>
              <li className="flex items-start gap-2"><span className="text-sb-on-surface-variant/20 mt-0.5">•</span>El docente debe existir (Personal o Director). Se le asigna el curso automáticamente.</li>
              <li className="flex items-start gap-2"><span className="text-sb-on-surface-variant/20 mt-0.5">•</span>Cada docente verá su propio horario en su panel.</li>
            </ul>
          )}

          <div
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f && f.name.endsWith('.csv')) processFile(f); else setError('Solo se aceptan archivos CSV.') }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => inputRef.current?.click()}
            className={`rounded-2xl p-8 text-center cursor-pointer transition-all border-2 border-dashed ${dragOver ? 'border-sb-on-surface bg-sb-surface-container' : 'border-sb-outline-variant/40 bg-sb-surface hover:bg-sb-surface-container-low/30'}`}
          >
            <input ref={inputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f) }} />
            <Upload size={28} className={`mx-auto mb-2 ${dragOver ? 'text-sb-on-surface' : 'text-sb-on-surface-variant/20'}`} />
            <div className="text-sm text-sb-on-surface">{file ? file.name : 'Arrastra tu CSV aquí o haz clic'}</div>
            <div className="text-[11px] text-sb-on-surface-variant/30 mt-1">Solo archivos .csv</div>
          </div>

          {error && (
            <div className="rounded-xl p-3 px-4 flex items-center gap-2 text-red-600 text-xs bg-red-500/8">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {file && rows.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <Table className="h-4 w-4 text-sb-on-surface-variant/40" />
                <span className="text-[11px] font-semibold text-sb-on-surface-variant/60 uppercase tracking-wider">Vista previa ({rows.length} filas)</span>
              </div>
              <div className="overflow-x-auto rounded-xl bg-sb-surface border border-sb-outline-variant/20">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-sb-outline-variant/20">
                      {header.map((col, i) => (
                        <th key={i} className="px-3 py-2 text-left font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((row, ri) => (
                      <tr key={ri} className="border-b border-sb-outline-variant/10 last:border-0">
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-3 py-2 whitespace-nowrap max-w-[160px] overflow-hidden text-ellipsis text-sb-on-surface/80">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-sb-on-surface-variant/60 uppercase tracking-wider">Mapeo de columnas</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sb-on-surface/8 text-sb-on-surface">{mappedCount}/{keys.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {keys.map((key) => (
                    <div key={key} className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">{HORARIO_COLUMN_LABELS[key]}</label>
                      <select value={mapping[key] ?? ''} onChange={(e) => setMapping((m) => ({ ...m, [key]: e.target.value ? Number(e.target.value) : null }))} className="sbf-native-select w-full">
                        <option value="">— Seleccionar —</option>
                        {header.map((col, i) => <option key={i} value={i}>{col}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 rounded-2xl p-4 text-center bg-sb-surface">
                  <CheckCircle className="h-6 w-6 mx-auto mb-1 text-emerald-500" />
                  <div className="text-xl font-bold text-sb-on-surface">{result.created}</div>
                  <div className="text-[11px] text-sb-on-surface-variant/40">Creados</div>
                </div>
                <div className="flex-1 rounded-2xl p-4 text-center bg-sb-surface">
                  <AlertCircle className={`h-6 w-6 mx-auto mb-1 ${result.errors.length > 0 ? 'text-red-500' : 'text-sb-on-surface-variant/20'}`} />
                  <div className="text-xl font-bold text-sb-on-surface">{result.errors.length}</div>
                  <div className="text-[11px] text-sb-on-surface-variant/40">Errores</div>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="max-h-40 overflow-auto rounded-xl p-3 bg-red-500/5 space-y-1">
                  {result.errors.map((err, i) => <div key={i} className="text-[11px] text-red-600">{err}</div>)}
                </div>
              )}
            </div>
          )}
        </div>
      </SbModalBody>
      <div className="px-6 py-4 flex items-center gap-2 border-t border-sb-outline-variant/10">
        <SbBtn rounded onClick={onClose}>Cerrar</SbBtn>
        <SbBtn rounded onClick={handleDownloadSample} className="flex items-center gap-2">
          <Download className="h-3.5 w-3.5" /> Plantilla {tipo === "alumnos" ? "Alumnos" : "Docentes"}
        </SbBtn>
        <div className="flex-1" />
        <SbBtn variant="filled" rounded onClick={handleImport} disabled={loading || !file || !requiredMapped} className="flex items-center gap-2">
          <Upload className="h-3.5 w-3.5" /> {loading ? 'Importando…' : 'Importar'}
        </SbBtn>
      </div>
    </SbModal>
  )
}

const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m }
const isRecess = (gap: number) => gap >= 5 && gap <= 30

function DayCard({ day, label, items, activeDay, onAdd, onEdit, onDelete, onDetail }: {
  day: number; label: string; items: Horario[]; activeDay: number | null
  onAdd: () => void; onEdit: (h: Horario) => void; onDelete: (h: Horario) => void; onDetail: (h: Horario) => void
}) {
  if (activeDay !== null && activeDay !== day) return null
  return (
    <div className="bg-sb-surface rounded-2xl overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-sb-outline-variant/10">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-sb-on-surface-variant/40" />
          <span className="text-sm font-semibold text-sb-on-surface/80">{label}</span>
        </div>
        <button onClick={onAdd}
          className="p-1 rounded-lg hover:bg-sb-surface-container text-sb-on-surface-variant/30 hover:text-sb-on-surface/60 transition-colors">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      {items.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-xs text-sb-on-surface-variant/30">Sin horarios</p>
          <button onClick={onAdd} className="text-[10px] text-sb-primary/50 hover:text-sb-primary mt-1 transition-colors">+ Agregar</button>
        </div>
      ) : (
        <div className="divide-y divide-sb-outline-variant/10">
          {items.map((h, idx) => {
            const next = items[idx + 1]
            const gap = next ? toMin(next.start_time) - toMin(h.end_time) : null
            const showRecess = gap !== null && isRecess(gap)
            return (
              <div key={h.id}>
                <div className="px-4 py-3 hover:bg-sb-surface-container/50 transition-colors group cursor-pointer" onClick={() => onDetail(h)}>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-sb-on-surface/90 truncate">{h.course_name}</span>
                        <span className="text-[10px] text-sb-on-surface-variant/30 font-mono">{h.grade} {h.section}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-sb-on-surface-variant/40 flex-wrap">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{h.start_time.slice(0, 5)} — {h.end_time.slice(0, 5)}</span>
                        {h.classroom && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{h.classroom}</span>}
                        <span className="truncate">{h.teacher_name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); onEdit(h) }} className="p-1 rounded-md hover:bg-sb-surface-container text-sb-on-surface-variant/30 hover:text-sb-on-surface/60 transition-colors">
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onDelete(h) }} className="p-1 rounded-md hover:bg-sb-surface-container/80 text-sb-on-surface-variant/30 hover:text-red-400/60 transition-colors">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
                {showRecess && (
                  <div className="px-4 py-1.5 flex items-center gap-2 bg-sb-surface-container/30">
                    <div className="flex-1 h-px bg-sb-outline-variant/20" />
                    <span className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-sb-on-surface-variant/30">
                      <Coffee className="h-2.5 w-2.5" /> Receso {gap} min
                    </span>
                    <div className="flex-1 h-px bg-sb-outline-variant/20" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function HorariosSecretarioPage() {
  const [horarios, setHorarios] = React.useState<Horario[]>([])
  const [courses, setCourses] = React.useState<Course[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeDay, setActiveDay] = React.useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Horario | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState<Horario | null>(null)
  const [detail, setDetail] = React.useState<Horario | null>(null)

  const [formData, setFormData] = React.useState({
    course_id: "", day_of_week: 1, start_time: "08:00", end_time: "09:00", classroom: "",
  })
  const [saving, setSaving] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)
  const [importKey, setImportKey] = React.useState(0)
  const [tab, setTab] = React.useState<"alumnos" | "docentes">("alumnos")
  const [filterSection, setFilterSection] = React.useState("all")
  const [filterTeacher, setFilterTeacher] = React.useState("all")

  const openImport = () => { setImportKey(k => k + 1); setImportOpen(true) }

  const fetchData = async () => {
    try { const r = await fetch("/api/secretario/horarios"); if (r.ok) setHorarios(await r.json()) } catch {}
    finally { setLoading(false) }
  }

  const fetchCourses = async () => {
    try { const r = await fetch("/api/secretario/cursos"); if (r.ok) setCourses(await r.json()) } catch {}
  }

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [hr, cr] = await Promise.all([fetch("/api/secretario/horarios"), fetch("/api/secretario/cursos")])
        if (!cancelled && hr.ok) setHorarios(await hr.json())
        if (!cancelled && cr.ok) setCourses(await cr.json())
      } catch {}
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  const openCreate = (day?: number) => {
    setEditing(null)
    setFormData({ course_id: "", day_of_week: day || 1, start_time: "08:00", end_time: "09:00", classroom: "" })
    setDialogOpen(true)
  }

  const openEdit = (h: Horario) => {
    setEditing(h)
    setFormData({ course_id: h.course_id, day_of_week: h.day_of_week, start_time: h.start_time.slice(0, 5), end_time: h.end_time.slice(0, 5), classroom: h.classroom || "" })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.course_id || !formData.day_of_week || !formData.start_time || !formData.end_time) return
    setSaving(true)
    try {
      const url = editing ? `/api/secretario/horarios/${editing.id}` : "/api/secretario/horarios"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) })
      if (res.ok) { setDialogOpen(false); setEditing(null); fetchData() }
    } catch {}
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try { await fetch(`/api/secretario/horarios/${id}`, { method: "DELETE" }); setDeleteConfirm(null); fetchData() } catch {}
  }

  const teachers = React.useMemo(() => {
    const map = new Map<string, string>()
    horarios.forEach(h => { if (h.teacher_id && h.teacher_name && h.teacher_name !== "Sin asignar") map.set(h.teacher_id, h.teacher_name) })
    return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [horarios])

  const visibleHorarios = React.useMemo(() => {
    if (tab === "alumnos" && filterSection !== "all") {
      const [g, s] = filterSection.split("|")
      return horarios.filter(h => h.grade === g && h.section === s)
    }
    if (tab === "docentes" && filterTeacher !== "all") {
      return horarios.filter(h => h.teacher_id === filterTeacher)
    }
    return horarios
  }, [tab, filterSection, filterTeacher, horarios])

  const sections = React.useMemo(() => {
    const set = new Set<string>()
    courses.forEach(c => set.add(`${c.grade}|${c.section}`))
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [courses])

  const scheduleByDay = DAYS.map((_, i) => {
    const day = i + 1
    const items = visibleHorarios.filter(h => h.day_of_week === day).sort((a, b) => a.start_time.localeCompare(b.start_time))
    return { day, label: DAYS[i], items }
  })

  const teacherGroups = React.useMemo(() => {
    const map = new Map<string, Horario[]>()
    visibleHorarios.forEach(h => {
      if (!h.teacher_id) return
      if (!map.has(h.teacher_id)) map.set(h.teacher_id, [])
      map.get(h.teacher_id)!.push(h)
    })
    return [...map.entries()].sort((a, b) => {
      const na = horarios.find(x => x.teacher_id === a[0])?.teacher_name || ""
      const nb = horarios.find(x => x.teacher_id === b[0])?.teacher_name || ""
      return na.localeCompare(nb)
    })
  }, [visibleHorarios, horarios])

  return (
    <div className="space-y-5">
      <SbSectionHeader title="Horarios" description="Organiza los horarios de clases por curso y docente"
        action={
          <div className="flex items-center gap-2">
            <SbBtn rounded className="flex items-center gap-2" onClick={openImport}>
              <Upload className="h-4 w-4" /> Importar
            </SbBtn>
            <SbBtn variant="filled" rounded className="flex items-center gap-2" onClick={() => openCreate()}>
              <Plus className="h-4 w-4" /> Agregar horario
            </SbBtn>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-2xl bg-sb-surface p-1">
          {(["alumnos", "docentes"] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setActiveDay(null) }}
              className={`px-4 py-2 rounded-xl text-xs font-medium capitalize transition-all ${
                tab === t ? "bg-sb-on-surface text-sb-surface" : "text-sb-on-surface-variant hover:text-sb-on-surface/70"
              }`}>
              {t}
            </button>
          ))}
        </div>

        {tab === "alumnos" ? (
          <select value={filterSection} onChange={e => setFilterSection(e.target.value)}
            className="text-xs rounded-xl bg-sb-surface px-3 py-2 outline-none text-sb-on-surface/80 border border-sb-outline-variant/10 focus:border-sb-primary/40">
            <option value="all">Todas las secciones</option>
            {sections.map(s => {
              const [g, sec] = s.split("|")
              return <option key={s} value={s}>{g} {sec}</option>
            })}
          </select>
        ) : (
          <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}
            className="text-xs rounded-xl bg-sb-surface px-3 py-2 outline-none text-sb-on-surface/80 border border-sb-outline-variant/10 focus:border-sb-primary/40">
            <option value="all">Todos los docentes</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}

        {tab === "alumnos" && filterSection !== "all" && (
          <span className="flex items-center gap-1.5 text-[10px] text-sb-on-surface-variant/40">
            <Clock className="h-3 w-3" /> Jornada Lunes-Viernes · receso de 15 min entre bloques
          </span>
        )}
      </div>

      {tab === "alumnos" && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {scheduleByDay.map(({ day, label, items }) => (
            <button key={day} onClick={() => setActiveDay(activeDay === day ? null : day)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all whitespace-nowrap ${
                activeDay === day
                  ? "bg-sb-on-surface text-sb-surface"
                  : "bg-sb-surface text-sb-on-surface-variant hover:bg-sb-surface-container/80"
              }`}>
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{label}</span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                items.length > 0 ? "bg-emerald-400/10 text-emerald-400/70" : "bg-sb-surface-container text-sb-on-surface-variant/30"
              }`}>{items.length}</span>
            </button>
          ))}
        </div>
      )}

      {loading && <div className="text-center py-16"><div className="w-6 h-6 rounded-full border-2 border-sb-outline-variant border-t-sb-primary animate-spin mx-auto" /></div>}

      {!loading && tab === "alumnos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {scheduleByDay.map(({ day, label, items }) => (
            <DayCard key={day} day={day} label={label} items={items} activeDay={activeDay}
              onAdd={() => openCreate(day)} onEdit={openEdit} onDelete={setDeleteConfirm} onDetail={setDetail} />
          ))}
        </div>
      )}

      {!loading && tab === "docentes" && (
        <div className="space-y-6">
          {teacherGroups.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-8 w-8 mx-auto mb-3 text-sb-on-surface-variant/20" />
              <p className="text-sm text-sb-on-surface-variant/50">{filterTeacher !== "all" ? "El docente no tiene horarios asignados" : "No hay docentes con horarios asignados"}</p>
              <p className="text-xs text-sb-on-surface-variant/30 mt-1">Asigna cursos a cada docente para que su horario aparezca aquí</p>
            </div>
          ) : (
            teacherGroups.map(([tid, hs]) => {
              const name = horarios.find(x => x.teacher_id === tid)?.teacher_name || "Docente"
              const gd = DAYS.map((_, i) => {
                const day = i + 1
                return { day, label: DAYS[i], items: hs.filter(x => x.day_of_week === day).sort((a, b) => a.start_time.localeCompare(b.start_time)) }
              })
              return (
                <div key={tid}>
                  <div className="flex items-center gap-3 mb-2 px-1">
                    <div className="h-9 w-9 rounded-xl bg-sb-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-sb-primary">{name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-sb-on-surface/90 truncate">{name}</p>
                      <p className="text-[10px] text-sb-on-surface-variant/40">{hs.length} clases por semana · su propio horario</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                    {gd.map(({ day, label, items }) => (
                      <DayCard key={day} day={day} label={label} items={items} activeDay={null}
                        onAdd={() => openCreate(day)} onEdit={openEdit} onDelete={setDeleteConfirm} onDetail={setDetail} />
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {!loading && horarios.length === 0 && tab === "alumnos" && (
        <div className="text-center py-16 col-span-full">
          <Clock className="h-8 w-8 mx-auto mb-3 text-sb-on-surface-variant/20" />
          <p className="text-sm text-sb-on-surface-variant/50">No hay horarios registrados</p>
          <p className="text-xs text-sb-on-surface-variant/30 mt-1">Agrega horarios para cada curso y día de la semana</p>
        </div>
      )}

      <SbModal open={dialogOpen} onClose={() => { setDialogOpen(false); setEditing(null) }} maxWidth="480px">
        <SbModalBody noPadding>
          <div className="px-6 pt-6 pb-4">
            <h3 className="text-lg font-semibold text-sb-on-surface">{editing ? "Editar horario" : "Agregar horario"}</h3>
            <p className="text-xs text-sb-on-surface-variant/50 mt-1">Asigna un curso a un día y horario específico</p>
          </div>
          <div className="px-6 space-y-4 pb-2">
            <div>
              <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Curso *</label>
              <select value={formData.course_id} onChange={e => setFormData({...formData, course_id: e.target.value})} className="sbf-native-select w-full">
                <option value="">Seleccionar curso...</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {c.grade} {c.section} ({c.teacher_name || "Sin docente"})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Día *</label>
              <select value={formData.day_of_week} onChange={e => setFormData({...formData, day_of_week: Number(e.target.value)})} className="sbf-native-select w-full">
                {DAYS.map((d, i) => <option key={i + 1} value={i + 1}>{d}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Hora inicio *</label>
                <SbInput type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
              </div>
              <div>
                <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Hora fin *</label>
                <SbInput type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Salón / Aula</label>
              <SbInput placeholder="Ej: Aula 201, Laboratorio..." value={formData.classroom} onChange={e => setFormData({...formData, classroom: e.target.value})} />
            </div>
          </div>
        </SbModalBody>
        <div className="px-6 py-4 flex items-center gap-2 border-t border-sb-outline-variant/10">
          <SbBtn rounded onClick={() => { setDialogOpen(false); setEditing(null) }}>Cancelar</SbBtn>
          <div className="flex-1" />
          <SbBtn variant="filled" rounded onClick={handleSave} disabled={saving || !formData.course_id || !formData.start_time || !formData.end_time}>
            {saving ? "Guardando..." : editing ? "Guardar cambios" : "Agregar horario"}
          </SbBtn>
        </div>
      </SbModal>

      <SbModal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="360px">
        <SbModalHeader title="Eliminar horario" onClose={() => setDeleteConfirm(null)} />
        <SbModalBody>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-sb-on-surface-variant/70">¿Eliminar horario de <strong className="text-sb-on-surface">{deleteConfirm?.course_name}</strong>?</p>
              <p className="text-xs text-sb-on-surface-variant/40 mt-1">{DAYS[(deleteConfirm?.day_of_week || 1) - 1]} — {deleteConfirm?.start_time?.slice(0, 5)} a {deleteConfirm?.end_time?.slice(0, 5)}</p>
            </div>
          </div>
        </SbModalBody>
        <SbModalFooter>
          <SbBtn rounded className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancelar</SbBtn>
          <SbBtn variant="danger" rounded className="flex-1" onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)}>Eliminar</SbBtn>
        </SbModalFooter>
      </SbModal>

      <SbModal open={!!detail} onClose={() => setDetail(null)} maxWidth="420px">
        <SbModalBody noPadding>
          <div className="px-6 pt-6 pb-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-sb-on-surface truncate">{detail?.course_name}</h3>
                <p className="text-xs text-sb-on-surface-variant/50 mt-0.5">{DAYS[(detail?.day_of_week || 1) - 1]} · {detail?.start_time?.slice(0, 5)} — {detail?.end_time?.slice(0, 5)} h</p>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-sb-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-sb-primary" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              {[
                { icon: GraduationCap, label: "Grado", value: detail?.grade || "—" },
                { icon: Users, label: "Sección", value: detail?.section || "—" },
                { icon: Clock, label: "Duración", value: detail ? `${Math.max(0, Math.round((toMin(detail.end_time) - toMin(detail.start_time)) / 60))} h` : "—" },
                { icon: BookOpen, label: "Docente", value: detail?.teacher_name || "—" },
                { icon: MapPin, label: "Salón", value: detail?.classroom || "—" },
                { icon: CheckCircle, label: "Estado", value: detail?.status === "active" ? "Activo" : detail?.status === "inactive" ? "Inactivo" : (detail?.status || "—") },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-xl bg-sb-surface-container/50 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-sb-on-surface-variant/40">
                    <Icon className="h-3 w-3" /> {label}
                  </div>
                  <p className="text-xs font-medium text-sb-on-surface/90 mt-1 truncate">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </SbModalBody>
        <div className="px-6 py-4 flex items-center gap-2 border-t border-sb-outline-variant/10">
          <SbBtn rounded onClick={() => { if (detail) openEdit(detail); setDetail(null) }} className="flex items-center gap-2">
            <Edit3 className="h-3.5 w-3.5" /> Editar
          </SbBtn>
          <SbBtn rounded onClick={() => setDetail(null)}>Cerrar</SbBtn>
          <div className="flex-1" />
          <SbBtn variant="danger" rounded onClick={() => { if (detail) setDeleteConfirm(detail); setDetail(null) }} className="flex items-center gap-2">
            <Trash2 className="h-3.5 w-3.5" /> Eliminar
          </SbBtn>
        </div>
      </SbModal>

      <HorarioImportModal key={importKey} open={importOpen} onClose={() => setImportOpen(false)} onImported={fetchData} />
    </div>
  )
}
