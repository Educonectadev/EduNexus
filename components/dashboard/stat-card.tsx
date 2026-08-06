"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { TrendingUp } from "@/components/ui/proicons"
import { motion } from "framer-motion"

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: string | null
  href?: string
  color?: string
  index?: number
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  href,
  color,
  index = 0,
}: StatCardProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <div
        className={cn(
          "bg-sb-surface-container rounded-[24px] p-5 border border-sb-outline-variant/20",
          "hover:bg-sb-surface-container-high/50 transition-all duration-200 group cursor-pointer"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className={cn(
            "h-9 w-9 rounded-2xl flex items-center justify-center",
            color || "bg-sb-surface-container-high"
          )}>
            <Icon className={cn(
              "h-[18px] w-[18px] transition-colors",
              color ? "text-sb-primary" : "text-sb-on-surface-variant group-hover:text-sb-primary"
            )} />
          </div>
          <span className="text-[10px] text-sb-on-surface-variant font-semibold uppercase tracking-wider">
            {label}
          </span>
        </div>
        <p className="text-[28px] font-bold tracking-tight text-sb-on-surface leading-none">
          {value}
        </p>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="text-[11px] font-semibold text-emerald-400">{trend}</span>
          </div>
        )}
      </div>
    </motion.div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}
