"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { MoreHorizontal, Sparkles, User } from "lucide-react"

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
      className="relative flex items-center justify-center w-14 h-14"
      aria-label={item.title}
      aria-current={isActive ? "page" : undefined}
      whileTap={{ scale: 0.9 }}
    >
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{
          borderRadius: isActive ? 20 : 999,
          backgroundColor: isActive ? "var(--sb-on-surface)" : "rgba(0,0,0,0)",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.7 }}
      />
      <motion.div
        className="relative z-10 flex items-center justify-center"
        animate={{
          scale: isActive ? 1.1 : 1,
          color: isActive ? "var(--sb-surface)" : "var(--sb-on-surface-variant)",
          opacity: isActive ? 1 : 0.7,
        }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
      >
        <item.icon className="h-5 w-5" />
      </motion.div>
      {typeof item.badge === "number" && item.badge > 0 && (
        <span className={cn(
          "absolute top-0 right-0 min-w-[14px] h-3.5 rounded-full text-[8px] font-medium flex items-center justify-center px-1 border border-sb-surface z-20",
          isActive
            ? "bg-sb-surface text-sb-on-surface"
            : "bg-sb-surface-container text-sb-on-surface-variant/60"
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
  maxVisible = 3,
}: MobileNavbarProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const navStyle = "minimal"

  const visibleItems = items.slice(0, maxVisible)
  const optionsItems = items.slice(maxVisible)
  const OptionsIcon = optionsItems[0]?.icon

  const isActive = (item: NavItem) => {
    if (item.href === `/${role}`) {
      return activeHref === `/${role}` || activeHref === `/${role}/dashboard`
    }
    return activeHref === item.href || activeHref.startsWith(item.href + "/")
  }

  return (
    <div className="md:hidden">
      <motion.nav
        className={cn("mobile-navbar fixed left-0 right-0 z-30", className)}
        data-style={navStyle}
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
          <div className="mobile-nav-more absolute right-4 bottom-0">
            <div className="relative flex flex-col items-end">
              <motion.button
                type="button"
                className="relative flex items-center justify-center w-14 h-14"
                onClick={() => setMenuOpen(v => !v)}
                aria-label="Más opciones"
                aria-expanded={menuOpen}
                whileTap={{ scale: 0.9 }}
              >
                <motion.div
                  className="absolute inset-0"
                  initial={false}
                  animate={{
                    borderRadius: menuOpen ? 20 : 999,
                    backgroundColor: menuOpen ? "var(--sb-on-surface)" : "rgba(0,0,0,0)",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.7 }}
                />
                <motion.div
                  className="relative z-10 flex items-center justify-center"
                  animate={{
                    rotate: menuOpen ? 90 : 0,
                    color: menuOpen ? "var(--sb-surface)" : "var(--sb-on-surface-variant)",
                    opacity: menuOpen ? 1 : 0.7,
                  }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  <MoreHorizontal className="h-5 w-5" />
                </motion.div>
              </motion.button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    className="absolute bottom-0 right-0 z-10 w-64 overflow-hidden rounded-xl shadow-[0_8px_40px_-8px_rgba(0,0,0,0.35)]"
                    initial={{ opacity: 0, scaleY: 0.4, y: 12, filter: "blur(8px)" }}
                    animate={{ opacity: 1, scaleY: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scaleY: 0.4, y: 12, filter: "blur(8px)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.7 }}
                    style={{ transformOrigin: "bottom", backgroundColor: "var(--sb-on-surface)" }}
                  >
                    <div className="p-2">
                      {onAiClick && (
                        <button
                          type="button"
                          onClick={() => { setMenuOpen(false); onAiClick() }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-sb-surface hover:bg-black/10 dark:hover:bg-white/10 rounded-2xl transition-colors"
                        >
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sb-primary/20 text-sb-primary">
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
                            : "text-sb-surface/70 hover:bg-black/10 dark:hover:bg-white/10 hover:text-sb-surface"
                        )}
                      >
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sb-surface/20 text-sb-surface">
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
                              : "text-sb-surface/70 hover:bg-black/10 dark:hover:bg-white/10 hover:text-sb-surface"
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {item.title}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
          {[1, 2, 3].map(i => (
            <div key={i} className="w-14 h-14 rounded-full bg-sb-surface-container-highest/50 animate-pulse" />
          ))}
        </div>
        <div className="absolute right-4 bottom-0 w-14 h-14 rounded-full bg-sb-surface-container-highest/50 animate-pulse" />
      </div>
    </div>
  )
}
