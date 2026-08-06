"use client"

import * as React from "react"
import { Activity, Users, Clock, TrendingUp, Monitor, Smartphone, Globe, Search } from "@/components/ui/proicons"
import { motion } from "framer-motion"

interface SessionStats {
  totalUsers: number
  activeUsers: number
  totalSessions: number
  todaySessions: number
  uniqueToday: number
  last7days: { day: string; sessions: number; users: number }[]
  recentLogins: {
    logged_in_at: string; ip_address: string; user_agent: string;
    full_name: string; email: string; role: string;
  }[]
  topUsers: {
    full_name: string; email: string; role: string;
    session_count: number; last_seen: string;
  }[]
}

interface Session {
  id: string; user_id: string; ip_address: string; user_agent: string;
  logged_in_at: string; logged_out_at: string | null;
  full_name: string; email: string; role: string; institution_name: string;
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function DevSeguimientoPage() {
  const [stats, setStats] = React.useState<SessionStats | null>(null)
  const [sessions, setSessions] = React.useState<Session[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [activeTab, setActiveTab] = React.useState<"overview" | "history" | "ranking">("overview")

  React.useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [statsRes, sessionsRes] = await Promise.all([
        fetch("/api/dev/sessions/stats"),
        fetch("/api/dev/sessions?limit=200"),
      ])
      if (statsRes.ok) setStats(await statsRes.json())
      if (sessionsRes.ok) setSessions(await sessionsRes.json())
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "Ahora"
    if (mins < 60) return `hace ${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `hace ${hours}h`
    const days = Math.floor(hours / 24)
    return `hace ${days}d`
  }

  const getDevice = (ua: string) => {
    if (!ua) return { icon: Globe, label: "Desconocido" }
    if (/mobile|android|iphone/i.test(ua)) return { icon: Smartphone, label: "Móvil" }
    return { icon: Monitor, label: "Desktop" }
  }

  const roleColors: Record<string, string> = {
    super_admin: "bg-red-500/10 text-red-500 border-red-500/20",
    director: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    secretario: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    docente: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    padre: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  }

  const filteredSessions = sessions.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  )

  const tabs = [
    { key: "overview" as const, label: "Resumen", icon: Activity },
    { key: "history" as const, label: "Historial", icon: Clock },
    { key: "ranking" as const, label: "Ranking", icon: TrendingUp },
  ]

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full space-y-6 py-2">
      <motion.div variants={fadeUp}>
        <h2 className="text-[26px] font-bold tracking-tight text-sb-on-surface">Seguimiento</h2>
        <p className="text-[14px] text-sb-on-surface/60 mt-1">Actividad y uso del sistema</p>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex gap-1 p-1 bg-sb-surface rounded-2xl w-fit border border-sb-outline-variant/10">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${
              activeTab === tab.key
                ? "bg-sb-on-surface text-sb-surface shadow-lg shadow-sb-on-surface/15"
                : "text-sb-on-surface/50 hover:text-sb-on-surface hover:bg-sb-surface-container-high/50"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Overview */}
      {activeTab === "overview" && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Usuarios totales", value: stats.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
              { label: "Sesiones hoy", value: stats.todaySessions, icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { label: "Únicos hoy", value: stats.uniqueToday, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
              { label: "Total sesiones", value: stats.totalSessions, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="bg-sb-surface rounded-2xl p-5 border border-sb-outline-variant/10 hover:border-sb-outline-variant/20 transition-all"
              >
                <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-[28px] font-bold text-sb-on-surface">{stat.value}</p>
                <p className="text-[12px] text-sb-on-surface/50 mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Last 7 days chart */}
          {stats.last7days.length > 0 && (
            <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl p-5 border border-sb-outline-variant/10">
              <p className="text-[14px] font-medium text-sb-on-surface/80 mb-4">Últimos 7 días</p>
              <div className="flex items-end gap-2 h-36">
                {stats.last7days.map((day, i) => {
                  const maxSessions = Math.max(...stats.last7days.map(d => d.sessions), 1)
                  const height = (day.sessions / maxSessions) * 100
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[11px] text-sb-on-surface/50 font-mono">{day.sessions}</span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, 8)}%` }}
                        transition={{ delay: i * 0.05, duration: 0.4 }}
                        className="w-full rounded-t-lg bg-sb-primary/20 hover:bg-sb-primary/30 transition-colors"
                      />
                      <span className="text-[10px] text-sb-on-surface/30">
                        {new Date(day.day).toLocaleDateString("es-PE", { weekday: "short" })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Recent logins */}
          <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl p-5 border border-sb-outline-variant/10">
            <p className="text-[14px] font-medium text-sb-on-surface/80 mb-4">Últimos 10 logins</p>
            <div className="space-y-2">
              {stats.recentLogins.map((login, i) => {
                const device = getDevice(login.user_agent)
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-sb-surface-container-high/30 hover:bg-sb-surface-container-high/50 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-xl bg-sb-surface-container-high flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-medium text-sb-on-surface/50">
                        {login.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-sb-on-surface/80 truncate">{login.full_name}</p>
                      <p className="text-[11px] text-sb-on-surface/40">{login.ip_address || "—"}</p>
                    </div>
                    <device.icon className="w-4 h-4 text-sb-on-surface/30 shrink-0" />
                    <span className="text-[11px] text-sb-on-surface/40 shrink-0">{timeAgo(login.logged_in_at)}</span>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* History */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <motion.div variants={fadeUp} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface/30" />
            <input
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 h-11 rounded-2xl bg-sb-surface border border-sb-outline-variant/15 text-[14px] text-sb-on-surface placeholder:text-sb-on-surface/40 focus:outline-none focus:ring-2 focus:ring-sb-primary/20 transition-all"
            />
          </motion.div>

          <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 overflow-hidden">
            <div className="divide-y divide-sb-outline-variant/8">
              {filteredSessions.map((session, i) => {
                const device = getDevice(session.user_agent)
                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-sb-surface-container-low/30 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-xl bg-sb-surface-container-high flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-medium text-sb-on-surface/50">
                        {session.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-medium text-sb-on-surface/80 truncate">{session.full_name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${roleColors[session.role] || "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
                          {session.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[12px] text-sb-on-surface/50">{session.email}</span>
                        <span className="text-[11px] text-sb-on-surface/30">{session.ip_address || "—"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <device.icon className="w-4 h-4 text-sb-on-surface/30" />
                      <div className="text-right">
                        <p className="text-[11px] text-sb-on-surface/40">{timeAgo(session.logged_in_at)}</p>
                        {session.institution_name && (
                          <p className="text-[10px] text-sb-on-surface/25 truncate max-w-[100px]">{session.institution_name}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
              {filteredSessions.length === 0 && (
                <div className="px-5 py-10 text-center text-[13px] text-sb-on-surface/30">
                  {search ? "Sin resultados" : "Sin sesiones registradas"}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Ranking */}
      {activeTab === "ranking" && stats && (
        <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl p-5 border border-sb-outline-variant/10">
          <p className="text-[14px] font-medium text-sb-on-surface/80 mb-4">Top usuarios más activos</p>
          <div className="space-y-2">
            {stats.topUsers.map((user, i) => {
              const maxSessions = Math.max(...stats.topUsers.map(u => u.session_count), 1)
              const width = (user.session_count / maxSessions) * 100
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 p-3 rounded-xl bg-sb-surface-container-high/30 hover:bg-sb-surface-container-high/50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-xl bg-sb-surface-container-high flex items-center justify-center shrink-0">
                    <span className="text-[13px] font-bold text-sb-on-surface/40">#{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-sb-on-surface/80 truncate">{user.full_name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${roleColors[user.role] || "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
                        {user.role}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 bg-sb-surface-container-high/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${width}%` }}
                        transition={{ delay: i * 0.04, duration: 0.5 }}
                        className="h-full bg-sb-primary/30 rounded-full"
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[16px] font-bold text-sb-on-surface">{user.session_count}</p>
                    <p className="text-[10px] text-sb-on-surface/30">sesiones</p>
                  </div>
                </motion.div>
              )
            })}
            {stats.topUsers.length === 0 && (
              <div className="text-center py-8 text-[13px] text-sb-on-surface/30">
                Sin datos de actividad aún
              </div>
            )}
          </div>
        </motion.div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-7 w-7 border-2 border-sb-on-surface/15 border-t-sb-on-surface/50 rounded-full animate-spin" />
        </div>
      )}
    </motion.div>
  )
}
