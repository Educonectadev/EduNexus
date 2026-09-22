'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Video, Plus, ExternalLink, Calendar, Clock, Monitor, Sun, Moon } from "@/components/ui/proicons"
import NotificationBell from "@/components/layout/notification-bell"
import { useAuthStore } from "@/stores/auth-store"

const FONT = "var(--app-main-font, 'DM Sans'), sans-serif"

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
  const { theme, setTheme } = useTheme()
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
      <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-white dark:bg-[#1a1a1c] sb-note">
        <div className="p-6 md:p-8 pb-24 md:pb-8 flex items-center justify-center min-h-[60vh]">
          <div className="p-8 max-w-md w-full text-center" style={{ borderRadius: "24px", background: "var(--note-surface)", border: "1px solid var(--note-hairline)" }}>
            <div className="h-16 w-16 flex items-center justify-center mx-auto mb-4" style={{ borderRadius: "16px", background: "var(--note-fill)" }}>
              <Video className="h-7 w-7" style={{ color: "var(--note-muted)" }} />
            </div>
            <h2 className="text-[20px] font-bold mb-2" style={{ color: "var(--note-text)", fontFamily: FONT }}>
              Función no disponible
            </h2>
            <p className="text-[13px] mb-6" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
              Las clases virtuales están disponibles en el plan Pro o superior.
            </p>
            <button
              className="px-6 py-3 text-[13px] font-semibold transition-opacity hover:opacity-80"
              style={{ borderRadius: "999px", background: "var(--note-solid-bg)", color: "var(--note-solid-fg)", fontFamily: FONT }}
            >
              Mejorar Plan
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-white dark:bg-[#1a1a1c] sb-note">
      <div className="p-6 md:p-8 pb-24 md:pb-8">

        {/* ═══════════════ HEADER ═══════════════ */}
        <header className="flex items-start justify-between mb-6 gap-4">
          <div>
            <p className="text-[14px] font-medium mb-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Clases</p>
            <h1 className="text-[36px] md:text-[48px] font-bold leading-tight" style={{ color: "var(--note-text)", fontFamily: FONT }}>
              Clases Virtuales
            </h1>
            <p className="text-[13px] mt-2" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Programa y gestiona tus clases en línea</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5">
                <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ background: "var(--note-fill-strong)" }}>
                  <span className="text-[9px] font-semibold" style={{ color: "var(--note-text)" }}>
                    {user.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "D"}
                  </span>
                </div>
                <span className="text-sm md:text-base font-medium whitespace-nowrap" style={{ color: "var(--note-text)", fontFamily: FONT }}>
                  {user.full_name}
                </span>
              </div>
            )}
            <NotificationBell />
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Cambiar tema" title="Cambiar tema" className="h-10 w-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity relative">
              <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" style={{ color: "var(--note-text)" }} />
              <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" style={{ color: "var(--note-text)" }} />
            </button>
          </div>
        </header>

        {/* ═══════════════ ACTION BAR ═══════════════ */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center" style={{ borderRadius: "12px", background: "var(--note-fill)" }}>
              <Video className="h-5 w-5" style={{ color: "var(--note-muted)" }} />
            </div>
            <div>
              <p className="text-[14px] font-bold" style={{ color: "var(--note-text)", fontFamily: FONT }}>Todas las clases</p>
              <p className="text-[11px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
                {loading ? "Cargando..." : `${classes.length} clase${classes.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold transition-opacity hover:opacity-80"
            style={{ borderRadius: "999px", background: "var(--note-solid-bg)", color: "var(--note-solid-fg)", fontFamily: FONT }}
          >
            <Plus className="h-4 w-4" />
            Nueva Clase
          </button>
        </div>

        {/* ═══════════════ CONTENT ═══════════════ */}
        <div className="p-5" style={{ borderRadius: "24px", background: "var(--note-surface)", border: "1px solid var(--note-hairline)" }}>
          {loading ? (
            <div className="py-12 text-center">
              <div className="w-10 h-10 border-2 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: "var(--note-fill)", borderTopColor: "var(--note-muted)" }} />
              <p className="text-[13px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Cargando clases...</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="py-12 text-center">
              <div className="h-12 w-12 flex items-center justify-center mx-auto mb-3" style={{ borderRadius: "16px", background: "var(--note-fill)" }}>
                <Video className="h-5 w-5" style={{ color: "var(--note-muted)", opacity: 0.3 }} />
              </div>
              <p className="text-[13px] mb-1" style={{ color: "var(--note-muted)", fontFamily: FONT }}>No hay clases programadas</p>
              <p className="text-[11px]" style={{ color: "var(--note-muted)", fontFamily: FONT, opacity: 0.6 }}>Crea tu primera clase virtual</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {classes.map((cls) => (
                <div key={cls.id} className="flex items-start gap-4 p-4 transition-colors group" style={{ borderRadius: "16px", background: "var(--note-fill)" }}>
                  <div className="h-11 w-11 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform" style={{ borderRadius: "12px", background: "var(--note-fill-strong)" }}>
                    <Video className="h-5 w-5" style={{ color: "var(--note-text)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[14px] font-bold truncate" style={{ color: "var(--note-text)", fontFamily: FONT }}>{cls.title}</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 shrink-0" style={{ borderRadius: "8px", background: "var(--note-fill-strong)", color: "var(--note-text)", fontFamily: FONT }}>
                        {getStatusLabel(cls.status)}
                      </span>
                    </div>
                    <p className="text-[12px] mb-2" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{cls.course_name}</p>
                    {cls.description && (
                      <p className="text-[12px] mb-2 line-clamp-1" style={{ color: "var(--note-muted)", fontFamily: FONT, opacity: 0.7 }}>{cls.description}</p>
                    )}
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" style={{ color: "var(--note-muted)" }} />
                        <span className="text-[11px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{cls.class_date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" style={{ color: "var(--note-muted)" }} />
                        <span className="text-[11px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{cls.class_time?.slice(0, 5)} · {cls.duration_minutes} min</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Monitor className="h-3.5 w-3.5" style={{ color: "var(--note-muted)" }} />
                        <span className="text-[11px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{getPlatformLabel(cls.platform)}</span>
                      </div>
                    </div>
                  </div>
                  <a
                    href={cls.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold transition-opacity hover:opacity-80"
                    style={{ borderRadius: "999px", background: "var(--note-fill-strong)", color: "var(--note-text)", fontFamily: FONT }}
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
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
            <div
              className="w-full max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              style={{ borderRadius: "24px", background: "var(--note-surface)", border: "1px solid var(--note-hairline)" }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[18px] font-bold" style={{ color: "var(--note-text)", fontFamily: FONT }}>Nueva Clase Virtual</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="h-8 w-8 flex items-center justify-center text-[14px] font-bold transition-opacity hover:opacity-60"
                    style={{ borderRadius: "999px", background: "var(--note-fill)", color: "var(--note-muted)" }}
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Curso</label>
                    <select
                      value={formData.course_id}
                      onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                      className="w-full px-4 py-3 text-[13px] focus:outline-none"
                      style={{ borderRadius: "12px", background: "var(--note-fill)", color: "var(--note-text)", border: "1px solid var(--note-hairline)", fontFamily: FONT }}
                      required
                    >
                      <option value="">Seleccionar curso</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Título</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 text-[13px] focus:outline-none"
                      style={{ borderRadius: "12px", background: "var(--note-fill)", color: "var(--note-text)", border: "1px solid var(--note-hairline)", fontFamily: FONT }}
                      placeholder="Ej: Clase de Matemáticas"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Descripción</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 text-[13px] focus:outline-none resize-none"
                      style={{ borderRadius: "12px", background: "var(--note-fill)", color: "var(--note-text)", border: "1px solid var(--note-hairline)", fontFamily: FONT }}
                      rows={2}
                      placeholder="Tema de la clase..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Plataforma</label>
                      <select
                        value={formData.platform}
                        onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                        className="w-full px-4 py-3 text-[13px] focus:outline-none"
                        style={{ borderRadius: "12px", background: "var(--note-fill)", color: "var(--note-text)", border: "1px solid var(--note-hairline)", fontFamily: FONT }}
                      >
                        <option value="zoom">Zoom</option>
                        <option value="meet">Google Meet</option>
                        <option value="teams">Microsoft Teams</option>
                        <option value="other">Otra</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Duración (min)</label>
                      <input
                        type="number"
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                        className="w-full px-4 py-3 text-[13px] focus:outline-none"
                        style={{ borderRadius: "12px", background: "var(--note-fill)", color: "var(--note-text)", border: "1px solid var(--note-hairline)", fontFamily: FONT }}
                        min="15"
                        max="180"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Enlace de la reunión</label>
                    <input
                      type="url"
                      value={formData.meeting_url}
                      onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
                      className="w-full px-4 py-3 text-[13px] focus:outline-none"
                      style={{ borderRadius: "12px", background: "var(--note-fill)", color: "var(--note-text)", border: "1px solid var(--note-hairline)", fontFamily: FONT }}
                      placeholder="https://zoom.us/j/..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Fecha</label>
                      <input
                        type="date"
                        value={formData.class_date}
                        onChange={(e) => setFormData({ ...formData, class_date: e.target.value })}
                        className="w-full px-4 py-3 text-[13px] focus:outline-none"
                        style={{ borderRadius: "12px", background: "var(--note-fill)", color: "var(--note-text)", border: "1px solid var(--note-hairline)", fontFamily: FONT }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Hora</label>
                      <input
                        type="time"
                        value={formData.class_time}
                        onChange={(e) => setFormData({ ...formData, class_time: e.target.value })}
                        className="w-full px-4 py-3 text-[13px] focus:outline-none"
                        style={{ borderRadius: "12px", background: "var(--note-fill)", color: "var(--note-text)", border: "1px solid var(--note-hairline)", fontFamily: FONT }}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-3 text-[13px] font-semibold transition-opacity hover:opacity-70"
                      style={{ borderRadius: "999px", background: "var(--note-fill)", color: "var(--note-muted)", fontFamily: FONT }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 text-[13px] font-semibold transition-opacity hover:opacity-80"
                      style={{ borderRadius: "999px", background: "var(--note-solid-bg)", color: "var(--note-solid-fg)", fontFamily: FONT }}
                    >
                      Crear Clase
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
