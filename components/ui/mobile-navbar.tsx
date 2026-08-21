"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { MoreHorizontal, Sparkles, User, X, Home, BookOpen, Calendar, MessageSquare, Bell, Settings, LogOut } from "@/components/ui/proicons"

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
        className="absolute inset-0 rounded-[20px]"
        initial={false}
        animate={{
          backgroundColor: isActive ? "var(--sb-on-surface)" : "transparent",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.7 }}
      />
      <motion.div
        className="relative z-10 flex items-center justify-center"
        animate={{
          scale: isActive ? 1.1 : 1,
          color: isActive ? "var(--sb-surface)" : "var(--sb-on-surface-variant)",
          opacity: isActive ? 1 : 0.6,
        }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
      >
        <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
      </motion.div>
      {typeof item.badge === "number" && item.badge > 0 && (
        <span className={cn(
          "absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-1 border-2 border-sb-surface z-20",
          isActive
            ? "bg-sb-surface text-sb-on-surface"
            : "bg-sb-primary text-sb-on-primary"
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
}: MobileNavbarProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [openSize, setOpenSize] = React.useState({ width: 0, height: 0 })
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useLayoutEffect(() => {
    if (menuOpen && contentRef.current) {
      const el = contentRef.current
      setOpenSize({ width: el.offsetWidth, height: el.offsetHeight })
    }
  }, [menuOpen])

  const visibleItems = items.slice(0, maxVisible)
  const optionsItems = items.slice(maxVisible)

  const isActive = (item: NavItem) => {
    if (item.href === `/${role}`) {
      return activeHref === `/${role}` || activeHref === `/${role}/dashboard`
    }
    return activeHref === item.href || activeHref.startsWith(item.href + "/")
  }

  return (
    <div className="md:hidden">
      <motion.nav
        className={cn("fixed left-3 right-3 bottom-3 z-[60]", className)}
        initial={{ y: 100, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.6, delay: 0.1 }}
      >
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="fixed inset-0 -z-10 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Main Container */}
        <div className="relative">
          <motion.div
            className="relative overflow-hidden"
            style={{
              backgroundColor: "var(--sb-surface)",
              boxShadow: "0 8px 40px -8px rgba(0,0,0,0.4), 0 2px 12px -2px rgba(0,0,0,0.2)",
            }}
            animate={{
              borderRadius: menuOpen ? 32 : 50,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 26, mass: 0.9 }}
          >
            {/* Navigation Buttons */}
            <div className="flex items-center justify-around px-2 py-2">
              {visibleItems.map((item) => (
                <NavButton
                  key={item.href}
                  item={item}
                  isActive={isActive(item)}
                  router={router}
                />
              ))}

              {/* More Button */}
              <motion.button
                type="button"
                onClick={() => setMenuOpen(v => !v)}
                className="relative flex items-center justify-center w-12 h-12"
                aria-label="Más opciones"
                aria-expanded={menuOpen}
                whileTap={{ scale: 0.9 }}
              >
                <motion.div
                  className="absolute inset-0 rounded-[20px]"
                  animate={{
                    backgroundColor: menuOpen ? "var(--sb-on-surface)" : "transparent",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.7 }}
                />
                <motion.div
                  className="relative z-10 flex items-center justify-center"
                  animate={{
                    rotate: menuOpen ? 45 : 0,
                    color: menuOpen ? "var(--sb-surface)" : "var(--sb-on-surface-variant)",
                    opacity: menuOpen ? 1 : 0.6,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 18, mass: 0.8 }}
                >
                  {menuOpen ? (
                    <X className="h-5 w-5" strokeWidth={2.5} />
                  ) : (
                    <MoreHorizontal className="h-5 w-5" strokeWidth={2} />
                  )}
                </motion.div>
              </motion.button>
            </div>
          </motion.div>

          {/* Expanded Menu */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
              >
                <div
                  ref={contentRef}
                  className="rounded-[28px] overflow-hidden"
                  style={{
                    backgroundColor: "var(--sb-surface)",
                    boxShadow: "0 -4px 40px -8px rgba(0,0,0,0.3), 0 2px 12px -2px rgba(0,0,0,0.15)",
                  }}
                >
                  {/* Menu Header */}
                  <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--sb-on-surface-variant)", opacity: 0.5 }}>
                      Menú
                    </span>
                  </div>

                  {/* Menu Items */}
                  <div className="px-3 pb-3 space-y-1">
                    {onAiClick && (
                      <motion.button
                        type="button"
                        onClick={() => { setMenuOpen(false); onAiClick() }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium rounded-[20px] transition-colors"
                        style={{ color: "var(--sb-on-surface)" }}
                        whileHover={{ backgroundColor: "var(--sb-on-surface-variant)", backgroundColor: "rgba(0,0,0,0.05)" }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px]" style={{ backgroundColor: "var(--sb-primary)", color: "var(--sb-on-primary)" }}>
                          <Sparkles className="h-4 w-4" />
                        </span>
                        Asistente IA
                      </motion.button>
                    )}

                    {optionsItems.map((item, index) => (
                      <motion.button
                        key={item.href}
                        type="button"
                        onClick={() => { setMenuOpen(false); router.push(item.href) }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 text-left text-sm rounded-[20px] transition-colors",
                          isActive(item) ? "font-medium" : ""
                        )}
                        style={{
                          backgroundColor: isActive(item) ? "var(--sb-on-surface)" : "transparent",
                          color: isActive(item) ? "var(--sb-surface)" : "var(--sb-on-surface)",
                        }}
                        whileHover={{ backgroundColor: isActive(item) ? "var(--sb-on-surface)" : "rgba(0,0,0,0.05)" }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px]"
                          style={{
                            backgroundColor: isActive(item) ? "rgba(255,255,255,0.2)" : "var(--sb-surface-container)",
                            color: isActive(item) ? "var(--sb-surface)" : "var(--sb-on-surface-variant)",
                          }}
                        >
                          <item.icon className="h-4 w-4" />
                        </span>
                        {item.title}
                      </motion.button>
                    ))}

                    {/* Profile Button */}
                    <motion.button
                      type="button"
                      onClick={() => { setMenuOpen(false); router.push("/perfil") }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm rounded-[20px] transition-colors"
                      style={{
                        backgroundColor: activeHref === "/perfil" ? "var(--sb-on-surface)" : "transparent",
                        color: activeHref === "/perfil" ? "var(--sb-surface)" : "var(--sb-on-surface)",
                      }}
                      whileHover={{ backgroundColor: activeHref === "/perfil" ? "var(--sb-on-surface)" : "rgba(0,0,0,0.05)" }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: optionsItems.length * 0.05 }}
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px]"
                        style={{
                          backgroundColor: activeHref === "/perfil" ? "rgba(255,255,255,0.2)" : "var(--sb-surface-container)",
                          color: activeHref === "/perfil" ? "var(--sb-surface)" : "var(--sb-on-surface-variant)",
                        }}
                      >
                        <User className="h-4 w-4" />
                      </span>
                      Mi perfil
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>
    </div>
  )
}

export function MobileNavbarSkeleton() {
  return (
    <div className="fixed bottom-3 left-3 right-3 z-30">
      <div className="flex items-center justify-around px-2 py-2 rounded-[50px]" style={{ backgroundColor: "var(--sb-surface)", boxShadow: "0 8px 40px -8px rgba(0,0,0,0.4)" }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="w-12 h-12 rounded-[20px] animate-pulse" style={{ backgroundColor: "var(--sb-surface-container)" }} />
        ))}
      </div>
    </div>
  )
}
