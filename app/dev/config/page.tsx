"use client"

import * as React from "react"
import { Settings, Server, Database, Shield, Globe, Code2, Zap, Palette, Lock, Link2 } from "@/components/ui/proicons"
import { motion } from "framer-motion"

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
}

interface ConfigItem {
  key: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  category: string
}

interface DbInfo {
  ok: boolean
  connection?: {
    database: string
    host: string
    port: string
    user: string
    socket: string | null
    ssl: boolean
    engine: string
    poolLimit: number
  }
}

export default function DevConfigPage() {
  const [config, setConfig] = React.useState<ConfigItem[]>([])
  const [dbReady, setDbReady] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/dev/db-info")
      .then(r => (r.ok ? r.json() : null))
      .then((d: DbInfo | null) => {
        const conn = d?.connection
        const dbItems: ConfigItem[] = conn ? [
          { key: "Database", value: conn.database, icon: Database, category: "Base de Datos" },
          { key: "DB Host", value: `${conn.host}:${conn.port}`, icon: Server, category: "Base de Datos" },
          { key: "DB Socket", value: conn.socket || "TCP/IP (remoto)", icon: Link2, category: "Base de Datos" },
          { key: "DB User", value: conn.user, icon: Server, category: "Base de Datos" },
          { key: "Motor", value: conn.engine, icon: Database, category: "Base de Datos" },
          { key: "SSL", value: conn.ssl ? "Activado" : "Desactivado", icon: Lock, category: "Base de Datos" },
          { key: "Pool", value: String(conn.poolLimit), icon: Server, category: "Base de Datos" },
        ] : []
        if (conn) setDbReady(true)
        setConfig([
          { key: "App Name", value: "Educonecta", icon: Globe, category: "General" },
          { key: "Version", value: "1.1.1", icon: Zap, category: "General" },
          { key: "Environment", value: process.env.NODE_ENV || "development", icon: Server, category: "General" },
          ...dbItems,
          { key: "Auth", value: "JWT (jose)", icon: Shield, category: "Seguridad" },
          { key: "Frontend", value: "Next.js 16", icon: Code2, category: "Stack" },
          { key: "UI", value: "shadcn/ui + TailwindCSS", icon: Palette, category: "Stack" },
          { key: "State", value: "Zustand", icon: Code2, category: "Stack" },
          { key: "Animations", value: "Framer Motion", icon: Zap, category: "Stack" },
        ])
      })
      .catch(() => {
        setConfig([
          { key: "App Name", value: "Educonecta", icon: Globe, category: "General" },
          { key: "Version", value: "1.1.1", icon: Zap, category: "General" },
          { key: "Environment", value: process.env.NODE_ENV || "development", icon: Server, category: "General" },
          { key: "Database", value: "no disponible", icon: Database, category: "Base de Datos" },
          { key: "Auth", value: "JWT (jose)", icon: Shield, category: "Seguridad" },
          { key: "Frontend", value: "Next.js 16", icon: Code2, category: "Stack" },
          { key: "UI", value: "shadcn/ui + TailwindCSS", icon: Palette, category: "Stack" },
          { key: "State", value: "Zustand", icon: Code2, category: "Stack" },
          { key: "Animations", value: "Framer Motion", icon: Zap, category: "Stack" },
        ])
      })
  }, [])

  const categories = [...new Set(config.map(c => c.category))]

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full space-y-8 py-2">
      <motion.div variants={fadeUp}>
        <h2 className="text-[22px] md:text-[24px] font-bold tracking-tight text-sb-on-surface">Configuración</h2>
        <p className="text-[13px] text-sb-on-surface/70 mt-1">Información del sistema y configuración actual</p>
      </motion.div>

      {categories.map((cat) => (
        <motion.div key={cat} variants={fadeUp}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-sb-on-surface/60 uppercase tracking-widest">{cat}</p>
            {cat === "Base de Datos" && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${dbReady ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                {dbReady ? "datos reales" : "cargando..."}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {config.filter(c => c.category === cat).map((item, i) => (
              <motion.div
                key={item.key}
                variants={fadeUp}
                whileHover={{ y: -1, transition: { duration: 0.15 } }}
                className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-4 hover:border-sb-outline-variant/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-sb-surface-container-high flex items-center justify-center group-hover:bg-sb-primary/10 transition-colors">
                    <item.icon className="h-5 w-5 text-sb-on-surface/50 group-hover:text-sb-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-sb-on-surface/70">{item.key}</p>
                    <p className="text-[14px] font-medium text-sb-on-surface font-mono truncate">{item.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}