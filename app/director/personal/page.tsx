"use client"

import * as React from "react"
import { Plus, Mail, Key, Phone, BadgeCheck, GraduationCap, Briefcase, Copy, Check, RefreshCw, ChevronRight, Search, X, Users, Upload, Download, FileText } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { SbSectionHeader, SbModal, SbModalHeader, SbModalBody, SbModalFooter, SbBtn, SbInput, SbBadge } from "@/components/ui/sb"

interface Staff { id: string; email: string; full_name: string; role: string; dni: string; phone: string; subject: string; grade_level: string; specialization: string; contract_type: string; status: string; created_at: string }

const SUBJECTS = ["Matemática", "Comunicación", "Ciencia y Tecnología", "Historia", "Geografía", "Inglés", "Educación Física", "Arte", "Música", "Religión", "Tutoría", "Química", "Física", "Biología", "Literatura", "Economía", "Informática"]
const GRADE_LEVELS = ["Inicial", "1° Primaria", "2° Primaria", "3° Primaria", "4° Primaria", "5° Primaria", "6° Primaria", "1° Secundaria", "2° Secundaria", "3° Secundaria", "4° Secundaria", "5° Secundaria"]
const ROLES = [{ value: "docente", label: "Docente", desc: "Imparte clases y evalúa alumnos", icon: GraduationCap }, { value: "secretario", label: "Secretario", desc: "Gestiona matrículas y documentos", icon: Briefcase }]

function initials(name: string) { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) }

export default function DirectorPersonalPage() {
  const [staff, setStaff] = React.useState<Staff[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [searchFocused, setSearchFocused] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [step, setStep] = React.useState(1)
  const [formData, setFormData] = React.useState({ full_name: "", email: "", role: "docente", subject: "", dni: "", phone: "", grade_level: "", specialization: "", contract_type: " indefinido" })
  const [saving, setSaving] = React.useState(false)
  const [credentials, setCredentials] = React.useState<{ email: string; password: string } | null>(null)
  const [selectedStaff, setSelectedStaff] = React.useState<Staff | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [regenerating, setRegenerating] = React.useState(false)
  const [newPassword, setNewPassword] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)
  const [importing, setImporting] = React.useState(false)
  const [importResult, setImportResult] = React.useState<{ created: number; skipped: number; errors: string[]; credentials: Array<{ name: string; email: string; password: string }> } | null>(null)

  React.useEffect(() => {
    fetchStaff()
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); inputRef.current?.focus(); inputRef.current?.select() }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const fetchStaff = async () => { try { const res = await fetch("/api/director/staff"); if (res.ok) setStaff(await res.json()) } catch {} finally { setLoading(false) } }
  const resetForm = () => { setFormData({ full_name: "", email: "", role: "docente", subject: "", dni: "", phone: "", grade_level: "", specialization: "", contract_type: " indefinido" }); setStep(1) }

  const handleCreate = async () => {
    setSaving(true)
    try { const res = await fetch("/api/director/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) }); const data = await res.json(); if (res.ok) { if (data.credentials) setCredentials(data.credentials); setDialogOpen(false); resetForm(); fetchStaff() } } catch {} finally { setSaving(false) }
  }

  const roleLabels: Record<string, string> = { docente: "Docente", secretario: "Secretario" }

  const handleRegenPassword = async (staffId: string) => { setRegenerating(true); setNewPassword(null); try { const res = await fetch(`/api/director/staff/${staffId}/reset-password`, { method: "POST" }); const data = await res.json(); if (res.ok && data.password) setNewPassword(data.password) } catch {} finally { setRegenerating(false) } }
  const handleCopy = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/dev/docentes/import', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        setImportResult(data)
        fetchStaff()
      }
    } catch {} finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const filtered = staff.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.full_name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.dni?.includes(q) || s.subject?.toLowerCase().includes(q)
  })

  const counts = { docente: staff.filter(s => s.role === "docente").length, secretario: staff.filter(s => s.role === "secretario").length }
  const total = staff.length

  return (
    <div className="space-y-5">
      <SbSectionHeader title="Personal" description="Gestiona el personal de la institución"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <a href="/plantilla_docentes.csv" download className="sb-btn outlined rounded flex items-center gap-2 text-xs">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Plantilla</span>
            </a>
            <label className="sb-btn tonal rounded flex items-center gap-2 cursor-pointer text-xs">
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Importar CSV</span>
              <input type="file" accept=".csv" onChange={handleImport} className="hidden" disabled={importing} />
            </label>
            <SbBtn variant="filled" rounded className="flex items-center gap-1.5 text-xs" onClick={() => { setDialogOpen(true); resetForm() }}>
              <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Contratar</span><span className="sm:hidden">Nuevo</span>
            </SbBtn>
          </div>
        } />

      <div className="grid grid-cols-2 gap-2">
        {ROLES.map(r => (
          <div key={r.value} className="bg-sb-surface rounded-xl p-3.5 border border-sb-outline-variant/8">
            <div className="flex items-center justify-between mb-2.5">
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", r.value === "docente" ? "bg-emerald-500/10 text-emerald-500" : "bg-purple-500/10 text-purple-500")}>
                <r.icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                {counts[r.value as keyof typeof counts] || 0}
              </span>
            </div>
            <p className="text-[11px] text-sb-on-surface-variant/50 font-medium">{r.label}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/30" />
        <input
          ref={inputRef}
          placeholder="Buscar por nombre, DNI, email, asignatura..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className={cn(
            "w-full h-11 pl-11 pr-20 bg-sb-surface rounded-xl border text-sm text-sb-on-surface placeholder:text-sb-on-surface-variant/30 outline-none transition-all",
            searchFocused ? "border-sb-primary/30 ring-1 ring-sb-primary/10" : "border-sb-outline-variant/10"
          )}
        />
        {search && (
          <button onClick={() => setSearch("")}
            className="absolute right-12 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-sb-surface-container-high transition-colors">
            <X className="h-3.5 w-3.5 text-sb-on-surface-variant/30" />
          </button>
        )}
        {search && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-sb-on-surface-variant/30 font-medium">
            {filtered.length} de {total}
          </div>
        )}
        {!search && !searchFocused && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-sb-on-surface-variant/20">
            <kbd className="px-1.5 py-0.5 rounded bg-sb-surface-container-high text-sb-on-surface-variant/30 font-mono">⌘K</kbd>
          </div>
        )}
      </div>

      <div className="bg-sb-surface rounded-xl divide-y divide-sb-outline-variant/8 border border-sb-outline-variant/8">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 border-2 border-sb-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="px-5 py-12 text-center">
            <Users className="h-8 w-8 mx-auto mb-3 text-sb-on-surface-variant/15" />
            <p className="text-sm font-medium text-sb-on-surface-variant/50">
              {search ? `Sin resultados para "${search}"` : "Sin personal registrado"}
            </p>
          </div>
        )}
        {!loading && filtered.map((s) => (
          <button key={s.id} onClick={() => { setSelectedStaff(s); setNewPassword(null); setDetailOpen(true) }}
            className="w-full flex items-center justify-between px-3 sm:px-4 py-3 sm:py-3.5 hover:bg-sb-surface-container-high/30 transition-colors text-left">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-sb-surface-container-high flex items-center justify-center shrink-0">
                <span className="text-[10px] sm:text-xs font-medium text-sb-on-surface-variant/60">{initials(s.full_name)}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[13px] sm:text-sm font-medium text-sb-on-surface truncate">{s.full_name}</p>
                <p className="text-[11px] sm:text-xs text-sb-on-surface-variant/40 truncate">{s.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2 sm:ml-3">
              <SbBadge color="bg-sb-surface-container-high text-sb-on-surface-variant/50" className="hidden sm:inline-flex">{roleLabels[s.role] || s.role}</SbBadge>
              <div className={cn("h-2 w-2 rounded-full", s.status === "active" ? "bg-emerald-400/60" : "bg-sb-on-surface/10")} />
              <ChevronRight className="h-4 w-4 text-sb-on-surface-variant/20" />
            </div>
          </button>
        ))}
      </div>

      {/* Hire wizard */}
      <SbModal open={dialogOpen} onClose={() => { setDialogOpen(false); resetForm() }} maxWidth="520px">
        <SbModalBody noPadding>
          <div className="px-4 sm:px-6 pt-6 pb-4">
            <h3 className="text-lg font-semibold text-sb-on-surface">Contratar Personal</h3>
            <p className="text-xs text-sb-on-surface-variant/50 mt-1">Completa los datos para registrar un nuevo miembro del staff.</p>
            <div className="flex items-center gap-2 mt-4">
              {[1, 2].map(s => <div key={s} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", step >= s ? "bg-sb-on-surface" : "bg-sb-outline-variant/30")} />)}
            </div>
            <p className="text-[10px] text-sb-on-surface-variant/40 mt-2">{step === 1 ? "Paso 1 — Datos personales" : "Paso 2 — Asignación y contrato"}</p>
          </div>

          {step === 1 && (
            <div className="px-4 sm:px-6 space-y-4 pb-2">
              <div><label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Nombre completo *</label>
                <div className="relative"><SbInput placeholder="Juan Pérez López" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} style={{ paddingLeft: "36px" }} />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sb-on-surface-variant/30"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span></div></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">DNI *</label>
                  <div className="relative"><SbInput placeholder="12345678" maxLength={8} value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value.replace(/\D/g, "")})} style={{ paddingLeft: "36px" }} />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sb-on-surface-variant/30"><BadgeCheck className="h-4 w-4" /></span></div></div>
                <div><label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Teléfono</label>
                  <div className="relative"><SbInput placeholder="999 888 777" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ paddingLeft: "36px" }} />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sb-on-surface-variant/30"><Phone className="h-4 w-4" /></span></div></div>
              </div>
              <div>
                <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Email (opcional)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1 min-w-0">
                    <SbInput placeholder="Se genera automáticamente si se deja vacío" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ paddingLeft: "36px" }} />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sb-on-surface-variant/30"><Mail className="h-4 w-4" /></span>
                  </div>
                  {formData.full_name && (
                    <button type="button" className="sb-btn tonal text-xs whitespace-nowrap shrink-0"
                      onClick={() => {
                        const clean = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z\s]/g, "").trim()
                        const parts = clean(formData.full_name).split(/\s+/)
                        const first = parts[0] || ""
                        const last = parts[parts.length - 1] || ""
                        const prefix = formData.role === "secretario" ? "sec" : "doc"
                        setFormData({...formData, email: `${prefix}.${first}.${last}@iep.edu.pe`})
                      }}
                    >
                      Auto
                    </button>
                  )}
                </div>
                {formData.full_name && !formData.email && (
                  <p className="text-[10px] text-sb-on-surface-variant/50 mt-1">
                    Sugerido: {(() => {
                      const clean = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z\s]/g, "").trim()
                      const parts = clean(formData.full_name).split(/\s+/)
                      const first = parts[0] || ""
                      const last = parts[parts.length - 1] || ""
                      const prefix = formData.role === "secretario" ? "sec" : "doc"
                      return `${prefix}.${first}.${last}@iep.edu.pe`
                    })()}
                  </p>
                )}
              </div>
              <div><label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Rol *</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map(r => (
                    <button key={r.value} type="button" onClick={() => setFormData({...formData, role: r.value})}
                      className={cn(
                        "flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-all duration-200",
                        formData.role === r.value
                          ? "bg-sb-on-surface text-sb-surface border-transparent"
                          : "bg-sb-surface-container-high text-sb-on-surface-variant border-sb-outline-variant/20 hover:border-sb-outline/30"
                      )}>
                      <r.icon className="h-5 w-5" /><span className="text-sm font-medium">{r.label}</span><span className="text-[10px] leading-tight opacity-60">{r.desc}</span>
                    </button>
                  ))}
                </div></div>
            </div>
          )}

          {step === 2 && (
            <div className="px-4 sm:px-6 space-y-4 pb-2">
              {formData.role === "docente" && (
                <>
                  <div><label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Asignatura *</label>
                    <select value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="sbf-native-select w-full">
                      <option value="">Seleccionar asignatura...</option>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select></div>
                  <div><label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Grado / Nivel</label>
                    <select value={formData.grade_level} onChange={e => setFormData({...formData, grade_level: e.target.value})} className="sbf-native-select w-full">
                      <option value="">Seleccionar grado...</option>{GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select></div>
                  <div><label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Especialización</label>
                    <SbInput placeholder="Ej: Tutoría, orientación" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} /></div>
                </>
              )}
              <div><label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Tipo de contrato</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ value: " indefinido", label: "Indefinido" }, { value: " temporal", label: "Temporal" }, { value: " practicas", label: "Prácticas" }].map(c => (
                    <button key={c.value} type="button" onClick={() => setFormData({...formData, contract_type: c.value})}
                      className={cn(
                        "h-10 rounded-xl text-xs font-medium border transition-all duration-200",
                        formData.contract_type === c.value
                          ? "bg-sb-on-surface text-sb-surface border-transparent"
                          : "bg-sb-surface-container-high text-sb-on-surface-variant border-sb-outline-variant/20 hover:border-sb-outline/30"
                      )}>{c.label}</button>
                  ))}
                </div></div>
              <div className="bg-sb-surface-container-high/50 rounded-xl p-4 space-y-3 border border-sb-outline-variant/10">
                <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">Resumen</p>
                {[
                  ["Nombre", formData.full_name], ["DNI", formData.dni], ["Rol", ROLES.find(r => r.value === formData.role)?.label],
                  ...(formData.role === "docente" ? [["Asignatura", formData.subject], ["Grado", formData.grade_level]] : []),
                  ["Contrato", formData.contract_type.trim()],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex items-center gap-2 text-sm"><span className="text-sb-on-surface-variant/40">{label}:</span><span className="text-sb-on-surface">{(val as string) || "—"}</span></div>
                ))}
              </div>
            </div>
          )}
        </SbModalBody>

        <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-2">
          {step === 2 && <SbBtn rounded onClick={() => setStep(1)} className="order-last sm:order-first">Atrás</SbBtn>}
          <div className="flex-1" />
          <SbBtn rounded onClick={() => { setDialogOpen(false); resetForm() }}>Cancelar</SbBtn>
          {step === 1 ? (
            <SbBtn variant="filled" rounded onClick={() => setStep(2)} disabled={!formData.full_name || !formData.dni}>Siguiente</SbBtn>
          ) : (
            <SbBtn variant="filled" rounded onClick={handleCreate} disabled={saving || (formData.role === "docente" && !formData.subject)}>{saving ? "Creando..." : "Crear personal"}</SbBtn>
          )}
        </div>
      </SbModal>

      {/* Credentials modal */}
      <SbModal open={!!credentials} onClose={() => setCredentials(null)} maxWidth="400px">
        <SbModalHeader title="Credenciales generadas" onClose={() => setCredentials(null)} />
        <SbModalBody>
          <div className="text-center mb-4"><div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 mx-auto mb-2"><Key className="h-5 w-5 text-emerald-400" /></div><p className="text-xs text-sb-on-surface-variant/50">Guarda estos datos, no se vuelven a mostrar.</p></div>
          {credentials && (
            <div className="bg-sb-surface-container-high rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-sb-surface flex items-center justify-center"><Mail className="h-4 w-4 text-sb-on-surface-variant/50" /></div><div><p className="text-[10px] text-sb-on-surface-variant/40">Email</p><p className="text-sm font-medium text-sb-on-surface">{credentials.email}</p></div></div>
              <div className="h-px bg-sb-outline-variant/20" />
              <div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-sb-surface flex items-center justify-center"><Key className="h-4 w-4 text-sb-on-surface-variant/50" /></div><div><p className="text-[10px] text-sb-on-surface-variant/40">Contraseña</p><p className="text-sm font-mono font-medium text-sb-on-surface">{credentials.password}</p></div></div>
            </div>
          )}
        </SbModalBody>
        <SbModalFooter><SbBtn variant="filled" rounded className="w-full" onClick={() => setCredentials(null)}>Entendido</SbBtn></SbModalFooter>
      </SbModal>

      {/* Detail modal */}
      <SbModal open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="480px">
        {selectedStaff && (
          <SbModalBody noPadding>
            <div className="px-4 sm:px-6 pt-6 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-sb-surface-container-high flex items-center justify-center"><span className="text-sm font-semibold text-sb-on-surface-variant">{initials(selectedStaff.full_name)}</span></div>
                  <div><p className="text-base font-semibold text-sb-on-surface">{selectedStaff.full_name}</p><p className="text-xs text-sb-on-surface-variant/50">{roleLabels[selectedStaff.role] || selectedStaff.role}</p></div>
                </div>
                <SbBadge color={selectedStaff.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-sb-surface-container-high text-sb-on-surface-variant/50"}>{selectedStaff.status === "active" ? "Activo" : "Inactivo"}</SbBadge>
              </div>
            </div>
            <div className="px-4 sm:px-6 space-y-3 pb-2">
              <div className="bg-sb-surface-container-high/50 rounded-xl p-3 sm:p-4 space-y-3 border border-sb-outline-variant/10">
                <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">Contacto</p>
                <div className="space-y-2.5">
                  {[{ icon: Mail, label: "Email", value: selectedStaff.email }, { icon: BadgeCheck, label: "DNI", value: selectedStaff.dni }, { icon: Phone, label: "Teléfono", value: selectedStaff.phone }].map(item => (
                    <div key={item.label} className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-sb-surface flex items-center justify-center shrink-0"><item.icon className="h-4 w-4 text-sb-on-surface-variant/40" /></div><div><p className="text-[10px] text-sb-on-surface-variant/40">{item.label}</p><p className="text-sm text-sb-on-surface">{item.value || "—"}</p></div></div>
                  ))}
                </div>
              </div>
              {selectedStaff.role === "docente" && (
                <div className="bg-sb-surface-container-high/50 rounded-xl p-3 sm:p-4 space-y-3 border border-sb-outline-variant/10">
                  <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">Académico</p>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-sb-surface flex items-center justify-center shrink-0"><GraduationCap className="h-4 w-4 text-sb-on-surface-variant/40" /></div><div><p className="text-[10px] text-sb-on-surface-variant/40">Asignatura</p><p className="text-sm text-sb-on-surface">{selectedStaff.subject || "—"}</p></div></div>
                    <div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-sb-surface flex items-center justify-center shrink-0"><GraduationCap className="h-4 w-4 text-sb-on-surface-variant/40" /></div><div><p className="text-[10px] text-sb-on-surface-variant/40">Grado / Nivel</p><p className="text-sm text-sb-on-surface">{selectedStaff.grade_level || "—"}</p></div></div>
                  </div>
                </div>
              )}
              <div className="bg-sb-surface-container-high/50 rounded-xl p-3 sm:p-4 space-y-3 border border-sb-outline-variant/10">
                <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">Contrato</p>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-sb-surface flex items-center justify-center shrink-0"><Briefcase className="h-4 w-4 text-sb-on-surface-variant/40" /></div><div><p className="text-[10px] text-sb-on-surface-variant/40">Tipo</p><p className="text-sm text-sb-on-surface capitalize">{selectedStaff.contract_type?.trim() || "—"}</p></div></div>
                </div>
              </div>
              <div className="bg-sb-surface-container-high/50 rounded-xl p-3 sm:p-4 space-y-3 border border-sb-outline-variant/10">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">Contraseña</p>
                  <button onClick={() => handleRegenPassword(selectedStaff.id)} disabled={regenerating} className="flex items-center gap-1.5 text-[10px] text-sb-on-surface font-medium hover:opacity-80 transition-opacity disabled:opacity-40">
                    <RefreshCw className={cn("h-3 w-3", regenerating && "animate-spin")} />{regenerating ? "Generando..." : "Regenerar"}</button>
                </div>
                {newPassword ? (
                  <div className="flex items-center gap-2 bg-sb-surface rounded-lg p-3">
                    <Key className="h-4 w-4 text-emerald-400 shrink-0" /><span className="text-sm font-mono text-sb-on-surface flex-1">{newPassword}</span>
                    <button onClick={() => handleCopy(newPassword)} className="p-1.5 rounded-lg hover:bg-sb-surface-container-high transition-colors">{copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-sb-on-surface-variant/50" />}</button>
                  </div>
                ) : <p className="text-xs text-sb-on-surface-variant/30">La contraseña hasheada no se puede mostrar. Usa &ldquo;Regenerar&rdquo; para crear una nueva.</p>}
              </div>
            </div>
            <div className="px-4 sm:px-6 py-4"><SbBtn variant="filled" rounded className="w-full" onClick={() => setDetailOpen(false)}>Cerrar</SbBtn></div>
          </SbModalBody>
        )}
      </SbModal>

      {/* Import Result Modal */}
      <SbModal open={!!importResult} onClose={() => setImportResult(null)} maxWidth="500px">
        <SbModalHeader title="Resultado de importación" onClose={() => setImportResult(null)} />
        <SbModalBody className="max-h-[70vh] overflow-y-auto">
          {importResult && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-500">{importResult.created}</p>
                  <p className="text-[11px] text-emerald-500/70">Importados</p>
                </div>
                <div className="bg-amber-500/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-amber-500">{importResult.skipped}</p>
                  <p className="text-[11px] text-amber-500/70">Omitidos (DNI duplicado)</p>
                </div>
              </div>

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <div className="bg-red-500/10 rounded-xl p-3">
                  <p className="text-[11px] font-medium text-red-500 mb-1">Errores:</p>
                  {importResult.errors.map((err, i) => (
                    <p key={i} className="text-[10px] text-red-500/70">{err}</p>
                  ))}
                </div>
              )}

              {/* Credentials */}
              {importResult.credentials.length > 0 && (
                <div className="bg-sb-surface-container-high rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Key className="h-4 w-4 text-sb-primary" />
                    <p className="text-[12px] font-medium text-sb-on-surface">Credenciales generadas</p>
                  </div>
                  <p className="text-[10px] text-sb-on-surface/50 mb-3">Guarda estos datos. Las contraseñas no se vuelven a mostrar.</p>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {importResult.credentials.map((cred, i) => (
                      <div key={i} className="bg-sb-surface rounded-lg p-2.5 flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-sb-on-surface truncate">{cred.name}</p>
                          <p className="text-[10px] text-sb-on-surface/50 font-mono">{cred.email}</p>
                          <p className="text-[10px] text-sb-on-surface/50 font-mono">{cred.password}</p>
                        </div>
                        <button onClick={() => handleCopy(`${cred.email}\n${cred.password}`)} className="p-1.5 rounded-lg hover:bg-sb-surface-container-high transition-colors shrink-0">
                          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-sb-on-surface-variant/50" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SbModalBody>
        <SbModalFooter>
          <SbBtn variant="filled" rounded className="w-full" onClick={() => setImportResult(null)}>Entendido</SbBtn>
        </SbModalFooter>
      </SbModal>
    </div>
  )
}
