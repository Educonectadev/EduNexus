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
      className="relative flex items-center justify-center w-11 h-11"
      aria-label={item.title}
      aria-current={isActive ? "page" : undefined}
      whileTap={{ scale: 0.9 }}
    >
      <motion.div
        className="absolute inset-0 rounded-[18px]"
        initial={false}
        animate={{
          backgroundColor: isActive ? "var(--sb-on-surface)" : "transparent",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
      <motion.div
        className="relative z-10 flex items-center justify-center"
        animate={{
          scale: isActive ? 1.05 : 1,
          color: isActive ? "var(--sb-surface)" : "var(--sb-on-surface-variant)",
          opacity: isActive ? 1 : 0.6,
        }}
        transition={{ duration: 0.2 }}
      >
        <item.icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.5 : 2} />
      </motion.div>
      {typeof item.badge === "number" && item.badge > 0 && (
        <span className={cn(
          "absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-1 border-2 z-20",
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
      {/* Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[59] bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.nav
        className={cn("fixed bottom-4 left-0 right-0 z-[60] px-4", className)}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.1 }}
      >
        <div className="flex items-end justify-center gap-3">
          {/* Main Nav Container */}
          <motion.div
            className="flex items-center gap-1 px-2 py-2"
            style={{
              backgroundColor: "var(--sb-surface)",
              boxShadow: "0 8px 32px -8px rgba(0,0,0,0.3), 0 2px 8px -2px rgba(0,0,0,0.15)",
            }}
            animate={{
              borderRadius: 50,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
          >
            {visibleItems.map((item) => (
              <NavButton
                key={item.href}
                item={item}
                isActive={isActive(item)}
                router={router}
              />
            ))}
          </motion.div>

          {/* More Options Button - Separated */}
          <div className="relative">
            <motion.button
              type="button"
              onClick={() => setMenuOpen(v => !v)}
              className="relative flex items-center justify-center w-11 h-11"
              style={{
                backgroundColor: menuOpen ? "var(--sb-on-surface)" : "var(--sb-surface)",
                boxShadow: "0 8px 32px -8px rgba(0,0,0,0.3), 0 2px 8px -2px rgba(0,0,0,0.15)",
              }}
              animate={{
                borderRadius: 50,
              }}
              whileTap={{ scale: 0.9 }}
              aria-label="Más opciones"
              aria-expanded={menuOpen}
            >
              <motion.div
                animate={{
                  rotate: menuOpen ? 45 : 0,
                  color: menuOpen ? "var(--sb-surface)" : "var(--sb-on-surface-variant)",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 18 }}
              >
                {menuOpen ? (
                  <X className="h-5 w-5" strokeWidth={2.5} />
                ) : (
                  <MoreHorizontal className="h-5 w-5" strokeWidth={2} />
                )}
              </motion.div>
            </motion.button>

            {/* Expanded Menu */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  ref={contentRef}
                  className="absolute bottom-full right-0 mb-3 w-56 overflow-hidden"
                  style={{
                    backgroundColor: "var(--sb-surface)",
                    boxShadow: "0 -4px 32px -8px rgba(0,0,0,0.25), 0 2px 8px -2px rgba(0,0,0,0.1)",
                  }}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                >
                  <div className="p-2">
                    {onAiClick && (
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); onAiClick() }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm font-medium rounded-2xl transition-colors hover:opacity-80"
                        style={{ color: "var(--sb-on-surface)" }}
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                          style={{ backgroundColor: "var(--sb-primary)", color: "var(--sb-on-primary)" }}
                        >
                          <Sparkles className="h-4 w-4" />
                        </span>
                        Asistente IA
                      </button>
                    )}

                    {optionsItems.map((item) => (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => { setMenuOpen(false); router.push(item.href) }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm rounded-2xl transition-colors",
                          isActive(item) ? "font-medium" : ""
                        )}
                        style={{
                          backgroundColor: isActive(item) ? "var(--sb-on-surface)" : "transparent",
                          color: isActive(item) ? "var(--sb-surface)" : "var(--sb-on-surface)",
                        }}
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: isActive(item) ? "rgba(255,255,255,0.2)" : "var(--sb-surface-container)",
                            color: isActive(item) ? "var(--sb-surface)" : "var(--sb-on-surface-variant)",
                          }}
                        >
                          <item.icon className="h-4 w-4" />
                        </span>
                        {item.title}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); router.push("/perfil") }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm rounded-2xl transition-colors"
                      style={{
                        backgroundColor: activeHref === "/perfil" ? "var(--sb-on-surface)" : "transparent",
                        color: activeHref === "/perfil" ? "var(--sb-surface)" : "var(--sb-on-surface)",
                      }}
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: activeHref === "/perfil" ? "rgba(255,255,255,0.2)" : "var(--sb-surface-container)",
                          color: activeHref === "/perfil" ? "var(--sb-surface)" : "var(--sb-on-surface-variant)",
                        }}
                      >
                        <User className="h-4 w-4" />
                      </span>
                      Mi perfil
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.nav>
    </div>
  )
}

export function MobileNavbarSkeleton() {
  return (
    <div className="fixed bottom-4 left-0 right-0 z-30 px-4">
      <div className="flex items-end justify-center gap-3">
        <div
          className="flex items-center gap-1 px-2 py-2"
          style={{ backgroundColor: "var(--sb-surface)", boxShadow: "0 8px 32px -8px rgba(0,0,0,0.3)" }}
        >
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-11 h-11 rounded-[18px] animate-pulse" style={{ backgroundColor: "var(--sb-surface-container)" }} />
          ))}
        </div>
        <div
          className="w-11 h-11 rounded-full animate-pulse"
          style={{ backgroundColor: "var(--sb-surface)", boxShadow: "0 8px 32px -8px rgba(0,0,0,0.3)" }}
        />
      </div>
    </div>
  )
}
