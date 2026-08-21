"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { MoreHorizontal, X, User, Sparkles, LogOut } from "@/components/ui/proicons"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

interface MobileNavbarProps {
  items: NavItem[]
  activeHref: string
  role?: string
  className?: string
  onAiClick?: () => void
  maxVisible?: number
  onLogout?: () => void
}

function NavButton({
  item,
  isActive,
  router,
}: {
  item: NavItem
  isActive: boolean
  router: ReturnType<typeof useRouter>
}) {
  return (
    <motion.button
      type="button"
      onClick={() => router.push(item.href)}
      className="relative flex items-center justify-center w-12 h-12"
      aria-label={item.title}
      aria-current={isActive ? "page" : undefined}
      whileTap={{ scale: 0.9 }}
    >
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{
          borderRadius: 999,
          backgroundColor: isActive ? "var(--sb-on-surface)" : "transparent",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
      <motion.div
        className="relative z-10 flex items-center justify-center"
        animate={{
          scale: isActive ? 1.1 : 1,
          color: isActive ? "var(--sb-surface)" : "var(--sb-on-surface-variant)",
          opacity: isActive ? 1 : 0.6,
        }}
        transition={{ duration: 0.2 }}
      >
        <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
      </motion.div>
      {typeof item.badge === "number" && item.badge > 0 && (
        <span className={cn(
          "absolute top-0 right-0 min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-1 border-2 z-20",
          isActive
            ? "border-sb-surface bg-sb-surface text-sb-on-surface"
            : "border-sb-surface bg-sb-primary text-sb-on-primary"
        )}>
          {item.badge > 9 ? "9+" : item.badge}
        </span>
      )}
    </motion.button>
  )
}

export function MobileNavbar({
  items,
  activeHref,
  role,
  className,
  onAiClick,
  maxVisible = 4,
  onLogout,
}: MobileNavbarProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const morphRef = React.useRef<HTMLDivElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [menuHeight, setMenuHeight] = React.useState<number>(56)

  const visibleItems = items.slice(0, maxVisible)
  const optionsItems = items.slice(maxVisible)

  const isActive = (item: NavItem) => {
    if (item.href === `/${role}`) {
      return activeHref === `/${role}` || activeHref === `/${role}/dashboard`
    }
    return activeHref === item.href || activeHref.startsWith(item.href + "/")
  }

  // Measure content height
  React.useLayoutEffect(() => {
    if (menuOpen && menuRef.current) {
      const height = menuRef.current.scrollHeight
      setMenuHeight(Math.max(height, 56))
    }
  }, [menuOpen, onAiClick, optionsItems.length])

  // Close on outside click
  React.useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (morphRef.current && !morphRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [menuOpen])

  return (
    <div className="md:hidden">
      <motion.nav
        className={cn("mobile-navbar fixed left-0 right-0 z-[60]", className)}
        initial={{ y: 100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.6, delay: 0.1 }}
      >
        <div className="mobile-nav-inner relative flex items-end justify-center w-full">
          {/* Main Nav Container */}
          <div className="mobile-nav-buttons relative flex items-center justify-around gap-1">
            {visibleItems.map((item) => (
              <NavButton
                key={item.href}
                item={item}
                isActive={isActive(item)}
                router={router}
              />
            ))}
          </div>

          {/* More Options Button - Morph Animation */}
          <div className="mobile-nav-more absolute right-4 bottom-0">
            <div
              ref={morphRef}
              className="t-morph"
              data-open={menuOpen ? "true" : "false"}
              style={menuOpen ? { height: `${menuHeight}px` } : undefined}
            >
              {/* Menu Content */}
              <div ref={menuRef} className="t-morph-menu" role="menu">
                <div className="p-2 pb-3 pl-3 pr-14">
                  {onAiClick && (
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onAiClick() }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-sb-surface rounded-2xl transition-colors hover:bg-white/10"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15 text-sb-surface">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      Asistente IA
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); router.push("/perfil") }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm rounded-2xl transition-colors",
                      activeHref === "/perfil"
                        ? "bg-white/20 text-sb-surface font-medium"
                        : "text-sb-surface/80 hover:bg-white/10 hover:text-sb-surface"
                    )}
                  >
                    <span className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                      activeHref === "/perfil" ? "bg-white/25 text-sb-surface" : "bg-white/15 text-sb-surface/80"
                    )}>
                      <User className="h-4 w-4" />
                    </span>
                    Mi perfil
                  </button>

                  {optionsItems.map((item) => (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => { setMenuOpen(false); router.push(item.href) }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm rounded-2xl transition-colors",
                        isActive(item)
                          ? "bg-white/20 text-sb-surface font-medium"
                          : "text-sb-surface/80 hover:bg-white/10 hover:text-sb-surface"
                      )}
                    >
                      <span className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                        isActive(item) ? "bg-white/25 text-sb-surface" : "bg-white/15 text-sb-surface/80"
                      )}>
                        <item.icon className="h-4 w-4" />
                      </span>
                      {item.title}
                    </button>
                  ))}

                  {onLogout && (
                    <>
                      <div className="h-px bg-white/10 my-1" />
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); onLogout() }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm rounded-2xl transition-colors text-red-400 hover:bg-red-500/20 hover:text-red-300"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
                          <LogOut className="h-4 w-4" />
                        </span>
                        Cerrar sesión
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Plus Button */}
              <button
                type="button"
                className="t-morph-plus"
                aria-expanded={menuOpen ? "true" : "false"}
                aria-label="Más opciones"
                onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
              >
                <MoreHorizontal className="h-5 w-5 text-sb-surface" />
              </button>
            </div>
          </div>
        </div>
      </motion.nav>
    </div>
  )
}

export function MobileNavbarSkeleton() {
  return (
    <div className="fixed bottom-4 left-0 right-0 z-30">
      <div className="relative flex items-center justify-center w-full">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-12 h-12 rounded-full bg-sb-surface-container-highest/50 animate-pulse" />
          ))}
        </div>
        <div className="absolute right-4 bottom-0 w-14 h-14 rounded-full bg-sb-surface-container-highest/50 animate-pulse" />
      </div>
    </div>
  )
}
