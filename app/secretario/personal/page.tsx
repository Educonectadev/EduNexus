"use client"

import * as React from "react"
import { Plus, Mail, Phone, BadgeCheck, GraduationCap, Briefcase, Search, X, Users, ChevronRight, BookOpen, Calendar, Trash2 } from "@/components/ui/proicons"
import { cn } from "@/lib/utils"
import { SbSectionHeader, SbModal, SbModalBody, SbBtn, SbBadge } from "@/components/ui/sb"
import ImportarDocentesModal from "@/components/secretario/importar-docentes-modal"

interface Staff {
  id: string; email: string; full_name: string; role: string; dni: string; phone: string
  subject: string; grade_level: string; specialization: string; contract_type: string
  status: string; created_at: string; teacher_id: string | null
}

function initials(name: string) { return name.split(" ").map(w => w[0]).filter(Boolean).join("").toUpperCase().slice(0, 2) }

const roleLabels: Record<string, string> = { docente: "Docente", secretario: "Secretario" }

export default function SecretarioPersonalPage() {
  const [staff, setStaff] = React.useState<Staff[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Staff | null>(null)
  const [importOpen, setImportOpen] = React.useState(false)
  const [deleteAllOpen, setDeleteAllOpen] = React.useState(false)
  const [deletingAll, setDeletingAll] = React.useState(false)

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/secretario/personal")
      if (res.ok) setStaff(await res.json())
    } catch {}
    finally { setLoading(false) }
  }

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/secretario/personal")
        if (!cancelled && res.ok) setStaff(await res.json())
      } catch {}
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  const filtered = staff.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.full_name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.dni?.includes(q) || s.subject?.toLowerCase().includes(q)
  })

  const counts = {
    docente: staff.filter(s => s.role === "docente").length,
    secretario: staff.filter(s => s.role === "secretario").length,
  }
  const total = staff.length

  return (
    <div className="space-y-5">
      <SbSectionHeader title="Personal" description="Docentes y secretarios — datos compartidos con el director y los horarios"
        action={
          <div className="flex items-center gap-2">
            <SbBtn variant="tonal" rounded className="flex items-center gap-2 text-red-400" onClick={() => setDeleteAllOpen(true)} disabled={staff.length === 0}>
              <Trash2 className="h-4 w-4" /> Eliminar Todo
            </SbBtn>
            <SbBtn rounded className="flex items-center gap-2" onClick={() => setImportOpen(true)}>
              <Plus className="h-4 w-4" /> Importar personal
            </SbBtn>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-2">
        {(["docente", "secretario"] as const).map(r => (
          <div key={r} className="bg-sb-surface rounded-xl p-3.5 border border-sb-outline-variant/8">
            <div className="flex items-center justify-between mb-2.5">
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", r === "docente" ? "bg-emerald-500/10 text-emerald-500" : "bg-purple-500/10 text-purple-500")}>
                {r === "docente" ? <GraduationCap className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">{counts[r]}</span>
            </div>
            <p className="text-[11px] text-sb-on-surface-variant/50 font-medium">{roleLabels[r]}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/30" />
        <input
          placeholder="Buscar por nombre, DNI, email, asignatura..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-11 pl-11 pr-20 bg-sb-surface rounded-xl border text-sm text-sb-on-surface placeholder:text-sb-on-surface-variant/30 outline-none transition-all border-sb-outline-variant/10 focus:border-sb-primary/30 ring-1 ring-sb-primary/10"
        />
        {search && (
          <>
            <button onClick={() => setSearch("")} className="absolute right-12 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-sb-surface-container-high transition-colors">
              <X className="h-3.5 w-3.5 text-sb-on-surface-variant/30" />
            </button>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-sb-on-surface-variant/30 font-medium">{filtered.length} de {total}</div>
          </>
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
          <button key={s.id} onClick={() => setSelected(s)}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-sb-surface-container-high/30 transition-colors text-left">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-sb-surface-container-high flex items-center justify-center shrink-0">
                <span className="text-xs font-medium text-sb-on-surface-variant/60">{initials(s.full_name)}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-sb-on-surface truncate">{s.full_name}</p>
                <p className="text-xs text-sb-on-surface-variant/40 truncate">{s.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-3">
              {s.role === "docente" && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-sb-on-surface-variant/30">
                  <BookOpen className="h-3 w-3" /> {s.subject || "Sin asignatura"}
                </span>
              )}
              <SbBadge color="bg-sb-surface-container-high text-sb-on-surface-variant/50">{roleLabels[s.role] || s.role}</SbBadge>
              <div className={cn("h-2 w-2 rounded-full", s.status === "active" ? "bg-emerald-400/60" : "bg-sb-on-surface/10")} />
              <ChevronRight className="h-4 w-4 text-sb-on-surface-variant/20" />
            </div>
          </button>
        ))}
      </div>

      <SbModal open={!!selected} onClose={() => setSelected(null)} maxWidth="480px">
        {selected && (
          <SbModalBody noPadding>
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-sb-surface-container-high flex items-center justify-center">
                    <span className="text-sm font-semibold text-sb-on-surface-variant">{initials(selected.full_name)}</span>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-sb-on-surface">{selected.full_name}</p>
                    <p className="text-xs text-sb-on-surface-variant/50">{roleLabels[selected.role] || selected.role}</p>
                  </div>
                </div>
                <SbBadge color={selected.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-sb-surface-container-high text-sb-on-surface-variant/50"}>
                  {selected.status === "active" ? "Activo" : "Inactivo"}
                </SbBadge>
              </div>
            </div>
            <div className="px-6 space-y-3 pb-2">
              <div className="bg-sb-surface-container-high/50 rounded-xl p-4 space-y-3 border border-sb-outline-variant/10">
                <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">Contacto</p>
                <div className="space-y-2.5">
                  {[{ icon: Mail, label: "Email", value: selected.email }, { icon: BadgeCheck, label: "DNI", value: selected.dni }, { icon: Phone, label: "Teléfono", value: selected.phone }].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-sb-surface flex items-center justify-center shrink-0"><item.icon className="h-4 w-4 text-sb-on-surface-variant/40" /></div>
                      <div><p className="text-[10px] text-sb-on-surface-variant/40">{item.label}</p><p className="text-sm text-sb-on-surface">{item.value || "—"}</p></div>
                    </div>
                  ))}
                </div>
              </div>
              {selected.role === "docente" && (
                <div className="bg-sb-surface-container-high/50 rounded-xl p-4 space-y-3 border border-sb-outline-variant/10">
                  <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">Académico</p>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-sb-surface flex items-center justify-center shrink-0"><GraduationCap className="h-4 w-4 text-sb-on-surface-variant/40" /></div>
                      <div><p className="text-[10px] text-sb-on-surface-variant/40">Asignatura</p><p className="text-sm text-sb-on-surface">{selected.subject || "—"}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-sb-surface flex items-center justify-center shrink-0"><GraduationCap className="h-4 w-4 text-sb-on-surface-variant/40" /></div>
                      <div><p className="text-[10px] text-sb-on-surface-variant/40">Grado / Nivel</p><p className="text-sm text-sb-on-surface">{selected.grade_level || "—"}</p></div>
                    </div>
                    {selected.teacher_id && (
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-sb-surface flex items-center justify-center shrink-0"><BookOpen className="h-4 w-4 text-sb-on-surface-variant/40" /></div>
                        <div><p className="text-[10px] text-sb-on-surface-variant/40">Cursos asignados</p><p className="text-sm text-sb-on-surface">Ver en Horarios → Docentes</p></div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="bg-sb-surface-container-high/50 rounded-xl p-4 space-y-3 border border-sb-outline-variant/10">
                <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">Contrato</p>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-sb-surface flex items-center justify-center shrink-0"><Briefcase className="h-4 w-4 text-sb-on-surface-variant/40" /></div>
                    <div><p className="text-[10px] text-sb-on-surface-variant/40">Tipo</p><p className="text-sm text-sb-on-surface capitalize">{selected.contract_type?.trim() || "—"}</p></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 flex gap-2">
              <SbBtn rounded className="flex-1" onClick={() => setSelected(null)}>Cerrar</SbBtn>
              {selected.status === "active" ? (
                <SbBtn variant="tonal" rounded className="flex-1 text-amber-600" onClick={async()=>{
                  if(!confirm(`¿Despedir a ${selected.full_name}? Se marcará como inactivo.`)) return
                  const r = await fetch(`/api/secretario/personal/${selected.id}`, { method: "PATCH", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ action:"despedir"}) })
                  if(r.ok){ setStaff(prev=>prev.map(s=>s.id===selected.id?{...s, status:"inactive"}:s)); setSelected(null) }
                }}>Despedir</SbBtn>
              ) : (
                <SbBtn variant="tonal" rounded className="flex-1 text-red-400" onClick={async()=>{
                  if(!confirm(`¿Eliminar definitivamente a ${selected.full_name}?`)) return
                  const r = await fetch(`/api/secretario/personal/${selected.id}`, { method: "DELETE"})
                  if(r.ok){ setStaff(prev=>prev.filter(s=>s.id!==selected.id)); setSelected(null) }
                }}>Eliminar</SbBtn>
              )}
            </div>
          </SbModalBody>
        )}
      </SbModal>

      <ImportarDocentesModal open={importOpen} onClose={() => setImportOpen(false)} onImported={fetchStaff} />

      {deleteAllOpen && (
        <SbModal open={deleteAllOpen} onClose={() => setDeleteAllOpen(false)} maxWidth="480px">
          <SbModalBody>
            <h3 className="text-base font-semibold text-sb-on-surface">Eliminar todo el personal</h3>
            <p className="text-sm text-sb-on-surface-variant/60 mt-2">Se eliminarán {staff.length} docentes/secretarios de esta institución. Esta acción no se puede deshacer.</p>
            <div className="flex gap-2 mt-6">
              <SbBtn rounded className="flex-1" onClick={() => setDeleteAllOpen(false)}>Cancelar</SbBtn>
              <SbBtn variant="filled" rounded className="flex-1 bg-red-500 hover:bg-red-600 text-white" disabled={deletingAll} onClick={async () => {
                setDeletingAll(true)
                try {
                  const res = await fetch("/api/secretario/personal", { method: "DELETE" })
                  if (res.ok) { setStaff([]); setDeleteAllOpen(false) }
                } finally { setDeletingAll(false) }
              }}>{deletingAll ? "Eliminando..." : "Eliminar Todo"}</SbBtn>
            </div>
          </SbModalBody>
        </SbModal>
      )}
    </div>
  )
}
