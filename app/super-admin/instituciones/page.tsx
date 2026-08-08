"use client"

import * as React from "react"
import { Plus, Search, Eye, LayoutDashboard, Users, GraduationCap, Building2, X, Trash2, CreditCard, Download, Pencil, MapPin, Phone, Mail } from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import { SbBtn, SbModal, SbModalHeader, SbModalBody, SbModalFooter, SbLabel, SbInput, SbSelect, useToast } from "@/components/ui/sb"
import { useRouter } from "next/navigation"

interface Institution {
  id: string
  name: string
  code: string
  plan_name: string | null
  plan_price: number | null
  status: string
  total_students: number
  total_teachers: number
  type: string
  level: string
  modality: string
  shift: string
  department: string
  province: string
  district: string
  address: string
  phone: string
  email: string
  director_name: string
  director_dni: string
  dashboard_count: number
}

const staggerItem = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }

const planColors: Record<string, string> = {
  "Free": "bg-slate-500/10 text-slate-600",
  "Basico": "bg-blue-500/10 text-blue-600",
  "Básico": "bg-blue-500/10 text-blue-600",
  "Pro": "bg-amber-500/10 text-amber-600",
  "Enterprise": "bg-purple-500/10 text-purple-600",
  "Diamante": "bg-cyan-500/10 text-cyan-600",
}

export default function InstitutionsPage() {
  const router = useRouter()
  const [institutions, setInstitutions] = React.useState<Institution[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [selectedInst, setSelectedInst] = React.useState<Institution | null>(null)
  const [formData, setFormData] = React.useState({ name: "", code: "", plan_id: "", type: "", level: "", modality: "", shift: "", department: "", province: "", district: "", address: "", phone: "", email: "", director_name: "", director_dni: "" })
  const [deleting, setDeleting] = React.useState<string | null>(null)
  const [generatingCarnet, setGeneratingCarnet] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const { toast } = useToast()

  React.useEffect(() => { fetchInstitutions() }, [])

  const fetchInstitutions = async () => {
    try {
      const res = await fetch("/api/super-admin/instituciones")
      if (res.ok) {
        const data = await res.json()
        setInstitutions(data)
      }
    } catch (e) {
      console.error("Error fetching institutions:", e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name) return
    try {
      const res = await fetch("/api/super-admin/instituciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setCreateOpen(false)
        setFormData({ name: "", code: "", plan_id: "", type: "", level: "", modality: "", shift: "", department: "", province: "", district: "", address: "", phone: "", email: "", director_name: "", director_dni: "" })
        fetchInstitutions()
      }
    } catch (e) {
      console.error("Error creating institution:", e)
    }
  }

  const openEdit = (inst: Institution) => {
    setFormData({
      name: inst.name || "",
      code: inst.code || "",
      plan_id: "",
      type: inst.type || "",
      level: inst.level || "",
      modality: inst.modality || "",
      shift: inst.shift || "",
      department: inst.department || "",
      province: inst.province || "",
      district: inst.district || "",
      address: inst.address || "",
      phone: inst.phone || "",
      email: inst.email || "",
      director_name: inst.director_name || "",
      director_dni: inst.director_dni || "",
    })
    setEditOpen(true)
    setDetailOpen(false)
  }

  const handleSave = async () => {
    if (!selectedInst) return
    if (!formData.name) return toast("El nombre es obligatorio", "warning")
    setSaving(true)
    try {
      const payload: any = { ...formData }
      delete payload.plan_id
      const res = await fetch(`/api/super-admin/instituciones/${selectedInst.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast("Institución actualizada", "success")
        setEditOpen(false)
        fetchInstitutions()
      } else {
        const err = await res.json().catch(() => null)
        toast(err?.error || "Error al actualizar", "error")
      }
    } catch (e) {
      console.error("Error updating institution:", e)
      toast("Error de conexión", "error")
    } finally {
      setSaving(false)
    }
  }

  const filtered = institutions.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.code.toLowerCase().includes(search.toLowerCase()) ||
    (i.director_name && i.director_name.toLowerCase().includes(search.toLowerCase()))
  )

  const handleDelete = async (inst: Institution) => {
    if (!confirm(`Eliminar "${inst.name}" y todos sus datos? Esta accion no se puede deshacer.`)) return
    setDeleting(inst.id)
    try {
      const res = await fetch(`/api/super-admin/instituciones/${inst.id}`, { method: "DELETE" })
      if (res.ok) {
        fetchInstitutions()
        setDetailOpen(false)
        setSelectedInst(null)
      }
    } catch (e) {
      console.error("Error deleting institution:", e)
    } finally {
      setDeleting(null)
    }
  }

  const handleDownloadCarnet = async (inst: Institution) => {
    setGeneratingCarnet(true)
    try {
      const res = await fetch(`/api/super-admin/instituciones/${inst.id}/carnet`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `carnet-${inst.code}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (e) {
      console.error("Error generating carnet:", e)
    } finally {
      setGeneratingCarnet(false)
    }
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Instituciones</h1>
          <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">{institutions.length} instituciones registradas</p>
        </div>
        <SbBtn variant="filled" rounded className="flex items-center gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Nueva Institucion
        </SbBtn>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/30" />
          <input placeholder="Buscar por nombre, codigo o director..." value={search} onChange={e => setSearch(e.target.value)}
            className="sb-input rounded-xl text-sm h-10 w-full pl-10" />
        </div>
      </motion.div>

      {/* Institution cards */}
      {!loading && (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.04 } } }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(inst => (
            <motion.div key={inst.id} variants={staggerItem}
              className="bg-sb-surface rounded-2xl border border-sb-outline-variant/8 overflow-hidden hover:shadow-lg hover:shadow-black/5 transition-all duration-300 group">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-11 w-11 rounded-xl bg-sb-on-surface/8 flex items-center justify-center">
                    <span className="text-sm font-bold text-sb-on-surface-variant/60">{inst.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${planColors[inst.plan_name || ''] || planColors['Free']}`}>
                    {inst.plan_name || 'Sin plan'}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-sb-on-surface mb-1 line-clamp-1">{inst.name}</h3>
                <p className="text-[10px] text-sb-on-surface-variant/40 mb-4">{inst.code}</p>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-sb-on-surface">{inst.total_students || 0}</p>
                    <p className="text-[9px] text-sb-on-surface-variant/40">Alumnos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-sb-on-surface">{inst.total_teachers || 0}</p>
                    <p className="text-[9px] text-sb-on-surface-variant/40">Docentes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-sb-on-surface">{inst.dashboard_count || 0}</p>
                    <p className="text-[9px] text-sb-on-surface-variant/40">Dashboards</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => { setSelectedInst(inst); setDetailOpen(true) }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-sb-surface-container/60 text-xs font-medium text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high transition-colors">
                    <Eye className="h-3.5 w-3.5" /> Ver detalle
                  </button>
                  <button onClick={() => { setSelectedInst(inst); openEdit(inst) }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-sb-surface-container/60 text-xs font-medium text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => router.push(`/super-admin/instituciones/${inst.id}/dashboards`)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-sb-primary/10 text-xs font-medium text-sb-primary hover:bg-sb-primary/15 transition-colors">
                    <LayoutDashboard className="h-3.5 w-3.5" /> Dashboards
                  </button>
                  <button onClick={() => handleDelete(inst)}
                    disabled={deleting === inst.id}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 text-xs font-medium text-red-600 hover:bg-red-500/15 transition-colors disabled:opacity-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between px-5 py-2.5 bg-sb-surface-container/30 border-t border-sb-outline-variant/8">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${inst.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-sb-surface-container text-sb-on-surface-variant/40"}`}>
                  {inst.status === "active" ? "Activo" : "Inactivo"}
                </span>
                {inst.director_name && (
                  <span className="text-[10px] text-sb-on-surface-variant/30 truncate max-w-[120px]">{inst.director_name}</span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-sb-surface rounded-2xl border border-sb-outline-variant/8 p-5 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="h-11 w-11 rounded-xl bg-sb-surface-container" />
                <div className="h-5 w-16 rounded-full bg-sb-surface-container" />
              </div>
              <div className="h-4 w-32 rounded bg-sb-surface-container mb-2" />
              <div className="h-3 w-16 rounded bg-sb-surface-container mb-4" />
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[1, 2, 3].map(j => (
                  <div key={j} className="text-center">
                    <div className="h-6 w-8 mx-auto rounded bg-sb-surface-container mb-1" />
                    <div className="h-2 w-10 mx-auto rounded bg-sb-surface-container" />
                  </div>
                ))}
              </div>
              <div className="h-8 w-full rounded-xl bg-sb-surface-container" />
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="bg-sb-surface rounded-2xl py-12 text-center">
          <Building2 className="h-10 w-10 text-sb-on-surface-variant/15 mx-auto mb-3" />
          <p className="text-sm text-sb-on-surface-variant/30">
            {search ? "No se encontraron instituciones" : "No hay instituciones registradas"}
          </p>
        </div>
      )}

      {/* ===== CREATE DIALOG ===== */}
      <SbModal open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="520px">
        <SbModalHeader title="Nueva Institucion" onClose={() => setCreateOpen(false)} />
        <SbModalBody>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Nombre *</label>
                <input placeholder="Ej: Colegio San Martin" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="sb-input rounded-xl text-sm h-10 w-full" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Codigo</label>
                <input placeholder="Auto-generado" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})}
                  className="sb-input rounded-xl text-sm h-10 w-full" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Tipo</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                  className="sbf-native-select w-full">
                  <option value="">Seleccionar</option>
                  <option value="public">Publico</option>
                  <option value="private">Privado</option>
                  <option value="semi-private">Semi-privado</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Nivel</label>
                <select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})}
                  className="sbf-native-select w-full">
                  <option value="">Seleccionar</option>
                  <option value="initial">Inicial</option>
                  <option value="primary">Primaria</option>
                  <option value="secondary">Secundaria</option>
                  <option value="basic">Basico</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Turno</label>
                <select value={formData.shift} onChange={e => setFormData({...formData, shift: e.target.value})}
                  className="sbf-native-select w-full">
                  <option value="">Seleccionar</option>
                  <option value="morning">Manana</option>
                  <option value="afternoon">Tarde</option>
                  <option value="full">Completo</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Director</label>
                <input placeholder="Nombre del director" value={formData.director_name} onChange={e => setFormData({...formData, director_name: e.target.value})}
                  className="sb-input rounded-xl text-sm h-10 w-full" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Telefono</label>
                <input placeholder="Telefono de contacto" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="sb-input rounded-xl text-sm h-10 w-full" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Direccion</label>
              <input placeholder="Direccion de la institucion" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                className="sb-input rounded-xl text-sm h-10 w-full" />
            </div>
          </motion.div>
        </SbModalBody>
        <SbModalFooter>
          <SbBtn rounded onClick={() => setCreateOpen(false)}>Cancelar</SbBtn>
          <SbBtn variant="filled" rounded disabled={!formData.name} onClick={handleCreate}>Crear Institucion</SbBtn>
        </SbModalFooter>
      </SbModal>

      {/* ===== DETAIL MODAL ===== */}
      <SbModal open={detailOpen} onClose={() => { setDetailOpen(false); setSelectedInst(null) }} maxWidth="580px">
        {selectedInst && (
          <>
            <SbModalHeader title={selectedInst.name} onClose={() => { setDetailOpen(false); setSelectedInst(null) }} />
            <SbModalBody>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                {/* Boton Ver Dashboards - PROMINENTE */}
                <button onClick={() => { setDetailOpen(false); router.push(`/super-admin/instituciones/${selectedInst.id}/dashboards`) }}
                  className="w-full flex items-center gap-4 p-4 bg-sb-primary text-white rounded-xl hover:bg-sb-primary/90 transition-all shadow-lg shadow-sb-primary/20 group">
                  <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <LayoutDashboard className="h-6 w-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold">Ver Dashboards</p>
                    <p className="text-xs text-white/70">Docentes, Secretaria, Padres, Alumnos y mas</p>
                  </div>
                  <Eye className="h-5 w-5 text-white/60 group-hover:text-white transition-colors" />
                </button>

                {/* Boton Editar institucion */}
                <button onClick={() => openEdit(selectedInst)}
                  className="w-full flex items-center gap-4 p-4 bg-sb-surface-container/60 text-sb-on-surface rounded-xl hover:bg-sb-surface-container-high transition-all group border border-sb-outline-variant/10">
                  <div className="h-12 w-12 rounded-xl bg-sb-on-surface/5 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Pencil className="h-6 w-6 text-sb-on-surface-variant/50" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold">Editar institucion</p>
                    <p className="text-xs text-sb-on-surface-variant/40">Modifica datos, la ubicacion y el contacto</p>
                  </div>
                  <Pencil className="h-5 w-5 text-sb-on-surface-variant/30 group-hover:text-sb-on-surface transition-colors" />
                </button>

                {/* Boton Descargar Carnet */}
                <button onClick={() => handleDownloadCarnet(selectedInst)}
                  disabled={generatingCarnet}
                  className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg shadow-purple-500/20 group disabled:opacity-50">
                  <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold">{generatingCarnet ? 'Generando...' : 'Descargar Carnet'}</p>
                    <p className="text-xs text-white/70">Carnet institucional con logo de Educonecta</p>
                  </div>
                  <Download className="h-5 w-5 text-white/60 group-hover:text-white transition-colors" />
                </button>

                {/* Resumen de dashboards por rol */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Docentes", icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-500/10" },
                    { label: "Secretaria", icon: Users, color: "text-emerald-600", bg: "bg-emerald-500/10" },
                    { label: "Padres", icon: Users, color: "text-amber-600", bg: "bg-amber-500/10" },
                    { label: "Alumnos", icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-500/10" },
                  ].map(r => {
                    const Icon = r.icon
                    return (
                      <div key={r.label} className={`${r.bg} rounded-xl p-3 text-center`}>
                        <Icon className={`h-4 w-4 ${r.color} mx-auto mb-1`} />
                        <p className="text-[9px] font-medium text-sb-on-surface-variant/60">{r.label}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Info de la institucion */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-sb-surface-container/50 rounded-xl p-3">
                    <p className="text-[10px] text-sb-on-surface-variant/40 uppercase tracking-wider mb-1">Codigo</p>
                    <p className="text-sm font-semibold text-sb-on-surface">{selectedInst.code}</p>
                  </div>
                  <div className="bg-sb-surface-container/50 rounded-xl p-3">
                    <p className="text-[10px] text-sb-on-surface-variant/40 uppercase tracking-wider mb-1">Plan</p>
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${planColors[selectedInst.plan_name || ''] || planColors['Free']}`}>
                      {selectedInst.plan_name || 'Sin plan'}
                    </span>
                  </div>
                  <div className="bg-sb-surface-container/50 rounded-xl p-3">
                    <p className="text-[10px] text-sb-on-surface-variant/40 uppercase tracking-wider mb-1">Alumnos</p>
                    <p className="text-sm font-semibold text-sb-on-surface">{selectedInst.total_students || 0}</p>
                  </div>
                  <div className="bg-sb-surface-container/50 rounded-xl p-3">
                    <p className="text-[10px] text-sb-on-surface-variant/40 uppercase tracking-wider mb-1">Docentes</p>
                    <p className="text-sm font-semibold text-sb-on-surface">{selectedInst.total_teachers || 0}</p>
                  </div>
                </div>

                {/* Info adicional */}
                <div className="grid grid-cols-2 gap-3">
                  {selectedInst.type && (
                    <div className="bg-sb-surface-container/50 rounded-xl p-3">
                      <p className="text-[10px] text-sb-on-surface-variant/40 uppercase tracking-wider mb-1">Tipo</p>
                      <p className="text-xs font-medium text-sb-on-surface capitalize">{selectedInst.type}</p>
                    </div>
                  )}
                  {selectedInst.level && (
                    <div className="bg-sb-surface-container/50 rounded-xl p-3">
                      <p className="text-[10px] text-sb-on-surface-variant/40 uppercase tracking-wider mb-1">Nivel</p>
                      <p className="text-xs font-medium text-sb-on-surface capitalize">{selectedInst.level}</p>
                    </div>
                  )}
                  {selectedInst.shift && (
                    <div className="bg-sb-surface-container/50 rounded-xl p-3">
                      <p className="text-[10px] text-sb-on-surface-variant/40 uppercase tracking-wider mb-1">Turno</p>
                      <p className="text-xs font-medium text-sb-on-surface capitalize">{selectedInst.shift}</p>
                    </div>
                  )}
                  {selectedInst.director_name && (
                    <div className="bg-sb-surface-container/50 rounded-xl p-3">
                      <p className="text-[10px] text-sb-on-surface-variant/40 uppercase tracking-wider mb-1">Director</p>
                      <p className="text-xs font-medium text-sb-on-surface">{selectedInst.director_name}</p>
                    </div>
                  )}
                </div>

                {selectedInst.address && (
                  <div className="bg-sb-surface-container/50 rounded-xl p-3">
                    <p className="text-[10px] text-sb-on-surface-variant/40 uppercase tracking-wider mb-1">Direccion</p>
                    <p className="text-xs font-medium text-sb-on-surface">{selectedInst.address}</p>
                  </div>
                )}
              </motion.div>
            </SbModalBody>
          </>
        )}
      </SbModal>

      {/* Modal editar institucion */}
      <SbModal open={editOpen} onClose={() => setEditOpen(false)} maxWidth="600px">
        <SbModalHeader title={`Editar: ${formData.name || "Institución"}`} onClose={() => setEditOpen(false)} />
        <SbModalBody>
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <SbLabel htmlFor="inst-name">Nombre</SbLabel>
                <SbInput id="inst-name" placeholder="Nombre del colegio" value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <SbLabel htmlFor="inst-code">Código</SbLabel>
                <SbInput id="inst-code" placeholder="COL-01" value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })} />
              </div>
              <div>
                <SbLabel htmlFor="inst-type">Tipo</SbLabel>
                <SbSelect id="inst-type" value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  <option value="">Seleccionar</option>
                  <option value="colegio">Colegio</option>
                  <option value="instituto">Instituto</option>
                  <option value="academia">Academia</option>
                  <option value="ceba">CEBA</option>
                </SbSelect>
              </div>
              <div>
                <SbLabel htmlFor="inst-level">Nivel</SbLabel>
                <SbSelect id="inst-level" value={formData.level}
                  onChange={e => setFormData({ ...formData, level: e.target.value })}>
                  <option value="">Seleccionar</option>
                  <option value="inicial">Inicial</option>
                  <option value="primaria">Primaria</option>
                  <option value="secundaria">Secundaria</option>
                  <option value="inicial_primaria">Inicial y Primaria</option>
                  <option value="primaria_secundaria">Primaria y Secundaria</option>
                  <option value="inicial_primaria_secundaria">Inicial, Primaria y Secundaria</option>
                </SbSelect>
              </div>
              <div>
                <SbLabel htmlFor="inst-modality">Modalidad</SbLabel>
                <SbSelect id="inst-modality" value={formData.modality}
                  onChange={e => setFormData({ ...formData, modality: e.target.value })}>
                  <option value="">Seleccionar</option>
                  <option value="presencial">Presencial</option>
                  <option value="semipresencial">Semipresencial</option>
                  <option value="virtual">Virtual</option>
                </SbSelect>
              </div>
              <div>
                <SbLabel htmlFor="inst-shift">Turno</SbLabel>
                <SbSelect id="inst-shift" value={formData.shift}
                  onChange={e => setFormData({ ...formData, shift: e.target.value })}>
                  <option value="">Seleccionar</option>
                  <option value="mañana">Mañana</option>
                  <option value="tarde">Tarde</option>
                  <option value="noche">Noche</option>
                  <option value="completo">Completo</option>
                </SbSelect>
              </div>
            </div>

            <div>
              <SbLabel htmlFor="inst-address">Dirección</SbLabel>
              <SbInput id="inst-address" placeholder="Jr. Faustino Carrión Mz H Lt 10" value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <SbLabel htmlFor="inst-department">Departamento</SbLabel>
                <SbInput id="inst-department" placeholder="Ucayali" value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })} />
              </div>
              <div>
                <SbLabel htmlFor="inst-province">Provincia</SbLabel>
                <SbInput id="inst-province" placeholder="Coronel Portillo" value={formData.province}
                  onChange={e => setFormData({ ...formData, province: e.target.value })} />
              </div>
              <div>
                <SbLabel htmlFor="inst-district">Distrito</SbLabel>
                <SbInput id="inst-district" placeholder="Callaria" value={formData.district}
                  onChange={e => setFormData({ ...formData, district: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <SbLabel htmlFor="inst-phone">Teléfono</SbLabel>
                <SbInput id="inst-phone" placeholder="999999999" value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div>
                <SbLabel htmlFor="inst-email">Email</SbLabel>
                <SbInput id="inst-email" type="email" placeholder="direccion@colegio.edu.pe" value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <SbLabel htmlFor="inst-director">Director</SbLabel>
                <SbInput id="inst-director" placeholder="Nombre del director" value={formData.director_name}
                  onChange={e => setFormData({ ...formData, director_name: e.target.value })} />
              </div>
              <div>
                <SbLabel htmlFor="inst-dni">DNI Director</SbLabel>
                <SbInput id="inst-dni" placeholder="00000000" value={formData.director_dni}
                  onChange={e => setFormData({ ...formData, director_dni: e.target.value })} />
              </div>
            </div>
          </div>
        </SbModalBody>
        <SbModalFooter>
          <SbBtn variant="outlined" onClick={() => setEditOpen(false)}>Cancelar</SbBtn>
          <SbBtn onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</SbBtn>
        </SbModalFooter>
      </SbModal>
    </div>
  )
}
