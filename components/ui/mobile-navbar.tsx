"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { MoreHorizontal, X, User, Sparkles, LogOut, ChevronRight } from "@/components/ui/proicons"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

interface NavGroup {
  title: string
  icon: React.ComponentType<{ className?: string }>
  items: NavItem[]
}

interface MobileNavbarProps {
  items?: NavItem[]
  groups?: NavGroup[]
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
          backgroundColor: isActive ? "white" : "transparent",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
      <motion.div
        className="relative z-10 flex items-center justify-center"
        animate={{
          scale: isActive ? 1.1 : 1,
          color: isActive ? "black" : "white",
          opacity: isActive ? 1 : 0.8,
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

/* ═══════════════════════════════════════════════════════
   MODO GROUPS — botones visibles + bottom-sheet agrupado
   ═══════════════════════════════════════════════════════ */
function GroupedNavbar({
  items,
  groups,
  activeHref,
  role,
  maxVisible = 4,
  onAiClick,
  onLogout,
}: {
  items: NavItem[]
  groups: NavGroup[]
  activeHref: string
  role?: string
  maxVisible?: number
  onAiClick?: () => void
  onLogout?: () => void
}) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const morphRef = React.useRef<HTMLDivElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [menuHeight, setMenuHeight] = React.useState<number>(56)

  const visibleItems = items.slice(0, maxVisible)
  const hasMore = groups.length > 0 || items.length > maxVisible

  const isActive = (item: NavItem) => {
    if (item.href === `/${role}`) {
      return activeHref === `/${role}` || activeHref === `/${role}/dashboard`
    }
    return activeHref === item.href || activeHref.startsWith(item.href + "/")
  }

  React.useLayoutEffect(() => {
    if (menuOpen && menuRef.current) {
      setMenuHeight(Math.max(menuRef.current.scrollHeight, 56))
    }
  }, [menuOpen])

  React.useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => { if (morphRef.current && !morphRef.current.contains(e.target as Node)) setMenuOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false) }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey) }
  }, [menuOpen])

  return (
    <div className="md:hidden">
      <motion.nav
        className="mobile-navbar fixed left-0 right-0 z-[60]"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 32, delay: 0.1 }}
      >
        <div className="mobile-nav-inner relative flex items-end justify-center w-full">
          <div className="mobile-nav-buttons relative flex items-center justify-around gap-1 mr-14 bg-black/80 backdrop-blur-xl rounded-[50px] px-2 py-1.5">
            {visibleItems.map((item) => (
              <NavButton key={item.href} item={item} isActive={isActive(item)} router={router} />
            ))}
          </div>

          {/* Botón "más" con menú agrupado */}
          {hasMore && (
            <div className="mobile-nav-more absolute right-3 bottom-0">
              <div ref={morphRef} className="t-morph" data-open={menuOpen ? "true" : "false"} style={menuOpen ? { height: `${Math.min(menuHeight, 420)}px` } : undefined}>
                <div ref={menuRef} className="t-morph-menu overflow-y-auto max-h-[70vh]" role="menu">
                  <div className="p-2 pb-3 pl-3 pr-14">
                    {onAiClick && (
                      <button type="button" onClick={() => { setMenuOpen(false); onAiClick() }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-white rounded-2xl transition-colors hover:bg-white/15">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                          <Sparkles className="h-4 w-4" />
                        </span>
                        Asistente IA
                      </button>
                    )}

                    {/* Secciones agrupadas */}
                    {groups.map((group) => (
                      <div key={group.title} className="mt-1.5">
                        <p className="px-3 mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">{group.title}</p>
                        {group.items.map((item) => (
                          <button key={item.href} type="button" onClick={() => { setMenuOpen(false); router.push(item.href) }}
                            className={cn("w-full flex items-center gap-3 px-3 py-1.5 text-left text-sm rounded-xl transition-colors",
                              isActive(item) ? "bg-white text-black font-medium" : "text-white hover:bg-white/15 hover:text-white"
                            )}>
                            <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-lg",
                              isActive(item) ? "bg-black/20 text-black" : "bg-white/15 text-white"
                            )}>
                              <item.icon className="h-3 w-3" />
                            </span>
                            {item.title}
                          </button>
                        ))}
                      </div>
                    ))}

                    {onLogout && (
                      <>
                        <div className="h-px bg-white/15 my-2" />
                        <button type="button" onClick={() => { setMenuOpen(false); onLogout() }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm rounded-2xl transition-colors text-red-400 hover:bg-red-500/20 hover:text-red-300">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
                            <LogOut className="h-4 w-4" />
                          </span>
                          Cerrar sesión
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <button type="button" className="t-morph-plus" aria-expanded={menuOpen ? "true" : "false"} aria-label="Más opciones"
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}>
                  <MoreHorizontal className="h-5 w-5 text-sb-surface" />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.nav>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   MODO ITEMS — botones + dropdown "more" (original)
   ═══════════════════════════════════════════════════════ */
function FlatNavbar({
  items,
  activeHref,
  role,
  className,
  onAiClick,
  maxVisible = 4,
  onLogout,
}: {
  items: NavItem[]
  activeHref: string
  role?: string
  className?: string
  onAiClick?: () => void
  maxVisible?: number
  onLogout?: () => void
}) {
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

  React.useLayoutEffect(() => {
    if (menuOpen && menuRef.current) {
      const height = menuRef.current.scrollHeight
      setMenuHeight(Math.max(height, 56))
    }
  }, [menuOpen, onAiClick, optionsItems.length])

  React.useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (morphRef.current && !morphRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false) }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey) }
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
          <div className="mobile-nav-buttons relative flex items-center justify-around gap-1 mr-14 bg-black/80 backdrop-blur-xl rounded-[50px] px-2 py-1.5">
            {visibleItems.map((item) => (
              <NavButton key={item.href} item={item} isActive={isActive(item)} router={router} />
            ))}
          </div>

          {optionsItems.length > 0 && (
            <div className="mobile-nav-more absolute right-3 bottom-0">
              <div ref={morphRef} className="t-morph" data-open={menuOpen ? "true" : "false"} style={menuOpen ? { height: `${menuHeight}px` } : undefined}>
                <div ref={menuRef} className="t-morph-menu" role="menu">
                  <div className="p-2 pb-3 pl-3 pr-14">
                    {onAiClick && (
                      <button type="button" onClick={() => { setMenuOpen(false); onAiClick() }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-white rounded-2xl transition-colors hover:bg-white/15">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                          <Sparkles className="h-4 w-4" />
                        </span>
                        Asistente IA
                      </button>
                    )}

                    <button type="button" onClick={() => { setMenuOpen(false); router.push("/perfil") }}
                      className={cn("w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm rounded-2xl transition-colors",
                        activeHref === "/perfil" ? "bg-white text-black font-medium" : "text-white hover:bg-white/15 hover:text-white"
                      )}>
                      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                        activeHref === "/perfil" ? "bg-black/20 text-black" : "bg-white/15 text-white"
                      )}>
                        <User className="h-4 w-4" />
                      </span>
                      Mi perfil
                    </button>

                    {optionsItems.map((item) => (
                      <button key={item.href} type="button" onClick={() => { setMenuOpen(false); router.push(item.href) }}
                        className={cn("w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm rounded-2xl transition-colors",
                          isActive(item) ? "bg-white text-black font-medium" : "text-white hover:bg-white/15 hover:text-white"
                        )}>
                        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                          isActive(item) ? "bg-black/20 text-black" : "bg-white/15 text-white"
                        )}>
                          <item.icon className="h-4 w-4" />
                        </span>
                        {item.title}
                      </button>
                    ))}

                    {onLogout && (
                      <>
                        <div className="h-px bg-white/15 my-1" />
                        <button type="button" onClick={() => { setMenuOpen(false); onLogout() }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm rounded-2xl transition-colors text-red-400 hover:bg-red-500/20 hover:text-red-300">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
                            <LogOut className="h-3.5 w-3.5" />
                          </span>
                          Cerrar sesión
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <button type="button" className="t-morph-plus" aria-expanded={menuOpen ? "true" : "false"} aria-label="Más opciones"
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}>
                  <MoreHorizontal className="h-5 w-5 text-sb-surface" />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.nav>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   EXPORT — detecta si usa groups o items
   ═══════════════════════════════════════════════════════ */
export function MobileNavbar(props: MobileNavbarProps) {
  if (props.groups && props.groups.length > 0) {
    const allItems = props.groups.flatMap(g => g.items)
    const items = props.items || allItems
    return <GroupedNavbar items={items} groups={props.groups} activeHref={props.activeHref} role={props.role} maxVisible={props.maxVisible} onAiClick={props.onAiClick} onLogout={props.onLogout} />
  }
  if (props.items && props.items.length > 0) {
    return <FlatNavbar items={props.items} activeHref={props.activeHref} role={props.role} className={props.className} onAiClick={props.onAiClick} maxVisible={props.maxVisible} onLogout={props.onLogout} />
  }
  return null
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
