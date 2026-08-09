"use client"

import * as React from "react"
import Link from "next/link"
import { GraduationCap, Users, BookOpen, ClipboardList, Calendar, FileText, UserCheck, Building2, TrendingUp, School, BarChart3, Layers, Sparkles, Clock, ArrowRight, BadgeCheck } from "@/components/ui/proicons"
import { motion } from "framer-motion"
import { PrettyTabs } from "@/components/dashboard/pretty-tabs"
import { useToast } from "@/components/ui/sb"

interface Stats {
  students: number; teachers: number; enrollments: number; pending: number
  documents: number; courses: number; parents: number; secretary: number
  horarios: number; activeCourses: number; weekHorarios: { day_of_week: number; count: number }[]
}

interface TrialInfo {
  isExpired: boolean
  remainingBusinessDays: number
  daysLabel: string
}

const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

const tabs = [
  { id: "general", label: "General", icon: BarChart3 },
  { id: "academico", label: "Académico", icon: Layers },
  { id: "horarios", label: "Horarios", icon: Calendar },
]

export default function DirectorDashboard() {
  const { toast } = useToast()
  const [stats, setStats] = React.useState<Stats>({
    students: 0, teachers: 0, enrollments: 0, pending: 0,
    documents: 0, courses: 0, parents: 0, secretary: 0,
    horarios: 0, activeCourses: 0, weekHorarios: [],
  })
  const [loading, setLoading] = React.useState(true)
  const [seeding, setSeeding] = React.useState(false)
  const [demoAccess, setDemoAccess] = React.useState<{ role: string; email: string; password: string }[]>([])
  const [activeTab, setActiveTab] = React.useState("general")
  const [trial, setTrial] = React.useState<{ isDemo: boolean; trialDays: number | null; info: TrialInfo | null }>({ isDemo: false, trialDays: null, info: null })

  const loadTrial = React.useCallback(() => {
    return fetch("/api/auth/institution").then(r => r.json()).then(d => {
      setTrial({ isDemo: !!d.isDemo, trialDays: d.trialDays, info: d.trial || null })
    }).catch(() => {})
  }, [])

  const loadStats = React.useCallback(() => {
    return fetch("/api/director/stats").then(r => r.json()).then(d => setStats(d)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  React.useEffect(() => { loadStats(); loadTrial() }, [loadStats, loadTrial])

  const handleSeed = async () => {
    if (!window.confirm("Esto creará 20 estudiantes, 6 docentes, 6 cursos, matrículas y horarios de ejemplo en esta institución. ¿Continuar?")) return
    setSeeding(true)
    try {
const res = await fetch("/api/director/demo-seed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ students: 20 }) })
      const result = await res.json()
      if (!res.ok) { toast(result.error || "Error al cargar datos", "error"); return }
      toast(`Datos de ejemplo creados: ${result.students} estudiantes, ${result.teachers} docentes, ${result.courses} cursos`, "success")
      setDemoAccess(result.demoAccess || [])
      setLoading(true)
      await loadStats()
    } catch { toast("Error de conexión", "error") } finally { setSeeding(false) }
  }

  const statCards = [
    { label: "Alumnos", value: loading ? "—" : stats.students, icon: GraduationCap, href: "/director/plantel", trend: "+12%" },
    { label: "Docentes", value: loading ? "—" : stats.teachers, icon: Users, href: "/director/personal", trend: "+3%" },
    { label: "Cursos", value: loading ? "—" : (stats.activeCourses || stats.courses), icon: BookOpen, href: "/director/cursos" },
    { label: "Matrículas", value: loading ? "—" : stats.enrollments, icon: ClipboardList, href: "/director/reportes", trend: "+8%" },
    { label: "Horarios", value: loading ? "—" : stats.horarios, icon: Calendar, href: "/director/horarios" },
    { label: "Documentos", value: loading ? "—" : stats.documents, icon: FileText, href: "/director/reportes" },
    { label: "Padres", value: loading ? "—" : stats.parents, icon: UserCheck, href: "/director/plantel", trend: "+5%" },
    { label: "Secretario", value: loading ? "—" : stats.secretary, icon: Building2, href: "/director/plantel" },
  ]

  const academicItems = [
    { label: "Alumnos activos", value: loading ? "—" : stats.students, icon: GraduationCap },
    { label: "Docentes en planilla", value: loading ? "—" : stats.teachers, icon: Users },
    { label: "Cursos activos", value: loading ? "—" : (stats.activeCourses || stats.courses), icon: BookOpen },
    { label: "Matrículas vigentes", value: loading ? "—" : stats.enrollments, icon: ClipboardList },
    { label: "Horarios asignados", value: loading ? "—" : stats.horarios, icon: Calendar },
    { label: "Documentos emitidos", value: loading ? "—" : stats.documents, icon: FileText },
  ]

  const horariosPorDia = dayNames.map((name, i) => {
    const found = stats.weekHorarios?.find(h => h.day_of_week === i + 1)
    return { day: name, count: found?.count || 0 }
  })

  const maxHoras = Math.max(...horariosPorDia.map(h => h.count), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-sb-on-surface">Panel de Director</h1>
          <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">Vista general de tu institución</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
{/* Trial / plan banner */}
      {trial.info && !trial.info.isExpired && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Link
            href="/director/configuracion"
            className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl p-4 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <BadgeCheck className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-sb-on-surface">
                  {trial.isDemo ? "Cuenta Demo · Prueba de 15 días" : "Prueba gratuita · 20 días"}
                </p>
                <p className="text-[12px] text-sb-on-surface-variant/60 mt-0.5">
                  {trial.info.remainingBusinessDays} de {trial.trialDays || 20} día(s) hábil(es) restantes · contrata un plan cuando quieras
                </p>
              </div>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full">
              <Clock className="h-3 w-3" /> {trial.info.remainingBusinessDays}/{trial.trialDays || 20} días
            </span>
          </Link>
        </motion.div>
      )}

      {!loading && stats.students === 0 && stats.teachers === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium bg-amber-500/10 border border-amber-500/25 text-amber-600 hover:bg-amber-500/15 transition-colors disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {seeding ? "Cargando datos..." : "Cargar datos de ejemplo"}
            </button>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sb-on-surface/[0.04]">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-sb-on-surface-variant font-medium">
              {new Date().toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>
      </motion.div>

      {!loading && stats.students === 0 && stats.teachers === 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-medium text-sb-on-surface">Tu institución aún no tiene datos</p>
            <p className="text-[12px] text-sb-on-surface-variant/60 mt-0.5">Pulsa "Cargar datos de ejemplo" para ver el panel en acción, o agrega tu información desde los módulos de Personal, Matrículas y Cursos.</p>
          </div>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="shrink-0 px-4 py-2 rounded-xl bg-sb-on-surface text-sb-surface text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {seeding ? "Cargando..." : "Cargar datos de ejemplo"}
          </button>
        </motion.div>
      )}

      {demoAccess.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-sb-on-surface">Usuarios demo creados (contraseña: demo1234)</p>
              <p className="text-[11px] text-sb-on-surface-variant/60">Entra a estos portales para ver la app completa en acción</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="text-sb-on-surface-variant/50">
                  <th className="py-1 pr-3 font-medium">Portal</th>
                  <th className="py-1 pr-3 font-medium">Email</th>
                  <th className="py-1 font-medium">Contraseña</th>
                </tr>
              </thead>
              <tbody>
                {demoAccess.map((acc, i) => (
                  <tr key={i} className="border-t border-sb-outline-variant/8">
                    <td className="py-2 pr-3 font-medium text-sb-on-surface capitalize">{acc.role}</td>
                    <td className="py-2 pr-3 font-mono text-sb-on-surface/80">{acc.email}</td>
                    <td className="py-2 font-mono text-sb-on-surface/80">demo1234</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => setDemoAccess([])}
            className="mt-3 text-[11px] text-sb-on-surface-variant/50 hover:text-sb-on-surface-variant transition-colors underline underline-offset-2"
          >
            Ocultar credenciales
          </button>
        </motion.div>
      )}

      {/* Hero Stats */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Alumnos", value: loading ? "—" : stats.students, icon: GraduationCap, color: "text-sb-primary", bg: "bg-sb-primary/8" },
          { label: "Docentes", value: loading ? "—" : stats.teachers, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/8" },
          { label: "Cursos", value: loading ? "—" : (stats.activeCourses || stats.courses), icon: BookOpen, color: "text-amber-500", bg: "bg-amber-500/8" },
          { label: "Matrículas", value: loading ? "—" : stats.enrollments, icon: ClipboardList, color: "text-blue-500", bg: "bg-blue-500/8" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 + i * 0.04 }}>
            <a href={statCards.find(s => s.label === stat.label)?.href || "#"} className="block">
              <div className="bg-sb-surface rounded-2xl p-5 border border-sb-outline-variant/8 hover:border-sb-outline-variant/15 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold tracking-tight text-sb-on-surface">{stat.value}</p>
                <p className="text-[11px] text-sb-on-surface-variant/50 mt-1">{stat.label}</p>
              </div>
            </a>
          </motion.div>
        ))}
      </motion.div>

      {/* Secondary Stats */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.slice(4).map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + i * 0.04 }}>
            <a href={stat.href} className="block">
              <div className="bg-sb-surface rounded-2xl p-4 border border-sb-outline-variant/8 hover:border-sb-outline-variant/15 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-sb-surface-container-high flex items-center justify-center shrink-0">
                    <stat.icon className="h-4 w-4 text-sb-on-surface-variant/60 group-hover:text-sb-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-lg font-bold tracking-tight text-sb-on-surface">{stat.value}</p>
                    <p className="text-[10px] text-sb-on-surface-variant/40">{stat.label}</p>
                  </div>
                </div>
              </div>
            </a>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <PrettyTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} size="small" />
      </motion.div>

      {/* Tab Content */}
      {activeTab === "general" && (
        <motion.div key="general"
          initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.2, ease: [0.37, 0.35, 0, 1] }}
          className="grid gap-3 md:grid-cols-2">
          {/* Distribution */}
          <div className="bg-sb-surface rounded-2xl p-6 border border-sb-outline-variant/8">
            <h3 className="text-[11px] font-semibold text-sb-on-surface-variant/50 uppercase tracking-widest mb-5">Distribución</h3>
            <div className="space-y-5">
              {[
                { label: "Alumnos", value: stats.students, total: stats.students + stats.teachers + stats.parents, color: "bg-sb-primary" },
                { label: "Docentes", value: stats.teachers, total: stats.students + stats.teachers + stats.parents, color: "bg-emerald-400" },
                { label: "Padres", value: stats.parents, total: stats.students + stats.teachers + stats.parents, color: "bg-amber-400" },
              ].map((item) => {
                const pct = item.total > 0 ? (item.value / item.total) * 100 : 0
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-sb-on-surface/70">{item.label}</span>
                      <span className="text-sm font-bold text-sb-on-surface">{loading ? "—" : item.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-sb-surface-container-high overflow-hidden">
                      <div className={`h-full rounded-full ${item.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Summary */}
          <div className="bg-sb-surface rounded-2xl p-6 border border-sb-outline-variant/8">
            <h3 className="text-[11px] font-semibold text-sb-on-surface-variant/50 uppercase tracking-widest mb-5">Resumen Rápido</h3>
            <div className="space-y-1">
              {[
                { label: "Matrículas", value: stats.enrollments, icon: ClipboardList, color: "text-blue-500" },
                { label: "Cursos Activos", value: stats.activeCourses || stats.courses, icon: BookOpen, color: "text-amber-500" },
                { label: "Documentos", value: stats.documents, icon: FileText, color: "text-emerald-500" },
                { label: "Horarios", value: stats.horarios, icon: Calendar, color: "text-purple-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-sb-surface-container-high/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-sb-surface-container-high flex items-center justify-center">
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <span className="text-sm text-sb-on-surface/70">{item.label}</span>
                  </div>
                  <span className="text-lg font-bold text-sb-on-surface">{loading ? "—" : item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "academico" && (
        <motion.div key="academico"
          initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.2, ease: [0.37, 0.35, 0, 1] }}>
          <div className="bg-sb-surface rounded-2xl overflow-hidden border border-sb-outline-variant/8">
            <div className="px-6 pt-5 pb-3">
              <h3 className="text-[11px] font-semibold text-sb-on-surface-variant/50 uppercase tracking-widest">Resumen Académico</h3>
            </div>
            <div className="divide-y divide-sb-outline-variant/8">
              {academicItems.map((item, i) => (
                <motion.div key={item.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-sb-surface-container-high/40 transition-colors">
                  <item.icon className="h-4 w-4 text-sb-on-surface-variant/40 shrink-0" />
                  <span className="text-sm text-sb-on-surface/70 flex-1">{item.label}</span>
                  <span className="text-lg font-bold text-sb-on-surface">{item.value}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "horarios" && (
        <motion.div key="horarios"
          initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.2, ease: [0.37, 0.35, 0, 1] }}>
          <div className="bg-sb-surface rounded-2xl overflow-hidden border border-sb-outline-variant/8">
            <div className="px-6 pt-5 pb-3">
              <h3 className="text-[11px] font-semibold text-sb-on-surface-variant/50 uppercase tracking-widest">Horarios por Día</h3>
            </div>
            <div className="px-6 pb-6 space-y-3">
              {horariosPorDia.map((item, i) => {
                const pct = (item.count / maxHoras) * 100
                return (
                  <motion.div key={item.day} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4">
                    <span className="text-xs text-sb-on-surface/50 w-20 shrink-0 font-medium">{item.day}</span>
                    <div className="flex-1 h-3 rounded-full bg-sb-surface-container-high overflow-hidden">
                      <div className="h-full rounded-full bg-sb-primary transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-bold text-sb-on-surface w-8 text-right">{item.count}</span>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
