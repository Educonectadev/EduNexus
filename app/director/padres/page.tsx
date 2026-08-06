"use client"

import * as React from "react"
import { Plus, Mail, Key, Phone, BadgeCheck, GraduationCap, Users, Copy, Check, Search, X, Link2, Unlink, ChevronRight } from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { SbSectionHeader, SbModal, SbModalHeader, SbModalBody, SbModalFooter, SbBtn, SbInput, SbBadge } from "@/components/ui/sb"

interface ParentStudent { name: string; relationship: string; id: string; grade: string; section: string }
interface Parent { id: string; first_name: string; last_name: string; document_type: string; document_number: string; email: string; phone: string; address: string; occupation: string; status: string; linked_students: ParentStudent[]; has_account: boolean; account_status: string | null }

const RELATIONSHIPS = [
  { value: "padre", label: "Padre" },
  { value: "madre", label: "Madre" },
  { value: "apoderado", label: "Apoderado" },
  { value: "tio", label: "Tío" },
  { value: "abuelo", label: "Abuelo" },
]

function initials(name: string) { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) }

export default function DirectorPadresPage() {
  const [parents, setParents] = React.useState<Parent[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [searchFocused, setSearchFocused] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [step, setStep] = React.useState(1)
  const [formData, setFormData] = React.useState({ first_name: "", last_name: "", document_number: "", phone: "", email: "", occupation: "", student_id: "", relationship: "padre" })
  const [saving, setSaving] = React.useState(false)
  const [credentials, setCredentials] = React.useState<{ email: string; password: string } | null>(null)
  const [selectedParent, setSelectedParent] = React.useState<Parent | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [students, setStudents] = React.useState<any[]>([])

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [padresRes, plantelRes] = await Promise.all([
          fetch("/api/director/padres"),
          fetch("/api/director/plantel"),
        ])
        if (padresRes.ok) setParents(await padresRes.json())
        if (plantelRes.ok) {
          const data = await plantelRes.json()
          setStudents(data.students || data || [])
        }
      } catch {} finally { setLoading(false) }
    }
    loadData()
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); inputRef.current?.focus(); inputRef.current?.select() }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const fetchParents = async () => {
    try {
      const res = await fetch("/api/director/padres")
      if (res.ok) setParents(await res.json())
    } catch {} finally { setLoading(false) }
  }

  const resetForm = () => { setFormData({ first_name: "", last_name: "", document_number: "", phone: "", email: "", occupation: "", student_id: "", relationship: "padre" }); setStep(1) }

  const handleCreate = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/director/padres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, create_account: true }),
      })
      const data = await res.json()
      if (res.ok) {
        if (data.generated_email && data.generated_password) {
          setCredentials({ email: data.generated_email, password: data.generated_password })
        }
        setDialogOpen(false); resetForm(); fetchParents()
      }
    } catch {} finally { setSaving(false) }
  }

  const handleCopy = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }

  const filtered = parents.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase()
    return fullName.includes(q) || p.document_number?.includes(q) || p.email?.toLowerCase().includes(q) || p.phone?.includes(q)
  })

  const accountCount = parents.filter(p => p.has_account).length
  const noAccountCount = parents.filter(p => !p.has_account).length

  return (
    <div className="space-y-5">
      <SbSectionHeader title="Padres de Familia" description="Gestiona las cuentas de acceso de los padres"
        action={<SbBtn variant="filled" rounded className="flex items-center gap-2" onClick={() => { setDialogOpen(true); resetForm() }}>
          <Plus className="h-4 w-4" /> Registrar Padre
        </SbBtn>} />

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total Padres", value: parents.length, color: "bg-blue-500/10 text-blue-500" },
          { label: "Con Cuenta", value: accountCount, color: "bg-emerald-500/10 text-emerald-500" },
          { label: "Sin Cuenta", value: noAccountCount, color: "bg-amber-500/10 text-amber-500" },
        ].map((stat, i) => (
          <div key={i} className="bg-sb-surface rounded-xl p-3.5 border border-sb-outline-variant/8">
            <p className={cn("text-xl font-bold", stat.color.split(" ")[1])}>{stat.value}</p>
            <p className="text-[10px] text-sb-on-surface-variant/50 font-medium mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/30" />
        <input ref={inputRef} placeholder="Buscar por nombre, DNI, email, teléfono..."
          value={search} onChange={e => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
          className={cn("w-full h-11 pl-11 pr-20 bg-sb-surface rounded-xl border text-sm text-sb-on-surface placeholder:text-sb-on-surface-variant/30 outline-none transition-all",
            searchFocused ? "border-sb-primary/30 ring-1 ring-sb-primary/10" : "border-sb-outline-variant/10"
          )} />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-12 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-sb-surface-container-high transition-colors">
            <X className="h-3.5 w-3.5 text-sb-on-surface-variant/30" />
          </button>
        )}
        {search && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-sb-on-surface-variant/30 font-medium">
            {filtered.length} de {parents.length}
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
              {search ? `Sin resultados para "${search}"` : "Sin padres registrados"}
            </p>
          </div>
        )}
        {!loading && filtered.map((p) => (
          <button key={p.id} onClick={() => { setSelectedParent(p); setDetailOpen(true) }}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-sb-surface-container-high/30 transition-colors text-left">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-sb-surface-container-high flex items-center justify-center shrink-0">
                <span className="text-xs font-medium text-sb-on-surface-variant/60">{initials(`${p.first_name} ${p.last_name}`)}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-sb-on-surface truncate">{p.first_name} {p.last_name}</p>
                <p className="text-xs text-sb-on-surface-variant/40 truncate">{p.email || p.document_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-3">
              {p.linked_students?.length > 0 && (
                <span className="text-[10px] text-sb-on-surface-variant/40">{p.linked_students.length} hijo(s)</span>
              )}
              <SbBadge color={p.has_account ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}>
                {p.has_account ? "Con cuenta" : "Sin cuenta"}
              </SbBadge>
              <ChevronRight className="h-4 w-4 text-sb-on-surface-variant/20" />
            </div>
          </button>
        ))}
      </div>

      {/* Create dialog */}
      <SbModal open={dialogOpen} onClose={() => { setDialogOpen(false); resetForm() }} maxWidth="520px">
        <SbModalBody >
          <div className="px-6 pt-6 pb-4">
            <h3 className="text-lg font-semibold text-sb-on-surface">Registrar Padre de Familia</h3>
            <p className="text-xs text-sb-on-surface-variant/50 mt-1">Se creará una cuenta de acceso al portal de padres.</p>
            <div className="flex items-center gap-2 mt-4">
              {[1, 2].map(s => <div key={s} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", step >= s ? "bg-sb-on-surface" : "bg-sb-outline-variant/30")} />)}
            </div>
            <p className="text-[10px] text-sb-on-surface-variant/40 mt-2">{step === 1 ? "Paso 1 — Datos del padre" : "Paso 2 — Vincular hijo"}</p>
          </div>

          {step === 1 && (
            <div className="px-6 space-y-4 pb-2">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Nombre *</label>
                  <SbInput placeholder="Juan" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} /></div>
                <div><label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Apellido *</label>
                  <SbInput placeholder="Pérez López" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">DNI *</label>
                  <div className="relative"><SbInput placeholder="12345678" maxLength={8} value={formData.document_number} onChange={e => setFormData({...formData, document_number: e.target.value.replace(/\D/g, "")})} style={{ paddingLeft: "36px" }} />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sb-on-surface-variant/30"><BadgeCheck className="h-4 w-4" /></span></div></div>
                <div><label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Teléfono</label>
                  <div className="relative"><SbInput placeholder="999 888 777" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ paddingLeft: "36px" }} />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sb-on-surface-variant/30"><Phone className="h-4 w-4" /></span></div></div>
              </div>
              <div><label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Email (opcional)</label>
                <div className="relative"><SbInput placeholder="Se genera automáticamente si se deja vacío" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ paddingLeft: "36px" }} />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sb-on-surface-variant/30"><Mail className="h-4 w-4" /></span></div></div>
              <div><label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Ocupación</label>
                <SbInput placeholder="Ej: Ingeniero, Contador" value={formData.occupation} onChange={e => setFormData({...formData, occupation: e.target.value})} /></div>
            </div>
          )}

          {step === 2 && (
            <div className="px-6 space-y-4 pb-2">
              <div><label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Hijo a vincular</label>
                <select value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})} className="sbf-native-select w-full">
                  <option value="">Seleccionar alumno...</option>
                  {students.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name} — {s.grade} {s.section}</option>
                  ))}
                </select></div>
              <div><label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Parentesco</label>
                <div className="grid grid-cols-3 gap-2">
                  {RELATIONSHIPS.map(r => (
                    <button key={r.value} type="button" onClick={() => setFormData({...formData, relationship: r.value})}
                      className={cn("h-10 rounded-xl text-xs font-medium border transition-all duration-200",
                        formData.relationship === r.value ? "bg-sb-on-surface text-sb-surface border-transparent" : "bg-sb-surface-container-high text-sb-on-surface-variant border-sb-outline-variant/20 hover:border-sb-outline/30"
                      )}>{r.label}</button>
                  ))}
                </div></div>
              <div className="bg-sb-surface-container-high/50 rounded-xl p-4 space-y-3 border border-sb-outline-variant/10">
                <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">Resumen</p>
                <div className="space-y-2">
                  {[["Nombre", `${formData.first_name} ${formData.last_name}`], ["DNI", formData.document_number], ["Teléfono", formData.phone || "—"], ["Hijo", students.find((s: any) => s.id === formData.student_id) ? `${students.find((s: any) => s.id === formData.student_id)?.first_name} ${students.find((s: any) => s.id === formData.student_id)?.last_name}` : "—"], ["Parentesco", RELATIONSHIPS.find(r => r.value === formData.relationship)?.label]].map(([label, val]) => (
                    <div key={label as string} className="flex items-center gap-2 text-sm"><span className="text-sb-on-surface-variant/40">{label}:</span><span className="text-sb-on-surface">{val as string}</span></div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SbModalBody>

        <div className="px-6 py-4 flex flex-row gap-2">
          {step === 2 && <SbBtn rounded onClick={() => setStep(1)}>Atrás</SbBtn>}
          <div className="flex-1" />
          <SbBtn rounded onClick={() => { setDialogOpen(false); resetForm() }}>Cancelar</SbBtn>
          {step === 1 ? (
            <SbBtn variant="filled" rounded onClick={() => setStep(2)} disabled={!formData.first_name || !formData.last_name || !formData.document_number}>Siguiente</SbBtn>
          ) : (
            <SbBtn variant="filled" rounded onClick={handleCreate} disabled={saving}>{saving ? "Creando..." : "Crear Padre"}</SbBtn>
          )}
        </div>
      </SbModal>

      {/* Credentials modal */}
      <SbModal open={!!credentials} onClose={() => setCredentials(null)} maxWidth="400px">
        <SbModalHeader title="Credenciales generadas" onClose={() => setCredentials(null)} />
        <SbModalBody>
          <div className="text-center mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 mx-auto mb-2">
              <Key className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-xs text-sb-on-surface-variant/50">Guarda estos datos, no se vuelven a mostrar.</p>
            <p className="text-[10px] text-sb-on-surface-variant/30 mt-1">El padre puede usar estos datos en <span className="font-semibold">/login-padre</span></p>
          </div>
          {credentials && (
            <div className="bg-sb-surface-container-high rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-sb-surface flex items-center justify-center"><Mail className="h-4 w-4 text-sb-on-surface-variant/50" /></div><div><p className="text-[10px] text-sb-on-surface-variant/40">Email</p><p className="text-sm font-medium text-sb-on-surface">{credentials.email}</p></div></div>
              <div className="h-px bg-sb-outline-variant/20" />
              <div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-sb-surface flex items-center justify-center"><Key className="h-4 w-4 text-sb-on-surface-variant/50" /></div><div><p className="text-[10px] text-sb-on-surface-variant/40">Contraseña</p><p className="text-sm font-mono font-medium text-sb-on-surface">{credentials.password}</p></div></div>
            </div>
          )}
        </SbModalBody>
        <SbModalFooter>
          <div className="flex gap-2 w-full">
            <SbBtn rounded className="flex-1" onClick={() => { if (credentials) { handleCopy(`${credentials.email}\n${credentials.password}`) } }}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar"}
            </SbBtn>
            <SbBtn variant="filled" rounded className="flex-1" onClick={() => setCredentials(null)}>Entendido</SbBtn>
          </div>
        </SbModalFooter>
      </SbModal>

      {/* Detail modal */}
      <SbModal open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="480px">
        {selectedParent && (
          <SbModalBody >
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-sb-surface-container-high flex items-center justify-center">
                    <span className="text-sm font-semibold text-sb-on-surface-variant">{initials(`${selectedParent.first_name} ${selectedParent.last_name}`)}</span>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-sb-on-surface">{selectedParent.first_name} {selectedParent.last_name}</p>
                    <p className="text-xs text-sb-on-surface-variant/50">{selectedParent.document_type} {selectedParent.document_number}</p>
                  </div>
                </div>
                <SbBadge color={selectedParent.has_account ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}>
                  {selectedParent.has_account ? "Con cuenta" : "Sin cuenta"}
                </SbBadge>
              </div>
            </div>
            <div className="px-6 space-y-3 pb-2">
              <div className="bg-sb-surface-container-high/50 rounded-xl p-4 space-y-3 border border-sb-outline-variant/10">
                <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">Contacto</p>
                <div className="space-y-2.5">
                  {[{ icon: Mail, label: "Email", value: selectedParent.email || "Sin email" }, { icon: Phone, label: "Teléfono", value: selectedParent.phone || "Sin teléfono" }, { icon: BadgeCheck, label: "DNI", value: selectedParent.document_number }].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-sb-surface flex items-center justify-center shrink-0"><item.icon className="h-4 w-4 text-sb-on-surface-variant/40" /></div>
                      <div><p className="text-[10px] text-sb-on-surface-variant/40">{item.label}</p><p className="text-sm text-sb-on-surface">{item.value}</p></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-sb-surface-container-high/50 rounded-xl p-4 space-y-3 border border-sb-outline-variant/10">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">Hijos Vinculados</p>
                  <Link2 className="h-3.5 w-3.5 text-sb-on-surface-variant/30" />
                </div>
                {selectedParent.linked_students?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedParent.linked_students.map((s, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-sb-surface flex items-center justify-center shrink-0"><GraduationCap className="h-4 w-4 text-sb-on-surface-variant/40" /></div>
                        <div className="flex-1">
                          <p className="text-sm text-sb-on-surface">{s.name}</p>
                          <p className="text-[10px] text-sb-on-surface-variant/40">{s.grade} {s.section} · {s.relationship}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-sb-on-surface-variant/30">Sin hijos vinculados</p>
                )}
              </div>

              {selectedParent.has_account && (
                <div className="bg-sb-surface-container-high/50 rounded-xl p-4 border border-sb-outline-variant/10">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-sb-surface flex items-center justify-center"><Key className="h-4 w-4 text-sb-on-surface-variant/40" /></div>
                    <div className="flex-1">
                      <p className="text-[10px] text-sb-on-surface-variant/40">Cuenta de Acceso</p>
                      <p className="text-sm text-sb-on-surface">{selectedParent.email}</p>
                    </div>
                    <SbBadge color="bg-emerald-500/10 text-emerald-400">Activa</SbBadge>
                  </div>
                </div>
              )}

              {!selectedParent.has_account && (
                <div className="bg-amber-500/5 rounded-xl p-4 border border-amber-500/10">
                  <p className="text-xs text-amber-500/70">Este padre no tiene cuenta de acceso. Edita para crear una.</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4">
              <SbBtn variant="filled" rounded className="w-full" onClick={() => setDetailOpen(false)}>Cerrar</SbBtn>
            </div>
          </SbModalBody>
        )}
      </SbModal>
    </div>
  )
}
