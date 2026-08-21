"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { MoreHorizontal, X, User, Sparkles } from "@/components/ui/proicons"

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
}: MobileNavbarProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const contentRef = React.useRef<HTMLDivElement>(null)

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
        className={cn("mobile-navbar fixed left-0 right-0 z-[60]", className)}
        initial={{ y: 100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.6, delay: 0.1 }}
      >
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="fixed inset-0 -z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
          )}
        </AnimatePresence>
        <div className="mobile-nav-inner relative flex items-end justify-center w-full">
          {/* Main Nav Container - border-radius 50px */}
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
            <div className="relative flex flex-col items-end">
              {/* Backdrop */}
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    className="fixed inset-0 -z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setMenuOpen(false)}
                  />
                )}
              </AnimatePresence>

              {/* Morph Container */}
              <motion.div
                layout
                className="relative z-50"
                style={{
                  backgroundColor: menuOpen ? "var(--sb-on-surface)" : "var(--sb-on-surface)",
                  boxShadow: "0 8px 32px -8px rgba(0,0,0,0.35)",
                }}
                animate={{
                  width: menuOpen ? 224 : 56,
                  height: menuOpen ? openSize.height || 'auto' : 56,
                  borderRadius: menuOpen ? 28 : 999,
                }}
                initial={false}
                transition={{
                  layout: { type: "spring", stiffness: 400, damping: 30 },
                  width: { type: "spring", stiffness: 400, damping: 30 },
                  height: { type: "spring", stiffness: 400, damping: 30 },
                  borderRadius: { type: "spring", stiffness: 400, damping: 30 },
                }}
              >
                {/* Button Icon - stays in corner when menu open */}
                <motion.button
                  type="button"
                  className="absolute flex items-center justify-center w-14 h-14 z-10"
                  onClick={() => setMenuOpen(v => !v)}
                  aria-label="Más opciones"
                  aria-expanded={menuOpen}
                  whileTap={{ scale: 0.9 }}
                  animate={{
                    x: menuOpen ? 168 : 0,
                    y: menuOpen ? 0 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <motion.div
                    animate={{
                      rotate: menuOpen ? 135 : 0,
                      color: "var(--sb-surface)",
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  >
                    {menuOpen ? (
                      <X className="h-5 w-5" strokeWidth={2.5} />
                    ) : (
                      <MoreHorizontal className="h-5 w-5" />
                    )}
                  </motion.div>
                </motion.button>

                {/* Menu Content */}
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      ref={contentRef}
                      className="absolute inset-0 overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: 0.1, duration: 0.15 }}
                    >
                      <div className="w-56 h-full">
                        <div className="p-2 pb-3 pl-3 pr-14">
                          {onAiClick && (
                            <button
                              type="button"
                              onClick={() => { setMenuOpen(false); onAiClick() }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-sb-surface rounded-2xl transition-colors hover:bg-sb-surface/10"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sb-surface/10 text-sb-surface/70">
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
                                ? "bg-sb-surface text-sb-on-surface font-medium"
                                : "text-sb-surface/70 hover:bg-sb-surface/10 hover:text-sb-surface"
                            )}
                          >
                            <span className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                              activeHref === "/perfil" ? "bg-sb-on-surface/20 text-sb-surface" : "bg-sb-surface/10 text-sb-surface/60"
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
                                  ? "bg-sb-surface text-sb-on-surface font-medium"
                                  : "text-sb-surface/70 hover:bg-sb-surface/10 hover:text-sb-surface"
                              )}
                            >
                              <span className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                                isActive(item) ? "bg-sb-on-surface/20 text-sb-surface" : "bg-sb-surface/10 text-sb-surface/60"
                              )}>
                                <item.icon className="h-4 w-4" />
                              </span>
                              {item.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
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
