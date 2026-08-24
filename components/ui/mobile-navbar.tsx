"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { X, User, Sparkles, LogOut, ChevronRight } from "@/components/ui/proicons"

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
  groups: NavGroup[]
  activeHref: string
  role?: string
  className?: string
  onAiClick?: () => void
  onLogout?: () => void
}

export function MobileNavbar({
  groups,
  activeHref,
  role,
  className,
  onAiClick,
  onLogout,
}: MobileNavbarProps) {
  const router = useRouter()
  const [openGroup, setOpenGroup] = React.useState<number | null>(null)

  const isActive = (item: NavItem) => {
    if (item.href === `/${role}`) {
      return activeHref === `/${role}` || activeHref === `/${role}/dashboard`
    }
    return activeHref === item.href || activeHref.startsWith(item.href + "/")
  }

  const currentGroup = openGroup !== null ? groups[openGroup] : null

  if (!groups || groups.length === 0) return null

  return (
    <div className="md:hidden">
      {/* ===== BOTTOM BAR ===== */}
      <motion.nav
        className={cn("mobile-navbar fixed left-0 right-0 z-[60]", className)}
        initial={{ y: 100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.6, delay: 0.1 }}
      >
        <div className="mobile-nav-inner relative flex items-center justify-center w-full gap-2 px-4 py-2">
          {groups.map((group, idx) => {
            const hasActive = group.items.some(i => isActive(i))
            const Icon = group.icon
            return (
              <motion.button
                key={group.title}
                type="button"
                onClick={() => setOpenGroup(idx)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all",
                  hasActive
                    ? "bg-sb-on-surface text-sb-surface"
                    : "bg-sb-surface-container-highest text-sb-on-surface-variant"
                )}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden min-[360px]:inline">{group.title}</span>
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-white/15 text-[10px] font-bold flex items-center justify-center">
                  {group.items.length}
                </span>
              </motion.button>
            )
          })}
        </div>
      </motion.nav>

      {/* ===== MODAL ===== */}
      <AnimatePresence>
        {currentGroup && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setOpenGroup(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Sheet */}
            <motion.div
              className="relative w-full max-w-md bg-sb-surface rounded-t-3xl overflow-hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-sb-on-surface/20" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3">
                <h3 className="text-[15px] font-semibold text-sb-on-surface">{currentGroup.title}</h3>
                <button
                  onClick={() => setOpenGroup(null)}
                  className="p-1.5 rounded-xl hover:bg-sb-surface-container-high transition-colors text-sb-on-surface/60"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Items */}
              <div className="px-4 pb-8 space-y-1 max-h-[60vh] overflow-auto">
                {currentGroup.items.map((item) => {
                  const active = isActive(item)
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => { setOpenGroup(null); router.push(item.href) }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left",
                        active
                          ? "bg-sb-on-surface/10 text-sb-on-surface"
                          : "hover:bg-sb-surface-container-high/50 text-sb-on-surface-variant"
                      )}
                    >
                      <div className={cn(
                        "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
                        active ? "bg-sb-on-surface/15 text-sb-on-surface" : "bg-sb-surface-container-high text-sb-on-surface-variant/70"
                      )}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className={cn("text-sm flex-1", active ? "font-medium" : "")}>{item.title}</span>
                      <ChevronRight className="h-4 w-4 text-sb-on-surface/30 shrink-0" />
                    </button>
                  )
                })}
              </div>

              {/* Footer actions */}
              <div className="px-4 pb-8 pt-2 border-t border-sb-outline-variant/10 space-y-1">
                {onAiClick && (
                  <button
                    type="button"
                    onClick={() => { setOpenGroup(null); onAiClick() }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-sb-on-surface-variant hover:bg-sb-surface-container-high/50 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-xl bg-sb-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-sb-primary" />
                    </div>
                    Asistente IA
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setOpenGroup(null); router.push("/dev/perfil") }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-sb-on-surface-variant hover:bg-sb-surface-container-high/50 transition-colors"
                >
                  <div className="h-9 w-9 rounded-xl bg-sb-surface-container-high flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-sb-on-surface-variant/70" />
                  </div>
                  Mi perfil
                </button>
                {onLogout && (
                  <button
                    type="button"
                    onClick={() => { setOpenGroup(null); onLogout() }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                      <LogOut className="h-4 w-4 text-red-500" />
                    </div>
                    Cerrar sesión
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function MobileNavbarSkeleton() {
  return (
    <div className="fixed bottom-4 left-0 right-0 z-30">
      <div className="relative flex items-center justify-center w-full">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-11 w-28 rounded-2xl bg-sb-surface-container-highest/50 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
