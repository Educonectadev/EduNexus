"use client"

import * as React from "react"
import {
  SbBtn,
  SbInput,
  SbLabel,
  SbTextarea,
  SbModal,
  SbModalHeader,
  SbModalBody,
  SbModalFooter,
  useToast,
} from "@/components/ui/sb"
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  Mail,
  Globe,
  GraduationCap,
  FileText,
  Check,
  Search,
  Trash2,
  Power,
  X,
  ChevronRight,
  Users,
  BookOpen,
  Download,
  Filter,
  Sparkles,
  AlertTriangle,
  Copy,
  School,
  Landmark,
  Library,
  Dumbbell,
  Monitor,
  CircleDot,
  ChevronDown,
  Clock,
  CalendarDays,
} from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import { departments, type Department, type Province } from "@/lib/data/peru-geo"
import "@/styles/animations.css"

interface Institution {
  id: string
  code: string
  name: string
  type: string
  level: string
  modality: string
  district: string
  province: string
  department: string
  address: string
  phone: string
  email: string
  website: string
  director_name: string
  director_dni: string
  total_students: number
  total_teachers: number
  shift: string
  status: string
  plan_id?: string
  plan_name?: string
  plan_price?: number
  schedule_config?: {
    general_start: string
    general_end: string
    weekdays: number[]
    turnos: { name: string; start: string; end: string; grades: string[] }[]
  }
}

interface Turno {
  name: string
  start: string
  end: string
  grades: string[]
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  colegio: School,
  instituto: Landmark,
  universidad: GraduationCap,
  academia: BookOpen,
  centro_tecnico: Library,
}

const typeColors: Record<string, string> = {
  colegio: "from-blue-500 to-blue-600",
  instituto: "from-violet-500 to-violet-600",
  universidad: "from-amber-500 to-orange-600",
  academia: "from-emerald-500 to-teal-600",
  centro_tecnico: "from-rose-500 to-pink-600",
}

const institutionTypes = [
  { value: "colegio", label: "Colegio" },
  { value: "instituto", label: "Instituto" },
  { value: "universidad", label: "Universidad" },
  { value: "academia", label: "Academia" },
  { value: "centro_tecnico", label: "Centro Técnico" },
]

const institutionLevels = [
  { value: "inicial", label: "Inicial (3-5 años)" },
  { value: "primaria", label: "Primaria (6-11 años)" },
  { value: "secundaria", label: "Secundaria (12-17 años)" },
  { value: "primaria_secundaria", label: "Primaria y Secundaria" },
  { value: "superior", label: "Superior / Universitario" },
  { value: "tecnico", label: "Técnico Productivo" },
]

const modalities = [
  { value: "presencial", label: "Presencial" },
  { value: "virtual", label: "Virtual" },
  { value: "hibrido", label: "Híbrido (Semipresencial)" },
]

const shifts = [
  { value: "mañana", label: "Mañana (7:00 - 1:00)" },
  { value: "tarde", label: "Tarde (1:00 - 7:00)" },
  { value: "noche", label: "Noche (6:00 - 10:00)" },
  { value: "completo", label: "Jornada Completa" },
  { value: "flexible", label: "Horario Flexible" },
]

const dependenceTypes = [
  { value: "nacional", label: "Nacional (MINEDU)" },
  { value: "regional", label: "Regional (UGEL)" },
  { value: "municipal", label: "Municipal" },
  { value: "privado", label: "Privado" },
  { value: "iglesia", label: "Iglesia / Religioso" },
  { value: "ong", label: "ONG / Fundación" },
]

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.06 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function DevInstitucionesPage() {
  const [institutions, setInstitutions] = React.useState<Institution[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [currentStep, setCurrentStep] = React.useState(1)
  const { toast } = useToast()
  const [saving, setSaving] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [plans, setPlans] = React.useState<{ id: string; name: string; price: number }[]>([])
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [searchModalQuery, setSearchModalQuery] = React.useState("")
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const [filterSize, setFilterSize] = React.useState({ width: 0, height: 0 })
  const filterContentRef = React.useRef<HTMLDivElement>(null)
  const filterContainerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => { fetchPlans() }, [])

  React.useLayoutEffect(() => {
    if (filtersOpen && filterContentRef.current) {
      const el = filterContentRef.current
      setFilterSize({ width: el.offsetWidth, height: el.offsetHeight })
    }
  }, [filtersOpen])

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
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === "Escape") setSearchOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  const fetchPlans = async () => {
    try { const res = await fetch("/api/dev/planes"); if (res.ok) setPlans(await res.json()) } catch {}
  }

  const fetchNextCode = async () => {
    try {
      const res = await fetch("/api/dev/institutions/next-code")
      if (res.ok) {
        const data = await res.json()
        setForm(prev => ({ ...prev, code: data.code }))
      }
    } catch {}
  }

  const [form, setForm] = React.useState({
    name: "", code: "", type: "", level: "", modality: "", shift: "", dependence: "",
    department: "", province: "", district: "", address: "", reference: "",
    phone: "", phone2: "", email: "", website: "",
    director_name: "", director_dni: "", director_phone: "", director_email: "",
    total_students: "", total_teachers: "", total_classrooms: "",
    has_lab: false, has_library: false, has_computer_room: false, has_playground: false,
    notes: "", plan_id: "",
  })

  const [scheduleConfig, setScheduleConfig] = React.useState({
    general_start: "07:00",
    general_end: "13:00",
    weekdays: [1, 2, 3, 4, 5],
    turnos: [] as Turno[],
  })

  const [selectedDepartment, setSelectedDepartment] = React.useState<Department | null>(null)
  const [selectedProvince, setSelectedProvince] = React.useState<Province | null>(null)
  const [createdCredentials, setCreatedCredentials] = React.useState<{
    email: string
    password: string
    name: string
  } | null>(null)
  const [selectedInst, setSelectedInst] = React.useState<Institution | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null)
  const [cleanConfirm, setCleanConfirm] = React.useState<string | null>(null)
  const [cleaning, setCleaning] = React.useState(false)

  React.useEffect(() => { fetchInstitutions() }, [])

  React.useEffect(() => {
    setForm(prev => ({ ...prev, province: "", district: "" }))
    setSelectedProvince(null)
  }, [form.department])

  React.useEffect(() => {
    setForm(prev => ({ ...prev, district: "" }))
  }, [form.province])

  const fetchInstitutions = async () => {
    try {
      const res = await fetch("/api/dev/institutions")
      if (res.ok) {
        const data = await res.json()
        setInstitutions(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/dev/institutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, schedule_config: scheduleConfig }),
      })
      const data = await res.json()
      if (res.ok) {
        if (data.director) {
          setCreatedCredentials(data.director)
        }
        setDialogOpen(false)
        setCurrentStep(1)
        resetForm()
        fetchInstitutions()
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
      const res = await fetch(`/api/dev/institutions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        fetchInstitutions()
        if (selectedInst?.id === id) {
          setSelectedInst(prev => prev ? { ...prev, status: newStatus } as Institution : null)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const deleteInstitution = async (id: string) => {
    try {
      const res = await fetch(`/api/dev/institutions/${id}`, { method: "DELETE" })
      if (res.ok) {
        setDeleteConfirm(null)
        setSelectedInst(null)
        fetchInstitutions()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const cleanInstitution = async (id: string) => {
    setCleaning(true)
    try {
      const res = await fetch(`/api/dev/institutions/${id}/clean`, { method: "POST", credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        toast(`BD limpiada. ${data.deleted} registros eliminados.`, "success")
        setCleanConfirm(null)
        setSelectedInst(null)
        fetchInstitutions()
      } else {
        const data = await res.json()
        toast(data.error || "Error al limpiar", "error")
      }
    } catch (e) { console.error(e); toast("Error de conexión", "error") }
    finally { setCleaning(false) }
  }

  const resetForm = () => {
    setForm({
      name: "", code: "", type: "", level: "", modality: "", shift: "", dependence: "",
      department: "", province: "", district: "", address: "", reference: "",
      phone: "", phone2: "", email: "", website: "",
      director_name: "", director_dni: "", director_phone: "", director_email: "",
      total_students: "", total_teachers: "", total_classrooms: "",
      has_lab: false, has_library: false, has_computer_room: false, has_playground: false,
      notes: "", plan_id: "",
    })
    setScheduleConfig({
      general_start: "07:00",
      general_end: "13:00",
      weekdays: [1, 2, 3, 4, 5],
      turnos: [],
    })
    setSelectedDepartment(null)
    setSelectedProvince(null)
  }

  const departmentsList = departments.map(d => d.name)
  const provincesList = selectedDepartment?.provinces.map(p => p.name) || []
  const districtsList = selectedProvince?.districts || []

  const filteredInstitutions = institutions.filter(inst => {
    const matchesSearch = !search ||
      inst.name?.toLowerCase().includes(search.toLowerCase()) ||
      inst.code?.toLowerCase().includes(search.toLowerCase()) ||
      inst.district?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || inst.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const searchResults = institutions.filter(inst => {
    const q = searchModalQuery.trim().toLowerCase()
    if (!q) return true
    return (
      inst.name?.toLowerCase().includes(q) ||
      inst.code?.toLowerCase().includes(q) ||
      inst.district?.toLowerCase().includes(q) ||
      inst.province?.toLowerCase().includes(q) ||
      inst.department?.toLowerCase().includes(q)
    )
  }).slice(0, 8)

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100
  const activeCount = institutions.filter(i => i.status === "active").length
  const totalStudents = institutions.reduce((sum, i) => sum + (i.total_students || 0), 0)
  const totalTeachers = institutions.reduce((sum, i) => sum + (i.total_teachers || 0), 0)
  const withPlan = institutions.filter(i => i.plan_name).length
  const activeFilterCount = statusFilter !== "all" ? 1 : 0

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="w-full space-y-6 py-1"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="relative overflow-hidden rounded-3xl bg-sb-on-surface p-6 md:p-8 text-sb-surface">
        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Instituciones</h1>
            <p className="text-sm mt-1 text-sb-surface/80">Gestión de instituciones educativas del sistema</p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sb-surface/15 backdrop-blur-sm text-xs font-medium">
                <CircleDot className="h-3 w-3" />
                {institutions.length} total
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sb-surface/15 backdrop-blur-sm text-xs font-medium">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {activeCount} activas
              </div>
            </div>
          </div>
          <SbBtn
            variant="tonal"
            size="sm"
            rounded
            onClick={() => { fetchNextCode(); setDialogOpen(true) }}
            className="!bg-sb-surface/15 !text-sb-surface hover:!bg-sb-surface/25 backdrop-blur-sm w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4" />
            Nueva Institución
          </SbBtn>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: institutions.length, icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Activas", value: activeCount, icon: Power, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Alumnos", value: totalStudents.toLocaleString(), icon: Users, color: "text-violet-500", bg: "bg-violet-500/10" },
          { label: "Con Plan", value: withPlan, icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10" },
        ].map((stat) => (
          <div key={stat.label} className="bg-sb-surface rounded-2xl p-4 border border-sb-outline-variant/10 md-anim-card-in">
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-8 w-8 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-xl font-bold text-sb-on-surface">{stat.value}</p>
            <p className="text-[11px] text-sb-on-surface/70 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Search + Filters */}
      <motion.div variants={fadeUp} className="space-y-3">
        <div className="bg-sb-surface rounded-2xl p-3 border border-sb-outline-variant/10">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <div className="relative w-full">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="h-11 w-full pl-11 pr-10 rounded-xl bg-sb-surface-container flex items-center text-[14px] text-sb-on-surface/60 border border-transparent hover:bg-sb-surface-container-high focus:outline-none focus:ring-2 focus:ring-sb-primary/30 transition-colors"
              >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface/50 pointer-events-none" />
                <span className="truncate">Buscar por nombre, código o distrito...</span>
                <kbd className="hidden sm:inline-flex ml-auto items-center gap-1 px-1.5 h-5 rounded-md bg-sb-surface-container-high text-[10px] font-medium text-sb-on-surface/50 border border-sb-outline-variant/20">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Filter Button */}
            <div ref={filterContainerRef} className="relative shrink-0 self-start md:self-auto">
              <motion.div
                className="relative z-50 overflow-hidden shadow-2xl shadow-black/20"
                style={{ transformOrigin: "top right", backgroundColor: "var(--sb-surface-container)" }}
                animate={{
                  width: filtersOpen ? Math.max(Math.min(filterSize.width, window.innerWidth - 32), 168) : 168,
                  height: filtersOpen ? Math.max(filterSize.height, 44) : 44,
                  borderRadius: filtersOpen ? 16 : 12,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 26, mass: 0.9 }}
              >
                <motion.button
                  type="button"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  animate={{
                    left: filtersOpen ? Math.max(Math.min(filterSize.width, window.innerWidth - 32) - 18, 0) : 0,
                    top: filtersOpen ? Math.max(filterSize.height - 18, 0) : 0,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 26, mass: 0.9 }}
                  className="absolute flex items-center gap-2 pr-4 pl-4 h-11 text-sm font-medium z-20"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filtros</span>
                  {activeFilterCount > 0 && (
                    <span className="h-5 min-w-5 px-1.5 rounded-full bg-[var(--sb-primary)] text-[var(--sb-on-primary)] text-[10px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                  <motion.div animate={{ rotate: filtersOpen ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {filtersOpen && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <div ref={filterContentRef} className="w-72 max-w-[calc(100vw_-_2rem)] p-4">
                        <motion.div
                          initial="hidden"
                          animate="show"
                          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.035, delayChildren: 0.05 } } }}
                          className="space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-sb-on-surface">Filtros de búsqueda</p>
                            <button onClick={() => setFiltersOpen(false)} className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-sb-surface-container-high transition-colors">
                              <X className="h-3.5 w-3.5 text-sb-on-surface/60" />
                            </button>
                          </div>

                          {/* Estado */}
                          <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } } }}>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-sb-on-surface/60 mb-2">Estado</p>
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
                                        : "text-sb-on-surface/80 border-transparent hover:bg-sb-surface-container-high"
                                    }`}
                                  >
                                    {label}
                                    {active && (
                                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.8 }} className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[var(--sb-primary)] flex items-center justify-center">
                                        <Check className="h-2.5 w-2.5 text-[var(--sb-on-primary)]" />
                                      </motion.div>
                                    )}
                                  </motion.button>
                                )
                              })}
                            </div>
                          </motion.div>

                          {/* Footer */}
                          <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } } }} className="flex gap-2 pt-2 border-t border-sb-outline-variant/10">
                            {activeFilterCount > 0 && (
                              <button onClick={() => setStatusFilter("all")} className="flex-1 px-3 py-2 rounded-xl text-xs font-medium text-sb-on-surface/80 hover:bg-sb-surface-container-high transition-colors border border-sb-outline-variant/20">
                                Limpiar
                              </button>
                            )}
                            <button onClick={() => setFiltersOpen(false)} className="flex-1 px-3 py-2 rounded-xl text-xs font-medium bg-sb-on-surface text-sb-surface hover:opacity-90 transition-opacity">
                              Aplicar
                            </button>
                          </motion.div>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>

        {(search || activeFilterCount > 0) && (
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-sb-on-surface/70">
              <span className="text-sb-on-surface font-medium">{filteredInstitutions.length}</span> de {institutions.length} instituciones
            </p>
            <button
              type="button"
              onClick={() => { setSearch(""); setStatusFilter("all") }}
              className="text-xs text-[var(--sb-primary)] hover:underline"
            >
              Limpiar
            </button>
          </div>
        )}
      </motion.div>

      {/* Institutions List */}
      <motion.div variants={fadeUp} className="space-y-2">
        {filteredInstitutions.map((inst, idx) => {
          const TypeIcon = typeIcons[inst.type] || Building2
          const gradient = typeColors[inst.type] || "from-gray-500 to-gray-600"
          return (
            <motion.button
              key={inst.id}
              variants={fadeUp}
              whileHover={{ x: 2, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedInst(inst)}
              className="w-full group bg-sb-surface rounded-2xl p-4 border border-sb-outline-variant/10 hover:border-sb-outline-variant/25 transition-all duration-200 text-left md-anim-card-in"
            >
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
                  <TypeIcon className="h-5 w-5 text-sb-surface" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-sb-on-surface truncate">{inst.name}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] font-mono text-sb-on-surface/70 bg-sb-surface-container-high/80 px-1.5 py-0.5 rounded-md">{inst.code}</span>
                    {inst.district && (
                      <span className="text-[11px] text-sb-on-surface/60 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {inst.district}
                      </span>
                    )}
                    {inst.total_students > 0 && (
                      <span className="text-[11px] text-sb-on-surface/60 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {inst.total_students}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  {inst.plan_name && (
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--sb-primary)]/10 text-[var(--sb-primary)] font-semibold hidden sm:block">
                      {inst.plan_name}
                    </span>
                  )}
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                    inst.status === "active"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-sb-surface-container-high text-sb-on-surface/60"
                  }`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${inst.status === "active" ? "bg-emerald-500" : "bg-sb-on-surface/50"}`} />
                    {inst.status === "active" ? "Activa" : "Inactiva"}
                  </div>
                  <ChevronRight className="h-4 w-4 text-sb-on-surface/40 group-hover:text-sb-on-surface/70 transition-colors" />
                </div>
              </div>
            </motion.button>
          )
        })}
        {!loading && filteredInstitutions.length === 0 && (
          <div className="bg-sb-surface rounded-3xl border border-sb-outline-variant/10 px-5 py-16 text-center">
            <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-[var(--sb-primary)]/10 to-[var(--sb-primary)]/5 flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-7 w-7 text-[var(--sb-primary)]/50" />
            </div>
            <p className="text-sm font-medium text-sb-on-surface/70">
              {search ? "Sin resultados para tu búsqueda" : "Sin instituciones registradas"}
            </p>
            <p className="text-xs text-sb-on-surface/60 mt-1.5 max-w-xs mx-auto">
              {search ? "Intenta con otros términos" : "Crea tu primera institución para comenzar a gestionar el sistema"}
            </p>
            {!search && (
              <SbBtn variant="filled" size="sm" rounded onClick={() => { fetchNextCode(); setDialogOpen(true) }} className="mt-5">
                <Plus className="h-4 w-4" />
                Crear Institución
              </SbBtn>
            )}
          </div>
        )}
      </motion.div>

      {/* Create Institution Modal */}
      <SbModal open={dialogOpen} onClose={() => { setDialogOpen(false); setCurrentStep(1) }} maxWidth="sm:max-w-[500px]">
        <SbModalHeader title="Crear Institución" onClose={() => { setDialogOpen(false); setCurrentStep(1) }} />
        <SbModalBody className="max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[var(--sb-on-surface-variant)]">
              Paso {currentStep} de {totalSteps}
            </p>
            <p className="text-xs font-medium text-[var(--sb-primary)]">{Math.round(progress)}%</p>
          </div>
          <div className="w-full bg-[var(--sb-surface-container)] rounded-full h-1.5 mb-4 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-[var(--sb-primary)] to-[var(--sb-primary)]/80 h-1.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>

          {/* Step 1: Datos Generales */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-3 py-2"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--sb-primary)]">
                <Building2 className="h-3.5 w-3.5" />
                Datos Generales
              </div>

              <div className="space-y-2">
                <SbLabel htmlFor="name" className="text-xs">Nombre *</SbLabel>
                <SbInput
                  id="name"
                  placeholder="IEP Ricardo Palma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <SbLabel htmlFor="code">Código del Colegio *</SbLabel>
                  <SbInput
                    id="code"
                    value={form.code}
                    className="rounded-xl bg-sb-surface-container-high/50"
                    readOnly
                  />
                  <p className="text-[11px] text-sb-on-surface-variant/70">Código automático secuencial (COL-01, COL-02...)</p>
                </div>
                <div className="space-y-2">
                  <SbLabel htmlFor="type">Tipo de Institución *</SbLabel>
                  <select
                    className="sb-select w-full rounded-xl"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="">Seleccionar tipo...</option>
                    {institutionTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <SbLabel htmlFor="level">Nivel Educativo *</SbLabel>
                  <select
                    className="sb-select w-full rounded-xl"
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                  >
                    <option value="">Seleccionar nivel...</option>
                    {institutionLevels.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <SbLabel htmlFor="modality">Modalidad</SbLabel>
                  <select
                    className="sb-select w-full rounded-xl"
                    value={form.modality}
                    onChange={(e) => setForm({ ...form, modality: e.target.value })}
                  >
                    <option value="">Seleccionar modalidad...</option>
                    {modalities.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <SbLabel htmlFor="shift">Turno General</SbLabel>
                  <select
                    className="sb-select w-full rounded-xl"
                    value={form.shift}
                    onChange={(e) => setForm({ ...form, shift: e.target.value })}
                  >
                    <option value="">Seleccionar turno...</option>
                    {shifts.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <SbLabel htmlFor="dependence">Dependencia</SbLabel>
                  <select
                    className="sb-select w-full rounded-xl"
                    value={form.dependence}
                    onChange={(e) => setForm({ ...form, dependence: e.target.value })}
                  >
                    <option value="">Seleccionar dependencia...</option>
                    {dependenceTypes.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Configuración de Horarios */}
              <div className="p-4 rounded-xl border border-[var(--sb-outline)]/30 bg-[var(--sb-surface-container)]/50 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--sb-primary)]">
                  <Clock className="h-3.5 w-3.5" />
                  Configuración de Horarios
                </div>

                {/* Horario General */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <SbLabel className="text-[11px]">Hora Inicio Jornada</SbLabel>
                    <input
                      type="time"
                      value={scheduleConfig.general_start}
                      onChange={(e) => setScheduleConfig({ ...scheduleConfig, general_start: e.target.value })}
                      className="sb-select w-full rounded-lg text-[13px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <SbLabel className="text-[11px]">Hora Fin Jornada</SbLabel>
                    <input
                      type="time"
                      value={scheduleConfig.general_end}
                      onChange={(e) => setScheduleConfig({ ...scheduleConfig, general_end: e.target.value })}
                      className="sb-select w-full rounded-lg text-[13px]"
                    />
                  </div>
                </div>

                {/* Días de la semana */}
                <div className="space-y-1.5">
                  <SbLabel className="text-[11px]">Días de Clase</SbLabel>
                  <div className="flex gap-1.5">
                    {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => {
                      const dayNum = i + 1
                      const active = scheduleConfig.weekdays.includes(dayNum)
                      return (
                        <button
                          key={dayNum}
                          type="button"
                          onClick={() => {
                            const weekdays = active
                              ? scheduleConfig.weekdays.filter(d => d !== dayNum)
                              : [...scheduleConfig.weekdays, dayNum].sort()
                            setScheduleConfig({ ...scheduleConfig, weekdays })
                          }}
                          className={`h-8 w-8 rounded-lg text-[11px] font-medium transition-all ${
                            active
                              ? "bg-[var(--sb-primary)] text-[var(--sb-on-primary)]"
                              : "bg-[var(--sb-surface-container-high)] text-sb-on-surface-variant/70 hover:bg-[var(--sb-surface-container-highest)]"
                          }`}
                        >
                          {d}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Turnos */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <SbLabel className="text-[11px]">Turnos (opcional)</SbLabel>
                    <button
                      type="button"
                      onClick={() => setScheduleConfig({
                        ...scheduleConfig,
                        turnos: [...scheduleConfig.turnos, { name: "", start: "07:00", end: "13:00", grades: [] }],
                      })}
                      className="flex items-center gap-1 text-[11px] text-[var(--sb-primary)] hover:underline"
                    >
                      <Plus className="h-3 w-3" /> Agregar turno
                    </button>
                  </div>

                  {scheduleConfig.turnos.length === 0 && (
                    <p className="text-[11px] text-sb-on-surface-variant/60 py-2">
                      Sin turnos definidos. La jornada completa usará el horario general.
                    </p>
                  )}

                  {scheduleConfig.turnos.map((turno, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-[var(--sb-outline)]/20 bg-[var(--sb-surface)] space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Nombre turno (ej: Mañana)"
                          value={turno.name}
                          onChange={(e) => {
                            const turnos = [...scheduleConfig.turnos]
                            turnos[idx] = { ...turnos[idx], name: e.target.value }
                            setScheduleConfig({ ...scheduleConfig, turnos })
                          }}
                          className="flex-1 bg-transparent text-[13px] font-medium outline-none placeholder:text-sb-on-surface-variant/50"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const turnos = scheduleConfig.turnos.filter((_, i) => i !== idx)
                            setScheduleConfig({ ...scheduleConfig, turnos })
                          }}
                          className="p-1 rounded-md hover:bg-red-500/10 text-red-500/60 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] text-sb-on-surface-variant/60">Inicio</span>
                          <input
                            type="time"
                            value={turno.start}
                            onChange={(e) => {
                              const turnos = [...scheduleConfig.turnos]
                              turnos[idx] = { ...turnos[idx], start: e.target.value }
                              setScheduleConfig({ ...scheduleConfig, turnos })
                            }}
                            className="sb-select w-full rounded-lg text-[12px] py-1"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-sb-on-surface-variant/60">Fin</span>
                          <input
                            type="time"
                            value={turno.end}
                            onChange={(e) => {
                              const turnos = [...scheduleConfig.turnos]
                              turnos[idx] = { ...turnos[idx], end: e.target.value }
                              setScheduleConfig({ ...scheduleConfig, turnos })
                            }}
                            className="sb-select w-full rounded-lg text-[12px] py-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-sb-on-surface-variant/60">Grados</span>
                        <div className="flex flex-wrap gap-1">
                          {["1ro", "2do", "3ro", "4to", "5to", "6to"].map(g => {
                            const active = turno.grades.includes(g)
                            return (
                              <button
                                key={g}
                                type="button"
                                onClick={() => {
                                  const turnos = [...scheduleConfig.turnos]
                                  const grades = active
                                    ? turnos[idx].grades.filter(gr => gr !== g)
                                    : [...turnos[idx].grades, g]
                                  turnos[idx] = { ...turnos[idx], grades }
                                  setScheduleConfig({ ...scheduleConfig, turnos })
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                                  active
                                    ? "bg-[var(--sb-primary)]/15 text-[var(--sb-primary)]"
                                    : "bg-[var(--sb-surface-container-high)] text-sb-on-surface-variant/60"
                                }`}
                              >
                                {g}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Ubicación */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4 py-2"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--sb-primary)]">
                <MapPin className="h-3.5 w-3.5" />
                Ubicación
              </div>

              <div className="space-y-2">
                <SbLabel>Departamento *</SbLabel>
                <select
                  className="sb-select w-full rounded-xl"
                  value={form.department}
                  onChange={(e) => {
                    const dept = departments.find(d => d.name === e.target.value)
                    setSelectedDepartment(dept || null)
                    setForm({ ...form, department: e.target.value })
                  }}
                >
                  <option value="">Seleccionar departamento...</option>
                  {departmentsList.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <SbLabel>Provincia *</SbLabel>
                <select
                  className="sb-select w-full rounded-xl"
                  value={form.province}
                  onChange={(e) => {
                    const prov = selectedDepartment?.provinces.find(p => p.name === e.target.value)
                    setSelectedProvince(prov || null)
                    setForm({ ...form, province: e.target.value })
                  }}
                  disabled={!form.department}
                >
                  <option value="">{form.department ? "Seleccionar provincia..." : "Primero seleccione departamento"}</option>
                  {provincesList.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <SbLabel>Distrito *</SbLabel>
                <select
                  className="sb-select w-full rounded-xl"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  disabled={!form.province}
                >
                  <option value="">{form.province ? "Seleccionar distrito..." : "Primero seleccione provincia"}</option>
                  {districtsList.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <SbLabel htmlFor="address">Dirección Completa *</SbLabel>
                <SbInput
                  id="address"
                  placeholder="Av. Los Álamos 1234, Urb. Los Olivos"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <SbLabel htmlFor="reference">Referencia</SbLabel>
                <SbInput
                  id="reference"
                  placeholder="Frente al parque, al lado de la farmacia"
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              {form.department && form.province && form.district && (
                <div className="p-3 rounded-xl bg-[var(--sb-primary)]/5 border border-[var(--sb-primary)]/20 md-anim-card-in">
                  <p className="text-sm text-[var(--sb-primary)] font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {form.district}, {form.province}, {form.department}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 3: Contacto y Director */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 py-2"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--sb-primary)] mb-2">
                  <Phone className="h-3.5 w-3.5" />
                  Contacto
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <SbLabel htmlFor="phone">Teléfono Principal *</SbLabel>
                    <SbInput
                      id="phone"
                      placeholder="(01) 555-1234"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <SbLabel htmlFor="phone2">Teléfono Secundario</SbLabel>
                    <SbInput
                      id="phone2"
                      placeholder="(01) 555-5678"
                      value={form.phone2}
                      onChange={(e) => setForm({ ...form, phone2: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <SbLabel htmlFor="email">Email Institucional *</SbLabel>
                    <div className="flex gap-2">
                      <SbInput
                        id="email"
                        type="email"
                        placeholder="direccion@ejemplo.pe"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="rounded-xl flex-1"
                      />
                      {form.name && (
                        <button
                          type="button"
                          className="sb-btn tonal text-xs whitespace-nowrap"
                          onClick={() => {
                            const clean = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z\s]/g, "").trim()
                            const slug = clean(form.name).replace(/\s+/g, "").slice(0, 20)
                            setForm({ ...form, email: `direccion@${slug}.pe` })
                          }}
                        >
                          Auto
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <SbLabel htmlFor="website">Sitio Web</SbLabel>
                    <SbInput
                      id="website"
                      placeholder="https://iep-ricardo.edu.pe"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--sb-primary)] mb-2">
                  <GraduationCap className="h-4 w-4" />
                  Director(a) / Rector(a)
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <SbLabel htmlFor="director_name">Nombre Completo *</SbLabel>
                    <SbInput
                      id="director_name"
                      placeholder="Juan Carlos Pérez López"
                      value={form.director_name}
                      onChange={(e) => setForm({ ...form, director_name: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <SbLabel htmlFor="director_dni">DNI *</SbLabel>
                      <SbInput
                        id="director_dni"
                        placeholder="12345678"
                        value={form.director_dni}
                        onChange={(e) => setForm({ ...form, director_dni: e.target.value })}
                        className="rounded-xl"
                        maxLength={8}
                      />
                    </div>
                    <div className="space-y-2">
                      <SbLabel htmlFor="director_phone">Teléfono</SbLabel>
                      <SbInput
                        id="director_phone"
                        placeholder="999 888 777"
                        value={form.director_phone}
                        onChange={(e) => setForm({ ...form, director_phone: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <SbLabel htmlFor="director_email">Email</SbLabel>
                    <SbInput
                      id="director_email"
                      type="email"
                      placeholder="director@ejemplo.com"
                      value={form.director_email}
                      onChange={(e) => setForm({ ...form, director_email: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Infraestructura y Confirmación */}
          {currentStep === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 py-2"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--sb-primary)] mb-2">
                  <FileText className="h-4 w-4" />
                  Infraestructura y Capacidad
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <SbLabel htmlFor="total_students">Total Alumnos</SbLabel>
                    <SbInput
                      id="total_students"
                      type="number"
                      placeholder="450"
                      value={form.total_students}
                      onChange={(e) => setForm({ ...form, total_students: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <SbLabel htmlFor="total_teachers">Total Docentes</SbLabel>
                    <SbInput
                      id="total_teachers"
                      type="number"
                      placeholder="25"
                      value={form.total_teachers}
                      onChange={(e) => setForm({ ...form, total_teachers: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <SbLabel htmlFor="total_classrooms">Aulas</SbLabel>
                    <SbInput
                      id="total_classrooms"
                      type="number"
                      placeholder="18"
                      value={form.total_classrooms}
                      onChange={(e) => setForm({ ...form, total_classrooms: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { key: "has_lab", label: "Laboratorio", icon: Dumbbell },
                    { key: "has_library", label: "Biblioteca", icon: Library },
                    { key: "has_computer_room", label: "Sala de Cómputo", icon: Monitor },
                    { key: "has_playground", label: "Patio Deportivo", icon: Dumbbell },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all md-anim-card-in ${
                        (form as any)[item.key]
                          ? "border-[var(--sb-primary)] bg-[var(--sb-primary)]/5"
                          : "border-[var(--sb-outline)] hover:border-[var(--sb-outline)]/80"
                      }`}
                    >
                      <div
                        className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                          (form as any)[item.key]
                            ? "bg-[var(--sb-primary)] border-[var(--sb-primary)]"
                            : "border-[var(--sb-outline)]"
                        }`}
                        onClick={() => setForm({ ...form, [item.key]: !(form as any)[item.key] })}
                      >
                        {(form as any)[item.key] && <Check className="h-3 w-3 text-[var(--sb-on-surface)]" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <item.icon className="h-3.5 w-3.5 text-sb-on-surface-variant/70" />
                        <span className="text-sm">{item.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <SbLabel htmlFor="notes">Observaciones</SbLabel>
                <SbTextarea
                  id="notes"
                  placeholder="Notas adicionales sobre la institución..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="rounded-xl min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <SbLabel>Plan de suscripción</SbLabel>
                <select value={form.plan_id} onChange={e => setForm({...form, plan_id: e.target.value})} className="sb-select w-full rounded-xl">
                  <option value="">Sin plan asignado</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — S/ {Number(p.price).toFixed(2)}/mes</option>
                  ))}
                </select>
              </div>

              {/* Resumen */}
              <div className="p-4 rounded-xl bg-[var(--sb-surface-container)]/80 border border-[var(--sb-outline)]/50 md-anim-card-in">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[var(--sb-primary)]" />
                  Resumen
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-sb-on-surface-variant/70">Nombre:</span> {form.name || "—"}</div>
                  <div><span className="text-sb-on-surface-variant/70">Tipo:</span> {institutionTypes.find(t => t.value === form.type)?.label || "—"}</div>
                  <div><span className="text-sb-on-surface-variant/70">Nivel:</span> {institutionLevels.find(l => l.value === form.level)?.label || "—"}</div>
                  <div><span className="text-sb-on-surface-variant/70">Modalidad:</span> {modalities.find(m => m.value === form.modality)?.label || "—"}</div>
                  <div><span className="text-sb-on-surface-variant/70">Turno:</span> {shifts.find(s => s.value === form.shift)?.label || "—"}</div>
                  <div><span className="text-sb-on-surface-variant/70">Horario:</span> {scheduleConfig.general_start} - {scheduleConfig.general_end}</div>
                  <div><span className="text-sb-on-surface-variant/70">Días:</span> {scheduleConfig.weekdays.map(d => ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][d]).join(", ")}</div>
                  {scheduleConfig.turnos.length > 0 && (
                    <div className="col-span-2"><span className="text-sb-on-surface-variant/70">Turnos:</span> {scheduleConfig.turnos.map(t => `${t.name || "Sin nombre"} (${t.start}-${t.end})`).join(", ")}</div>
                  )}
                  <div className="col-span-2"><span className="text-sb-on-surface-variant/70">Ubicación:</span> {form.district && form.province && form.department ? `${form.district}, ${form.province}, ${form.department}` : "—"}</div>
                  <div className="col-span-2"><span className="text-sb-on-surface-variant/70">Director:</span> {form.director_name || "—"}</div>
                </div>
              </div>
            </motion.div>
          )}
        </SbModalBody>
        <SbModalFooter className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2 justify-between sm:justify-start w-full sm:w-auto">
            {currentStep > 1 && (
              <SbBtn variant="outlined" size="sm" rounded onClick={() => setCurrentStep(prev => prev - 1)}>
                Anterior
              </SbBtn>
            )}
            {currentStep < totalSteps && (
              <SbBtn variant="filled" size="sm" rounded onClick={() => setCurrentStep(prev => prev + 1)}>
                Siguiente
              </SbBtn>
            )}
          </div>
          {currentStep === totalSteps && (
            <div className="flex gap-2 w-full sm:w-auto">
              <SbBtn variant="outlined" size="sm" rounded onClick={() => { setDialogOpen(false); setCurrentStep(1) }}>
                Cancelar
              </SbBtn>
              <SbBtn variant="filled" size="sm" rounded onClick={handleCreate} disabled={saving || !form.name || !form.type}>
                {saving ? "Creando..." : "Crear Institución"}
              </SbBtn>
            </div>
          )}
        </SbModalFooter>
      </SbModal>

      {/* Credentials Dialog */}
      <SbModal open={!!createdCredentials} onClose={() => setCreatedCredentials(null)} maxWidth="sm:max-w-[450px]">
        <SbModalHeader title="Institución Creada" onClose={() => setCreatedCredentials(null)} />
        <SbModalBody>
          {createdCredentials && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3 md-anim-card-in">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  <p className="text-sm font-semibold text-emerald-500">Credenciales del Director</p>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-sb-on-surface-variant/70">Nombre</p>
                    <p className="text-sm font-mono font-medium">{createdCredentials.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-sb-on-surface-variant/70">Email</p>
                    <p className="text-sm font-mono font-medium">{createdCredentials.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-sb-on-surface-variant/70">Contraseña</p>
                    <p className="text-sm font-mono font-medium bg-black/5 dark:bg-[var(--sb-on-surface)]/5 px-2 py-1 rounded-lg inline-block">
                      {createdCredentials.password}
                    </p>
                  </div>
                </div>
              </div>
              <SbBtn variant="outlined" size="sm" rounded className="w-full" onClick={() => {
                navigator.clipboard.writeText(
                  `Email: ${createdCredentials.email}\nContraseña: ${createdCredentials.password}`
                )
                toast("Credenciales copiadas", "success")
              }}>
                <Copy className="h-4 w-4" />
                Copiar credenciales
              </SbBtn>
            </div>
          )}
        </SbModalBody>
      </SbModal>

      {/* Detail Dialog */}
      <SbModal open={!!selectedInst} onClose={() => setSelectedInst(null)} maxWidth="sm:max-w-[500px]">
        {selectedInst && (
          <>
            <SbModalHeader title={selectedInst.name} onClose={() => setSelectedInst(null)} />
            <SbModalBody className="max-h-[90vh] overflow-y-auto">
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <p className="text-xs text-sb-on-surface-variant/70 font-mono">{selectedInst.code}</p>
                <span className="text-[var(--sb-on-surface)]/10">·</span>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  selectedInst.status === "active"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-[var(--sb-on-surface)]/5 text-sb-on-surface-variant/60"
                }`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${selectedInst.status === "active" ? "bg-emerald-500" : "bg-sb-on-surface-variant/50"}`} />
                  {selectedInst.status === "active" ? "Activa" : "Inactiva"}
                </div>
                <span className="text-[var(--sb-on-surface)]/10">·</span>
                <span className="text-[11px] text-sb-on-surface-variant/70 capitalize">{selectedInst.type}</span>
              </div>

              <div className="space-y-3 py-3">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 md-anim-card-in">
                  <div className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 rounded-2xl p-4 text-center border border-violet-500/10">
                    <Users className="h-4 w-4 text-violet-500/60 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-[var(--sb-on-surface)]">{selectedInst.total_students || 0}</p>
                    <p className="text-[10px] text-sb-on-surface-variant/60 uppercase tracking-wider font-medium">Alumnos</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-2xl p-4 text-center border border-blue-500/10">
                    <GraduationCap className="h-4 w-4 text-blue-500/60 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-[var(--sb-on-surface)]">{selectedInst.total_teachers || 0}</p>
                    <p className="text-[10px] text-sb-on-surface-variant/60 uppercase tracking-wider font-medium">Docentes</p>
                  </div>
                </div>

                {/* Location */}
                {(selectedInst.department || selectedInst.province || selectedInst.district) && (
                  <div className="bg-[var(--sb-surface-container)] rounded-2xl p-4 border border-[var(--sb-outline-variant)]/10 md-anim-card-in">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-6 rounded-lg bg-rose-500/10 flex items-center justify-center">
                        <MapPin className="h-3.5 w-3.5 text-rose-500" />
                      </div>
                      <p className="text-[10px] text-sb-on-surface-variant/60 uppercase tracking-wider font-semibold">Ubicación</p>
                    </div>
                    <p className="text-sm text-[var(--sb-on-surface-variant)]/80">{[selectedInst.district, selectedInst.province, selectedInst.department].filter(Boolean).join(", ")}</p>
                    {selectedInst.address && (
                      <p className="text-xs text-sb-on-surface-variant/70 mt-1">{selectedInst.address}</p>
                    )}
                  </div>
                )}

                {/* Contact */}
                <div className="bg-[var(--sb-surface-container)] rounded-2xl p-4 border border-[var(--sb-outline-variant)]/10 md-anim-card-in">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Phone className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    <p className="text-[10px] text-sb-on-surface-variant/60 uppercase tracking-wider font-semibold">Contacto</p>
                  </div>
                  <div className="space-y-1.5">
                    {selectedInst.phone && (
                      <p className="text-sm text-[var(--sb-on-surface-variant)]/80 flex items-center gap-2">
                        <Phone className="h-3 w-3 text-sb-on-surface-variant/50" />
                        {selectedInst.phone}
                      </p>
                    )}
                    {selectedInst.email && (
                      <p className="text-xs text-sb-on-surface-variant/70 font-mono flex items-center gap-2">
                        <Mail className="h-3 w-3 text-sb-on-surface-variant/50" />
                        {selectedInst.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Director */}
                {selectedInst.director_name && (
                  <div className="bg-[var(--sb-surface-container)] rounded-2xl p-4 border border-[var(--sb-outline-variant)]/10 md-anim-card-in">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <GraduationCap className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                      <p className="text-[10px] text-sb-on-surface-variant/60 uppercase tracking-wider font-semibold">Director</p>
                    </div>
                    <p className="text-sm text-[var(--sb-on-surface-variant)]/80">{selectedInst.director_name}</p>
                    {selectedInst.director_dni && (
                      <p className="text-xs text-sb-on-surface-variant/70 mt-1 font-mono">DNI: {selectedInst.director_dni}</p>
                    )}
                  </div>
                )}

                {/* Plan */}
                <div className="bg-[var(--sb-surface-container)] rounded-2xl p-4 border border-[var(--sb-outline-variant)]/10 md-anim-card-in">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <FileText className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                    <p className="text-[10px] text-sb-on-surface-variant/60 uppercase tracking-wider font-semibold">Plan contratado</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--sb-on-surface)]">{selectedInst.plan_name || "Sin plan"}</p>
                    {selectedInst.plan_price !== undefined && selectedInst.plan_name && (
                      <span className="text-xs text-sb-on-surface-variant/70 font-mono">S/ {Number(selectedInst.plan_price).toFixed(2)}/mes</span>
                    )}
                  </div>
                  <div className="mt-2">
                    <select
                      value={selectedInst.plan_id || ""}
                      onChange={async (e) => {
                        const planId = e.target.value
                        const res = await fetch(`/api/dev/institutions/${selectedInst.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ plan_id: planId || null }),
                        })
                        if (res.ok) {
                          toast("Plan actualizado", "success")
                          const updated = await fetch(`/api/dev/institutions`).then(r => r.json())
                          setInstitutions(updated)
                          setSelectedInst(updated.find((i: Institution) => i.id === selectedInst.id) || null)
                        }
                      }}
                      className="sb-select w-full text-xs rounded-xl">
                      <option value="">Sin plan</option>
                      {plans.map(p => (
                        <option key={p.id} value={p.id}>{p.name} — S/ {Number(p.price).toFixed(2)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <SbBtn
                    variant={selectedInst.status === "active" ? "outlined" : "tonal"}
                    size="sm"
                    rounded
                    onClick={() => toggleStatus(selectedInst.id, selectedInst.status)}
                    className={`flex-1 w-full sm:w-auto ${selectedInst.status === "active" ? "text-amber-500 border-amber-500/30" : "text-emerald-500 bg-emerald-500/10"}`}
                  >
                    {selectedInst.status === "active" ? "Desactivar" : "Activar"}
                  </SbBtn>
                  <SbBtn
                    variant="outlined"
                    size="sm"
                    rounded
                    onClick={() => setCleanConfirm(selectedInst.id)}
                    className="flex-1 w-full sm:w-auto text-orange-500 border-orange-500/30"
                  >
                    Limpiar BD
                  </SbBtn>
                  <SbBtn
                    variant="danger"
                    size="sm"
                    rounded
                    onClick={() => setDeleteConfirm(selectedInst.id)}
                    className="flex-1 w-full sm:w-auto"
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
        <SbModalHeader title="Eliminar institución" onClose={() => setDeleteConfirm(null)} />
        <SbModalBody>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-3 md-anim-card-in">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm font-medium text-red-500">Acción irreversible</p>
          </div>
          <p className="text-xs text-[var(--sb-on-surface-variant)]/70">
            Se eliminará permanentemente la institución y todos sus datos asociados.
          </p>
        </SbModalBody>
        <SbModalFooter className="flex flex-col sm:flex-row gap-2">
          <SbBtn variant="outlined" size="sm" rounded onClick={() => setDeleteConfirm(null)} className="flex-1">Cancelar</SbBtn>
          <SbBtn variant="danger" size="sm" rounded onClick={() => deleteConfirm && deleteInstitution(deleteConfirm)} className="flex-1">Eliminar</SbBtn>
        </SbModalFooter>
      </SbModal>

      {/* Clean BD Confirmation */}
      <SbModal open={!!cleanConfirm} onClose={() => setCleanConfirm(null)} maxWidth="sm:max-w-[400px]">
        <SbModalHeader title="Limpiar base de datos" onClose={() => setCleanConfirm(null)} />
        <SbModalBody>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 mb-3 md-anim-card-in">
            <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
            <p className="text-sm font-medium text-orange-500">Acción irreversible</p>
          </div>
          <p className="text-xs text-[var(--sb-on-surface-variant)]/70 mb-2">
            Se eliminarán <strong className="text-[var(--sb-on-surface)]">TODOS</strong> los datos de esta institución:
          </p>
          <ul className="text-xs text-sb-on-surface-variant/70 space-y-1 list-disc list-inside">
            <li>Estudiantes y matrículas</li>
            <li>Padres y apoderados</li>
            <li>Usuarios (docentes, secretarios, etc.)</li>
            <li>Notificaciones y auditoría</li>
            <li>Documentos, cursos, tareas</li>
          </ul>
          <p className="text-xs text-sb-on-surface-variant/70 mt-3">
            La institución se mantendrá pero quedará vacía.
          </p>
        </SbModalBody>
        <SbModalFooter className="flex flex-col sm:flex-row gap-2">
          <SbBtn variant="outlined" size="sm" rounded onClick={() => setCleanConfirm(null)} className="flex-1" disabled={cleaning}>Cancelar</SbBtn>
          <SbBtn variant="danger" size="sm" rounded onClick={() => cleanConfirm && cleanInstitution(cleanConfirm)} className="flex-1" disabled={cleaning}>
            {cleaning ? "Limpiando..." : "Limpiar todo"}
          </SbBtn>
        </SbModalFooter>
      </SbModal>

      {/* Search Institutions Modal */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchOpen(false)}
            />
            <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[8vh] md:pt-[12vh] pointer-events-none">
              <motion.div
                className="w-full max-w-[600px] pointer-events-auto overflow-hidden"
                style={{
                  transformOrigin: "top center",
                  borderRadius: 20,
                  backgroundColor: "var(--sb-surface)",
                  border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 50%, transparent)",
                  boxShadow: "0 24px 60px -20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
                  backdropFilter: "blur(24px) saturate(160%)",
                  WebkitBackdropFilter: "blur(24px) saturate(160%)",
                }}
                initial={{ opacity: 0, scale: 0.96, y: -12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -12 }}
                transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.9 }}
              >
                <div className="relative p-3">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface/50 pointer-events-none" />
                  <input
                    autoFocus
                    placeholder="Buscar por nombre, código o distrito..."
                    value={searchModalQuery}
                    onChange={(e) => setSearchModalQuery(e.target.value)}
                    className="h-12 w-full pl-11 pr-4 rounded-xl bg-sb-surface-container/60 text-[14px] text-sb-on-surface placeholder:text-sb-on-surface/50 border border-transparent focus:outline-none focus:ring-2 focus:ring-sb-primary/30"
                  />
                </div>
                <div className="max-h-[55vh] overflow-y-auto px-2 pb-2">
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-14 text-center">
                      <Building2 className="h-8 w-8 text-[var(--sb-primary)]/40 mx-auto mb-3" />
                      <p className="text-sm font-medium text-sb-on-surface/70">
                        {searchModalQuery ? "Sin resultados" : "Escribe para buscar"}
                      </p>
                      <p className="text-xs text-sb-on-surface/60 mt-1">
                        {searchModalQuery ? "Prueba con otro término" : "Busca instituciones por nombre, código o ubicación"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {searchResults.map((inst) => {
                        const TypeIcon = typeIcons[inst.type] || Building2
                        const gradient = typeColors[inst.type] || "from-gray-500 to-gray-600"
                        return (
                          <button
                            key={inst.id}
                            type="button"
                            onClick={() => {
                              setSearchModalQuery("")
                              setSearchOpen(false)
                              setSelectedInst(inst)
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-xl hover:bg-sb-surface-container/70 transition-colors md-anim-card-in"
                          >
                            <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
                              <TypeIcon className="h-4 w-4 text-sb-surface" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold text-sb-on-surface truncate">{inst.name}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-[10px] font-mono text-sb-on-surface/60 bg-sb-surface-container/70 px-1.5 py-0.5 rounded-md border border-sb-outline-variant/10">
                                  {inst.code}
                                </span>
                                {inst.district && (
                                  <span className="text-[11px] text-sb-on-surface/60 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {inst.district}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                inst.status === "active"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-sb-surface-container text-sb-on-surface/60"
                              }`}>
                                <div className={`h-1.5 w-1.5 rounded-full ${inst.status === "active" ? "bg-emerald-500" : "bg-sb-on-surface/50"}`} />
                                {inst.status === "active" ? "Activa" : "Inactiva"}
                              </div>
                              <ChevronRight className="h-4 w-4 text-sb-on-surface/40" />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="px-4 py-2.5 border-t border-sb-outline-variant/10 flex items-center justify-between text-[11px] text-sb-on-surface/50">
                  <span>{searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""}</span>
                  <div className="hidden sm:flex items-center gap-1.5">
                    <kbd className="px-1.5 h-4 rounded bg-sb-surface-container/70 border border-sb-outline-variant/20">Esc</kbd>
                    <span>para cerrar</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
