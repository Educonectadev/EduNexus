"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface Tab {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: number | string
}

interface PrettyTabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (id: string) => void
  className?: string
  size?: "default" | "small" | "xsmall"
}

export function PrettyTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
  size = "default",
}: PrettyTabsProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = React.useState({ left: 0, width: 0 })

  React.useEffect(() => {
    if (!containerRef.current) return
    const activeEl = containerRef.current.querySelector<HTMLButtonElement>(`[data-tab-id="${activeTab}"]`)
    if (activeEl) {
      const parentRect = containerRef.current.getBoundingClientRect()
      const elRect = activeEl.getBoundingClientRect()
      setIndicatorStyle({
        left: elRect.left - parentRect.left,
        width: elRect.width,
      })
    }
  }, [activeTab])

  return (
    <div
      ref={containerRef}
      className={cn(
        "pretty-tabs",
        size === "small" && "small",
        size === "xsmall" && "xsmall",
        className
      )}
      role="tablist"
    >
      <motion.div
        className="pretty-tabs__indicator"
        animate={indicatorStyle}
        transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.6 }}
      />
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={cn("pretty-tabs__tab", isActive && "active")}
          >
            {Icon && <Icon className="h-[18px] w-[18px]" />}
            {tab.label}
            {tab.badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 font-semibold">
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
