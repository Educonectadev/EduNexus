"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { X } from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"

/* ===== BUTTONS ===== */
export function SbBtn({ children, variant = "default", size = "md", rounded, active, className, ...props }: {
  children: React.ReactNode
  variant?: "default" | "filled" | "tonal" | "outlined" | "danger"
  size?: "sm" | "md"
  rounded?: boolean
  active?: boolean
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = "sb-btn"
  const variants: Record<string, string> = {
    default: "",
    filled: "filled",
    tonal: "tonal",
    outlined: "outlined",
    danger: "danger",
  }
  return (
    <button className={cn(base, variants[variant], rounded && "rounded", active && "active", size === "sm" && "text-xs px-3 py-1.5", className)} {...props}>
      {children}
    </button>
  )
}

export function SbIconBtn({ children, className, active, ...props }: {
  children: React.ReactNode
  className?: string
  active?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn("sb-btn-icon", active && "active", className)} {...props}>
      {children}
    </button>
  )
}

/* ===== INPUTS ===== */
export const SbInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function SbInput({ className, ...props }, ref) {
    return <input ref={ref} className={cn("sb-input", className)} {...props} />
  }
)

export function SbSelect({ children, className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("sb-select", className)} {...props}>
      {children}
    </select>
  )
}

/* ===== MODAL ===== */
export function SbModal({ open, onClose, children, maxWidth }: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  maxWidth?: string
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="sb-modal-backdrop" onClick={onClose}>
          <motion.div
            className="sb-modal-window"
            style={maxWidth ? { maxWidth } : undefined}
            onClick={(e) => e.stopPropagation()}
            initial={{ filter: "blur(32px)", opacity: 0, scale: 0.95 }}
            animate={{ filter: "blur(0px)", opacity: 1, scale: 1 }}
            exit={{ filter: "blur(32px)", opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.37, 0.35, 0, 1] }}>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function SbModalHeader({ title, onClose, children }: {
  title: string
  onClose?: () => void
  children?: React.ReactNode
}) {
  return (
    <div className="sb-modal-header flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h3 className="text-base font-medium text-sb-on-surface">{title}</h3>
        {children}
      </div>
      {onClose && (
        <button onClick={onClose} className="sb-btn-icon"><X className="h-4 w-4" /></button>
      )}
    </div>
  )
}

export function SbModalBody({ children, className, noPadding }: { children: React.ReactNode; className?: string; noPadding?: boolean }) {
  return <div className={cn("sb-modal-body", noPadding && "!p-0", className)}>{children}</div>
}

export function SbModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("sb-modal-footer", className)}>{children}</div>
}

/* ===== CARDS ===== */
export function SbCard({ children, className, hover, ...props }: {
  children: React.ReactNode
  className?: string
  hover?: boolean
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "sb-card",
        hover && "sb-hover-scale sb-hover-outline",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function SbContentBox({ children, className, variant = "default", rounded }: {
  children: React.ReactNode
  className?: string
  variant?: "default" | "light" | "transparent"
  rounded?: boolean
}) {
  return (
    <div className={cn(
      "sb-content-box",
      variant === "light" && "light-color",
      variant === "transparent" && "transparent",
      rounded && "rounded",
      className
    )}>
      {children}
    </div>
  )
}

export function SbStatCard({ label, value, icon: Icon, color, trend }: {
  label: string
  value: string | number
  icon?: React.ComponentType<{ className?: string }>
  color?: string
  trend?: string
}) {
  return (
    <SbCard>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-sb-on-surface-variant/40 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-semibold text-sb-on-surface mt-1">{value}</p>
          {trend && <p className="text-xs text-emerald-400 mt-1">{trend}</p>}
        </div>
        {Icon && (
          <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center shrink-0", color || "bg-sb-surface-container-high")}>
            <Icon className="h-4 w-4 text-sb-on-surface-variant/60" />
          </div>
        )}
      </div>
    </SbCard>
  )
}

/* ===== BADGE ===== */
export function SbBadge({ children, color, className }: {
  children: React.ReactNode
  color?: string
  className?: string
}) {
  return (
    <span className={cn(
      "text-[10px] font-medium px-2.5 py-1 rounded-full inline-flex items-center",
      color || "bg-sb-surface-container-high text-sb-on-surface-variant/60",
      className
    )}>
      {children}
    </span>
  )
}

/* ===== DATA LINE (chip) ===== */
export function SbDataLine({ children, className, variant }: {
  children: React.ReactNode
  className?: string
  variant?: "default" | "light" | "accent"
}) {
  return (
    <span className={cn(
      "sb-data-line",
      variant === "light" && "light-color",
      variant === "accent" && "accent",
      className
    )}>
      {children}
    </span>
  )
}

/* ===== TABLE ===== */
export function SbTable({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("sb-table", className)}>{children}</table>
    </div>
  )
}

/* ===== EMPTY STATE ===== */
export function SbEmpty({ icon: Icon, title, description }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
}) {
  return (
    <div className="text-center py-16">
      <Icon className="h-14 w-14 text-sb-on-surface-variant/15 mx-auto mb-3" />
      <h3 className="text-base font-medium text-sb-on-surface/60">{title}</h3>
      {description && <p className="text-sm text-sb-on-surface-variant/30 mt-1">{description}</p>}
    </div>
  )
}

/* ===== SECTION HEADER ===== */
export function SbSectionHeader({ title, description, action }: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-sb-on-surface">{title}</h2>
        {description && <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  )
}

/* ===== LABEL ===== */
export function SbLabel({ children, className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-sb-on-surface", className)} {...props}>{children}</label>
}

/* ===== TEXTAREA ===== */
export function SbTextarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("sb-input min-h-[80px] resize-y", className)} {...props} />
}

/* ===== SWITCH ===== */
export function SbSwitch({ checked, onCheckedChange, className }: {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
        checked ? "bg-sb-primary" : "bg-sb-outline-variant",
        className
      )}
    >
      <span className={cn(
        "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200",
        checked ? "translate-x-5" : "translate-x-0"
      )} />
    </button>
  )
}

/* ===== TABS ===== */
export function SbTabs({ tabs, activeTab, onTabChange, className }: {
  tabs: { id: string; label: string }[]
  activeTab: string
  onTabChange: (id: string) => void
  className?: string
}) {
  return (
    <div className={cn("flex gap-1 p-1 bg-sb-surface-container rounded-2xl", className)}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
            activeTab === tab.id
              ? "bg-sb-surface-container-high text-sb-on-surface"
              : "text-sb-on-surface-variant/50 hover:text-sb-on-surface/70"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

/* ===== DROPDOWN (stepbro style) ===== */
export function SbDropdown({ trigger, children, align = "left", className }: {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "left" | "right" | "auto"
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [pos, setPos] = React.useState<"left" | "right">("left")
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  React.useEffect(() => {
    if (open && ref.current && align === "auto") {
      const rect = ref.current.getBoundingClientRect()
      const spaceRight = window.innerWidth - rect.right
      setPos(spaceRight < 200 ? "right" : "left")
    } else if (align === "right") {
      setPos("right")
    } else {
      setPos("left")
    }
  }, [open, align])

  const triggerEl = React.isValidElement(trigger)
    ? React.cloneElement(trigger as React.ReactElement<any>, {
        onClick: (e: React.MouseEvent) => {
          setOpen(!open);
          (trigger as any).props?.onClick?.(e)
        },
      })
    : <div onClick={() => setOpen(!open)} className="cursor-pointer">{trigger}</div>

  return (
    <div ref={ref} className="relative inline-flex">
      {triggerEl}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute z-50 mt-2 min-w-[180px] py-1.5",
              "bg-sb-surface-container rounded-2xl",
              "border border-sb-outline-variant/15",
              "shadow-[0_8px_32px_-8px_rgba(0,0,0,0.25)]",
              pos === "right" ? "right-0" : "left-0",
              className
            )}
            onClick={() => setOpen(false)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function SbDropdownItem({ children, icon: Icon, onClick, danger, className }: {
  children: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  onClick?: () => void
  danger?: boolean
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
        "hover:bg-sb-surface-container-high",
        danger ? "text-red-400" : "text-sb-on-surface/80",
        className
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      {children}
    </button>
  )
}

/* ===== SEARCHABLE SELECT ===== */
export function SbSearchSelect({ value, onChange, placeholder, options, className }: {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  options: string[]
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [highlightIdx, setHighlightIdx] = React.useState(-1)
  const [dropUp, setDropUp] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
  const displayValue = value || ""

  React.useEffect(() => {
    setQuery("")
    setHighlightIdx(-1)
  }, [open])

  React.useEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setDropUp(spaceBelow < 280)
    }
  }, [open])

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightIdx(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightIdx(i => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && highlightIdx >= 0) {
      e.preventDefault()
      onChange(filtered[highlightIdx])
      setOpen(false)
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        onClick={() => { setOpen(!open); setTimeout(() => inputRef.current?.focus(), 0) }}
        className={cn(
          "sb-input w-full flex items-center justify-between cursor-pointer",
          !displayValue && "text-sb-on-surface-variant/50"
        )}
      >
        <span className="truncate">{displayValue || placeholder || "Seleccionar..."}</span>
        <svg className={cn("w-4 h-4 shrink-0 text-sb-on-surface-variant transition-transform", open && "rotate-180")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: dropUp ? 4 : -4, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: dropUp ? 4 : -4, filter: "blur(4px)" }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-[60] w-full bg-sb-surface-container border border-sb-outline-variant rounded-xl overflow-hidden shadow-lg",
              dropUp ? "bottom-full mb-1" : "top-full mt-1"
            )}
          >
            <div className="p-2 border-b border-sb-outline-variant">
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setHighlightIdx(-1) }}
                onKeyDown={handleKeyDown}
                className="sb-input w-full text-sm"
                autoFocus
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {value && (
                <button
                  onClick={() => { onChange(""); setOpen(false) }}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-sb-surface-container-high transition-colors border-b border-sb-outline-variant"
                >
                  Limpiar selección
                </button>
              )}
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-sb-on-surface-variant/50">
                  Sin resultados
                </div>
              ) : (
                filtered.map((opt, i) => (
                  <button
                    key={opt}
                    onClick={() => { onChange(opt); setOpen(false) }}
                    onMouseEnter={() => setHighlightIdx(i)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm transition-colors",
                      highlightIdx === i ? "bg-sb-surface-container-high text-sb-on-surface" : "text-sb-on-surface/80",
                      value === opt && "font-semibold"
                    )}
                  >
                    {opt}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ===== TOAST ===== */
type ToastType = "success" | "error" | "warning" | "info"
interface Toast { id: number; message: string; type: ToastType }

const toastContext = React.createContext<{
  toast: (message: string, type?: ToastType) => void
}>({ toast: () => {} })

export function useToast() {
  return React.useContext(toastContext)
}

export function SbToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const counter = React.useRef(0)

  const toast = React.useCallback((message: string, type: ToastType = "info") => {
    const id = ++counter.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  const icons: Record<ToastType, string> = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  }

  const colors: Record<ToastType, string> = {
    success: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    error: "bg-red-500/15 border-red-500/30 text-red-400",
    warning: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    info: "bg-blue-500/15 border-blue-500/30 text-blue-400",
  }

  const dotColors: Record<ToastType, string> = {
    success: "bg-emerald-400",
    error: "bg-red-400",
    warning: "bg-amber-400",
    info: "bg-blue-400",
  }

  return (
    <toastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, scale: 0.95, filter: "blur(4px)" }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-lg max-w-sm ${colors[t.type]}`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${dotColors[t.type]} text-black`}>
                {icons[t.type]}
              </span>
              <p className="text-sm text-sb-on-surface flex-1">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="text-sb-on-surface-variant/50 hover:text-sb-on-surface shrink-0">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </toastContext.Provider>
  )
}

/* ===== NAV PILL (floating pill bottom nav, mobile-only) ===== */
export function SbNavPill({ items, activeHref, maxVisible = 5 }: {
  items: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; badge?: number }[]
  activeHref: string
  maxVisible?: number
}) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const visible = items.slice(0, maxVisible)
  const overflow = items.slice(maxVisible)

  const NavButton = ({ item }: { item: typeof items[0] }) => {
    const isActive = activeHref === item.href || (item.href !== "/" && activeHref.startsWith(item.href))
    const Icon = item.icon
    return (
      <button type="button" onClick={() => router.push(item.href)}
        className={`sb-nav-pill-btn ${isActive ? "active" : ""}`}
        aria-label={item.label} aria-current={isActive ? "page" : undefined}>
        {isActive && (
          <motion.span layoutId="sb-nav-pill-indicator" className="sb-nav-pill-indicator"
            transition={{ type: "spring", stiffness: 420, damping: 34 }} />
        )}
        <span className="sb-nav-pill-tooltip">{item.label}</span>
        <span className="sb-nav-icon"><Icon className="h-5 w-5" /></span>
        {typeof item.badge === "number" && item.badge > 0 && (
          <span className="sb-nav-pill-badge">{item.badge > 9 ? "9+" : item.badge}</span>
        )}
      </button>
    )
  }

  return (
    <>
      <div className="sb-nav-pill-wrap">
        <motion.nav className="sb-nav-pill" initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.6 }}>
          {visible.map(item => <NavButton key={item.href} item={item} />)}
          {overflow.length > 0 && (
            <button type="button" onClick={() => setSheetOpen(true)}
              className="sb-nav-pill-btn" aria-label="Más secciones">
              <span className="sb-nav-pill-tooltip">Más</span>
              <span className="sb-nav-icon">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
                </svg>
              </span>
            </button>
          )}
        </motion.nav>
      </div>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm md:hidden"
            onClick={() => setSheetOpen(false)}>
            <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 36, mass: 0.8 }}
              className="absolute bottom-0 left-0 right-0 bg-sb-surface-container rounded-t-[32px] max-h-[70vh] overflow-y-auto p-4"
              onClick={e => e.stopPropagation()}>
              <div className="w-8 h-1 rounded-full bg-sb-outline-variant/30 mx-auto mb-4" />
              <p className="text-[10px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider mb-3 px-1">
                Navegación
              </p>
              <div className="space-y-0.5">
                {overflow.map((item) => {
                  const isActive = activeHref === item.href || (item.href !== "/" && activeHref.startsWith(item.href))
                  const Icon = item.icon
                  return (
                    <button key={item.href} onClick={() => { router.push(item.href); setSheetOpen(false) }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all ${isActive ? "bg-sb-primary text-sb-on-primary" : "text-sb-on-surface hover:bg-sb-surface-container-high"}`}>
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${isActive ? "bg-white/20" : "bg-sb-surface-container-high"}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium flex-1">{item.label}</span>
                      {typeof item.badge === "number" && item.badge > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sb-primary/20 text-sb-on-primary">{item.badge}</span>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 px-4 pb-2">
                <button onClick={() => setSheetOpen(false)}
                  className="w-full py-3 rounded-2xl bg-sb-surface-container-high text-sm font-medium text-sb-on-surface-variant/60 hover:text-sb-on-surface-variant transition-colors">
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/* ===== APP NAV (stepbro-style bottom bar, mobile-first) ===== */
function SbRipple({ color }: { color?: string }) {
  return (
    <span className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
      <span className="ripple-effect" style={{ background: color || 'var(--sb-on-surface-variant)' }} />
    </span>
  )
}

export function SbAppNav({ items, activeHref, maxVisible = 5 }: {
  items: { href: string; icon: React.ComponentType<{ className?: string }> }[]
  activeHref: string
  maxVisible?: number
}) {
  const router = useRouter()
  const visible = items.slice(0, maxVisible)
  
  return (
    <nav className="flex items-center gap-2 bg-transparent">
      {visible.map((item, index) => {
        const isActive = activeHref === item.href || (item.href !== "/" && activeHref.startsWith(item.href))
        const Icon = item.icon
        return (
          <motion.button
            key={item.href}
            type="button"
            onClick={() => router.push(item.href)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.25 }}
            whileTap={{ scale: 0.95 }}
            className="relative flex items-center justify-center w-14 h-14"
          >
            {/* Hover background - subtle circle */}
            <motion.div
              className="absolute inset-0 rounded-full"
              initial={false}
              animate={{
                backgroundColor: isActive ? "var(--sb-on-surface)" : "rgba(0,0,0,0)",
                scale: isActive ? 1 : 0.8,
              }}
              whileHover={{
                backgroundColor: isActive ? "var(--sb-on-surface)" : "rgba(0,0,0,0.08)",
                scale: 1,
              }}
              transition={{
                duration: isActive ? 0.25 : 0.15,
                ease: "easeInOut",
              }}
            />
            
            {/* Icon */}
            <motion.div
              className="relative z-10"
              animate={{
                scale: isActive ? 1.1 : 1,
                color: isActive ? "var(--sb-surface)" : "var(--sb-on-surface-variant)",
              }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <Icon className="h-6 w-6" />
            </motion.div>
          </motion.button>
        )
      })}
    </nav>
  )
}
