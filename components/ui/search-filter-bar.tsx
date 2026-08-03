"use client"

import * as React from "react"
import { Search, X, Command, ChevronDown, Check, Filter } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

/* ===== Custom Select Dropdown ===== */
export function SbfSelect({ value, onChange, options, placeholder, icon: Icon }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string; count?: number }[]
  placeholder?: string
  icon?: React.ElementType
}) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className={`sbf-select-wrap ${open ? "open" : ""}`}>
      <motion.button
        onClick={() => setOpen(!open)}
        className={`sbf-select-trigger ${value ? "has-value" : ""}`}
        animate={open ? { scale: 1.03, y: -1 } : { scale: 1, y: 0 }}
        whileHover={{ scale: 1.06, y: -2 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.7 }}
      >
        {Icon && <Icon className="h-3.5 w-3.5 opacity-50" />}
        <span className="sbf-select-label">
          {selected ? selected.label : placeholder || "Seleccionar"}
        </span>
        <ChevronDown className="sbf-select-chevron" />
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="sbf-select-dropdown"
            initial={{ filter: "blur(32px)", opacity: 0, scale: 0.95, y: -8 }}
            animate={{ filter: "blur(0px)", opacity: 1, scale: 1, y: 0 }}
            exit={{ filter: "blur(32px)", opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.3, ease: [0.37, 0.35, 0, 1] }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`sbf-select-option ${value === opt.value ? "selected" : ""}`}
              >
                <Check className="sbf-option-check" />
                <span className="sbf-option-label">{opt.label}</span>
                {opt.count != null && (
                  <span className="sbf-option-count">{opt.count}</span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ===== Search Bar ===== */
export function SbfSearchBar({ value, onChange, placeholder, inputRef, onFocus, onBlur }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  inputRef?: React.RefObject<HTMLInputElement | null>
  onFocus?: () => void
  onBlur?: () => void
}) {
  const [focused, setFocused] = React.useState(false)

  return (
    <div className={`sbf-search-container ${focused ? "focused" : ""}`}>
      <div className="sbf-search-inner">
        <div className="sbf-search-input-wrap">
          <Search className="sbf-search-icon h-5 w-5" />
          <input
            ref={inputRef}
            placeholder={placeholder || "Buscar..."}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => { setFocused(true); onFocus?.() }}
            onBlur={() => { setFocused(false); onBlur?.() }}
            className="sbf-search-input"
          />
          <div className="sbf-search-actions">
            {value && (
              <button
                onClick={() => { onChange(""); inputRef?.current?.focus() }}
                className="sbf-clear-btn"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <div className="sbf-kbd">
              <Command className="sbf-kbd-icon" />
              <span className="sbf-kbd-text">K</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ===== Filter Chips (inline toggle buttons) ===== */
export function SbfChipGroup({ options, value, onChange, allLabel }: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  allLabel?: string
}) {
  return (
    <div className="sbf-chip-group">
      <button
        onClick={() => onChange("")}
        className={`sbf-chip ${!value ? "active" : ""}`}
      >
        <Check className="sbf-chip-check" />
        {allLabel || "Todos"}
      </button>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`sbf-chip ${value === opt.value ? "active" : ""}`}
        >
          <Check className="sbf-chip-check" />
          {opt.label}
        </button>
      ))}
    </div>
  )
}

/* ===== Filter Trigger Button ===== */
export function SbfFilterTrigger({ label, icon: Icon, active, count, onClick }: {
  label: string
  icon?: React.ElementType
  active?: boolean
  count?: number
  onClick?: () => void
}) {
  return (
    <button className={`sbf-filter-btn ${active ? "active" : ""}`} onClick={onClick}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
      {count != null && count > 0 && (
        <span className="sbf-filter-badge">{count}</span>
      )}
    </button>
  )
}

/* ===== Clear Filters Button ===== */
export function SbfClearFilters({ count, onClick }: {
  count: number
  onClick: () => void
}) {
  if (count <= 0) return null
  return (
    <button className="sbf-clear-filters-btn" onClick={onClick}>
      <X className="h-3 w-3" />
      Limpiar ({count})
    </button>
  )
}

/* ===== Results Counter ===== */
export function SbfResultsCount({ count, query, onClear }: {
  count: number
  query: string
  onClear?: () => void
}) {
  return (
    <div className="sbf-results-count">
      <p className="sbf-results-count-text">
        {count} resultado{count !== 1 ? "s" : ""}
        {query && (
          <> para "<span className="sbf-results-count-query">{query}</span>"</>
        )}
      </p>
      {onClear && query && (
        <button className="sbf-results-count-clear" onClick={onClear}>
          Limpiar
        </button>
      )}
    </div>
  )
}

/* ===== Filter Panel ===== */
export function SbfFilterPanel({ title, showClear, onClear, children }: {
  title?: string
  showClear?: boolean
  onClear?: () => void
  children: React.ReactNode
}) {
  return (
    <div className="sbf-filter-panel">
      <div className="sbf-filter-panel-header">
        <span className="sbf-filter-panel-title">{title || "Filtros"}</span>
        {showClear && (
          <button className="sbf-filter-panel-clear" onClick={onClear}>
            Limpiar
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

export { Filter as SbfFilterIcon }
