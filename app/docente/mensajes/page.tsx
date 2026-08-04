"use client"

import * as React from "react"
import { Send, Search, User, Mail, MailOpen, X, Filter, Inbox, Eye, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Message { id: string; from: string; subject: string; preview: string; time: string; read: boolean }

const defaultMessages: Message[] = [
  { id: "1", from: "María García (Apoderada)", subject: "Re: Permiso de salida", preview: "Estimado profesor, agradecería que mi hijo Carlos pueda...", time: "Hace 30 min", read: false },
  { id: "2", from: "Dirección", subject: "Capacitación obligatoria", preview: "Se recuerda que todos los docentes deben asistir a la capacitación...", time: "Hace 2h", read: false },
  { id: "3", from: "Pedro Torres (Apoderado)", subject: "Consulta sobre notas", preview: "Buenos días, me gustaría conversar sobre el rendimiento de...", time: "Ayer", read: true },
  { id: "4", from: "Secretaría", subject: "Documento pendiente", preview: "Falta firmar el acta de calificaciones del segundo bimestre...", time: "Hace 3 días", read: true },
  { id: "5", from: "Ana López (Apoderada)", subject: "Justificación de inasistencia", preview: "Estimado profesor, mi hija Ana no podrá asistir el día de...", time: "Hace 5 días", read: true },
]

const staggerItem = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }
const listItem = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, filter: "blur(8px)", y: -10 },
}

function getAvatarColor(name: string) {
  const colors = ["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-amber-500", "bg-pink-500", "bg-cyan-500", "bg-rose-500"]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function getInitials(name: string) { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) }

export default function MensajesPage() {
  const [messages] = React.useState<Message[]>(defaultMessages)
  const [search, setSearch] = React.useState("")
  const [filter, setFilter] = React.useState<"all" | "unread" | "read">("all")
  const [selected, setSelected] = React.useState<Message | null>(null)
  const [reply, setReply] = React.useState("")

  const filtered = messages.filter(m => {
    const matchesSearch = !search ||
      m.subject.toLowerCase().includes(search.toLowerCase()) ||
      m.from.toLowerCase().includes(search.toLowerCase()) ||
      m.preview.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === "all" || (filter === "unread" && !m.read) || (filter === "read" && m.read)
    return matchesSearch && matchesFilter
  })

  const unreadCount = messages.filter(m => !m.read).length
  const readCount = messages.filter(m => m.read).length

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Mensajes</h1>
          <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">{unreadCount} sin leer de {messages.length}</p>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-sb-primary/10">
            <Mail className="h-3.5 w-3.5 text-sb-primary" />
            <span className="text-xs font-medium text-sb-primary">{unreadCount} nuevo{unreadCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </motion.div>

      {/* Search + Filters */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-sb-on-surface-variant/30" />
          <input placeholder="Buscar por nombre, asunto o contenido..." value={search} onChange={e => setSearch(e.target.value)}
            className="sb-input rounded-md text-sm h-12 w-full pl-11 pr-10 bg-sb-surface-container/50 border-sb-outline-variant/10 focus:bg-sb-surface focus:border-sb-primary/30 transition-all" />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-sb-surface-container transition-colors">
              <X className="h-3.5 w-3.5 text-sb-on-surface-variant/40" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-sb-on-surface-variant/30" />
          {([
            { key: 'all', label: 'Todos', count: messages.length, icon: Inbox },
            { key: 'unread', label: 'Sin leer', count: unreadCount, icon: MailOpen },
            { key: 'read', label: 'Leidos', count: readCount, icon: Eye },
          ]).map(f => {
            const Icon = f.icon
            return (
              <button key={f.key} onClick={() => setFilter(f.key as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium transition-all ${
                  filter === f.key
                    ? 'bg-sb-on-surface text-sb-surface shadow-sm'
                    : 'bg-sb-surface-container/60 text-sb-on-surface-variant/50 hover:bg-sb-surface-container-high'
                }`}>
                <Icon className="h-3.5 w-3.5" />
                {f.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ml-0.5 ${
                  filter === f.key ? 'bg-white/20' : 'bg-sb-surface-container-high text-sb-on-surface-variant/35'
                }`}>
                  {f.count}
                </span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Message list */}
      <div className="bg-sb-surface rounded-md overflow-hidden border border-sb-outline-variant/8">
        <AnimatePresence>
          {filtered.map((m, i) => (
            <motion.button key={m.id} variants={listItem} initial="hidden" animate="show" exit="exit"
              transition={{ duration: 0.3, delay: i * 0.03 }}
              onClick={() => { setSelected(m); setReply("") }}
              className={`w-full flex items-start gap-3.5 px-5 py-4 text-left hover:bg-sb-surface-container-low/60 transition-all duration-200 border-b border-sb-outline-variant/8 last:border-0 group ${!m.read ? "bg-sb-primary/[0.03]" : ""}`}>
              <div className={`h-10 w-10 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                !m.read ? "bg-sb-primary/12" : "bg-sb-surface-container"
              }`}>
                {!m.read ? <MailOpen className="h-4 w-4 text-sb-primary" /> : <User className="h-4 w-4 text-sb-on-surface-variant/35" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm truncate ${!m.read ? "font-semibold text-sb-on-surface" : "text-sb-on-surface/75"}`}>{m.from}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!m.read && <span className="h-2 w-2 rounded-md bg-sb-primary animate-pulse" />}
                    <span className="text-[10px] text-sb-on-surface-variant/30">{m.time}</span>
                  </div>
                </div>
                <p className={`text-xs truncate mt-0.5 ${!m.read ? "font-medium text-sb-on-surface/80" : "text-sb-on-surface-variant/50"}`}>{m.subject}</p>
                <p className="text-xs text-sb-on-surface-variant/30 truncate mt-1">{m.preview}</p>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="py-14 text-center">
            <div className="h-14 w-14 rounded-md bg-sb-surface-container flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-sb-on-surface-variant/20" />
            </div>
            <p className="text-sm font-medium text-sb-on-surface-variant/30">
              {search ? "No se encontraron mensajes" : "No hay mensajes"}
            </p>
            {search && (
              <button onClick={() => { setSearch(""); setFilter("all") }}
                className="text-xs text-sb-primary mt-2 hover:underline">
                Limpiar busqueda
              </button>
            )}
          </div>
        )}
      </div>

      {/* Selected message detail */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-sb-surface rounded-md overflow-hidden border border-sb-outline-variant/8">
            <div className="flex items-center justify-between px-5 py-4 border-b border-sb-outline-variant/8 bg-sb-surface-container/30">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-md ${getAvatarColor(selected.from)} flex items-center justify-center shrink-0`}>
                  <span className="text-[10px] font-bold text-white">{getInitials(selected.from)}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-sb-on-surface">{selected.from}</p>
                  <p className="text-xs text-sb-on-surface-variant/40">{selected.subject}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-sb-on-surface-variant/30 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {selected.time}
                </span>
                <button onClick={() => setSelected(null)}
                  className="p-2 rounded-md hover:bg-sb-surface-container transition-colors">
                  <X className="h-4 w-4 text-sb-on-surface-variant/40" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-sb-on-surface-variant/70 leading-relaxed">{selected.preview}</p>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input placeholder="Escribir respuesta..." value={reply} onChange={e => setReply(e.target.value)}
                    className="sb-input rounded-md text-sm h-11 w-full pr-12 bg-sb-surface-container/50" />
                  <button className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-md transition-all ${
                    reply ? "bg-sb-on-surface text-sb-surface shadow-md" : "text-sb-on-surface-variant/25"
                  }`}>
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
