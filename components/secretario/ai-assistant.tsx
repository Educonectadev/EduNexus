"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles, Send, Loader2, UserPlus, Users, GraduationCap,
  CreditCard, ClipboardList, FileText, Search, Calendar, BookOpen,
  ChevronRight, Bot, Zap, Plus, MessageSquare, Trash2, MoreHorizontal,
  PanelLeftClose, PanelLeft, ArrowLeft, Check, Copy, Sun, Moon,
  User as UserIcon, LogOut, Settings, X,
} from "@/components/ui/proicons"
import type { LucideIcon } from "@/components/ui/proicons"
import { Logo } from "@/components/ui/logo"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import { useTheme } from "next-themes"

const iconMap: Record<string, LucideIcon> = {
  UserPlus, Users, GraduationCap, CreditCard, ClipboardList,
  FileText, Search, Calendar, BookOpen, Sparkles,
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  actions?: Action[]
  timestamp: Date
}

interface Action {
  label: string
  description: string
  icon: string
  color: string
  bg: string
  command: string
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
}

const quickActions: Action[] = [
  { label: "Registrar alumno", description: "Matricular un nuevo estudiante", icon: "GraduationCap", color: "text-blue-600", bg: "bg-blue-500/10", command: "registrar alumno" },
  { label: "Registrar padre", description: "Agregar un apoderado al sistema", icon: "Users", color: "text-emerald-600", bg: "bg-emerald-500/10", command: "registrar padre" },
  { label: "Tomar asistencia", description: "Registrar asistencia del día", icon: "ClipboardList", color: "text-amber-600", bg: "bg-amber-500/10", command: "tomar asistencia" },
  { label: "Registrar pago", description: "Registrar un pago de colegiatura", icon: "CreditCard", color: "text-purple-600", bg: "bg-purple-500/10", command: "registrar pago" },
  { label: "Buscar alumno", description: "Ver expediente de un estudiante", icon: "Search", color: "text-cyan-600", bg: "bg-cyan-500/10", command: "buscar alumno" },
  { label: "Ver notas", description: "Consultar calificaciones", icon: "BookOpen", color: "text-rose-600", bg: "bg-rose-500/10", command: "ver notas" },
]

const suggestedPrompts = [
  "Registrar un alumno llamado Juan Pérez en 3° secundaria",
  "Crear cuenta para el padre Carlos García",
  "Ver los pagos pendientes de este mes",
  "Buscar alumno con DNI 45678912",
  "Registrar asistencia de 3°A",
  "Ver las notas de secundaria",
]

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" }).format(date)
}

function formatDateLabel(date: Date): string {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const sameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
  if (sameDay(date, today)) return "Hoy"
  if (sameDay(date, yesterday)) return "Ayer"
  return date.toLocaleDateString("es", { day: "numeric", month: "short" })
}

export function AIAssistantContent() {
  const router = useRouter()
  const { user, role, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [input, setInput] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  const activeConversation = conversations.find(c => c.id === activeId) || null
  const messages = activeConversation?.messages || []

  React.useEffect(() => {
    if (conversations.length === 0) {
      const newId = crypto.randomUUID()
      setConversations([{
        id: newId,
        title: "Nueva conversación",
        createdAt: new Date(),
        messages: [{
          id: "welcome",
          role: "assistant",
          content: "Hola! Soy tu asistente virtual. 🎓\n\nPuedo ayudarte con:\n• Registrar alumnos y padres\n• Tomar asistencia\n• Registrar pagos\n• Buscar información\n• Consultar notas y calificaciones\n\nEscribe lo que necesitas o elige una acción rápida para comenzar.",
          timestamp: new Date(),
        }],
      }])
      setActiveId(newId)
    }
  }, [])

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  React.useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [activeId])

  const newConversation = () => {
    const id = crypto.randomUUID()
    setConversations(prev => [{
      id,
      title: "Nueva conversación",
      createdAt: new Date(),
      messages: [{
        id: "welcome",
        role: "assistant",
        content: "Hola! Soy tu asistente virtual. 🎓\n\nPuedo ayudarte con:\n• Registrar alumnos y padres\n• Tomar asistencia\n• Registrar pagos\n• Buscar información\n• Consultar notas y calificaciones\n\nEscribe lo que necesitas o elige una acción rápida para comenzar.",
        timestamp: new Date(),
      }],
    }, ...prev])
    setActiveId(id)
    setInput("")
  }

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id))
    if (activeId === id) {
      const remaining = conversations.filter(c => c.id !== id)
      setActiveId(remaining[0]?.id || null)
    }
  }

  const updateMessages = (updater: (msgs: Message[]) => Message[]) => {
    if (!activeId) return
    setConversations(prev => prev.map(c =>
      c.id === activeId ? { ...c, messages: updater(c.messages) } : c
    ))
  }

  const updateTitle = (id: string, firstMessage: string) => {
    setConversations(prev => prev.map(c =>
      c.id === id ? { ...c, title: firstMessage.slice(0, 38) + (firstMessage.length > 38 ? "…" : "") } : c
    ))
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || !activeId) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    }
    const isFirstUserMsg = activeConversation?.messages.filter(m => m.role === "user").length === 0
    updateMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)
    if (isFirstUserMsg) updateTitle(activeId, text.trim())

    try {
      const res = await fetch("/api/secretario/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history: messages.slice(-6) }),
      })
      const data = await res.json()

      updateMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response || "No pude procesar tu solicitud. Intenta de nuevo.",
        actions: data.actions || [],
        timestamp: new Date(),
      }])
    } catch {
      updateMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Error de conexión. Verifica tu conexión e intenta de nuevo.",
        timestamp: new Date(),
      }])
    } finally { setLoading(false) }
  }

  const executeAction = async (command: string) => {
    if (!activeId) return
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: command,
      timestamp: new Date(),
    }
    updateMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch("/api/secretario/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: command, history: messages.slice(-6) }),
      })
      const data = await res.json()

      updateMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response || "Acción ejecutada.",
        actions: data.actions || [],
        timestamp: new Date(),
      }])
    } catch {
      updateMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Error al ejecutar la acción.",
        timestamp: new Date(),
      }])
    } finally { setLoading(false) }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    logout()
    router.push("/login")
  }

  const groupedConversations = React.useMemo(() => {
    const groups: { label: string; items: Conversation[] }[] = [
      { label: "Hoy", items: [] },
      { label: "Ayer", items: [] },
      { label: "Anteriores", items: [] },
    ]
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)
    const sameDay = (a: Date, b: Date) =>
      a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
    conversations.forEach(c => {
      if (sameDay(c.createdAt, today)) groups[0].items.push(c)
      else if (sameDay(c.createdAt, yesterday)) groups[1].items.push(c)
      else groups[2].items.push(c)
    })
    return groups.filter(g => g.items.length > 0)
  }, [conversations])

  const pathname = "/secretario/asistente"
  const roleLabel = role === "secretario" ? "Secretario" : role || "Usuario"

  return (
    <div className="flex h-full w-full bg-sb-surface overflow-hidden">

      {/* ===== SIDEBAR: idéntico al del panel principal ===== */}
      <aside className={cn(
        "flex flex-col h-full border-r border-sb-outline-variant/8 transition-[width] duration-200 ease-out overflow-hidden shrink-0",
        "bg-sb-surface z-10",
        sidebarOpen ? "w-[240px]" : "w-[64px]"
      )}>
        {/* Logo */}
        <div className={cn("flex items-center h-12 shrink-0", sidebarOpen ? "px-4 gap-2.5" : "justify-center")}>
          <Logo className="w-7 h-7 shrink-0" />
          {sidebarOpen && (
            <span className="text-[13px] font-semibold text-sb-on-surface tracking-tight truncate">
              EduNexus
            </span>
          )}
        </div>

        {/* Nav interno: navegación + secciones */}
        <nav className={cn(
          "flex flex-col flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
          sidebarOpen ? "px-2 py-3 gap-4" : "px-2 py-3 gap-2"
        )}>
          {/* Sección: Navegación */}
          <div className="flex flex-col gap-px">
            {sidebarOpen && (
              <h3 className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-sb-on-surface-variant/50">
                Navegación
              </h3>
            )}
            <button
              onClick={() => router.back()}
              className={cn(
                "flex items-center gap-2.5 transition-colors duration-150",
                sidebarOpen ? "h-8 px-2.5 rounded-md" : "justify-center w-9 h-9 mx-auto rounded-md",
                "text-sb-on-surface-variant/70 hover:bg-sb-surface-container/60 hover:text-sb-on-surface"
              )}
              title="Volver">
              <ArrowLeft className="h-[16px] w-[16px] shrink-0" />
              {sidebarOpen && <span className="text-[13px] truncate">Volver al panel</span>}
            </button>
          </div>

          {/* Sección: Conversaciones */}
          <div className="flex flex-col gap-px">
            {sidebarOpen && (
              <h3 className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-sb-on-surface-variant/50">
                Conversaciones
              </h3>
            )}
            <button
              onClick={newConversation}
              className={cn(
                "flex items-center gap-2.5 transition-colors duration-150",
                sidebarOpen ? "h-8 px-2.5 rounded-md" : "justify-center w-9 h-9 mx-auto rounded-md",
                "text-sb-on-surface-variant/70 hover:bg-sb-surface-container/60 hover:text-sb-on-surface"
              )}
              title="Nueva conversación">
              <Plus className="h-[16px] w-[16px] shrink-0" />
              {sidebarOpen && <span className="text-[13px] truncate">Nueva conversación</span>}
            </button>

            {sidebarOpen && conversations.length > 0 && (
              <div className="mt-1 space-y-2">
                {groupedConversations.map((group) => (
                  <div key={group.label} className="flex flex-col gap-px">
                    <p className="px-2.5 text-[9px] font-medium text-sb-on-surface-variant/40 uppercase tracking-wider">
                      {group.label}
                    </p>
                    {group.items.map((conv) => (
                      <div
                        key={conv.id}
                        className={cn(
                          "group relative flex items-center gap-2 px-2.5 h-8 rounded-lg cursor-pointer transition-all duration-150",
                          activeId === conv.id
                            ? "bg-violet-500/10 text-violet-400"
                            : "text-sb-on-surface-variant/60 hover:bg-sb-surface-container/60 hover:text-sb-on-surface"
                        )}
                        onClick={() => setActiveId(conv.id)}
                        title={conv.title}
                      >
                        <MessageSquare className="h-[14px] w-[14px] shrink-0" />
                        {sidebarOpen && (
                          <>
                            <span className="text-[12px] truncate flex-1 font-medium">
                              {conv.title}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
                              className={cn(
                                "h-5 w-5 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
                                activeId === conv.id ? "hover:bg-violet-500/20" : "hover:bg-sb-surface-container-high"
                              )}
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Bottom: idéntico al del panel */}
        <div className="shrink-0 border-t border-sb-outline-variant/6 px-2 py-2 space-y-3">
          {/* Herramientas */}
          <div className="flex flex-col gap-px">
            {sidebarOpen && (
              <h3 className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-sb-on-surface-variant/50">
                Herramientas
              </h3>
            )}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={cn(
                "flex items-center gap-2.5 transition-colors duration-150",
                sidebarOpen ? "h-8 px-2.5 rounded-md w-full" : "justify-center w-9 h-9 mx-auto rounded-md",
                "text-sb-on-surface-variant/70 hover:bg-sb-surface-container/60 hover:text-sb-on-surface"
              )}
              title="Cambiar tema">
              <div className="relative shrink-0 w-[16px] h-[16px]">
                <Sun className={cn("absolute inset-0 h-[16px] w-[16px] transition-all duration-200", theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")} />
                <Moon className={cn("absolute inset-0 h-[16px] w-[16px] transition-all duration-200", theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0")} />
              </div>
              {sidebarOpen && <span className="text-[13px] truncate">Tema</span>}
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={cn(
                "flex items-center gap-2.5 transition-colors duration-150",
                sidebarOpen ? "h-8 px-2.5 rounded-md w-full" : "justify-center w-9 h-9 mx-auto rounded-md",
                "text-sb-on-surface-variant/50 hover:bg-sb-surface-container/60 hover:text-sb-on-surface-variant"
              )}
              title="Colapsar">
              <svg className={cn("h-[16px] w-[16px] shrink-0 transition-transform duration-200", !sidebarOpen && "rotate-180")}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              {sidebarOpen && <span className="text-[13px] truncate">Colapsar</span>}
            </button>
          </div>

          {/* Cuenta */}
          <div className="flex flex-col gap-px border-t border-sb-outline-variant/6 pt-2">
            {sidebarOpen && (
              <h3 className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-sb-on-surface-variant/50">
                Cuenta
              </h3>
            )}
            {user && (
              <div className={cn(
                "flex items-center gap-2.5",
                sidebarOpen ? "h-9 px-2.5 rounded-md" : "justify-center w-9 h-9 mx-auto rounded-md"
              )}>
                <div className="h-6 w-6 rounded-full bg-foreground flex items-center justify-center shrink-0">
                  <span className="text-background text-[9px] font-semibold">
                    {user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </span>
                </div>
                {sidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-sb-on-surface truncate">{user.full_name}</p>
                    <p className="text-[10px] text-sb-on-surface-variant/50 truncate">{roleLabel}</p>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-2.5 transition-colors duration-150",
                sidebarOpen ? "h-8 px-2.5 rounded-md w-full" : "justify-center w-9 h-9 mx-auto rounded-md",
                "text-sb-on-surface-variant/70 hover:bg-sb-surface-container/60 hover:text-sb-on-surface"
              )}
              title="Cerrar sesión">
              <LogOut className="h-[16px] w-[16px] shrink-0" />
              {sidebarOpen && <span className="text-[13px] truncate">Salir</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ===== MAIN CHAT AREA ===== */}
      <div className="flex-1 flex flex-col min-w-0 bg-sb-surface">
{/* Header */}
          <div className="flex items-center justify-between px-4 h-12 shrink-0 border-b border-sb-outline-variant/10 bg-gradient-to-r from-violet-500/5 to-transparent">
            <div className="flex items-center gap-2 min-w-0">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="h-7 w-7 rounded-md flex items-center justify-center text-sb-on-surface-variant/60 hover:text-sb-on-surface hover:bg-sb-surface-container transition-colors shrink-0"
                  title="Abrir panel"
                >
                  <PanelLeft className="h-3.5 w-3.5" />
                </button>
              )}
              <div className="min-w-0">
                <h3 className="text-[13px] font-semibold text-sb-on-surface truncate">
                  {activeConversation?.title || "Asistente IA"}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={newConversation}
                className="hidden sm:flex items-center gap-1.5 h-7 px-2 rounded-md text-[11px] text-violet-500 hover:text-violet-600 hover:bg-violet-500/10 transition-colors"
                title="Nueva conversación"
              >
                <Plus className="h-3 w-3" />
                <span>Nueva</span>
              </button>
            </div>
          </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 md:px-6 md:py-8">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} onAction={executeAction} />
            ))}

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="h-7 w-7 rounded-md bg-foreground flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-background" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-[10px] text-sb-on-surface-variant/50 mb-2">
                    <span className="font-medium">Asistente</span>
                    <span>·</span>
                    <span>Pensando...</span>
                  </div>
                  <div className="rounded-2xl rounded-tl-md bg-sb-surface-container px-4 py-3 inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-sb-on-surface-variant/40 animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-sb-on-surface-variant/40 animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-sb-on-surface-variant/40 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Actions (empty state) */}
        {messages.length <= 1 && (
          <div className="shrink-0 border-t border-sb-outline-variant/10 bg-sb-surface-container-low/20">
            <div className="max-w-3xl mx-auto px-4 py-4 md:px-6 md:py-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                <p className="text-[10px] font-semibold text-sb-on-surface-variant/50 uppercase tracking-wider">
                  Acciones rápidas
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {quickActions.map((action) => {
                  const Icon = iconMap[action.icon] || Sparkles
                  return (
                    <button
                      key={action.command}
                      onClick={() => executeAction(action.command)}
                      className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-sb-surface border border-sb-outline-variant/10 hover:border-violet-500/20 hover:bg-violet-500/5 hover:shadow-sm transition-all text-left group"
                    >
                      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors group-hover:scale-110", action.bg)}>
                        <Icon className={cn("h-4 w-4", action.color)} />
                      </div>
                      <span className="text-[12px] font-medium text-sb-on-surface truncate">{action.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 border-t border-sb-outline-variant/10 bg-sb-surface">
          <div className="max-w-3xl mx-auto px-6 py-4">
            {messages.length > 1 && messages.length <= 3 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {suggestedPrompts.slice(0, 3).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="text-[11px] px-3 py-1.5 rounded-full bg-sb-surface-container border border-sb-outline-variant/10 text-sb-on-surface-variant/70 hover:bg-sb-surface-container-high hover:text-sb-on-surface hover:border-sb-outline-variant/20 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <div className="relative flex items-end gap-2 bg-sb-surface-container rounded-2xl border border-sb-outline-variant/15 focus-within:border-violet-500/30 focus-within:shadow-sm focus-within:shadow-violet-500/5 transition-all p-2">
              <div className="pl-2 pb-1.5">
                <Zap className="h-4 w-4 text-violet-400" />
              </div>
              <textarea
                ref={inputRef}
                placeholder="Escribe tu solicitud..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                className="flex-1 bg-transparent text-[13px] text-sb-on-surface placeholder:text-sb-on-surface-variant/40 outline-none resize-none py-2.5 max-h-32"
                style={{ height: "auto", minHeight: "36px" }}
                onInput={(e) => {
                  const target = e.currentTarget
                  target.style.height = "auto"
                  target.style.height = Math.min(target.scrollHeight, 128) + "px"
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="h-9 w-9 rounded-xl bg-violet-500 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-violet-600 transition-colors shrink-0 shadow-sm shadow-violet-500/20"
              >
                <Send className="h-4 w-4 text-white" />
              </button>
            </div>
            <p className="text-[10px] text-sb-on-surface-variant/30 text-center mt-2">
              Enter para enviar · Shift+Enter para nueva línea
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message, onAction }: { message: Message; onAction: (cmd: string) => void }) {
  const [copied, setCopied] = React.useState(false)
  const isUser = message.role === "user"

  const copy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {isUser ? (
        <div className="h-7 w-7 rounded-md bg-sb-surface-container-high flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-semibold text-sb-on-surface">
          Tú
        </div>
      ) : (
        <div className="h-7 w-7 rounded-md bg-foreground flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="h-3.5 w-3.5 text-background" />
        </div>
      )}

      <div className={cn("flex-1 min-w-0 space-y-2", isUser && "flex flex-col items-end")}>
        <div className="flex items-center gap-2 text-[10px] text-sb-on-surface-variant/50">
          <span className="font-medium">{isUser ? "Tú" : "Asistente"}</span>
          <span>·</span>
          <span>{formatTime(message.timestamp)}</span>
        </div>
        <div className="group relative max-w-[90%]">
          <div
            className={cn(
              "rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed",
              isUser
                ? "bg-violet-500 text-white rounded-tr-md shadow-sm shadow-violet-500/10"
                : "bg-sb-surface-container text-sb-on-surface rounded-tl-md border border-sb-outline-variant/5"
            )}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          {!isUser && (
            <button
              onClick={copy}
              className="absolute -bottom-1 right-2 h-6 w-6 rounded-md bg-sb-surface border border-sb-outline-variant/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sb-on-surface-variant/50 hover:text-sb-on-surface"
              title="Copiar"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </button>
          )}
        </div>

        {message.actions && message.actions.length > 0 && (
          <div className="w-full max-w-[90%] space-y-1.5 pt-1">
            {message.actions.map((action, i) => {
              const Icon = iconMap[action.icon] || Sparkles
              return (
                <button
                  key={i}
                  onClick={() => onAction(action.command)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-sb-surface-container/50 hover:bg-sb-surface-container transition-colors text-left group"
                >
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", action.bg)}>
                    <Icon className={cn("h-4 w-4", action.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-sb-on-surface">{action.label}</p>
                    <p className="text-[10px] text-sb-on-surface-variant/50">{action.description}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-sb-on-surface-variant/30 group-hover:text-sb-on-surface-variant/60 transition-colors" />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}

interface AIAssistantPanelProps {
  open: boolean
  onClose: () => void
}

function AIAssistant({ open, onClose }: AIAssistantPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md md:bg-black/40"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 right-0 bottom-0 h-[85vh] max-h-[85vh] bg-sb-surface shadow-2xl flex flex-col rounded-t-2xl overflow-hidden md:absolute md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-1/2 md:-translate-x-1/2 md:max-w-md md:max-h-[calc(100vh-2rem)] md:rounded-2xl z-[70]"
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle for mobile */}
            <div className="flex justify-center pt-3 pb-1 shrink-0 md:hidden">
              <div className="w-10 h-1 rounded-full bg-sb-outline-variant/30" />
            </div>

            <div className="flex items-center justify-between px-4 h-12 border-b border-sb-outline-variant/10 shrink-0 md:h-14">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-sb-on-surface">Asistente IA</h2>
                  <p className="text-[10px] text-sb-on-surface-variant/50">Chat inteligente</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-10 h-10 rounded-xl text-sb-on-surface-variant hover:bg-sb-surface-container-highest/50 transition-colors -mr-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <AIAssistantContent />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AIAssistant
