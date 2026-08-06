"use client"

import * as React from "react"
import { Key, Search, Eye, EyeOff, Copy, RefreshCw, Shield, Clock, AlertTriangle, Check, User, X } from "@/components/ui/proicons"
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

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  )

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
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight text-sb-on-surface">Contraseñas</h2>
          <p className="text-[14px] text-sb-on-surface/60 mt-1">Gestiona y resetea contraseñas de usuarios</p>
        </div>
        <span className="text-[12px] font-mono text-sb-on-surface/40 bg-sb-surface-container-high px-3 py-1.5 rounded-full">{users.length} usuarios</span>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface/30" />
        <input
          placeholder="Buscar por nombre, email o rol..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 h-11 rounded-2xl bg-sb-surface border border-sb-outline-variant/15 text-[14px] text-sb-on-surface placeholder:text-sb-on-surface/40 focus:outline-none focus:ring-2 focus:ring-sb-primary/20 transition-all"
        />
      </motion.div>

      {/* Users List */}
      <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-sb-primary/20 border-t-sb-primary rounded-full animate-spin mx-auto" />
            <p className="text-[13px] text-sb-on-surface/50 mt-3">Cargando...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <User className="h-12 w-12 text-sb-on-surface/10 mx-auto mb-3" />
            <p className="text-[14px] text-sb-on-surface/50">{search ? "Sin resultados" : "Sin usuarios"}</p>
          </div>
        ) : (
          <div className="divide-y divide-sb-outline-variant/8">
            {filtered.map((user, i) => {
              const daysSinceChange = getDaysSince(user.password_changed_at)
              const daysSinceLogin = getDaysSince(user.last_login)
              const isStale = daysSinceChange !== null && daysSinceChange > 90

              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                    successId === user.id ? "bg-emerald-500/5" : "hover:bg-sb-surface-container-low/30"
                  }`}
                >
                  <div className="h-11 w-11 rounded-xl bg-sb-surface-container-high flex items-center justify-center shrink-0">
                    <span className="text-[12px] font-medium text-sb-on-surface/50">
                      {user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-sb-on-surface/80 truncate">{user.full_name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${roleColors[user.role] || "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
                        {roleLabels[user.role]}
                      </span>
                      {isStale && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> Sin cambio ({daysSinceChange}d)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[12px] text-sb-on-surface/50">{user.email}</span>
                      {user.last_login && (
                        <span className="text-[11px] text-sb-on-surface/30 flex items-center gap-1">
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
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600"
                      >
                        <Check className="w-3.5 h-3.5" /> Reseteada
                      </motion.div>
                    ) : (
                      <button
                        onClick={() => { setResetModal(user); setNewPassword(""); setShowPassword(false) }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sb-surface-container-high text-[12px] font-medium text-sb-on-surface/60 hover:text-sb-on-surface hover:bg-sb-on-surface/5 transition-colors shrink-0"
                      >
                        <Key className="w-3.5 h-3.5" /> Resetear
                      </button>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Reset Modal */}
      <AnimatePresence>
        {resetModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setResetModal(null); setNewPassword(""); setShowPassword(false) }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-sb-surface rounded-2xl max-w-[420px] w-full shadow-2xl border border-sb-outline-variant/10 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-sb-outline-variant/10">
                <p className="text-[15px] font-semibold text-sb-on-surface">Resetear contraseña</p>
                <button onClick={() => { setResetModal(null); setNewPassword(""); setShowPassword(false) }} className="p-2 rounded-xl hover:bg-sb-surface-container-high transition-colors">
                  <X className="h-4 w-4 text-sb-on-surface/60" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                {/* User info */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-sb-surface-container-high">
                  <div className="h-10 w-10 rounded-xl bg-sb-surface-container flex items-center justify-center">
                    <User className="h-5 w-5 text-sb-on-surface/40" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-sb-on-surface/80">{resetModal.full_name}</p>
                    <p className="text-[12px] text-sb-on-surface/50">{resetModal.email}</p>
                  </div>
                </div>

                {/* Password input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] text-sb-on-surface/50">Nueva contraseña</label>
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
                      className="w-full h-11 px-4 pr-20 rounded-xl bg-sb-surface-container-high border border-sb-outline-variant/10 text-[14px] text-sb-on-surface focus:outline-none focus:ring-2 focus:ring-sb-primary/20 transition-all font-mono"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button onClick={() => setShowPassword(!showPassword)} className="p-1.5 rounded-lg hover:bg-sb-surface-container transition-colors">
                        {showPassword ? <EyeOff className="w-3.5 h-3.5 text-sb-on-surface/40" /> : <Eye className="w-3.5 h-3.5 text-sb-on-surface/40" />}
                      </button>
                      {newPassword && (
                        <button onClick={copyPassword} className="p-1.5 rounded-lg hover:bg-sb-surface-container transition-colors">
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-sb-on-surface/40" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                {newPassword && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
                    <div className="p-3 rounded-xl bg-sb-surface-container-high border border-sb-outline-variant/10">
                      <p className="text-[12px] text-sb-on-surface/60 font-mono break-all">{newPassword}</p>
                    </div>
                  </motion.div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-sb-outline-variant/10 flex gap-2">
                <button onClick={() => { setResetModal(null); setNewPassword("") }} className="flex-1 px-4 py-2.5 rounded-xl border border-sb-outline-variant/15 text-[13px] font-medium text-sb-on-surface/60 hover:bg-sb-surface-container-high transition-colors">
                  Cancelar
                </button>
                <button onClick={handleReset} disabled={saving || newPassword.length < 6}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-sb-on-surface text-white text-[13px] font-medium hover:bg-sb-on-surface/90 transition-all disabled:opacity-50 shadow-lg shadow-sb-on-surface/10">
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
