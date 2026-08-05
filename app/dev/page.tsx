"use client"

import * as React from "react"
import Link from "next/link"
import { Building2, Users, Database, Terminal, ArrowUpRight, X, Download, Eye, Server, CreditCard, Shield, Check, GraduationCap, Zap, Globe, Mail, Phone, ChevronRight, Sparkles, Printer, CreditCard as CreditCardIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { SbDropdown, SbDropdownItem } from "@/components/ui/sb"
import "@/styles/animations.css"

interface Stats {
  institutions: number
  users: number
  students: number
  tables: number
}

interface UserData {
  fullName: string
  email: string
  dni: string
}

interface Plan {
  id: string
  name: string
  description: string | null
  price: number
  max_students: number
  max_users: number
  features: any
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function DevDashboard() {
  const [stats, setStats] = React.useState<Stats>({ institutions: 0, users: 0, students: 0, tables: 0 })
  const [loading, setLoading] = React.useState(true)
  const [downloadingCarnet, setDownloadingCarnet] = React.useState(false)
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [userData, setUserData] = React.useState<UserData | null>(null)
  const [plans, setPlans] = React.useState<Plan[]>([])

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, plansRes] = await Promise.all([
          fetch("/api/dev/stats"),
          fetch("/api/dev/planes"),
        ])
        if (statsRes.ok) setStats(await statsRes.json())
        if (plansRes.ok) setPlans(await plansRes.json())
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/dev/me")
      if (res.ok) {
        const data = await res.json()
        setUserData(data.user)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handlePreview = async () => {
    await fetchUserData()
    setPreviewOpen(true)
  }

  const handleDownloadCarnet = async () => {
    setDownloadingCarnet(true)
    try {
      const res = await fetch('/api/dev/carnet')
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'carnet-dev.pdf'
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (e) {
      console.error('Error downloading carnet:', e)
    } finally {
      setDownloadingCarnet(false)
    }
  }

  const statCards = [
    { label: "Instituciones", value: stats.institutions, icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Usuarios", value: stats.users, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Estudiantes", value: stats.students, icon: GraduationCap, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Tablas", value: stats.tables, icon: Database, color: "text-amber-500", bg: "bg-amber-500/10" },
  ]

  const actions = [
    { label: "Crear institución", desc: "Registrar un nuevo colegio", href: "/dev/instituciones", icon: Building2 },
    { label: "Crear usuario", desc: "Agregar un nuevo usuario con rol", href: "/dev/usuarios", icon: Users },
    { label: "Gestionar planes", desc: "Administrar planes de suscripción", href: "/dev/planes", icon: CreditCard },
    { label: "Ejecutar SQL", desc: "Acceso directo a la base de datos", href: "/dev/database", icon: Terminal },
  ]

  const landingPlans = [
    {
      name: "Básico",
      description: "Para colegios pequeños (hasta 200 alumnos)",
      monthly: 199,
      annual: 149,
      maxStudents: 200,
      features: [
        "Hasta 200 estudiantes",
        "Gestión de notas y asistencia",
        "Portal de padres básico",
        "Reportes del MINEDU",
        "Soporte por correo",
        "Actualizaciones incluidas",
      ],
      color: "border-sb-outline-variant/20",
      bg: "bg-sb-surface",
    },
    {
      name: "Profesional",
      description: "Para colegios medianos (hasta 1,500 alumnos)",
      monthly: 599,
      annual: 449,
      maxStudents: 1500,
      popular: true,
      features: [
        "Hasta 1,500 estudiantes",
        "Todos los módulos académicos",
        "Gestión financiera completa",
        "Comunicación integrada",
        "Integración con SUNAT",
        "Soporte prioritario 24/7",
        "API para desarrolladores",
        "Capacitación incluida",
      ],
      color: "border-sb-primary",
      bg: "bg-sb-primary/5",
    },
    {
      name: "Institucional",
      description: "Para UGELES y redes de colegios",
      monthly: null,
      annual: null,
      maxStudents: 999999,
      features: [
        "Estudiantes ilimitados",
        "Todo en Profesional",
        "Panel de control multi-colegio",
        "Integración directa con MINEDU",
        "Servidor dedicado en Perú",
        "Soporte con gerente asignado",
        "Personalización completa",
        "Capacitación presencial",
        "SLA garantizado 99.99%",
      ],
      color: "border-sb-outline-variant/20",
      bg: "bg-sb-surface",
    },
  ]

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="w-full space-y-6 py-2 lg:space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h2 className="text-[22px] font-bold tracking-tight text-sb-on-surface lg:text-[26px]">Overview</h2>
        <p className="text-[13px] text-sb-on-surface/60 mt-1 lg:text-[14px]">Panel de administración del sistema Educonecta</p>
      </motion.div>

      {/* Stats Grid - 2x2 on mobile */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 lg:gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            variants={fadeUp}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            className="bg-sb-surface rounded-2xl p-4 border border-sb-outline-variant/10 hover:border-sb-outline-variant/20 transition-all group md-anim-card-in lg:p-5"
          >
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <div className={`h-9 w-9 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-105 transition-transform lg:h-11 lg:w-11`}>
                <stat.icon className={`h-4 w-4 ${stat.color} lg:h-5 lg:w-5`} />
              </div>
              <span className="text-[9px] font-medium text-sb-on-surface/40 uppercase tracking-wider lg:text-[11px]">{stat.label}</span>
            </div>
            <p className="text-[22px] font-bold tracking-tight text-sb-on-surface lg:text-[28px]">
              {loading ? "—" : stat.value.toLocaleString()}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions + System Status */}
      <motion.div variants={fadeUp} className="space-y-6 lg:grid lg:grid-cols-5 lg:gap-6 lg:space-y-0">
        {/* Quick Actions */}
        <div className="lg:col-span-3">
          <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-widest mb-3 lg:text-[11px]">Acciones rápidas</p>
          <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 overflow-hidden">
            {actions.map((action, i) => (
              <Link
                key={action.href}
                href={action.href}
                className={`group flex items-center gap-3 p-3.5 hover:bg-sb-surface-container-low/50 transition-all ${i < actions.length - 1 ? 'border-b border-sb-outline-variant/8' : ''} lg:gap-4 lg:p-4`}
              >
                <div className="h-9 w-9 rounded-xl bg-sb-surface-container-high group-hover:bg-sb-primary/10 flex items-center justify-center transition-all shrink-0 lg:h-10 lg:w-10 md-anim-card-in">
                  <action.icon className="h-4 w-4 text-sb-on-surface/40 group-hover:text-sb-primary transition-all lg:h-5 lg:w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-sb-on-surface/80 lg:text-[14px]">{action.label}</p>
                  <p className="text-[11px] text-sb-on-surface/50 truncate lg:text-[12px]">{action.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-sb-on-surface/20 group-hover:text-sb-on-surface/60 transition-all shrink-0" />
              </Link>
            ))}
            <SbDropdown align="right" trigger={
              <button className="w-full group flex items-center gap-3 p-3.5 hover:bg-sb-surface-container-low/50 transition-all md-anim-card-in lg:gap-4 lg:p-4">
                <div className="h-9 w-9 rounded-xl bg-sb-primary/8 group-hover:bg-sb-primary/15 flex items-center justify-center transition-all shrink-0 lg:h-10 lg:w-10">
                  <Eye className="h-4 w-4 text-sb-primary lg:h-5 lg:w-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[13px] font-medium text-sb-on-surface/80 lg:text-[14px]">Mi Carnet</p>
                  <p className="text-[11px] text-sb-on-surface/50 lg:text-[12px]">Previsualiza y descarga tu carnet</p>
                </div>
                <ChevronRight className="h-4 w-4 text-sb-on-surface/20 group-hover:text-sb-on-surface/60 transition-all shrink-0" />
              </button>
            }>
              <SbDropdownItem icon={Eye} onClick={handlePreview}>
                Ver carnet
              </SbDropdownItem>
              <SbDropdownItem icon={Download} onClick={handleDownloadCarnet}>
                Descargar PDF
              </SbDropdownItem>
              <SbDropdownItem icon={Printer} onClick={() => console.log("Imprimir carnet")}>
                Imprimir
              </SbDropdownItem>
              <SbDropdownItem icon={CreditCardIcon} onClick={() => console.log("Ver planes")}>
                Ver planes
              </SbDropdownItem>
            </SbDropdown>
          </div>
        </div>

        {/* System Status */}
        <div className="lg:col-span-2">
          <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-widest mb-3 lg:text-[11px]">Estado del sistema</p>
          <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-4 space-y-4 md-anim-card-in lg:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center lg:h-10 lg:w-10">
                  <Server className="h-4 w-4 text-emerald-500 lg:h-5 lg:w-5" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-sb-on-surface/80 lg:text-[14px]">PostgreSQL</p>
                  <p className="text-[11px] text-sb-on-surface/50 lg:text-[12px]">Base de datos</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-600 font-medium lg:text-[11px]">Online</span>
              </div>
            </div>

            <div className="h-px bg-sb-outline-variant/10" />

            <div className="space-y-2.5 lg:space-y-3">
              {[
                { label: "Database", value: "postgres" },
                { label: "Host", value: "Supabase Pooler" },
                { label: "Pool", value: "50 conexiones" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-[11px] text-sb-on-surface/50 lg:text-[12px]">{item.label}</span>
                  <span className="text-[11px] font-mono text-sb-on-surface/70 lg:text-[12px]">{item.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-sb-on-surface/50 lg:text-[12px]">Entorno</span>
                <span className="text-[10px] font-medium text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full lg:text-[11px]">Development</span>
              </div>
            </div>

            {/* Platform Info */}
            <div className="p-3 rounded-xl bg-sb-surface-container-high/50 space-y-2">
              <p className="text-[10px] font-semibold text-sb-on-surface/40 uppercase tracking-wider lg:text-[11px]">Plataforma</p>
              <div className="space-y-1.5">
                {[
                  { label: "Framework", value: "Next.js 16" },
                  { label: "UI", value: "TailwindCSS + MD3" },
                  { label: "Auth", value: "JWT (jose)" },
                  { label: "Version", value: "v1.1.1" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-[10px] text-sb-on-surface/40 lg:text-[11px]">{item.label}</span>
                    <span className="text-[10px] font-mono text-sb-on-surface/60 lg:text-[11px]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Plans Section - Matching Landing Page */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-widest lg:text-[11px]">Planes de Suscripción</p>
          <Link href="/dev/planes" className="text-[11px] text-sb-primary hover:underline lg:text-[12px]">Ver todos →</Link>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {landingPlans.map((plan, i) => (
            <motion.div
              key={plan.name}
              variants={fadeUp}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className={`relative rounded-2xl border-2 p-4 transition-all md-anim-card-in lg:p-5 ${plan.color} ${plan.bg} ${
                plan.popular ? 'border-sb-primary shadow-lg shadow-sb-primary/10' : 'border-sb-outline-variant/10 hover:border-sb-outline-variant/20'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-5 px-3 py-1 bg-sb-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                  Más Popular
                </span>
              )}
              
              <div className="mb-4">
                <h3 className="text-[16px] font-bold text-sb-on-surface lg:text-[18px]">{plan.name}</h3>
                <p className="text-[11px] text-sb-on-surface/50 mt-1 lg:text-[12px]">{plan.description}</p>
              </div>

              <div className="mb-4 pb-4 border-b border-sb-outline-variant/10">
                {plan.monthly !== null ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-[13px] text-sb-on-surface/50 lg:text-[14px]">S/.</span>
                    <span className="text-[30px] font-bold text-sb-on-surface lg:text-[36px]">{plan.annual}</span>
                    <span className="text-[11px] text-sb-on-surface/40 lg:text-[12px]">/mes (anual)</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-[20px] font-bold text-sb-on-surface lg:text-[24px]">Personalizado</span>
                    <p className="text-[10px] text-sb-on-surface/40 mt-1 lg:text-[11px]">Contactar para cotización</p>
                  </div>
                )}
                {plan.monthly !== null && (
                  <p className="text-[10px] text-sb-on-surface/40 mt-1 lg:text-[11px]">
                    Mensual: S/. {plan.monthly}/mes | Anual: S/. {plan.annual}/mes (ahorra 25%)
                  </p>
                )}
              </div>

              <ul className="space-y-2 mb-4">
                {plan.features.slice(0, 5).map((feature, fi) => (
                  <li key={fi} className="flex items-start gap-2 text-[11px] text-sb-on-surface/60 lg:text-[12px]">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
                {plan.features.length > 5 && (
                  <li className="text-[10px] text-sb-on-surface/40 pl-5 lg:text-[11px]">
                    +{plan.features.length - 5} más...
                  </li>
                )}
              </ul>

              <div className="flex items-center justify-between text-[10px] text-sb-on-surface/40 pt-3 border-t border-sb-outline-variant/10 lg:text-[11px]">
                <span>hasta {plan.maxStudents.toLocaleString()} estudiantes</span>
                {plan.popular && <span className="text-sb-primary font-medium">Recomendado</span>}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Carnet Preview Modal */}
      <AnimatePresence>
        {previewOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setPreviewOpen(false)}>
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-sb-surface rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-sb-outline-variant/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile drag handle */}
              <div className="flex justify-center pt-3 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-sb-on-surface/20" />
              </div>
              
              <div className="flex items-center justify-between px-5 py-4 border-b border-sb-outline-variant/10 sm:px-6">
                <div>
                  <p className="text-[15px] font-semibold text-sb-on-surface">Mi Carnet</p>
                  <p className="text-[12px] text-sb-on-surface/50 mt-0.5">Desarrollador Educonecta</p>
                </div>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="h-8 w-8 rounded-xl bg-sb-surface-container-high hover:bg-sb-on-surface/10 flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4 text-sb-on-surface/60" />
                </button>
              </div>

              <div className="p-5 sm:p-6">
                <div className="bg-sb-surface-container rounded-2xl p-4 border border-sb-outline-variant/8 sm:p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-xl bg-sb-primary flex items-center justify-center">
                        <span className="text-sb-on-primary font-bold text-sm">EC</span>
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-sb-on-surface tracking-wider">EDUCONECTA</p>
                        <p className="text-[10px] text-sb-on-surface/50">Plataforma Educativa</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-medium text-emerald-600">Activo</span>
                    </div>
                  </div>

                  <div className="h-px bg-sb-outline-variant/10 mb-4" />

                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-14 w-14 rounded-xl bg-sb-primary/10 flex items-center justify-center">
                      <span className="text-sb-primary font-bold text-lg">
                        {userData?.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'DV'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-sb-on-surface truncate">{userData?.fullName || 'Desarrollador'}</p>
                      <p className="text-[12px] text-sb-on-surface/50 truncate">{userData?.email || 'dev@educonecta.pe'}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between py-2.5 px-3 bg-sb-surface-container-high rounded-xl">
                      <span className="text-[12px] text-sb-on-surface/50">DNI</span>
                      <span className="text-[13px] font-mono font-medium text-sb-on-surface/80">{userData?.dni || '---'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2.5 px-3 bg-sb-surface-container-high rounded-xl">
                      <span className="text-[12px] text-sb-on-surface/50">Rol</span>
                      <span className="text-[11px] font-medium text-sb-primary bg-sb-primary/10 px-2.5 py-1 rounded-full">Desarrollador</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDownloadCarnet}
                  disabled={downloadingCarnet}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3.5 bg-sb-on-surface text-white rounded-xl text-[14px] font-medium hover:bg-sb-on-surface/90 transition-all disabled:opacity-50 shadow-lg shadow-sb-on-surface/20 md-anim-in"
                >
                  <Download className="h-4 w-4" />
                  {downloadingCarnet ? 'Generando...' : 'Descargar PDF'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
