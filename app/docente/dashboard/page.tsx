"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen, Calendar, CalendarDays, UserCheck, BookMarked, ClipboardList,
  FileText, MessageSquare, Home, Plus, Star, StarOutline, ChevronDown,
  Bold, Italic, List, ListOrdered, FormatQuote, SlidersHorizontal, Check, X,
  Trash2, Menu, LogOut, ListChecks, Share,
} from "@/components/ui/proicons"

type IconType = React.ComponentType<{ className?: string }>

interface WsTask {
  id: string
  title: string
  done: boolean
  starred: boolean
  createdAt: number
}

type FilterMode = "all" | "pending" | "done"

interface NavItem {
  title: string
  href: string
  icon: IconType
}

const NAV: NavItem[] = [
  { title: "Inicio", href: "/docente/dashboard", icon: Home },
  { title: "Cursos", href: "/docente/cursos", icon: BookOpen },
  { title: "Horarios", href: "/docente/horarios", icon: Calendar },
  { title: "Asistencia", href: "/docente/asistencia", icon: UserCheck },
  { title: "Notas", href: "/docente/calificaciones", icon: BookMarked },
  { title: "Tareas", href: "/docente/tareas", icon: ClipboardList },
  { title: "Materiales", href: "/docente/materiales", icon: FileText },
  { title: "Calendario", href: "/docente/calendario", icon: CalendarDays },
  { title: "Mensajes", href: "/docente/mensajes", icon: MessageSquare },
]

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now() + Math.random())

const easeOut = [0.37, 0.35, 0, 1] as const

/* ────────────────────────── SIDEBAR ────────────────────────── */

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const active =
    item.href === "/docente/dashboard"
      ? pathname === "/docente/dashboard"
      : pathname === item.href || pathname.startsWith(item.href + "/")
  return (
    <Link
      href={item.href}
      className={cn(
        "flex h-[38px] items-center gap-[10px] rounded-[10px] px-3 text-[14px] transition-colors duration-150",
        active
          ? "bg-[#050505] font-medium text-white"
          : "text-[#8a8a8a] hover:bg-[#181819] hover:text-white"
      )}
    >
      <item.icon className="h-[17px] w-[17px] shrink-0" />
      <span className="truncate">{item.title}</span>
    </Link>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }) } catch {}
    logout()
    router.push("/login")
  }

  return (
    <div className="flex h-full flex-col bg-[#111112]">
      <div className="flex shrink-0 items-center gap-2.5 px-[22px] pt-[22px] pb-5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-white">
          <Check className="h-4 w-4 text-black" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold tracking-tight text-white/90">
          EduNexus
        </span>
        <button
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] text-white/40 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white/80"
          aria-label="Cambiar workspace"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex shrink-0 flex-col gap-1 px-2.5">
        {NAV.map((item) => (
          <div key={item.href} onClick={onNavigate}>
            <NavLink item={item} />
          </div>
        ))}
      </nav>

      <div className="mt-auto shrink-0 border-t border-white/[0.05] px-2.5 pb-5 pt-3">
        <Link
          href="/perfil"
          onClick={onNavigate}
          className="flex h-[38px] items-center gap-[10px] rounded-[10px] px-3 text-[14px] text-[#8a8a8a] transition-colors duration-150 hover:bg-[#181819] hover:text-white"
        >
          <SlidersHorizontal className="h-[17px] w-[17px] shrink-0" />
          <span>Opciones</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex h-[38px] w-full items-center gap-[10px] rounded-[10px] px-3 text-[14px] text-[#8a8a8a] transition-colors duration-150 hover:bg-[#181819] hover:text-white"
        >
          <LogOut className="h-[17px] w-[17px] shrink-0" />
          <span>Salir</span>
        </button>
      </div>
    </div>
  )
}

/* ────────────────────────── EDITOR ────────────────────────── */

function Editor() {
  const editorRef = React.useRef<HTMLDivElement>(null)
  const [block, setBlock] = React.useState("Texto")
  const [blockOpen, setBlockOpen] = React.useState(false)

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("sb-ws-editor")
      if (saved && editorRef.current && editorRef.current.innerHTML !== saved) {
        editorRef.current.innerHTML = saved
      }
    } catch {}
  }, [])

  const save = () => {
    const el = editorRef.current
    if (!el) return
    const clean = el.innerHTML.replace(/<br>/g, "").trim()
    if (clean === "") el.innerHTML = ""
    try { localStorage.setItem("sb-ws-editor", el.innerHTML) } catch {}
  }

  const exec = (cmd: string, val?: string) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val)
    save()
  }

  const applyBlock = (label: string, tag: string) => {
    if (tag === "ul") exec("insertUnorderedList")
    else exec("formatBlock", tag)
    setBlock(label)
    setBlockOpen(false)
  }

  const BLOCKS = [
    { label: "Texto", tag: "P" },
    { label: "Título", tag: "h1" },
    { label: "Subtítulo", tag: "h2" },
    { label: "Cita", tag: "blockquote" },
    { label: "Lista", tag: "ul" },
  ]

  const btn =
    "flex h-8 w-8 items-center justify-center rounded-[8px] text-white/50 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white"

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-black">
      {/* Toolbar */}
      <div className="flex h-[46px] shrink-0 items-center gap-1 border-b border-white/[0.06] px-3">
        <div className="relative">
          <button
            onClick={() => setBlockOpen((o) => !o)}
            className="flex h-9 w-[180px] items-center justify-between gap-2 rounded-[12px] border border-white/[0.08] bg-[#050505] px-3.5 text-[13px] text-white/70 transition-all duration-150 hover:border-white/[0.14] hover:text-white"
          >
            <span className="truncate">{block}</span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 opacity-40 transition-transform duration-200", blockOpen && "rotate-180")} />
          </button>
          <AnimatePresence>
            {blockOpen && (
              <motion.div
                key="block"
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15, ease: easeOut }}
                className="absolute left-0 top-[calc(100%+6px)] z-30 w-[180px] rounded-[12px] border border-white/[0.08] bg-[#111112] p-1.5 shadow-xl shadow-black/40"
              >
                {BLOCKS.map((b) => (
                  <button
                    key={b.label}
                    onClick={() => applyBlock(b.label, b.tag)}
                    className={cn(
                      "flex h-[34px] w-full items-center justify-between rounded-[8px] px-2.5 text-[13px] transition-colors duration-100",
                      block === b.label ? "bg-white/[0.08] font-medium text-white" : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                    )}
                  >
                    {b.label}
                    {block === b.label && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <span className="mx-1 h-5 w-px shrink-0 bg-white/[0.08]" />

        <button className={btn} onClick={() => exec("bold")} title="Negrita"><Bold className="h-[16px] w-[16px]" /></button>
        <button className={btn} onClick={() => exec("italic")} title="Cursiva"><Italic className="h-[16px] w-[16px]" /></button>
        <button className={btn} onClick={() => exec("insertUnorderedList")} title="Lista"><List className="h-[16px] w-[16px]" /></button>
        <button className={btn} onClick={() => exec("insertOrderedList")} title="Lista numerada"><ListOrdered className="h-[16px] w-[16px]" /></button>
        <button className={btn} onClick={() => exec("formatBlock", "blockquote")} title="Cita"><FormatQuote className="h-[16px] w-[16px]" /></button>

        <div className="ml-auto flex items-center gap-1">
          <button className={btn} title="Documento"><FileText className="h-[16px] w-[16px]" /></button>
          <button className={btn} title="Compartir"><Share className="h-[16px] w-[16px]" /></button>
        </div>
      </div>

      {/* Editor */}
      <div className="ws-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Empieza a escribir..."
          onInput={save}
          onBlur={save}
          spellCheck={false}
          className="ws-editor min-h-full text-[14px] leading-[1.7] text-white/80 outline-none"
        />
      </div>
    </div>
  )
}

/* ────────────────────────── TAREAS ────────────────────────── */

function TasksPanel({
  tasks,
  setTasks,
  onClose,
  autoCreate,
}: {
  tasks: WsTask[]
  setTasks: React.Dispatch<React.SetStateAction<WsTask[]>>
  onClose?: () => void
  autoCreate?: boolean
}) {
  const [filterOpen, setFilterOpen] = React.useState(false)
  const [creating, setCreating] = React.useState(!!autoCreate)
  const [title, setTitle] = React.useState("")
  const [editId, setEditId] = React.useState<string | null>(null)
  const [editTitle, setEditTitle] = React.useState("")
  const [filter, setFilter] = React.useState<FilterMode>("all")
  const [starOnly, setStarOnly] = React.useState(false)

  const startCreate = () => {
    setCreating(true)
    setEditId(null)
  }

  const commitCreate = () => {
    const v = title.trim()
    if (v) {
      setTasks((prev) => [
        { id: uid(), title: v, done: false, starred: false, createdAt: Date.now() },
        ...prev,
      ])
    }
    setTitle("")
    setCreating(false)
  }

  const startEdit = (t: WsTask) => {
    setEditId(t.id)
    setEditTitle(t.title)
    setCreating(false)
  }

  const commitEdit = (id: string) => {
    const v = editTitle.trim()
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, title: v || t.title } : t)))
    setEditId(null)
  }

  const toggle = (id: string) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  const toggleStar = (id: string) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, starred: !t.starred } : t)))
  const remove = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id))

  const visible = tasks
    .filter((t) => {
      if (filter === "pending") return !t.done
      if (filter === "done") return t.done
      return true
    })
    .filter((t) => (starOnly ? t.starred : true))

  const FILTERS: { key: FilterMode; label: string }[] = [
    { key: "all", label: "Todas" },
    { key: "pending", label: "Pendientes" },
    { key: "done", label: "Completadas" },
  ]

  const iconBtn = (active: boolean) =>
    cn(
      "flex h-9 w-9 items-center justify-center rounded-[10px] transition-colors duration-150",
      active ? "bg-white/[0.12] text-white" : "bg-[#1a1a1b] text-white/70 hover:bg-[#242425] hover:text-white"
    )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between px-1 pb-4">
        <h2 className="text-[22px] font-semibold tracking-tight text-white">Tareas</h2>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className={cn(iconBtn(false), "md:hidden")}
              aria-label="Cerrar tareas"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          )}
          <div className="relative">
            <button onClick={() => setFilterOpen((o) => !o)} className={iconBtn(filter !== "all")} title="Filtrar">
              <SlidersHorizontal className="h-[17px] w-[17px]" />
            </button>
            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  key="filters"
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: easeOut }}
                  className="absolute right-0 top-[calc(100%+6px)] z-30 w-[180px] rounded-[12px] border border-white/[0.08] bg-[#111112] p-1.5 shadow-xl shadow-black/40"
                >
                  {FILTERS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => { setFilter(f.key); setFilterOpen(false) }}
                      className={cn(
                        "flex h-[34px] w-full items-center justify-between rounded-[8px] px-2.5 text-[13px] transition-colors duration-100",
                        filter === f.key ? "bg-white/[0.08] font-medium text-white" : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                      )}
                    >
                      {f.label}
                      {filter === f.key && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => setStarOnly((s) => !s)} className={iconBtn(starOnly)} title="Favoritas">
            <Star className="h-[17px] w-[17px]" />
          </button>
          <button
            onClick={startCreate}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-white text-black transition-all duration-150 hover:scale-[1.03] hover:opacity-90"
            title="Crear tarea"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Container */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-white/[0.06] bg-black">
        {creating && (
          <div className="mx-2.5 mt-2.5 flex shrink-0 items-center gap-2.5 rounded-[12px] border border-white/[0.08] bg-[#050505] px-2.5 py-2">
            <span className="h-[18px] w-[18px] shrink-0 rounded-full border border-white/25" />
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitCreate()
                if (e.key === "Escape") { setTitle(""); setCreating(false) }
              }}
              placeholder="Nombre de la tarea..."
              className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/30"
            />
            <button
              onClick={commitCreate}
              className="shrink-0 text-[12px] font-medium text-white/40 transition-colors duration-150 hover:text-white"
            >
              Guardar
            </button>
          </div>
        )}

        {visible.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, ease: easeOut }}
              className="flex flex-col items-center gap-3"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04]">
                <ListChecks className="h-7 w-7 text-white/25" />
              </div>
              <p className="text-[14px] text-[#8a8a8a]">
                {tasks.length === 0 ? "No hay tareas" : "No hay resultados"}
              </p>
              <button
                onClick={startCreate}
                className="rounded-[18px] bg-[#1a1a1b] px-4 py-2 text-[13px] text-[#a0a0a0] transition-colors duration-150 hover:bg-[#242425] hover:text-white"
              >
                Crear tarea
              </button>
            </motion.div>
          </div>
        ) : (
          <div className="ws-scroll flex-1 overflow-y-auto px-1.5 py-2">
            {visible.map((t) => (
              <div
                key={t.id}
                className="group flex items-center gap-2.5 rounded-[12px] px-2.5 py-2 transition-colors duration-150 hover:bg-white/[0.03]"
              >
                <button
                  onClick={() => toggle(t.id)}
                  className={cn(
                    "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-all duration-150",
                    t.done ? "border-white bg-white" : "border-white/25 hover:border-white/60"
                  )}
                  aria-label={t.done ? "Desmarcar" : "Completar"}
                >
                  {t.done && <Check className="h-3 w-3 text-black" />}
                </button>

                {editId === t.id ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit(t.id)
                      if (e.key === "Escape") setEditId(null)
                    }}
                    className="min-w-0 flex-1 border-b border-white/20 bg-transparent py-0.5 text-[14px] text-white outline-none"
                  />
                ) : (
                  <button
                    onClick={() => startEdit(t)}
                    className={cn(
                      "min-w-0 flex-1 truncate text-left text-[14px] transition-colors duration-150",
                      t.done ? "text-white/30 line-through" : "text-white/80 hover:text-white"
                    )}
                  >
                    {t.title}
                  </button>
                )}

                <button
                  onClick={() => toggleStar(t.id)}
                  className="shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus:opacity-100"
                  aria-label="Favorita"
                >
                  {t.starred
                    ? <Star className="h-[16px] w-[16px] text-white/80" />
                    : <StarOutline className="h-[16px] w-[16px] text-white/40" />}
                </button>
                <button
                  onClick={() => remove(t.id)}
                  className="shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus:opacity-100"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-[16px] w-[16px] text-white/40 transition-colors duration-150 hover:text-white/80" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ────────────────────────── PÁGINA ────────────────────────── */

export default function DocenteDashboard() {
  const [tasks, setTasks] = React.useState<WsTask[]>(() => {
    try {
      const raw = localStorage.getItem("sb-ws-tasks")
      return raw ? (JSON.parse(raw) as WsTask[]) : []
    } catch { return [] }
  })
  const [navOpen, setNavOpen] = React.useState(false)
  const [tasksOpen, setTasksOpen] = React.useState(false)
  const [autoCreate, setAutoCreate] = React.useState(false)

  React.useEffect(() => {
    try { localStorage.setItem("sb-ws-tasks", JSON.stringify(tasks)) } catch {}
  }, [tasks])

  const openTasksCreate = () => {
    setTasksOpen(true)
    setAutoCreate(true)
  }

  const closeTasks = () => {
    setTasksOpen(false)
    setAutoCreate(false)
  }

  return (
    <div className="ws-root flex h-full flex-col bg-black text-white">
      {/* Mobile top bar */}
      <header className="z-20 flex h-14 shrink-0 items-center gap-2 border-b border-white/[0.06] bg-[#050505] px-3 md:hidden">
        <button
          onClick={() => setNavOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-[10px] text-white/70 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-white">
            <Check className="h-3.5 w-3.5 text-black" />
          </span>
          <span className="truncate text-[13px] font-semibold tracking-tight text-white/90">EduNexus</span>
        </div>
        <button
          onClick={openTasksCreate}
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-[10px] bg-white text-black transition-all duration-150 hover:scale-[1.03]"
          aria-label="Crear tarea"
        >
          <Plus className="h-5 w-5" />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 gap-2 p-2">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-[220px] shrink-0 overflow-hidden rounded-2xl border border-white/[0.06] md:flex">
          <SidebarContent />
        </aside>

        {/* Editor */}
        <Editor />

        {/* Tareas (desktop) */}
        <div className="hidden min-h-0 w-[280px] shrink-0 flex-col md:flex lg:w-[30%] lg:max-w-[520px]">
          <TasksPanel tasks={tasks} setTasks={setTasks} />
        </div>
      </div>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {navOpen && (
          <>
            <motion.div
              key="nav-backdrop"
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setNavOpen(false)}
            />
            <motion.aside
              key="nav-drawer"
              className="fixed inset-y-0 left-0 z-50 w-[280px] md:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
            >
              <SidebarContent onNavigate={() => setNavOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile tasks drawer */}
      <AnimatePresence>
        {tasksOpen && (
          <>
            <motion.div
              key="tasks-backdrop"
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeTasks}
            />
            <motion.div
              key="tasks-drawer"
              className="fixed inset-y-0 right-0 z-50 w-full max-w-[420px] p-2 md:hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
            >
              <div className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-[#050505] p-3">
                <TasksPanel
                  tasks={tasks}
                  setTasks={setTasks}
                  onClose={closeTasks}
                  autoCreate={autoCreate}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
