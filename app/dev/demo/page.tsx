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
  institution_type: 'public' | 'private'
  level: 'initial' | 'primary' | 'secondary' | 'all'
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
          <p className="text-[13px] text-sb-on-surface-variant/50 mt-1">Gestiona las solicitudes de demonstración del sistema</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={fetchRequests}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-sb-surface-container text-sb-on-surface rounded-xl text-[13px] font-medium hover:bg-sb-surface-container-high transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
          <a
            href="/demo"
            target="_blank"
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 bg-sb-on-surface text-white rounded-xl text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            <ArrowUpRight className="h-4 w-4" />
            Formulario público
          </a>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-sb-on-surface' },
          { label: 'Pendientes', value: stats.pending, color: 'text-amber-600' },
          { label: 'Contactados', value: stats.contacted, color: 'text-blue-600' },
          { label: 'Programados', value: stats.scheduled, color: 'text-purple-600' },
          { label: 'Completados', value: stats.completed, color: 'text-emerald-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-sb-surface rounded-2xl p-4 border border-sb-outline-variant/8">
            <p className="text-[11px] text-sb-on-surface-variant/50 uppercase tracking-wider">{stat.label}</p>
            <p className={`text-2xl font-bold tracking-tight mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="bg-sb-surface rounded-2xl p-4 border border-sb-outline-variant/8">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/40" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o institución..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-sb-background border border-sb-on-surface/10 rounded-xl text-[13px] text-sb-on-surface placeholder:text-sb-on-surface/40 focus:outline-none focus:ring-2 focus:ring-sb-primary/20"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['', 'pending', 'contacted', 'scheduled', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 rounded-xl text-[12px] font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-sb-on-surface text-white'
                    : 'bg-sb-surface-container text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high'
                }`}
              >
                {status ? statusConfig[status]?.label : 'Todos'}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={item} className="bg-sb-surface rounded-2xl border border-sb-outline-variant/8 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-sb-primary/20 border-t-sb-primary rounded-full animate-spin mx-auto" />
            <p className="text-[13px] text-sb-on-surface-variant/50 mt-3">Cargando...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="h-10 w-10 text-sb-on-surface-variant/20 mx-auto mb-3" />
            <p className="text-[13px] text-sb-on-surface-variant/50">No hay solicitudes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sb-outline-variant/8">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-sb-on-surface-variant/50 uppercase tracking-wider">Persona</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-sb-on-surface-variant/50 uppercase tracking-wider">Institución</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-sb-on-surface-variant/50 uppercase tracking-wider">Nivel</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-sb-on-surface-variant/50 uppercase tracking-wider">Estado</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-sb-on-surface-variant/50 uppercase tracking-wider">Fecha</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-sb-on-surface-variant/50 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sb-outline-variant/8">
                {filtered.map((req) => {
                  const status = statusConfig[req.status]
                  const StatusIcon = status?.icon || Clock
                  return (
                    <tr 
                      key={req.id} 
                      className="hover:bg-sb-surface-container-low/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedRequest(req)}
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-[13px] font-medium text-sb-on-surface">{req.full_name}</p>
                          <p className="text-[11px] text-sb-on-surface-variant/50">{req.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-[13px] text-sb-on-surface/80">{req.institution_name || '—'}</p>
                          <p className="text-[11px] text-sb-on-surface-variant/40">{req.estimated_students || 0} alumnos</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[12px] text-sb-on-surface/60">{levelLabels[req.level]}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${status?.bg} ${status?.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status?.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[12px] text-sb-on-surface-variant/50">
                          {new Date(req.created_at).toLocaleDateString('es-PE')}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedRequest(req) }}
                          className="p-2 rounded-lg hover:bg-sb-surface-container-high transition-colors"
                        >
                          <Eye className="h-4 w-4 text-sb-on-surface-variant/50" />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedRequest(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-sb-surface rounded-2xl max-w-lg w-full shadow-2xl border border-sb-outline-variant/8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-sb-outline-variant/8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-semibold text-sb-on-surface">{selectedRequest.full_name}</h3>
                  <p className="text-[12px] text-sb-on-surface-variant/50">{selectedRequest.email}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium ${statusConfig[selectedRequest.status]?.bg} ${statusConfig[selectedRequest.status]?.color}`}>
                  {React.createElement(statusConfig[selectedRequest.status]?.icon || Clock, { className: "h-3 w-3" })}
                  {statusConfig[selectedRequest.status]?.label}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-sb-surface-container rounded-xl p-3">
                  <p className="text-[10px] text-sb-on-surface-variant/40 uppercase tracking-wider mb-1">Teléfono</p>
                  <p className="text-[13px] text-sb-on-surface">{selectedRequest.phone || '—'}</p>
                </div>
                <div className="bg-sb-surface-container rounded-xl p-3">
                  <p className="text-[10px] text-sb-on-surface-variant/40 uppercase tracking-wider mb-1">Tipo</p>
                  <p className="text-[13px] text-sb-on-surface">{selectedRequest.institution_type === 'public' ? 'Público' : 'Privado'}</p>
                </div>
                <div className="bg-sb-surface-container rounded-xl p-3">
                  <p className="text-[10px] text-sb-on-surface-variant/40 uppercase tracking-wider mb-1">Nivel</p>
                  <p className="text-[13px] text-sb-on-surface">{levelLabels[selectedRequest.level]}</p>
                </div>
                <div className="bg-sb-surface-container rounded-xl p-3">
                  <p className="text-[10px] text-sb-on-surface-variant/40 uppercase tracking-wider mb-1">Estudiantes</p>
                  <p className="text-[13px] text-sb-on-surface">{selectedRequest.estimated_students || '—'}</p>
                </div>
              </div>

              {selectedRequest.institution_name && (
                <div className="bg-sb-surface-container rounded-xl p-3">
                  <p className="text-[10px] text-sb-on-surface-variant/40 uppercase tracking-wider mb-1">Institución</p>
                  <p className="text-[13px] text-sb-on-surface">{selectedRequest.institution_name}</p>
                </div>
              )}

              {selectedRequest.message && (
                <div className="bg-sb-surface-container rounded-xl p-3">
                  <p className="text-[10px] text-sb-on-surface-variant/40 uppercase tracking-wider mb-1">Mensaje</p>
                  <p className="text-[13px] text-sb-on-surface">{selectedRequest.message}</p>
                </div>
              )}

              {selectedRequest.notes && (
                <div className="bg-sb-surface-container rounded-xl p-3 border border-sb-outline-variant/8">
                  <p className="text-[10px] text-sb-primary/60 uppercase tracking-wider mb-1">Notas internas</p>
                  <p className="text-[13px] text-sb-on-surface">{selectedRequest.notes}</p>
                </div>
              )}

              <div className="text-[11px] text-sb-on-surface-variant/40">
                Solicitado el {new Date(selectedRequest.created_at).toLocaleString('es-PE')}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-sb-outline-variant/8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                onClick={() => deleteRequest(selectedRequest.id)}
                className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2.5 text-[12px] text-red-500 hover:bg-red-50 rounded-xl transition-colors order-2 sm:order-1"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
              <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2">
                {selectedRequest.status === 'pending' && (
                  <button
                    onClick={() => updateStatus(selectedRequest.id, 'contacted')}
                    disabled={updating}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-500 text-white rounded-xl text-[12px] font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    Marcar contactado
                  </button>
                )}
                {selectedRequest.status === 'contacted' && (
                  <button
                    onClick={() => updateStatus(selectedRequest.id, 'scheduled')}
                    disabled={updating}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-purple-500 text-white rounded-xl text-[12px] font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    Programar demo
                  </button>
                )}
                {selectedRequest.status === 'scheduled' && (
                  <button
                    onClick={() => updateStatus(selectedRequest.id, 'completed')}
                    disabled={updating}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-[12px] font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    Marcar completado
                  </button>
                )}
                {selectedRequest.status !== 'cancelled' && selectedRequest.status !== 'completed' && (
                  <button
                    onClick={() => updateStatus(selectedRequest.id, 'cancelled')}
                    disabled={updating}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-sb-surface-container text-sb-on-surface-variant rounded-xl text-[12px] font-medium hover:bg-sb-surface-container-high disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
