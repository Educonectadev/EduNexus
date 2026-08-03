"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { TotalBalanceCard } from "./total-balance-card"
import { PrettyTabs } from "./pretty-tabs"
import { StatCard } from "./stat-card"

interface StatConfig {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: string | null
  href?: string
  color?: string
}

interface TabConfig {
  id: string
  label: string
  content: React.ReactNode
}

interface DashboardViewProps {
  title: string
  description?: string
  roleLabel?: string
  balance?: {
    amount: string
    trend?: { value: string; positive: boolean }
  }
  stats: StatConfig[]
  tabs?: TabConfig[]
  activeTab?: string
  onTabChange?: (id: string) => void
  children?: React.ReactNode
  className?: string
}

export function DashboardView({
  title,
  description,
  roleLabel,
  balance,
  stats,
  tabs,
  activeTab: controlledTab,
  onTabChange: controlledTabChange,
  children,
  className,
}: DashboardViewProps) {
  const [internalTab, setInternalTab] = React.useState(tabs?.[0]?.id || "")

  const activeTab = controlledTab ?? internalTab
  const setActiveTab = controlledTabChange ?? setInternalTab

  const activeTabContent = tabs?.find(t => t.id === activeTab)?.content

  return (
    <div className={cn("w-full space-y-6 py-1", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-sb-on-surface">
            {title}
          </h1>
          <p className="text-sm text-sb-on-surface-variant mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {roleLabel && (
            <span className="text-[11px] text-sb-on-surface-variant bg-sb-surface-container-high px-3 py-1.5 rounded-full font-medium">
              {roleLabel}
            </span>
          )}
          <span className="text-[11px] text-sb-on-surface-variant bg-sb-surface-container-high px-3 py-1.5 rounded-full font-medium">
            {new Date().toLocaleDateString("es-PE", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {balance && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.02 }}
        >
          <TotalBalanceCard
            balance={balance.amount}
            label="Balance Total"
            trend={balance.trend}
          />
        </motion.div>
      )}

      {stats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3"
        >
          {stats.map((stat, i) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              trend={stat.trend}
              href={stat.href}
              color={stat.color}
              index={i}
            />
          ))}
        </motion.div>
      )}

      {tabs && tabs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <PrettyTabs
            tabs={tabs.map(t => ({ id: t.id, label: t.label }))}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            size="small"
          />
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {activeTabContent && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
            transition={{ duration: 0.2, ease: [0.37, 0.35, 0, 1] }}
          >
            {activeTabContent}
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </div>
  )
}
