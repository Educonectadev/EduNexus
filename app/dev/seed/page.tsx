"use client"

import * as React from "react"
import { Terminal, Play, CheckCircle, AlertCircle, Database, Zap } from "@/components/ui/proicons"
import { motion } from "framer-motion"

interface SeedResult {
  success: boolean
  message: string
  data?: any
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function DevSeedPage() {
  const [loading, setLoading] = React.useState<string | null>(null)
  const [results, setResults] = React.useState<Record<string, SeedResult>>({})
  const [institutionCount, setInstitutionCount] = React.useState(3)
  const [userCount, setUserCount] = React.useState(5)
  const [studentCount, setStudentCount] = React.useState(20)

  const seeds = [
    {
      id: "institutions",
      title: "Instituciones de Prueba",
      description: "Crea 3 colegios de ejemplo en Lima",
      action: "seed-institutions",
      icon: Database,
    },
    {
      id: "users",
      title: "Usuarios de Prueba",
      description: "Crea un usuario por cada rol (Director, Secretario, Docente, Padre)",
      action: "seed-users",
      icon: Terminal,
    },
    {
      id: "all",
      title: "Seed Completo",
      description: "Ejecuta todos los seeds en orden",
      action: "seed-all",
      icon: Zap,
    },
  ]

  const runSeed = async (action: string, seedId: string) => {
    setLoading(seedId)
    try {
      const res = await fetch("/api/dev/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, institutionCount, userCount, studentCount }),
      })
      const data = await res.json()
      setResults(prev => ({ ...prev, [seedId]: data }))
    } catch (e: any) {
      setResults(prev => ({ ...prev, [seedId]: { success: false, message: e.message } }))
    } finally {
      setLoading(null)
    }
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full space-y-8 py-2">
      <motion.div variants={fadeUp}>
        <h2 className="text-[26px] font-bold tracking-tight text-sb-on-surface">Seed de Prueba</h2>
        <p className="text-[14px] text-sb-on-surface/60 mt-1">Genera datos de prueba para desarrollar y probar</p>
      </motion.div>

      {/* Config */}
      <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-9 w-9 rounded-xl bg-sb-surface-container-high flex items-center justify-center">
            <Database className="h-4 w-4 text-sb-on-surface/50" />
          </div>
          <p className="text-[14px] font-medium text-sb-on-surface/80">Configuración del Seed</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Instituciones", value: institutionCount, set: setInstitutionCount, min: 1, max: 10 },
            { label: "Usuarios por institución", value: userCount, set: setUserCount, min: 1, max: 20 },
            { label: "Estudiantes por institución", value: studentCount, set: setStudentCount, min: 1, max: 100 },
          ].map((field) => (
            <div key={field.label} className="space-y-2">
              <label className="text-[11px] text-sb-on-surface/50 uppercase tracking-wider">{field.label}</label>
              <input
                type="number"
                min={field.min}
                max={field.max}
                value={field.value}
                onChange={(e) => field.set(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl bg-sb-surface-container-high border border-sb-outline-variant/10 text-[14px] text-sb-on-surface focus:outline-none focus:ring-2 focus:ring-sb-primary/20 transition-all font-mono"
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Seed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {seeds.map((seed, i) => {
          const result = results[seed.id]
          return (
            <motion.div
              key={seed.id}
              variants={fadeUp}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-5 flex flex-col hover:border-sb-outline-variant/20 transition-all"
            >
              <div className="flex-1">
                <div className="h-11 w-11 rounded-xl bg-sb-surface-container-high flex items-center justify-center mb-4">
                  <seed.icon className="h-5 w-5 text-sb-on-surface/40" />
                </div>
                <h3 className="text-[15px] font-semibold text-sb-on-surface">{seed.title}</h3>
                <p className="text-[13px] text-sb-on-surface/50 mt-1 leading-relaxed">{seed.description}</p>
              </div>

              {result && (
                <div className={`mt-4 p-3 rounded-xl text-[13px] ${result.success ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"}`}>
                  <div className="flex items-start gap-2">
                    {result.success ? <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                    <span className="font-mono text-[12px]">{result.message}</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => runSeed(seed.action, seed.id)}
                disabled={loading !== null}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-sb-on-surface text-white text-[13px] font-medium hover:bg-sb-on-surface/90 transition-all disabled:opacity-50 shadow-lg shadow-sb-on-surface/10"
              >
                {loading === seed.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Ejecutando...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Ejecutar Seed
                  </>
                )}
              </button>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
