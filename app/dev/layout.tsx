"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Building2,
  Users,
  Database,
  Settings,
  Terminal,
  Shield,
  LogOut,
  Sun,
  Moon,
  Code2,
  Key,
  Activity,
  CreditCard,
  UserCircle,
  Inbox,
  BarChart3,
  HardDrive,
  DollarSign,
} from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import { MobileNavbar } from "@/components/ui/mobile-navbar"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: "Principal",
    items: [
      { title: "Overview", href: "/dev", icon: LayoutDashboard },
      { title: "Solicitudes", href: "/dev/demo", icon: Inbox, badge: "NEW" },
      { title: "Instituciones", href: "/dev/instituciones", icon: Building2 },
      { title: "Usuarios", href: "/dev/usuarios", icon: Users },
      { title: "Planes", href: "/dev/planes", icon: CreditCard },
      { title: "Facturación", href: "/dev/facturacion", icon: DollarSign },
      { title: "Reportes", href: "/dev/reportes", icon: BarChart3 },
    ],
  },
  {
    title: "Herramientas",
    items: [
      { title: "Contraseñas", href: "/dev/contrasenas", icon: Key },
      { title: "Seguimiento", href: "/dev/seguimiento", icon: Activity },
      { title: "Database", href: "/dev/database", icon: Database, badge: "SQL" },
      { title: "Seed", href: "/dev/seed", icon: Terminal, badge: "DEV" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { title: "Audit", href: "/dev/audit", icon: Shield },
      { title: "Backups", href: "/dev/backups", icon: HardDrive },
      { title: "Perfil", href: "/dev/perfil", icon: UserCircle },
      { title: "Settings", href: "/dev/config", icon: Settings },
    ],
  },
]

const allNav = navSections.flatMap(s => s.items)

export default function DevLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return true
    const saved = window.localStorage.getItem("dev-sidebar-open")
    return saved === null ? true : saved === "1"
  })

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev
      localStorage.setItem("dev-sidebar-open", next ? "1" : "0")
      return next
    })
  }

  const isActive = (href: string) =>
    href === "/dev" ? pathname === "/dev" : pathname === href || pathname.startsWith(href + "/")

  const pageTitle = allNav.find(n => isActive(n.href))?.title || "Overview"

  return (
    <div className="flex h-screen overflow-hidden text-[var(--sb-on-background)]" style={{ background: "var(--sb-background)" }}>

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className={cn(
        "hidden md:flex flex-col h-screen w-[64px] border-r border-sb-outline-variant/8 transition-[width] duration-200 ease-out overflow-hidden shrink-0",
        "bg-sb-surface z-10",
        sidebarOpen && "w-[240px]"
      )}>
        {/* Logo */}
        <div className={cn("flex items-center h-14 shrink-0", sidebarOpen ? "px-4 gap-2.5" : "justify-center")}>
          <div className="flex items-center justify-center w-7 h-7 rounded-[6px] bg-sb-on-surface shrink-0">
            <Code2 className="h-[15px] w-[15px] text-sb-on-primary" />
          </div>
          {sidebarOpen && (
            <span className="text-[13px] font-medium text-sb-on-surface tracking-tight truncate">
              Dev Console
            </span>
          )}
        </div>

        {/* Nav grouped by sections */}
        <nav className={cn(
          "flex flex-col flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
          sidebarOpen ? "px-2 py-3 gap-4" : "px-2 py-3 gap-2"
        )}>
          {navSections.map((section, sIdx) => (
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
                const active = isActive(item.href)
                const cls = cn(
                  "group flex items-center gap-2.5 transition-colors duration-300 ease-out",
                  sidebarOpen ? "h-8 px-2.5 rounded-[6px]" : "relative justify-center w-9 h-9 mx-auto",
                  active
                    ? sidebarOpen ? "bg-sb-on-surface text-sb-surface" : "text-sb-surface"
                    : "text-sb-on-surface-variant/70 hover:text-sb-on-surface dark:text-sb-solid-fg/55 dark:hover:text-sb-solid-fg"
                )
                return (
                  <Link key={item.href} href={item.href} className={cls} title={!sidebarOpen ? item.title : undefined}>
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
                    {sidebarOpen && item.badge && (
                      <span className={cn(
                        "ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-[4px]",
                        item.badge === 'NEW' ? "bg-emerald-500 text-white"
                          : item.badge === 'DEV' ? "bg-amber-500 text-white"
                            : "bg-sb-surface-container text-sb-on-surface-variant"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="shrink-0 border-t border-sb-outline-variant/6 px-2 py-2 space-y-3">
          {/* Herramientas section */}
          <div className="flex flex-col gap-px">
            {sidebarOpen && (
              <h3 className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-sb-on-surface-variant/50">
                Herramientas
              </h3>
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
            <Link href="/dev/perfil"
              className={cn(
                "group flex items-center gap-2.5 transition-colors duration-300 ease-out",
                sidebarOpen ? "h-8 px-2.5 rounded-[6px]" : "relative justify-center w-9 h-9 mx-auto",
                isActive("/dev/perfil")
                  ? sidebarOpen ? "bg-sb-on-surface text-sb-surface" : "text-sb-surface"
                  : "text-sb-on-surface-variant/70 hover:text-sb-on-surface dark:text-sb-solid-fg/55 dark:hover:text-sb-solid-fg"
              )}>
              {!sidebarOpen && (
                <motion.span
                  className="absolute inset-0"
                  initial={false}
                  animate={{
                    borderRadius: isActive("/dev/perfil") ? 6 : 999,
                    backgroundColor: isActive("/dev/perfil") ? "var(--sb-on-surface)" : "rgba(0,0,0,0)",
                  }}
                  whileHover={{ backgroundColor: isActive("/dev/perfil") ? "var(--sb-on-surface)" : "rgba(0,0,0,0.06)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.7 }}
                />
              )}
              <motion.span
                className="relative z-10"
                whileTap={{ scale: 0.9 }}
                animate={{
                  scale: isActive("/dev/perfil") ? 1.1 : 1,
                  opacity: isActive("/dev/perfil") ? 1 : 0.7,
                }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <UserCircle className="h-[16px] w-[16px] shrink-0" />
              </motion.span>
              {sidebarOpen && <span className="text-[13px] truncate transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:tracking-[0.02em]">Perfil</span>}
            </Link>
            <button
              onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/' }}
              className={cn(
                "group flex items-center gap-2.5 transition-colors duration-300 ease-out w-full",
                sidebarOpen ? "h-8 px-2.5 rounded-[6px]" : "justify-center w-9 h-9 mx-auto rounded-[6px]",
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
        <header className="flex items-center justify-between h-14 px-4 shrink-0 md:px-8 border-b border-sb-outline-variant/6">
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] font-semibold text-sb-on-surface">{pageTitle}</h1>
            <span className="hidden sm:inline-block text-[11px] text-sb-on-surface/60 px-2 py-0.5 rounded-full bg-sb-surface-container font-medium">Dev</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-emerald-600 font-medium">Live</span>
            </div>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hidden md:flex items-center justify-center p-2 rounded-lg text-sb-on-surface/70 hover:bg-sb-surface-container-high transition-colors"
              title="Toggle theme">
              <Sun className="h-[16px] w-[16px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[16px] w-[16px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto px-4 pb-28 md:px-8 md:pb-8">
          <div className="mx-auto w-full max-w-[1200px]">
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
          </div>
        </main>

        {/* ===== MOBILE BOTTOM NAV ===== */}
        <MobileNavbar
          items={allNav.map(({ badge, ...item }) => item)}
          activeHref={pathname}
          role="dev"
          maxVisible={4}
        />

      </div>
    </div>
  )
}
