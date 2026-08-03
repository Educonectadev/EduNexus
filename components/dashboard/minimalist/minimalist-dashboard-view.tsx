"use client"

import * as React from "react"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Metric {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
  href?: string
}

interface QuickAction {
  label: string
  desc?: string
  icon: LucideIcon
  href: string
}

interface Activity {
  id: string
  title: string
  description: string
  time: string
  icon: LucideIcon
}

interface MinimalistDashboardViewProps {
  userName?: string
  metrics: Metric[]
  quickActions: QuickAction[]
  activities: Activity[]
}

export function MinimalistDashboardView({
  userName = "Usuario",
  metrics,
  quickActions,
  activities,
}: MinimalistDashboardViewProps) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Buenos dias" : hour < 18 ? "Buenas tardes" : "Buenas noches"
  const dateStr = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04, delayChildren: 0.05 },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full space-y-8 pb-12"
    >
      {/* ═══ Header ═══ */}
      <motion.section variants={item} className="pt-4">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[26px] md:text-[32px] font-bold tracking-tight text-sb-on-surface leading-tight">
              {greeting}, {userName}
            </h1>
            <p className="text-sm text-sb-on-surface-variant mt-1 capitalize">{dateStr}</p>
          </div>
          <div className="hidden md:flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium text-sb-on-surface-variant">Activo</span>
          </div>
        </div>
      </motion.section>

      {/* ═══ Metrics Grid ═══ */}
      <motion.section variants={item}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px rounded-2xl overflow-hidden bg-sb-outline-variant/20">
          {metrics.map((m, i) => {
            const Icon = m.icon
            const cardContent = (
              <div
                className={cn(
                  "bg-sb-surface p-5 flex flex-col gap-3 group",
                  m.href && "hover:bg-sb-surface-container-low transition-colors cursor-pointer"
                )}
              >
                  <div className="flex items-center justify-between">
                    <Icon className="h-4 w-4 text-sb-on-surface-variant/50 group-hover:text-sb-primary transition-colors" />
                    {m.trend && (
                      <span className={cn(
                        "text-[10px] font-semibold",
                        m.trendUp ? "text-emerald-500" : "text-sb-on-surface-variant/40"
                      )}>
                        {m.trend}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-sb-on-surface-variant/50 uppercase tracking-wider">
                      {m.label}
                    </p>
                    <p className="text-xl font-bold tracking-tight text-sb-on-surface mt-0.5">
                      {m.value}
                    </p>
                  </div>
                </div>
            )
            const wrapped = m.href ? <Link href={m.href}>{cardContent}</Link> : cardContent
            return (
              <motion.div
                key={m.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.04 }}
              >
                {wrapped}
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      {/* ═══ Quick Actions + Activity ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Quick Actions */}
        <motion.section variants={item} className="lg:col-span-2">
          <h2 className="text-[11px] font-semibold text-sb-on-surface-variant/50 uppercase tracking-widest mb-4">
            Acciones
          </h2>
          <div className="space-y-1">
            {quickActions.map((action, i) => {
              const Icon = action.icon
              return (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.03 }}
                >
                  <Link href={action.href}>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-sb-surface-container-low transition-colors group">
                      <div className="h-9 w-9 rounded-xl bg-sb-surface-container flex items-center justify-center shrink-0 group-hover:bg-sb-primary/10 transition-colors">
                        <Icon className="h-[18px] w-[18px] text-sb-on-surface-variant group-hover:text-sb-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-sb-on-surface group-hover:text-sb-primary transition-colors">
                          {action.label}
                        </p>
                        {action.desc && (
                          <p className="text-[11px] text-sb-on-surface-variant/50 mt-0.5 truncate">
                            {action.desc}
                          </p>
                        )}
                      </div>
                      <svg
                        className="h-4 w-4 text-sb-on-surface-variant/30 group-hover:text-sb-primary/50 transition-colors shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* Recent Activity */}
        <motion.section variants={item} className="lg:col-span-3">
          <h2 className="text-[11px] font-semibold text-sb-on-surface-variant/50 uppercase tracking-widest mb-4">
            Actividad reciente
          </h2>
          <div className="space-y-px rounded-2xl overflow-hidden bg-sb-outline-variant/10">
            {activities.map((act, i) => {
              const Icon = act.icon
              return (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 + i * 0.04 }}
                  className="bg-sb-surface p-4 flex items-start gap-3 group hover:bg-sb-surface-container-low transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-sb-surface-container flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-sb-on-surface-variant/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-sb-on-surface leading-tight">
                      {act.title}
                    </p>
                    <p className="text-[12px] text-sb-on-surface-variant/50 mt-0.5 line-clamp-1">
                      {act.description}
                    </p>
                  </div>
                  <span className="text-[10px] text-sb-on-surface-variant/40 whitespace-nowrap shrink-0 mt-0.5">
                    {act.time}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </motion.section>
      </div>
    </motion.div>
  )
}
