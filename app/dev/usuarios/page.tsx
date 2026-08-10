"use client"

import * as React from "react"
import {
  SbBtn,
  SbInput,
  SbLabel,
  SbModal,
  SbModalHeader,
  SbModalBody,
  SbModalFooter,
} from "@/components/ui/sb"
import {
  Users, Plus, Shield, GraduationCap, BookOpen, UserCheck,
  Trash2, Power, X, Search, Mail, Phone, Hash, Calendar, Building2,
  Filter, CheckCircle2, Circle, ChevronRight,
  AlertTriangle, CircleDot, Sparkles, Clock, Check,
  ChevronDown,
} from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import "@/styles/animations.css"

interface User {
  id: string
  email: string
  full_name: string
  role: string
  dni: string
  phone: string
  subject: string
  institution_code: string
  institution_name: string
  status: string
  created_at: string
}

interface Institution {
  id: string
  code: string
  name: string
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.06 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
}

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  director: "Director",
  secretario: "Secretario",
  docente: "Docente",
  padre: "Padre",
}

const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  super_admin: Shield,
  director: GraduationCap,
  secretario: BookOpen,
  docente: UserCheck,
  padre: Users,
}

const roleGradients: Record<string, string> = {
  super_admin: "from-red-500 to-red-600",
  director: "from-blue-500 to-blue-600",
  secretario: "from-amber-500 to-orange-500",
  docente: "from-emerald-500 to-teal-500",
  padre: "from-gray-600 to-gray-700",
}

const roleColors: Record<string, string> = {
  super_admin: "bg-red-500/10 text-red-500",
  director: "bg-blue-500/10 text-blue-500",
  secretario: "bg-amber-500/10 text-amber-500",
  docente: "bg-emerald-500/10 text-emerald-500",
  padre: "bg-gray-500/10 text-gray-500",
}

export default function DevUsuariosPage() {
  const [users, setUsers] = React.useState<User[]>([])
  const [institutions, setInstitutions] = React.useState<Institution[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const filterContainerRef = React.useRef<HTMLDivElement>(null)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [searchModalQuery, setSearchModalQuery] = React.useState("")
  const [selectedInstitution, setSelectedInstitution] = React.useState<{
    id: string
    code: string
    name: string
    users: User[]
  } | null>(null)
  const [formData, setFormData] = React.useState({
    email: "",
    full_name: "",
    password: "",
    role: "director",
    institution_id: "",
  })
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterContainerRef.current && !filterContainerRef.current.contains(e.target as Node)) {
        setFiltersOpen(false)
      }
    }
    if (filtersOpen) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [filtersOpen])

  React.useEffect(() => {
    fetchUsers()
    fetchInstitutions()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/dev/users")
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchInstitutions = async () => {
    try {
      const res = await fetch("/api/dev/institutions")
      if (res.ok) {
        const data = await res.json()
        setInstitutions(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreate = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/dev/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setDialogOpen(false)
        setFormData({ email: "", full_name: "", password: "", role: "director", institution_id: "" })
        fetchUsers()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active"
      const res = await fetch(`/api/dev/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        fetchUsers()
        if (selectedUser?.id === id) {
          setSelectedUser(prev => prev ? { ...prev, status: newStatus } as User : null)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const deleteUser = async (id: string) => {
    try {
      const res = await fetch(`/api/dev/users/${id}`, { method: "DELETE" })
      if (res.ok) {
        setDeleteConfirm(null)
        setSelectedUser(null)
        fetchUsers()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const filteredUsers = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false
      if (statusFilter !== "all" && u.status !== statusFilter) return false
      if (!q) return true
      const haystack = [
        u.full_name, u.email, u.role, u.dni, u.phone, u.subject,
        u.institution_name, u.institution_code,
      ].filter(Boolean).join(" ").toLowerCase()
      return haystack.includes(q)
    })
  }, [users, search, roleFilter, statusFilter])

  // Agrupar usuarios por institución (card principal = institución)
  const institutionGroups = React.useMemo(() => {
    const groups: Record<string, { id: string; code: string; name: string; users: User[] }> = {}
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
    // Super admins globales (sin institución) al final
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
        const groupUsers = filteredUsers.filter(u => (u.institution_id || "sin-institución") === g.id)
        return { ...g, filteredUsers: groupUsers }
      })
      .filter(g => {
        if (!q) return g.filteredUsers.length > 0
        const matches = g.filteredUsers.length > 0 &&
          (g.name?.toLowerCase().includes(q) || g.code?.toLowerCase().includes(q))
        return matches
      })
  }, [institutionGroups, filteredUsers, search])

  const initGroupModal = (g: { id: string; code: string; name: string; users: User[] }) => {
    setSelectedInstitution({ id: g.id, code: g.code, name: g.name, users: g.users })
  }

  const activeFilterCount = (roleFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0)
  const totalUsers = users.length
  const activeCount = users.filter(u => u.status === "active").length
  const roleCounts = React.useMemo(() => {
    const counts: Record<string, number> = {}
    users.forEach(u => { counts[u.role] = (counts[u.role] || 0) + 1 })
    return counts
  }, [users])

  const highlight = (text: string | undefined, q: string): React.ReactNode => {
    if (!text) return ""
    if (!q.trim()) return text
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx === -1) return text
    const before = text.slice(0, idx)
    const match = text.slice(idx, idx + q.length)
    const after = text.slice(idx + q.length)
    return (
      <>
        {before}
        <mark className="bg-[var(--sb-primary)]/20 text-[var(--sb-on-surface)] rounded-sm px-0.5">{match}</mark>
        {after}
      </>
    )
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="w-full space-y-6 py-2 md:py-4"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-[22px] md:text-[24px] font-bold tracking-tight text-sb-on-surface">Usuarios</h2>
          <p className="text-[13px] text-sb-on-surface/70 mt-1">Gestión de usuarios del sistema Educonecta</p>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sb-surface-container text-[11px] font-medium text-sb-on-surface/80">
              <CircleDot className="h-3 w-3 text-sb-on-surface/70" />
              {totalUsers} total
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sb-surface-container text-[11px] font-medium text-sb-on-surface/80">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-600" />
              {activeCount} activos
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SbBtn
            variant="filled"
            onClick={() => setDialogOpen(true)}
            className="h-10 px-4 rounded-xl flex-1 sm:flex-none"
          >
            <Plus className="h-4 w-4" />
            Nuevo Usuario
          </SbBtn>
        </div>
      </motion.div>

      {/* Role Stats Row */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
        {[
          { role: "director", label: "Directores", icon: GraduationCap, color: "from-blue-500 to-blue-600" },
          { role: "secretario", label: "Secretarios", icon: BookOpen, color: "from-amber-500 to-orange-500" },
          { role: "docente", label: "Docentes", icon: UserCheck, color: "from-emerald-500 to-teal-500" },
          { role: "padre", label: "Padres", icon: Users, color: "from-gray-600 to-gray-700" },
          { role: "super_admin", label: "Admins", icon: Shield, color: "from-red-500 to-red-600" },
        ].map((item) => {
          const count = roleCounts[item.role] || 0
          const active = roleFilter === item.role
          return (
            <button
              key={item.role}
              onClick={() => setRoleFilter(active ? "all" : item.role)}
              className={`group relative overflow-hidden rounded-2xl p-4 border transition-all duration-200 text-left md-anim-card-in ${
                active
                  ? "border-[var(--sb-primary)] bg-[var(--sb-primary)]/5"
                  : "border-[var(--sb-outline-variant)]/10 bg-[var(--sb-surface)] hover:border-[var(--sb-outline-variant)]/20"
              }`}
            >
              <div className="h-8 w-8 rounded-xl bg-[var(--sb-surface-container)] flex items-center justify-center mb-2">
                <item.icon className="h-4 w-4 text-[var(--sb-on-surface-variant)]/70" />
              </div>
              <p className="text-lg font-bold text-[var(--sb-on-surface)]">{count}</p>
              <p className="text-[11px] text-[var(--sb-on-surface-variant)]/70 font-medium uppercase tracking-wider">{item.label}</p>
              {active && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--sb-primary)]" />
                </div>
              )}
            </button>
          )
        })}
      </motion.div>

      {/* Create User Modal */}
      <SbModal open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm:max-w-[420px]">
        <SbModalHeader title="Crear Usuario" onClose={() => setDialogOpen(false)} />
        <SbModalBody>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <SbLabel className="text-xs text-[var(--sb-on-surface-variant)]/80">Nombre</SbLabel>
              <SbInput
                placeholder="Nombre completo"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="h-11 w-full rounded-xl bg-[var(--sb-surface-container)] px-4 text-[14px] text-[var(--sb-on-surface)] placeholder:text-[var(--sb-on-surface-variant)]/50 border border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--sb-primary)]/30"
              />
            </div>
            <div className="space-y-2">
              <SbLabel className="text-xs text-[var(--sb-on-surface-variant)]/80">Email</SbLabel>
              <SbInput
                type="email"
                placeholder="email@ejemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-11 w-full rounded-xl bg-[var(--sb-surface-container)] px-4 text-[14px] text-[var(--sb-on-surface)] placeholder:text-[var(--sb-on-surface-variant)]/50 border border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--sb-primary)]/30"
              />
            </div>
            <div className="space-y-2">
              <SbLabel className="text-xs text-[var(--sb-on-surface-variant)]/80">Contraseña</SbLabel>
              <SbInput
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-11 w-full rounded-xl bg-[var(--sb-surface-container)] px-4 text-[14px] text-[var(--sb-on-surface)] placeholder:text-[var(--sb-on-surface-variant)]/50 border border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--sb-primary)]/30"
              />
            </div>
            <div className="space-y-2">
              <SbLabel className="text-xs text-[var(--sb-on-surface-variant)]/80">Rol</SbLabel>
              <select
                className="sb-select h-11 rounded-xl bg-[var(--sb-surface-container)] border border-transparent text-[14px] text-[var(--sb-on-surface)]"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="super_admin">Super Admin</option>
                <option value="director">Director</option>
                <option value="secretario">Secretario</option>
                <option value="docente">Docente</option>
                <option value="padre">Padre</option>
              </select>
            </div>
            {formData.role !== "super_admin" && (
              <div className="space-y-2">
                <SbLabel className="text-xs text-[var(--sb-on-surface-variant)]/80">Institución</SbLabel>
                <select
                  className="sb-select h-11 rounded-xl bg-[var(--sb-surface-container)] border border-transparent text-[14px] text-[var(--sb-on-surface)]"
                  value={formData.institution_id}
                  onChange={(e) => setFormData({ ...formData, institution_id: e.target.value })}
                >
                  <option value="">Seleccionar</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </SbModalBody>
        <SbModalFooter className="flex flex-col sm:flex-row gap-2">
          <SbBtn variant="outlined" size="sm" rounded onClick={() => setDialogOpen(false)} className="flex-1">
            Cancelar
          </SbBtn>
          <SbBtn
            variant="filled"
            size="sm"
            rounded
            onClick={handleCreate}
            disabled={saving || !formData.email || !formData.password}
            className="flex-1"
          >
            {saving ? "Creando..." : "Crear"}
          </SbBtn>
        </SbModalFooter>
      </SbModal>

      {/* Search + Filters */}
      <motion.div variants={fadeUp} className="space-y-3">
        <div className="bg-[var(--sb-surface-container)] rounded-2xl p-3 border border-[var(--sb-outline-variant)]/10">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--sb-on-surface-variant)]/50 pointer-events-none" />
              <input
                placeholder="Buscar por nombre, email, DNI..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 pl-11 pr-10 rounded-xl bg-[var(--sb-surface-container)] text-[14px] text-[var(--sb-on-surface)] placeholder:text-[var(--sb-on-surface-variant)]/50 border border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--sb-primary)]/30 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full flex items-center justify-center text-[var(--sb-on-surface-variant)]/60 hover:bg-[var(--sb-surface-container-high)] transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Button */}
            <div ref={filterContainerRef} className="relative">
              <button
                type="button"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`md-anim-click relative h-11 px-4 rounded-xl flex items-center gap-2 text-sm font-medium transition-all duration-200 border ${
                  activeFilterCount > 0
                    ? "bg-[var(--sb-primary)]/10 text-[var(--sb-primary)] border-[var(--sb-primary)]/30"
                    : "bg-[var(--sb-surface)] border-[var(--sb-outline-variant)]/20 text-[var(--sb-on-surface-variant)]/70 hover:bg-[var(--sb-surface-container-high)]"
                }`}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filtros</span>
                {activeFilterCount > 0 && (
                  <span className="h-5 min-w-5 px-1.5 rounded-full bg-[var(--sb-primary)] text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
                <motion.div animate={{ rotate: filtersOpen ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}>
                  <ChevronDown className="h-3.5 w-3.5" />
                </motion.div>
              </button>

              {/* Inline Filter Panel */}
              <AnimatePresence>
                {filtersOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}
                    className="absolute right-0 z-50 w-80"
                    style={{ bottom: 0 }}
                  >
                    <div className="bg-[var(--sb-surface-container)] rounded-2xl border border-[var(--sb-outline-variant)]/15 shadow-2xl shadow-black/20 p-4">
                      <motion.div
                        initial="hidden"
                        animate="show"
                        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.035, delayChildren: 0.05 } } }}
                        className="space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-[var(--sb-on-surface)]">Filtros de búsqueda</p>
                          <button onClick={() => setFiltersOpen(false)} className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-[var(--sb-surface-container-high)] transition-colors">
                            <X className="h-3.5 w-3.5 text-[var(--sb-on-surface-variant)]/50" />
                          </button>
                        </div>

                        {/* Rol */}
                        <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } } }}>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--sb-on-surface-variant)]/60 mb-2">Rol</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { value: "all", label: "Todos", icon: Users },
                              { value: "super_admin", label: "Super Admin", icon: Shield },
                              { value: "director", label: "Director", icon: GraduationCap },
                              { value: "secretario", label: "Secretario", icon: BookOpen },
                              { value: "docente", label: "Docente", icon: UserCheck },
                              { value: "padre", label: "Padre", icon: Users },
                            ].map(({ value, label, icon: Icon }) => {
                              const active = roleFilter === value
                              return (
                                <motion.button
                                  key={value}
                                  variants={{ hidden: { opacity: 0, y: 8, scale: 0.95 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 30 } } }}
                                  whileTap={{ scale: 0.96 }}
                                  onClick={() => setRoleFilter(value)}
                                  className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors border ${
                                    active
                                      ? "bg-[var(--sb-primary)]/10 text-[var(--sb-primary)] border-[var(--sb-primary)]/30"
                                      : "text-[var(--sb-on-surface-variant)]/70 border-transparent hover:bg-[var(--sb-surface-container-high)]"
                                  }`}
                                >
                                  <Icon className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{label}</span>
                                  {active && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.8 }} className="ml-auto">
                                      <Check className="h-3 w-3 text-[var(--sb-primary)]" />
                                    </motion.div>
                                  )}
                                </motion.button>
                              )
                            })}
                          </div>
                        </motion.div>

                        {/* Estado */}
                        <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } } }}>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--sb-on-surface-variant)]/60 mb-2">Estado</p>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { value: "all", label: "Todos" },
                              { value: "active", label: "Activos" },
                              { value: "inactive", label: "Inactivos" },
                            ].map(({ value, label }) => {
                              const active = statusFilter === value
                              return (
                                <motion.button
                                  key={value}
                                  variants={{ hidden: { opacity: 0, y: 8, scale: 0.95 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 30 } } }}
                                  whileTap={{ scale: 0.96 }}
                                  onClick={() => setStatusFilter(value)}
                                  className={`relative px-2.5 py-2 rounded-xl text-xs font-medium transition-colors border ${
                                    active
                                      ? "bg-[var(--sb-primary)]/10 text-[var(--sb-primary)] border-[var(--sb-primary)]/30"
                                      : "text-[var(--sb-on-surface-variant)]/70 border-transparent hover:bg-[var(--sb-surface-container-high)]"
                                  }`}
                                >
                                  {label}
                                  {active && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.8 }} className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[var(--sb-primary)] flex items-center justify-center">
                                      <Check className="h-2.5 w-2.5 text-white" />
                                    </motion.div>
                                  )}
                                </motion.button>
                              )
                            })}
                          </div>
                        </motion.div>

                        {/* Footer */}
                        <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } } }} className="flex gap-2 pt-2 border-t border-[var(--sb-outline-variant)]/10">
                          {activeFilterCount > 0 && (
                            <button onClick={() => { setRoleFilter("all"); setStatusFilter("all") }} className="flex-1 px-3 py-2 rounded-xl text-xs font-medium text-[var(--sb-on-surface-variant)]/70 hover:bg-[var(--sb-surface-container-high)] transition-colors border border-[var(--sb-outline-variant)]/20">
                              Limpiar
                            </button>
                          )}
                          <button onClick={() => setFiltersOpen(false)} className="flex-1 px-3 py-2 rounded-xl text-xs font-medium bg-[var(--sb-on-surface)] text-[var(--sb-surface)] hover:opacity-90 transition-opacity">
                            Aplicar
                          </button>
                        </motion.div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {(search || activeFilterCount > 0) && (
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-[var(--sb-on-surface-variant)]/70">
              <span className="text-[var(--sb-on-surface)]/80 font-medium">{filteredUsers.length}</span> de {totalUsers} usuarios
            </p>
            <button
              type="button"
              onClick={() => { setSearch(""); setRoleFilter("all"); setStatusFilter("all") }}
              className="text-xs text-[var(--sb-primary)] hover:underline"
            >
              Limpiar todo
            </button>
          </div>
        )}
      </motion.div>

      {/* Institution Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredGroups.map((g, i) => {
          const isGlobal = !g.id || g.id === "sin-institución"
          const roleSummary = g.users.reduce<Record<string, number>>((acc, u) => {
            acc[u.role] = (acc[u.role] || 0) + 1
            return acc
          }, {})
          const activeUsers = g.users.filter(u => u.status === "active").length
          return (
            <motion.button
              key={g.id}
              variants={fadeUp}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.97 }}
              onClick={() => initGroupModal(g)}
              className="group relative overflow-hidden rounded-2xl p-4 border border-[var(--sb-outline-variant)]/10 bg-[var(--sb-surface)] hover:border-[var(--sb-outline-variant)]/25 hover:bg-[var(--sb-surface-container)] transition-all duration-200 text-left md-anim-card-in"
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
                  <span className="text-[10px] font-mono text-[var(--sb-on-surface-variant)]/60 bg-[var(--sb-surface-container)] px-2 py-1 rounded-md">
                    {g.code}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[var(--sb-on-surface)] truncate mt-3">{g.name}</p>
                <p className="text-[11px] text-[var(--sb-on-surface-variant)]/70 mt-0.5">{g.users.length} usuarios · {activeUsers} activos</p>
                <div className="flex flex-wrap items-center gap-1 mt-2.5">
                  {(Object.entries(roleSummary) as [string, number][]).map(([role, count]) => (
                    <span key={role} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${roleColors[role] || "bg-[var(--sb-surface-container-high)] text-[var(--sb-on-surface-variant)]/70"}`}>
                      {roleLabels[role] || role}: {count}
                    </span>
                  ))}
                  <span className="text-[9px] text-[var(--sb-on-surface-variant)]/40 ml-auto">Ver usuarios</span>
                </div>
              </div>
            </motion.button>
          )
        })}
        {!loading && filteredGroups.length === 0 && (
          <div className="col-span-full bg-[var(--sb-surface-container)] rounded-3xl border border-[var(--sb-outline-variant)]/10 px-5 py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-[var(--sb-surface-container-high)] flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-[var(--sb-on-surface-variant)]/60" />
            </div>
            <p className="text-sm font-medium text-[var(--sb-on-surface-variant)]/70">
              {search || activeFilterCount > 0
                ? "Sin resultados para tu búsqueda"
                : "Sin usuarios registrados"}
            </p>
            <p className="text-xs text-[var(--sb-on-surface-variant)]/60 mt-1.5 max-w-xs mx-auto">
              {search || activeFilterCount > 0 ? "Intenta con otros filtros" : "Crea tu primer usuario para comenzar"}
            </p>
            {!(search || activeFilterCount > 0) && (
              <SbBtn variant="filled" size="sm" rounded onClick={() => setDialogOpen(true)} className="mt-5">
                <Plus className="h-4 w-4" />
                Crear Usuario
              </SbBtn>
            )}
          </div>
        )}
      </motion.div>

      {/* Institution Users Modal */}
      <SbModal open={!!selectedInstitution} onClose={() => setSelectedInstitution(null)} maxWidth="sm:max-w-[560px]">
        {selectedInstitution && (
          <>
            <SbModalHeader
              title={`${selectedInstitution.code !== "—" ? `${selectedInstitution.code} · ` : ""}${selectedInstitution.name}`}
              onClose={() => setSelectedInstitution(null)}
            />
            <SbModalBody className="max-h-[85vh] overflow-y-auto">
              <div className="space-y-2 py-1">
                {selectedInstitution.users.map(user => {
                  const RoleIcon = roleIcons[user.role] || Users
                  const gradient = roleGradients[user.role] || "from-gray-500 to-gray-600"
                  return (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className="w-full group bg-[var(--sb-surface-container)] rounded-2xl p-3.5 border border-[var(--sb-outline-variant)]/10 hover:border-[var(--sb-outline-variant)]/20 hover:bg-[var(--sb-surface-container-high)] transition-all duration-200 text-left"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
                          <span className="text-xs font-bold text-white">
                            {user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-[var(--sb-on-surface)] truncate">{user.full_name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-[var(--sb-on-surface-variant)]/70 font-mono truncate">{user.email}</span>
                            {user.subject && (
                              <>
                                <span className="text-[var(--sb-on-surface-variant)]/30">·</span>
                                <span className="text-[11px] text-[var(--sb-on-surface-variant)]/70 truncate">{user.subject}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold ${roleColors[user.role] || "bg-[var(--sb-surface-container-high)]"}`}>
                            <RoleIcon className="h-3 w-3" />
                            <span>{roleLabels[user.role]}</span>
                          </div>
                          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold ${
                            user.status === "active"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-[var(--sb-on-surface)]/5 text-[var(--sb-on-surface-variant)]/70"
                          }`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${user.status === "active" ? "bg-emerald-500" : "bg-[var(--sb-on-surface-variant)]/50"}`} />
                            {user.status === "active" ? "Activo" : "Inactivo"}
                          </div>
                          <ChevronRight className="h-4 w-4 text-[var(--sb-on-surface-variant)]/50 group-hover:text-[var(--sb-on-surface-variant)]/60 transition-colors" />
                        </div>
                      </div>
                    </button>
                  )
                })}
                {selectedInstitution.users.length === 0 && (
                  <p className="text-[13px] text-[var(--sb-on-surface-variant)]/70 py-10 text-center">Sin usuarios</p>
                )}
              </div>
            </SbModalBody>
          </>
        )}
      </SbModal>

      {/* Detail Dialog */}
      <SbModal open={!!selectedUser} onClose={() => setSelectedUser(null)} maxWidth="sm:max-w-[420px]">
        {selectedUser && (
          <>
            <SbModalHeader title={selectedUser.full_name} onClose={() => setSelectedUser(null)} />
            <SbModalBody className="max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-[var(--sb-on-surface-variant)]/70 font-mono">{selectedUser.email}</p>
              </div>

              <div className="space-y-3 py-3">
                {/* Avatar + Role + Status */}
                <div className="flex items-center gap-4 md-anim-card-in">
                  <div className={`h-16 w-16 rounded-2xl ${roleColors[selectedUser.role] || "bg-[var(--sb-surface-container-high)]"} flex items-center justify-center shrink-0`}>
                    <span className="text-xl font-bold">
                      {selectedUser.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${roleColors[selectedUser.role] || "bg-[var(--sb-surface-container-high)]/80"}`}>
                      {React.createElement(roleIcons[selectedUser.role] || Users, { className: "h-3 w-3" })}
                      {roleLabels[selectedUser.role]}
                    </div>
                    <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${
                      selectedUser.status === "active" ? "text-emerald-500 font-semibold" : "text-[var(--sb-on-surface-variant)]/70"
                    }`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${selectedUser.status === "active" ? "bg-emerald-500" : "bg-[var(--sb-on-surface-variant)]/50"}`} />
                      {selectedUser.status === "active" ? "Activo" : "Inactivo"}
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-[var(--sb-surface-container)] rounded-2xl p-4 border border-[var(--sb-outline-variant)]/10 md-anim-card-in">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Mail className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    <p className="text-[10px] text-[var(--sb-on-surface-variant)]/60 uppercase tracking-wider font-semibold">Contacto</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-[var(--sb-on-surface-variant)]/70">
                      <span className="font-mono text-xs">{selectedUser.email}</span>
                    </div>
                    {selectedUser.dni && (
                      <div className="flex items-center gap-2 text-sm text-[var(--sb-on-surface-variant)]/70">
                        <Hash className="h-3 w-3 text-[var(--sb-on-surface-variant)]/60" />
                        <span className="text-xs">DNI: <span className="font-mono">{selectedUser.dni}</span></span>
                      </div>
                    )}
                    {selectedUser.phone && (
                      <div className="flex items-center gap-2 text-sm text-[var(--sb-on-surface-variant)]/70">
                        <Phone className="h-3 w-3 text-[var(--sb-on-surface-variant)]/60" />
                        <span className="text-xs">{selectedUser.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Academic Info */}
                {(selectedUser.subject || selectedUser.institution_name) && (
                  <div className="bg-[var(--sb-surface-container)] rounded-2xl p-4 border border-[var(--sb-outline-variant)]/10 md-anim-card-in">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="h-6 w-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                      <p className="text-[10px] text-[var(--sb-on-surface-variant)]/60 uppercase tracking-wider font-semibold">Académico</p>
                    </div>
                    <div className="space-y-2">
                      {selectedUser.subject && (
                        <div className="text-xs text-[var(--sb-on-surface-variant)]/70 flex items-center gap-2">
                          <BookOpen className="h-3 w-3 text-[var(--sb-on-surface-variant)]/50" />
                          Materia: {selectedUser.subject}
                        </div>
                      )}
                      {selectedUser.institution_name && (
                        <div className="text-xs text-[var(--sb-on-surface-variant)]/70 flex items-center gap-2">
                          <Building2 className="h-3 w-3 text-[var(--sb-on-surface-variant)]/50" />
                          {selectedUser.institution_name}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Created */}
                <div className="bg-[var(--sb-surface-container)] rounded-2xl p-4 border border-[var(--sb-outline-variant)]/10 md-anim-card-in">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-gray-700/20 flex items-center justify-center">
                      <Clock className="h-3.5 w-3.5 text-gray-500" />
                    </div>
                    <p className="text-[10px] text-[var(--sb-on-surface-variant)]/60 uppercase tracking-wider font-semibold">Registro</p>
                  </div>
                  <p className="text-xs text-[var(--sb-on-surface-variant)]/70 mt-2 flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-[var(--sb-on-surface-variant)]/50" />
                    {new Date(selectedUser.created_at).toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <SbBtn
                    variant={selectedUser.status === "active" ? "outlined" : "tonal"}
                    size="sm"
                    rounded
                    onClick={() => toggleStatus(selectedUser.id, selectedUser.status)}
                    className={`flex-1 ${selectedUser.status === "active" ? "text-amber-500 border-amber-500/30" : "text-emerald-500 bg-emerald-500/10"}`}
                  >
                    {selectedUser.status === "active" ? "Desactivar" : "Activar"}
                  </SbBtn>
                  <SbBtn
                    variant="danger"
                    size="sm"
                    rounded
                    onClick={() => setDeleteConfirm(selectedUser.id)}
                    className="flex-1"
                  >
                    Eliminar
                  </SbBtn>
                </div>
              </div>
            </SbModalBody>
          </>
        )}
      </SbModal>

      {/* Delete Confirmation */}
      <SbModal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="sm:max-w-[360px]">
        <SbModalHeader title="Eliminar usuario" onClose={() => setDeleteConfirm(null)} />
        <SbModalBody>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-3 md-anim-card-in">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm font-medium text-red-500">Acción irreversible</p>
          </div>
          <p className="text-xs text-[var(--sb-on-surface-variant)]/70">
            Se eliminará permanentemente este usuario y todos sus datos asociados.
          </p>
        </SbModalBody>
        <SbModalFooter className="flex flex-col sm:flex-row gap-2">
          <SbBtn variant="outlined" size="sm" rounded onClick={() => setDeleteConfirm(null)} className="flex-1">Cancelar</SbBtn>
          <SbBtn variant="danger" size="sm" rounded onClick={() => deleteConfirm && deleteUser(deleteConfirm)} className="flex-1">Eliminar</SbBtn>
        </SbModalFooter>
      </SbModal>
    </motion.div>
  )
}
