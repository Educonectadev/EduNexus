"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { SbBtn } from "@/components/ui/sb"
import {
  Filter, Check, X, Users, Shield, GraduationCap, BookOpen,
  UserCheck, ChevronDown,
} from "@/components/ui/proicons"
import "@/styles/animations.css"

const springTransition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 0.8,
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.035, delayChildren: 0.05 },
  },
}

const staggerItem = {
  hidden: { opacity: 0, y: 8, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springTransition,
  },
}

interface FilterOption {
  value: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const roleOptions: FilterOption[] = [
  { value: "all", label: "Todos", icon: Users },
  { value: "super_admin", label: "Super Admin", icon: Shield },
  { value: "director", label: "Director", icon: GraduationCap },
  { value: "secretario", label: "Secretario", icon: BookOpen },
  { value: "docente", label: "Docente", icon: UserCheck },
  { value: "padre", label: "Padre", icon: Users },
]

const statusOptions = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
]

export default function FilterButtonTest() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [roleFilter, setRoleFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const containerRef = React.useRef<HTMLDivElement>(null)

  const activeCount = (roleFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0)

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="w-full space-y-6 py-2 md:py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-[22px] md:text-[24px] font-bold tracking-tight text-sb-on-surface">
            Filter Button Test
          </h2>
          <p className="text-[13px] text-sb-on-surface/70 mt-1">
            Animación de expansión con stepbro springs
          </p>
        </div>
      </div>

      {/* Filter Button with inline expansion */}
      <div ref={containerRef} className="relative inline-block">
        {/* The Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`h-10 px-4 rounded-xl flex items-center gap-2 text-[13px] font-medium transition-all duration-200 border ${
            activeCount > 0
              ? "bg-sb-on-surface text-sb-surface border-sb-outline-variant/10"
              : "bg-sb-surface-container text-sb-on-surface/80 border-sb-outline-variant/10 hover:bg-sb-surface-container-high"
          }`}
        >
          <Filter className="h-4 w-4 text-sb-on-surface/70" />
          Filtros
          {activeCount > 0 && (
            <span className="h-5 min-w-5 px-1.5 rounded-full bg-sb-surface text-sb-on-surface text-[10px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={springTransition}
          >
            <ChevronDown className="h-4 w-4 text-sb-on-surface/70" />
          </motion.div>
        </button>

        {/* The Expanding Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{
                opacity: 1,
                height: "auto",
                y: 0,
              }}
              exit={{
                opacity: 0,
                height: 0,
                y: -8,
              }}
              transition={springTransition}
              className="absolute left-0 top-12 z-50 w-80 max-w-full overflow-hidden origin-top"
            >
              <motion.div
                initial={{ scale: 0.95, filter: "blur(4px)" }}
                animate={{ scale: 1, filter: "blur(0px)" }}
                exit={{ scale: 0.95, filter: "blur(4px)" }}
                transition={springTransition}
                className="bg-sb-surface-container rounded-2xl border border-sb-outline-variant/10 p-4"
              >
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="space-y-4"
                >
                  {/* Header */}
                  <motion.div
                    variants={staggerItem}
                    className="flex items-center justify-between"
                  >
                    <p className="text-sm font-semibold text-sb-on-surface">
                      Filtros de búsqueda
                    </p>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="h-8 w-8 rounded-xl flex items-center justify-center text-sb-on-surface/70 hover:bg-sb-surface-container-high transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>

                  {/* Rol */}
                  <motion.div variants={staggerItem}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-sb-on-surface/60 mb-2">
                      Rol
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {roleOptions.map(({ value, label, icon: Icon }) => {
                        const active = roleFilter === value
                        return (
                          <motion.button
                            key={value}
                            variants={staggerItem}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setRoleFilter(value)}
                            className={`h-9 px-3 rounded-xl flex items-center gap-2 text-[12px] font-medium transition-colors border ${
                              active
                                ? "bg-sb-on-surface text-sb-surface border-sb-outline-variant/10"
                                : "bg-sb-surface-container-low text-sb-on-surface/80 border-sb-outline-variant/10 hover:bg-sb-surface-container-high"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{label}</span>
                            {active && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={springTransition}
                                className="ml-auto"
                              >
                                <Check className="h-3 w-3 text-sb-surface" />
                              </motion.div>
                            )}
                          </motion.button>
                        )
                      })}
                    </div>
                  </motion.div>

                  {/* Estado */}
                  <motion.div variants={staggerItem}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-sb-on-surface/60 mb-2">
                      Estado
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {statusOptions.map(({ value, label }) => {
                        const active = statusFilter === value
                        return (
                          <motion.button
                            key={value}
                            variants={staggerItem}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setStatusFilter(value)}
                            className={`relative h-9 px-3 rounded-xl text-[12px] font-medium transition-colors border ${
                              active
                                ? "bg-sb-on-surface text-sb-surface border-sb-outline-variant/10"
                                : "bg-sb-surface-container-low text-sb-on-surface/80 border-sb-outline-variant/10 hover:bg-sb-surface-container-high"
                            }`}
                          >
                            {label}
                            {active && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={springTransition}
                                className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-sb-primary flex items-center justify-center"
                              >
                                <Check className="h-2.5 w-2.5 text-sb-surface" />
                              </motion.div>
                            )}
                          </motion.button>
                        )
                      })}
                    </div>
                  </motion.div>

                  {/* Footer */}
                  <motion.div
                    variants={staggerItem}
                    className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-sb-outline-variant/10"
                  >
                    {activeCount > 0 && (
                      <button
                        onClick={() => {
                          setRoleFilter("all")
                          setStatusFilter("all")
                        }}
                        className="flex-1 h-10 px-3 rounded-xl text-[13px] font-medium text-sb-on-surface hover:bg-sb-surface-container-high transition-colors border border-sb-outline-variant/60"
                      >
                        Limpiar
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="flex-1 h-10 px-3 rounded-xl text-[13px] font-medium bg-sb-on-surface text-sb-surface hover:opacity-90 transition-opacity"
                    >
                      Aplicar
                    </button>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Preview */}
      <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-4">
        <p className="text-xs text-sb-on-surface/60 mb-2">Filtros activos:</p>
        <div className="flex flex-wrap gap-2">
          {roleFilter !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sb-surface-container text-sb-on-surface/80 text-xs font-medium">
              Rol: {roleOptions.find(r => r.value === roleFilter)?.label}
              <button onClick={() => setRoleFilter("all")} className="ml-1 text-sb-on-surface/70 hover:text-sb-on-surface">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {statusFilter !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sb-surface-container text-sb-on-surface/80 text-xs font-medium">
              Estado: {statusOptions.find(s => s.value === statusFilter)?.label}
              <button onClick={() => setStatusFilter("all")} className="ml-1 text-sb-on-surface/70 hover:text-sb-on-surface">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {activeCount === 0 && (
            <span className="text-xs text-sb-on-surface/60">
              Sin filtros aplicados
            </span>
          )}
        </div>
      </div>
    </div>
  )
}