"use client"

import * as React from "react"
import { Users, Plus, Search, Eye, Pencil, Trash2, X, Link, UserCheck, ChevronRight, Phone, Mail, MapPin, Briefcase, GraduationCap, Heart, Shield, User, Filter, UserPlus, BookOpen, Command, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle, Loader2 } from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import { SbBtn, SbModal, SbModalHeader, SbModalBody, SbModalFooter, useToast } from "@/components/ui/sb"
import { peruvianOccupations } from "@/lib/occupations"
import { toast as sonnerToast } from "@/hooks/use-toast"

interface Parent {
  id: string; first_name: string; last_name: string; document_type: string; document_number: string;
  email: string | null; phone: string | null; address: string | null; occupation: string | null;
  status: string; created_at: string; has_account: boolean; account_email: string | null; account_status: string | null;
  linked_students: { name: string; relationship: string; id: string; grade: string; section: string }[]
}

interface Student { id: string; first_name: string; last_name: string; document_number: string; grade: string; section: string; shift: string; full_name?: string; dni?: string; grade_level?: string }

const relationships = [
  { value: "padre", label: "Padre", icon: "👨" }, { value: "madre", label: "Madre", icon: "👩" },
  { value: "apoderado", label: "Apoderado", icon: "🛡️" }, { value: "tio", label: "Tío/Tía", icon: "👨‍👩‍👦" },
  { value: "abuelo", label: "Abuelo/a", icon: "👴" }, { value: "hermano", label: "Hermano/a", icon: "👦" },
  { value: "otro", label: "Otro", icon: "👤" },
]

const relationshipColor: Record<string, string> = {
  padre: "bg-blue-500/15 text-blue-600", madre: "bg-pink-500/15 text-pink-600",
  apoderado: "bg-purple-500/15 text-purple-600", tio: "bg-amber-500/15 text-amber-600",
  abuelo: "bg-emerald-500/15 text-emerald-600", hermano: "bg-cyan-500/15 text-cyan-600",
  otro: "bg-gray-500/15 text-gray-600",
}

const relationshipDot: Record<string, string> = {
  padre: "bg-blue-500", madre: "bg-pink-500", apoderado: "bg-purple-500",
  tio: "bg-amber-500", abuelo: "bg-emerald-500", hermano: "bg-cyan-500", otro: "bg-gray-500",
}

function getInitials(name: string) { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) }

function getAvatarColor(name: string) {
  const colors = ["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-amber-500", "bg-pink-500", "bg-cyan-500", "bg-rose-500"]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

const staggerItem = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }
const listItem = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, filter: "blur(8px)", y: -10 },
}

export default function SecretarioPadresPage() {
  const [parents, setParents] = React.useState<Parent[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [searchInput, setSearchInput] = React.useState("")
  const [showFilters, setShowFilters] = React.useState(false)
  const [filterRelationship, setFilterRelationship] = React.useState("all")
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const [isFocused, setIsFocused] = React.useState(false)
  const { toast } = useToast()
  const inputRef = React.useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = React.useState<"individual" | "bulk">("individual")
  const [bulkFile, setBulkFile] = React.useState<File | null>(null)
  const [bulkRows, setBulkRows] = React.useState<any[]>([])
  const [bulkStep, setBulkStep] = React.useState<"upload" | "preview" | "importing" | "done">("upload")
  const [bulkProgress, setBulkProgress] = React.useState(0)
  const [bulkResults, setBulkResults] = React.useState<{ imported: number; skipped: number; errors: number } | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [createOpen, setCreateOpen] = React.useState(false)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [linkOpen, setLinkOpen] = React.useState(false)
  const [credentialsOpen, setCredentialsOpen] = React.useState(false)
  const [generatedCreds, setGeneratedCreds] = React.useState<{ name: string; email: string; password: string } | null>(null)
  const [resetPwdOpen, setResetPwdOpen] = React.useState(false)
  const [newPassword, setNewPassword] = React.useState("")
  const [resetCreds, setResetCreds] = React.useState<{ email: string; password: string } | null>(null)
  const [selected, setSelected] = React.useState<Parent | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [institutionName, setInstitutionName] = React.useState("")
  const [institutionId, setInstitutionId] = React.useState("")

  const [form, setForm] = React.useState({
    first_name: "", last_name: "", document_type: "DNI", document_number: "",
    email: "", phone: "", address: "", occupation: "", password: "",
  })

  const [linkForm, setLinkForm] = React.useState({ student_search: "", student_id: "", relationship: "apoderado" })
  const [studentResults, setStudentResults] = React.useState<Student[]>([])
  const [searchingStudents, setSearchingStudents] = React.useState(false)

  const debounceRef = React.useRef<NodeJS.Timeout | undefined>(undefined)

  React.useEffect(() => { fetchParents(); fetchInstitution() }, [])

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

  const fetchInstitution = async () => {
    try {
      const res = await fetch("/api/auth/institution")
      if (res.ok) { const data = await res.json(); setInstitutionName(data.name || ""); setInstitutionId(data.id || "") }
    } catch {}
  }

  const generateEmail = (firstName: string, lastName: string) => {
    if (!firstName) return ""
    const clean = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "")
    const instCode = institutionName ? clean(institutionName).slice(0, 15) : "colegio"
    const name = clean(firstName)
    const last = clean(lastName.split(" ")[0] || "")
    let email = `${name}.${last}@${instCode}.pe`
    if (email.length > 40) email = `${name.slice(0, 4)}.${last}@${instCode}.pe`
    return email
  }

  const fetchParents = async () => {
    try {
      const res = await fetch(`/api/secretario/parents?q=${encodeURIComponent(search)}`)
      if (res.ok) setParents(await res.json())
    } catch {} finally { setLoading(false) }
  }

  React.useEffect(() => {
    const t = setTimeout(fetchParents, 300)
    return () => clearTimeout(t)
  }, [search])

  const onSearchChange = (val: string) => {
    setSearchInput(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(val), 300)
  }

  React.useEffect(() => () => clearTimeout(debounceRef.current), [])

  const searchStudents = async (q: string) => {
    if (!q.trim()) { setStudentResults([]); return }
    setSearchingStudents(true)
    try {
      const res = await fetch(`/api/secretario/busqueda?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        const normalized = data.map((s: any) => ({
          id: s.id,
          first_name: s.first_name || (s.full_name || '').split(' ')[0] || '',
          last_name: s.last_name || (s.full_name || '').split(' ').slice(1).join(' ') || '',
          document_number: s.document_number || s.dni || '',
          grade: s.grade || s.grade_level || '',
          section: s.section || '',
        }))
        setStudentResults(normalized)
      }
    } catch {} finally { setSearchingStudents(false) }
  }

  const handleCreate = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/secretario/parents", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, institution_id: institutionId, password: form.password || undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        setCreateOpen(false); resetForm()
        const newParent: Parent = { first_name: form.first_name, last_name: form.last_name, document_type: form.document_type, document_number: form.document_number, email: form.email, phone: form.phone, address: form.address, occupation: form.occupation, id: data.id, status: "active", created_at: new Date().toISOString(), has_account: false, account_email: null, account_status: null, linked_students: [] }
        setParents(prev => [newParent, ...prev])
        if (data.generated_email && data.generated_password) {
          setGeneratedCreds({ name: `${form.first_name} ${form.last_name}`, email: data.generated_email, password: data.generated_password })
          setCredentialsOpen(true)
        } else { toast("Padre registrado correctamente", "success") }
      } else { toast(data.error + (data.details ? `: ${data.details}` : "") || "Error al registrar", "error") }
    } catch { toast("Error de conexión", "error") } finally { setSaving(false) }
  }

  const handleUpdate = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/secretario/parents/${selected.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },         body: JSON.stringify({ ...form, password: form.password || undefined }),
      })
      if (res.ok) { setEditOpen(false); setSelected(null); fetchParents() }
    } catch { toast("Error de conexión", "error") } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/secretario/parents/${selected.id}`, { method: "DELETE" })
      if (res.ok) { setDeleteOpen(false); setSelected(null); setParents(prev => prev.filter(p => p.id !== selected.id)); toast("Padre eliminado", "success") }
      else { const data = await res.json(); toast(data.error || "Error al eliminar", "error") }
    } catch { toast("Error de conexión", "error") } finally { setSaving(false) }
  }

  const handleLink = async () => {
    if (!selected || !linkForm.student_id) return
    setSaving(true)
    try {
      const res = await fetch("/api/secretario/parents/link", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parent_id: selected.id, student_id: linkForm.student_id, relationship: linkForm.relationship }),
      })
      if (res.ok) {
        setLinkOpen(false)
        const studentName = studentResults.find(s => s.id === linkForm.student_id)
        if (studentName) {
          const newLink = { name: `${studentName.first_name} ${studentName.last_name}`, relationship: linkForm.relationship, id: studentName.id, grade: studentName.grade, section: studentName.section }
          setParents(prev => prev.map(p => p.id !== selected.id ? p : { ...p, linked_students: [...p.linked_students, newLink] }))
          setSelected(prev => prev ? { ...prev, linked_students: [...prev.linked_students, newLink] } : null)
        }
        setLinkForm({ student_search: "", student_id: "", relationship: "apoderado" })
        toast("Estudiante vinculado", "success")
      } else { const data = await res.json(); toast(data.error || "Error al vincular", "error") }
    } catch { toast("Error de conexión", "error") } finally { setSaving(false) }
  }

  const handleCreateAccount = async (parent: Parent) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/secretario/parents/${parent.id}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_account" }),
      })
      const data = await res.json()
      if (res.ok) {
        setResetCreds({ email: data.email, password: data.generated_password })
        setSelected(prev => prev ? { ...prev, has_account: true, account_email: data.email } : null)
        toast("Cuenta creada correctamente", "success")
        fetchParents()
      } else { toast(data.error || "Error al crear cuenta", "error") }
    } catch { toast("Error de conexión", "error") } finally { setSaving(false) }
  }

  const handleResetPassword = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/secretario/parents/${selected.id}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_password", password: newPassword || undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        setResetPwdOpen(false); setNewPassword("")
        setResetCreds({ email: data.email, password: data.generated_password })
        setSelected(prev => prev ? { ...prev, has_account: true, account_email: data.email } : null)
        fetchParents()
      } else { toast(data.error || "Error al resetear contraseña", "error") }
    } catch { toast("Error de conexión", "error") } finally { setSaving(false) }
  }

  const handleUnlink = async (studentId: string) => {
    if (!selected) return
    try {
      const res = await fetch(`/api/secretario/parents/link?parent_id=${selected.id}&student_id=${studentId}`, { method: "DELETE" })
      if (res.ok) {
        setParents(prev => prev.map(p => p.id !== selected.id ? p : { ...p, linked_students: p.linked_students.filter(s => s.id !== studentId) }))
        setSelected(prev => prev ? { ...prev, linked_students: prev.linked_students.filter(s => s.id !== studentId) } : null)
        toast("Estudiante desvinculado", "success")
      } else { const data = await res.json(); toast(data.error || "Error al desvincular", "error") }
    } catch { toast("Error de conexión", "error") }
  }

  const resetForm = () => setForm({ first_name: "", last_name: "", document_type: "DNI", document_number: "", email: "", phone: "", address: "", occupation: "", password: "" })

  const openEdit = (p: Parent) => {
    setSelected(p)
    setForm({ first_name: p.first_name, last_name: p.last_name, document_type: p.document_type, document_number: p.document_number, email: p.email || "", phone: p.phone || "", address: p.address || "", occupation: p.occupation || "", password: "" })
    setEditOpen(true)
  }

  const totalStudents = parents.reduce((acc, p) => acc + p.linked_students.length, 0)
  const activeParents = parents.filter(p => p.status === 'active').length

  const filtered = parents.filter(p => {
    if (filterRelationship === "all") return true
    return p.linked_students.some(s => s.relationship === filterRelationship)
  })

  // Bulk import helpers para padres
  const parsePadresCSV = (text: string) => {
    const lines = text.split("\n").filter(l => l.trim())
    if (lines.length < 2) return []
    const dataLines = lines.slice(1)
    return dataLines.map((line, idx) => {
      const cells: string[] = []
      let cur = ""; let inQ = false
      for (const ch of line) { if (ch === '"') inQ = !inQ; else if (ch === ',' && !inQ) { cells.push(cur.trim()); cur = "" } else cur += ch }
      cells.push(cur.trim())
      const row: any = {
        row: idx + 2,
        parent_name: cells[0] || "", parent_dni: cells[1] || "", parent_phone: cells[2] || "", parent_email: cells[3] || "",
        student_name: cells[4] || "", student_dni: cells[5] || "", relationship: (cells[6] || "apoderado").toLowerCase(),
        grade: cells[7] || "", section: cells[8] || "",
        valid: true, errors: [] as string[], skipped: false,
      }
      if (!row.parent_name) row.errors.push("Nombre del padre requerido")
      if (!row.parent_dni || row.parent_dni.length < 8) row.errors.push("DNI padre inválido")
      if (!["padre","madre","apoderado","tio","abuelo","hermano","otro"].includes(row.relationship)) row.relationship = "apoderado"
      row.valid = row.errors.length === 0
      return row
    })
  }
  const handlePadresFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setBulkFile(file)
    const text = await file.text()
    const rows = parsePadresCSV(text)
    // detectar duplicados dentro del archivo por DNI padre
    const seen = new Set<string>(); const marked = rows.map((r:any) => {
      if (!r.valid) return r
      if (seen.has(r.parent_dni)) return { ...r, skipped: true, errors: [...r.errors, "DNI repetido en archivo"], valid: false }
      seen.add(r.parent_dni); return r
    })
    setBulkRows(marked); setBulkStep("preview")
  }
  const handlePadresBulkImport = async () => {
    setBulkStep("importing"); setBulkProgress(0)
    const importable = bulkRows.filter((r:any) => r.valid && !r.skipped)
    let imported = 0, skipped = 0, errors = 0
    for (let i = 0; i < importable.length; i++) {
      setBulkProgress(Math.round(((i+1)/importable.length)*100))
      const r = importable[i]
      const [first, ...rest] = r.parent_name.trim().split(/\s+/)
      const last = rest.join(" ") || "-"
      // buscar student_id por DNI si se proporcionó
      let student_id: string | undefined
      if (r.student_dni) {
        try {
          const sRes = await fetch(`/api/secretario/busqueda?q=${encodeURIComponent(r.student_dni)}`)
          if (sRes.ok) { const arr = await sRes.json(); const hit = arr.find((s:any) => (s.document_number||s.dni) === r.student_dni); if (hit) student_id = hit.id }
        } catch {}
      }
      try {
        const res = await fetch("/api/secretario/parents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ first_name: first, last_name: last, document_number: r.parent_dni, phone: r.parent_phone, email: r.parent_email || undefined, student_id, relationship: r.relationship }) })
        if (res.ok) imported++; else { const d = await res.json().catch(()=>({})); if (res.status===409) skipped++; else errors++ }
      } catch { errors++ }
      await new Promise(r2 => setTimeout(r2, 40))
    }
    setBulkResults({ imported, skipped, errors }); setBulkStep("done"); fetchParents()
  }
  const downloadPadresTemplate = () => {
    const header = "Nombre Padre,DNI Padre,Telefono,Email,Nombre Alumno,DNI Alumno,Parentesco,Grado,Seccion"
    const sample = "Juan Perez,12345678,999888777,,Maria Perez,87654321,padre,1ro Primaria,A"
    const blob = new Blob([header+"\n"+sample], { type: "text/csv" })
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "plantilla_padres.csv"; a.click()
  }
  const resetPadresBulk = () => { setBulkFile(null); setBulkRows([]); setBulkStep("upload"); setBulkProgress(0); setBulkResults(null); if(fileInputRef.current) fileInputRef.current.value="" }

  return (
    <div className="space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2"
        >
          <div>
            <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Padres y Apoderados</h1>
            <p className="text-sm text-sb-on-surface-variant/50 mt-1">Gestionar el vínculo familiar de los estudiantes</p>
          </div>
          {activeTab === "individual" ? (
            <SbBtn variant="filled" rounded className="flex items-center gap-2" onClick={() => { resetForm(); setCreateOpen(true) }}>
              <Plus className="h-3.5 w-3.5" />
              Nuevo padre
            </SbBtn>
          ) : (
            <SbBtn variant="filled" rounded className="flex items-center gap-2" onClick={downloadPadresTemplate}>
              <Download className="h-4 w-4" /> Descargar Plantilla
            </SbBtn>
          )}
        </motion.div>

        {/* Tabs como Matrículas */}
        <div className="flex gap-1 p-1 bg-sb-surface-container rounded-xl mb-2">
          <button onClick={() => setActiveTab("individual")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab==="individual" ? "bg-sb-on-surface text-sb-surface" : "text-sb-on-surface-variant/60 hover:text-sb-on-surface"}`}>
            <User className="h-4 w-4" /> Carga Individual
          </button>
          <button onClick={() => setActiveTab("bulk")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab==="bulk" ? "bg-sb-on-surface text-sb-surface" : "text-sb-on-surface-variant/60 hover:text-sb-on-surface"}`}>
            <FileSpreadsheet className="h-4 w-4" /> Carga Masiva
          </button>
        </div>
        {activeTab === "bulk" ? (
          <div className="bg-sb-surface rounded-2xl overflow-hidden">
            {bulkStep === "upload" && (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-sb-surface-container-high flex items-center justify-center mx-auto mb-4"><Upload className="h-8 w-8 text-sb-on-surface-variant/40" /></div>
                <h3 className="text-lg font-medium text-sb-on-surface mb-2">Importar padres desde Excel</h3>
                <p className="text-sm text-sb-on-surface-variant/50 mb-6 max-w-md mx-auto">Sube un CSV con columnas: Nombre Padre, DNI Padre, Teléfono, Email, Nombre Alumno, DNI Alumno, Parentesco, Grado, Sección. Si el alumno ya existe se vinculará automáticamente.</p>
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handlePadresFileSelect} className="hidden" />
                <div className="flex gap-3 justify-center">
                  <SbBtn variant="filled" rounded onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4 mr-2" /> Seleccionar Archivo</SbBtn>
                  <SbBtn variant="tonal" rounded onClick={downloadPadresTemplate}><Download className="h-4 w-4 mr-2" /> Plantilla</SbBtn>
                </div>
              </div>
            )}
            {bulkStep === "preview" && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3"><p className="text-sm font-medium">{bulkFile?.name} — {bulkRows.length} filas</p><button onClick={resetPadresBulk} className="text-xs text-sb-on-surface-variant/50">Cambiar archivo</button></div>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm"><thead className="sticky top-0 bg-sb-surface"><tr className="border-b"><th className="text-left py-2 px-2 text-[10px] uppercase">Fila</th><th className="text-left py-2 px-2 text-[10px] uppercase">Padre</th><th className="text-left py-2 px-2 text-[10px] uppercase">DNI</th><th className="text-left py-2 px-2 text-[10px] uppercase">Alumno</th><th className="text-left py-2 px-2 text-[10px] uppercase">Estado</th></tr></thead>
                  <tbody>{bulkRows.map((r:any,i:number)=>(<tr key={i} className={`border-b ${!r.valid? "bg-red-500/5": r.skipped? "opacity-60":""}`}><td className="py-2 px-2 font-mono text-xs">{r.row}</td><td className="py-2 px-2">{r.parent_name}</td><td className="py-2 px-2">{r.parent_dni}</td><td className="py-2 px-2">{r.student_name||"—"} {r.relationship && <span className="text-xs text-sb-on-surface-variant/50">({r.relationship})</span>}</td><td className="py-2 px-2">{!r.valid? <span className="text-red-400 text-xs">{r.errors.join(", ")}</span> : r.skipped? <span className="text-amber-400 text-xs">Omitido</span> : <span className="text-emerald-400 text-xs">Listo</span>}</td></tr>))}</tbody></table>
                </div>
                <div className="flex justify-end gap-2 mt-4"><SbBtn rounded onClick={resetPadresBulk}>Cancelar</SbBtn><SbBtn variant="filled" rounded onClick={handlePadresBulkImport} disabled={bulkRows.filter((r:any)=>r.valid&&!r.skipped).length===0}>Importar {bulkRows.filter((r:any)=>r.valid&&!r.skipped).length} padres</SbBtn></div>
              </div>
            )}
            {bulkStep === "importing" && (<div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" /><p className="text-sm">Importando... {bulkProgress}%</p><div className="w-full h-2 bg-sb-surface-container rounded-full mt-3"><div className="h-2 bg-sb-primary rounded-full transition-all" style={{width: bulkProgress+"%"}} /></div></div>)}
            {bulkStep === "done" && bulkResults && (<div className="p-8 text-center"><CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-3" /><p className="font-medium">Importación completada</p><p className="text-sm text-sb-on-surface-variant/50 mt-1">{bulkResults.imported} importados · {bulkResults.skipped} omitidos · {bulkResults.errors} errores</p><SbBtn variant="filled" rounded className="mt-4" onClick={resetPadresBulk}>Nueva importación</SbBtn></div>)}
          </div>
        ) : (
          <>
        

        {/* Stats */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
        >
          {[
            { label: "Total padres", value: parents.length, icon: Users, color: "text-sb-on-surface", bg: "bg-sb-on-surface/8" },
            { label: "Activos", value: activeParents, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-500/8" },
            { label: "Estudiantes vinculados", value: totalStudents, icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-500/8" },
            { label: "Sin vincular", value: parents.filter(p => p.linked_students.length === 0).length, icon: Heart, color: "text-amber-600", bg: "bg-amber-500/8" },
          ].map((s) => {
            const Icon = s.icon
            return (
              <motion.div key={s.label} variants={staggerItem} className="bg-sb-surface rounded-2xl p-4">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-3 ${s.bg}`}>
                  <Icon className={`h-4.5 w-4.5 ${s.color}`} />
                </div>
                <p className="text-xl font-bold tracking-tight text-sb-on-surface">{s.value}</p>
                <p className="text-[11px] text-sb-on-surface-variant/45 mt-0.5">{s.label}</p>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Search + Filter */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <div className={`bg-sb-surface rounded-2xl transition-all duration-300 ${isFocused ? 'ring-2 ring-sb-on-surface/10 shadow-lg shadow-sb-on-surface/5' : ''}`}>
            <div className="flex items-center gap-2 p-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sb-on-surface-variant/30" />
                <input
                  ref={inputRef}
                  placeholder="Buscar por nombre, DNI o teléfono..."
                  value={searchInput}
                  onChange={e => onSearchChange(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="w-full h-12 pl-12 pr-20 bg-transparent text-sm text-sb-on-surface placeholder:text-sb-on-surface-variant/30 focus:outline-none"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {searchInput && (
                    <button
                      onClick={() => { setSearchInput(""); setSearch("") }}
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
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`h-10 px-4 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
                  showFilters || filterRelationship !== "all"
                    ? "bg-sb-on-surface text-sb-surface"
                    : "bg-sb-surface-container text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high"
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                Filtros
                {filterRelationship !== "all" && (
                  <span className="h-4 w-4 rounded-full bg-sb-on-surface/20 text-[9px] font-bold flex items-center justify-center">1</span>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-sb-surface rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">Parentesco</p>
                  {filterRelationship !== "all" && (
                    <button onClick={() => setFilterRelationship("all")} className="text-[10px] text-sb-on-surface hover:underline">
                      Limpiar
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setFilterRelationship("all")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      filterRelationship === "all" ? "bg-sb-on-surface text-sb-surface" : "bg-sb-surface-container text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high"
                    }`}
                  >
                    Todos
                  </button>
                  {relationships.map(r => (
                    <button
                      key={r.value}
                      onClick={() => setFilterRelationship(r.value)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all inline-flex items-center gap-1.5 ${
                        filterRelationship === r.value ? "bg-sb-on-surface text-sb-surface" : "bg-sb-surface-container text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${relationshipDot[r.value]}`} />
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Count */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-sb-on-surface-variant/40">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
              {search && <> para "<span className="text-sb-on-surface font-medium">{search}</span>"</>}
            </p>
            {(search || filterRelationship !== "all") && (
              <button onClick={() => { setSearchInput(""); setSearch(""); setFilterRelationship("all") }} className="text-[10px] text-sb-on-surface-variant/30 hover:text-sb-on-surface-variant/60 transition-colors">
                Limpiar
              </button>
            )}
          </div>
        )}

        {/* Parents List */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-28 bg-sb-surface rounded-2xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-sb-surface rounded-2xl py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-sb-surface-container flex items-center justify-center mx-auto mb-4">
                <Users className="h-7 w-7 text-sb-on-surface-variant/20" />
              </div>
              <p className="text-sm font-medium text-sb-on-surface-variant/40">
                {(search || filterRelationship !== "all") ? "Sin resultados para esta búsqueda" : "No hay padres registrados"}
              </p>
              {(search || filterRelationship !== "all") && (
                <button onClick={() => { setSearchInput(""); setSearch(""); setFilterRelationship("all") }} className="mt-3 text-xs text-sb-on-surface hover:underline">
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <AnimatePresence>
              {filtered.map((parent) => {
                const isExpanded = expandedId === parent.id
                const initials = getInitials(parent.first_name + " " + parent.last_name)
                const avatarColor = getAvatarColor(parent.first_name + parent.last_name)
                return (
                  <motion.div
                    key={parent.id}
                    layout
                    variants={listItem}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="bg-sb-surface rounded-2xl overflow-hidden"
                  >
                    {/* Main Row */}
                    <div
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-sb-surface-container-low/50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : parent.id)}
                    >
                      <div className={`h-11 w-11 rounded-2xl ${avatarColor} flex items-center justify-center shrink-0`}>
                        <span className="text-sm font-bold text-white">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sb-on-surface truncate">{parent.first_name} {parent.last_name}</span>
                          {parent.linked_students.length > 0 && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                              {parent.linked_students.length} hijo{parent.linked_students.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-sb-on-surface-variant/40 flex items-center gap-1">
                            <Shield className="w-3 h-3" /> {parent.document_type}: {parent.document_number}
                          </span>
                          {parent.phone && (
                            <span className="text-[10px] text-sb-on-surface-variant/40 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {parent.phone}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {parent.linked_students.slice(0, 3).map((s, i) => (
                            <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded-full ${relationshipColor[s.relationship] || "bg-gray-500/15 text-gray-600"}`}>
                              {s.name.split(" ")[0]}
                            </span>
                          ))}
                          {parent.linked_students.length > 3 && (
                            <span className="text-[10px] text-sb-on-surface-variant/30">+{parent.linked_students.length - 3}</span>
                          )}
                        </div>
                      </div>
                      <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronRight className="w-5 h-5 text-sb-on-surface-variant/30" />
                      </motion.div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="h-px bg-sb-outline-variant/15 mx-4" />
                          <div className="px-4 pt-3 pb-1">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                              {parent.email && (
                                <div className="flex items-center gap-1.5 text-[10px] text-sb-on-surface-variant/40">
                                  <Mail className="w-3 h-3 shrink-0" /> <span className="truncate">{parent.email}</span>
                                </div>
                              )}
                              {parent.address && (
                                <div className="flex items-center gap-1.5 text-[10px] text-sb-on-surface-variant/40">
                                  <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{parent.address}</span>
                                </div>
                              )}
                              {parent.occupation && (
                                <div className="flex items-center gap-1.5 text-[10px] text-sb-on-surface-variant/40">
                                  <Briefcase className="w-3 h-3 shrink-0" /> <span className="truncate">{parent.occupation}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <span className={`w-1.5 h-1.5 rounded-full ${parent.status === "active" ? "bg-emerald-500" : "bg-red-500"}`} />
                                <span className="text-sb-on-surface-variant/40">{parent.status === "active" ? "Activo" : "Inactivo"}</span>
                              </div>
                            </div>
                          </div>
                          <div className="px-4 pb-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">Estudiantes vinculados</p>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={e => { e.stopPropagation(); setSelected(parent); setLinkOpen(true) }}
                                  className="sb-btn rounded-lg text-[11px] py-1.5 px-3"
                                >
                                  <Link className="w-3 h-3 mr-1" /> Vincular
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); setSelected(parent); setDetailOpen(true) }}
                                  className="h-7 w-7 flex items-center justify-center rounded-lg text-sb-on-surface-variant/40 hover:text-sb-on-surface hover:bg-sb-surface-container transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); openEdit(parent) }}
                                  className="h-7 w-7 flex items-center justify-center rounded-lg text-sb-on-surface-variant/40 hover:text-sb-on-surface hover:bg-sb-surface-container transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); setSelected(parent); setDeleteOpen(true) }}
                                  className="h-7 w-7 flex items-center justify-center rounded-lg text-sb-on-surface-variant/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {parent.linked_students.length === 0 ? (
                              <div className="text-center py-8 px-4 rounded-2xl bg-sb-surface-container/30 border border-dashed border-sb-outline-variant/30">
                                <UserPlus className="w-10 h-10 text-sb-on-surface-variant/15 mx-auto mb-3" />
                                <p className="text-sm font-medium text-sb-on-surface/70 mb-1">Sin estudiantes vinculados</p>
                                <p className="text-xs text-sb-on-surface-variant/40 mb-4">Vincula un estudiante para ver su información</p>
                                <button
                                  onClick={e => { e.stopPropagation(); setSelected(parent); setLinkOpen(true) }}
                                  className="sb-btn rounded-xl text-xs"
                                >
                                  <Link className="w-3.5 h-3.5 mr-1.5" /> Vincular estudiante
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {parent.linked_students.map((student, i) => (
                                  <div key={i} className="flex items-center gap-3 bg-sb-surface-container/50 rounded-xl px-3 py-2.5 group hover:bg-sb-surface-container/80 transition-colors">
                                    <div className={`h-8 w-8 rounded-xl ${getAvatarColor(student.name)} flex items-center justify-center shrink-0`}>
                                      <span className="text-[10px] font-bold text-white">{getInitials(student.name)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-sb-on-surface truncate">{student.name}</p>
                                      <p className="text-[11px] text-sb-on-surface-variant/50">{student.grade} — {student.section}</p>
                                    </div>
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full ${relationshipColor[student.relationship] || "bg-gray-500/15 text-gray-600"}`}>
                                      {student.relationship}
                                    </span>
                                    <button
                                      onClick={e => { e.stopPropagation(); handleUnlink(student.id) }}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-500"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>
          </>
        )}
      {/* ===== CREATE MODAL ===== */}
      <SbModal open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="520px">
        <SbModalHeader title="Nuevo Padre / Apoderado" onClose={() => setCreateOpen(false)} />
        <SbModalBody>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Nombre *</label>
              <input placeholder="Juan" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="sb-input rounded-xl text-sm h-10 w-full" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Apellido *</label>
              <input placeholder="Pérez" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className="sb-input rounded-xl text-sm h-10 w-full" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Tipo de documento</label>
              <select value={form.document_type} onChange={e => setForm({ ...form, document_type: e.target.value })} className="sbf-native-select w-full">
                <option value="DNI">DNI</option><option value="CE">Carné de Extranjería</option><option value="PASSPORT">Pasaporte</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">N° Documento *</label>
              <input placeholder="45678912" value={form.document_number} onChange={e => setForm({ ...form, document_number: e.target.value })} className="sb-input rounded-xl text-sm h-10 w-full" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Teléfono</label>
              <input placeholder="999 888 777" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="sb-input rounded-xl text-sm h-10 w-full" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Email</label>
              <div className="flex gap-2">
                <input type="email" className="sb-input rounded-xl text-sm h-10 flex-1" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                {form.first_name && (
                  <button type="button" onClick={() => setForm({ ...form, email: generateEmail(form.first_name, form.last_name) })} className="sb-btn rounded-xl text-xs whitespace-nowrap">
                    Auto
                  </button>
                )}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Dirección</label>
              <input placeholder="Av. Principal 123" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="sb-input rounded-xl text-sm h-10 w-full" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Ocupación</label>
              <input placeholder="Seleccionar ocupación..." value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })} className="sb-input rounded-xl text-sm h-10 w-full" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Contraseña de acceso</label>
              <input
                type="text"
                placeholder="Dejar vacío para generar automáticamente"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="sb-input rounded-xl text-sm h-10 w-full"
              />
              <p className="text-[10px] text-sb-on-surface-variant/30 mt-1">Si se deja vacío, se generará una contraseña automática tipo "padre-xxxx-xxxx"</p>
            </div>
          </motion.div>
        </SbModalBody>
        <SbModalFooter>
          <SbBtn rounded onClick={() => setCreateOpen(false)}>Cancelar</SbBtn>
          <SbBtn variant="filled" rounded onClick={handleCreate} disabled={saving}>{saving ? "Guardando..." : "Registrar"}</SbBtn>
        </SbModalFooter>
      </SbModal>

      {/* ===== DETAIL MODAL ===== */}
      <SbModal open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="520px">
        {selected && (
          <>
            <SbModalHeader title="" onClose={() => setDetailOpen(false)} />
            <SbModalBody>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`h-14 w-14 rounded-2xl ${getAvatarColor(selected.first_name + selected.last_name)} flex items-center justify-center`}>
                      <span className="text-base font-bold text-white">{getInitials(selected.first_name + " " + selected.last_name)}</span>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-sb-on-surface">{selected.first_name} {selected.last_name}</p>
                      <p className="text-xs text-sb-on-surface-variant/50 mt-0.5">{selected.document_type}: {selected.document_number}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${selected.status === "active" ? "text-emerald-600 bg-emerald-500/8" : "text-sb-on-surface-variant/50 bg-sb-surface-container"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${selected.status === "active" ? "bg-emerald-500" : "bg-sb-on-surface-variant/30"}`} />
                    {selected.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  {selected.phone && (
                    <div className="flex items-center gap-3 bg-sb-surface-container/50 rounded-xl px-3 py-2.5">
                      <Phone className="h-4 w-4 text-sb-on-surface-variant/40 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-sb-on-surface-variant/40">Teléfono</p>
                        <p className="text-sm text-sb-on-surface truncate">{selected.phone}</p>
                      </div>
                    </div>
                  )}
                  {selected.email && (
                    <div className="flex items-center gap-3 bg-sb-surface-container/50 rounded-xl px-3 py-2.5">
                      <Mail className="h-4 w-4 text-sb-on-surface-variant/40 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-sb-on-surface-variant/40">Email</p>
                        <p className="text-sm text-sb-on-surface truncate">{selected.email}</p>
                      </div>
                    </div>
                  )}
                  {selected.address && (
                    <div className="flex items-center gap-3 bg-sb-surface-container/50 rounded-xl px-3 py-2.5">
                      <MapPin className="h-4 w-4 text-sb-on-surface-variant/40 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-sb-on-surface-variant/40">Dirección</p>
                        <p className="text-sm text-sb-on-surface truncate">{selected.address}</p>
                      </div>
                    </div>
                  )}
                  {selected.occupation && (
                    <div className="flex items-center gap-3 bg-sb-surface-container/50 rounded-xl px-3 py-2.5">
                      <Briefcase className="h-4 w-4 text-sb-on-surface-variant/40 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-sb-on-surface-variant/40">Ocupación</p>
                        <p className="text-sm text-sb-on-surface truncate">{selected.occupation}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-sb-surface-container/50 rounded-2xl p-4 mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">Cuenta de acceso</p>
                    {selected.has_account ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Tiene cuenta
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Sin cuenta
                      </span>
                    )}
                  </div>
                  {selected.has_account ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 bg-sb-surface rounded-xl px-3 py-2.5">
                        <Mail className="h-4 w-4 text-sb-on-surface-variant/40 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-sb-on-surface-variant/40">Email de acceso</p>
                          <p className="text-sm text-sb-on-surface truncate">{selected.account_email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setResetPwdOpen(true) }}
                        className="sb-btn rounded-xl text-xs w-full"
                      >
                        <Shield className="w-3.5 h-3.5 mr-1.5" /> Resetear contraseña
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-xs text-sb-on-surface-variant/40 mb-3">Este padre no tiene cuenta de acceso al portal</p>
                      <SbBtn
                        variant="filled"
                        rounded
                        onClick={() => handleCreateAccount(selected)}
                        disabled={saving}
                        className="text-xs"
                      >
                        <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Crear cuenta de acceso
                      </SbBtn>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">Estudiantes vinculados</p>
                    <button onClick={() => { setDetailOpen(false); setLinkOpen(true) }} className="sb-btn rounded-lg text-[11px] py-1.5 px-3">
                      <Link className="w-3 h-3 mr-1" /> Vincular
                    </button>
                  </div>
                  {selected.linked_students.length === 0 ? (
                    <div className="text-center py-8 rounded-xl border border-dashed border-sb-outline-variant/30">
                      <User className="h-8 w-8 mx-auto mb-2 text-sb-on-surface-variant/20" />
                      <p className="text-sm text-sb-on-surface-variant/40">Sin estudiantes vinculados</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selected.linked_students.map((s, i) => (
                        <div key={i} className="flex items-center gap-3 bg-sb-surface-container/50 rounded-xl px-3 py-3">
                          <div className={`h-10 w-10 rounded-xl ${getAvatarColor(s.name)} flex items-center justify-center shrink-0`}>
                            <span className="text-xs font-bold text-white">{getInitials(s.name)}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-sb-on-surface">{s.name}</p>
                            <p className="text-xs text-sb-on-surface-variant/50">{s.grade} — {s.section}</p>
                          </div>
                          <span className={`text-[10px] px-2.5 py-1 rounded-full ${relationshipColor[s.relationship]}`}>{s.relationship}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </SbModalBody>
          </>
        )}
      </SbModal>

      {/* ===== EDIT MODAL ===== */}
      <SbModal open={editOpen} onClose={() => setEditOpen(false)} maxWidth="520px">
        <SbModalHeader title="Editar Padre / Apoderado" onClose={() => setEditOpen(false)} />
        <SbModalBody>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Nombre *</label>
              <input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="sb-input rounded-xl text-sm h-10 w-full" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Apellido *</label>
              <input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className="sb-input rounded-xl text-sm h-10 w-full" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Tipo de documento</label>
              <select value={form.document_type} onChange={e => setForm({ ...form, document_type: e.target.value })} className="sbf-native-select w-full">
                <option value="DNI">DNI</option><option value="CE">CE</option><option value="PASSPORT">Pasaporte</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">N° Documento *</label>
              <input value={form.document_number} onChange={e => setForm({ ...form, document_number: e.target.value })} className="sb-input rounded-xl text-sm h-10 w-full" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Teléfono</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="sb-input rounded-xl text-sm h-10 w-full" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="sb-input rounded-xl text-sm h-10 w-full" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Dirección</label>
              <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="sb-input rounded-xl text-sm h-10 w-full" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Ocupación</label>
              <input value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })} className="sb-input rounded-xl text-sm h-10 w-full" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Nueva contraseña (opcional)</label>
              <input
                type="text"
                placeholder="Dejar vacío para mantener la actual"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="sb-input rounded-xl text-sm h-10 w-full"
              />
            </div>
          </motion.div>
        </SbModalBody>
        <SbModalFooter>
          <SbBtn rounded onClick={() => setEditOpen(false)}>Cancelar</SbBtn>
          <SbBtn variant="filled" rounded onClick={handleUpdate} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</SbBtn>
        </SbModalFooter>
      </SbModal>

      {/* ===== LINK MODAL ===== */}
      <SbModal open={linkOpen} onClose={() => { setLinkOpen(false); setLinkForm({ student_search: "", student_id: "", relationship: "apoderado" }) }} maxWidth="480px">
        {selected && (
          <>
            <SbModalHeader title="Vincular Estudiante" onClose={() => { setLinkOpen(false); setLinkForm({ student_search: "", student_id: "", relationship: "apoderado" }) }} />
            <SbModalBody>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div>
                  <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Apoderado</label>
                  <div className="flex items-center gap-2 bg-sb-surface-container rounded-xl px-3 py-2">
                    <div className={`h-8 w-8 rounded-xl ${getAvatarColor(selected.first_name + selected.last_name)} flex items-center justify-center shrink-0`}>
                      <span className="text-[10px] font-bold text-white">{getInitials(selected.first_name + " " + selected.last_name)}</span>
                    </div>
                    <span className="text-sm text-sb-on-surface">{selected.first_name} {selected.last_name}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Buscar estudiante</label>
                  <input
                    placeholder="Nombre o DNI del estudiante..."
                    value={linkForm.student_search}
                    onChange={e => { setLinkForm({ ...linkForm, student_search: e.target.value, student_id: "" }); searchStudents(e.target.value) }}
                    className="sb-input rounded-xl text-sm h-10 w-full"
                  />
                  {searchingStudents && <p className="text-[11px] text-sb-on-surface-variant/40 mt-1">Buscando...</p>}
                  {studentResults.length > 0 && (
                    <div className="mt-2 bg-sb-surface-container rounded-xl max-h-48 overflow-y-auto">
                      {studentResults.map(s => (
                        <button
                          key={s.id}
                          onClick={() => { setLinkForm({ ...linkForm, student_id: s.id, student_search: `${s.first_name} ${s.last_name}` }); setStudentResults([]) }}
                          className="w-full text-left px-3 py-2.5 text-sm hover:bg-sb-surface transition-colors flex items-center gap-3"
                        >
                          <div className={`h-8 w-8 rounded-xl ${getAvatarColor(s.first_name + s.last_name)} flex items-center justify-center shrink-0`}>
                            <span className="text-[10px] font-bold text-white">{getInitials(s.first_name + " " + s.last_name)}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-sb-on-surface">{s.first_name} {s.last_name}</p>
                            <p className="text-[11px] text-sb-on-surface-variant/50">DNI: {s.document_number} — {s.grade} {s.section} — Turno: {s.shift || "—"}</p>
                          </div>
                          {linkForm.student_id === s.id && <span className="text-emerald-600 text-xs font-medium">Seleccionado</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2 block">Parentesco</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {relationships.map(r => (
                      <button
                        key={r.value}
                        onClick={() => setLinkForm({ ...linkForm, relationship: r.value })}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-[11px] font-medium transition-all ${
                          linkForm.relationship === r.value ? "bg-sb-on-surface text-sb-surface scale-105" : "bg-sb-surface-container text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high"
                        }`}
                      >
                        <span className="text-lg">{r.icon}</span>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </SbModalBody>
            <SbModalFooter>
              <SbBtn rounded onClick={() => { setLinkOpen(false); setLinkForm({ student_search: "", student_id: "", relationship: "apoderado" }) }}>Cancelar</SbBtn>
              <SbBtn variant="filled" rounded onClick={handleLink} disabled={saving || !linkForm.student_id}>{saving ? "Vinculando..." : "Vincular"}</SbBtn>
            </SbModalFooter>
          </>
        )}
      </SbModal>

      {/* ===== CREDENTIALS MODAL ===== */}
      <SbModal open={credentialsOpen} onClose={() => setCredentialsOpen(false)} maxWidth="460px">
        {generatedCreds && (
          <>
            <SbModalBody>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-sb-on-surface">Padre registrado</p>
                    <p className="text-xs text-sb-on-surface-variant/50">Entrega estas credenciales al apoderado</p>
                  </div>
                </div>

                <div className="bg-sb-surface-container/50 rounded-2xl p-4 space-y-3">
                  <div>
                    <p className="text-[10px] text-sb-on-surface-variant/40">Apoderado</p>
                    <p className="text-sm font-semibold text-sb-on-surface mt-0.5">{generatedCreds.name}</p>
                  </div>
                  <div className="h-px bg-sb-outline-variant/10" />
                  <div>
                    <p className="text-[10px] text-sb-on-surface-variant/40">Email de acceso</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-sb-surface px-3 py-1.5 rounded-lg flex-1 truncate">{generatedCreds.email}</code>
                      <button onClick={() => { navigator.clipboard.writeText(generatedCreds.email); toast("Email copiado", "success") }} className="sb-btn rounded-lg text-xs h-8">Copiar</button>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-sb-on-surface-variant/40">Contraseña</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-sb-surface px-3 py-1.5 rounded-lg flex-1 font-mono">{generatedCreds.password}</code>
                      <button onClick={() => { navigator.clipboard.writeText(generatedCreds.password); toast("Contraseña copiada", "success") }} className="sb-btn rounded-lg text-xs h-8">Copiar</button>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/8 border border-amber-500/15 rounded-xl px-4 py-3 mt-4">
                  <p className="text-xs text-amber-600 flex items-start gap-2">
                    <span className="text-base shrink-0">⚠️</span>
                    <span>El padre podrá iniciar sesión en el portal con estas credenciales para ver la información académica de sus hijos.</span>
                  </p>
                </div>
              </motion.div>
            </SbModalBody>
            <SbModalFooter>
              <SbBtn rounded onClick={() => {
                const text = `Apoderado: ${generatedCreds.name}\nEmail: ${generatedCreds.email}\nContraseña: ${generatedCreds.password}`
                navigator.clipboard.writeText(text); toast("Credenciales copiadas", "success")
              }}>Copiar todo</SbBtn>
              <SbBtn variant="filled" rounded onClick={() => setCredentialsOpen(false)}>Listo</SbBtn>
            </SbModalFooter>
          </>
        )}
      </SbModal>

      {/* ===== RESET PASSWORD MODAL ===== */}
      <SbModal open={resetPwdOpen} onClose={() => { setResetPwdOpen(false); setNewPassword("") }} maxWidth="420px">
        {selected && (
          <>
            <SbModalHeader title="Resetear contraseña" onClose={() => { setResetPwdOpen(false); setNewPassword("") }} />
            <SbModalBody>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="flex items-center gap-3 bg-sb-surface-container/50 rounded-xl px-3 py-2.5">
                  <div className={`h-10 w-10 rounded-xl ${getAvatarColor(selected.first_name + selected.last_name)} flex items-center justify-center shrink-0`}>
                    <span className="text-xs font-bold text-white">{getInitials(selected.first_name + " " + selected.last_name)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-sb-on-surface">{selected.first_name} {selected.last_name}</p>
                    <p className="text-[11px] text-sb-on-surface-variant/50">{selected.account_email}</p>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Nueva contraseña</label>
                  <input
                    type="text"
                    placeholder="Dejar vacío para generar automáticamente"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="sb-input rounded-xl text-sm h-10 w-full"
                  />
                </div>
              </motion.div>
            </SbModalBody>
            <SbModalFooter>
              <SbBtn rounded onClick={() => { setResetPwdOpen(false); setNewPassword("") }}>Cancelar</SbBtn>
              <SbBtn variant="filled" rounded onClick={handleResetPassword} disabled={saving}>{saving ? "Guardando..." : "Resetear"}</SbBtn>
            </SbModalFooter>
          </>
        )}
      </SbModal>

      {/* ===== NEW CREDENTIALS MODAL ===== */}
      <SbModal open={!!resetCreds} onClose={() => setResetCreds(null)} maxWidth="460px">
        {resetCreds && (
          <>
            <SbModalBody>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-sb-on-surface">Credenciales actualizadas</p>
                    <p className="text-xs text-sb-on-surface-variant/50">Entrega estas credenciales al apoderado</p>
                  </div>
                </div>

                <div className="bg-sb-surface-container/50 rounded-2xl p-4 space-y-3">
                  <div>
                    <p className="text-[10px] text-sb-on-surface-variant/40">Email de acceso</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-sb-surface px-3 py-1.5 rounded-lg flex-1 truncate">{resetCreds.email}</code>
                      <button onClick={() => { navigator.clipboard.writeText(resetCreds.email); toast("Email copiado", "success") }} className="sb-btn rounded-lg text-xs h-8">Copiar</button>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-sb-on-surface-variant/40">Contraseña</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-sb-surface px-3 py-1.5 rounded-lg flex-1 font-mono">{resetCreds.password}</code>
                      <button onClick={() => { navigator.clipboard.writeText(resetCreds.password); toast("Contraseña copiada", "success") }} className="sb-btn rounded-lg text-xs h-8">Copiar</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </SbModalBody>
            <SbModalFooter>
              <SbBtn rounded onClick={() => {
                const text = `Email: ${resetCreds.email}\nContraseña: ${resetCreds.password}`
                navigator.clipboard.writeText(text); toast("Credenciales copiadas", "success")
              }}>Copiar todo</SbBtn>
              <SbBtn variant="filled" rounded onClick={() => setResetCreds(null)}>Listo</SbBtn>
            </SbModalFooter>
          </>
        )}
      </SbModal>

      {/* ===== DELETE MODAL ===== */}
      <SbModal open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="400px">
        {selected && (
          <>
            <SbModalBody>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                    <Trash2 className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-sb-on-surface">Eliminar padre</p>
                    <p className="text-xs text-sb-on-surface-variant/50">Esta acción no se puede deshacer</p>
                  </div>
                </div>
                <div className="bg-sb-surface-container/50 rounded-xl p-4">
                  <p className="text-sm text-sb-on-surface">
                    Se eliminará a <strong>{selected.first_name} {selected.last_name}</strong> (DNI: {selected.document_number})
                  </p>
                  <p className="text-xs text-sb-on-surface-variant/40 mt-1">
                    Se desvincularán los {selected.linked_students.length || 0} estudiante{(selected.linked_students.length || 0) !== 1 ? "s" : ""} asociado{(selected.linked_students.length || 0) !== 1 ? "s" : ""}
                  </p>
                </div>
              </motion.div>
            </SbModalBody>
          <SbModalFooter>
            <SbBtn rounded onClick={() => setDeleteOpen(false)}>Cancelar</SbBtn>
            <SbBtn variant="danger" rounded onClick={handleDelete} disabled={saving}>{saving ? "Eliminando..." : "Eliminar"}</SbBtn>
          </SbModalFooter>
          </>
        )}
      </SbModal>
    </div>
  )
}
