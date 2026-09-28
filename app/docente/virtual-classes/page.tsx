'use client'

import { useState, useEffect } from 'react'
import { Video, Plus, ExternalLink, Calendar, Clock, Monitor } from "@/components/ui/proicons"
import { SbSectionHeader, SbBtn, SbModal, SbModalHeader, SbModalBody, SbInput, SbTextarea, SbSelect, SbBadge } from "@/components/ui/sb"
import { useAuthStore } from "@/stores/auth-store"

interface VirtualClass {
  id: string
  course_id: string
  course_name: string
  teacher_name: string
  title: string
  description: string
  meeting_url: string
  platform: string
  class_date: string
  class_time: string
  duration_minutes: number
  status: string
}

interface Course {
  id: string
  name: string
}

export default function VirtualClassesPage() {
  const user = useAuthStore((s) => s.user)
  const [classes, setClasses] = useState<VirtualClass[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [planError, setPlanError] = useState(false)
  const [formData, setFormData] = useState({
    course_id: '',
    title: '',
    description: '',
    meeting_url: '',
    platform: 'zoom',
    class_date: '',
    class_time: '',
    duration_minutes: 60
  })

  useEffect(() => {
    fetchClasses()
    fetchCourses()
  }, [])

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/docente/virtual-classes')
      if (res.status === 403) {
        setPlanError(true)
        return
      }
      const data = await res.json()
      setClasses(data)
    } catch (error) {
      console.error('Error fetching classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/docente/cursos')
      const data = await res.json()
      setCourses(data)
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/docente/virtual-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setShowModal(false)
        setFormData({
          course_id: '',
          title: '',
          description: '',
          meeting_url: '',
          platform: 'zoom',
          class_date: '',
          class_time: '',
          duration_minutes: 60
        })
        fetchClasses()
      }
    } catch (error) {
      console.error('Error creating class:', error)
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Programada'
      case 'in_progress': return 'En curso'
      case 'completed': return 'Finalizada'
      default: return status
    }
  }

  const getPlatformLabel = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'zoom': return 'Zoom'
      case 'meet': return 'Meet'
      case 'teams': return 'Teams'
      default: return platform
    }
  }

  if (planError) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-center py-16">
          <div className="max-w-md w-full rounded-2xl bg-sb-surface border border-sb-outline-variant/10 p-8 text-center">
            <div className="h-16 w-16 flex items-center justify-center mx-auto mb-4 rounded-2xl bg-sb-surface-container">
              <Video className="h-7 w-7 text-sb-on-surface-variant/40" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-sb-on-surface mb-2">
              Función no disponible
            </h2>
            <p className="text-sm text-sb-on-surface-variant/50 mb-6">
              Las clases virtuales están disponibles en el plan Pro o superior.
            </p>
            <SbBtn variant="filled" rounded className="w-full">
              Mejorar Plan
            </SbBtn>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <SbSectionHeader
        title="Clases Virtuales"
        description="Programa y gestiona tus clases en línea"
        action={
          <SbBtn variant="filled" rounded className="flex items-center gap-2" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            Nueva Clase
          </SbBtn>
        }
      />

      {/* ═══════════════ CONTENT ═══════════════ */}
      <div className="rounded-2xl bg-sb-surface border border-sb-outline-variant/10 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-sb-surface-container">
            <Video className="h-5 w-5 text-sb-on-surface-variant/50" />
          </div>
          <div>
            <p className="text-sm font-semibold text-sb-on-surface">Todas las clases</p>
            <p className="text-[11px] text-sb-on-surface-variant/50">
              {loading ? "Cargando..." : `${classes.length} clase${classes.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-10 h-10 border-2 border-sb-outline-variant border-t-sb-on-surface rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-sb-on-surface-variant/50">Cargando clases...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="py-12 text-center">
            <div className="h-12 w-12 flex items-center justify-center mx-auto mb-3 rounded-2xl bg-sb-surface-container">
              <Video className="h-5 w-5 text-sb-on-surface-variant/30" />
            </div>
            <p className="text-sm mb-1 text-sb-on-surface-variant/60">No hay clases programadas</p>
            <p className="text-xs text-sb-on-surface-variant/40">Crea tu primera clase virtual</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {classes.map((cls) => (
              <div key={cls.id} className="flex items-start gap-4 p-4 rounded-xl bg-sb-surface-container border border-sb-outline-variant/10 transition-colors group">
                <div className="h-11 w-11 flex items-center justify-center shrink-0 rounded-xl bg-sb-surface-container-high group-hover:scale-110 transition-transform">
                  <Video className="h-5 w-5 text-sb-on-surface-variant/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold truncate text-sb-on-surface">{cls.title}</p>
                    <SbBadge
                      className="px-2.5 py-0.5 text-[11px] font-medium shrink-0"
                      color={cls.status === 'in_progress'
                        ? 'bg-red-500/10 text-red-400'
                        : cls.status === 'scheduled'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-sb-surface-container-high text-sb-on-surface-variant/50'}
                    >
                      {getStatusLabel(cls.status)}
                    </SbBadge>
                  </div>
                  <p className="text-xs mb-2 text-sb-on-surface-variant/50">{cls.course_name}</p>
                  {cls.description && (
                    <p className="text-xs mb-2 line-clamp-1 text-sb-on-surface-variant/40">{cls.description}</p>
                  )}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-sb-on-surface-variant/40" />
                      <span className="text-[11px] text-sb-on-surface-variant/50">{cls.class_date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-sb-on-surface-variant/40" />
                      <span className="text-[11px] text-sb-on-surface-variant/50">{cls.class_time?.slice(0, 5)} · {cls.duration_minutes} min</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Monitor className="h-3.5 w-3.5 text-sb-on-surface-variant/40" />
                      <span className="text-[11px] text-sb-on-surface-variant/50">{getPlatformLabel(cls.platform)}</span>
                    </div>
                  </div>
                </div>
                <a
                  href={cls.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sb-btn tonal rounded shrink-0"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Unirse
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════ MODAL ═══════════════ */}
      <SbModal open={showModal} onClose={() => setShowModal(false)} maxWidth="520px">
        <SbModalHeader title="Nueva Clase Virtual" onClose={() => setShowModal(false)} />
        <SbModalBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-sb-on-surface-variant/50 mb-1.5">Curso</label>
              <SbSelect
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                className="w-full"
                required
              >
                <option value="">Seleccionar curso</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </SbSelect>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-sb-on-surface-variant/50 mb-1.5">Título</label>
              <SbInput
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Clase de Matemáticas"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-sb-on-surface-variant/50 mb-1.5">Descripción</label>
              <SbTextarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Tema de la clase..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-sb-on-surface-variant/50 mb-1.5">Plataforma</label>
                <SbSelect
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full"
                >
                  <option value="zoom">Zoom</option>
                  <option value="meet">Google Meet</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="other">Otra</option>
                </SbSelect>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-sb-on-surface-variant/50 mb-1.5">Duración (min)</label>
                <SbInput
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                  min="15"
                  max="180"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-sb-on-surface-variant/50 mb-1.5">Enlace de la reunión</label>
              <SbInput
                type="url"
                value={formData.meeting_url}
                onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
                placeholder="https://zoom.us/j/..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-sb-on-surface-variant/50 mb-1.5">Fecha</label>
                <SbInput
                  type="date"
                  value={formData.class_date}
                  onChange={(e) => setFormData({ ...formData, class_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-sb-on-surface-variant/50 mb-1.5">Hora</label>
                <SbInput
                  type="time"
                  value={formData.class_time}
                  onChange={(e) => setFormData({ ...formData, class_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <SbBtn type="button" rounded className="flex-1" onClick={() => setShowModal(false)}>
                Cancelar
              </SbBtn>
              <SbBtn type="submit" variant="filled" rounded className="flex-1">
                Crear Clase
              </SbBtn>
            </div>
          </form>
        </SbModalBody>
      </SbModal>
    </div>
  )
}
