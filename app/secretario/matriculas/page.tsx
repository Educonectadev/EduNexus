"use client"

import * as React from "react"
import { GraduationCap, Plus, User, BookOpen, Search, Eye, Pencil, Trash2, X, Check, ChevronDown, Filter, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle, Loader2, RefreshCw, Sparkles, Calendar as CalendarIcon } from "@/components/ui/proicons"
import { Calendar as CalendarComp } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { motion, AnimatePresence } from "framer-motion"
import { SbBtn, SbIconBtn, SbDropdown, SbDropdownItem, SbBadge } from "@/components/ui/sb"
import { SbfSearchBar, SbfSelect, SbfClearFilters, SbfResultsCount } from "@/components/ui/search-filter-bar"
import { toast } from "@/hooks/use-toast"
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
  shift?: string
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
  shift: string
  valid: boolean
  errors: string[]
  duplicate: boolean
  skipped: boolean
  compareStatus?: "new" | "unchanged" | "changed"
  changes?: { field: string; old: string; new: string }[]
  existingCode?: string
  existingEnrollmentId?: string | null
}

interface CompareResult {
  dni: string
  status: "new" | "unchanged" | "changed"
  changes: { field: string; old: string; new: string }[]
  existing: boolean
  code?: string
  enrollmentId?: string | null
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
    shift: "",
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
    // Detecta fila real de header (DATOS COLEGIO tiene fila título antes)
    const parseLine = (h:string) => {
      const c:string[]=[]; let cur=""; let q=false;
      for(const ch of h){ if(ch==='"') q=!q; else if(ch===","&&!q){ c.push(cur.trim()); cur="" } else cur+=ch } c.push(cur.trim())
      return c.map(s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""))
    }
    let headerIdx = 0; let headerCells = parseLine(lines[0])
    const hasHeader = (cells:string[]) => cells.some(h=>h.includes("dni")||h.includes("nombre")||h.includes("alumno"))
    if(!hasHeader(headerCells)){
      for(let i=1;i<Math.min(5,lines.length);i++){
        const cand = parseLine(lines[i])
        if(hasHeader(cand) && cand.filter(Boolean).length >= 3){ headerIdx=i; headerCells=cand; break }
      }
    }
    const findIdx = (keys: string[]) => {
      // prioridad exacto, luego includes (para tus 13 etiquetas exactas)
      for(let k of keys){ const i=headerCells.findIndex(h=>h===k); if(i!==-1) return i }
      for(let k of keys){ const i=headerCells.findIndex(h=>h.includes(k)); if(i!==-1) return i }
      return -1
    }
    const idxCode = findIdx(["codigo alumno","codigo","code"])
    const idxName = (()=>{ const a=findIdx(["nombre alumno","nombre del alumno","nombres y apellidos","nombre completo","alumno"]); return a!==-1?a: Math.max(0,findIdx(["nombre"])) })()
    const idxApellidos = findIdx(["apellidos","apellido"])
    const idxNombresOnly = findIdx(["nombres"])
    const idxDni = findIdx(["dni alumno","dni del alumno","documento alumno","nro doc","nro documento","documento","dni"])
    const idxBirth = findIdx(["fecha nacimiento","fecha nac","nacimiento","birth","fecha"])
    const idxGender = findIdx(["genero","sexo","gender"])
    const idxParentName = findIdx(["nombre padre","nombre del padre","padre/apoderado","padre","apoderado"])
    const idxParentDni = findIdx(["dni padre","dni apoderado"])
    const idxParentPhone = findIdx(["telefono padre","telefono","celular","phone"])
    const idxParentEmail = findIdx(["email padre","email","correo"])
    const idxNivel = findIdx(["nivel"])
    const idxGrade = findIdx(["grado","grade"])
    const idxSection = findIdx(["seccion","section"])
    const idxShift = findIdx(["turno","shift"])
    // Data desde después del header real
    const dataLines = lines.slice(headerIdx+1)
    
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
      
      const get = (idx:number) => idx>=0 ? (cells[idx] || "") : ""
      const combinedName = (idxApellidos!==-1 && idxNombresOnly!==-1) ? `${get(idxNombresOnly)} ${get(idxApellidos)}`.trim() : ""
      const rowData: BulkRow = {
        row: index + 2,
        student_code: idxCode>=0 ? get(idxCode) : (cells[0] || ""),
        student_name: combinedName || get(idxName) || cells[1] || "",
        student_dni: get(idxDni) || cells[2] || "",
        student_birth_date: get(idxBirth) || cells[3] || "",
        student_gender: (get(idxGender) || cells[4] || "").toUpperCase(),
        parent_name: get(idxParentName) || cells[5] || "",
        parent_dni: get(idxParentDni) || cells[6] || "",
        parent_phone: get(idxParentPhone) || cells[7] || "",
        parent_email: get(idxParentEmail) || cells[8] || "",
        grade: get(idxGrade) || cells[9] || "",
        section: get(idxSection) || cells[10] || "",
        shift: get(idxShift) || cells[11] || "",
        valid: true,
        errors: [],
        duplicate: false,
        skipped: false,
      }
      
      // Validate
      const norm = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      if (!rowData.student_name) rowData.errors.push("Nombre del alumno requerido")
      if (!rowData.student_dni || rowData.student_dni.length < 8) {
        // modo híbrido: genera DNI temporal para no bloquear importación masiva
        rowData.student_dni = `TMP${String(rowData.row).padStart(6,"0")}`
      }
      // Género híbrido: autocorrige en vez de bloquear
      if (rowData.student_gender) {
        const g = rowData.student_gender.toLowerCase()
        if (["f","femenino","fem","mujer"].some(v=>g.includes(v))) rowData.student_gender = "F"
        else if (["m","masculino","masc","varon","hombre"].some(v=>g.includes(v))) rowData.student_gender = "M"
        else rowData.student_gender = "" // deja vacío, no bloquea
      }
      if (rowData.student_birth_date) {
        const converted = convertDate(rowData.student_birth_date)
        if (!converted) rowData.errors.push("Formato de fecha inválido (use AAAA-MM-DD)")
      }
      
      // Grade: fuzzy match — "1ro" matches "1° de Primaria", "4to" matches "4° de Primaria"
      if (rowData.grade) {
        const gradeNorm = norm(rowData.grade)
        const exactMatch = grades.some(g => norm(g) === gradeNorm)
        if (!exactMatch) {
          // Try fuzzy: extract number from input, find grade starting with that number
          const numMatch = gradeNorm.match(/^(\d+)/)
          if (numMatch) {
            const num = numMatch[1]
            const fuzzyMatch = grades.find(g => norm(g).startsWith(num + "°") || norm(g).startsWith(num + " "))
            if (fuzzyMatch) {
              rowData.grade = fuzzyMatch // auto-correct
            } else {
              rowData.errors.push(`Grado "${rowData.grade}" no existe en Gestión Académica`)
            }
          } else {
            rowData.errors.push(`Grado "${rowData.grade}" no existe en Gestión Académica`)
          }
        }
      }
      // Section: fuzzy match — "a" matches "A", "b" matches "B"
      if (rowData.section) {
        const secNorm = norm(rowData.section)
        const exactSec = sections.some(s => norm(s) === secNorm)
        if (!exactSec) {
          const fuzzySec = sections.find(s => norm(s).startsWith(secNorm) || secNorm.startsWith(norm(s)))
          if (fuzzySec) {
            rowData.section = fuzzySec // auto-correct
          } else {
            rowData.errors.push(`Sección "${rowData.section}" no existe en Gestión Académica`)
          }
        }
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
      const isXlsx = file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls")
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          if (isXlsx) {
            const XLSX = await import("xlsx")
            const data = e.target?.result as ArrayBuffer
            const wb = XLSX.read(data, { type: "array" })
            const sheet = wb.Sheets[wb.SheetNames[0]]
            const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "", raw: false }) as unknown as string[][]
            // Convert rows to CSV text for parseCSV
            const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n")
            resolve(parseCSV(csv))
          } else {
            const text = e.target?.result as string
            resolve(parseCSV(text))
          }
        } catch (err) {
          console.error("Error parsing file:", err)
          resolve([])
        }
      }
      if (isXlsx) reader.readAsArrayBuffer(file)
      else reader.readAsText(file, "UTF-8")
    })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setBulkFile(file)
    const rows = await parseExcel(file)

    // Detect repeated DNI inside the file
    const seenDnis = new Set<string>()
    const marked = rows.map(r => {
      if (!r.valid) return r
      if (seenDnis.has(r.student_dni)) {
        return { ...r, duplicate: true, skipped: true, errors: [...r.errors, 'DNI repetido en el archivo'] }
      }
      if (r.student_dni) seenDnis.add(r.student_dni)
      return r
    })

    // Preview instantáneo sin esperar compare (para 994 filas)
    setBulkRows(marked)
    setBulkStep("preview")
    // Compare en background para detectar nuevos/cambios/sin cambios
    const validRows = marked.filter(r => r.valid && !r.skipped)
    if (validRows.length > 0) {
      fetch("/api/secretario/enrollments/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rows: validRows.map(r => ({
          student_name: r.student_name,
          student_dni: r.student_dni,
          student_birth_date: convertDate(r.student_birth_date),
          student_gender: r.student_gender === "MASCULINO" ? "M" : r.student_gender === "FEMENINO" ? "F" : r.student_gender,
          parent_name: r.parent_name,
          parent_dni: r.parent_dni,
          parent_phone: r.parent_phone,
          parent_email: r.parent_email,
          grade: r.grade,
          section: r.section,
        })) }),
      }).then(r=>r.ok?r.json():null).then(data=>{
        if(!data) return
        const byDni = new Map<string, CompareResult>((data.results || []).map((r: CompareResult) => [r.dni, r]))
        setBulkRows(prev => prev.map(r => {
          const cmp = r.student_dni ? byDni.get(r.student_dni) : null
          if (!cmp || !r.valid || r.skipped) return r
          if (cmp.status === "unchanged") return { ...r, compareStatus: "unchanged" as const, changes: [], existingCode: cmp.code || "", skipped: true }
          return { ...r, compareStatus: cmp.status, changes: cmp.changes || [], existingCode: cmp.code || "", existingEnrollmentId: cmp.enrollmentId || null, duplicate: false, skipped: false }
        }))
      }).catch(()=>{})
    }
  }

  const handleBulkImport = async () => {
    setBulkStep("importing")
    setBulkProgress(10)
    const importableRows = bulkRows.filter(r => r.valid && !r.skipped)
    // Intento bulk rápido (1 request para 300-1000 filas)
    try {
      const payloadRows = importableRows.map(r => ({
        student_code: r.student_code,
        student_name: r.student_name,
        student_dni: r.student_dni,
        student_birth_date: convertDate(r.student_birth_date),
        student_gender: r.student_gender === "MASCULINO" ? "M" : r.student_gender === "FEMENINO" ? "F" : r.student_gender,
        parent_name: r.parent_name,
        parent_dni: r.parent_dni,
        parent_phone: r.parent_phone,
        parent_email: r.parent_email,
        grade: r.grade,
        section: r.section,
        shift: r.shift,
        year: new Date().getFullYear().toString(),
      }))
      setBulkProgress(30)
      const res = await fetch("/api/secretario/enrollments/bulk", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ rows: payloadRows }),
      })
      const data = await res.json().catch(()=>({}))
      if (res.ok && data.imported > 0) {
        setBulkProgress(100)
        const userSkipped = bulkRows.filter(r => r.duplicate && r.skipped).length
        setBulkResults({ imported: data.imported || 0, skipped: (data.skipped||0)+userSkipped, errors: data.errors||0 })
        setBulkStep("done"); fetchEnrollments(); return
      }
      if (res.ok && data.imported===0) throw new Error(data.firstError || "bulk 0 importados")
      throw new Error(data.error || "bulk failed")
    } catch (e) {
      console.error("bulk fallback a fila por fila", e)
      // Fallback fila por fila si bulk falla
      let imported = 0, skipped = 0, errors = 0
      for (let i = 0; i < importableRows.length; i++) {
        setBulkProgress(Math.round(((i + 1) / importableRows.length) * 100))
        const row = importableRows[i]
        const payload = {
          student_code: row.student_code, student_name: row.student_name, student_dni: row.student_dni,
          student_birth_date: convertDate(row.student_birth_date),
          student_gender: row.student_gender === "MASCULINO" ? "M" : row.student_gender === "FEMENINO" ? "F" : row.student_gender,
          parent_name: row.parent_name, parent_dni: row.parent_dni, parent_phone: row.parent_phone, parent_email: row.parent_email,
          grade: row.grade, section: row.section, shift: row.shift, year: new Date().getFullYear().toString(),
        }
        try {
          let res2
          if (row.compareStatus === "changed" && row.existingEnrollmentId) {
            res2 = await fetch(`/api/secretario/enrollments/${row.existingEnrollmentId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(payload) })
          } else {
            res2 = await fetch("/api/secretario/enrollments", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(payload) })
          }
          if (res2.ok) imported++; else { const d = await res2.json().catch(()=>({})); if(d.error==='DUPLICATE_ENROLLMENT'||res2.status===409) skipped++; else errors++ }
        } catch { errors++ }
      }
      const userSkipped = bulkRows.filter(r => r.duplicate && r.skipped).length
      skipped += userSkipped
      setBulkResults({ imported, skipped, errors })
      setBulkStep("done"); fetchEnrollments()
    }
  }

  const downloadTemplate = () => {
    const link = document.createElement("a")
    link.href = "/plantillas/plantilla_matriculas.csv"
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
    const norm = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    if (form.grade && !grades.some(g => norm(g) === norm(form.grade))) { toast({ title: 'El grado no existe en Gestión Académica', variant: 'destructive' }); return }
    if (form.section && !sections.some(s => norm(s) === norm(form.section))) { toast({ title: 'La sección no existe en Gestión Académica', variant: 'destructive' }); return }
    setSaving(true)
    try {
      const res = await fetch("/api/secretario/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) { setCreateOpen(false); setForm(emptyForm); fetchEnrollments(); toast({ title: 'Matrícula creada', variant: 'default' }) }
      else { const d = await res.json().catch(()=>({})); toast({ title: d.error || `Error ${res.status}`, description: d.details || d.message || '', variant: 'destructive' }); console.error('[enrollments]', d) }
    } catch (e:any) { toast({ title: e?.message || 'Error de red', variant: 'destructive' }); console.error(e) } finally { setSaving(false) }
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
      shift: enr.shift || "",
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
          onClick={() => bulkStep !== "importing" && setActiveTab("individual")}
          disabled={bulkStep === "importing"}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${bulkStep==="importing"?"opacity-50 cursor-not-allowed":""} ${
            activeTab === "individual"
              ? "bg-sb-on-surface text-sb-surface"
              : "text-sb-on-surface-variant/60 hover:text-sb-on-surface"
          }`}
        >
          <User className="h-4 w-4" />
          Carga Individual
        </button>
        <button
          onClick={() => bulkStep !== "importing" && setActiveTab("bulk")}
          disabled={bulkStep === "importing"}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${bulkStep==="importing"?"opacity-50 cursor-not-allowed":""} ${
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
          grades={grades}
          sections={sections}
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
                <td className="text-[10px] font-medium text-sb-on-surface-variant/50 uppercase tracking-wider">Turno</td>
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
                    <td className="text-sb-on-surface/70 text-[13px] capitalize">{enr.shift || "—"}</td>
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Info label="Grado" value={selected.grade} />
                  <Info label="Sección" value={selected.section} />
                  <Info label="Año" value={selected.year.toString()} />
                  <Info label="Turno" value={selected.shift ? selected.shift.charAt(0).toUpperCase()+selected.shift.slice(1) : "—"} />
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
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className={`sb-input w-full flex items-center justify-between text-left text-[13px] ${!form.student_birth_date ? 'text-sb-on-surface-variant/40' : ''}`}>
                    <span>{form.student_birth_date ? new Date(form.student_birth_date+'T00:00:00').toLocaleDateString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric'}) : 'dd/mm/aaaa'}</span>
                    <CalendarIcon className="h-4 w-4 opacity-50" />
                    {form.student_birth_date && (()=>{ const d=new Date(form.student_birth_date); const age=Math.floor((Date.now()-d.getTime())/31557600000); return <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-sb-primary/10 text-sb-primary">{age}a</span> })()}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[9999]" align="start" sideOffset={8}>
                  <CalendarComp
                    mode="single"
                    selected={form.student_birth_date ? new Date(form.student_birth_date+'T00:00:00') : undefined}
                    onSelect={(d: Date | undefined) => setForm({ ...form, student_birth_date: d ? d.toISOString().split('T')[0] : '' })}
                    captionLayout="dropdown"
                    className="rounded-lg border"
                    disabled={(date: Date) => date > new Date() || date < new Date("2000-01-01")}
                  />
                </PopoverContent>
              </Popover>
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
          <div>
            <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Turno</label>
            <select value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })} className="sbf-native-select w-full">
              <option value="">—</option>
              <option value="mañana">Mañana</option>
              <option value="tarde">Tarde</option>
              <option value="noite">Noite</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

function BulkImportView({ step, setStep, file, rows, setRows, progress, results, onFileSelect, onImport, onReset, fileInputRef, grades, sections }: {
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
  grades: string[]
  sections: string[]
}) {
  const validCount = rows.filter(r => r.valid && !r.skipped).length
  const errorCount = rows.filter(r => !r.valid).length
  const duplicateCount = rows.filter(r => r.duplicate).length
  const newCount = rows.filter(r => r.valid && !r.skipped && r.compareStatus === "new").length
  const changedCount = rows.filter(r => r.valid && !r.skipped && r.compareStatus === "changed").length
  const unchangedCount = rows.filter(r => r.valid && r.compareStatus === "unchanged").length

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
            accept=".csv,.xlsx,.xls"
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
                const link = document.createElement("a")
                link.href = "/plantillas/2026v2/matricula_completa_2026v2.csv"
                link.download = `plantilla_matricula_2026v2.csv`
                link.click()
              }}>
              <Download className="h-4 w-4" /> Descargar Plantilla
            </SbBtn>
          </div>
          
          <p className="text-xs text-sb-on-surface-variant/30 mt-4">
            Formato aceptado: .csv, .xlsx
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
          <div className="flex flex-wrap gap-4 mt-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-sb-on-surface-variant/60">{validCount} para importar</span>
            </div>
            {newCount > 0 && (
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sb-primary" />
                <span className="text-xs text-sb-primary">{newCount} nuevos</span>
              </div>
            )}
            {changedCount > 0 && (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-amber-400" />
                <span className="text-xs text-amber-400">{changedCount} por actualizar</span>
              </div>
            )}
            {unchangedCount > 0 && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400/70" />
                <span className="text-xs text-emerald-400/70">{unchangedCount} sin cambios (omitidos)</span>
              </div>
            )}
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
          {errorCount > 0 && (
            <button onClick={() => {
              const updated = rows.map(r => {
                const errs: string[] = []
                if (!r.student_name) errs.push("Nombre del alumno requerido")
                if (!r.student_dni || r.student_dni.length < 8) errs.push("DNI inválido")
                // genero ya autocorregido, no bloquea
                return { ...r, errors: errs, valid: errs.length === 0 }
              })
              setRows(updated)
            }} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sb-primary/10 text-sb-primary text-xs font-medium hover:bg-sb-primary/15 transition-colors">
              <RefreshCw className="h-3.5 w-3.5" /> Re-validar todo
            </button>
          )}
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
                <tr key={i} className={`border-b border-sb-outline-variant/10 ${!row.valid ? "bg-red-500/5" : row.duplicate ? "bg-amber-500/5" : row.compareStatus === "changed" ? "bg-amber-500/5" : row.compareStatus === "unchanged" ? "opacity-60" : ""}`}>
                  <td className="py-2 px-3 font-mono text-xs text-sb-on-surface-variant/50">{row.row}</td>
                  <td className="py-2 px-3">
                    <input
                      value={row.student_name}
                      onChange={(e) => setRows(rows.map((r,j)=>j===i?{...r,student_name:e.target.value}:r))}
                      className={`w-full text-xs bg-transparent border rounded-lg px-1.5 py-1 text-sb-on-surface focus:outline-none ${!row.valid && !row.student_name ? 'border-red-400/50' : 'border-sb-outline-variant/20 focus:border-sb-primary/30'}`}
                      placeholder="Alumno"
                    />
                    {row.compareStatus === "changed" && row.changes && row.changes.length > 0 && (
                      <div className="mt-1.5 space-y-0.5">
                        {row.changes.map((c, ci) => (
                          <div key={ci} className="text-[10px] leading-tight">
                            <span className="text-sb-on-surface-variant/40">{c.field}:</span>{" "}
                            <span className="text-red-400 line-through">{c.old}</span>
                            <span className="text-sb-on-surface-variant/40"> → </span>
                            <span className="text-emerald-400">{c.new}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <input
                      value={row.student_dni}
                      onChange={(e) => setRows(rows.map((r,j)=>j===i?{...r,student_dni:e.target.value}:r))}
                      className={`w-24 text-xs bg-transparent border rounded-lg px-1.5 py-1 font-mono focus:outline-none ${!row.valid && (!row.student_dni||row.student_dni.length<8) ? 'border-red-400/50 text-red-400' : 'border-sb-outline-variant/20 text-sb-on-surface focus:border-sb-primary/30'}`}
                      placeholder="DNI"
                      maxLength={8}
                    />
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex gap-1">
                      <select
                        value={row.grade}
                        onChange={(e) => setRows(rows.map((r,j)=>j===i?{...r,grade:e.target.value}:r))}
                        className="text-xs bg-transparent border border-sb-outline-variant/20 rounded-lg px-1.5 py-1 text-sb-on-surface focus:border-sb-primary/30 focus:outline-none flex-1 min-w-0"
                      >
                        <option value="">Grado</option>
                        {grades.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                      <select
                        value={row.section}
                        onChange={(e) => setRows(rows.map((r,j)=>j===i?{...r,section:e.target.value}:r))}
                        className="text-xs bg-transparent border border-sb-outline-variant/20 rounded-lg px-1.5 py-1 text-sb-on-surface focus:border-sb-primary/30 focus:outline-none w-12"
                      >
                        <option value="">Sec</option>
                        {sections.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    {!row.valid ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 text-red-400 shrink-0" />
                          <span className="text-[10px] text-red-400 line-clamp-2">{row.errors[0]}</span>
                        </div>
                        {row.errors.length > 1 && (
                          <span className="text-[9px] text-red-400/60">+{row.errors.length -1} errores</span>
                        )}
                        <button
                          onClick={() => {
                            // Re-validate after edit
                            const updated = rows.map((r, j) => {
                              if (j !== i) return r
                              const newErrors: string[] = []
                              if (!r.student_name) newErrors.push("Nombre del alumno requerido")
                              if (!r.student_dni || r.student_dni.length < 8) newErrors.push("DNI inválido")
                              if (r.student_gender && !["M", "F", "MASCULINO", "FEMENINO"].includes(r.student_gender)) newErrors.push("Género inválido")
                              return { ...r, errors: newErrors, valid: newErrors.length === 0 }
                            })
                            setRows(updated)
                          }}
                          className="text-[10px] text-sb-primary hover:underline mt-0.5"
                        >
                          Re-validar
                        </button>
                      </div>
                    ) : row.duplicate ? (
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
                    ) : row.compareStatus === "unchanged" ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-emerald-400/70" />
                        <span className="text-[10px] text-emerald-400/70">Sin cambios</span>
                      </div>
                    ) : row.compareStatus === "changed" ? (
                      <div className="flex items-center gap-1">
                        <RefreshCw className="h-4 w-4 text-amber-400" />
                        <span className="text-[10px] text-amber-400">
                          Actualizar{row.existingEnrollmentId ? "" : " (nueva matrícula)"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-4 w-4 text-sb-primary" />
                        <span className="text-[10px] text-sb-primary">Nuevo</span>
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
            <Upload className="h-4 w-4" /> Importar {validCount} registros{changedCount > 0 ? ` (${changedCount} por actualizar)` : ""}
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
