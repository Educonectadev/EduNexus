"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { FileText, Upload, Download, Search, Image, File, X, Trash2, Library, ChevronDown } from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import { SbSectionHeader, SbInput, SbBtn, SbModal, SbModalHeader, SbModalBody, SbModalFooter } from "@/components/ui/sb"

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
    <div className="space-y-5">
      <SbSectionHeader
        title="Materiales"
        description="Materiales de tus cursos y biblioteca institucional"
        action={
          <SbBtn variant="filled" rounded className="flex items-center gap-2" onClick={() => setUploadOpen(true)} disabled={!courses.length}>
            <Upload className="h-3.5 w-3.5" /> Subir material
          </SbBtn>
        }
      />

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 flex items-center justify-between"
        >
          <span>{error}</span>
          <button onClick={() => setError(null)} className="p-1 hover:bg-red-500/10 rounded-xl"><X className="h-4 w-4" /></button>
        </motion.div>
      )}

      {/* Search + filter */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/30 pointer-events-none" />
          <input
            placeholder="Buscar materiales..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 pl-11 pr-4 bg-sb-surface rounded-xl border border-sb-outline-variant/10 text-sm text-sb-on-surface placeholder:text-sb-on-surface-variant/30 outline-none transition-all focus:border-sb-primary/30 ring-1 ring-sb-primary/10"
          />
        </div>
        <div className="relative w-full sm:w-64">
          <select
            value={courseFilter}
            onChange={e => setCourseFilter(e.target.value)}
            className="h-11 w-full px-4 pr-10 appearance-none cursor-pointer rounded-xl bg-sb-surface border border-sb-outline-variant/10 text-sm text-sb-on-surface outline-none transition-all focus:border-sb-primary/30"
          >
            <option value="all">Todos los cursos</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name} · {c.grade} &quot;{c.section}&quot;</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-sb-on-surface-variant/40" />
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl bg-sb-surface border border-sb-outline-variant/10 p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-sb-surface-container-high" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-48 rounded-lg bg-sb-surface-container-high" />
                  <div className="h-3 w-32 rounded-lg bg-sb-surface-container-high" />
                </div>
                <div className="h-8 w-20 rounded-xl bg-sb-surface-container-high" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((m, i) => {
              const Icon = getIconForType(m.file_type)
              const isPdf = m.file_type?.includes("pdf")
              const isImage = m.file_type?.includes("image")
              const isWord = m.file_type?.includes("word") || m.file_type?.includes("text")
              const isPpt = m.file_type?.includes("powerpoint") || m.file_type?.includes("presentation")
              const iconBg = isPdf ? "bg-red-500/10" : isImage ? "bg-purple-500/10" : isWord ? "bg-blue-500/10" : isPpt ? "bg-orange-500/10" : "bg-sb-surface-container-high"
              const iconColor = isPdf ? "text-red-500" : isImage ? "text-purple-500" : isWord ? "text-blue-500" : isPpt ? "text-orange-500" : "text-sb-on-surface-variant/60"
              return (
                <motion.div key={m.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ delay: i * 0.03 }}
                  className="group rounded-xl bg-sb-surface border border-sb-outline-variant/10 px-3 sm:px-5 py-4 transition-colors hover:bg-sb-surface-container-low/50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${iconBg}`}>
                      <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-sb-on-surface">{m.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {m.course_name && (
                          <span className="text-xs truncate text-sb-on-surface-variant/50">
                            {m.course_name}{m.grade ? ` · ${m.grade} "${m.section}"` : ""}
                          </span>
                        )}
                        <span className="text-[10px] text-sb-on-surface-variant/30">·</span>
                        <span className="text-xs text-sb-on-surface-variant/50">{formatSize(m.file_size)}</span>
                        <span className="text-[10px] text-sb-on-surface-variant/30">·</span>
                        <span className="text-xs text-sb-on-surface-variant/50">{formatDate(m.created_at)}</span>
                      </div>
                      {m.description && <p className="text-xs truncate mt-1 text-sb-on-surface-variant/40">{m.description}</p>}
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium shrink-0 hidden sm:inline-flex items-center gap-1.5 ${
                      m.source === "propio"
                        ? "bg-sb-surface-container-high text-sb-on-surface-variant/60"
                        : "bg-blue-500/10 text-blue-600"
                    }`}>
                      <Library className="h-3 w-3" /> {m.source === "propio" ? "Propio" : "Biblioteca"}
                    </span>
                    {m.file_url && (
                      <a href={m.file_url} target="_blank" rel="noreferrer" download
                        className="h-9 w-9 rounded-xl bg-sb-surface-container-high flex items-center justify-center transition-colors shrink-0 text-sb-on-surface-variant/60 hover:bg-sb-surface-container-highest hover:text-sb-on-surface"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                    {m.source === "propio" && (
                      <button onClick={() => handleDelete(m)}
                        className="h-9 w-9 rounded-xl bg-sb-surface-container-high flex items-center justify-center transition-colors shrink-0 text-sb-on-surface-variant/60 hover:bg-red-500/10 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
          {!loading && filtered.length === 0 && (
            <div className="py-20 text-center rounded-2xl bg-sb-surface border border-sb-outline-variant/10">
              <div className="h-16 w-16 rounded-2xl bg-sb-surface-container flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-sb-on-surface-variant/20" />
              </div>
              <p className="text-sm font-medium text-sb-on-surface-variant/50">Sin materiales</p>
              <p className="text-xs text-sb-on-surface-variant/30 mt-1">Sube tu primer material para comenzar</p>
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
              <label className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 mb-2 block">Curso</label>
              <select
                value={upCourseId}
                onChange={e => setUpCourseId(e.target.value)}
                className="h-11 w-full px-4 text-sm font-medium rounded-xl transition-all cursor-pointer bg-sb-surface-container text-sb-on-surface focus:outline-none focus:ring-2 focus:ring-sb-primary/30"
              >
                <option value="">Seleccionar curso...</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.grade} &quot;{c.section}&quot;
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 mb-2 block">Nombre</label>
              <SbInput
                value={upName}
                onChange={e => setUpName(e.target.value)}
                placeholder="Guía de álgebra - Cap. 3"
                className="h-11 w-full"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 mb-2 block">Descripción (opcional)</label>
              <textarea
                value={upDescription}
                onChange={e => setUpDescription(e.target.value)}
                rows={2}
                placeholder="Breve descripción del material"
                className="sb-input w-full px-4 py-3 text-sm font-medium rounded-xl transition-all resize-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50 mb-2 block">Archivo</label>
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={e => setUpFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="h-20 rounded-xl border-2 border-dashed border-sb-outline-variant/30 bg-sb-surface-container flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer hover:border-sb-primary/40 hover:bg-sb-surface-container-high">
                  <Upload className="h-5 w-5 text-sb-on-surface-variant/50" />
                  <p className="text-xs text-sb-on-surface-variant/60">
                    {upFile ? upFile.name : "Click para seleccionar archivo"}
                  </p>
                </div>
              </div>
              {upFile && (
                <p className="text-xs mt-2 flex items-center gap-1 text-sb-on-surface-variant/60">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {formatSize(upFile.size)}
                </p>
              )}
            </div>
          </div>
        </SbModalBody>
        <SbModalFooter>
          <SbBtn rounded onClick={() => setUploadOpen(false)}>
            Cancelar
          </SbBtn>
          <SbBtn
            variant="filled"
            rounded
            disabled={!upName || !upCourseId || !upFile || uploading}
            onClick={handleUpload}
            className="flex items-center gap-2"
          >
            {uploading ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" />
                Subir
              </>
            )}
          </SbBtn>
        </SbModalFooter>
      </SbModal>
    </div>
  )
}
