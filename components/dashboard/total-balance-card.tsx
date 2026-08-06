"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, TrendingUp, TrendingDown } from "@/components/ui/proicons"
import { motion } from "framer-motion"

interface TotalBalanceCardProps {
  balance: string
  label: string
  trend?: { value: string; positive: boolean }
  currency?: string
  className?: string
}

export function TotalBalanceCard({
  balance,
  label,
  trend,
  currency = "S/",
  className,
}: TotalBalanceCardProps) {
  const [hidden, setHidden] = React.useState(false)

  return (
    <div className={cn("total-balance-card", className)}>
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-sb-on-surface-variant uppercase tracking-[0.5px]">
            {label}
          </span>
          <button
            onClick={() => setHidden(!hidden)}
            className="h-8 w-8 rounded-full bg-sb-surface-container-high flex items-center justify-center text-sb-on-surface-variant hover:text-sb-on-surface/80 hover:bg-sb-surface-container-highest transition-all"
          >
            {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <motion.div
            key={hidden ? "hidden" : balance}
            initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.3, ease: [0.37, 0.35, 0, 1] }}
          >
            {hidden ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-sb-on-surface-variant mt-4">{currency}</span>
                <span className="text-[48px] font-bold tracking-tight text-sb-on-surface-variant/30 leading-none select-none">
                  ••••••
                </span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-medium text-sb-on-surface-variant self-start mt-4">{currency}</span>
                <span className="text-[64px] font-bold tracking-tight text-sb-on-surface leading-none">
                  {balance}
                </span>
              </div>
            )}
          </motion.div>

          {trend && (
            <div className="flex items-center gap-1.5 mt-3">
              <div className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center",
                trend.positive ? "bg-emerald-500/15" : "bg-red-500/15"
              )}>
                {trend.positive
                  ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  : <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                }
              </div>
              <span className={cn(
                "text-sm font-semibold",
                trend.positive ? "text-emerald-400" : "text-red-400"
              )}>
                {trend.value}
              </span>
              <span className="text-xs text-sb-on-surface-variant ml-1">vs mes anterior</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
