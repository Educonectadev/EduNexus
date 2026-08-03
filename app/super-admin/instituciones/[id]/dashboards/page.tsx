"use client"

import * as React from "react"
import { ArrowLeft, Plus, LayoutDashboard, BarChart3, GraduationCap, Users, Eye, Edit, Trash2, ToggleLeft, ToggleRight, Settings, UserCheck, BookOpen, CreditCard, ClipboardList } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { SbBtn, SbModal, SbModalHeader, SbModalBody, SbModalFooter } from "@/components/ui/sb"
import { useRouter, useParams } from "next/navigation"

interface Dashboard {
  id: string
  institution_id: string
  name: string
  description: string
  type: string
  role: string
  config: any
  status: string
  created_at: string
  updated_at: string
}

interface Institution {
  id: string
  name: string
  code: string
}

const staggerItem = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }
const listItem = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, filter: "blur(8px)", y: -10 },
}

const roleConfig: Record<string, { icon: typeof Users; color: string; bg: string; label: string; description: string }> = {
  director: { icon: LayoutDashboard, color: "text-blue-600", bg: "bg-blue-500/10", label: "Director", description: "Vista general del colegio" },
  docente: { icon: GraduationCap, color: "text-emerald-600", bg: "bg-emerald-500/10", label: "Docentes", description: "Cursos, notas y asistencia" },
  secretario: { icon: ClipboardList, color: "text-amber-600", bg: "bg-amber-500/10", label: "Secretaria", description: "Gestion administrativa" },
  padre: { icon: Users, color: "text-purple-600", bg: "bg-purple-500/10", label: "Padres", description: "Seguimiento de hijos" },
  alumno: { icon: BookOpen, color: "text-rose-600", bg: "bg-rose-500/10", label: "Alumnos", description: "Tareas y calificaciones" },
}

const defaultDashboards: Dashboard[] = [
  { id: "d1", institution_id: "1", name: "Dashboard Director", description: "Vista general del colegio con metricas clave", type: "main", role: "director", config: null, status: "active", created_at: "2026-01-15", updated_at: "2026-01-15" },
  { id: "d2", institution_id: "1", name: "Dashboard Docentes", description: "Cursos asignados, calificaciones y asistencia de alumnos", type: "academic", role: "docente", config: null, status: "active", created_at: "2026-01-15", updated_at: "2026-01-15" },
  { id: "d3", institution_id: "1", name: "Dashboard Secretaria", description: "Gestion de padres, alumnos, documentos y pagos", type: "administrative", role: "secretario", config: null, status: "active", created_at: "2026-01-15", updated_at: "2026-01-15" },
  { id: "d4", institution_id: "1", name: "Dashboard Padres", description: "Notas, asistencia y tareas de sus hijos", type: "parental", role: "padre", config: null, status: "active", created_at: "2026-01-15", updated_at: "2026-01-15" },
  { id: "d5", institution_id: "1", name: "Dashboard Alumnos", description: "Tareas, calificaciones y calendario escolar", type: "student", role: "alumno", config: null, status: "active", created_at: "2026-01-15", updated_at: "2026-01-15" },
]

export default function InstitutionDashboardsPage() {
  const router = useRouter()
  const params = useParams()
  const instId = params.id as string

  const [dashboards, setDashboards] = React.useState<Dashboard[]>(defaultDashboards)
  const [institution, setInstitution] = React.useState<Institution | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [selectedDashboard, setSelectedDashboard] = React.useState<Dashboard | null>(null)
  const [formData, setFormData] = React.useState({ name: "", description: "", type: "main", role: "director" })

  React.useEffect(() => { fetchDashboards(); fetchInstitution() }, [instId])

  const fetchDashboards = async () => {
    try {
      const res = await fetch(`/api/super-admin/instituciones/${instId}/dashboards`)
      if (res.ok) {
        const data = await res.json()
        if (data.length > 0) setDashboards(data)
      }
    } catch (e) { console.error("Error:", e) } finally { setLoading(false) }
  }

  const fetchInstitution = async () => {
    try {
      const res = await fetch(`/api/super-admin/instituciones`)
      if (res.ok) {
        const data = await res.json()
        const inst = data.find((i: any) => i.id === instId)
        if (inst) setInstitution(inst)
      }
    } catch (e) { console.error("Error:", e) }
  }

  const handleCreate = async () => {
    if (!formData.name) return
    try {
      const res = await fetch(`/api/super-admin/instituciones/${instId}/dashboards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) { setCreateOpen(false); setFormData({ name: "", description: "", type: "main", role: "director" }); fetchDashboards() }
    } catch (e) { console.error("Error:", e) }
  }

  const handleEdit = async () => {
    if (!selectedDashboard || !formData.name) return
    try {
      const res = await fetch(`/api/super-admin/instituciones/${instId}/dashboards`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboard_id: selectedDashboard.id, ...formData }),
      })
      if (res.ok) { setEditOpen(false); setSelectedDashboard(null); setFormData({ name: "", description: "", type: "main", role: "director" }); fetchDashboards() }
    } catch (e) { console.error("Error:", e) }
  }

  const handleToggleStatus = async (dashboard: Dashboard) => {
    try {
      await fetch(`/api/super-admin/instituciones/${instId}/dashboards`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboard_id: dashboard.id, status: dashboard.status === "active" ? "inactive" : "active" }),
      })
      fetchDashboards()
    } catch (e) { console.error("Error:", e) }
  }

  const handleDelete = async (dashboardId: string) => {
    try {
      await fetch(`/api/super-admin/instituciones/${instId}/dashboards`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboard_id: dashboardId }),
      })
      fetchDashboards()
    } catch (e) { console.error("Error:", e) }
  }

  const openEdit = (dashboard: Dashboard) => {
    setSelectedDashboard(dashboard)
    setFormData({ name: dashboard.name, description: dashboard.description || "", type: dashboard.type, role: dashboard.role || "director" })
    setEditOpen(true)
  }

  const dashboardsByRole = Object.entries(roleConfig).map(([key, config]) => ({
    role: key,
    ...config,
    dashboards: dashboards.filter(d => d.role === key),
  }))

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <button onClick={() => router.push("/super-admin/instituciones")}
          className="p-2 rounded-xl hover:bg-sb-surface-container transition-colors">
          <ArrowLeft className="h-5 w-5 text-sb-on-surface-variant/60" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Dashboards</h1>
          <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">
            {institution?.name || "Cargando..."} — {dashboards.length} dashboard{dashboards.length !== 1 ? 's' : ''}
          </p>
        </div>
        <SbBtn variant="filled" rounded className="flex items-center gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Nuevo Dashboard
        </SbBtn>
      </motion.div>

      {/* Dashboards por rol */}
      {!loading && (
        <div className="space-y-6">
          {dashboardsByRole.map((group, gi) => {
            const config = roleConfig[group.role]
            const Icon = config.icon
            return (
              <motion.div key={group.role} initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.04 } } }}>
                {/* Header del grupo */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${config.bg}`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-sb-on-surface">{config.label}</h3>
                    <p className="text-[10px] text-sb-on-surface-variant/40">{config.description}</p>
                  </div>
                  <span className="text-[10px] text-sb-on-surface-variant/30 ml-auto">{group.dashboards.length} dashboard{group.dashboards.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Lista de dashboards del grupo */}
                {group.dashboards.length > 0 ? (
                  <div className="space-y-2">
                    {group.dashboards.map((d, i) => (
                      <motion.div key={d.id} variants={listItem}
                        className={`bg-sb-surface rounded-xl border border-sb-outline-variant/8 p-4 flex items-center gap-4 ${d.status === "inactive" ? "opacity-50" : ""}`}>
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${config.bg}`}>
                          <Icon className={`h-5 w-5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-sb-on-surface">{d.name}</p>
                            <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${d.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-sb-surface-container text-sb-on-surface-variant/40"}`}>
                              {d.status === "active" ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                          <p className="text-xs text-sb-on-surface-variant/50 truncate mt-0.5">{d.description}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => openEdit(d)} className="p-2 rounded-lg hover:bg-sb-surface-container transition-colors" title="Editar">
                            <Edit className="h-4 w-4 text-sb-on-surface-variant/40" />
                          </button>
                          <button onClick={() => handleToggleStatus(d)} className="p-2 rounded-lg hover:bg-sb-surface-container transition-colors" title={d.status === "active" ? "Desactivar" : "Activar"}>
                            {d.status === "active" ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4 text-sb-on-surface-variant/30" />}
                          </button>
                          <button onClick={() => handleDelete(d.id)} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors" title="Eliminar">
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-sb-surface-container/30 rounded-xl p-4 text-center">
                    <p className="text-xs text-sb-on-surface-variant/30">Sin dashboards configurados para {config.label.toLowerCase()}</p>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-sb-surface rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-sb-surface-container" />
                <div className="flex-1">
                  <div className="h-4 w-32 rounded bg-sb-surface-container mb-2" />
                  <div className="h-3 w-48 rounded bg-sb-surface-container" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== CREATE DIALOG ===== */}
      <SbModal open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="480px">
        <SbModalHeader title="Nuevo Dashboard" onClose={() => setCreateOpen(false)} />
        <SbModalBody>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Rol *</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                className="sbf-native-select w-full">
                {Object.entries(roleConfig).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Nombre *</label>
              <input placeholder="Ej: Dashboard de Calificaciones" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                className="sb-input rounded-xl text-sm h-10 w-full" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Tipo</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                className="sbf-native-select w-full">
                <option value="main">Principal</option>
                <option value="academic">Academico</option>
                <option value="financial">Financiero</option>
                <option value="attendance">Asistencia</option>
                <option value="administrative">Administrativo</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Descripcion</label>
              <textarea placeholder="Que informacion mostrara este dashboard..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                className="sb-input rounded-xl text-sm h-20 w-full resize-none" />
            </div>
          </motion.div>
        </SbModalBody>
        <SbModalFooter>
          <SbBtn rounded onClick={() => setCreateOpen(false)}>Cancelar</SbBtn>
          <SbBtn variant="filled" rounded disabled={!formData.name} onClick={handleCreate}>Crear Dashboard</SbBtn>
        </SbModalFooter>
      </SbModal>

      {/* ===== EDIT DIALOG ===== */}
      <SbModal open={editOpen} onClose={() => { setEditOpen(false); setSelectedDashboard(null) }} maxWidth="480px">
        <SbModalHeader title="Editar Dashboard" onClose={() => { setEditOpen(false); setSelectedDashboard(null) }} />
        <SbModalBody>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Rol</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                className="sbf-native-select w-full">
                {Object.entries(roleConfig).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Nombre *</label>
              <input placeholder="Ej: Dashboard de Calificaciones" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                className="sb-input rounded-xl text-sm h-10 w-full" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Tipo</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                className="sbf-native-select w-full">
                <option value="main">Principal</option>
                <option value="academic">Academico</option>
                <option value="financial">Financiero</option>
                <option value="attendance">Asistencia</option>
                <option value="administrative">Administrativo</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-1.5 block">Descripcion</label>
              <textarea placeholder="Que informacion mostrara este dashboard..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                className="sb-input rounded-xl text-sm h-20 w-full resize-none" />
            </div>
          </motion.div>
        </SbModalBody>
        <SbModalFooter>
          <SbBtn rounded onClick={() => { setEditOpen(false); setSelectedDashboard(null) }}>Cancelar</SbBtn>
          <SbBtn variant="filled" rounded disabled={!formData.name} onClick={handleEdit}>Guardar Cambios</SbBtn>
        </SbModalFooter>
      </SbModal>
    </div>
  )
}
