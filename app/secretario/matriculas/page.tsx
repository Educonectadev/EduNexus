"use client"

import * as React from "react"
import { GraduationCap, Plus, User, BookOpen, Search, Eye, Pencil, Trash2, X, Check, ChevronDown, Filter, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { SbBtn, SbIconBtn, SbDropdown, SbDropdownItem, SbBadge } from "@/components/ui/sb"
import { SbfSearchBar, SbfSelect, SbfClearFilters, SbfResultsCount } from "@/components/ui/search-filter-bar"
import "@/frontend.css"

interface Enrollment {
  id: number
  student_id: string
  first_name: string
  last_name: string
  document_number: string
  birth_date: string | null
  gender: string | null
  grade: string
  section: string
  year: number
  status: string
  created_at: string
  code?: string
  document_type?: string
}

interface BulkRow {
  row: number
  student_code: string
  student_name: string
  student_dni: string
  student_birth_date: string
  student_gender: string
  parent_name: string
  parent_dni: string
  parent_phone: string
  parent_email: string
  grade: string
  section: string
  valid: boolean
  errors: string[]
  duplicate: boolean
  skipped: boolean
}

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())

export default function SecretarioMatriculasPage() {
  const [grades, setGrades] = React.useState<string[]>([])
  const [sections, setSections] = React.useState<string[]>([])
  const [enrollments, setEnrollments] = React.useState<Enrollment[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")

  const [filterGrade, setFilterGrade] = React.useState("all")
  const [filterSection, setFilterSection] = React.useState("all")
  const [filterYear, setFilterYear] = React.useState("all")
  const [filterStatus, setFilterStatus] = React.useState("all")

  const [createOpen, setCreateOpen] = React.useState(false)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteAllOpen, setDeleteAllOpen] = React.useState(false)
  const [deletingAll, setDeletingAll] = React.useState(false)
  const [selected, setSelected] = React.useState<Enrollment | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  // Bulk import state
  const [activeTab, setActiveTab] = React.useState<"individual" | "bulk">("individual")
  const [bulkFile, setBulkFile] = React.useState<File | null>(null)
  const [bulkRows, setBulkRows] = React.useState<BulkRow[]>([])
  const [bulkStep, setBulkStep] = React.useState<"upload" | "preview" | "importing" | "done">("upload")
  const [bulkProgress, setBulkProgress] = React.useState(0)
  const [bulkResults, setBulkResults] = React.useState<{ imported: number; skipped: number; errors: number } | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const emptyForm = {
    student_name: "", student_dni: "", student_birth_date: "", student_gender: "",
    parent_name: "", parent_dni: "", parent_phone: "", parent_email: "",
    grade: "", section: "", year: new Date().getFullYear().toString(),
  }
  const [form, setForm] = React.useState(emptyForm)

  React.useEffect(() => {
    fetchEnrollments()
    Promise.all([
      fetch('/api/secretario/academic-grades').then(r => r.ok ? r.json() : []),
      fetch('/api/secretario/academic-sections').then(r => r.ok ? r.json() : []),
    ]).then(([g, s]) => {
      setGrades((g || []).map((x: any) => x.name))
      setSections((s || []).map((x: any) => x.name))
    }).catch(() => {})
  }, [])

  const fetchEnrollments = async () => {
    try {
      const res = await fetch("/api/secretario/enrollments")
      if (res.ok) setEnrollments(await res.json())
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  // Bulk import functions
  const convertDate = (dateStr: string): string | null => {
    if (!dateStr) return null
    // Convert DD/MM/YYYY to YYYY-MM-DD
    const parts = dateStr.split("/")
    if (parts.length === 3) {
      const [day, month, year] = parts
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    }
    // If already in YYYY-MM-DD format, return as is
    if (dateStr.includes("-")) return dateStr
    return null
  }

  const parseCSV = (text: string): BulkRow[] => {
    const lines = text.split("\n").filter(line => line.trim())
    if (lines.length < 2) return []
    
    // Skip header row
    const dataLines = lines.slice(1)
    
    const parsed: BulkRow[] = dataLines.map((line, index) => {
      // Parse CSV considering quoted fields
      const cells: string[] = []
      let current = ""
      let inQuotes = false
      
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          cells.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }
      cells.push(current.trim())
      
      const rowData: BulkRow = {
        row: index + 2,
        student_code: cells[0] || "",
        student_name: cells[1] || "",
        student_dni: cells[2] || "",
        student_birth_date: cells[3] || "",
        student_gender: (cells[4] || "").toUpperCase(),
        parent_name: cells[5] || "",
        parent_dni: cells[6] || "",
        parent_phone: cells[7] || "",
        parent_email: cells[8] || "",
        grade: cells[9] || "",
        section: cells[10] || "",
        valid: true,
        errors: [],
        duplicate: false,
        skipped: false,
      }
      
      // Validate
      if (!rowData.student_name) rowData.errors.push("Nombre del alumno requerido")
      if (!rowData.student_dni || rowData.student_dni.length < 8) rowData.errors.push("DNI inválido")
      if (!rowData.grade) rowData.errors.push("Grado requerido")
      if (rowData.student_gender && !["M", "F", "MASCULINO", "FEMENINO"].includes(rowData.student_gender)) rowData.errors.push("Género inválido")
      if (rowData.student_birth_date) {
        const converted = convertDate(rowData.student_birth_date)
        if (!converted) rowData.errors.push("Formato de fecha inválido (use AAAA-MM-DD)")
      }
      
      rowData.valid = rowData.errors.length === 0
      rowData.duplicate = false
      rowData.skipped = false
      return rowData
    })
    
    return parsed
  }

  const parseExcel = (file: File): Promise<BulkRow[]> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const rows = parseCSV(text)
          resolve(rows)
        } catch (err) {
          console.error("Error parsing file:", err)
          resolve([])
        }
      }
      reader.readAsText(file, "UTF-8")
    })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setBulkFile(file)
    const rows = await parseExcel(file)

    // Mark duplicates against existing enrollments
    const currentYear = new Date().getFullYear()
    const existingKeys = new Set(
      enrollments
        .filter(e => e.year === currentYear && e.status === 'active')
        .map(e => e.document_number)
    )
    
    const seenDnis = new Set<string>()
    
    const marked = rows.map(r => {
      if (!r.valid) return r
      
      let isDuplicate = false
      let errMsg = ''

      if (existingKeys.has(r.student_dni)) {
        isDuplicate = true
        errMsg = 'Ya tiene matrícula activa este año'
      } else if (seenDnis.has(r.student_dni)) {
        isDuplicate = true
        errMsg = 'DNI repetido en el archivo'
      }

      if (isDuplicate) {
        return { ...r, duplicate: true, skipped: true, errors: [...r.errors, errMsg] }
      }
      
      if (r.student_dni) seenDnis.add(r.student_dni)
      return r
    })

    setBulkRows(marked)
    setBulkStep("preview")
  }

  const handleBulkImport = async () => {
    setBulkStep("importing")
    setBulkProgress(0)
    
    const importableRows = bulkRows.filter(r => r.valid && !r.skipped)
    let imported = 0, skipped = 0, errors = 0
    
    for (let i = 0; i < importableRows.length; i++) {
      setBulkProgress(Math.round(((i + 1) / importableRows.length) * 100))
      
      try {
        const res = await fetch("/api/secretario/enrollments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            student_code: importableRows[i].student_code,
            student_name: importableRows[i].student_name,
            student_dni: importableRows[i].student_dni,
            student_birth_date: convertDate(importableRows[i].student_birth_date),
            student_gender: importableRows[i].student_gender === "MASCULINO" ? "M" : importableRows[i].student_gender === "FEMENINO" ? "F" : importableRows[i].student_gender,
            parent_name: importableRows[i].parent_name,
            parent_dni: importableRows[i].parent_dni,
            parent_phone: importableRows[i].parent_phone,
            parent_email: importableRows[i].parent_email,
            grade: importableRows[i].grade,
            section: importableRows[i].section,
            year: new Date().getFullYear().toString(),
          }),
        })
        
        if (res.ok) {
          imported++
        } else {
          const data = await res.json().catch(() => ({}))
          console.error(`[Bulk Import] Row ${importableRows[i].row} failed:`, res.status, data)
          if (data.error === 'DUPLICATE_ENROLLMENT' || res.status === 409) {
            skipped++
          } else {
            errors++
          }
        }
      } catch (e) {
        console.error(`[Bulk Import] Row ${importableRows[i].row} exception:`, e)
        errors++
      }
      
      await new Promise(r => setTimeout(r, 50))
    }
    
    // Count duplicates that were skipped by user
    const userSkipped = bulkRows.filter(r => r.duplicate && r.skipped).length
    skipped += userSkipped
    
    setBulkResults({ imported, skipped, errors })
    setBulkStep("done")
    fetchEnrollments()
  }

  const downloadTemplate = () => {
    const headers = ["Código del Alumno", "Nombre del Alumno", "DNI", "Fecha Nacimiento (AAAA-MM-DD)", "Género (M/F)", "Nombre del Padre/Apoderado", "DNI del Padre", "Teléfono del Padre", "Email del Padre", "Grado", "Sección"]
    const example = ["ALU-20260001", "María García López", "12345678", "2015-03-15", "F", "Juan García", "87654321", "987654321", "juan@email.com", "1ro", "A"]
    
    const csvContent = [headers.join(","), example.join(",")].join("\n")
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `plantilla_matricula_${currentYear}.csv`
    link.click()
  }

  const resetBulkImport = () => {
    setBulkFile(null)
    setBulkRows([])
    setBulkStep("upload")
    setBulkProgress(0)
    setBulkResults(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleCreate = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/secretario/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) { setCreateOpen(false); setForm(emptyForm); fetchEnrollments() }
    } catch (e) { console.error(e) } finally { setSaving(false) }
  }

  const handleUpdate = async () => {
    if (!selected) return
    setSaving(true)
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/secretario/enrollments/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) { setEditOpen(false); setSelected(null); fetchEnrollments() }
      else {
        const data = await res.json().catch(() => ({}))
        console.error("[Update enrollment] Server error:", res.status, data)
        setErrorMsg(data.error || data.sql || `Error ${res.status}`)
      }
    } catch (e: any) {
      console.error(e)
      setErrorMsg(e?.message || "Error de red")
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!selected) return
    setSaving(true)
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/secretario/enrollments/${selected.id}`, { method: "DELETE" })
      if (res.ok) {
        setDeleteOpen(false)
        setDetailOpen(false)
        setSelected(null)
        fetchEnrollments()
      } else {
        const data = await res.json().catch(() => ({}))
        console.error("[Delete enrollment] Server error:", res.status, data)
        setErrorMsg(data.error || data.sql || `Error ${res.status}`)
      }
    } catch (e: any) {
      console.error(e)
      setErrorMsg(e?.message || "Error de red")
    } finally { setSaving(false) }
  }

  const openDetail = (enr: Enrollment) => { setSelected(enr); setDetailOpen(true) }
  const openEdit = (enr: Enrollment) => {
    setSelected(enr)
    setForm({
      student_name: `${enr.first_name} ${enr.last_name}`.trim(),
      student_dni: enr.document_number || "",
      student_birth_date: enr.birth_date || "",
      student_gender: enr.gender || "",
      parent_name: "", parent_dni: "", parent_phone: "", parent_email: "",
      grade: enr.grade, section: enr.section, year: enr.year.toString(),
    })
    setDetailOpen(false)
    setEditOpen(true)
  }
  const openDelete = (enr: Enrollment) => { setSelected(enr); setDetailOpen(false); setDeleteOpen(true) }

  const handleDeleteAll = async () => {
    setDeletingAll(true)
    setErrorMsg(null)
    try {
      const res = await fetch("/api/secretario/enrollments", { method: "DELETE" })
      if (res.ok) {
        setDeleteAllOpen(false)
        setEnrollments([])
      } else {
        const data = await res.json().catch(() => ({}))
        setErrorMsg(data.error || data.sql || `Error ${res.status}`)
      }
    } catch (e: any) {
      setErrorMsg(e?.message || "Error de red")
    } finally { setDeletingAll(false) }
  }

  const filtered = enrollments.filter(e => {
    const matchSearch = `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      e.document_number?.includes(search) ||
      e.grade?.toLowerCase().includes(search.toLowerCase())
    const matchGrade = filterGrade === "all" || e.grade === filterGrade
    const matchSection = filterSection === "all" || e.section === filterSection
    const matchYear = filterYear === "all" || e.year.toString() === filterYear
    const matchStatus = filterStatus === "all" || e.status === filterStatus
    return matchSearch && matchGrade && matchSection && matchYear && matchStatus
  })

  const activeFilters = [filterGrade, filterSection, filterYear, filterStatus].filter(f => f !== "all").length

  const clearFilters = () => { setFilterGrade("all"); setFilterSection("all"); setFilterYear("all"); setFilterStatus("all") }

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-sb-on-surface">Matrículas</h2>
          <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">Registrar y gestionar matrículas del año {currentYear}</p>
        </div>
        {activeTab === "individual" ? (
          <div className="flex items-center gap-2">
            <SbBtn variant="tonal" rounded className="flex items-center gap-2 text-red-400" onClick={() => { setErrorMsg(null); setDeleteAllOpen(true) }} disabled={enrollments.length === 0}>
              <Trash2 className="h-4 w-4" /> Eliminar Todo
            </SbBtn>
            <SbBtn variant="filled" rounded className="flex items-center gap-2" onClick={() => { setForm(emptyForm); setCreateOpen(true) }}>
              <Plus className="h-4 w-4" /> Nueva Matrícula
            </SbBtn>
          </div>
        ) : (
          <SbBtn variant="filled" rounded className="flex items-center gap-2" onClick={downloadTemplate}>
            <Download className="h-4 w-4" /> Descargar Plantilla
          </SbBtn>
        )}
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-sb-surface-container rounded-xl">
        <button
          onClick={() => setActiveTab("individual")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === "individual"
              ? "bg-sb-on-surface text-sb-surface"
              : "text-sb-on-surface-variant/60 hover:text-sb-on-surface"
          }`}
        >
          <User className="h-4 w-4" />
          Carga Individual
        </button>
        <button
          onClick={() => setActiveTab("bulk")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === "bulk"
              ? "bg-sb-on-surface text-sb-surface"
              : "text-sb-on-surface-variant/60 hover:text-sb-on-surface"
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Carga Masiva
        </button>
      </div>

      {/* Bulk Import Content */}
      {activeTab === "bulk" ? (
        <BulkImportView
          step={bulkStep}
          setStep={setBulkStep}
          file={bulkFile}
          rows={bulkRows}
          setRows={setBulkRows}
          progress={bulkProgress}
          results={bulkResults}
          onFileSelect={handleFileSelect}
          onImport={handleBulkImport}
          onReset={resetBulkImport}
          fileInputRef={fileInputRef}
        />
      ) : (
        <>
      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SbfSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, DNI o grado..."
          />
        </div>

        {/* Filter Dropdowns (Custom Select) */}
        <div className="flex gap-2 flex-wrap items-center">
          <SbfSelect
            value={filterGrade}
            onChange={setFilterGrade}
            placeholder="Grado"
            icon={GraduationCap}
            options={[
              { value: "all", label: "Todos los grados" },
              ...grades.map(g => ({ value: g, label: g })),
            ]}
          />
          <SbfSelect
            value={filterSection}
            onChange={setFilterSection}
            placeholder="Sección"
            options={[
              { value: "all", label: "Todas" },
              ...sections.map(s => ({ value: s, label: `Sección ${s}` })),
            ]}
          />
          <SbfSelect
            value={filterYear}
            onChange={setFilterYear}
            placeholder="Año"
            options={[
              { value: "all", label: "Todos" },
              ...years.map(y => ({ value: y, label: y })),
            ]}
          />
          <SbfSelect
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="Estado"
            options={[
              { value: "all", label: "Todos" },
              { value: "active", label: "Activos" },
              { value: "pending", label: "Pendientes" },
            ]}
          />
          <SbfClearFilters count={activeFilters} onClick={clearFilters} />
        </div>
      </div>

      {/* Results Count */}
      {!loading && filtered.length > 0 && search && (
        <SbfResultsCount count={filtered.length} query={search} onClear={() => setSearch("")} />
      )}

      {/* Table (Desktop) / Cards (Mobile) */}
      <div className="sb-anim-table-in">
        {/* Desktop table */}
        <div className="hidden md:block sb-table-wrap">
          <table className="sb-table">
            <thead>
              <tr>
                <td className="text-[10px] font-medium text-sb-on-surface-variant/50 uppercase tracking-wider">Alumno</td>
                <td className="text-[10px] font-medium text-sb-on-surface-variant/50 uppercase tracking-wider">DNI</td>
                <td className="text-[10px] font-medium text-sb-on-surface-variant/50 uppercase tracking-wider">Grado</td>
                <td className="text-[10px] font-medium text-sb-on-surface-variant/50 uppercase tracking-wider">Sección</td>
                <td className="text-[10px] font-medium text-sb-on-surface-variant/50 uppercase tracking-wider">Año</td>
                <td className="text-[10px] font-medium text-sb-on-surface-variant/50 uppercase tracking-wider">Estado</td>
                <td className="text-[10px] font-medium text-sb-on-surface-variant/50 uppercase tracking-wider text-right">Acciones</td>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((enr, i) => (
                  <motion.tr key={enr.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, filter: "blur(8px)", y: -10 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    onClick={() => openDetail(enr)}>
                    <td className="font-medium text-sb-on-surface/80 text-[13px]">{enr.first_name} {enr.last_name}</td>
                    <td className="font-mono text-xs text-sb-on-surface-variant/50">{enr.document_number}</td>
                    <td className="text-sb-on-surface/70 text-[13px]">{enr.grade}</td>
                    <td className="text-sb-on-surface/70 text-[13px]">{enr.section}</td>
                    <td className="font-mono text-xs text-sb-on-surface-variant/50">{enr.year}</td>
                    <td>
                      <SbBadge color={enr.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}>
                        {enr.status === "active" ? "Activo" : "Pendiente"}
                      </SbBadge>
                    </td>
                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-0.5">
                        <SbIconBtn onClick={() => openDetail(enr)}><Eye className="h-4 w-4" /></SbIconBtn>
                        <SbIconBtn onClick={() => openEdit(enr)}><Pencil className="h-4 w-4" /></SbIconBtn>
                        <SbIconBtn onClick={() => openDelete(enr)} className="text-red-400"><Trash2 className="h-4 w-4" /></SbIconBtn>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2">
          {filtered.map((enr, i) => (
            <motion.div
              key={enr.id}
              role="button"
              tabIndex={0}
              onClick={() => openDetail(enr)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetail(enr) } }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02, duration: 0.25 }}
              className="w-full text-left bg-sb-surface rounded-2xl p-4 active:scale-[0.99] transition-transform cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-10 w-10 rounded-xl bg-sb-surface-container flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-semibold text-sb-on-surface-variant/70">
                      {enr.first_name?.[0]}{enr.last_name?.[0]}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-sb-on-surface truncate">{enr.first_name} {enr.last_name}</p>
                    <p className="text-[11px] font-mono text-sb-on-surface-variant/50 mt-0.5">DNI {enr.document_number}</p>
                  </div>
                </div>
                <SbBadge color={enr.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}>
                  {enr.status === "active" ? "Activo" : "Pendiente"}
                </SbBadge>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-sb-outline-variant/15">
                <div className="flex items-center gap-3 text-[11px] text-sb-on-surface-variant/60">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" /> {enr.grade}
                  </span>
                  <span>·</span>
                  <span>Sec. {enr.section}</span>
                  <span>·</span>
                  <span className="font-mono">{enr.year}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <SbIconBtn onClick={(e) => { e.stopPropagation(); openEdit(enr) }}><Pencil className="h-3.5 w-3.5" /></SbIconBtn>
                  <SbIconBtn onClick={(e) => { e.stopPropagation(); openDelete(enr) }} className="text-red-400"><Trash2 className="h-3.5 w-3.5" /></SbIconBtn>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <GraduationCap className="h-14 w-14 text-sb-on-surface-variant/15 mx-auto mb-3" />
            <h3 className="text-base font-medium text-sb-on-surface/60">Sin matrículas</h3>
            <p className="text-sm text-sb-on-surface-variant/30 mt-1">
              {activeFilters > 0 || search ? "Intenta con otros filtros." : "Registra la primera matrícula para comenzar."}
            </p>
          </div>
        )}
      </div>
        </>
      )}

      {/* ===== MODALS ===== */}

      {/* Create */}
      <AnimatePresence>
        {createOpen && (
          <Modal onClose={() => setCreateOpen(false)}>
            <ModalHeader title="Nueva Matrícula" onClose={() => setCreateOpen(false)} />
            <div className="sb-modal-body"><Form form={form} setForm={setForm} grades={grades} sections={sections} /></div>
            <div className="sb-modal-footer">
              <SbBtn rounded className="flex-1" onClick={() => setCreateOpen(false)}>Cancelar</SbBtn>
              <SbBtn variant="filled" rounded className="flex-1" onClick={handleCreate} disabled={saving || !form.student_name || !form.grade}>
                {saving ? "Matriculando..." : "Matricular"}
              </SbBtn>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Detail */}
      <AnimatePresence>
        {detailOpen && selected && (
          <Modal onClose={() => setDetailOpen(false)}>
            <ModalHeader title="Detalle de Matrícula" onClose={() => setDetailOpen(false)}
              badge={selected.status === "active" ? "Activo" : "Pendiente"}
              badgeColor={selected.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"} />
            <div className="sb-modal-body space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-sb-surface-container flex items-center justify-center shrink-0">
                  <span className="text-lg font-semibold text-sb-on-surface-variant/60">{selected.first_name?.[0]}{selected.last_name?.[0]}</span>
                </div>
                <div>
                  <p className="text-base font-medium text-sb-on-surface">{selected.first_name} {selected.last_name}</p>
                  <p className="text-xs text-sb-on-surface-variant/40 mt-0.5">{selected.code || "Sin código"}</p>
                </div>
              </div>

              <div className="h-px bg-sb-outline-variant/15" />

              {/* Student Data */}
              <div>
                <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider mb-3">Datos del Alumno</p>
                <div className="grid grid-cols-2 gap-3">
                  <Info label="DNI" value={selected.document_number} />
                  <Info label="Tipo Doc." value={selected.document_type || "DNI"} />
                  <Info label="Fecha Nac." value={selected.birth_date ? new Date(selected.birth_date).toLocaleDateString("es-PE") : "—"} />
                  <Info label="Género" value={selected.gender === "M" ? "Masculino" : selected.gender === "F" ? "Femenino" : "—"} />
                </div>
              </div>

              <div className="h-px bg-sb-outline-variant/15" />

              {/* Academic */}
              <div>
                <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider mb-3">Información Académica</p>
                <div className="grid grid-cols-3 gap-3">
                  <Info label="Grado" value={selected.grade} />
                  <Info label="Sección" value={selected.section} />
                  <Info label="Año" value={selected.year.toString()} />
                </div>
              </div>

              <div className="h-px bg-sb-outline-variant/15" />

              <Info label="Fecha de matrícula" value={new Date(selected.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })} />
            </div>
            <div className="sb-modal-footer">
              <SbBtn variant="tonal" rounded className="flex-1 flex items-center justify-center gap-2" onClick={() => openEdit(selected)}>
                <Pencil className="h-4 w-4" /> Editar
              </SbBtn>
              <SbBtn variant="danger" rounded className="flex items-center justify-center gap-2" onClick={() => openDelete(selected)}>
                <Trash2 className="h-4 w-4" /> Eliminar
              </SbBtn>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Edit */}
      <AnimatePresence>
        {editOpen && (
          <Modal onClose={() => { setEditOpen(false); setErrorMsg(null) }}>
            <ModalHeader title="Editar Matrícula" onClose={() => { setEditOpen(false); setErrorMsg(null) }} />
            <div className="sb-modal-body"><Form form={form} setForm={setForm} grades={grades} sections={sections} /></div>
            {errorMsg && (
              <div className="mx-5 mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {errorMsg}
              </div>
            )}
            <div className="sb-modal-footer">
              <SbBtn rounded className="flex-1" onClick={() => { setEditOpen(false); setErrorMsg(null) }}>Cancelar</SbBtn>
              <SbBtn variant="filled" rounded className="flex-1" onClick={handleUpdate} disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </SbBtn>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete All Confirm */}
      <AnimatePresence>
        {deleteAllOpen && (
          <Modal onClose={() => setDeleteAllOpen(false)}>
            <ModalHeader title="Eliminar Todas las Matrículas" onClose={() => setDeleteAllOpen(false)} />
            <div className="sb-modal-body">
              <p className="text-sm text-sb-on-surface-variant/60">
                ¿Estás seguro de eliminar <strong className="text-sb-on-surface">todas las matrículas</strong> de la institución?
                Se borrarán todos los alumnos con sus datos, matrículas y las cuentas de sus padres/apoderados.
                Esta acción no se puede deshacer.
              </p>
              {errorMsg && (
                <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  {errorMsg}
                </div>
              )}
            </div>
            <div className="sb-modal-footer">
              <SbBtn rounded className="flex-1" onClick={() => setDeleteAllOpen(false)}>Cancelar</SbBtn>
              <SbBtn variant="danger" rounded className="flex-1" onClick={handleDeleteAll} disabled={deletingAll}>
                {deletingAll ? "Eliminando..." : "Eliminar Todo"}
              </SbBtn>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteOpen && selected && (
          <Modal onClose={() => setDeleteOpen(false)}>
            <ModalHeader title="Eliminar Alumno" onClose={() => setDeleteOpen(false)} />
            <div className="sb-modal-body">
              <p className="text-sm text-sb-on-surface-variant/60">
                ¿Estás seguro de eliminar <strong className="text-sb-on-surface">{selected.first_name} {selected.last_name}</strong>?
                Se eliminará su matrícula, sus datos de alumno y las cuentas de sus padres/apoderados.
                Esta acción no se puede deshacer.
              </p>
              {errorMsg && (
                <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  {errorMsg}
                </div>
              )}
            </div>
            <div className="sb-modal-footer">
              <SbBtn rounded className="flex-1" onClick={() => setDeleteOpen(false)}>Cancelar</SbBtn>
              <SbBtn variant="danger" rounded className="flex-1" onClick={handleDelete} disabled={saving}>
                {saving ? "Eliminando..." : "Eliminar"}
              </SbBtn>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

/* --- Shared Components --- */

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="sb-modal-backdrop" onClick={onClose}>
      <motion.div className="sb-modal-window" onClick={(e) => e.stopPropagation()}
        initial={{ filter: "blur(32px)", opacity: 0, scale: 0.95 }}
        animate={{ filter: "blur(0px)", opacity: 1, scale: 1 }}
        exit={{ filter: "blur(32px)", opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.37, 0.35, 0, 1] }}>
        {children}
      </motion.div>
    </div>
  )
}

function ModalHeader({ title, onClose, badge, badgeColor }: {
  title: string; onClose: () => void; badge?: string; badgeColor?: string
}) {
  return (
    <div className="sb-modal-header flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h3 className="text-base font-medium text-sb-on-surface">{title}</h3>
        {badge && <SbBadge color={badgeColor}>{badge}</SbBadge>}
      </div>
      <SbIconBtn onClick={onClose}><X className="h-4 w-4" /></SbIconBtn>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-sb-on-surface-variant/40">{label}</p>
      <p className="text-sm text-sb-on-surface/80 mt-0.5">{value}</p>
    </div>
  )
}

function Form({ form, setForm, grades, sections }: { form: any; setForm: (f: any) => void; grades: string[]; sections: string[] }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium text-sb-on-surface-variant/50 mb-3 flex items-center gap-2">
          <User className="h-3.5 w-3.5" /> Datos del Alumno
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Nombre Completo *</label>
            <input placeholder="María García López" value={form.student_name}
              onChange={(e) => setForm({ ...form, student_name: e.target.value })} className="sb-input" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">DNI *</label>
              <input placeholder="12345678" value={form.student_dni} maxLength={8}
                onChange={(e) => setForm({ ...form, student_dni: e.target.value })} className="sb-input" />
            </div>
            <div>
              <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Fecha Nac.</label>
              <input type="date" value={form.student_birth_date}
                onChange={(e) => setForm({ ...form, student_birth_date: e.target.value })} className="sb-input" />
            </div>
            <div>
              <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Género</label>
              <select value={form.student_gender} onChange={(e) => setForm({ ...form, student_gender: e.target.value })} className="sbf-native-select w-full">
                <option value="">—</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-sb-on-surface-variant/50 mb-3 flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5" /> Asignación Académica
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Grado *</label>
            <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} className="sbf-native-select w-full">
              <option value="">Seleccionar grado...</option>
              {grades.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Sección *</label>
            <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="sbf-native-select w-full">
              <option value="">—</option>
              {sections.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

function BulkImportView({ step, setStep, file, rows, setRows, progress, results, onFileSelect, onImport, onReset, fileInputRef }: {
  step: "upload" | "preview" | "importing" | "done"
  setStep: (s: "upload" | "preview" | "importing" | "done") => void
  file: File | null
  rows: BulkRow[]
  setRows: (rows: BulkRow[]) => void
  progress: number
  results: { imported: number; skipped: number; errors: number } | null
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onImport: () => void
  onReset: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
}) {
  const validCount = rows.filter(r => r.valid && !r.skipped).length
  const errorCount = rows.filter(r => !r.valid).length
  const duplicateCount = rows.filter(r => r.duplicate).length

  if (step === "upload") {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-sb-surface rounded-2xl p-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-sb-surface-container-high flex items-center justify-center mx-auto mb-4">
            <Upload className="h-8 w-8 text-sb-on-surface-variant/40" />
          </div>
          <h3 className="text-lg font-medium text-sb-on-surface mb-2">Importar archivo Excel</h3>
          <p className="text-sm text-sb-on-surface-variant/50 mb-6 max-w-md mx-auto">
            Sube un archivo CSV o Excel con los datos de los alumnos. Descarga la plantilla para asegurar el formato correcto.
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={onFileSelect}
            className="hidden"
          />
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <SbBtn variant="filled" rounded className="flex items-center gap-2"
              onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" /> Seleccionar Archivo
            </SbBtn>
            <SbBtn variant="tonal" rounded className="flex items-center gap-2"
              onClick={() => {
                const headers = ["Código del Alumno", "Nombre del Alumno", "DNI", "Fecha Nacimiento (DD/MM/AAAA)", "Género (M/F)", "Nombre del Padre/Apoderado", "DNI del Padre", "Teléfono del Padre", "Email del Padre", "Grado", "Sección"]
                const example = ["ALU-20260001", "María García López", "12345678", "15/03/2015", "F", "Juan García", "87654321", "987654321", "juan@email.com", "1ro", "A"]
                const csvContent = [headers.join(","), example.join(",")].join("\n")
                const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
                const link = document.createElement("a")
                link.href = URL.createObjectURL(blob)
                link.download = `plantilla_matricula_${new Date().getFullYear()}.csv`
                link.click()
              }}>
              <Download className="h-4 w-4" /> Descargar Plantilla
            </SbBtn>
          </div>
          
          <p className="text-xs text-sb-on-surface-variant/30 mt-4">
            Formato aceptado: .csv
          </p>
        </div>
      </motion.div>
    )
  }

  if (step === "preview") {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-sb-surface rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-sb-outline-variant/15">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-sb-on-surface">Vista Previa</h3>
              <p className="text-xs text-sb-on-surface-variant/50 mt-0.5">
                {file?.name} — {rows.length} registros encontrados
              </p>
            </div>
            <button onClick={onReset} className="text-xs text-sb-on-surface-variant/50 hover:text-sb-on-surface">
              Cambiar archivo
            </button>
          </div>
          
          {/* Stats */}
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-sb-on-surface-variant/60">{validCount} válidos</span>
            </div>
            {duplicateCount > 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                <span className="text-xs text-amber-400">{duplicateCount} duplicados</span>
              </div>
            )}
            {errorCount > 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span className="text-xs text-red-400">{errorCount} con errores</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-sb-surface">
              <tr className="border-b border-sb-outline-variant/15">
                <th className="text-left py-2 px-3 text-[10px] font-medium text-sb-on-surface-variant/50 uppercase">Fila</th>
                <th className="text-left py-2 px-3 text-[10px] font-medium text-sb-on-surface-variant/50 uppercase">Alumno</th>
                <th className="text-left py-2 px-3 text-[10px] font-medium text-sb-on-surface-variant/50 uppercase">DNI</th>
                <th className="text-left py-2 px-3 text-[10px] font-medium text-sb-on-surface-variant/50 uppercase">Grado</th>
                <th className="text-left py-2 px-3 text-[10px] font-medium text-sb-on-surface-variant/50 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={`border-b border-sb-outline-variant/10 ${!row.valid ? "bg-red-500/5" : row.duplicate ? "bg-amber-500/5" : ""}`}>
                  <td className="py-2 px-3 font-mono text-xs text-sb-on-surface-variant/50">{row.row}</td>
                  <td className="py-2 px-3 text-sb-on-surface/80">{row.student_name || "—"}</td>
                  <td className="py-2 px-3 font-mono text-xs text-sb-on-surface-variant/60">{row.student_dni || "—"}</td>
                  <td className="py-2 px-3 text-sb-on-surface/70">{row.grade || "—"}</td>
                  <td className="py-2 px-3">
                    {row.duplicate ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!row.skipped}
                          onChange={() => {
                            const updated = rows.map((r, j) => j === i ? { ...r, skipped: !r.skipped } : r)
                            setRows(updated)
                          }}
                          className="h-4 w-4 rounded border-amber-400 text-amber-500 focus:ring-amber-500/30"
                        />
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                          <span className="text-[10px] text-amber-400">{row.errors[0] || "Duplicado"}</span>
                        </div>
                      </label>
                    ) : row.valid ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <span className="text-[10px] text-red-400">{row.errors[0]}</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-sb-outline-variant/15 flex justify-end gap-3">
          <SbBtn rounded onClick={onReset}>Cancelar</SbBtn>
          <SbBtn variant="filled" rounded className="flex items-center gap-2"
            onClick={onImport} disabled={validCount === 0}>
            <Upload className="h-4 w-4" /> Importar {validCount} registros{duplicateCount > 0 ? ` (${duplicateCount} duplicados omitidos)` : ""}
          </SbBtn>
        </div>
      </motion.div>
    )
  }

  if (step === "importing") {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-sb-surface rounded-2xl p-8">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-sb-primary mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-medium text-sb-on-surface mb-2">Importando registros...</h3>
          <p className="text-sm text-sb-on-surface-variant/50 mb-6">
            Procesando {rows.filter(r => r.valid && !r.skipped).length} registros
          </p>
          
          {/* Progress bar */}
          <div className="w-full max-w-xs mx-auto h-2 bg-sb-surface-container rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-sb-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs text-sb-on-surface-variant/40 mt-2">{progress}% completado</p>
        </div>
      </motion.div>
    )
  }

  if (step === "done" && results) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-sb-surface rounded-2xl p-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-medium text-sb-on-surface mb-2">Importación completada</h3>
          
          <div className="flex justify-center gap-6 mt-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-semibold text-emerald-400">{results.imported}</p>
              <p className="text-xs text-sb-on-surface-variant/50">Importados</p>
            </div>
            {results.skipped > 0 && (
              <div className="text-center">
                <p className="text-2xl font-semibold text-amber-400">{results.skipped}</p>
                <p className="text-xs text-sb-on-surface-variant/50">Omitidos</p>
              </div>
            )}
            {results.errors > 0 && (
              <div className="text-center">
                <p className="text-2xl font-semibold text-red-400">{results.errors}</p>
                <p className="text-xs text-sb-on-surface-variant/50">Errores</p>
              </div>
            )}
          </div>
          
          <SbBtn variant="filled" rounded onClick={onReset}>
            Nueva Importación
          </SbBtn>
        </div>
      </motion.div>
    )
  }

  return null
}
