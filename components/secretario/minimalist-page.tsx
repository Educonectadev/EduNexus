"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "@/components/ui/proicons"
import Link from "next/link"

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    >
      <div>
        <h2 className="text-[22px] font-bold tracking-tight text-sb-on-surface">{title}</h2>
        {description && (
          <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </motion.div>
  )
}

interface MinimalStat {
  label: string
  value: string | number
  icon: LucideIcon
  color?: string
}

interface PageStatsProps {
  stats: MinimalStat[]
  columns?: 2 | 3 | 4 | 5
}

export function PageStats({ stats, columns = 4 }: PageStatsProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 }}
      className={cn("grid gap-px rounded-2xl overflow-hidden bg-sb-outline-variant/20", gridCols[columns])}
    >
      {stats.map((s, i) => {
        const Icon = s.icon
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 + i * 0.03 }}
            className="bg-sb-surface p-4 text-center"
          >
            <div className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center mx-auto mb-2",
              s.color || "bg-sb-surface-container"
            )}>
              <Icon className="h-4 w-4 text-sb-on-surface-variant/50" />
            </div>
            <p className="text-lg font-bold tracking-tight text-sb-on-surface">{s.value}</p>
            <p className="text-[10px] text-sb-on-surface-variant/40 mt-0.5">{s.label}</p>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

interface PageSearchProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  action?: React.ReactNode
}

export function PageSearch({ value, onChange, placeholder = "Buscar...", action }: PageSearchProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 }}
      className="flex gap-3"
    >
      <div className="relative flex-1">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="sb-input rounded-xl"
          style={{ paddingLeft: "36px" }}
        />
      </div>
      {action}
    </motion.div>
  )
}

interface PageListProps {
  children: React.ReactNode
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyDescription?: string
}

export function PageList({ children, emptyIcon: EmptyIcon, emptyTitle, emptyDescription }: PageListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.09 }}
    >
      {React.Children.count(children) === 0 && EmptyIcon ? (
        <div className="text-center py-16">
          <EmptyIcon className="h-10 w-10 mx-auto mb-3 text-sb-on-surface-variant/15" />
          <p className="text-sm text-sb-on-surface-variant/40">{emptyTitle}</p>
          {emptyDescription && (
            <p className="text-xs text-sb-on-surface-variant/25 mt-1">{emptyDescription}</p>
          )}
        </div>
      ) : (
        <div className="bg-sb-surface rounded-2xl overflow-hidden divide-y divide-sb-outline-variant/10">
          {children}
        </div>
      )}
    </motion.div>
  )
}

interface PageListItemProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function PageListItem({ children, className, onClick }: PageListItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3.5 hover:bg-sb-surface-container-low/50 transition-colors",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface PageCardProps {
  children: React.ReactNode
  className?: string
}

export function PageCard({ children, className }: PageCardProps) {
  return (
    <div className={cn("bg-sb-surface rounded-2xl p-4", className)}>
      {children}
    </div>
  )
}
