"use client"

import * as React from "react"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import {
  GraduationCap, Users, FileText, ClipboardList, Plus, Search,
  ArrowUpRight, BookOpen, Calendar, Clock, AlertCircle, DollarSign,
  Zap, Star, ChevronRight, MoreHorizontal, Bell,
} from "lucide-react"
import Link from "next/link"

/* ─── Types ─── */

interface Metric {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: string
  color: string
}

interface QuickAction {
  label: string
  icon: LucideIcon
  href: string
}

interface Activity {
  id: string
  title: string
  description: string
  time: string
  icon: LucideIcon
  color: string
}

interface Event {
  id: string
  title: string
  date: string
  time: string
  type: string
}

interface FrequentAccess {
  label: string
  icon: LucideIcon
  href: string
  color: string
}

interface ModernDashboardViewProps {
  userName?: string
  metrics: Metric[]
  quickActions: QuickAction[]
  activities: Activity[]
  events: Event[]
  frequentAccesses: FrequentAccess[]
}

/* ─── Blob SVG decorativo ─── */

function BlobIllustration() {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" className="absolute -top-10 -right-10 opacity-[0.06] pointer-events-none" aria-hidden>
      <path
        fill="currentColor"
        d="M 50 30 C 80 10, 130 10, 160 40 C 190 70, 200 120, 170 150 C 140 180, 90 200, 50 170 C 10 140, -10 80, 20 50 C 30 40, 40 35, 50 30 Z"
      />
    </svg>
  )
}

/* ─── Componente principal ─── */

export function ModernDashboardView({
  userName = "Usuario",
  metrics,
  quickActions,
  activities,
  events,
  frequentAccesses,
}: ModernDashboardViewProps) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches"
  const dateStr = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.08 },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full max-w-3xl mx-auto space-y-10 pb-24"
    >
      {/* ═══ 1. Hero principal ═══ */}
      <motion.section variants={item} className="relative pt-8 pb-4">
        <BlobIllustration />
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
            style={{
              background: "color-mix(in srgb, var(--sb-primary) 10%, transparent)",
              color: "var(--sb-primary)",
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--sb-primary)" }}
            />
            <span className="text-[11px] font-semibold capitalize">{dateStr}</span>
          </motion.div>

          <h1
            className="text-[32px] md:text-[40px] font-extrabold tracking-[-0.03em] leading-[1.08]"
            style={{ color: "var(--sb-on-surface)" }}
          >
            {greeting},{" "}
            <span style={{ color: "var(--sb-primary)" }}>{userName}</span>
          </h1>

          <p
            className="text-base mt-3 max-w-md leading-relaxed"
            style={{ color: "color-mix(in srgb, var(--sb-on-surface-variant) 60%, transparent)" }}
          >
            Hoy tienes <strong style={{ color: "var(--sb-on-surface)" }}>{metrics.length} métricas</strong>{" "}
            y <strong style={{ color: "var(--sb-on-surface)" }}>{quickActions.length} acciones</strong>{" "}
            disponibles. Revisa tu resumen del día.
          </p>
        </div>
      </motion.section>

      {/* ═══ 2. Métricas horizontales flotantes ═══ */}
      <motion.section variants={item}>
        <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-none">
          {metrics.map((m, i) => {
            const Icon = m.icon
            const heights = [72, 80, 68, 84, 76]
            const h = heights[i % heights.length]
            return (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3 }}
                className="shrink-0 rounded-2xl p-5 flex flex-col justify-between transition-shadow duration-300"
                style={{
                  height: h,
                  width: 160,
                  background: `linear-gradient(145deg, color-mix(in srgb, ${m.color} 7%, var(--sb-surface)), color-mix(in srgb, ${m.color} 2%, var(--sb-surface)))`,
                  border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 15%, transparent)",
                  boxShadow: "0 2px 12px -4px rgba(0,0,0,0.04)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="h-7 w-7 rounded-lg flex items-center justify-center"
                    style={{ background: `color-mix(in srgb, ${m.color} 14%, transparent)` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: m.color }} />
                  </div>
                  {m.trend && (
                    <span
                      className="text-[9px] font-semibold"
                      style={{ color: `color-mix(in srgb, ${m.color} 50%, transparent)` }}
                    >
                      {m.trend}
                    </span>
                  )}
                </div>
                <div>
                  <p
                    className="text-[10px] font-medium"
                    style={{ color: "color-mix(in srgb, var(--sb-on-surface-variant) 40%, transparent)" }}
                  >
                    {m.label}
                  </p>
                  <p
                    className="text-lg font-bold tracking-tight mt-0.5"
                    style={{ color: "var(--sb-on-surface)" }}
                  >
                    {m.value}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      {/* ═══ 3. Accesos rápidos — chips horizontales ═══ */}
      <motion.section variants={item}>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4" style={{ color: "var(--sb-primary)" }} />
          <h2
            className="text-[13px] font-bold tracking-[-0.01em]"
            style={{ color: "var(--sb-on-surface)" }}
          >
            Accesos rápidos
          </h2>
          <div className="flex-1 h-px" style={{ background: "color-mix(in srgb, var(--sb-outline-variant) 20%, transparent)" }} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
          {quickActions.map((action, i) => {
            const Icon = action.icon
            return (
              <Link key={action.label} href={action.href}>
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.03, duration: 0.3 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer"
                  style={{
                    background: "color-mix(in srgb, var(--sb-surface) 80%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 20%, transparent)",
                    boxShadow: "0 1px 4px -2px rgba(0,0,0,0.04)",
                  }}
                >
                  <div
                    className="h-7 w-7 rounded-lg flex items-center justify-center"
                    style={{ background: "color-mix(in srgb, var(--sb-primary) 10%, transparent)" }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: "var(--sb-primary)" }} />
                  </div>
                  <span className="text-[13px] font-semibold whitespace-nowrap" style={{ color: "var(--sb-on-surface)" }}>
                    {action.label}
                  </span>
                  <ArrowUpRight
                    className="h-3 w-3"
                    style={{ color: "color-mix(in srgb, var(--sb-on-surface-variant) 30%, transparent)" }}
                  />
                </motion.div>
              </Link>
            )
          })}
        </div>
      </motion.section>

      {/* ═══ 4 + 5: Timeline + Eventos — lado a lado en desktop ═══ */}
      <motion.section variants={item}>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Timeline actividad */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-5">
              <Clock className="h-4 w-4" style={{ color: "var(--sb-primary)" }} />
              <h2
                className="text-[13px] font-bold tracking-[-0.01em]"
                style={{ color: "var(--sb-on-surface)" }}
              >
                Actividad reciente
              </h2>
            </div>
            <div className="relative pl-5">
              {/* Línea vertical */}
              <div
                className="absolute left-[7px] top-2 bottom-0 w-px"
                style={{ background: "color-mix(in srgb, var(--sb-outline-variant) 30%, transparent)" }}
              />
              <div className="space-y-6">
                {activities.map((act, i) => {
                  const Icon = act.icon
                  return (
                    <motion.div
                      key={act.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.06, duration: 0.3 }}
                      className="relative"
                    >
                      {/* Punto en la línea */}
                      <div
                        className="absolute -left-5 top-1 w-[15px] h-[15px] rounded-full flex items-center justify-center"
                        style={{
                          background: `color-mix(in srgb, ${act.color} 15%, transparent)`,
                          border: "2px solid color-mix(in srgb, var(--sb-surface) 80%, transparent)",
                        }}
                      >
                        <div
                          className="w-[5px] h-[5px] rounded-full"
                          style={{ background: act.color }}
                        />
                      </div>
                      <div
                        className="rounded-xl p-3.5"
                        style={{
                          background: "color-mix(in srgb, var(--sb-surface) 90%, transparent)",
                          border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 10%, transparent)",
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-3.5 w-3.5" style={{ color: act.color }} />
                          <p className="text-[13px] font-semibold" style={{ color: "var(--sb-on-surface)" }}>
                            {act.title}
                          </p>
                        </div>
                        <p className="text-[12px]" style={{ color: "color-mix(in srgb, var(--sb-on-surface-variant) 50%, transparent)" }}>
                          {act.description}
                        </p>
                        <p className="text-[10px] mt-1.5 font-medium" style={{ color: `color-mix(in srgb, ${act.color} 40%, transparent)` }}>
                          {act.time}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Eventos próximos */}
          <div className="md:w-72 shrink-0">
            <div className="flex items-center gap-2 mb-5">
              <Calendar className="h-4 w-4" style={{ color: "var(--sb-secondary, #06b6d4)" }} />
              <h2
                className="text-[13px] font-bold tracking-[-0.01em]"
                style={{ color: "var(--sb-on-surface)" }}
              >
                Próximos eventos
              </h2>
            </div>
            {events.length === 0 ? (
              <div
                className="rounded-xl p-5 text-center"
                style={{
                  background: "color-mix(in srgb, var(--sb-surface) 90%, transparent)",
                  border: "1px dashed color-mix(in srgb, var(--sb-outline-variant) 20%, transparent)",
                }}
              >
                <p className="text-[13px]" style={{ color: "color-mix(in srgb, var(--sb-on-surface-variant) 40%, transparent)" }}>
                  No hay eventos próximos
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((ev, i) => (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.05, duration: 0.3 }}
                    whileHover={{ x: 2 }}
                    className="rounded-xl p-4 transition-all duration-200 cursor-pointer"
                    style={{
                      background: "color-mix(in srgb, var(--sb-surface) 85%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--sb-outline-variant) 12%, transparent)",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: "color-mix(in srgb, var(--sb-primary) 10%, transparent)",
                        }}
                      >
                        <Calendar className="h-4 w-4" style={{ color: "var(--sb-primary)" }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold leading-tight" style={{ color: "var(--sb-on-surface)" }}>
                          {ev.title}
                        </p>
                        <p className="text-[11px] mt-1" style={{ color: "color-mix(in srgb, var(--sb-on-surface-variant) 50%, transparent)" }}>
                          {ev.date} · {ev.time}
                        </p>
                        <span
                          className="inline-block mt-1.5 text-[9px] font-semibold px-2 py-0.5 rounded-md"
                          style={{
                            background: `color-mix(in srgb, var(--sb-primary) 10%, transparent)`,
                            color: "var(--sb-primary)",
                          }}
                        >
                          {ev.type}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* ═══ 6. Accesos frecuentes ═══ */}
      <motion.section variants={item}>
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-4 w-4" style={{ color: "var(--sb-secondary, #06b6d4)" }} />
          <h2
            className="text-[13px] font-bold tracking-[-0.01em]"
            style={{ color: "var(--sb-on-surface)" }}
          >
            Accesos frecuentes
          </h2>
          <div className="flex-1 h-px" style={{ background: "color-mix(in srgb, var(--sb-outline-variant) 20%, transparent)" }} />
        </div>
        <div className="flex flex-wrap gap-2">
          {frequentAccesses.map((fa, i) => {
            const Icon = fa.icon
            return (
              <Link key={fa.label} href={fa.href}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.03, duration: 0.25 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer"
                  style={{
                    background: `color-mix(in srgb, ${fa.color} 7%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${fa.color} 12%, transparent)`,
                  }}
                >
                  <Icon className="h-4 w-4" style={{ color: fa.color }} />
                  <span className="text-[12px] font-semibold" style={{ color: "var(--sb-on-surface)" }}>
                    {fa.label}
                  </span>
                </motion.div>
              </Link>
            )
          })}
        </div>
      </motion.section>

      {/* Espacio inferior */}
      <div className="h-8" />
    </motion.div>
  )
}
