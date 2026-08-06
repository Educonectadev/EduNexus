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
  X,
  DollarSign,
} from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"

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
const mobileNav = allNav.filter(n => ["Overview", "Instituciones", "Usuarios", "Database"].includes(n.title))

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
  const [drawerOpen, setDrawerOpen] = React.useState(false)

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
        <header className="flex items-center justify-between h-12 px-4 shrink-0 md:px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-sb-surface-container-high transition-colors"
            >
              <svg className="h-4 w-4 text-sb-on-surface-variant/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-sm font-medium text-sb-on-surface-variant">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-1">
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-emerald-600 font-medium">Live</span>
            </div>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hidden md:flex items-center justify-center p-2 rounded-lg text-sb-on-surface-variant hover:bg-sb-surface-container-high transition-colors"
              title="Toggle theme">
              <Sun className="h-[16px] w-[16px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[16px] w-[16px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto px-4 pb-24 md:px-6 md:pb-6">
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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40">
          <div className="bg-sb-surface/90 backdrop-blur-xl border-t border-sb-outline-variant/10 px-4 pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-around py-1">
              {mobileNav.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center justify-center gap-px px-3 py-2 rounded-lg transition-colors min-w-[48px]",
                      active
                        ? "text-sb-on-surface"
                        : "text-sb-on-surface/40"
                    )}
                  >
                    <item.icon className={cn("h-[18px] w-[18px]", active && "stroke-[2.2]")} />
                    <span className={cn("text-[10px] leading-none", active ? "font-medium" : "font-normal")}>
                      {item.title.length > 7 ? item.title.slice(0, 7) + "…" : item.title}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        {/* ===== MOBILE DRAWER ===== */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
                onClick={() => setDrawerOpen(false)}
              />
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed left-0 top-0 bottom-0 w-[280px] bg-sb-surface z-50 flex flex-col md:hidden border-r border-sb-outline-variant/8 shadow-2xl"
              >
                <div className="flex items-center justify-between px-4 h-14 shrink-0 border-b border-sb-outline-variant/8">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-7 h-7 rounded-[6px] bg-sb-on-surface">
                      <Code2 className="h-[15px] w-[15px] text-sb-on-primary" />
                    </div>
                    <span className="text-[14px] font-medium text-sb-on-surface">Dev Console</span>
                  </div>
                  <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-xl hover:bg-sb-surface-container-high transition-colors">
                    <X className="h-5 w-5 text-sb-on-surface-variant/60" />
                  </button>
                </div>
                <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
                  {navSections.map(section => (
                    <div key={section.title}>
                      <p className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-sb-on-surface-variant/50">{section.title}</p>
                      <div className="space-y-0.5">
                        {section.items.map(item => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setDrawerOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-2.5 py-2.5 rounded-[6px] text-[13px] transition-colors",
                              isActive(item.href)
                                ? "bg-sb-on-surface text-sb-surface font-medium"
                                : "text-sb-on-surface-variant/70 hover:bg-sb-surface-container/60 hover:text-sb-on-surface"
                            )}
                          >
                            <item.icon className="h-[16px] w-[16px] shrink-0" />
                            <span className="flex-1">{item.title}</span>
                            {item.badge && (
                              <span className={cn(
                                "text-[9px] font-bold px-1.5 py-0.5 rounded-[4px]",
                                item.badge === 'NEW' ? "bg-emerald-500 text-white"
                                  : item.badge === 'DEV' ? "bg-amber-500 text-white"
                                    : "bg-sb-surface-container text-sb-on-surface-variant"
                              )}>
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>
                <div className="px-3 py-3 border-t border-sb-outline-variant/8 space-y-1">
                  <button onClick={() => { setTheme(theme === "dark" ? "light" : "dark"); setDrawerOpen(false) }}
                    className="flex items-center gap-3 w-full px-2.5 py-2.5 rounded-[6px] text-[13px] text-sb-on-surface-variant/70 hover:bg-sb-surface-container/60 hover:text-sb-on-surface transition-colors">
                    <Sun className="h-[16px] w-[16px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[16px] w-[16px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span>Tema</span>
                  </button>
                  <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/' }}
                    className="flex items-center gap-3 w-full px-2.5 py-2.5 rounded-[6px] text-[13px] text-sb-on-surface-variant/70 hover:bg-sb-surface-container/60 hover:text-sb-on-surface transition-colors">
                    <LogOut className="h-[16px] w-[16px]" />
                    <span>Salir</span>
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
