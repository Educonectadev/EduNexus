'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Video, Plus, ExternalLink, Calendar, Clock, 
  Monitor, CreditCard, Users 
} from 'lucide-react'

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

const listItem = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
}

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-sb-primary/10 text-sb-primary'
      case 'in_progress': return 'bg-green-100 text-green-700'
      case 'completed': return 'bg-sb-on-surface/10 text-sb-on-surface/60'
      default: return 'bg-sb-on-surface/10 text-sb-on-surface/60'
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

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'zoom': return '🔵'
      case 'meet': return '🟢'
      case 'teams': return '🟣'
      default: return '📹'
    }
  }

  if (planError) {
    return (
      <div className="min-h-screen bg-sb-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-sb-surface rounded-2xl p-8 max-w-md w-full text-center shadow-lg"
        >
          <div className="w-16 h-16 bg-sb-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-sb-primary" />
          </div>
          <h2 className="text-xl font-bold text-sb-on-surface mb-2">
            Función no disponible
          </h2>
          <p className="text-sb-on-surface/60 mb-6">
            Las clases virtuales están disponibles en el plan Pro o superior.
          </p>
          <button className="px-6 py-3 bg-sb-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity">
            Mejorar Plan
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sb-background p-6">
      <motion.div
        variants={staggerItem}
        initial="hidden"
        animate="show"
        className="max-w-6xl mx-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-sb-on-surface flex items-center gap-3">
              <div className="w-10 h-10 bg-sb-on-surface/8 rounded-xl flex items-center justify-center">
                <Video className="w-5 h-5 text-sb-on-surface" />
              </div>
              Clases Virtuales
            </h1>
            <p className="text-sb-on-surface/60 mt-1">
              Programa y gestiona tus clases en línea
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-sb-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            Nueva Clase
          </button>
        </div>

        {loading ? (
          <div className="bg-sb-surface rounded-2xl p-12 text-center">
            <div className="w-12 h-12 border-4 border-sb-primary/20 border-t-sb-primary rounded-full animate-spin mx-auto" />
            <p className="text-sb-on-surface/60 mt-4">Cargando clases...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="bg-sb-surface rounded-2xl p-12 text-center">
            <Video className="w-12 h-12 text-sb-on-surface/20 mx-auto mb-4" />
            <p className="text-sb-on-surface/60">No hay clases programadas</p>
          </div>
        ) : (
          <motion.div
            variants={staggerItem}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {classes.map((cls) => (
              <motion.div
                key={cls.id}
                variants={listItem}
                className="bg-sb-surface rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-3 py-1 text-xs font-medium rounded-lg ${getStatusColor(cls.status)}`}>
                    {getStatusLabel(cls.status)}
                  </span>
                  <span className="text-lg">{getPlatformIcon(cls.platform)}</span>
                </div>

                <h3 className="font-bold text-sb-on-surface mb-1">{cls.title}</h3>
                <p className="text-sm text-sb-on-surface/60 mb-3">{cls.course_name}</p>

                {cls.description && (
                  <p className="text-sm text-sb-on-surface/50 mb-3 line-clamp-2">{cls.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-sb-on-surface/60">
                    <Calendar className="w-4 h-4" />
                    {cls.class_date}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-sb-on-surface/60">
                    <Clock className="w-4 h-4" />
                    {cls.class_time} ({cls.duration_minutes} min)
                  </div>
                  <div className="flex items-center gap-2 text-sm text-sb-on-surface/60">
                    <Monitor className="w-4 h-4" />
                    {cls.platform}
                  </div>
                </div>

                <a
                  href={cls.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 bg-sb-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  <ExternalLink className="w-4 h-4" />
                  Unirse a la clase
                </a>
              </motion.div>
            ))}
          </motion.div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-sb-surface rounded-2xl p-6 max-w-lg w-full"
            >
              <h2 className="text-xl font-bold text-sb-on-surface mb-4">Nueva Clase Virtual</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-sb-on-surface mb-1">Curso</label>
                  <select
                    value={formData.course_id}
                    onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                    className="sbf-native-select w-full"
                    required
                  >
                    <option value="">Seleccionar curso</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-sb-on-surface mb-1">Título</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-sb-background border border-sb-on-surface/10 rounded-xl text-sb-on-surface focus:outline-none focus:ring-2 focus:ring-sb-primary/20"
                    placeholder="Ej: Clase de Matemáticas"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-sb-on-surface mb-1">Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-sb-background border border-sb-on-surface/10 rounded-xl text-sb-on-surface focus:outline-none focus:ring-2 focus:ring-sb-primary/20"
                    rows={2}
                    placeholder="Tema de la clase..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-sb-on-surface mb-1">Plataforma</label>
                    <select
                      value={formData.platform}
                      onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                      className="sbf-native-select w-full"
                    >
                      <option value="zoom">Zoom</option>
                      <option value="meet">Google Meet</option>
                      <option value="teams">Microsoft Teams</option>
                      <option value="other">Otra</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sb-on-surface mb-1">Duración (min)</label>
                    <input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                      className="w-full px-4 py-3 bg-sb-background border border-sb-on-surface/10 rounded-xl text-sb-on-surface focus:outline-none focus:ring-2 focus:ring-sb-primary/20"
                      min="15"
                      max="180"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-sb-on-surface mb-1">Enlace de la reunión</label>
                  <input
                    type="url"
                    value={formData.meeting_url}
                    onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
                    className="w-full px-4 py-3 bg-sb-background border border-sb-on-surface/10 rounded-xl text-sb-on-surface focus:outline-none focus:ring-2 focus:ring-sb-primary/20"
                    placeholder="https://zoom.us/j/..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-sb-on-surface mb-1">Fecha</label>
                    <input
                      type="date"
                      value={formData.class_date}
                      onChange={(e) => setFormData({ ...formData, class_date: e.target.value })}
                      className="w-full px-4 py-3 bg-sb-background border border-sb-on-surface/10 rounded-xl text-sb-on-surface focus:outline-none focus:ring-2 focus:ring-sb-primary/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sb-on-surface mb-1">Hora</label>
                    <input
                      type="time"
                      value={formData.class_time}
                      onChange={(e) => setFormData({ ...formData, class_time: e.target.value })}
                      className="w-full px-4 py-3 bg-sb-background border border-sb-on-surface/10 rounded-xl text-sb-on-surface focus:outline-none focus:ring-2 focus:ring-sb-primary/20"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 bg-sb-on-surface/10 text-sb-on-surface rounded-xl font-medium hover:bg-sb-on-surface/20 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-sb-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                  >
                    Crear Clase
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
