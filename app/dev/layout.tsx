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
  Menu,
  X,
  Sun,
  Moon,
  Code2,
  Key,
  Activity,
  CreditCard,
  UserCircle,
  FileText,
  Inbox,
  ChevronRight,
  DollarSign,
  BarChart3,
  HardDrive,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  section?: 'main' | 'tools' | 'system'
}

const devNav: NavItem[] = [
  { title: "Overview", href: "/dev", icon: LayoutDashboard, section: 'main' },
  { title: "Solicitudes", href: "/dev/demo", icon: Inbox, badge: "NEW", section: 'main' },
  { title: "Instituciones", href: "/dev/instituciones", icon: Building2, section: 'main' },
  { title: "Usuarios", href: "/dev/usuarios", icon: Users, section: 'main' },
  { title: "Planes", href: "/dev/planes", icon: CreditCard, section: 'main' },
  { title: "Facturación", href: "/dev/facturacion", icon: DollarSign, section: 'main' },
  { title: "Reportes", href: "/dev/reportes", icon: BarChart3, section: 'main' },
  { title: "Contraseñas", href: "/dev/contrasenas", icon: Key, section: 'tools' },
  { title: "Seguimiento", href: "/dev/seguimiento", icon: Activity, section: 'tools' },
  { title: "Database", href: "/dev/database", icon: Database, badge: "SQL", section: 'tools' },
  { title: "Seed", href: "/dev/seed", icon: Terminal, badge: "DEV", section: 'tools' },
  { title: "Audit", href: "/dev/audit", icon: Shield, section: 'system' },
  { title: "Backups", href: "/dev/backups", icon: HardDrive, section: 'system' },
  { title: "Perfil", href: "/dev/perfil", icon: UserCircle, section: 'system' },
  { title: "Settings", href: "/dev/config", icon: Settings, section: 'system' },
]

const mobileNav = devNav.filter(n => ["Overview","Solicitudes","Instituciones","Usuarios","Database"].includes(n.title))

export default function DevLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  React.useEffect(() => {
    const saved = localStorage.getItem("sb-theme-variant")
    if (saved) document.documentElement.setAttribute("data-theme", saved)
  }, [])

  const sections = {
    main: devNav.filter(n => n.section === 'main'),
    tools: devNav.filter(n => n.section === 'tools'),
    system: devNav.filter(n => n.section === 'system'),
  }

  const NavItem = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || (item.href !== "/dev" && pathname.startsWith(item.href))
    return (
      <Link href={item.href} className="group relative">
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150",
            isActive
              ? "bg-zinc-900 text-white font-medium dark:bg-white dark:text-zinc-900"
              : "text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high/60 hover:text-sb-on-surface"
          )}
        >
          <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white dark:text-zinc-900" : "")} />
          <span className="truncate">{item.title}</span>
          {item.badge && (
            <span className={cn(
              "ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md",
              item.badge === 'NEW' 
                ? "bg-emerald-500 text-white" 
                : item.badge === 'DEV'
                  ? "bg-amber-500 text-white"
                  : "bg-sb-surface-container text-sb-on-surface-variant"
            )}>
              {item.badge}
            </span>
          )}
        </div>
      </Link>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-sb-background text-sb-on-surface">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[240px] h-full border-r border-sb-outline-variant/8 bg-sb-surface">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 shrink-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sb-on-surface">
            <Code2 className="h-4.5 w-4.5 text-sb-on-primary" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-sb-on-surface">Developer</p>
            <p className="text-[10px] text-sb-on-surface-variant/40">Educonecta Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-semibold text-sb-on-surface-variant/30 uppercase tracking-widest">Principal</p>
            <div className="space-y-0.5">
              {sections.main.map(item => <NavItem key={item.href} item={item} />)}
            </div>
          </div>

          {/* Tools */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-semibold text-sb-on-surface-variant/30 uppercase tracking-widest">Herramientas</p>
            <div className="space-y-0.5">
              {sections.tools.map(item => <NavItem key={item.href} item={item} />)}
            </div>
          </div>

          {/* System */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-semibold text-sb-on-surface-variant/30 uppercase tracking-widest">Sistema</p>
            <div className="space-y-0.5">
              {sections.system.map(item => <NavItem key={item.href} item={item} />)}
            </div>
          </div>
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-sb-outline-variant/8 space-y-1">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high/60 hover:text-sb-on-surface transition-colors"
          >
            <span className="relative h-4 w-4">
              <Sun className="absolute inset-0 h-4 w-4 transition-all duration-300 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute inset-0 h-4 w-4 transition-all duration-300 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
            </span>
            <span>Tema</span>
          </button>
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high/60 hover:text-sb-on-surface transition-colors">
            <LogOut className="h-4 w-4" />
            <span>Salir</span>
          </Link>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-sb-surface z-50 flex flex-col lg:hidden border-r border-sb-outline-variant/8 shadow-2xl"
            >
              {/* Mobile sidebar header */}
              <div className="flex items-center justify-between px-5 h-16 shrink-0 border-b border-sb-outline-variant/8">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sb-on-surface">
                    <Code2 className="h-4.5 w-4.5 text-sb-on-primary" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-sb-on-surface">Developer</p>
                    <p className="text-[10px] text-sb-on-surface-variant/40">Educonecta Panel</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSidebarOpen(false)} 
                  className="p-2 rounded-xl hover:bg-sb-surface-container-high transition-colors"
                >
                  <X className="h-5 w-5 text-sb-on-surface-variant/60" />
                </button>
              </div>

              {/* Mobile sidebar nav */}
              <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                <div>
                  <p className="px-3 mb-2 text-[10px] font-semibold text-sb-on-surface-variant/30 uppercase tracking-widest">Principal</p>
                  <div className="space-y-0.5">
                    {sections.main.map(item => {
                      const isActive = pathname === item.href || (item.href !== "/dev" && pathname.startsWith(item.href))
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] transition-all",
                            isActive
                              ? "bg-zinc-900 text-white font-medium dark:bg-white dark:text-zinc-900"
                              : "text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high/60"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="flex-1">{item.title}</span>
                          {item.badge && (
                            <span className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded-md",
                              item.badge === 'NEW' ? "bg-emerald-500 text-white" : "bg-sb-surface-container text-sb-on-surface-variant"
                            )}>
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight className="h-3.5 w-3.5 text-sb-on-surface-variant/30" />
                        </Link>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <p className="px-3 mb-2 text-[10px] font-semibold text-sb-on-surface-variant/30 uppercase tracking-widest">Herramientas</p>
                  <div className="space-y-0.5">
                    {sections.tools.map(item => {
                      const isActive = pathname === item.href || (item.href !== "/dev" && pathname.startsWith(item.href))
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] transition-all",
                            isActive
                              ? "bg-zinc-900 text-white font-medium dark:bg-white dark:text-zinc-900"
                              : "text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high/60"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="flex-1">{item.title}</span>
                          {item.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-sb-surface-container text-sb-on-surface-variant">
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight className="h-3.5 w-3.5 text-sb-on-surface-variant/30" />
                        </Link>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <p className="px-3 mb-2 text-[10px] font-semibold text-sb-on-surface-variant/30 uppercase tracking-widest">Sistema</p>
                  <div className="space-y-0.5">
                    {sections.system.map(item => {
                      const isActive = pathname === item.href || (item.href !== "/dev" && pathname.startsWith(item.href))
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] transition-all",
                            isActive
                              ? "bg-zinc-900 text-white font-medium dark:bg-white dark:text-zinc-900"
                              : "text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high/60"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="flex-1">{item.title}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-sb-on-surface-variant/30" />
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </nav>

              {/* Mobile sidebar footer */}
              <div className="px-4 py-4 border-t border-sb-outline-variant/8 space-y-2">
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[14px] text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high/60 transition-colors"
                >
                  <span className="relative h-4 w-4">
                    <Sun className="absolute inset-0 h-4 w-4 transition-all duration-300 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute inset-0 h-4 w-4 transition-all duration-300 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
                  </span>
                  <span>Cambiar tema</span>
                </button>
                <Link
                  href="/"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high/60 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar sesión</span>
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar - compact */}
        <header className="flex items-center justify-between h-14 px-4 shrink-0 border-b border-sb-outline-variant/8 lg:h-16 lg:px-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-sb-surface-container-high transition-colors"
            >
              <Menu className="h-5 w-5 text-sb-on-surface-variant/60" />
            </button>
            <h1 className="text-[15px] font-medium text-sb-on-surface lg:text-[15px]">
              {devNav.find(n => pathname === n.href || (n.href !== "/dev" && pathname.startsWith(n.href)))?.title || "Overview"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-500 font-medium">Online</span>
            </div>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative p-2 rounded-xl hover:bg-sb-surface-container-high transition-colors overflow-hidden"
              title="Toggle theme"
            >
              <Sun className="h-4 w-4 text-sb-on-surface-variant/50 transition-all duration-300 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute inset-0 m-auto h-4 w-4 text-sb-on-surface-variant/50 transition-all duration-300 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto px-4 pb-28 lg:px-5 lg:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile bottom tab bar - modern pill style */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
          <div className="mx-3 mb-3">
            <div className="flex items-center justify-around bg-sb-surface/80 backdrop-blur-xl border border-sb-outline-variant/20 rounded-2xl px-2 py-1.5 shadow-lg shadow-black/10 dark:bg-sb-surface-container/80 dark:shadow-black/30">
              {mobileNav.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dev" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[52px]",
                      isActive
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                        : "text-sb-on-surface-variant/50 hover:text-sb-on-surface"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 transition-all", isActive && "stroke-[2.5]")} />
                    <span className={cn("text-[9px] font-medium leading-tight", isActive && "font-semibold")}>
                      {item.title.slice(0, 6)}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>
      </div>
    </div>
  )
}
