"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { FileText, Upload, Download, Search, Image, File, X, Trash2, Library, Sun, Moon } from "@/components/ui/proicons"
import NotificationBell from "@/components/layout/notification-bell"
import { motion, AnimatePresence } from "framer-motion"
import { SbInput, SbBtn, SbModal, SbModalHeader, SbModalBody, SbModalFooter } from "@/components/ui/sb"
import { useAuthStore } from "@/stores/auth-store"
import { useTheme } from "next-themes"

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

const FONT = "var(--app-main-font, 'DM Sans'), sans-serif"

export default function MaterialesPage() {
  return (
    <React.Suspense fallback={null}>
      <MaterialesInner />
    </React.Suspense>
  )
}

function MaterialesInner() {
  const searchParams = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const { theme, setTheme } = useTheme()
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
    <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-white dark:bg-[#1a1a1c] sb-note">
      <div className="p-4 md:p-8 pb-24 md:pb-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-6 gap-4"
        >
          <div>
            <p className="text-[14px] font-medium mb-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Panel Docente</p>
            <h1 className="text-[36px] md:text-[48px] font-bold leading-tight" style={{ color: "var(--note-text)", fontFamily: FONT }}>
              Materiales
            </h1>
            <p className="text-[13px] mt-2" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
              Materiales de tus cursos y biblioteca institucional
            </p>
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
            <button
              onClick={() => setUploadOpen(true)}
              disabled={!courses.length}
              className="h-10 px-3 sm:px-5 text-sm font-bold flex items-center gap-2 rounded-xl transition-all disabled:opacity-30 hover:opacity-90 active:scale-[0.97]"
              style={{ background: "var(--note-text)", color: "var(--note-surface)", fontFamily: FONT }}
            >
              <Upload className="h-4 w-4" /> <span className="hidden sm:inline">Subir material</span>
            </button>
          </div>
        </motion.header>

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
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--note-muted)", opacity: 0.5 }} />
            <input
              placeholder="Buscar materiales..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-11 pl-11 pr-4 text-sm font-medium rounded-xl transition-all"
              style={{ background: "var(--note-fill)", color: "var(--note-text)", border: "1px solid var(--note-hairline)", fontFamily: FONT }}
            />
          </div>
          <select
            value={courseFilter}
            onChange={e => setCourseFilter(e.target.value)}
            className="h-11 px-4 text-sm font-medium rounded-xl transition-all cursor-pointer w-full sm:w-64 appearance-none bg-[var(--note-fill)] text-[var(--note-text)] border border-[var(--note-hairline)]"
            style={{ fontFamily: FONT, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '36px' }}
          >
            <option value="all" className="bg-[var(--note-fill)] text-[var(--note-text)]">Todos los cursos</option>
            {courses.map(c => (
              <option key={c.id} value={c.id} className="bg-[var(--note-fill)] text-[var(--note-text)]">{c.name} · {c.grade} &quot;{c.section}&quot;</option>
            ))}
          </select>
        </motion.div>

        {loading ? (
          <div className="space-y-3 mt-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: "var(--note-fill)", border: "1px solid var(--note-hairline)" }}>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl" style={{ background: "var(--note-fill-strong)" }} />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-48 rounded-lg" style={{ background: "var(--note-fill-strong)" }} />
                    <div className="h-3 w-32 rounded-lg" style={{ background: "var(--note-fill-strong)" }} />
                  </div>
                  <div className="h-8 w-20 rounded-xl" style={{ background: "var(--note-fill-strong)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 mt-6">
            <AnimatePresence>
              {filtered.map((m, i) => {
                const Icon = getIconForType(m.file_type)
                const isPdf = m.file_type?.includes("pdf")
                const isImage = m.file_type?.includes("image")
                const isWord = m.file_type?.includes("word") || m.file_type?.includes("text")
                const isPpt = m.file_type?.includes("powerpoint") || m.file_type?.includes("presentation")
                const iconBg = isPdf ? "rgba(239,68,68,0.15)" : isImage ? "rgba(168,85,247,0.15)" : isWord ? "rgba(59,130,246,0.15)" : isPpt ? "rgba(249,115,22,0.15)" : "var(--note-fill-strong)"
                const iconColor = isPdf ? "#f87171" : isImage ? "#c084fc" : isWord ? "#60a5fa" : isPpt ? "#fb923c" : "var(--note-muted)"
                return (
                  <motion.div key={m.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ delay: i * 0.03 }}
                    className="group rounded-xl px-3 sm:px-5 py-4 transition-all duration-200"
                    style={{ background: "var(--note-fill)", border: "1px solid var(--note-hairline)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--note-fill-strong)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--note-fill)" }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110" style={{ background: iconBg }}>
                        <Icon className="h-5 w-5" style={{ color: iconColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--note-text)", fontFamily: FONT }}>{m.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {m.course_name && (
                            <span className="text-xs truncate" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
                              {m.course_name}{m.grade ? ` · ${m.grade} "${m.section}"` : ""}
                            </span>
                          )}
                          <span className="text-[10px]" style={{ color: "var(--note-muted)", opacity: 0.5 }}>·</span>
                          <span className="text-xs" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{formatSize(m.file_size)}</span>
                          <span className="text-[10px]" style={{ color: "var(--note-muted)", opacity: 0.5 }}>·</span>
                          <span className="text-xs" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{formatDate(m.created_at)}</span>
                        </div>
                        {m.description && <p className="text-xs truncate mt-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{m.description}</p>}
                      </div>
                      <span className={`text-[10px] font-semibold px-3 py-1.5 rounded-xl shrink-0 hidden sm:inline-flex items-center gap-1.5 ${
                        m.source === "propio"
                          ? ""
                          : "bg-blue-500/20 text-blue-400"
                      }`} style={m.source === "propio" ? { background: "var(--note-fill-strong)", color: "var(--note-muted)" } : {}}>
                        <Library className="h-3 w-3" /> {m.source === "propio" ? "Propio" : "Biblioteca"}
                      </span>
                      {m.file_url && (
                        <a href={m.file_url} target="_blank" rel="noreferrer" download
                          className="h-10 w-10 rounded-xl flex items-center justify-center transition-all shrink-0 group/btn"
                          style={{ background: "var(--note-fill-strong)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--note-text)" }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--note-fill-strong)" }}
                        >
                          <Download className="h-4 w-4 transition-colors" style={{ color: "var(--note-muted)" }} />
                        </a>
                      )}
                      {m.source === "propio" && (
                        <button onClick={() => handleDelete(m)}
                          className="h-10 w-10 rounded-xl flex items-center justify-center transition-all shrink-0 group/btn"
                          style={{ background: "var(--note-fill-strong)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.15)" }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--note-fill-strong)" }}
                        >
                          <Trash2 className="h-4 w-4 transition-colors" style={{ color: "var(--note-muted)" }} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            {!loading && filtered.length === 0 && (
              <div className="py-20 text-center rounded-xl" style={{ background: "var(--note-fill)", border: "1px solid var(--note-hairline)" }}>
                <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--note-fill-strong)" }}>
                  <FileText className="h-8 w-8" style={{ color: "var(--note-muted)", opacity: 0.5 }} />
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--note-text)", fontFamily: FONT }}>Sin materiales</p>
                <p className="text-xs" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Sube tu primer material para comenzar</p>
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
                <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Curso</label>
                <select
                  value={upCourseId}
                  onChange={e => setUpCourseId(e.target.value)}
                  className="h-11 w-full px-4 text-sm font-medium rounded-xl transition-all cursor-pointer"
                  style={{ background: "var(--note-fill)", color: "var(--note-text)", border: "1px solid var(--note-hairline)", fontFamily: FONT }}
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
                <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Nombre</label>
                <input
                  value={upName}
                  onChange={e => setUpName(e.target.value)}
                  placeholder="Guía de álgebra - Cap. 3"
                  className="h-11 w-full px-4 text-sm font-medium rounded-xl transition-all"
                  style={{ background: "var(--note-fill)", color: "var(--note-text)", border: "1px solid var(--note-hairline)", fontFamily: FONT }}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Descripción (opcional)</label>
                <textarea
                  value={upDescription}
                  onChange={e => setUpDescription(e.target.value)}
                  rows={2}
                  placeholder="Breve descripción del material"
                  className="w-full px-4 py-3 text-sm font-medium rounded-xl transition-all resize-none"
                  style={{ background: "var(--note-fill)", color: "var(--note-text)", border: "1px solid var(--note-hairline)", fontFamily: FONT }}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Archivo</label>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={e => setUpFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all cursor-pointer"
                    style={{ borderColor: "var(--note-hairline)", background: "var(--note-fill)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--note-muted)"; e.currentTarget.style.background = "var(--note-fill-strong)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--note-hairline)"; e.currentTarget.style.background = "var(--note-fill)" }}
                  >
                    <Upload className="h-5 w-5" style={{ color: "var(--note-muted)" }} />
                    <p className="text-xs" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
                      {upFile ? upFile.name : "Click para seleccionar archivo"}
                    </p>
                  </div>
                </div>
                {upFile && (
                  <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                    {formatSize(upFile.size)}
                  </p>
                )}
              </div>
            </div>
          </SbModalBody>
          <SbModalFooter>
            <button
              onClick={() => setUploadOpen(false)}
              className="h-10 px-5 text-sm font-semibold rounded-lg transition-all hover:opacity-80"
              style={{ background: "var(--note-fill)", color: "var(--note-muted)", fontFamily: FONT }}
            >
              Cancelar
            </button>
            <button
              disabled={!upName || !upCourseId || !upFile || uploading}
              onClick={handleUpload}
              className="h-10 px-6 text-sm font-bold rounded-lg transition-all disabled:opacity-30 hover:opacity-90 active:scale-[0.97] flex items-center gap-2"
              style={{ background: "var(--note-text)", color: "var(--note-surface)", fontFamily: FONT }}
            >
              {uploading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 rounded-full" style={{ borderColor: "color-mix(in srgb, var(--note-surface) 30%, transparent)", borderTopColor: "var(--note-surface)" }} />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Subir
                </>
              )}
            </button>
          </SbModalFooter>
        </SbModal>
      </div>
    </div>
  )
}
