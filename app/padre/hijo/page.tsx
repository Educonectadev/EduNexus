"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { GraduationCap, TrendingUp, UserCheck, Award, BookOpen } from "@/components/ui/proicons"

interface Student {
  id: string
  first_name: string
  last_name: string
  document_number: string
  grade: string
  section: string
  course: string
  average: number
  attendance_pct: number
  academic_condition?: string
  grades: { subject: string; grade: number; term: string }[]
}

const conditionLabels: Record<string, string> = {
  studying: "En curso", promoted: "Promovido", repeating: "Repite", recovery: "Recuperación"
}

const conditionConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  studying: { label: "En curso", color: "text-blue-600", bg: "bg-blue-500/10", dot: "bg-blue-500" },
  promoted: { label: "Promovido", color: "text-emerald-600", bg: "bg-emerald-500/10", dot: "bg-emerald-500" },
  repeating: { label: "Repite", color: "text-rose-600", bg: "bg-rose-500/10", dot: "bg-rose-500" },
  recovery: { label: "Recuperación", color: "text-amber-600", bg: "bg-amber-500/10", dot: "bg-amber-500" },
}

const staggerItem = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }

function getInitials(name: string) { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) }

function getAvatarColor(name: string) {
  const colors = ["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-amber-500", "bg-pink-500", "bg-cyan-500", "bg-rose-500"]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default function HijoPage() {
  const [children, setChildren] = React.useState<Student[]>([])
  const [selected, setSelected] = React.useState<Student | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/padre/hijo")
      .then(r => r.json())
      .then(data => {
        const list = data.children || []
        setChildren(list)
        if (list.length > 0) setSelected(list[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="animate-pulse space-y-5">
          <div className="h-7 w-48 rounded-xl bg-sb-surface-container" />
          <div className="h-28 rounded-2xl bg-sb-surface-container" />
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-sb-surface-container" />)}
          </div>
          <div className="h-64 rounded-2xl bg-sb-surface-container" />
        </div>
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="space-y-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Información del Hijo</h1>
          <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">Datos académicos y progreso</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
          <div className="bg-sb-surface rounded-2xl p-12 text-center">
            <div className="h-14 w-14 rounded-2xl bg-sb-surface-container flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="h-7 w-7 text-sb-on-surface-variant/20" />
            </div>
            <p className="text-sm font-medium text-sb-on-surface-variant/40">No se encontraron hijos vinculados</p>
            <p className="text-xs text-sb-on-surface-variant/30 mt-1">Contacta a la institución para vincular a tu hijo</p>
          </div>
        </motion.div>
      </div>
    )
  }

  const s = selected

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Información del Hijo</h1>
        <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">Datos académicos y progreso</p>
      </motion.div>

      {/* Child selector */}
      {children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {children.map(c => (
            <button key={c.id} onClick={() => setSelected(c)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                s.id === c.id
                  ? 'bg-sb-on-surface text-sb-surface'
                  : 'bg-sb-surface-container text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high'
              }`}>
              {c.first_name} {c.last_name}
            </button>
          ))}
        </div>
      )}

      {/* Student profile card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="bg-sb-surface rounded-2xl p-5 overflow-hidden">
          <div className="flex items-center gap-4">
            <div className={`h-14 w-14 rounded-2xl ${getAvatarColor(s.first_name + s.last_name)} flex items-center justify-center shrink-0`}>
              <span className="text-base font-bold text-white">{getInitials(s.first_name + " " + s.last_name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold text-sb-on-surface">{s.first_name} {s.last_name}</p>
              <p className="text-xs text-sb-on-surface-variant/50 mt-0.5">{s.course} · DNI: {s.document_number}</p>
              {s.academic_condition && conditionConfig[s.academic_condition] && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-medium mt-2 ${conditionConfig[s.academic_condition].bg} ${conditionConfig[s.academic_condition].color}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${conditionConfig[s.academic_condition].dot}`} />
                  {conditionConfig[s.academic_condition].label}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "Promedio", value: s.average?.toString() || "—", icon: TrendingUp, color: "text-sb-on-surface", bg: "bg-sb-on-surface/8" },
          { label: "Asistencia", value: `${s.attendance_pct || 0}%`, icon: UserCheck, color: "text-blue-600", bg: "bg-blue-500/8" },
          ...(s.academic_condition ? [{ label: "Condición", value: conditionLabels[s.academic_condition] || s.academic_condition, icon: Award, color: "text-emerald-600", bg: "bg-emerald-500/8" }] : []),
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <motion.div key={stat.label} variants={staggerItem} className="bg-sb-surface rounded-2xl p-4">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-3 ${stat.bg}`}>
                <Icon className={`h-4.5 w-4.5 ${stat.color}`} />
              </div>
              <p className="text-xl font-bold tracking-tight text-sb-on-surface">{stat.value}</p>
              <p className="text-[11px] text-sb-on-surface-variant/45 mt-0.5">{stat.label}</p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Grades table */}
      {s.grades && s.grades.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <div className="bg-sb-surface rounded-2xl overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">Notas por Materia</p>
            </div>
            <div className="space-y-px">
              {s.grades.map((g, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.03 }}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-sb-surface-container-low/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      g.grade >= 16 ? 'bg-emerald-500/10' : g.grade >= 11 ? 'bg-amber-500/10' : 'bg-red-500/10'
                    }`}>
                      <BookOpen className={`h-3.5 w-3.5 ${
                        g.grade >= 16 ? 'text-emerald-600' : g.grade >= 11 ? 'text-amber-600' : 'text-red-500'
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-sb-on-surface truncate">{g.subject}</p>
                      <p className="text-[10px] text-sb-on-surface-variant/35">{g.term}</p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold shrink-0 ml-2 ${
                    g.grade >= 16 ? 'text-emerald-600' : g.grade >= 11 ? 'text-amber-600' : 'text-red-500'
                  }`}>
                    {g.grade}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Performance bars */}
      {s.grades && s.grades.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <div className="bg-sb-surface rounded-2xl p-5">
            <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-4">Rendimiento General</p>
            <div className="space-y-3">
              {s.grades.map((g, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-sb-on-surface-variant/50 w-24 truncate">{g.subject}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-sb-surface-container overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(g.grade / 20) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.08 }}
                      className={`h-full rounded-full ${
                        g.grade >= 16 ? 'bg-emerald-400' :
                        g.grade >= 11 ? 'bg-amber-400' :
                        'bg-red-400'
                      }`}
                    />
                  </div>
                  <span className="text-xs font-semibold text-sb-on-surface-variant/60 w-8 text-right">{g.grade}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
