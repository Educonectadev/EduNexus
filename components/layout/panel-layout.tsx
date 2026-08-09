"use client"

import "@/frontend.css"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import { Logo } from "@/components/ui/logo"
import {
  LayoutDashboard, Building2, Users, CreditCard, Settings, Shield,
  FileText, HeadphonesIcon, Database, BarChart3, LogOut, GraduationCap,
  Sun, Moon, Megaphone, Handshake, Briefcase, BookOpen, ClipboardList,
  MessageSquare, Calendar, UserCheck, BookMarked, Bell, Search, User,
  ArrowRight, Clock, CheckCircle2, AlertCircle, BellRing, X, Layers, Plus,
  Sparkles,
} from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import { MobileNavbar } from "@/components/ui/mobile-navbar"
import AIAssistant from "@/components/secretario/ai-assistant"
import ImportarDocentesModal from "@/components/secretario/importar-docentes-modal"
import { usePlanPermissions } from "@/hooks/use-plan-permissions"
import type { PlanPermission } from "@/lib/planPermissions"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  action?: string
}

const navByRole: Record<string, NavItem[]> = {
  super_admin: [
    { title: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
    { title: "Instituciones", href: "/super-admin/instituciones", icon: Building2 },
    { title: "Usuarios", href: "/super-admin/usuarios", icon: Users },
    { title: "Planes", href: "/super-admin/planes", icon: CreditCard },
    { title: "Facturación", href: "/super-admin/facturacion", icon: FileText },
    { title: "Soporte", href: "/super-admin/soporte", icon: HeadphonesIcon },
    { title: "Auditoría", href: "/super-admin/auditoria", icon: Shield },
    { title: "Backups", href: "/super-admin/backups", icon: Database },
    { title: "Reportes", href: "/super-admin/reportes", icon: BarChart3 },
    { title: "Configuración", href: "/super-admin/configuracion", icon: Settings },
  ],
  director: [
    { title: "Dashboard", href: "/director/dashboard", icon: LayoutDashboard },
    { title: "Personal", href: "/director/personal", icon: Briefcase },
    { title: "Plantel", href: "/director/plantel", icon: Users },
    { title: "Comunicados", href: "/director/comunicados", icon: Megaphone },
    { title: "Reuniones", href: "/director/reuniones", icon: Handshake },
    { title: "Reportes", href: "/director/reportes", icon: BarChart3 },
    { title: "Configuración", href: "/director/configuracion", icon: Settings },
  ],
  secretario: [
    { title: "Dashboard", href: "/secretario/dashboard", icon: LayoutDashboard },
    { title: "Personal", href: "/secretario/personal", icon: Users },
    { title: "Matrículas", href: "/secretario/matriculas", icon: BookOpen },
    { title: "Asistencia", href: "/secretario/asistencia", icon: UserCheck },
    { title: "Notas", href: "/secretario/notas", icon: GraduationCap },
    { title: "Pagos", href: "/secretario/pagos", icon: CreditCard },
    { title: "Cursos", href: "/secretario/cursos", icon: BookOpen },
    { title: "Horarios", href: "/secretario/horarios", icon: Calendar },
    { title: "Documentos", href: "/secretario/documentos", icon: FileText },
    { title: "Certificados", href: "/secretario/certificados", icon: ClipboardList },
    { title: "Padres", href: "/secretario/padres", icon: Users },
    { title: "Gestión Académica", href: "/secretario/gestion-academica", icon: Layers },
    { title: "Importar Personal", href: "/secretario/importar-docentes", icon: Users, action: "importar-personal" },
    { title: "Búsqueda", href: "/secretario/busqueda", icon: Search },
    { title: "Historial", href: "/secretario/historial", icon: Database },
  ],
  docente: [
    { title: "Dashboard", href: "/docente/dashboard", icon: LayoutDashboard },
    { title: "Cursos", href: "/docente/cursos", icon: BookOpen },
    { title: "Horarios", href: "/docente/horarios", icon: Calendar },
    { title: "Asistencia", href: "/docente/asistencia", icon: UserCheck },
    { title: "Notas", href: "/docente/calificaciones", icon: BookMarked },
    { title: "Tareas", href: "/docente/tareas", icon: ClipboardList },
    { title: "Materiales", href: "/docente/materiales", icon: FileText },
    { title: "Calendario", href: "/docente/calendario", icon: Calendar },
    { title: "Mensajes", href: "/docente/mensajes", icon: MessageSquare },
  ],
  padre: [
    { title: "Dashboard", href: "/padre/dashboard", icon: LayoutDashboard },
    { title: "Mi Hijo", href: "/padre/hijo", icon: GraduationCap },
    { title: "Asistencia", href: "/padre/asistencia", icon: UserCheck },
    { title: "Tareas", href: "/padre/tareas", icon: ClipboardList },
    { title: "Pagos", href: "/padre/pagos", icon: CreditCard },
    { title: "Comunicados", href: "/padre/comunicados", icon: MessageSquare },
    { title: "Calendario", href: "/padre/calendario", icon: Calendar },
  ],
}

const roleLabels: Record<string, string> = {
  super_admin: "Admin", director: "Director", secretario: "Secretario",
  docente: "Docente", padre: "Padre",
}

const navSectionsByRole: Record<string, { title: string; items: NavItem[] }[]> = {
  super_admin: [
    { title: "Principal", items: [
      { title: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
    ]},
    { title: "Gestión", items: [
      { title: "Instituciones", href: "/super-admin/instituciones", icon: Building2 },
      { title: "Usuarios", href: "/super-admin/usuarios", icon: Users },
      { title: "Planes", href: "/super-admin/planes", icon: CreditCard },
      { title: "Facturación", href: "/super-admin/facturacion", icon: FileText },
    ]},
    { title: "Operaciones", items: [
      { title: "Soporte", href: "/super-admin/soporte", icon: HeadphonesIcon },
      { title: "Auditoría", href: "/super-admin/auditoria", icon: Shield },
      { title: "Backups", href: "/super-admin/backups", icon: Database },
      { title: "Reportes", href: "/super-admin/reportes", icon: BarChart3 },
    ]},
    { title: "Sistema", items: [
      { title: "Configuración", href: "/super-admin/configuracion", icon: Settings },
    ]},
  ],
  director: [
    { title: "Principal", items: [
      { title: "Dashboard", href: "/director/dashboard", icon: LayoutDashboard },
    ]},
    { title: "Gestión", items: [
      { title: "Personal", href: "/director/personal", icon: Briefcase },
      { title: "Plantel", href: "/director/plantel", icon: Users },
    ]},
    { title: "Comunicación", items: [
      { title: "Comunicados", href: "/director/comunicados", icon: Megaphone },
      { title: "Reuniones", href: "/director/reuniones", icon: Handshake },
    ]},
    { title: "Análisis", items: [
      { title: "Reportes", href: "/director/reportes", icon: BarChart3 },
    ]},
    { title: "Sistema", items: [
      { title: "Configuración", href: "/director/configuracion", icon: Settings },
    ]},
  ],
  secretario: [
    { title: "Principal", items: [
      { title: "Dashboard", href: "/secretario/dashboard", icon: LayoutDashboard },
      { title: "Personal", href: "/secretario/personal", icon: Users },
    ]},
    { title: "Académico", items: [
      { title: "Matrículas", href: "/secretario/matriculas", icon: BookOpen },
      { title: "Asistencia", href: "/secretario/asistencia", icon: UserCheck },
      { title: "Notas", href: "/secretario/notas", icon: GraduationCap },
      { title: "Cursos", href: "/secretario/cursos", icon: BookOpen },
      { title: "Horarios", href: "/secretario/horarios", icon: Calendar },
    ]},
    { title: "Gestión", items: [
      { title: "Pagos", href: "/secretario/pagos", icon: CreditCard },
      { title: "Documentos", href: "/secretario/documentos", icon: FileText },
      { title: "Certificados", href: "/secretario/certificados", icon: ClipboardList },
      { title: "Padres", href: "/secretario/padres", icon: Users },
    ]},
    { title: "Avanzado", items: [
      { title: "Gestión Académica", href: "/secretario/gestion-academica", icon: Layers },
      { title: "Importar Personal", href: "/secretario/importar-docentes", icon: Users, action: "importar-personal" },
      { title: "Búsqueda", href: "/secretario/busqueda", icon: Search },
      { title: "Historial", href: "/secretario/historial", icon: Database },
    ]},
  ],
  docente: [
    { title: "Principal", items: [
      { title: "Dashboard", href: "/docente/dashboard", icon: LayoutDashboard },
    ]},
    { title: "Académico", items: [
      { title: "Cursos", href: "/docente/cursos", icon: BookOpen },
      { title: "Horarios", href: "/docente/horarios", icon: Calendar },
      { title: "Asistencia", href: "/docente/asistencia", icon: UserCheck },
      { title: "Notas", href: "/docente/calificaciones", icon: BookMarked },
      { title: "Tareas", href: "/docente/tareas", icon: ClipboardList },
    ]},
    { title: "Recursos", items: [
      { title: "Materiales", href: "/docente/materiales", icon: FileText },
      { title: "Calendario", href: "/docente/calendario", icon: Calendar },
      { title: "Mensajes", href: "/docente/mensajes", icon: MessageSquare },
    ]},
  ],
  padre: [
    { title: "Principal", items: [
      { title: "Dashboard", href: "/padre/dashboard", icon: LayoutDashboard },
    ]},
    { title: "Mi hijo", items: [
      { title: "Mi Hijo", href: "/padre/hijo", icon: GraduationCap },
      { title: "Asistencia", href: "/padre/asistencia", icon: UserCheck },
      { title: "Tareas", href: "/padre/tareas", icon: ClipboardList },
    ]},
    { title: "Información", items: [
      { title: "Pagos", href: "/padre/pagos", icon: CreditCard },
      { title: "Comunicados", href: "/padre/comunicados", icon: MessageSquare },
      { title: "Calendario", href: "/padre/calendario", icon: Calendar },
    ]},
  ],
}

const navPermission: Record<string, PlanPermission> = {
  "/secretario/asistencia": "can_attendance",
  "/secretario/notas": "can_grades",
  "/secretario/documentos": "can_documents",
  "/secretario/certificados": "can_certificates",
  "/secretario/padres": "can_parents_portal",
  "/docente/asistencia": "can_attendance",
  "/docente/calificaciones": "can_grades",
  "/docente/tareas": "can_homework",
  "/docente/materiales": "can_documents",
  "/docente/mensajes": "can_chat",
  "/padre/asistencia": "can_attendance",
  "/padre/tareas": "can_homework",
  "/director/reportes": "can_export_reports",
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user, role, setUser, setRole, setInstitutionId, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [sidebarOpen, setSidebarOpen] = React.useState(true)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [notifOpen, setNotifOpen] = React.useState(false)
  const [aiOpen, setAiOpen] = React.useState(false)
  const [importPersonalOpen, setImportPersonalOpen] = React.useState(false)
  const searchRef = React.useRef<HTMLInputElement>(null)

  const navItems = role ? navByRole[role] || [] : []
  const navSections = role ? navSectionsByRole[role] || [] : []

  const { can } = usePlanPermissions()

  const canShowItem = (item: NavItem) => {
    if (role === "padre" && !can("can_parents_portal")) return false
    if (item.action === "importar-personal") return can("can_bulk_import")
    const perm = navPermission[item.href]
    if (!perm) return true
    return can(perm)
  }

  const visibleNavItems = navItems.filter(canShowItem)
  const visibleNavSections = navSections
    .map(section => ({ ...section, items: section.items.filter(canShowItem) }))
    .filter(section => section.items.length > 0)

  const isActive = (item: NavItem) =>
    item.href === `/${role}`
      ? (pathname === `/${role}` || pathname === `/${role}/dashboard`)
      : pathname === item.href || pathname.startsWith(item.href + "/")

  const filteredNav = visibleNavItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const notifications = [
    { id: 1, title: "Nueva matrícula registrada", desc: "Carlos García fue matriculado en 3° Secundaria", time: "Hace 5 min", read: false, icon: CheckCircle2, color: "text-emerald-400" },
    { id: 2, title: "Reunión programada", desc: "Reunión de padres para el viernes 25 de julio", time: "Hace 1h", read: false, icon: BellRing, color: "text-sb-primary" },
    { id: 3, title: "Documento pendiente", desc: "Falta firmar acta de calificaciones del bimestre", time: "Hace 3h", read: true, icon: AlertCircle, color: "text-amber-400" },
    { id: 4, title: "Personal contratado", desc: "María López fue agregada como docente de Inglés", time: "Ayer", read: true, icon: CheckCircle2, color: "text-emerald-400" },
  ]

  React.useEffect(() => {
    const getUser = async () => {
      try {
        const res = await fetch("/api/auth/me")
        if (!res.ok) { router.push("/login"); return }
        const data = await res.json()
        setUser({
          id: data.user.id, email: data.user.email, full_name: data.user.fullName,
          avatar_url: data.user.avatarUrl, role: data.user.role,
          institution_id: data.user.institutionId, created_at: "",
        })
        setRole(data.user.role)
        setInstitutionId(data.user.institutionId)
      } catch { router.push("/login") } finally { setLoading(false) }
    }
    getUser()
  }, [])

  React.useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus()
  }, [searchOpen])

  React.useEffect(() => {
    const saved = localStorage.getItem("sb-sidebar-open")
    if (saved !== null) setSidebarOpen(saved === "1")
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev
      localStorage.setItem("sb-sidebar-open", next ? "1" : "0")
      return next
    })
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    logout()
    router.push("/login")
  }

  const pageName = pathname === `/${role}` || pathname === `/${role}/dashboard`
    ? "Dashboard"
    : pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Dashboard"

  if (loading) {
    return <div className="flex h-screen" style={{ background: "var(--sb-background)" }} />
  }

  return (
    <div className="flex h-screen overflow-hidden text-[var(--sb-on-background)]" data-role={role} style={{ background: "var(--sb-background)" }}>

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className={cn(
        "hidden md:flex flex-col h-screen w-[64px] border-r border-sb-outline-variant/8 transition-[width] duration-200 ease-out overflow-hidden shrink-0",
        "bg-sb-surface z-10",
        sidebarOpen && "w-[240px]"
      )}>
        {/* Logo */}
        <div className={cn("flex items-center h-14 shrink-0", sidebarOpen ? "px-4 gap-2.5" : "justify-center")}>
          <Link href="/" className="flex items-center justify-center shrink-0">
            <Logo className="w-7 h-7" />
          </Link>
          {sidebarOpen && (
            <span className="text-[13px] font-medium text-sb-on-surface tracking-tight truncate">
              EduNexus
            </span>
          )}
        </div>

        {/* Nav grouped by sections */}
        <nav className={cn(
          "flex flex-col flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
          sidebarOpen ? "px-2 py-3 gap-4" : "px-2 py-3 gap-2"
        )}>
          {visibleNavSections.map((section, sIdx) => (
            <div key={section.title} className="flex flex-col gap-px">
              {sidebarOpen && (
                <h3 className={cn(
                  "px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-sb-on-surface-variant/50",
                  sIdx > 0 && "mt-1"
                )}>
                  {section.title}
                </h3>
              )}
              {section.items.map((item) => {
                const active = isActive(item)
                const isAction = !!item.action
                const handleAction = () => {
                  if (item.action === "importar-personal") setImportPersonalOpen(true)
                }
                const inner = (
                  <>
                    {!sidebarOpen && (
                      <motion.span
                  className="absolute inset-0"
                  initial={false}
                  animate={{
                    borderRadius: active ? 6 : 999,
                    backgroundColor: active ? "var(--sb-on-surface)" : "rgba(0,0,0,0)",
                  }}
                  whileHover={{ backgroundColor: active ? "var(--sb-on-surface)" : "rgba(0,0,0,0.06)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.7 }}
                />
              )}
              <motion.span
                className="relative z-10"
                whileTap={{ scale: 0.9 }}
                animate={{
                  scale: active ? 1.1 : 1,
                  opacity: active ? 1 : 0.7,
                }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <item.icon className="h-[16px] w-[16px] shrink-0" />
              </motion.span>
              {sidebarOpen && (
                <span className={cn(
                  "text-[13px] truncate transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:tracking-[0.02em]",
                  active ? "font-medium" : "font-normal"
                )}>
                  {item.title}
                </span>
              )}
            </>
          )
          const cls = cn(
            "group flex items-center gap-2.5 transition-colors duration-300 ease-out",
            sidebarOpen ? "h-8 px-2.5 rounded-[6px]" : "relative justify-center w-9 h-9 mx-auto",
            active
              ? sidebarOpen ? "bg-sb-on-surface text-sb-surface" : "text-sb-surface"
              : "text-sb-on-surface-variant/70 hover:text-sb-on-surface dark:text-sb-solid-fg/55 dark:hover:text-sb-solid-fg"
          )
                const title = !sidebarOpen ? item.title : undefined
                return isAction ? (
                  <button key={item.href} onClick={handleAction} className={cls} title={title}>{inner}</button>
                ) : (
                  <Link key={item.href} href={item.href} className={cls} title={title}>{inner}</Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className={cn("shrink-0 border-t border-sb-outline-variant/6 px-2 py-2 space-y-3")}>
          {/* Herramientas section */}
          <div className="flex flex-col gap-px">
            {sidebarOpen && (
              <h3 className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-sb-on-surface-variant/50">
                Herramientas
              </h3>
            )}
            {/* AI Assistant Link */}
            {role === 'secretario' && can("can_ai_assistant") && (
              <Link
                href="/secretario/asistente"
                className={cn(
                  "group flex items-center gap-2.5 transition-colors duration-300 ease-out w-full",
                  sidebarOpen ? "h-8 px-2.5 rounded-[6px]" : "relative justify-center w-9 h-9 mx-auto",
                  pathname.startsWith("/secretario/asistente")
                    ? sidebarOpen ? "bg-sb-on-surface text-sb-surface" : "text-sb-surface"
                    : "text-sb-on-surface-variant/70 hover:text-sb-on-surface dark:text-sb-solid-fg/55 dark:hover:text-sb-solid-fg"
                )}
                title="Asistente IA">
                {!sidebarOpen && (
                  <motion.span
                    className="absolute inset-0"
                    initial={false}
                    animate={{
                      borderRadius: pathname.startsWith("/secretario/asistente") ? 14 : 999,
                      backgroundColor: pathname.startsWith("/secretario/asistente") ? "var(--sb-on-surface)" : "rgba(0,0,0,0)",
                    }}
                    whileHover={{ backgroundColor: pathname.startsWith("/secretario/asistente") ? "var(--sb-on-surface)" : "rgba(0,0,0,0.06)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.7 }}
                  />
                )}
                <motion.span
                  className="relative z-10"
                  whileTap={{ scale: 0.9 }}
                  animate={{
                    scale: pathname.startsWith("/secretario/asistente") ? 1.1 : 1,
                    opacity: pathname.startsWith("/secretario/asistente") ? 1 : 0.7,
                  }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  <Sparkles className="h-[16px] w-[16px] shrink-0" />
                </motion.span>
                {sidebarOpen && <span className="text-[13px] truncate transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:tracking-[0.02em]">Asistente IA</span>}
              </Link>
            )}

            {/* Theme */}
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={cn(
                "group flex items-center gap-2.5 transition-colors duration-300 ease-out",
                sidebarOpen ? "h-8 px-2.5 rounded-[6px] w-full" : "justify-center w-9 h-9 mx-auto rounded-[6px]",
                "text-sb-on-surface-variant/70 hover:bg-sb-surface-container/60 hover:text-sb-on-surface dark:text-sb-solid-fg/55 dark:hover:text-sb-solid-fg"
              )}>
              <div className="relative shrink-0 w-[16px] h-[16px]">
                <Sun className={cn("absolute inset-0 h-[16px] w-[16px] transition-all duration-200", theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")} />
                <Moon className={cn("absolute inset-0 h-[16px] w-[16px] transition-all duration-200", theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0")} />
              </div>
              {sidebarOpen && <span className="text-[13px] truncate transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:tracking-[0.02em]">Tema</span>}
            </button>

            {/* Collapse */}
            <button onClick={toggleSidebar}
              className={cn(
                "group flex items-center gap-2.5 transition-colors duration-300 ease-out",
                sidebarOpen ? "h-8 px-2.5 rounded-[6px] w-full" : "justify-center w-9 h-9 mx-auto rounded-[6px]",
                "text-sb-on-surface-variant/50 hover:bg-sb-surface-container/60 hover:text-sb-on-surface-variant dark:text-sb-solid-fg/45 dark:hover:text-sb-solid-fg"
              )}>
              <svg className={cn("h-[16px] w-[16px] shrink-0 transition-transform duration-200", !sidebarOpen && "rotate-180")}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              {sidebarOpen && <span className="text-[13px] truncate transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:tracking-[0.02em]">Colapsar</span>}
            </button>
          </div>

          {/* Cuenta section */}
          <div className="flex flex-col gap-px border-t border-sb-outline-variant/6 pt-2">
            {sidebarOpen && (
              <h3 className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-sb-on-surface-variant/50">
                Cuenta
              </h3>
            )}
            <Link href="/perfil"
              className={cn(
                "group flex items-center gap-2.5 transition-colors duration-300 ease-out",
                sidebarOpen ? "h-8 px-2.5 rounded-[6px]" : "relative justify-center w-9 h-9 mx-auto",
                  pathname === "/perfil"
                    ? sidebarOpen ? "bg-sb-on-surface text-sb-surface" : "text-sb-surface"
                    : "text-sb-on-surface-variant/70 hover:text-sb-on-surface dark:text-sb-solid-fg/55 dark:hover:text-sb-solid-fg"
              )}>
              {!sidebarOpen && (
                <motion.span
                  className="absolute inset-0"
                  initial={false}
                  animate={{
                    borderRadius: pathname === "/perfil" ? 14 : 999,
                    backgroundColor: pathname === "/perfil" ? "var(--sb-on-surface)" : "rgba(0,0,0,0)",
                  }}
                  whileHover={{ backgroundColor: pathname === "/perfil" ? "var(--sb-on-surface)" : "rgba(0,0,0,0.06)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.7 }}
                />
              )}
              <motion.span
                className="relative z-10"
                whileTap={{ scale: 0.9 }}
                animate={{
                  scale: pathname === "/perfil" ? 1.1 : 1,
                  opacity: pathname === "/perfil" ? 1 : 0.7,
                }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <User className="h-[16px] w-[16px] shrink-0" />
              </motion.span>
              {sidebarOpen && <span className="text-[13px] truncate transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:tracking-[0.02em]">Mi perfil</span>}
            </Link>
            <button onClick={handleLogout}
              className={cn(
                "group flex items-center gap-2.5 transition-colors duration-300 ease-out",
                sidebarOpen ? "h-8 px-2.5 rounded-[6px] w-full" : "justify-center w-9 h-9 mx-auto rounded-[6px]",
                "text-sb-on-surface-variant/70 hover:bg-sb-surface-container/60 hover:text-sb-on-surface dark:text-sb-solid-fg/55 dark:hover:text-sb-solid-fg"
              )}>
              <LogOut className="h-[16px] w-[16px] shrink-0" />
              {sidebarOpen && <span className="text-[13px] truncate transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:tracking-[0.02em]">Salir</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Minimal Header */}
        <header className="flex items-center justify-between h-14 px-6 shrink-0">
          <h1 className="text-sm font-medium text-sb-on-surface-variant">{pageName}</h1>
          <div className="flex items-center gap-2">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-sb-surface-container-high mr-1">
                <div className="h-5 w-5 rounded-full bg-sb-surface-container-highest flex items-center justify-center">
                  <span className="text-[8px] font-semibold text-sb-on-surface/80">
                    {user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </span>
                </div>
                <span className="text-[10px] text-sb-on-surface-variant">{roleLabels[role || ""]}</span>
              </div>
            )}

            <div className="flex md:hidden items-center gap-1 mr-1">
              <button onClick={() => { setSearchOpen(true); setNotifOpen(false) }}
                className="flex items-center justify-center p-2 rounded-xl text-sb-on-surface-variant hover:bg-sb-surface-container-highest/50 hover:text-sb-on-surface/80 transition-all">
                <Search className="h-[18px] w-[18px]" />
              </button>
              <button onClick={() => { setNotifOpen(!notifOpen); setSearchOpen(false) }}
                className="flex items-center justify-center p-2 rounded-xl text-sb-on-surface-variant hover:bg-sb-surface-container-highest/50 hover:text-sb-on-surface/80 transition-all relative">
                <Bell className="h-[18px] w-[18px]" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-sb-primary" />
                )}
              </button>
              <button onClick={handleLogout}
                className="flex items-center justify-center p-2 rounded-xl text-sb-on-surface-variant hover:bg-sb-surface-container-highest/50 hover:text-sb-on-surface/80 transition-all">
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>

            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hidden md:flex items-center justify-center p-2 rounded-xl text-sb-on-surface-variant hover:bg-sb-surface-container-highest/50 hover:text-sb-on-surface/80 transition-all relative"
              title="Toggle theme">
              <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto px-6 pb-32 md:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.37, 0.35, 0, 1] }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ===== MOBILE BOTTOM NAV ===== */}
        {role && (
          <MobileNavbar
            items={visibleNavItems}
            activeHref={pathname}
            role={role}
            onAiClick={can("can_ai_assistant") ? () => setAiOpen(true) : undefined}
            maxVisible={4}
          />
        )}

        {/* ===== SEARCH OVERLAY ===== */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 md:hidden bg-background/80 backdrop-blur-3xl">
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 px-4 h-14">
                <button onClick={() => { setSearchOpen(false); setSearchQuery("") }}
                  className="flex items-center justify-center p-2 rounded-xl text-sb-on-surface-variant hover:bg-sb-surface-container-highest/50 transition-all">
                  <X className="h-5 w-5" />
                </button>
                <input ref={searchRef} type="text" placeholder="Buscar secciones..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-sb-on-surface placeholder:text-sb-on-surface-variant/60 outline-none" />
              </div>
              <div className="flex-1 overflow-auto">
                {searchQuery ? (
                  <div className="py-2">
                    {filteredNav.length > 0 ? filteredNav.map(item => {
                      const handleAction = () => {
                        setSearchOpen(false); setSearchQuery("")
                        if (item.action === "importar-personal") setImportPersonalOpen(true)
                      }
                      const content = (
                        <>
                          <div className="h-9 w-9 rounded-xl bg-sb-surface-container-high flex items-center justify-center">
                            <item.icon className="h-4 w-4 text-sb-on-surface-variant" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-sb-on-surface">{item.title}</p>
                            <p className="text-xs text-sb-on-surface-variant/60">{item.action ? "Abrir" : item.href}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-sb-on-surface-variant/30" />
                        </>
                      )
                      const cls = "flex items-center gap-3 px-5 py-3 hover:bg-sb-surface-container-highest/50 transition-colors"
                      return item.action ? (
                        <button key={item.href} onClick={handleAction} className={cls}>{content}</button>
                      ) : (
                        <Link key={item.href} href={item.href} onClick={handleAction} className={cls}>{content}</Link>
                      )
                    }) : (
                      <div className="px-5 py-12 text-center">
                        <p className="text-sm text-sb-on-surface-variant/60">Sin resultados</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-5 py-8">
                    <p className="text-[10px] font-medium text-sb-on-surface-variant/60 uppercase tracking-wider mb-3">Accesos rápidos</p>
                    <div className="space-y-1">
                      {visibleNavItems.slice(0, 5).map(item => (
                        <Link key={item.href} href={item.href} onClick={() => setSearchOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sb-surface-container-highest/50 transition-colors">
                          <item.icon className="h-4 w-4 text-sb-on-surface-variant" />
                          <span className="text-sm text-sb-on-surface/70">{item.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== NOTIFICATIONS PANEL ===== */}
      <AnimatePresence>
        {notifOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 md:hidden bg-background/80 backdrop-blur-sm" onClick={() => setNotifOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
              transition={{ duration: 0.25, ease: [0.37, 0.35, 0, 1] }}
              className="fixed top-16 right-3 left-3 z-50 md:hidden bg-sb-surface-container/90 backdrop-blur-3xl rounded-[32px] border border-sb-outline-variant/20 shadow-2xl max-h-[70vh] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <h3 className="text-sm font-medium text-sb-on-surface">Notificaciones</h3>
                <button onClick={() => setNotifOpen(false)}
                  className="flex items-center justify-center p-2 rounded-xl text-sb-on-surface-variant hover:bg-sb-surface-container-highest/50 transition-all">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="overflow-auto max-h-[60vh]">
                {notifications.map(n => (
                  <div key={n.id} className={cn(
                    "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-sb-surface-container-highest/50",
                    !n.read && "bg-sb-primary/5"
                  )}>
                    <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                      !n.read ? "bg-sb-primary/10" : "bg-sb-surface-container-highest")}>
                      <n.icon className={cn("h-4 w-4", n.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm", !n.read ? "text-sb-on-surface font-medium" : "text-sb-on-surface/80")}>{n.title}</p>
                      <p className="text-xs text-sb-on-surface-variant mt-0.5 line-clamp-2">{n.desc}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 text-sb-on-surface-variant/60" />
                        <span className="text-[10px] text-sb-on-surface-variant/60">{n.time}</span>
                      </div>
                    </div>
                    {!n.read && <div className="h-2 w-2 rounded-full bg-sb-primary shrink-0 mt-2" />}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* ===== AI ASSISTANT ===== */}
      <AIAssistant open={aiOpen} onClose={() => setAiOpen(false)} />

      {/* ===== IMPORTAR PERSONAL (modal, no navegación) ===== */}
      {role === "secretario" && (
        <ImportarDocentesModal open={importPersonalOpen} onClose={() => setImportPersonalOpen(false)} />
      )}
    </div>
  </div>
  )
}

