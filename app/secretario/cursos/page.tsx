"use client"

import * as React from "react"
import { BookOpen, Plus, Search, Edit3, Trash2, Users, GraduationCap, X, AlertTriangle, Command, Upload, Download, AlertCircle, CheckCircle, Table, Clock } from "@/components/ui/proicons"
import { motion } from "framer-motion"
import { SbSectionHeader, SbModal, SbModalHeader, SbModalBody, SbModalFooter, SbBtn, SbInput } from "@/components/ui/sb"
import { SbfSearchBar, SbfSelect, SbfResultsCount } from "@/components/ui/search-filter-bar"
import "@/frontend.css"

interface Course {
  id: string; name: string; code: string; grade: string; section: string
  teacher_id: string; teacher_name: string; student_count: number; schedule_count?: number; status: string; created_at: string
}

const GRADES = [
  "Inicial", "1° Primaria", "2° Primaria", "3° Primaria", "4° Primaria", "5° Primaria", "6° Primaria",
  "1° Secundaria", "2° Secundaria", "3° Secundaria", "4° Secundaria", "5° Secundaria",
]
const SECTIONS = ["A", "B", "C", "D", "E"]

type CourseColumnKey = 'name' | 'code' | 'grade' | 'section' | 'teacher'
const COURSE_COLUMN_KEYS: CourseColumnKey[] = ['name', 'code', 'grade', 'section', 'teacher']
const COURSE_COLUMN_LABELS: Record<CourseColumnKey, string> = {
  name: 'Nombre', code: 'Código', grade: 'Grado', section: 'Sección', teacher: 'Profesor',
}

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

function buildCourseSampleCsv(): string {
  const header = ['Nombre', 'Código', 'Grado', 'Sección', 'Profesor'].join(',')
  const rows = [
    ['Matemática', 'MAT-5A', '5° Secundaria', 'A', 'Juan Carlos Pérez López'],
    ['Comunicación', 'COM-5A', '5° Secundaria', 'A', 'María Ana García Torres'],
    ['Inglés', 'ING-2A', '2° Secundaria', 'A', 'Sofía Valentina Ríos Luna'],
  ]
  return [header, ...rows.map((r) => r.join(','))].join('\n')
}

function autoMapColumns(header: string[]): Record<CourseColumnKey, number | null> {
  const map: Record<CourseColumnKey, number | null> = { name: null, code: null, grade: null, section: null, teacher: null }
  header.forEach((col, i) => {
    const c = col.trim().toLowerCase()
    if (c.includes('nombre') || c === 'name' || c.includes('curso')) map.name ??= i
    else if (c.includes('código') || c.includes('codigo') || c === 'code') map.code ??= i
    else if (c.includes('grado') || c === 'grade') map.grade ??= i
    else if (c.includes('sección') || c.includes('seccion') || c === 'section') map.section ??= i
    else if (c.includes('profesor') || c.includes('docente') || c === 'teacher') map.teacher ??= i
  })
  return map
}

function CourseImportModal({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: () => void }) {
  const [file, setFile] = React.useState<File | null>(null)
  const [rows, setRows] = React.useState<string[][]>([])
  const [header, setHeader] = React.useState<string[]>([])
  const [mapping, setMapping] = React.useState<Record<CourseColumnKey, number | null>>({ name: null, code: null, grade: null, section: null, teacher: null })
  const [dragOver, setDragOver] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<{ created: number; errors: string[] } | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const processFile = (f: File) => {
    setFile(f); setResult(null); setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsed = parseCsv(text)
      if (parsed.length < 2) { setError('El archivo CSV debe tener una fila de encabezado y al menos una fila de datos.'); return }
      const [h, ...data] = parsed
      setHeader(h); setRows(data); setMapping(autoMapColumns(h))
    }
    reader.onerror = () => setError('Error al leer el archivo.')
    reader.readAsText(f)
  }

  const mappedCount = COURSE_COLUMN_KEYS.filter((k) => mapping[k] !== null).length
  const requiredMapped = mapping.name !== null && mapping.code !== null && mapping.grade !== null

  const handleImport = async () => {
    if (!file || !requiredMapped) return
    setLoading(true); setError(null); setResult(null)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mapping', JSON.stringify(mapping))
    try {
      const res = await fetch('/api/secretario/cursos/import', { method: 'POST', body: formData })
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
    const blob = new Blob([buildCourseSampleCsv()], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'plantilla_cursos.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <SbModal open={open} onClose={onClose} maxWidth="640px">
      <SbModalBody noPadding>
        <div className="px-6 pt-6 pb-4">
          <h3 className="text-lg font-semibold text-sb-on-surface">Importar cursos</h3>
          <p className="text-xs text-sb-on-surface-variant/50 mt-1">Sube un CSV con los cursos para importarlos masivamente.</p>
        </div>

        <div className="px-6 space-y-4 pb-2">
          <ul className="space-y-1.5 text-xs text-sb-on-surface-variant/60">
            <li className="flex items-start gap-2"><span className="text-sb-on-surface-variant/20 mt-0.5">•</span>Columnas: <strong className="text-sb-on-surface">Nombre, Código, Grado, Sección, Profesor</strong>.</li>
            <li className="flex items-start gap-2"><span className="text-sb-on-surface-variant/20 mt-0.5">•</span>El profesor es opcional y se busca por nombre en el personal docente.</li>
            <li className="flex items-start gap-2"><span className="text-sb-on-surface-variant/20 mt-0.5">•</span>Los cursos con código duplicado serán omitidos (reportados como error).</li>
          </ul>

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
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sb-on-surface/8 text-sb-on-surface">{mappedCount}/{COURSE_COLUMN_KEYS.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {COURSE_COLUMN_KEYS.map((key) => (
                    <div key={key} className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">{COURSE_COLUMN_LABELS[key]}</label>
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
          <Download className="h-3.5 w-3.5" /> Plantilla
        </SbBtn>
        <div className="flex-1" />
        <SbBtn variant="filled" rounded onClick={handleImport} disabled={loading || !file || !requiredMapped} className="flex items-center gap-2">
          <Upload className="h-3.5 w-3.5" /> {loading ? 'Importando…' : 'Importar'}
        </SbBtn>
      </div>
    </SbModal>
  )
}

export default function CursosSecretarioPage() {
  const [cursos, setCursos] = React.useState<Course[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Course | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState<Course | null>(null)
  const [filterGrade, setFilterGrade] = React.useState("all")
  const [isFocused, setIsFocused] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const [formData, setFormData] = React.useState({ name: "", code: "", grade: "", section: "A", teacher_id: "" })
  const [saving, setSaving] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)
  const [importKey, setImportKey] = React.useState(0)

  const [academicGrades, setAcademicGrades] = React.useState<string[]>([])
  const [academicSections, setAcademicSections] = React.useState<string[]>([])
  const [docentes, setDocentes] = React.useState<any[]>([])

  const fetchCascades = async () => {
    try {
      const [g, s, p] = await Promise.all([
        fetch("/api/secretario/academic-grades"),
        fetch("/api/secretario/academic-sections"),
        fetch("/api/secretario/personal"),
      ])
      if (g.ok) { const rows = await g.json(); setAcademicGrades(rows.map((x: any) => x.name)) }
      if (s.ok) { const rows = await s.json(); setAcademicSections(rows.map((x: any) => x.name)) }
      if (p.ok) { const rows = await p.json(); setDocentes(rows.filter((x: any) => x.role === "docente")) }
    } catch {}
  }

  const [studentsOpen, setStudentsOpen] = React.useState(false)
  const [studentsLoading, setStudentsLoading] = React.useState(false)
  const [studentsCourse, setStudentsCourse] = React.useState<Course | null>(null)
  const [studentsList, setStudentsList] = React.useState<any[]>([])

  const normGrade = (c: Course) => {
    const g = (c.grade || "").trim()
    const year = g.match(/^(\d+°)/)?.[1] || ""
    if (g.includes("Secundaria")) return `${year} de Secundaria`
    if (g.includes("Primaria")) return `${year} de Primaria`
    if (g.includes("Inicial")) return `${year} de Inicial`
    return g
  }

  const fetchStudents = async (c: Course) => {
    setStudentsCourse(c)
    setStudentsOpen(true)
    setStudentsLoading(true)
    try {
      const res = await fetch(`/api/secretario/academic-students?grade=${encodeURIComponent(normGrade(c))}&section=${encodeURIComponent(c.section || 'all')}`)
      setStudentsList(res.ok ? await res.json() : [])
    } catch { setStudentsList([]) } finally { setStudentsLoading(false) }
  }

  const openImport = () => { setImportKey(k => k + 1); setImportOpen(true) }

  const fetchData = async () => {
    try { const r = await fetch("/api/secretario/cursos"); if (r.ok) setCursos(await r.json()) } catch {}
    finally { setLoading(false) }
  }

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch("/api/secretario/cursos")
        if (r.ok && !cancelled) setCursos(await r.json())
      } catch {}
      finally { if (!cancelled) setLoading(false) }
    })()
    fetchCascades()
    return () => { cancelled = true }
  }, [])

  // Keyboard shortcut: Ctrl/Cmd + K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const openCreate = () => {
    setEditing(null)
    setFormData({ name: "", code: "", grade: "", section: "A", teacher_id: "" })
    setDialogOpen(true)
  }

  const openEdit = (c: Course) => {
    setEditing(c)
    setFormData({ name: c.name, code: c.code, grade: c.grade, section: c.section, teacher_id: c.teacher_id || "" })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.code || !formData.grade) return
    setSaving(true)
    try {
      const url = editing ? `/api/secretario/cursos/${editing.id}` : "/api/secretario/cursos"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) })
      if (res.ok) { setDialogOpen(false); setEditing(null); fetchData() }
    } catch {}
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try { await fetch(`/api/secretario/cursos/${id}`, { method: "DELETE" }); setDeleteConfirm(null); fetchData() } catch {}
  }

  const q = search.toLowerCase()
  const filtered = cursos.filter(c => {
    if (filterGrade !== "all" && c.grade !== filterGrade) return false
    if (q && !c.name.toLowerCase().includes(q) && !c.code.toLowerCase().includes(q) && !c.teacher_name?.toLowerCase().includes(q)) return false
    return true
  })

  const grades = [...new Set(academicGrades.length > 0 ? academicGrades : cursos.map(c => c.grade))].sort()

  return (
    <div className="space-y-5">
      <SbSectionHeader title="Cursos" description="Registra y gestiona los cursos de la institución"
        action={
          <div className="flex items-center gap-2">
            <SbBtn rounded className="flex items-center gap-2" onClick={openImport}>
              <Upload className="h-4 w-4" /> Importar
            </SbBtn>
            <SbBtn variant="filled" rounded className="flex items-center gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Nuevo curso
            </SbBtn>
          </div>
        }
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="bg-sb-surface rounded-2xl p-4">
          <BookOpen className="h-4 w-4 mb-2 text-sb-primary/60" />
          <p className="text-xl font-semibold text-sb-on-surface/80">{cursos.length}</p>
          <p className="text-[10px] text-sb-on-surface-variant/40 mt-0.5">Cursos registrados</p>
        </div>
        <div className="bg-sb-surface rounded-2xl p-4">
          <Users className="h-4 w-4 mb-2 text-purple-400/60" />
          <p className="text-xl font-semibold text-sb-on-surface/80">{cursos.reduce((s, c) => s + (c.student_count || 0), 0)}</p>
          <p className="text-[10px] text-sb-on-surface-variant/40 mt-0.5">Alumnos matriculados</p>
        </div>
        <div className="bg-sb-surface rounded-2xl p-4">
          <GraduationCap className="h-4 w-4 mb-2 text-emerald-400/60" />
          <p className="text-xl font-semibold text-sb-on-surface/80">{grades.length}</p>
          <p className="text-[10px] text-sb-on-surface-variant/40 mt-0.5">Grados académicos</p>
        </div>
        <div className="bg-sb-surface rounded-2xl p-4">
          <Users className="h-4 w-4 mb-2 text-amber-400/60" />
          <p className="text-xl font-semibold text-sb-on-surface/80">{new Set(cursos.map(c => c.teacher_id)).size}</p>
          <p className="text-[10px] text-sb-on-surface-variant/40 mt-0.5">Docentes asignados</p>
        </div>
      </motion.div>

      {/* Search Bar + Grade Select */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <SbfSearchBar
              value={search}
              onChange={setSearch}
              placeholder="Buscar por nombre, código o docente..."
              inputRef={inputRef}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </div>
          <SbfSelect
            value={filterGrade}
            onChange={setFilterGrade}
            placeholder="Todos los grados"
            icon={GraduationCap}
            options={[
              { value: "all", label: "Todos los grados" },
              ...grades.map(g => ({ value: g, label: g })),
            ]}
          />
        </div>
      </motion.div>

      {/* Results Count */}
      {!loading && filtered.length > 0 && search && (
        <SbfResultsCount
          count={filtered.length}
          query={search}
          onClear={() => { setSearch(""); setFilterGrade("all") }}
        />
      )}

      {!loading && filtered.length === 0 && (
        <div className="bg-sb-surface rounded-2xl py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-sb-surface-container flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-7 w-7 text-sb-on-surface-variant/20" />
          </div>
          <p className="text-sm font-medium text-sb-on-surface-variant/40">
            {cursos.length === 0 ? "No hay cursos registrados" : "Sin resultados para esta búsqueda"}
          </p>
          {cursos.length > 0 && (
            <button onClick={() => { setSearch(""); setFilterGrade("all") }} className="mt-3 text-xs text-sb-on-surface hover:underline">
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
            className="bg-sb-surface rounded-2xl px-5 py-4 hover:bg-sb-surface-container/50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-2xl bg-sb-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-4 w-4 text-sb-primary/60" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-sb-on-surface/90">{c.name}</h3>
                  <span className="text-[10px] font-mono text-sb-on-surface-variant/30">{c.code}</span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-sb-on-surface-variant/50 flex-wrap">
                  <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{c.grade} {c.section}</span>
                  <button onClick={() => fetchStudents(c)} className="flex items-center gap-1 hover:text-sb-on-surface/70 transition-colors">
                    <Users className="h-3 w-3" />{c.student_count || 0} alumno(s)
                  </button>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{c.schedule_count || 0} horario(s)</span>
                  <span className="flex items-center gap-1">{c.teacher_name || "Sin docente"}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => fetchStudents(c)} className="p-1.5 rounded-lg hover:bg-sb-surface-container/80 text-sb-on-surface-variant/30 hover:text-sb-on-surface/60 transition-colors" title="Ver alumnos">
                  <Users className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-sb-surface-container/80 text-sb-on-surface-variant/30 hover:text-sb-on-surface/60 transition-colors">
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setDeleteConfirm(c)} className="p-1.5 rounded-lg hover:bg-sb-surface-container/80 text-sb-on-surface-variant/30 hover:text-red-400/60 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <SbModal open={dialogOpen} onClose={() => { setDialogOpen(false); setEditing(null) }} maxWidth="520px">
        <SbModalBody noPadding>
          <div className="px-6 pt-6 pb-4">
            <h3 className="text-lg font-semibold text-sb-on-surface">{editing ? "Editar curso" : "Nuevo curso"}</h3>
            <p className="text-xs text-sb-on-surface-variant/50 mt-1">
              {editing ? "Modifica los datos del curso" : "Registra un nuevo curso en la institución"}
            </p>
          </div>
          <div className="px-6 space-y-4 pb-2">
            <div>
              <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Nombre del curso *</label>
              <SbInput placeholder="Ej: Matemática, Comunicación..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Código *</label>
                <SbInput placeholder="Ej: MAT-01" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
              </div>
              <div>
                <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Grado *</label>
                <select value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} className="sbf-native-select w-full">
                  <option value="">Seleccionar grado...</option>
                  {academicGrades.length > 0 ? academicGrades.map(g => <option key={g} value={g}>{g}</option>) : (GRADES as string[]).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Sección</label>
                <select value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} className="sbf-native-select w-full">
                  {(academicSections.length > 0 ? academicSections : SECTIONS).map(s => <option key={s} value={s}>Sección {s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Docente</label>
                <select value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})} className="sbf-native-select w-full">
                  <option value="">Sin asignar</option>
                  {docentes.map(d => (
                    <option key={d.id} value={d.teacher_id || d.id}>{d.full_name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </SbModalBody>
        <div className="px-6 py-4 flex items-center gap-2 border-t border-sb-outline-variant/10">
          <SbBtn rounded onClick={() => { setDialogOpen(false); setEditing(null) }}>Cancelar</SbBtn>
          <div className="flex-1" />
          <SbBtn variant="filled" rounded onClick={handleSave} disabled={saving || !formData.name || !formData.code || !formData.grade}>
            {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear curso"}
          </SbBtn>
        </div>
      </SbModal>

      <SbModal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="360px">
        <SbModalHeader title="Eliminar curso" onClose={() => setDeleteConfirm(null)} />
        <SbModalBody>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-sb-on-surface-variant/70">¿Eliminar <strong className="text-sb-on-surface">{deleteConfirm?.name}</strong>?</p>
              <p className="text-xs text-sb-on-surface-variant/40 mt-1">Esta acción es irreversible.</p>
            </div>
          </div>
        </SbModalBody>
        <SbModalFooter>
          <SbBtn rounded className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancelar</SbBtn>
          <SbBtn variant="danger" rounded className="flex-1" onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)}>Eliminar</SbBtn>
        </SbModalFooter>
      </SbModal>

      <CourseImportModal key={importKey} open={importOpen} onClose={() => setImportOpen(false)} onImported={fetchData} />

      {/* Course Students Modal */}
      <SbModal open={studentsOpen} onClose={() => setStudentsOpen(false)} maxWidth="520px">
        <SbModalHeader title={`Alumnos · ${studentsCourse?.name || ""}`} onClose={() => setStudentsOpen(false)} />
        <SbModalBody>
          {studentsLoading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-sb-surface-container rounded-xl animate-pulse" />)}</div>
          ) : studentsList.length === 0 ? (
            <div className="py-10 text-center">
              <Users className="h-10 w-10 mx-auto mb-2 text-sb-on-surface-variant/15" />
              <p className="text-sm font-medium text-sb-on-surface-variant/40">No hay alumnos en {studentsCourse?.name}</p>
              <p className="text-xs text-sb-on-surface-variant/25 mt-1 capitalize">Grado {studentsCourse?.grade} · Sección {studentsCourse?.section}</p>
            </div>
          ) : (
            <div className="bg-sb-surface-container/40 rounded-xl divide-y divide-sb-outline-variant/10">
              {studentsList.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="h-8 w-8 rounded-lg bg-sb-surface flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-sb-on-surface-variant/60">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sb-on-surface truncate">{s.first_name} {s.last_name}</p>
                    <p className="text-[10px] text-sb-on-surface-variant/40">Sección {s.section || "—"} · DNI: {s.document_number || "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SbModalBody>
        <SbModalFooter>
          <SbBtn rounded className="flex-1" onClick={() => setStudentsOpen(false)}>Cerrar</SbBtn>
        </SbModalFooter>
      </SbModal>
    </div>
  )
}
