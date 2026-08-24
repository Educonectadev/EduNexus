"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthStore } from "@/stores/auth-store"
import { useSidebarStore } from "@/stores/sidebar-store"
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Settings,
  Shield,
  FileText,
  HeadphonesIcon,
  Database,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  BookOpen,
  ClipboardList,
  MessageSquare,
  Calendar,
  UserCheck,
  BookMarked,
} from "@/components/ui/proicons"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const superAdminNav: NavItem[] = [
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
]

const directorNav: NavItem[] = [
  { title: "Dashboard", href: "/director", icon: LayoutDashboard },
  { title: "Personal", href: "/director/personal", icon: Users },
  { title: "Padres", href: "/director/padres", icon: Users },
  { title: "Plantel", href: "/director/plantel", icon: Building2 },
  { title: "Cursos", href: "/director/cursos", icon: BookOpen },
  { title: "Horarios", href: "/director/horarios", icon: Calendar },
  { title: "Comunicados", href: "/director/comunicados", icon: MessageSquare },
  { title: "Reuniones", href: "/director/reuniones", icon: Calendar },
  { title: "Reportes", href: "/director/reportes", icon: BarChart3 },
  { title: "Configuración", href: "/director/configuracion", icon: Settings },
]

const secretarioNav: NavItem[] = [
  { title: "Dashboard", href: "/secretario", icon: LayoutDashboard },
  { title: "Personal", href: "/secretario/personal", icon: Users },
  { title: "Matrículas", href: "/secretario/matriculas", icon: BookOpen },
  { title: "Documentos", href: "/secretario/documentos", icon: FileText },
  { title: "Certificados", href: "/secretario/certificados", icon: ClipboardList },
  { title: "Historial", href: "/secretario/historial", icon: Database },
  { title: "Búsqueda", href: "/secretario/busqueda", icon: BarChart3 },
]

const docenteNav: NavItem[] = [
  { title: "Dashboard", href: "/docente", icon: LayoutDashboard },
  { title: "Mis Cursos", href: "/docente/cursos", icon: BookOpen },
  { title: "Horarios", href: "/docente/horarios", icon: Calendar },
  { title: "Reuniones", href: "/docente/reuniones", icon: Calendar },
  { title: "Asistencia", href: "/docente/asistencia", icon: UserCheck },
  { title: "Calificaciones", href: "/docente/calificaciones", icon: BookMarked },
  { title: "Tareas", href: "/docente/tareas", icon: ClipboardList },
  { title: "Materiales", href: "/docente/materiales", icon: FileText },
  { title: "Calendario", href: "/docente/calendario", icon: Calendar },
  { title: "Mensajes", href: "/docente/mensajes", icon: MessageSquare },
]

const padreNav: NavItem[] = [
  { title: "Dashboard", href: "/padre", icon: LayoutDashboard },
  { title: "Mi Hijo", href: "/padre/hijo", icon: GraduationCap },
  { title: "Asistencia", href: "/padre/asistencia", icon: UserCheck },
  { title: "Tareas", href: "/padre/tareas", icon: ClipboardList },
  { title: "Pagos", href: "/padre/pagos", icon: CreditCard },
  { title: "Comunicados", href: "/padre/comunicados", icon: MessageSquare },
  { title: "Calendario", href: "/padre/calendario", icon: Calendar },
]

const navByRole: Record<string, NavItem[]> = {
  super_admin: superAdminNav,
  director: directorNav,
  secretario: secretarioNav,
  docente: docenteNav,
  padre: padreNav,
}

const roleTitles: Record<string, string> = {
  super_admin: "Super Administrador",
  director: "Director",
  secretario: "Secretario",
  docente: "Docente",
  padre: "Padre",
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, role, logout } = useAuthStore()
  const { isCollapsed, toggle } = useSidebarStore()

  const navItems = role ? navByRole[role] : []

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    logout()
    router.push("/login")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <aside
      className={cn(
        "relative flex flex-col fixed sidebar-fixed left-0 top-0 bottom-0 z-50",
        "w-64 shrink-0",
        isCollapsed ? "w-[64px]" : "w-[237px]"
      )}
    >
      <div className="flex h-16 items-center border-b border-border/50 px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo className="h-8 w-8" />
          <span className="font-semibold text-foreground tracking-tight">EduNexus</span>
        </Link>
      </div>

      <div className="px-4 py-3 border-b border-border/50">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Panel</p>
<p className="text-sm font-medium text-foreground mt-0.5">
{role && roleTitles[role]}
        </p>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto">
        <nav className="space-y-0.5 p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-border/50 p-2">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar_url} alt={user.full_name} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs font-medium">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.full_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl",
            isCollapsed && "justify-center px-0"
          )}
          onClick={handleLogout}
          title={isCollapsed ? "Cerrar sesión" : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>Cerrar sesión</span>}
        </Button>
      </div>

      <button
        onClick={toggle}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-white/20 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white/30 transition-colors z-50"
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3 text-black" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-black" />
        )}
      </button>
    </aside>
  )
}
