"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { SbBtn } from "@/components/ui/sb"
import {
  Database, Download, Upload, RefreshCw, Clock, Server,
  HardDrive, Shield, CheckCircle2, AlertCircle, ChevronDown,
  Trash2, Play, Pause, FileArchive, CloudCog, Activity
} from "@/components/ui/proicons"

interface BackupEntry {
  id: string
  name: string
  type: "full" | "incremental" | "schema" | "data"
  date: string
  timestamp: Date
  size: string
  sizeBytes: number
  status: "completed" | "running" | "failed" | "scheduled"
  tables: number
  rows: number
}

const backupTypes: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  full: { label: "Completo", color: "text-violet-500", bg: "bg-violet-500/10", icon: Database },
  incremental: { label: "Incremental", color: "text-blue-500", bg: "bg-blue-500/10", icon: HardDrive },
  schema: { label: "Schema", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: Server },
  data: { label: "Datos", color: "text-amber-500", bg: "bg-amber-500/10", icon: FileArchive },
}

const mockBackups: BackupEntry[] = [
  { id: "1", name: "Backup Completo Nocturno", type: "full", date: "2026-01-15 02:00:00", timestamp: new Date("2026-01-15T02:00:00"), size: "2.4 GB", sizeBytes: 2576980377, status: "completed", tables: 34, rows: 847293 },
  { id: "2", name: "Backup Incremental", type: "incremental", date: "2026-01-14 02:00:00", timestamp: new Date("2026-01-14T02:00:00"), size: "156 MB", sizeBytes: 163577856, status: "completed", tables: 12, rows: 23847 },
  { id: "3", name: "Schema Backup", type: "schema", date: "2026-01-13 14:30:00", timestamp: new Date("2026-01-13T14:30:00"), size: "890 KB", sizeBytes: 911360, status: "completed", tables: 34, rows: 0 },
  { id: "4", name: "Backup de Datos", type: "data", date: "2026-01-13 02:00:00", timestamp: new Date("2026-01-13T02:00:00"), size: "1.8 GB", sizeBytes: 1932735283, status: "completed", tables: 28, rows: 654321 },
  { id: "5", name: "Backup Completo Nocturno", type: "full", date: "2026-01-12 02:00:00", timestamp: new Date("2026-01-12T02:00:00"), size: "2.3 GB", sizeBytes: 2469606195, status: "completed", tables: 34, rows: 812456 },
  { id: "6", name: "Backup Incremental", type: "incremental", date: "2026-01-11 02:00:00", timestamp: new Date("2026-01-11T02:00:00"), size: "142 MB", sizeBytes: 148897792, status: "completed", tables: 8, rows: 19234 },
  { id: "7", name: "Backup Completo Nocturno", type: "full", date: "2026-01-10 02:00:00", timestamp: new Date("2026-01-10T02:00:00"), size: "2.2 GB", sizeBytes: 2362232012, status: "completed", tables: 34, rows: 789012 },
  { id: "8", name: "Schema Backup", type: "schema", date: "2026-01-09 16:00:00", timestamp: new Date("2026-01-09T16:00:00"), size: "890 KB", sizeBytes: 911360, status: "completed", tables: 34, rows: 0 },
]

export default function BackupsPage() {
  const [backups, setBackups] = React.useState<BackupEntry[]>(mockBackups)
  const [isRunning, setIsRunning] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [selectedType, setSelectedType] = React.useState<string>("")
  const [showSchedule, setShowSchedule] = React.useState(false)

  const timeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "ahora"
    if (mins < 60) return `hace ${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `hace ${hrs}h`
    return `hace ${Math.floor(hrs / 24)}d`
  }

  const totalSizeBytes = backups.reduce((s, b) => s + b.sizeBytes, 0)
  const totalSizeGB = (totalSizeBytes / (1024 * 1024 * 1024)).toFixed(1)
  const completedCount = backups.filter(b => b.status === "completed").length

  const handleCreateBackup = () => {
    if (isRunning) return
    setIsRunning(true)
    setProgress(0)
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsRunning(false)
          const newBackup: BackupEntry = {
            id: `new-${Date.now()}`,
            name: "Backup Manual",
            type: "full",
            date: new Date().toISOString().slice(0, 19).replace("T", " "),
            timestamp: new Date(),
            size: "2.4 GB",
            sizeBytes: 2576980377,
            status: "completed",
            tables: 34,
            rows: 847293,
          }
          setBackups(prev => [newBackup, ...prev])
          return 0
        }
        return prev + Math.random() * 8 + 2
      })
    }, 200)
  }

  const filteredBackups = selectedType
    ? backups.filter(b => b.type === selectedType)
    : backups

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Backups</h1>
          <p className="text-sm text-sb-on-surface-variant/50 mt-1">Gestion de copias de seguridad de la plataforma</p>
        </div>
        <div className="flex items-center gap-2">
          <SbBtn variant="outlined" size="sm" rounded onClick={() => setShowSchedule(!showSchedule)} className="h-9 px-4">
            <CloudCog className="h-3.5 w-3.5" />
            Programar
          </SbBtn>
          <SbBtn variant="filled" size="sm" rounded onClick={handleCreateBackup} disabled={isRunning} className="h-9 px-4">
            {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isRunning ? "Creando..." : "Crear Backup"}
          </SbBtn>
        </div>
      </motion.div>

      {/* Progress Bar */}
      <AnimatePresence>
        {isRunning && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="bg-sb-surface rounded-2xl p-4 border border-sb-outline-variant/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-violet-500 animate-pulse" />
                  <span className="text-xs font-semibold text-sb-on-surface">Backup en progreso...</span>
                </div>
                <span className="text-xs font-bold text-violet-500">{Math.min(100, Math.round(progress))}%</span>
              </div>
              <div className="h-2 bg-sb-surface-container/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, progress)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Ultimo Backup", value: timeAgo(backups[0]?.timestamp || new Date()), icon: Clock, color: "text-violet-500", bg: "bg-violet-500/8" },
          { label: "Tamano Total", value: `${totalSizeGB} GB`, icon: HardDrive, color: "text-blue-500", bg: "bg-blue-500/8" },
          { label: "Backups Exitosos", value: completedCount, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/8" },
          { label: "Proximo Programado", value: "En 18h", icon: Shield, color: "text-amber-500", bg: "bg-amber-500/8" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.03 }}
            className="bg-sb-surface rounded-2xl p-4 border border-sb-outline-variant/10">
            <div className={`h-8 w-8 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-sb-on-surface">{stat.value}</p>
            <p className="text-[11px] text-sb-on-surface-variant/40 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Backup List */}
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-sb-surface rounded-2xl p-5 border border-sb-outline-variant/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-sb-on-surface-variant/40" />
                <h3 className="text-sm font-semibold text-sb-on-surface">Historial de Backups</h3>
              </div>
              <div className="flex items-center gap-1.5">
                {Object.entries(backupTypes).map(([key, bt]) => (
                  <button key={key} onClick={() => setSelectedType(selectedType === key ? "" : key)}
                    className={`text-[10px] font-medium px-2 py-1 rounded-lg transition-all ${selectedType === key ? `${bt.bg} ${bt.color}` : "text-sb-on-surface-variant/35 hover:bg-sb-surface-container/30"}`}>
                    {bt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {filteredBackups.map((backup, i) => {
                const bt = backupTypes[backup.type]
                const Icon = bt.icon
                return (
                  <motion.div key={backup.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.03 }}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-sb-surface-container/30 transition-colors group">
                    <div className={`h-10 w-10 rounded-xl ${bt.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-4 w-4 ${bt.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-sb-on-surface truncate">{backup.name}</p>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${bt.bg} ${bt.color}`}>
                          {bt.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-sb-on-surface-variant/35">{backup.size}</span>
                        {backup.rows > 0 && (
                          <>
                            <span className="text-[10px] text-sb-on-surface-variant/20">·</span>
                            <span className="text-[10px] text-sb-on-surface-variant/35">{backup.rows.toLocaleString()} registros</span>
                          </>
                        )}
                        <span className="text-[10px] text-sb-on-surface-variant/20">·</span>
                        <span className="text-[10px] text-sb-on-surface-variant/35">{timeAgo(backup.timestamp)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`h-2 w-2 rounded-full ${backup.status === "completed" ? "bg-emerald-500" : backup.status === "running" ? "bg-amber-500 animate-pulse" : "bg-red-500"}`} />
                      <button className="h-8 w-8 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-sb-surface-container transition-all">
                        <Download className="h-3.5 w-3.5 text-sb-on-surface-variant/50" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* Right: Info + Schedule */}
        <div className="space-y-5">
          {/* Database Info */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="bg-sb-surface rounded-2xl p-5 border border-sb-outline-variant/10">
            <div className="flex items-center gap-2 mb-4">
              <Server className="h-4 w-4 text-sb-on-surface-variant/40" />
              <h3 className="text-sm font-semibold text-sb-on-surface">Base de Datos</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl p-4 border border-blue-500/15">
                <p className="text-[11px] text-blue-500/70 mb-1">Motor de BD</p>
                <p className="text-lg font-bold text-sb-on-surface">MySQL 8.0</p>
                <p className="text-[10px] text-sb-on-surface-variant/40 mt-1">educonecta</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-sb-surface-container/30 rounded-2xl p-3">
                  <p className="text-[10px] text-sb-on-surface-variant/40 mb-1">Tablas</p>
                  <p className="text-lg font-bold text-sb-on-surface">34</p>
                </div>
                <div className="bg-sb-surface-container/30 rounded-2xl p-3">
                  <p className="text-[10px] text-sb-on-surface-variant/40 mb-1">Registros</p>
                  <p className="text-lg font-bold text-sb-on-surface">847K</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Schedule */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-sb-surface rounded-2xl p-5 border border-sb-outline-variant/10">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-sb-on-surface-variant/40" />
              <h3 className="text-sm font-semibold text-sb-on-surface">Programacion</h3>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Backup Completo", schedule: "Diario 02:00 AM", next: "En 18 horas", active: true },
                { label: "Backup Incremental", schedule: "Cada 6 horas", next: "En 2 horas", active: true },
                { label: "Schema Backup", schedule: "Semanal (Dom)", next: "En 3 dias", active: true },
              ].map((item, i) => (
                <motion.div key={item.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.18 + i * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-2xl bg-sb-surface-container/30">
                  <div>
                    <p className="text-xs font-medium text-sb-on-surface">{item.label}</p>
                    <p className="text-[10px] text-sb-on-surface-variant/35 mt-0.5">{item.schedule}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-medium text-violet-500">{item.next}</span>
                    <div className="flex items-center gap-1 mt-0.5 justify-end">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[9px] text-emerald-500">Activo</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Storage */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="bg-sb-surface rounded-2xl p-5 border border-sb-outline-variant/10">
            <div className="flex items-center gap-2 mb-4">
              <HardDrive className="h-4 w-4 text-sb-on-surface-variant/40" />
              <h3 className="text-sm font-semibold text-sb-on-surface">Almacenamiento</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-sb-on-surface-variant/50">Usado</span>
                  <span className="text-[11px] font-semibold text-sb-on-surface">{totalSizeGB} / 10 GB</span>
                </div>
                <div className="h-2 bg-sb-surface-container/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (parseFloat(totalSizeGB) / 10) * 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-sb-surface-container/30 rounded-2xl p-3">
                  <p className="text-[10px] text-sb-on-surface-variant/40 mb-1">Disponible</p>
                  <p className="text-lg font-bold text-sb-on-surface">{(10 - parseFloat(totalSizeGB)).toFixed(1)} GB</p>
                </div>
                <div className="bg-sb-surface-container/30 rounded-2xl p-3">
                  <p className="text-[10px] text-sb-on-surface-variant/40 mb-1">Archivos</p>
                  <p className="text-lg font-bold text-sb-on-surface">{backups.length}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
