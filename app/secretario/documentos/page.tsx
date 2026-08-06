"use client"

import * as React from "react"
import { FileText, Plus, Search, Trash2, CheckCircle2, Clock, XCircle, Download, X, Command, FolderOpen, Eye } from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import { SbBtn, SbModal, SbModalHeader, SbModalBody, SbModalFooter, useToast } from "@/components/ui/sb"
import { generateDocumentPDF, downloadPDF, generateDocumentDOCX, downloadDOCX } from "@/lib/pdf"
import { MiniWordEditor } from "@/components/ui/mini-word-editor"
import { DocumentLibrary } from "@/components/shared/document-library"
import { DocumentViewer } from "@/components/ui/document-viewer"

interface Document {
  id: string; type: string; student_id: string; student_name: string; status: string; notes?: string; created_at: string
}

interface StudentOption { id: string; first_name: string; last_name: string; document_number: string; grade: string; section: string }

const docTypes = [
  "Constancia de Estudios", "Certificado de Notas", "Constancia de Conducta",
  "Constancia de Matrícula", "Certificado de Nacimiento", "Constancia de Good Standing",
  "Carta de Presentación", "Certificado Médico",
]

const statusConfig: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  pending: { label: "Pendiente", color: "text-amber-600", dot: "bg-amber-500", bg: "bg-amber-500/8" },
  approved: { label: "Aprobado", color: "text-emerald-600", dot: "bg-emerald-500", bg: "bg-emerald-500/8" },
  rejected: { label: "Rechazado", color: "text-red-600", dot: "bg-red-500", bg: "bg-red-500/8" },
  ready: { label: "Listo", color: "text-blue-600", dot: "bg-blue-500", bg: "bg-blue-500/8" },
}

const staggerItem = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }
const cardItem = {
  hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -10, filter: "blur(8px)" },
}

export default function DocumentosPage() {
  const [documents, setDocuments] = React.useState<Document[]>([])
  const [loading, setLoading] = React.useState(true)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [deleteConfirm, setDeleteConfirm] = React.useState<Document | null>(null)
  const [search, setSearch] = React.useState("")
  const [searchInput, setSearchInput] = React.useState("")
  const [filterStatus, setFilterStatus] = React.useState("all")
  const [isFocused, setIsFocused] = React.useState(false)
  const [formData, setFormData] = React.useState({ type: "", student_id: "", status: "pending", notes: "", custom_content: "" })
  const [students, setStudents] = React.useState<StudentOption[]>([])
  const [studentSearch, setStudentSearch] = React.useState("")
  const [showEditor, setShowEditor] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [libraryOpen, setLibraryOpen] = React.useState(false)
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [previewBlob, setPreviewBlob] = React.useState<Blob | null>(null)
  const [previewKind, setPreviewKind] = React.useState<"pdf" | "docx">("docx")
  const [previewTitle, setPreviewTitle] = React.useState("")
  const [previewSub, setPreviewSub] = React.useState("")
  const { toast } = useToast()
  const debounceRef = React.useRef<NodeJS.Timeout | undefined>(undefined)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => { fetchDocs(); fetchStudents() }, [])

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/secretario/enrollments")
      if (res.ok) {
        const data = await res.json()
        const unique = new Map<string, StudentOption>()
        data.forEach((e: any) => {
          if (e.student_id && !unique.has(e.student_id)) {
            unique.set(e.student_id, {
              id: e.student_id,
              first_name: e.first_name || "",
              last_name: e.last_name || "",
              document_number: e.document_number || "",
              grade: e.grade || "",
              section: e.section || "",
            })
          }
        })
        setStudents(Array.from(unique.values()))
      }
    } catch {}
  }

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

  React.useEffect(() => () => clearTimeout(debounceRef.current), [])

  const onSearchChange = (val: string) => {
    setSearchInput(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(val), 300)
  }

  const clearSearch = () => { setSearchInput(""); setSearch("") }

  const fetchDocs = async () => {
    try {
      const res = await fetch("/api/secretario/documents")
      if (res.ok) setDocuments(await res.json())
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!formData.type) return
    setSaving(true)
    try {
      const res = await fetch("/api/secretario/documents", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData),
      })
      if (res.ok) { setCreateOpen(false); setFormData({ type: "", student_id: "", status: "pending", notes: "", custom_content: "" }); setStudentSearch(""); setShowEditor(false); fetchDocs(); toast("Documento creado", "success") }
      else { const data = await res.json(); toast(data.error || "Error al crear", "error") }
    } catch (e) { console.error(e); toast("Error de conexión", "error") } finally { setSaving(false) }
  }

  const handleDownloadPDF = async (doc: Document) => {
    try {
      const res = await fetch("/api/secretario/stats")
      const stats = await res.json().catch(() => ({}))
      const instName = stats.institution_name || "Institución Educativa"
      const instCode = stats.institution_code || "IE-001"

      const pdf = generateDocumentPDF({
        type: doc.type,
        student_name: doc.student_name,
        status: doc.status,
        created_at: doc.created_at,
        notes: doc.notes,
        institution: { name: instName, code: instCode },
      })
      const filename = `documento_${doc.type.replace(/\s+/g, '_')}_${new Date(doc.created_at).toISOString().slice(0, 10)}.pdf`
      downloadPDF(pdf, filename)
      toast("PDF descargado", "success")
    } catch (e) {
      console.error(e)
      toast("Error al generar PDF", "error")
    }
  }

  const handleDownloadDOCX = async (doc: Document) => {
    try {
      const res = await fetch("/api/secretario/stats")
      const stats = await res.json().catch(() => ({}))
      const instName = stats.institution_name || "Institución Educativa"
      const instCode = stats.institution_code || "IE-001"

      const blob = await generateDocumentDOCX({
        type: doc.type,
        student_name: doc.student_name,
        status: doc.status,
        created_at: doc.created_at,
        notes: doc.notes,
        institution: { name: instName, code: instCode },
      })
      const filename = `documento_${doc.type.replace(/\s+/g, '_')}_${new Date(doc.created_at).toISOString().slice(0, 10)}.docx`
      await downloadDOCX(blob, filename)
      toast("DOCX descargado", "success")
    } catch (e) {
      console.error(e)
      toast("Error al generar DOCX", "error")
    }
  }

  const handlePreviewDOCX = async (doc: Document) => {
    try {
      const res = await fetch("/api/secretario/stats")
      const stats = await res.json().catch(() => ({}))
      const instName = stats.institution_name || "Institución Educativa"
      const instCode = stats.institution_code || "IE-001"

      const blob = await generateDocumentDOCX({
        type: doc.type,
        student_name: doc.student_name,
        status: doc.status,
        created_at: doc.created_at,
        notes: doc.notes,
        institution: { name: instName, code: instCode },
      })
      setPreviewBlob(blob)
      setPreviewKind("docx")
      setPreviewTitle(doc.type)
      setPreviewSub(`${doc.student_name || "Sin alumno"} · ${new Date(doc.created_at).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}`)
      setPreviewOpen(true)
    } catch (e) {
      console.error(e)
      toast("Error al generar vista previa", "error")
    }
  }

  const handlePreviewPDF = async (doc: Document) => {
    try {
      const res = await fetch("/api/secretario/stats")
      const stats = await res.json().catch(() => ({}))
      const instName = stats.institution_name || "Institución Educativa"
      const instCode = stats.institution_code || "IE-001"

      const pdf = generateDocumentPDF({
        type: doc.type,
        student_name: doc.student_name,
        status: doc.status,
        created_at: doc.created_at,
        notes: doc.notes,
        institution: { name: instName, code: instCode },
      })
      const blob = pdf.output("blob")
      setPreviewBlob(blob)
      setPreviewKind("pdf")
      setPreviewTitle(doc.type)
      setPreviewSub(`${doc.student_name || "Sin alumno"} · ${new Date(doc.created_at).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}`)
      setPreviewOpen(true)
    } catch (e) {
      console.error(e)
      toast("Error al generar vista previa", "error")
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/secretario/documents/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
      })
      if (res.ok) fetchDocs()
    } catch (e) { console.error(e) }
  }

  const deleteDoc = async (id: string) => {
    try {
      const res = await fetch(`/api/secretario/documents/${id}`, { method: "DELETE" })
      if (res.ok) { setDeleteConfirm(null); fetchDocs() }
    } catch (e) { console.error(e) }
  }

  const filtered = documents.filter(d => {
    const matchSearch = !search || d.type.toLowerCase().includes(search.toLowerCase()) ||
      (d.student_name && d.student_name.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = filterStatus === "all" || d.status === filterStatus
    return matchSearch && matchStatus
  })

  const tabs = [
    { id: "all", label: "Todos", count: documents.length },
    { id: "pending", label: "Pendientes", count: documents.filter(d => d.status === "pending").length },
    { id: "approved", label: "Aprobados", count: documents.filter(d => d.status === "approved").length },
    { id: "ready", label: "Listos", count: documents.filter(d => d.status === "ready").length },
  ]

  return (
    <div className="space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Documentos</h1>
            <p className="text-sm text-sb-on-surface-variant/50 mt-1">Gestionar certificados, constancias y documentos</p>
          </div>
          <div className="flex items-center gap-2">
            <SbBtn variant="outlined" rounded className="flex items-center gap-2" onClick={() => setLibraryOpen(true)}>
              <FolderOpen className="h-3.5 w-3.5" />
              Biblioteca
            </SbBtn>
            <SbBtn variant="filled" rounded className="flex items-center gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Nuevo documento
            </SbBtn>
          </div>
        </motion.div>

        {/* Search Bar - Premium */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-4"
        >
          <div className={`bg-sb-surface rounded-2xl transition-all duration-300 ${isFocused ? 'ring-2 ring-sb-on-surface/10 shadow-lg shadow-sb-on-surface/5' : ''}`}>
            <div className="flex items-center gap-2 p-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sb-on-surface-variant/30" />
                <input
                  ref={inputRef}
                  placeholder="Buscar por tipo de documento o nombre del alumno..."
                  value={searchInput}
                  onChange={e => onSearchChange(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="w-full h-12 pl-12 pr-20 bg-transparent text-sm text-sb-on-surface placeholder:text-sb-on-surface-variant/30 focus:outline-none"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {searchInput && (
                    <button
                      onClick={clearSearch}
                      className="h-7 w-7 flex items-center justify-center rounded-lg text-sb-on-surface-variant/30 hover:text-sb-on-surface-variant hover:bg-sb-surface-container transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-sb-surface-container/50 text-sb-on-surface-variant/30">
                    <Command className="h-3 w-3" />
                    <span className="text-[10px] font-medium">K</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs + Results Count */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6"
        >
          <div className="flex gap-1 p-1 bg-sb-surface rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === tab.id
                    ? "bg-sb-on-surface text-sb-surface"
                    : "text-sb-on-surface-variant/60 hover:bg-sb-surface-container"
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 text-[10px] ${filterStatus === tab.id ? "text-sb-surface/60" : "text-sb-on-surface-variant/30"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {(search || filterStatus !== "all") && !loading && (
              <p className="text-xs text-sb-on-surface-variant/40">
                {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
                {search && <> para "<span className="text-sb-on-surface font-medium">{search}</span>"</>}
              </p>
            )}
            {(search || filterStatus !== "all") && (
              <button onClick={() => { clearSearch(); setFilterStatus("all") }} className="text-[10px] text-sb-on-surface-variant/30 hover:text-sb-on-surface-variant/60 transition-colors">
                Limpiar
              </button>
            )}
          </div>
        </motion.div>

        {/* Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-52 bg-sb-surface rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-sb-surface rounded-2xl py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-sb-surface-container flex items-center justify-center mx-auto mb-4">
              <FileText className="h-7 w-7 text-sb-on-surface-variant/20" />
            </div>
            <p className="text-sm font-medium text-sb-on-surface-variant/40">
              {(search || filterStatus !== "all") ? "Sin resultados para esta búsqueda" : "Sin documentos"}
            </p>
            <p className="text-xs text-sb-on-surface-variant/25 mt-1">
              {(search || filterStatus !== "all") ? "Intenta con otros filtros" : "Crea el primer documento"}
            </p>
            {(search || filterStatus !== "all") && (
              <button onClick={() => { clearSearch(); setFilterStatus("all") }} className="mt-3 text-xs text-sb-on-surface hover:underline">
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.04 } } }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            <AnimatePresence>
              {filtered.map((doc) => {
                const st = statusConfig[doc.status] || statusConfig.pending
                return (
                  <motion.div
                    key={doc.id}
                    variants={cardItem}
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="group bg-sb-surface rounded-2xl p-5 hover:shadow-lg hover:shadow-black/5 transition-all duration-300"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${st.bg}`}>
                        <FileText className={`h-5 w-5 ${st.color}`} />
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${st.color} ${st.bg}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="space-y-1.5 mb-5">
                      <h3 className="text-sm font-semibold text-sb-on-surface leading-tight">{doc.type}</h3>
                      {doc.student_name && (
                        <p className="text-xs text-sb-on-surface-variant/50 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-sb-on-surface-variant/20" />
                          {doc.student_name}
                        </p>
                      )}
                      <p className="text-[11px] text-sb-on-surface-variant/40 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-sb-on-surface-variant/20" />
                        {new Date(doc.created_at).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-sb-outline-variant/10">
                      <div className="relative group">
                        <button
                          className="h-9 w-9 flex items-center justify-center rounded-xl text-sb-on-surface-variant/30 hover:text-sb-on-surface hover:bg-sb-surface-container transition-all duration-200"
                          title="Descargar"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <div className="absolute left-0 bottom-full mb-1 bg-sb-surface rounded-xl shadow-lg border border-sb-outline-variant/10 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 w-36">
                          <button
                            onClick={() => handlePreviewDOCX(doc)}
                            className="w-full px-3 py-2 text-left text-xs text-sb-on-surface hover:bg-sb-surface-container-low/50 flex items-center gap-2"
                          >
                            <Eye className="h-3.5 w-3.5 text-sb-primary" />
                            Vista previa
                          </button>
                          <button
                            onClick={() => handlePreviewPDF(doc)}
                            className="w-full px-3 py-2 text-left text-xs text-sb-on-surface hover:bg-sb-surface-container-low/50 flex items-center gap-2"
                          >
                            <Eye className="h-3.5 w-3.5 text-red-500" />
                            Vista previa PDF
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(doc)}
                            className="w-full px-3 py-2 text-left text-xs text-sb-on-surface hover:bg-sb-surface-container-low/50 flex items-center gap-2"
                          >
                            <FileText className="h-3.5 w-3.5 text-red-500" />
                            PDF
                          </button>
                          <button
                            onClick={() => handleDownloadDOCX(doc)}
                            className="w-full px-3 py-2 text-left text-xs text-sb-on-surface hover:bg-sb-surface-container-low/50 flex items-center gap-2"
                          >
                            <FileText className="h-3.5 w-3.5 text-blue-500" />
                            DOCX
                          </button>
                        </div>
                      </div>
                      {doc.status === "pending" && (
                        <>
                          <button
                            onClick={() => updateStatus(doc.id, "approved")}
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium h-9 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 transition-all duration-200"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Aprobar
                          </button>
                          <button
                            onClick={() => updateStatus(doc.id, "rejected")}
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium h-9 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/15 transition-all duration-200"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Rechazar
                          </button>
                        </>
                      )}
                      {doc.status === "approved" && (
                        <button
                          onClick={() => updateStatus(doc.id, "ready")}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium h-9 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/15 transition-all duration-200"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Marcar listo
                        </button>
                      )}
                      {doc.status === "ready" && (
                        <div className="flex-1 text-center text-[11px] text-sb-on-surface-variant/40">
                          Listo para entregar
                        </div>
                      )}
                      {doc.status === "rejected" && (
                        <div className="flex-1 text-center text-[11px] text-sb-on-surface-variant/40">
                          Sin acciones
                        </div>
                      )}
                      <button
                        onClick={() => setDeleteConfirm(doc)}
                        className="h-9 w-9 flex items-center justify-center rounded-xl text-sb-on-surface-variant/30 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Create Modal */}
        <SbModal open={createOpen} onClose={() => setCreateOpen(false)}>
          <SbModalHeader title="Crear Documento" onClose={() => setCreateOpen(false)} />
          <SbModalBody>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2 block">Tipo de Documento *</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="sbf-native-select w-full"
                >
                  <option value="">Seleccionar tipo...</option>
                  {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2 block">Buscar alumno (opcional)</label>
                <input
                  placeholder="Escribir nombre o DNI..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="sb-input rounded-xl text-sm h-10 w-full"
                />
                {studentSearch && students.length > 0 && (
                  <div className="mt-1 max-h-40 overflow-y-auto border border-sb-outline-variant/10 rounded-xl bg-sb-surface">
                    {students
                      .filter(s => {
                        const q = studentSearch.toLowerCase()
                        const name = `${s.first_name} ${s.last_name}`.toLowerCase()
                        return name.includes(q) || s.document_number.includes(q)
                      })
                      .slice(0, 10)
                      .map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, student_id: s.id })
                            setStudentSearch(`${s.first_name} ${s.last_name}`)
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-sb-surface-container-low/50 text-sm transition-colors"
                        >
                          <span className="font-medium">{s.first_name} {s.last_name}</span>
                          <span className="text-xs text-sb-on-surface-variant/40 ml-2">DNI: {s.document_number} | {s.grade}° {s.section}</span>
                        </button>
                      ))}
                  </div>
                )}
                {formData.student_id && (
                  <button
                    type="button"
                    onClick={() => { setFormData({ ...formData, student_id: "" }); setStudentSearch("") }}
                    className="mt-1 text-xs text-sb-on-surface-variant/40 hover:text-sb-on-surface-variant/60"
                  >
                    Limpiar selección
                  </button>
                )}
              </div>
              <div>
                <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2 block">Estado</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="sbf-native-select w-full"
                >
                  <option value="pending">Pendiente</option>
                  <option value="approved">Aprobado</option>
                  <option value="ready">Listo para entregar</option>
                </select>
              </div>

              {/* Custom Content Editor */}
              {formData.type && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditor(!showEditor)}
                    className="flex items-center gap-2 text-xs text-sb-on-surface-variant/50 hover:text-sb-on-surface transition-colors"
                  >
                    <span className={`transition-transform duration-200 ${showEditor ? 'rotate-90' : ''}`}>▶</span>
                    {showEditor ? "Ocultar editor" : "Personalizar contenido del documento"}
                  </button>
                  {showEditor && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3"
                    >
                      <MiniWordEditor
                        content={formData.custom_content}
                        onChange={val => setFormData({ ...formData, custom_content: val })}
                        placeholder="Escribe el contenido personalizado del documento..."
                        minHeight={150}
                      />
                      <p className="text-[10px] text-sb-on-surface-variant/30 mt-1.5">
                        Usa el editor para personalizar el texto. Si lo dejas vacío, se usará el texto predeterminado.
                      </p>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          </SbModalBody>
          <SbModalFooter>
            <SbBtn rounded onClick={() => setCreateOpen(false)}>Cancelar</SbBtn>
            {formData.type && (
              <>
                <SbBtn variant="outlined" rounded onClick={() => handleDownloadPDF({ id: "preview", type: formData.type, student_id: "", student_name: "", status: formData.status, notes: formData.notes, created_at: new Date().toISOString() } as Document)}>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  PDF
                </SbBtn>
                <SbBtn variant="outlined" rounded onClick={() => handleDownloadDOCX({ id: "preview", type: formData.type, student_id: "", student_name: "", status: formData.status, notes: formData.notes, created_at: new Date().toISOString() } as Document)}>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  DOCX
                </SbBtn>
              </>
            )}
            <SbBtn variant="filled" rounded onClick={handleCreate} disabled={saving || !formData.type}>
              {saving ? "Creando..." : "Crear documento"}
            </SbBtn>
          </SbModalFooter>
        </SbModal>

        {/* Delete Confirm */}
        <SbModal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="400px">
          <SbModalHeader title="Eliminar Documento" onClose={() => setDeleteConfirm(null)} />
          <SbModalBody>
            <p className="text-sm text-sb-on-surface-variant/60">
              ¿Eliminar <strong className="text-sb-on-surface">{deleteConfirm?.type}</strong>? Esta acción es irreversible.
            </p>
          </SbModalBody>
          <SbModalFooter>
            <SbBtn rounded onClick={() => setDeleteConfirm(null)}>Cancelar</SbBtn>
            <SbBtn variant="danger" rounded onClick={() => deleteConfirm && deleteDoc(deleteConfirm.id)}>
              Eliminar
            </SbBtn>
          </SbModalFooter>
        </SbModal>

        {/* Document Library */}
        <DocumentLibrary
          open={libraryOpen}
          onClose={() => setLibraryOpen(false)}
          mode="manage"
        />

        {/* Document Viewer */}
        <DocumentViewer
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          title={previewTitle}
          subtitle={previewSub}
          blob={previewBlob}
          kind={previewKind}
          fileName={`${previewTitle.replace(/\s+/g, '_')}.${previewKind === "pdf" ? "pdf" : "docx"}`}
        />
      </div>
  )
}
