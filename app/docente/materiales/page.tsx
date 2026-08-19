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
    <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-black dark:bg-[#1a1a1c]">
      <div className="p-6 md:p-8 pb-24 md:pb-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-6 gap-4"
        >
          <div>
            <p className="text-[14px] font-medium mb-1 text-[#a1a1aa]">Panel Docente</p>
            <h1 className="text-[36px] md:text-[48px] font-bold leading-tight text-[#f4f4f5]">
              Materiales
            </h1>
            <p className="text-[13px] mt-2 text-[#a1a1aa]">
              Materiales de tus cursos y biblioteca institucional
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5">
                <div className="h-6 w-6 rounded-full flex items-center justify-center">
                  <span className="text-[9px] font-semibold text-[#f4f4f5]">
                    {user.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "D"}
                  </span>
                </div>
                <span className="text-sm md:text-base font-medium text-[#f4f4f5] whitespace-nowrap">
                  {user.full_name}
                </span>
              </div>
            )}
            <NotificationBell />
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Cambiar tema" title="Cambiar tema" className="h-10 w-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity relative">
              <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-[#f4f4f5]" />
              <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-[#f4f4f5]" />
            </button>
            <button
              onClick={() => setUploadOpen(true)}
              disabled={!courses.length}
              className="h-10 px-4 text-sm font-bold flex items-center gap-2 rounded-2xl bg-white text-black hover:bg-white/90 transition-all disabled:opacity-30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Upload className="h-4 w-4" /> Subir material
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
            <input
              placeholder="Buscar materiales..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-11 pl-11 pr-4 text-sm font-medium rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-[#666] focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={courseFilter}
            onChange={e => setCourseFilter(e.target.value)}
            className="h-11 px-4 text-sm font-medium rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all cursor-pointer sm:w-64"
          >
            <option value="all" className="bg-[#1a1a1c] text-white">Todos los cursos</option>
            {courses.map(c => (
              <option key={c.id} value={c.id} className="bg-[#1a1a1c] text-white">{c.name} · {c.grade} &quot;{c.section}&quot;</option>
            ))}
          </select>
        </motion.div>

        {loading ? (
          <div className="space-y-3 mt-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/10" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-48 rounded-lg bg-white/10" />
                    <div className="h-3 w-32 rounded-lg bg-white/10" />
                  </div>
                  <div className="h-8 w-20 rounded-xl bg-white/10" />
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
                const iconBg = isPdf ? "bg-red-500/20" : isImage ? "bg-purple-500/20" : isWord ? "bg-blue-500/20" : isPpt ? "bg-orange-500/20" : "bg-white/10"
                const iconColor = isPdf ? "text-red-400" : isImage ? "text-purple-400" : isWord ? "text-blue-400" : isPpt ? "text-orange-400" : "text-white/60"
                return (
                  <motion.div key={m.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ delay: i * 0.03 }}
                    className="group rounded-2xl bg-white/5 border border-white/10 px-5 py-4 transition-all duration-200 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-black/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-2xl ${iconBg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                        <Icon className={`h-5 w-5 ${iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{m.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {m.course_name && (
                            <span className="text-xs text-[#a1a1aa] truncate">
                              {m.course_name}{m.grade ? ` · ${m.grade} "${m.section}"` : ""}
                            </span>
                          )}
                          <span className="text-[10px] text-[#666]">·</span>
                          <span className="text-xs text-[#666]">{formatSize(m.file_size)}</span>
                          <span className="text-[10px] text-[#666]">·</span>
                          <span className="text-xs text-[#666]">{formatDate(m.created_at)}</span>
                        </div>
                        {m.description && <p className="text-xs text-[#666] truncate mt-1">{m.description}</p>}
                      </div>
                      <span className={`text-[10px] font-semibold px-3 py-1.5 rounded-xl shrink-0 hidden sm:inline-flex items-center gap-1.5 ${
                        m.source === "propio"
                          ? "bg-white/10 text-[#a1a1aa]"
                          : "bg-blue-500/20 text-blue-400"
                      }`}>
                        <Library className="h-3 w-3" /> {m.source === "propio" ? "Propio" : "Biblioteca"}
                      </span>
                      {m.file_url && (
                        <a href={m.file_url} target="_blank" rel="noreferrer" download
                          className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all shrink-0 group/btn">
                          <Download className="h-4 w-4 text-[#a1a1aa] group-hover/btn:text-white transition-colors" />
                        </a>
                      )}
                      {m.source === "propio" && (
                        <button onClick={() => handleDelete(m)}
                          className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-red-500/20 transition-all shrink-0 group/btn">
                          <Trash2 className="h-4 w-4 text-[#666] group-hover/btn:text-red-400 transition-colors" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            {!loading && filtered.length === 0 && (
              <div className="py-20 text-center rounded-2xl bg-white/5 border border-white/10">
                <div className="h-16 w-16 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-[#666]" />
                </div>
                <p className="text-sm font-medium text-[#a1a1aa] mb-1">Sin materiales</p>
                <p className="text-xs text-[#666]">Sube tu primer material para comenzar</p>
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
                <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider mb-2 block">Curso</label>
                <select
                  value={upCourseId}
                  onChange={e => setUpCourseId(e.target.value)}
                  className="h-11 w-full px-4 text-sm font-medium rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all cursor-pointer"
                >
                  <option value="" className="bg-[#1a1a1c] text-[#666]">Seleccionar curso...</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#1a1a1c] text-white">
                      {c.name} · {c.grade} &quot;{c.section}&quot;
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider mb-2 block">Nombre</label>
                <input
                  value={upName}
                  onChange={e => setUpName(e.target.value)}
                  placeholder="Guía de álgebra - Cap. 3"
                  className="h-11 w-full px-4 text-sm font-medium rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-[#666] focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider mb-2 block">Descripción (opcional)</label>
                <textarea
                  value={upDescription}
                  onChange={e => setUpDescription(e.target.value)}
                  rows={2}
                  placeholder="Breve descripción del material"
                  className="w-full px-4 py-3 text-sm font-medium rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-[#666] focus:outline-none focus:ring-2 focus:ring-white/20 transition-all resize-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider mb-2 block">Archivo</label>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={e => setUpFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="h-20 rounded-2xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-2 hover:border-white/20 hover:bg-white/10 transition-all cursor-pointer">
                    <Upload className="h-5 w-5 text-[#666]" />
                    <p className="text-xs text-[#666]">
                      {upFile ? upFile.name : "Click para seleccionar archivo"}
                    </p>
                  </div>
                </div>
                {upFile && (
                  <p className="text-xs text-[#a1a1aa] mt-2 flex items-center gap-1">
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
              className="h-10 px-5 text-sm font-semibold rounded-2xl bg-white/5 text-[#a1a1aa] hover:bg-white/10 transition-all"
            >
              Cancelar
            </button>
            <button
              disabled={!upName || !upCourseId || !upFile || uploading}
              onClick={handleUpload}
              className="h-10 px-6 text-sm font-bold rounded-2xl bg-white text-black hover:bg-white/90 transition-all disabled:opacity-30 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-black/30 border-t-black rounded-full" />
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
