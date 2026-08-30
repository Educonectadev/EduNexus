"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Calendar, Mail, Phone, Building2, Users, MessageSquare, 
  Clock, CheckCircle, XCircle, AlertCircle, Search, Filter,
  MoreVertical, Eye, Trash2, ArrowUpRight, RefreshCw
} from "@/components/ui/proicons"

interface DemoRequest {
  id: string
  full_name: string
  email: string
  phone: string | null
  institution_name: string | null
  institution_type: string
  level: string
  estimated_students: number
  message: string | null
  status: 'pending' | 'contacted' | 'scheduled' | 'completed' | 'cancelled'
  demo_date: string | null
  notes: string | null
  created_at: string
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<any> }> = {
  pending: { label: 'Pendiente', color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
  contacted: { label: 'Contactado', color: 'text-blue-600', bg: 'bg-blue-50', icon: Phone },
  scheduled: { label: 'Programado', color: 'text-purple-600', bg: 'bg-purple-50', icon: Calendar },
  completed: { label: 'Completado', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
}

const typeLabels: Record<string, string> = {
  public: 'Público',
  private: 'Privado',
  publico: 'Público',
  privado: 'Privado',
  ugel: 'UGEL',
  minedu: 'MINEDU',
  otro: 'Otro',
}

const levelLabels: Record<string, string> = {
  initial: 'Inicial',
  primary: 'Primaria',
  secondary: 'Secundaria',
  all: 'Todos',
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function DevDemoPage() {
  const [requests, setRequests] = React.useState<DemoRequest[]>([])
  const [loading, setLoading] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState('')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedRequest, setSelectedRequest] = React.useState<DemoRequest | null>(null)
  const [updating, setUpdating] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [createdCreds, setCreatedCreds] = React.useState<{ code: string; email: string; password: string } | null>(null)

  React.useEffect(() => {
    fetchRequests()
  }, [statusFilter])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/dev/demo?${params}`)
      if (res.ok) {
        const data = await res.json()
        setRequests(data.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string, notes?: string) => {
    setUpdating(true)
    try {
      const res = await fetch('/api/dev/demo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, notes })
      })
      if (res.ok) {
        fetchRequests()
        setSelectedRequest(null)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(false)
    }
  }

  const createInstitution = async (id: string) => {
    if (!confirm('Ir al formulario completo de creación con los datos de esta solicitud?')) return
    window.location.href = `/dev/instituciones?demo=${id}`
  }

  const deleteRequest = async (id: string) => {
    if (!confirm('¿Eliminar esta solicitud?')) return
    try {
      const res = await fetch(`/api/dev/demo?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchRequests()
        setSelectedRequest(null)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const filtered = requests.filter(r => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return r.full_name.toLowerCase().includes(q) || 
           r.email.toLowerCase().includes(q) ||
           r.institution_name?.toLowerCase().includes(q)
  })

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    contacted: requests.filter(r => r.status === 'contacted').length,
    scheduled: requests.filter(r => r.status === 'scheduled').length,
    completed: requests.filter(r => r.status === 'completed').length,
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="w-full space-y-6 py-2">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-sb-on-surface">Solicitudes de Demo</h2>
          <p className="text-[13px] text-sb-on-surface/70 mt-1">Gestiona las solicitudes de demonstración del sistema</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={fetchRequests}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 h-10 bg-sb-surface-container text-sb-on-surface rounded-xl text-[13px] font-medium hover:bg-sb-surface-container-high transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
          <a
            href="/demo"
            target="_blank"
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 h-10 bg-sb-on-surface text-sb-surface rounded-xl text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            <ArrowUpRight className="h-4 w-4" />
            Formulario público
          </a>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-sb-on-surface' },
          { label: 'Pendientes', value: stats.pending, color: 'text-amber-600' },
          { label: 'Contactados', value: stats.contacted, color: 'text-blue-600' },
          { label: 'Programados', value: stats.scheduled, color: 'text-purple-600' },
          { label: 'Completados', value: stats.completed, color: 'text-emerald-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-sb-surface rounded-2xl p-4 border border-sb-outline-variant/10">
            <p className="text-[11px] text-sb-on-surface/60 uppercase tracking-wider">{stat.label}</p>
            <p className={`text-xl font-bold tracking-tight mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="bg-sb-surface rounded-2xl p-4 border border-sb-outline-variant/10">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface/50" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o institución..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full pl-10 pr-4 rounded-xl bg-sb-surface-container px-4 text-[14px] text-sb-on-surface placeholder:text-sb-on-surface/50 border border-transparent focus:outline-none focus:ring-2 focus:ring-sb-primary/30"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['', 'pending', 'contacted', 'scheduled', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 h-9 rounded-xl text-[12px] font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-sb-on-surface text-sb-surface'
                    : 'bg-sb-surface-container text-sb-on-surface/80 hover:bg-sb-surface-container-high'
                }`}
              >
                {status ? statusConfig[status]?.label : 'Todos'}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={item} className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-sb-primary/20 border-t-sb-primary rounded-full animate-spin mx-auto" />
            <p className="text-[13px] text-sb-on-surface/70 mt-3">Cargando...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="h-10 w-10 text-sb-on-surface/50 mx-auto mb-3" />
            <p className="text-[13px] text-sb-on-surface/70">No hay solicitudes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-sb-outline-variant/10">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-sb-on-surface/60 uppercase tracking-wider">Persona</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-sb-on-surface/60 uppercase tracking-wider">Institución</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-sb-on-surface/60 uppercase tracking-wider">Nivel</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-sb-on-surface/60 uppercase tracking-wider">Estado</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-sb-on-surface/60 uppercase tracking-wider">Fecha</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-sb-on-surface/60 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sb-outline-variant/10">
                {filtered.map((req) => {
                  const status = statusConfig[req.status] || statusConfig.pending
                  const StatusIcon = status?.icon || Clock
                  return (
                    <tr 
                      key={req.id} 
                      className="hover:bg-sb-surface-container/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedRequest(req)}
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-[13px] font-medium text-sb-on-surface">{req.full_name}</p>
                          <p className="text-[11px] text-sb-on-surface/70">{req.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-[13px] text-sb-on-surface/80">{req.institution_name || '—'}</p>
                          <p className="text-[11px] text-sb-on-surface/60">{req.estimated_students || 0} alumnos</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[12px] text-sb-on-surface/70">{levelLabels[req.level]}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${status?.bg} ${status?.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status?.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[12px] text-sb-on-surface/70">
                          {new Date(req.created_at).toLocaleDateString('es-PE')}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedRequest(req) }}
                          className="p-2 rounded-lg hover:bg-sb-surface-container-high transition-colors"
                        >
                          <Eye className="h-4 w-4 text-sb-on-surface/60" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-end justify-center sm:items-center p-3 sm:p-4" onClick={() => setSelectedRequest(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-h-[92vh] overflow-y-auto rounded-3xl sm:rounded-2xl sm:max-w-lg bg-sb-surface shadow-2xl border border-sb-outline-variant/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-sb-outline-variant/10">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold text-sb-on-surface truncate">{selectedRequest.full_name}</h3>
                  <p className="text-[12px] text-sb-on-surface/70 truncate">{selectedRequest.email}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium shrink-0 ${statusConfig[selectedRequest.status]?.bg} ${statusConfig[selectedRequest.status]?.color}`}>
                  {React.createElement(statusConfig[selectedRequest.status]?.icon || Clock, { className: "h-3 w-3" })}
                  {statusConfig[selectedRequest.status]?.label}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-sb-surface-container rounded-xl p-3">
                  <p className="text-[10px] text-sb-on-surface/60 uppercase tracking-wider mb-1">Teléfono</p>
                  <p className="text-[13px] text-sb-on-surface">{selectedRequest.phone || '—'}</p>
                </div>
                <div className="bg-sb-surface-container rounded-xl p-3">
                  <p className="text-[10px] text-sb-on-surface/60 uppercase tracking-wider mb-1">Tipo</p>
                  <p className="text-[13px] text-sb-on-surface">{typeLabels[selectedRequest.institution_type] || selectedRequest.institution_type || '—'}</p>
                </div>
                <div className="bg-sb-surface-container rounded-xl p-3">
                  <p className="text-[10px] text-sb-on-surface/60 uppercase tracking-wider mb-1">Nivel</p>
                  <p className="text-[13px] text-sb-on-surface">{levelLabels[selectedRequest.level]}</p>
                </div>
                <div className="bg-sb-surface-container rounded-xl p-3">
                  <p className="text-[10px] text-sb-on-surface/60 uppercase tracking-wider mb-1">Estudiantes</p>
                  <p className="text-[13px] text-sb-on-surface">{selectedRequest.estimated_students || '—'}</p>
                </div>
              </div>

              {selectedRequest.institution_name && (
                <div className="bg-sb-surface-container rounded-xl p-3">
                  <p className="text-[10px] text-sb-on-surface/60 uppercase tracking-wider mb-1">Institución</p>
                  <p className="text-[13px] text-sb-on-surface">{selectedRequest.institution_name}</p>
                </div>
              )}

              {selectedRequest.message && (
                <div className="bg-sb-surface-container rounded-xl p-3">
                  <p className="text-[10px] text-sb-on-surface/60 uppercase tracking-wider mb-1">Mensaje</p>
                  <p className="text-[13px] text-sb-on-surface">{selectedRequest.message}</p>
                </div>
              )}

              {selectedRequest.notes && (
                <div className="bg-sb-surface-container rounded-xl p-3 border border-sb-outline-variant/10">
                  <p className="text-[10px] text-sb-primary/80 uppercase tracking-wider mb-1">Notas internas</p>
                  <p className="text-[13px] text-sb-on-surface">{selectedRequest.notes}</p>
                </div>
              )}

              {createdCreds && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                  <p className="text-[10px] text-emerald-700/70 uppercase tracking-wider mb-1">Institución demo creada</p>
                  <p className="text-[13px] font-medium text-emerald-800">Código: {createdCreds.code}</p>
                  <div className="mt-2 space-y-0.5 text-[12px] text-emerald-800">
                    <p>URL: <a href={`${window.location.origin}/login`} className="font-mono font-semibold underline hover:opacity-80">{window.location.origin}/login</a></p>
                    <p>Email: <span className="font-mono font-semibold">{createdCreds.email}</span></p>
                    <p>Password: <span className="font-mono font-semibold">{createdCreds.password}</span></p>
                  </div>
                  <a
                    href={`${window.location.origin}/login`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-[13px] font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Ir al Login
                  </a>
                </div>
              )}

              <div className="text-[11px] text-sb-on-surface/60">
                Solicitado el {new Date(selectedRequest.created_at).toLocaleString('es-PE')}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-sb-outline-variant/10 space-y-2">
              {selectedRequest.status !== 'completed' && (
                <button
                  onClick={() => createInstitution(selectedRequest.id)}
                  disabled={creating || updating}
                  className="w-full px-4 py-3 bg-emerald-500 text-white rounded-xl text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 text-center"
                >
                  {creating ? 'Creando...' : 'Crear institución demo'}
                </button>
              )}
              <div className="grid grid-cols-2 gap-2">
                {selectedRequest.status === 'pending' && (
                  <button
                    onClick={() => updateStatus(selectedRequest.id, 'contacted')}
                    disabled={updating}
                    className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-xl text-[12px] font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    Marcar contactado
                  </button>
                )}
                {selectedRequest.status === 'contacted' && (
                  <button
                    onClick={() => updateStatus(selectedRequest.id, 'scheduled')}
                    disabled={updating}
                    className="w-full px-4 py-2.5 bg-purple-500 text-white rounded-xl text-[12px] font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    Programar demo
                  </button>
                )}
                {selectedRequest.status === 'scheduled' && (
                  <button
                    onClick={() => updateStatus(selectedRequest.id, 'completed')}
                    disabled={updating}
                    className="w-full px-4 py-2.5 bg-teal-600 text-white rounded-xl text-[12px] font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    Marcar completado
                  </button>
                )}
                {selectedRequest.status !== 'cancelled' && selectedRequest.status !== 'completed' && (
                  <button
                    onClick={() => updateStatus(selectedRequest.id, 'cancelled')}
                    disabled={updating}
                    className="w-full px-4 py-2.5 bg-sb-surface-container text-sb-on-surface rounded-xl text-[12px] font-medium hover:bg-sb-surface-container-high disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                )}
                {selectedRequest.status === 'completed' && (
                  <button
                    onClick={() => updateStatus(selectedRequest.id, 'cancelled')}
                    disabled={updating}
                    className="w-full px-4 py-2.5 bg-sb-surface-container text-sb-on-surface rounded-xl text-[12px] font-medium hover:bg-sb-surface-container-high disabled:opacity-50 col-span-2"
                  >
                    Cancelar
                  </button>
                )}
              </div>
              <button
                onClick={() => deleteRequest(selectedRequest.id)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[12px] text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar solicitud
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
