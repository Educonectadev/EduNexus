"use client"

import * as React from "react"
import {
  Building2, Users, GraduationCap, UserCheck, BookOpen,
  Activity, RefreshCw, MapPin, Clock, Check, Circle,
  ChevronDown, ChevronRight, Sparkles, Link2, UserPlus,
} from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import "@/styles/animations.css"

interface Institution {
  id: string
  code: string
  name: string
  type: string
  level: string
  district: string
  province: string
  department: string
  status: string
  created_at: string
  total_students: number
  total_teachers: number
  plan_name?: string
  has_director: boolean
  has_secretario: boolean
  has_docentes: boolean
  docente_count: number
  has_padres: boolean
  padre_count: number
  has_estudiantes: boolean
  estudiante_count: number
  has_links: boolean
  linked_parents: number
  linked_students: number
}

interface RecentUser {
  id: string
  name: string
  role: string
  created_at: string
  institution_name: string | null
}

interface Stats {
  institutions: number
  users: number
  directors: number
  secretarios: number
  docentes: number
  students: number
}

const SEQUENCE_STEPS = [
  { key: "created", label: "Colegio", sublabel: "Creado" },
  { key: "director", label: "Director", sublabel: "Asignado" },
  { key: "secretario", label: "Secretario", sublabel: "Asignado" },
  { key: "docentes", label: "Docentes", sublabel: "Registrados" },
  { key: "padres", label: "Padres", sublabel: "Registrados" },
  { key: "estudiantes", label: "Alumnos", sublabel: "Matriculados" },
  { key: "links", label: "Vínculos", sublabel: "Padre↔Hijo" },
]

function getStepStatus(inst: Institution): boolean[] {
  return [
    true,
    inst.has_director,
    inst.has_secretario,
    inst.has_docentes,
    inst.has_padres,
    inst.has_estudiantes,
    inst.has_links,
  ]
}

function getStepCount(inst: Institution): (number | null)[] {
  return [null, null, null, inst.docente_count || 0, inst.padre_count || 0, inst.estudiante_count || 0, null]
}

function getCompletedSteps(status: boolean[]): number {
  return status.filter(Boolean).length
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.08 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
}

function PipelineHeader() {
  return (
    <div className="flex items-center gap-0 w-full min-w-[560px]">
      {SEQUENCE_STEPS.map((step, i) => (
        <React.Fragment key={step.key}>
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="h-8 w-8 rounded-full bg-sb-surface-container-high border border-sb-outline-variant/20 flex items-center justify-center">
              <span className="text-[11px] font-bold text-sb-on-surface/60">{i + 1}</span>
            </div>
            <span className="text-[10px] font-medium text-sb-on-surface/50 text-center leading-tight">{step.label}</span>
            <span className="text-[9px] text-sb-on-surface/30">{step.sublabel}</span>
          </div>
          {i < SEQUENCE_STEPS.length - 1 && (
            <div className="flex-1 h-px bg-sb-outline-variant/20 mx-1 mb-6" />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

function InstitutionRow({ inst, index }: { inst: Institution; index: number }) {
  const [expanded, setExpanded] = React.useState(false)
  const steps = getStepStatus(inst)
  const counts = getStepCount(inst)
  const completed = getCompletedSteps(steps)
  const progress = Math.round((completed / 7) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="border border-sb-outline-variant/8 rounded-xl overflow-hidden hover:border-sb-outline-variant/15 transition-colors"
    >
      {/* Row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-sb-surface hover:bg-sb-surface-container-low/30 transition-colors text-left"
      >
        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-sb-on-surface truncate">{inst.name}</p>
          <p className="text-[10px] text-sb-on-surface/40 font-mono">{inst.code}</p>
        </div>

        {/* Steps mini indicators */}
        <div className="hidden sm:flex items-center gap-1.5">
          {steps.map((done, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`h-4 w-4 rounded-full flex items-center justify-center ${
                done
                  ? "bg-emerald-500/15"
                  : "bg-sb-surface-container-high"
              }`}>
                {done ? (
                  <Check className="h-2.5 w-2.5 text-emerald-500" />
                ) : (
                  <Circle className="h-2.5 w-2.5 text-sb-on-surface/15" />
                )}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-3 h-px ${done ? "bg-emerald-500/30" : "bg-sb-outline-variant/15"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[11px] font-bold ${
            progress === 100 ? "text-emerald-500" : progress >= 60 ? "text-amber-500" : "text-sb-on-surface/40"
          }`}>
            {completed}/7
          </span>
          <div className="w-16 h-1.5 bg-sb-surface-container-high rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className={`h-full rounded-full ${
                progress === 100
                  ? "bg-emerald-500"
                  : progress >= 60
                    ? "bg-amber-500"
                    : "bg-sb-primary"
              }`}
            />
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-sb-on-surface/30 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Expanded steps */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 bg-sb-surface-container-low/30 border-t border-sb-outline-variant/8">
              <div className="overflow-x-auto">
                <div className="flex items-center gap-0 min-w-[520px] py-2">
                  {SEQUENCE_STEPS.map((step, i) => {
                    const done = steps[i]
                    const count = counts[i]
                    return (
                      <React.Fragment key={step.key}>
                        <div className="flex flex-col items-center gap-1.5 shrink-0 min-w-[56px]">
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center transition-all ${
                            done
                              ? "bg-emerald-500 text-white"
                              : "bg-sb-surface-container-high text-sb-on-surface/20"
                          }`}>
                            {done ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <span className="text-[10px] font-bold">{i + 1}</span>
                            )}
                          </div>
                          <span className={`text-[10px] font-medium ${done ? "text-emerald-500" : "text-sb-on-surface/30"}`}>
                            {step.label}
                          </span>
                          {count !== null && count > 0 && (
                            <span className="text-[9px] text-sb-on-surface/40">{count}</span>
                          )}
                        </div>
                        {i < SEQUENCE_STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-0.5 mb-5 rounded-full ${
                            done && steps[i + 1]
                              ? "bg-emerald-500/40"
                              : done
                                ? "bg-gradient-to-r from-emerald-500/40 to-sb-surface-container-high"
                                : "bg-sb-surface-container-high"
                          }`} />
                        )}
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>
              {/* Extra info */}
              <div className="flex items-center gap-4 mt-3 pt-2 border-t border-sb-outline-variant/8">
                {inst.district && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-sb-on-surface/25" />
                    <span className="text-[10px] text-sb-on-surface/40">{inst.district}</span>
                  </div>
                )}
                {inst.plan_name && (
                  <span className="text-[10px] font-medium text-sb-primary/60 bg-sb-primary/5 px-1.5 py-0.5 rounded">{inst.plan_name}</span>
                )}
                <span className={`text-[10px] font-medium ${inst.status === "active" ? "text-emerald-500" : "text-sb-on-surface/30"}`}>
                  {inst.status}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function DevAuditPage() {
  const [institutions, setInstitutions] = React.useState<Institution[]>([])
  const [stats, setStats] = React.useState<Stats>({ institutions: 0, users: 0, directors: 0, secretarios: 0, docentes: 0, students: 0 })
  const [recentUsers, setRecentUsers] = React.useState<RecentUser[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isAutoRefresh, setIsAutoRefresh] = React.useState(true)
  const [lastUpdate, setLastUpdate] = React.useState<Date>(new Date())

  const fetchData = React.useCallback(async () => {
    try {
      const res = await fetch("/api/dev/audit/institutions")
      if (res.ok) {
        const data = await res.json()
        setInstitutions(data.institutions || [])
        setStats(data.stats || {})
        setRecentUsers(data.recentUsers || [])
        setLastUpdate(new Date())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { fetchData() }, [fetchData])

  React.useEffect(() => {
    if (!isAutoRefresh) return
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [isAutoRefresh, fetchData])

  // Summary stats
  const completedAll = institutions.filter(i => {
    const s = getStepStatus(i)
    return s.every(Boolean)
  }).length
  const withDirector = institutions.filter(i => i.has_director).length
  const withPadres = institutions.filter(i => i.has_padres).length
  const withLinks = institutions.filter(i => i.has_links).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sb-primary/20 border-t-sb-primary rounded-full animate-spin" />
          <p className="text-[13px] text-sb-on-surface/50">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full space-y-5 py-2">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight text-sb-on-surface">Auditoría</h2>
          <p className="text-[14px] text-sb-on-surface/60 mt-1">Secuencia de creación de colegios</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all ${
              isAutoRefresh
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                : "bg-sb-surface-container-high text-sb-on-surface/50 border border-sb-outline-variant/15"
            }`}
          >
            <div className={`h-1.5 w-1.5 rounded-full ${isAutoRefresh ? "bg-emerald-500 animate-pulse" : "bg-sb-on-surface/30"}`} />
            {isAutoRefresh ? "Live" : "Paused"}
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sb-surface-container-high border border-sb-outline-variant/15 text-[12px] text-sb-on-surface/60 hover:text-sb-on-surface transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Colegios", value: stats.institutions, icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Con Director", value: withDirector, icon: UserCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Con Padres", value: withPadres, icon: Users, color: "text-violet-500", bg: "bg-violet-500/10" },
          { label: "Vínculos Hechos", value: withLinks, icon: Link2, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Secuencia Completa", value: completedAll, icon: Sparkles, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            variants={fadeUp}
            className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-4 flex items-center gap-3"
          >
            <div className={`h-9 w-9 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[20px] font-bold text-sb-on-surface leading-none">{stat.value}</p>
              <p className="text-[10px] text-sb-on-surface/45 mt-0.5">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Pipeline Legend */}
      <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-sb-on-surface/50">Secuencia de Creación</span>
          <span className="text-[10px] text-sb-on-surface/30">{lastUpdate.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div className="overflow-x-auto">
          <PipelineHeader />
        </div>
      </motion.div>

      {/* Institutions List */}
      <motion.div variants={fadeUp} className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[12px] font-medium text-sb-on-surface/50">Colegios ({institutions.length})</span>
        </div>
        {institutions.length === 0 ? (
          <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 py-12 text-center">
            <Building2 className="h-10 w-10 text-sb-on-surface/10 mx-auto mb-2" />
            <p className="text-[13px] text-sb-on-surface/40">Sin colegios registrados</p>
          </div>
        ) : (
          institutions.map((inst, i) => (
            <InstitutionRow key={inst.id} inst={inst} index={i} />
          ))
        )}
      </motion.div>
    </motion.div>
  )
}
