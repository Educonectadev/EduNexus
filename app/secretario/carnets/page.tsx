'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Download, Users, Search, Filter, CheckSquare, Square, 
  GraduationCap, CreditCard, AlertCircle 
} from 'lucide-react'

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

const listItem = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
}

interface Student {
  id: string
  first_name: string
  last_name: string
  dni: string
  photo_url: string | null
  grade_level: string
  section: string
  enrollment_year: number
}

export default function CarnetsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [generating, setGenerating] = useState(false)
  const [planError, setPlanError] = useState(false)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/secretario/carnets')
      if (res.status === 403) {
        setPlanError(true)
        return
      }
      const data = await res.json()
      setStudents(data)
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(s => {
    const matchesSearch = !searchQuery || 
      `${s.first_name} ${s.last_name} ${s.dni}`.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGrade = !gradeFilter || s.grade_level === gradeFilter
    return matchesSearch && matchesGrade
  })

  const grades = [...new Set(students.map(s => s.grade_level))].sort()

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredStudents.map(s => s.id))
    }
  }

  const generateCarnets = async () => {
    if (selectedIds.length === 0) return
    setGenerating(true)
    try {
      const res = await fetch('/api/secretario/carnets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_ids: selectedIds })
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'carnets-estudiantiles.pdf'
        a.click()
        window.URL.revokeObjectURL(url)
        setSelectedIds([])
      }
    } catch (error) {
      console.error('Error generating carnets:', error)
    } finally {
      setGenerating(false)
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
            <CreditCard className="w-8 h-8 text-sb-primary" />
          </div>
          <h2 className="text-xl font-bold text-sb-on-surface mb-2">
            Función no disponible
          </h2>
          <p className="text-sb-on-surface/60 mb-6">
            Los carnets digitales están disponibles en el plan Pro o superior.
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
                <CreditCard className="w-5 h-5 text-sb-on-surface" />
              </div>
              Carnets Estudiantiles
            </h1>
            <p className="text-sb-on-surface/60 mt-1">
              Genera carnets PDF para tus alumnos
            </p>
          </div>
          <button
            onClick={generateCarnets}
            disabled={selectedIds.length === 0 || generating}
            className="flex items-center gap-2 px-6 py-3 bg-sb-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            {generating ? 'Generando...' : `Descargar (${selectedIds.length})`}
          </button>
        </div>

        <div className="bg-sb-surface rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-sb-on-surface/40" />
              <input
                type="text"
                placeholder="Buscar por nombre o DNI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-sb-background border border-sb-on-surface/10 rounded-xl text-sb-on-surface placeholder:text-sb-on-surface/40 focus:outline-none focus:ring-2 focus:ring-sb-primary/20 focus:border-sb-primary"
              />
            </div>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="sbf-native-select"
            >
              <option value="">Todos los grados</option>
              {grades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="bg-sb-surface rounded-2xl p-12 text-center">
            <div className="w-12 h-12 border-4 border-sb-primary/20 border-t-sb-primary rounded-full animate-spin mx-auto" />
            <p className="text-sb-on-surface/60 mt-4">Cargando alumnos...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-sb-surface rounded-2xl p-12 text-center">
            <Users className="w-12 h-12 text-sb-on-surface/20 mx-auto mb-4" />
            <p className="text-sb-on-surface/60">No se encontraron alumnos</p>
          </div>
        ) : (
          <div className="bg-sb-surface rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-sb-on-surface/10 flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm text-sb-on-surface/60 hover:text-sb-on-surface"
              >
                {selectedIds.length === filteredStudents.length ? (
                  <CheckSquare className="w-5 h-5 text-sb-primary" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
                Seleccionar todos ({filteredStudents.length})
              </button>
            </div>

            <motion.div
              variants={staggerItem}
              initial="hidden"
              animate="show"
              className="divide-y divide-sb-on-surface/5"
            >
              {filteredStudents.map((student) => (
                <motion.div
                  key={student.id}
                  variants={listItem}
                  onClick={() => toggleSelect(student.id)}
                  className={`flex items-center gap-4 p-4 cursor-pointer transition-colors ${
                    selectedIds.includes(student.id) 
                      ? 'bg-sb-primary/5' 
                      : 'hover:bg-sb-background/50'
                  }`}
                >
                  {selectedIds.includes(student.id) ? (
                    <CheckSquare className="w-5 h-5 text-sb-primary flex-shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-sb-on-surface/30 flex-shrink-0" />
                  )}

                  <div className="w-10 h-10 bg-sb-on-surface/8 rounded-xl flex items-center justify-center flex-shrink-0">
                    {student.photo_url ? (
                      <img 
                        src={student.photo_url} 
                        alt="" 
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                    ) : (
                      <GraduationCap className="w-5 h-5 text-sb-on-surface/60" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sb-on-surface truncate">
                      {student.last_name} {student.first_name}
                    </p>
                    <p className="text-sm text-sb-on-surface/60">
                      DNI: {student.dni || '---'}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-sb-primary/10 text-sb-primary text-sm font-medium rounded-lg">
                      {student.grade_level} {student.section}
                    </span>
                    <p className="text-xs text-sb-on-surface/40 mt-1">
                      {student.enrollment_year}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
