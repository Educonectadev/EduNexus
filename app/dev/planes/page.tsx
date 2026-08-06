"use client"

import * as React from "react"
import { CreditCard, Plus, Pencil, Trash2, Check, X, Shield, ShieldOff, Users, GraduationCap, Eye } from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"

interface Plan {
  id: string
  name: string
  description: string | null
  price: number
  max_users: number
  max_students: number
  features: string[] | string
  status: string
  created_at: string
}

const ALL_PERMISSIONS = [
  { key: 'can_certificates', label: 'Certificados digitales', default: true },
  { key: 'can_documents', label: 'Gestión de documentos', default: true },
  { key: 'can_parents_portal', label: 'Portal de padres', default: true },
  { key: 'can_attendance', label: 'Asistencia digital', default: true },
  { key: 'can_grades', label: 'Calificaciones', default: true },
  { key: 'can_export_reports', label: 'Exportar reportes', default: false },
  { key: 'can_bulk_import', label: 'Importación masiva', default: false },
  { key: 'can_api_access', label: 'API de acceso', default: false },
  { key: 'can_white_label', label: 'White label', default: false },
  { key: 'can_priority_support', label: 'Soporte prioritario', default: false },
]

const defaultLabels = ["Gestión académica", "Reportes básicos", "Soporte email"]

function parseFeatures(features: any): { labels: string[]; permissions: Record<string, boolean> } {
  if (!features) return { labels: [], permissions: {} }
  try {
    const parsed = typeof features === 'string' ? JSON.parse(features) : features
    if (Array.isArray(parsed)) return { labels: parsed, permissions: {} }
    return {
      labels: parsed.labels || [],
      permissions: parsed.permissions || {},
    }
  } catch {
    return { labels: [], permissions: {} }
  }
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function PlanesPage() {
  const [plans, setPlans] = React.useState<Plan[]>([])
  const [loading, setLoading] = React.useState(true)
  const [editOpen, setEditOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Plan | null>(null)
  const [viewing, setViewing] = React.useState<Plan | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({
    name: "", description: "", price: 0, max_users: 5, max_students: 50,
    labels: defaultLabels.join("\n"),
    permissions: Object.fromEntries(ALL_PERMISSIONS.map(p => [p.key, p.default])),
    status: "active",
  })
  const [toast, setToast] = React.useState<{ message: string; type: string } | null>(null)

  const showToast = (message: string, type: string) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  React.useEffect(() => { fetchPlans() }, [])

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/dev/planes")
      if (ok(res)) setPlans(await res.json())
    } catch {} finally { setLoading(false) }
  }

  const ok = (res: Response) => res.ok

  const openView = (p: Plan) => setViewing(p)

  const openCreate = () => {
    setEditing(null)
    setForm({
      name: "", description: "", price: 0, max_users: 5, max_students: 50,
      labels: defaultLabels.join("\n"),
      permissions: Object.fromEntries(ALL_PERMISSIONS.map(p => [p.key, p.default])),
      status: "active",
    })
    setEditOpen(true)
  }

  const openEdit = (p: Plan) => {
    setEditing(p)
    const { labels, permissions } = parseFeatures(p.features)
    setForm({
      name: p.name,
      description: p.description || "",
      price: Number(p.price),
      max_users: p.max_users,
      max_students: p.max_students,
      labels: labels.join("\n"),
      permissions: { ...Object.fromEntries(ALL_PERMISSIONS.map(p => [p.key, p.default])), ...permissions },
      status: p.status,
    })
    setEditOpen(true)
  }

  const togglePermission = (key: string) => {
    setForm({ ...form, permissions: { ...form.permissions, [key]: !form.permissions[key] } })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const labels = form.labels.split("\n").map(f => f.trim()).filter(Boolean)
      const features = JSON.stringify({ labels, permissions: form.permissions })
      const body = { ...form, features, labels: undefined, permissions: undefined }
      const url = editing ? `/api/dev/planes/${editing.id}` : "/api/dev/planes"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (ok(res)) {
        setEditOpen(false); fetchPlans(); showToast(editing ? "Plan actualizado" : "Plan creado", "success")
      } else {
        const data = await res.json(); showToast(data.error || "Error", "error")
      }
    } catch { showToast("Error de conexión", "error") } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este plan?")) return
    try {
      const res = await fetch(`/api/dev/planes/${id}`, { method: "DELETE" })
      if (ok(res)) { fetchPlans(); showToast("Plan eliminado", "success") }
    } catch { showToast("Error", "error") }
  }

  const priceFormat = (p: number) => `S/ ${Number(p).toFixed(2)}`

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full space-y-6 py-2">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-[13px] font-medium shadow-lg ${
              toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={fadeUp} className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-[22px] md:text-[24px] font-bold tracking-tight text-sb-on-surface">Planes</h2>
          <p className="text-[13px] text-sb-on-surface/70 mt-1">Gestionar planes de suscripción</p>
        </div>
        <button
          onClick={openCreate}
          className="w-full sm:w-auto h-11 px-5 rounded-xl bg-sb-on-surface text-sb-surface text-[13px] font-medium hover:opacity-90 transition-all items-center justify-center flex gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo plan
        </button>
      </motion.div>

      {/* Plans Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-56 bg-sb-surface rounded-2xl animate-pulse border border-sb-outline-variant/10" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan, i) => {
            const { labels } = parseFeatures(plan.features)
            return (
              <motion.div
                key={plan.id}
                variants={fadeUp}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                onClick={() => openView(plan)}
                className="bg-sb-surface rounded-2xl p-5 border border-sb-outline-variant/10 flex flex-col hover:border-sb-outline-variant/30 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-sb-primary/10 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-sb-primary" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); openView(plan) }} className="p-2 rounded-xl hover:bg-sb-surface-container-high text-sb-on-surface/60 hover:text-sb-primary transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); openEdit(plan) }} className="p-2 rounded-xl hover:bg-sb-surface-container-high text-sb-on-surface/60 hover:text-sb-on-surface transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(plan.id) }} className="p-2 rounded-xl hover:bg-red-500/10 text-sb-on-surface/60 hover:text-red-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-[16px] font-bold text-sb-on-surface">{plan.name}</h3>
                {plan.description && <p className="text-[12px] text-sb-on-surface/70 mt-1">{plan.description}</p>}
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-[28px] font-bold text-sb-on-surface">{priceFormat(plan.price)}</span>
                  <span className="text-[12px] text-sb-on-surface/60">/mes</span>
                </div>
                <div className="mt-3 space-y-1.5 flex-1">
                  {labels.slice(0, 4).map((f: string, fi: number) => (
                    <div key={fi} className="flex items-center gap-2 text-[12px] text-sb-on-surface/80">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> {f}
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-sb-outline-variant/10 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-sb-on-surface/60">
                    <GraduationCap className="h-3 w-3" />
                    {plan.max_students.toLocaleString()} estudiantes
                  </div>
                  <div className="flex items-center gap-1.5 text-sb-on-surface/60">
                    <Users className="h-3 w-3" />
                    {plan.max_users} usuarios
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setEditOpen(false)}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-x-3 bottom-3 top-auto max-h-[92vh] overflow-y-auto rounded-3xl sm:inset-0 sm:top-1/2 sm:-translate-y-1/2 sm:max-w-lg sm:rounded-2xl bg-sb-surface w-full border border-sb-outline-variant/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-sb-outline-variant/10">
                <p className="text-[15px] font-semibold text-sb-on-surface">{editing ? "Editar plan" : "Nuevo plan"}</p>
                <button onClick={() => setEditOpen(false)} className="p-2 rounded-xl hover:bg-sb-surface-container-high transition-colors">
                  <X className="h-4 w-4 text-sb-on-surface/60" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="space-y-2">
                  <label className="text-[12px] text-sb-on-surface/70">Nombre *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Básico"
                    className="w-full h-11 rounded-xl bg-sb-surface-container px-4 text-[14px] text-sb-on-surface placeholder:text-sb-on-surface/50 border border-transparent focus:outline-none focus:ring-2 focus:ring-sb-primary/30 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] text-sb-on-surface/70">Descripción</label>
                  <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Para instituciones pequeñas"
                    className="w-full h-11 rounded-xl bg-sb-surface-container px-4 text-[14px] text-sb-on-surface placeholder:text-sb-on-surface/50 border border-transparent focus:outline-none focus:ring-2 focus:ring-sb-primary/30 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[12px] text-sb-on-surface/70">Precio mensual (S/)</label>
                    <input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value) || 0})}
                      className="w-full h-11 rounded-xl bg-sb-surface-container px-4 text-[14px] text-sb-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-sb-primary/30 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] text-sb-on-surface/70">Estado</label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                      className="w-full h-11 rounded-xl bg-sb-surface-container px-4 text-[14px] text-sb-on-surface focus:outline-none focus:ring-2 focus:ring-sb-primary/30 transition-all">
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] text-sb-on-surface/70">Máx. estudiantes</label>
                    <input type="number" min="1" value={form.max_students} onChange={e => setForm({...form, max_students: parseInt(e.target.value) || 1})}
                      className="w-full h-11 rounded-xl bg-sb-surface-container px-4 text-[14px] text-sb-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-sb-primary/30 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] text-sb-on-surface/70">Máx. usuarios</label>
                    <input type="number" min="1" value={form.max_users} onChange={e => setForm({...form, max_users: parseInt(e.target.value) || 1})}
                      className="w-full h-11 rounded-xl bg-sb-surface-container px-4 text-[14px] text-sb-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-sb-primary/30 transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] text-sb-on-surface/70">Funcionalidades habilitadas</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-sb-surface-container-high rounded-xl p-3">
                    {ALL_PERMISSIONS.map(p => (
                      <button key={p.key} type="button" onClick={() => togglePermission(p.key)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] transition-all ${
                          form.permissions[p.key]
                            ? 'bg-sb-primary/10 text-sb-primary'
                            : 'text-sb-on-surface/70 hover:bg-sb-surface-container'
                        }`}>
                        {form.permissions[p.key]
                          ? <Shield className="h-3.5 w-3.5 shrink-0" />
                          : <ShieldOff className="h-3.5 w-3.5 shrink-0" />
                        }
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] text-sb-on-surface/70">Descripción visual (una por línea)</label>
                  <textarea value={form.labels} onChange={e => setForm({...form, labels: e.target.value})}
                    className="w-full h-20 px-4 py-2 rounded-xl bg-sb-surface-container text-[13px] text-sb-on-surface placeholder:text-sb-on-surface/50 resize-none border border-transparent focus:outline-none focus:ring-2 focus:ring-sb-primary/30 transition-all"
                    placeholder={"Gestión académica\nReportes básicos"} />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-sb-outline-variant/10 flex flex-col sm:flex-row gap-2">
                <button onClick={() => setEditOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-sb-outline-variant/15 text-[13px] font-medium text-sb-on-surface/70 hover:bg-sb-surface-container-high transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving || !form.name}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-sb-on-surface text-sb-surface text-[13px] font-medium hover:opacity-90 transition-all disabled:opacity-50">
                  {saving ? "Guardando..." : editing ? "Guardar" : "Crear"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {viewing && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setViewing(null)}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-x-3 bottom-3 top-auto max-h-[92vh] overflow-y-auto rounded-3xl sm:inset-0 sm:top-1/2 sm:-translate-y-1/2 sm:max-w-lg sm:rounded-2xl bg-sb-surface w-full border border-sb-outline-variant/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between px-6 py-5 border-b border-sb-outline-variant/10">
                <div>
                  <h3 className="text-[18px] font-bold text-sb-on-surface">{viewing.name}</h3>
                  {viewing.description && <p className="text-[12px] text-sb-on-surface/70 mt-1">{viewing.description}</p>}
                </div>
                <button onClick={() => setViewing(null)} className="p-2 rounded-xl hover:bg-sb-surface-container-high transition-colors">
                  <X className="h-4 w-4 text-sb-on-surface/60" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-[32px] font-bold text-sb-on-surface">{priceFormat(viewing.price)}</span>
                  <span className="text-[13px] text-sb-on-surface/60">/mes</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-sb-surface-container-high p-3">
                    <div className="flex items-center gap-1.5 text-sb-on-surface/60 text-[11px]"><Users className="h-3.5 w-3.5" /> Usuarios</div>
                    <p className="text-[18px] font-bold text-sb-on-surface mt-1">{viewing.max_users.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-sb-surface-container-high p-3">
                    <div className="flex items-center gap-1.5 text-sb-on-surface/60 text-[11px]"><GraduationCap className="h-3.5 w-3.5" /> Estudiantes</div>
                    <p className="text-[18px] font-bold text-sb-on-surface mt-1">{viewing.max_students.toLocaleString()}</p>
                  </div>
                </div>
                {(() => {
                  const { labels, permissions } = parseFeatures(viewing.features)
                  return (
                    <div className="space-y-2">
                      <p className="text-[12px] font-semibold text-sb-on-surface/70">Incluye</p>
                      <div className="space-y-1.5">
                        {labels.length > 0 ? labels.map((f, fi) => (
                          <div key={fi} className="flex items-center gap-2 text-[13px] text-sb-on-surface/70">
                            <Check className="h-4 w-4 text-emerald-500 shrink-0" /> {f}
                          </div>
                        )) : (
                          <p className="text-[12px] text-sb-on-surface/60">Sin funciones listadas</p>
                        )}
                      </div>
                      {Object.keys(permissions).length > 0 && (
                        <>
                          <p className="text-[12px] font-semibold text-sb-on-surface/70 pt-3 mt-1 border-t border-sb-outline-variant/10">Permisos técnicos</p>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(permissions).filter(([, v]) => v).map(([k]) => (
                              <span key={k} className="px-2.5 py-1 rounded-lg bg-sb-primary/10 text-sb-primary text-[11px] font-medium">{k.replace("can_", "")}</span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })()}
              </div>
              <div className="px-6 py-4 border-t border-sb-outline-variant/10 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => { setViewing(null); openEdit(viewing) }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-sb-on-surface text-sb-surface text-[13px] font-medium hover:opacity-90 transition-all"
                >
                  Editar plan
                </button>
                <button onClick={() => setViewing(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-sb-outline-variant/15 text-[13px] font-medium text-sb-on-surface/70 hover:bg-sb-surface-container-high transition-colors">
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
