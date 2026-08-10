"use client"

import * as React from "react"
import { Key, Search, Eye, EyeOff, Copy, RefreshCw, Shield, Clock, AlertTriangle, Check, User, X, Building2, ChevronRight } from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"

interface PasswordUser {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  last_login: string | null
  created_at: string
  password_changed_at: string | null
  institution_id?: string | null
  institution_code?: string | null
  institution_name?: string | null
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.08 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function DevContrasenasPage() {
  const [users, setUsers] = React.useState<PasswordUser[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [resetModal, setResetModal] = React.useState<PasswordUser | null>(null)
  const [newPassword, setNewPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [successId, setSuccessId] = React.useState<string | null>(null)
  const [selectedInstitution, setSelectedInstitution] = React.useState<{
    id: string
    code: string
    name: string
    users: PasswordUser[]
  } | null>(null)
  const [roleFilter, setRoleFilter] = React.useState<string>("all")

  React.useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/dev/passwords")
      if (res.ok) setUsers(await res.json())
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!"
    let pass = ""
    for (let i = 0; i < 12; i++) pass += chars[Math.floor(Math.random() * chars.length)]
    setNewPassword(pass)
    setShowPassword(true)
  }

  const copyPassword = async () => {
    await navigator.clipboard.writeText(newPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = async () => {
    if (!resetModal || !newPassword) return
    setSaving(true)
    try {
      const res = await fetch(`/api/dev/passwords/${resetModal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      })
      if (res.ok) {
        setSuccessId(resetModal.id)
        setTimeout(() => setSuccessId(null), 2500)
        setResetModal(null)
        setNewPassword("")
        setShowPassword(false)
        fetchUsers()
      }
    } catch (e) { console.error(e) } finally { setSaving(false) }
  }

  const getDaysSince = (date: string | null) => {
    if (!date) return null
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
    return diff
  }

  const institutionGroups = React.useMemo(() => {
    const groups: Record<string, { id: string; code: string; name: string; users: PasswordUser[] }> = {}
    for (const u of users) {
      const key = u.institution_id || "sin-institución"
      if (!groups[key]) {
        groups[key] = {
          id: key,
          code: u.institution_code || "—",
          name: u.institution_name || (u.full_name ? `Desarrollador · ${u.full_name}` : "Sin institución"),
          users: [],
        }
      }
      groups[key].users.push(u)
    }
    return Object.values(groups).sort((a, b) => {
      if (a.code === "—") return 1
      if (b.code === "—") return -1
      return a.code.localeCompare(b.code)
    })
  }, [users])

  const filteredGroups = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return institutionGroups
      .map(g => {
        const members = g.users.filter(u => {
          if (roleFilter !== "all" && u.role !== roleFilter) return false
          if (!q) return true
          return (
            u.full_name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.role?.toLowerCase().includes(q)
          )
        })
        return { ...g, members }
      })
      .filter(g => {
        if (!q) return g.members.length > 0
        return g.members.length > 0 &&
          (g.name?.toLowerCase().includes(q) || g.code?.toLowerCase().includes(q))
      })
  }, [institutionGroups, search, roleFilter])

  const activeFilterCount = roleFilter !== "all" ? 1 : 0

  const roleColors: Record<string, string> = {
    super_admin: "bg-red-500/10 text-red-500 border-red-500/20",
    director: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    secretario: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    docente: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    padre: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  }

  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin", director: "Director", secretario: "Secretario",
    docente: "Docente", padre: "Padre",
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full space-y-6 py-2">
      <motion.div variants={fadeUp} className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-[22px] md:text-[24px] font-bold tracking-tight text-sb-on-surface">Contraseñas</h2>
          <p className="text-[13px] text-sb-on-surface/70 mt-1">Gestiona y resetea contraseñas de usuarios</p>
        </div>
        <span className="w-fit text-[12px] font-mono text-sb-on-surface/60 bg-sb-surface-container-high px-3 py-1.5 rounded-full">{users.length} usuarios</span>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface/50" />
        <input
          placeholder="Buscar por nombre, email o rol..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 h-11 rounded-xl bg-sb-surface-container text-[14px] text-sb-on-surface placeholder:text-sb-on-surface/50 focus:outline-none focus:ring-2 focus:ring-sb-primary/30"
        />
      </motion.div>

      {/* Institution Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredGroups.map((g) => {
          const isGlobal = !g.id || g.id === "sin-institución"
          const activeUsers = g.users.filter(u => u.status === "active").length
          return (
            <motion.button
              key={g.id}
              variants={fadeUp}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedInstitution({ id: g.id, code: g.code, name: g.name, users: g.users })}
              className="group relative overflow-hidden rounded-2xl p-4 border border-sb-outline-variant/10 bg-sb-surface hover:border-sb-outline-variant/25 hover:bg-sb-surface-container transition-all duration-200 text-left md-anim-card-in"
            >
              <div
                className={`absolute right-[-20px] top-[-20px] h-24 w-24 rounded-full blur-2xl transition-opacity opacity-40 group-hover:opacity-60 ${
                  isGlobal ? "bg-red-500/20" : "bg-[var(--sb-primary)]/20"
                }`}
              />
              <div className="relative">
                <div className="flex items-start justify-between gap-2">
                  <div className={`h-11 w-11 rounded-xl ${
                    isGlobal ? "bg-red-500/10" : "bg-[var(--sb-primary)]/10"
                  } flex items-center justify-center shrink-0`}>
                    {React.createElement(isGlobal ? Shield : Building2, { className: "h-5 w-5 " + (isGlobal ? "text-red-500" : "text-[var(--sb-primary)]") })}
                  </div>
                  <span className="text-[10px] font-mono text-sb-on-surface/60 bg-sb-surface-container px-2 py-1 rounded-md">
                    {g.code}
                  </span>
                </div>
                <p className="text-sm font-semibold text-sb-on-surface truncate mt-3">{g.name}</p>
                <p className="text-[11px] text-sb-on-surface/70 mt-0.5">{g.users.length} usuarios · {activeUsers} activos</p>
                <span className="text-[9px] text-sb-on-surface/40 mt-2.5 block">Ver usuarios</span>
              </div>
            </motion.button>
          )
        })}
        {!loading && filteredGroups.length === 0 && (
          <div className="col-span-full bg-sb-surface rounded-3xl border border-sb-outline-variant/10 px-5 py-16 text-center">
            <User className="h-10 w-10 text-sb-on-surface/50 mx-auto mb-3" />
            <p className="text-[14px] text-sb-on-surface/70">{search || activeFilterCount > 0 ? "Sin resultados" : "Sin usuarios"}</p>
          </div>
        )}
      </motion.div>

      {/* Institution Users Modal */}
      <AnimatePresence>
        {selectedInstitution && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setSelectedInstitution(null)}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-x-3 bottom-3 top-auto max-h-[85vh] overflow-y-auto rounded-3xl sm:inset-0 sm:top-1/2 sm:-translate-y-1/2 sm:max-w-2xl sm:rounded-2xl bg-sb-surface border border-sb-outline-variant/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-sb-surface/95 backdrop-blur flex items-center justify-between px-6 py-4 border-b border-sb-outline-variant/10">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-sb-on-surface truncate">
                    {selectedInstitution.code !== "—" ? `${selectedInstitution.code} · ` : ""}{selectedInstitution.name}
                  </p>
                  <p className="text-[12px] text-sb-on-surface/60">{selectedInstitution.users.length} usuarios</p>
                </div>
                <button onClick={() => setSelectedInstitution(null)} className="h-9 w-9 rounded-xl hover:bg-sb-surface-container-high flex items-center justify-center transition-colors shrink-0">
                  <X className="h-4 w-4 text-sb-on-surface/70" />
                </button>
              </div>
              <div className="px-6 py-4 space-y-2">
                {selectedInstitution.users.map((user) => {
                  const daysSinceChange = getDaysSince(user.password_changed_at)
                  const daysSinceLogin = getDaysSince(user.last_login)
                  const isStale = daysSinceChange !== null && daysSinceChange > 90
                  return (
                    <div
                      key={user.id}
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl border border-sb-outline-variant/10 hover:bg-sb-surface-container-low/50 transition-colors ${
                        successId === user.id ? "bg-emerald-500/5" : ""
                      }`}
                    >
                      <div className="h-11 w-11 rounded-xl bg-sb-surface-container-high flex items-center justify-center shrink-0">
                        <span className="text-[12px] font-medium text-sb-on-surface/70">
                          {user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-medium text-sb-on-surface truncate">{user.full_name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${roleColors[user.role] || "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
                            {roleLabels[user.role]}
                          </span>
                          {isStale && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" /> Sin cambio ({daysSinceChange}d)
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-0.5">
                          <span className="text-[12px] text-sb-on-surface/70">{user.email}</span>
                          {user.last_login && (
                            <span className="text-[11px] text-sb-on-surface/60 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              Último login: {daysSinceLogin === 0 ? "Hoy" : daysSinceLogin === 1 ? "Ayer" : `hace ${daysSinceLogin}d`}
                            </span>
                          )}
                        </div>
                      </div>
                      <AnimatePresence>
                        {successId === user.id ? (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" /> Reseteada
                          </motion.div>
                        ) : (
                          <button
                            onClick={() => { setResetModal(user); setNewPassword(""); setShowPassword(false) }}
                            className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-sb-surface-container-high text-[12px] font-medium text-sb-on-surface/80 hover:text-sb-on-surface hover:bg-sb-surface-container-high transition-colors shrink-0"
                          >
                            <Key className="w-3.5 h-3.5" /> Resetear
                          </button>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
                {selectedInstitution.users.length === 0 && (
                  <p className="text-[13px] text-sb-on-surface/70 py-10 text-center">Sin usuarios</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Modal */}
      <AnimatePresence>
        {resetModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => { setResetModal(null); setNewPassword(""); setShowPassword(false) }}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-x-3 bottom-3 top-auto max-h-[92vh] overflow-y-auto rounded-3xl sm:inset-0 sm:top-1/2 sm:-translate-y-1/2 sm:max-w-lg sm:rounded-2xl bg-sb-surface border border-sb-outline-variant/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-sb-surface/95 backdrop-blur flex items-center justify-between px-6 py-4 border-b border-sb-outline-variant/10">
                <p className="text-[15px] font-semibold text-sb-on-surface">Resetear contraseña</p>
                <button onClick={() => { setResetModal(null); setNewPassword(""); setShowPassword(false) }} className="h-9 w-9 rounded-xl hover:bg-sb-surface-container-high flex items-center justify-center transition-colors">
                  <X className="h-4 w-4 text-sb-on-surface/70" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                {/* User info */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-sb-surface-container-high">
                  <div className="h-10 w-10 rounded-xl bg-sb-surface-container flex items-center justify-center">
                    <User className="h-5 w-5 text-sb-on-surface/50" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-sb-on-surface truncate">{resetModal.full_name}</p>
                    <p className="text-[12px] text-sb-on-surface/70 truncate">{resetModal.email}</p>
                  </div>
                </div>

                {/* Password input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] text-sb-on-surface/70">Nueva contraseña</label>
                    <button onClick={generatePassword} className="text-[11px] text-sb-primary flex items-center gap-1 hover:underline">
                      <RefreshCw className="w-2.5 h-2.5" /> Generar
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-11 px-4 pr-20 rounded-xl bg-sb-surface-container text-[14px] text-sb-on-surface placeholder:text-sb-on-surface/50 focus:outline-none focus:ring-2 focus:ring-sb-primary/30 font-mono"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button onClick={() => setShowPassword(!showPassword)} className="p-1.5 rounded-lg hover:bg-sb-surface-container transition-colors">
                        {showPassword ? <EyeOff className="w-3.5 h-3.5 text-sb-on-surface/50" /> : <Eye className="w-3.5 h-3.5 text-sb-on-surface/50" />}
                      </button>
                      {newPassword && (
                        <button onClick={copyPassword} className="p-1.5 rounded-lg hover:bg-sb-surface-container transition-colors">
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-sb-on-surface/50" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                {newPassword && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
                    <div className="p-3 rounded-xl bg-sb-surface-container-high border border-sb-outline-variant/10">
                      <p className="text-[12px] text-sb-on-surface/70 font-mono break-all">{newPassword}</p>
                    </div>
                  </motion.div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-sb-outline-variant/10 flex flex-col sm:flex-row gap-2">
                <button onClick={() => { setResetModal(null); setNewPassword("") }} className="h-10 px-4 rounded-xl border border-sb-outline-variant/15 text-[13px] font-medium text-sb-on-surface/70 hover:bg-sb-surface-container-high transition-colors sm:flex-none">
                  Cancelar
                </button>
                <button onClick={handleReset} disabled={saving || newPassword.length < 6}
                  className="flex-1 h-10 px-4 rounded-xl bg-sb-on-surface text-sb-surface text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                  {saving ? "Guardando..." : "Resetear"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
