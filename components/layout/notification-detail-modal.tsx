"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell, BellRing, Megaphone, Handshake, Users, Clock, AlertTriangle,
  ChevronRight, Info, Shield, Star,
} from "@/components/ui/proicons"
import { cn } from "@/lib/utils"

export interface NotificationDetail {
  id: string
  title: string
  message: string
  type: string
  target_role: string | null
  priority: string
  category: string
  pinned: boolean
  created_at: string
  sender_name: string
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "Ahora"
  if (m < 60) return `Hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return "Ayer"
  if (d < 7) return `Hace ${d} días`
  return new Date(iso).toLocaleDateString("es-PE")
}

function typeLabel(type: string) {
  switch (type) {
    case "communication": return "Comunicado"
    case "meeting": return "Reunión"
    case "trial_request": return "Solicitud de prueba"
    default: return "Notificación"
  }
}

function typeIcon(type: string) {
  switch (type) {
    case "communication": return Megaphone
    case "meeting": return Handshake
    case "trial_request": return Users
    default: return BellRing
  }
}

function typeColor(type: string) {
  switch (type) {
    case "communication": return "bg-sb-primary/10 text-sb-primary"
    case "meeting": return "bg-amber-500/10 text-amber-500"
    case "trial_request": return "bg-violet-500/10 text-violet-500"
    default: return "bg-emerald-500/10 text-emerald-500"
  }
}

function priorityBadge(priority: string) {
  switch (priority) {
    case "alta": return { label: "Alta", cls: "bg-red-500/10 text-red-500" }
    case "baja": return { label: "Baja", cls: "bg-sb-on-surface-variant/10 text-sb-on-surface-variant" }
    default: return { label: "Normal", cls: "bg-amber-500/10 text-amber-600" }
  }
}

interface Props {
  notification: NotificationDetail | null
  onClose: () => void
}

export default function NotificationDetailModal({ notification, onClose }: Props) {
  const n = notification
  if (!n) return null

  const Icon = typeIcon(n.type)
  const iconCls = typeColor(n.type)
  const pri = priorityBadge(n.priority)
  const fullDate = new Date(n.created_at).toLocaleString("es-PE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <AnimatePresence>
      {n && (
        <div className="sb-modal-backdrop" onClick={onClose}>
          <motion.div
            className="sb-modal-window"
            style={{ maxWidth: "440px" }}
            onClick={(e) => e.stopPropagation()}
            initial={{ filter: "blur(32px)", opacity: 0, scale: 0.95 }}
            animate={{ filter: "blur(0px)", opacity: 1, scale: 1 }}
            exit={{ filter: "blur(32px)", opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.37, 0.35, 0, 1] }}
          >
            {/* Header */}
            <div className="flex items-start gap-3 px-5 pt-5 pb-3">
              <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center shrink-0", iconCls)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", pri.cls)}>
                    {pri.label}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-sb-surface-container-highest text-sb-on-surface-variant text-[10px] font-medium">
                    {typeLabel(n.type)}
                  </span>
                  {n.pinned && (
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                  )}
                </div>
                <h3 className="text-[15px] font-semibold text-sb-on-surface leading-snug">
                  {n.title}
                </h3>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 pb-4 space-y-3">
              {/* Message */}
              {n.message && (
                <div className="bg-sb-surface-container-highest/50 rounded-xl p-3.5">
                  <p className="text-[13px] text-sb-on-surface leading-relaxed whitespace-pre-wrap">
                    {n.message}
                  </p>
                </div>
              )}

              {/* Meta info */}
              <div className="space-y-2">
                {/* Sender */}
                {n.sender_name && (
                  <div className="flex items-center gap-2.5">
                    <div className="h-6 w-6 rounded-lg bg-sb-primary/10 flex items-center justify-center shrink-0">
                      <Info className="h-3 w-3 text-sb-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-sb-on-surface-variant uppercase tracking-wider">Enviado por</p>
                      <p className="text-[12px] font-medium text-sb-on-surface">{n.sender_name}</p>
                    </div>
                  </div>
                )}

                {/* Target */}
                {n.target_role && (
                  <div className="flex items-center gap-2.5">
                    <div className="h-6 w-6 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                      <Shield className="h-3 w-3 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-sb-on-surface-variant uppercase tracking-wider">Dirigido a</p>
                      <p className="text-[12px] font-medium text-sb-on-surface capitalize">
                        {n.target_role === "all" ? "Todos" : n.target_role === "padre" ? "Padres" : n.target_role === "docente" ? "Docentes" : n.target_role === "director" ? "Directores" : n.target_role}
                      </p>
                    </div>
                  </div>
                )}

                {/* Date */}
                <div className="flex items-center gap-2.5">
                  <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Clock className="h-3 w-3 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-sb-on-surface-variant uppercase tracking-wider">Fecha</p>
                    <p className="text-[12px] font-medium text-sb-on-surface">{fullDate}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-sb-outline-variant/10">
              <p className="text-[10px] text-sb-on-surface-variant/60">{timeAgo(n.created_at)}</p>
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-sb-primary text-sb-on-primary text-[12px] font-medium hover:opacity-90 transition-opacity"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
