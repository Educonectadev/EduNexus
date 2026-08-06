"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Megaphone, Bell, Calendar } from "@/components/ui/proicons"

interface Comunicado {
  id: string
  title: string
  message: string
  target_role: string
  status: string
  created_at: string
  read?: boolean
}

const targetLabels: Record<string, string> = { all: 'Todos', padre: 'Padres', docente: 'Docentes', secretario: 'Secretariado' }

const staggerItem = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }
const listItem = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, filter: "blur(8px)", y: -10 },
}

export default function ComunicadosPage() {
  const [comunicados, setComunicados] = React.useState<Comunicado[]>([])
  const [loading, setLoading] = React.useState(true)
  const [expanded, setExpanded] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState<'all' | 'unread'>('all')

  React.useEffect(() => {
    fetch("/api/padre/comunicados")
      .then(r => r.json())
      .then(setComunicados)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'unread' ? comunicados.filter(c => !c.read) : comunicados
  const unreadCount = comunicados.filter(c => !c.read).length

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="animate-pulse space-y-5">
          <div className="h-7 w-48 rounded-xl bg-sb-surface-container" />
          <div className="h-10 rounded-xl bg-sb-surface-container" />
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-sb-surface-container" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Comunicados</h1>
          <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">Avisos y notificaciones de la institución</p>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sb-primary/10">
            <Bell className="h-3.5 w-3.5 text-sb-primary" />
            <span className="text-xs font-medium text-sb-primary">{unreadCount} nuevo{unreadCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="flex gap-2"
      >
        {([
          { key: 'all', label: 'Todos' },
          { key: 'unread', label: 'No leídos' },
        ] as const).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-sb-on-surface text-sb-surface'
                : 'bg-sb-surface-container text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high'
            }`}
          >
            {f.label}
            {f.key === 'unread' && unreadCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${filter === f.key ? 'bg-white/20' : 'bg-sb-surface-container-high text-sb-on-surface-variant/40'}`}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Communications list */}
      <div className="space-y-3">
        {filtered.map((c, i) => {
          const isExpanded = expanded === c.id
          return (
            <motion.div
              key={c.id}
              initial="hidden"
              animate="show"
              variants={listItem}
              transition={{ duration: 0.3, delay: 0.05 + i * 0.04 }}
              className="bg-sb-surface rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : c.id)}
                className="w-full text-left p-5"
              >
                <div className="flex items-start gap-3">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                    !c.read ? 'bg-sb-primary/15' : 'bg-sb-surface-container'
                  }`}>
                    <Megaphone className={`h-4 w-4 ${!c.read ? 'text-sb-primary' : 'text-sb-on-surface-variant/30'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!c.read && <div className="h-2 w-2 rounded-full bg-sb-primary shrink-0" />}
                      <p className="text-sm font-medium text-sb-on-surface truncate">{c.title}</p>
                    </div>
                    {!isExpanded && (
                      <p className="text-xs text-sb-on-surface-variant/40 line-clamp-2">{c.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
                    <span className="text-[10px] text-sb-on-surface-variant/30">
                      {new Date(c.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                    </span>
                    <span className="text-[10px] text-sb-on-surface-variant/30 px-2 py-0.5 rounded-full bg-sb-surface-container">
                      {targetLabels[c.target_role] || 'Todos'}
                    </span>
                  </div>
                </div>
              </button>

              {/* Expanded content */}
              <motion.div
                initial={false}
                animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 pt-0">
                  <div className="border-t border-sb-outline-variant/15 pt-4">
                    <p className="text-sm text-sb-on-surface-variant/60 leading-relaxed whitespace-pre-wrap">{c.message}</p>
                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-sb-outline-variant/10">
                      <Calendar className="h-3.5 w-3.5 text-sb-on-surface-variant/25" />
                      <span className="text-[10px] text-sb-on-surface-variant/30">
                        Publicado el {new Date(c.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )
        })}
        {filtered.length === 0 && (
          <div className="bg-sb-surface rounded-2xl py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-sb-surface-container flex items-center justify-center mx-auto mb-4">
              <Megaphone className="h-7 w-7 text-sb-on-surface-variant/20" />
            </div>
            <p className="text-sm font-medium text-sb-on-surface-variant/40">
              {filter === 'unread' ? 'No hay comunicados sin leer' : 'No hay comunicados'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
