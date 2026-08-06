"use client"

import * as React from "react"
import { Upload, Search, Trash2, FileText, FileImage, File, Download, X, FolderOpen, Eye } from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import { SbBtn, useToast } from "@/components/ui/sb"
import { cn } from "@/lib/utils"
import { DocumentViewer } from "@/components/ui/document-viewer"

interface LibraryItem {
  id: string
  name: string
  description: string | null
  file_url: string
  file_type: string
  file_size: number
  category: string
  tags: string[] | null
  created_at: string
}

interface DocumentLibraryProps {
  open: boolean
  onClose: () => void
  onSelect?: (item: LibraryItem) => void
  mode?: "select" | "manage"
}

const CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "general", label: "General" },
  { id: "plantillas", label: "Plantillas" },
  { id: "constancias", label: "Constancias" },
  { id: "certificados", label: "Certificados" },
  { id: "otros", label: "Otros" },
]

function getFileIcon(type: string) {
  if (type.includes("pdf")) return FileText
  if (type.includes("image")) return FileImage
  if (type.includes("word") || type.includes("document")) return FileText
  return File
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentLibrary({ open, onClose, onSelect, mode = "manage" }: DocumentLibraryProps) {
  const [items, setItems] = React.useState<LibraryItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [category, setCategory] = React.useState("all")
  const [dragOver, setDragOver] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [preview, setPreview] = React.useState<LibraryItem | null>(null)
  const { toast } = useToast()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (open) fetchItems()
  }, [open, category])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category !== 'all') params.set('category', category)
      if (search) params.set('search', search)

      const res = await fetch(`/api/secretario/document-library?${params}`, { credentials: "include" })
      if (res.ok) setItems(await res.json())
    } catch {} finally { setLoading(false) }
  }

  React.useEffect(() => {
    const timer = setTimeout(() => fetchItems(), 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('name', file.name.replace(/\.[^/.]+$/, ''))
      fd.append('file', file)
      fd.append('category', 'general')

      const res = await fetch("/api/secretario/document-library", { method: "POST", body: fd, credentials: "include" })
      if (res.ok) {
        toast("Archivo subido", "success")
        fetchItems()
      } else {
        const data = await res.json()
        toast(data.error || "Error al subir", "error")
      }
    } catch { toast("Error de conexión", "error") }
    finally { setUploading(false) }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/secretario/document-library?id=${id}`, { method: "DELETE", credentials: "include" })
      if (res.ok) {
        toast("Eliminado", "success")
        setItems(items.filter(i => i.id !== id))
        setDeleteId(null)
      } else {
        toast("Error al eliminar", "error")
      }
    } catch { toast("Error de conexión", "error") }
  }

  const filtered = items.filter(i => {
    if (!search) return true
    const q = search.toLowerCase()
    return i.name.toLowerCase().includes(q) || (i.description && i.description.toLowerCase().includes(q))
  })

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[70] bg-black/30"
            onClick={onClose}
          />

          {/* Modal - normal animation like other modals */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[70] sm:w-[520px] sm:max-h-[80vh] bg-sb-surface rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-sb-outline-variant/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-sb-surface-container flex items-center justify-center">
                  <FolderOpen className="h-4.5 w-4.5 text-sb-on-surface-variant/50" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-sb-on-surface">Mi Biblioteca</h2>
                  <p className="text-[10px] text-sb-on-surface-variant/40">{items.length} archivo{items.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 flex items-center justify-center rounded-xl text-sb-on-surface-variant/40 hover:text-sb-on-surface hover:bg-sb-surface-container transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search + Categories */}
            <div className="px-4 pt-3 pb-2 space-y-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/30" />
                <input
                  placeholder="Buscar documento..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 bg-sb-surface-container rounded-xl text-sm text-sb-on-surface placeholder:text-sb-on-surface-variant/30 outline-none focus:ring-1 focus:ring-sb-outline-variant"
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors",
                      category === cat.id
                        ? "bg-sb-on-surface text-sb-surface"
                        : "bg-sb-surface-container text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Zone */}
            <div className="px-4 pb-2 shrink-0">
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-pointer",
                  dragOver
                    ? "border-sb-primary bg-sb-primary/5"
                    : "border-sb-outline-variant/20 hover:border-sb-outline-variant/40"
                )}
              >
                <Upload className={cn("h-5 w-5 mx-auto mb-1", dragOver ? "text-sb-primary" : "text-sb-on-surface-variant/30")} />
                <p className="text-[11px] text-sb-on-surface-variant/50">
                  {uploading ? "Subiendo..." : "Arrastra o haz clic para subir"}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5 min-h-0">
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-sb-surface-container rounded-xl animate-pulse" />
                ))
              ) : filtered.length === 0 ? (
                <div className="py-10 text-center">
                  <FileText className="h-10 w-10 mx-auto mb-2 text-sb-on-surface-variant/15" />
                  <p className="text-xs text-sb-on-surface-variant/40">
                    {search ? "Sin resultados" : "Tu biblioteca está vacía"}
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {filtered.map((item, i) => {
                    const Icon = getFileIcon(item.file_type)
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: i * 0.03 }}
                        className={cn(
                          "group flex items-center gap-3 p-2.5 rounded-xl transition-colors",
                          mode === "select"
                            ? "hover:bg-sb-primary/5 cursor-pointer"
                            : "hover:bg-sb-surface-container-low/50"
                        )}
                        onClick={() => mode === "select" && onSelect?.(item)}
                      >
                        <div className="h-9 w-9 rounded-lg bg-sb-surface-container flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-sb-on-surface-variant/40" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-sb-on-surface truncate">{item.name}</p>
                          <p className="text-[10px] text-sb-on-surface-variant/40">
                            {formatFileSize(item.file_size)} · {item.category}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={e => { e.stopPropagation(); setPreview(item) }}
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-sb-on-surface-variant/40 hover:text-sb-on-surface hover:bg-sb-surface-container transition-colors"
                            title="Vista previa"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <a
                            href={item.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-sb-on-surface-variant/40 hover:text-sb-on-surface hover:bg-sb-surface-container transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                          {mode === "manage" && (
                            <button
                              onClick={e => { e.stopPropagation(); setDeleteId(item.id) }}
                              className="h-7 w-7 flex items-center justify-center rounded-lg text-sb-on-surface-variant/30 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
            </div>
          </motion.div>

          {/* Delete Confirm */}
          <AnimatePresence>
            {deleteId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center p-4"
                onClick={() => setDeleteId(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-sb-surface rounded-2xl p-5 max-w-sm w-full shadow-xl"
                  onClick={e => e.stopPropagation()}
                >
                  <h3 className="text-sm font-semibold text-sb-on-surface mb-2">Eliminar archivo</h3>
                  <p className="text-xs text-sb-on-surface-variant/60 mb-4">
                    ¿Eliminar este archivo de tu biblioteca? Esta acción es irreversible.
                  </p>
                  <div className="flex justify-end gap-2">
                    <SbBtn rounded onClick={() => setDeleteId(null)}>Cancelar</SbBtn>
                    <SbBtn variant="danger" rounded onClick={() => deleteId && handleDelete(deleteId)}>
                      Eliminar
                    </SbBtn>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Document Viewer */}
          <DocumentViewer
            open={!!preview}
            onClose={() => setPreview(null)}
            title={preview?.name}
            subtitle={`${formatFileSize(preview?.file_size || 0)} · ${preview?.category}`}
            url={preview?.file_url}
            fileType={preview?.file_type}
            fileName={preview?.name || "documento"}
          />
        </>
      )}
    </AnimatePresence>
  )
}
