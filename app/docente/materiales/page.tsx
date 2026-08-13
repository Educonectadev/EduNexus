"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { FileText, Upload, Download, Search, Image, File, X, Trash2, Library } from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import { SbInput, SbBtn, SbModal, SbModalHeader, SbModalBody, SbModalFooter } from "@/components/ui/sb"

interface Material {
  id: string
  course_id: string | null
  name: string
  description: string | null
  file_url: string | null
  file_type: string
  file_size: number
  created_at: string
  course_name: string | null
  grade: string | null
  section: string | null
  source: "propio" | "biblioteca"
}

interface Course {
  id: string
  name: string
  grade: string
  section: string
}

function getIconForType(type: string) {
  if (!type) return File
  if (type.includes("pdf")) return FileText
  if (type.includes("powerpoint") || type.includes("presentation")) return FileText
  if (type.includes("video")) return FileText
  if (type.includes("image")) return Image
  if (type.includes("word") || type.includes("text")) return FileText
  return File
}

function formatSize(bytes: number) {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })
}

export default function MaterialesPage() {
  return (
    <React.Suspense fallback={null}>
      <MaterialesInner />
    </React.Suspense>
  )
}

function MaterialesInner() {
  const searchParams = useSearchParams()
  const prefilterCourse = searchParams.get("curso") || ""
  const [materials, setMaterials] = React.useState<Material[]>([])
  const [courses, setCourses] = React.useState<Course[]>([])
  const [search, setSearch] = React.useState("")
  const [courseFilter, setCourseFilter] = React.useState(prefilterCourse || "all")
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [upName, setUpName] = React.useState("")
  const [upDescription, setUpDescription] = React.useState("")
  const [upCourseId, setUpCourseId] = React.useState("")
  const [upFile, setUpFile] = React.useState<File | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const loadData = React.useCallback(async () => {
    try {
      const res = await fetch("/api/docente/materiales")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al cargar")
      setMaterials(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCourses = React.useCallback(async () => {
    try {
      const res = await fetch("/api/docente/cursos")
      const data = await res.json()
      setCourses(Array.isArray(data) ? data.map((c: any) => ({ id: c.id, name: c.name, grade: c.grade, section: c.section })) : [])
    } catch {}
  }, [])

  React.useEffect(() => { ;(async () => { await Promise.all([loadData(), loadCourses()]) })() }, [loadData, loadCourses])

  const filtered = materials.filter(m => {
    const matchesSearch = !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.course_name || "").toLowerCase().includes(search.toLowerCase())
    const matchesCourse = courseFilter === "all" || m.course_id === courseFilter
    return matchesSearch && matchesCourse
  })

  const handleUpload = async () => {
    if (!upName || !upCourseId || !upFile) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("name", upName)
      formData.append("description", upDescription || "")
      formData.append("course_id", upCourseId)
      formData.append("file", upFile)
      const res = await fetch("/api/docente/materiales", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al subir")
      setUploadOpen(false)
      setUpName(""); setUpDescription(""); setUpCourseId(""); setUpFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      loadData()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (m: Material) => {
    if (!window.confirm(`¿Eliminar "${m.name}"?`)) return
    try {
      const res = await fetch(`/api/docente/materiales?id=${m.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al eliminar")
      loadData()
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="sb-note">
      <div className="mx-auto w-full max-w-[1034px] px-2 pb-4 space-y-5">
        {/* Header */}
        <header className="pt-2 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-[26px] sm:text-[30px] leading-tight tracking-[-0.03em] text-[var(--note-text)]">Materiales</h1>
            <p className="mt-1 text-sm text-[var(--note-muted)]">Materiales de tus cursos y biblioteca institucional</p>
          </div>
          <SbBtn variant="filled" rounded className="flex items-center gap-2" onClick={() => setUploadOpen(true)} disabled={!courses.length}>
            <Upload className="h-4 w-4" /> Subir
          </SbBtn>
        </header>

        {error && (
          <div className="rounded-[12px] bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-500/10 rounded-[12px]"><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--note-muted)]/50" />
            <SbInput placeholder="Buscar materiales..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: "36px" }} />
          </div>
          <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} className="sbf-native-select sm:w-64">
            <option value="all">Todos los cursos</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name} · {c.grade} &quot;{c.section}&quot;</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-[12px] bg-[var(--note-fill-strong)]" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-48 rounded bg-[var(--note-fill-strong)]" />
                    <div className="h-3 w-32 rounded bg-[var(--note-fill-strong)]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence>
              {filtered.map((m, i) => {
                const Icon = getIconForType(m.file_type)
                return (
                  <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.02 }}
                    className="group rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] p-4 transition-all duration-150 hover:border-[var(--note-hairline-strong)]">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-[12px] bg-[var(--note-fill-strong)] flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-[var(--note-text)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--note-text)] truncate">{m.name}</p>
                        <p className="text-xs text-[var(--note-muted)] truncate">
                          {m.course_name ? `${m.course_name}${m.grade ? ` · ${m.grade} "${m.section}"` : ""} · ` : ""}
                          {formatSize(m.file_size)} · {formatDate(m.created_at)}
                        </p>
                        {m.description && <p className="text-xs text-[var(--note-muted)]/70 truncate mt-0.5">{m.description}</p>}
                      </div>
                      <span className={`text-[10px] font-medium px-2.5 py-1 rounded-[12px] shrink-0 hidden sm:inline-flex items-center gap-1 ${
                        m.source === "propio" ? "bg-[var(--note-fill)] text-[var(--note-muted)]" : "bg-[var(--note-fill)] text-[var(--note-muted)]/60"
                      }`}>
                        <Library className="h-3 w-3" /> {m.source === "propio" ? "Mis materiales" : "Biblioteca"}
                      </span>
                      {m.file_url && (
                        <a href={m.file_url} target="_blank" rel="noreferrer" download
                          className="p-2 rounded-[12px] hover:bg-[var(--note-fill)] transition-colors shrink-0">
                          <Download className="h-4 w-4 text-[var(--note-muted)]/60" />
                        </a>
                      )}
                      {m.source === "propio" && (
                        <button onClick={() => handleDelete(m)}
                          className="p-2 rounded-[12px] hover:bg-red-500/10 hover:text-red-500 transition-colors shrink-0">
                          <Trash2 className="h-4 w-4 text-[var(--note-muted)]/60" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            {!loading && filtered.length === 0 && (
              <div className="rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] py-10 text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-[var(--note-muted)]/40" />
                <p className="text-sm text-[var(--note-muted)]">Sin materiales</p>
              </div>
            )}
          </div>
        )}

        {/* Upload modal */}
        <SbModal open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="440px">
          <SbModalHeader title="Subir material" onClose={() => setUploadOpen(false)} />
          <SbModalBody>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold text-[var(--note-muted)] uppercase tracking-wider mb-1.5 block">Curso</label>
                <select value={upCourseId} onChange={e => setUpCourseId(e.target.value)} className="sbf-native-select w-full">
                  <option value="">Seleccionar curso...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name} · {c.grade} &quot;{c.section}&quot;</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[var(--note-muted)] uppercase tracking-wider mb-1.5 block">Nombre</label>
                <input value={upName} onChange={e => setUpName(e.target.value)} placeholder="Guía de álgebra - Cap. 3" className="sb-input rounded-[12px] text-sm h-10 w-full" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[var(--note-muted)] uppercase tracking-wider mb-1.5 block">Descripción (opcional)</label>
                <textarea value={upDescription} onChange={e => setUpDescription(e.target.value)} rows={2} placeholder="Breve descripción del material"
                  className="sb-input rounded-[12px] text-sm w-full resize-none" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[var(--note-muted)] uppercase tracking-wider mb-1.5 block">Archivo</label>
                <input ref={fileInputRef} type="file" onChange={e => setUpFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-[var(--note-muted)]/60 file:mr-3 file:rounded-[12px] file:border-0 file:bg-[var(--note-fill-strong)] file:px-3 file:py-2 file:text-xs file:font-medium file:text-[var(--note-text)] hover:file:bg-[var(--note-fill)]" />
                {upFile && <p className="text-xs text-[var(--note-muted)] mt-1.5">{upFile.name} · {formatSize(upFile.size)}</p>}
              </div>
            </div>
          </SbModalBody>
          <SbModalFooter>
            <SbBtn rounded onClick={() => setUploadOpen(false)}>Cancelar</SbBtn>
            <SbBtn variant="filled" rounded disabled={!upName || !upCourseId || !upFile || uploading} onClick={handleUpload}>
              {uploading ? "Subiendo..." : "Subir"}
            </SbBtn>
          </SbModalFooter>
        </SbModal>
      </div>
    </div>
  )
}