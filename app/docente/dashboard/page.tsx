"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bold, Italic, List, ListOrdered, FormatQuote, ChevronDown, Check, Plus,
  Star, StarOutline, SlidersHorizontal, Trash2, FileText, Share, ListChecks,
} from "@/components/ui/proicons"

interface WsTask {
  id: string
  title: string
  done: boolean
  starred: boolean
  createdAt: number
}

type FilterMode = "all" | "pending" | "done"

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now() + Math.random())

const easeOut = [0.37, 0.35, 0, 1] as const

const surface = "bg-[var(--note-surface)]"
const hair = "border-[var(--note-hairline)]"

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
    "flex h-8 w-8 items-center justify-center rounded-[10px] text-[var(--note-muted)] transition-colors duration-150 hover:bg-[var(--note-fill)] hover:text-[var(--note-text)]"

  return (
    <section className="flex min-h-[52vh] flex-col overflow-hidden rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] lg:min-h-0 lg:flex-1">
      {/* Toolbar */}
      <div className="flex h-[46px] shrink-0 items-center gap-1 border-b border-[var(--note-hairline)] px-3">
        <div className="relative">
          <button
            onClick={() => setBlockOpen((o) => !o)}
            className="flex h-9 w-[150px] items-center justify-between gap-2 rounded-[12px] border border-[var(--note-hairline)] bg-[var(--note-fill)] px-3.5 text-[13px] text-[var(--note-muted)] transition-all duration-150 hover:border-[var(--note-hairline-strong)] hover:text-[var(--note-text)]"
          >
            <span className="truncate">{block}</span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 opacity-50 transition-transform duration-200", blockOpen && "rotate-180")} />
          </button>
          <AnimatePresence>
            {blockOpen && (
              <motion.div
                key="block"
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15, ease: easeOut }}
                className="absolute left-0 top-[calc(100%+6px)] z-30 w-[150px] rounded-[14px] border border-[var(--note-hairline-strong)] bg-[var(--note-fill)] p-1.5 shadow-lg shadow-black/10"
              >
                {BLOCKS.map((b) => (
                  <button
                    key={b.label}
                    onClick={() => applyBlock(b.label, b.tag)}
                    className={cn(
                      "flex h-[34px] w-full items-center justify-between rounded-[10px] px-2.5 text-[13px] transition-colors duration-100",
                      block === b.label
                        ? "bg-[var(--note-fill-strong)] font-medium text-[var(--note-text)]"
                        : "text-[var(--note-muted)] hover:bg-[var(--note-fill-strong)] hover:text-[var(--note-text)]"
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

        <span className="mx-1 h-5 w-px shrink-0 bg-[var(--note-hairline-strong)]" />

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
          className="ws-editor min-h-full text-[14px] leading-[1.7] text-[var(--note-text)] outline-none"
        />
      </div>
    </section>
  )
}

/* ────────────────────────── TAREAS ────────────────────────── */

function TasksPanel({ tasks, setTasks }: {
  tasks: WsTask[]
  setTasks: React.Dispatch<React.SetStateAction<WsTask[]>>
}) {
  const [creating, setCreating] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [editId, setEditId] = React.useState<string | null>(null)
  const [editTitle, setEditTitle] = React.useState("")
  const [filter, setFilter] = React.useState<FilterMode>("all")
  const [starOnly, setStarOnly] = React.useState(false)
  const [filterOpen, setFilterOpen] = React.useState(false)

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
      "flex h-9 w-9 items-center justify-center rounded-[11px] border transition-colors duration-150",
      active
        ? "border-[var(--note-hairline-strong)] bg-[var(--note-fill-strong)] text-[var(--note-text)]"
        : "border-transparent bg-[var(--note-fill)] text-[var(--note-muted)] hover:bg-[var(--note-fill-strong)] hover:text-[var(--note-text)]"
    )

  return (
    <section className="flex h-[45vh] flex-col rounded-[24px] border border-[var(--note-hairline)] bg-[var(--note-surface)] lg:h-auto lg:min-h-0 lg:w-[290px] lg:shrink-0 xl:w-[400px]">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between px-4 pb-3 pt-4">
        <h2 className="text-[22px] font-semibold tracking-tight text-[var(--note-text)]">Tareas</h2>
        <div className="flex items-center gap-1.5">
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
                  className="absolute right-0 top-[calc(100%+6px)] z-30 w-[180px] rounded-[14px] border border-[var(--note-hairline-strong)] bg-[var(--note-fill)] p-1.5 shadow-lg shadow-black/10"
                >
                  {FILTERS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => { setFilter(f.key); setFilterOpen(false) }}
                      className={cn(
                        "flex h-[34px] w-full items-center justify-between rounded-[10px] px-2.5 text-[13px] transition-colors duration-100",
                        filter === f.key
                          ? "bg-[var(--note-fill-strong)] font-medium text-[var(--note-text)]"
                          : "text-[var(--note-muted)] hover:bg-[var(--note-fill-strong)] hover:text-[var(--note-text)]"
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
            className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-[var(--note-solid-bg)] text-[var(--note-solid-fg)] transition-all duration-150 hover:scale-[1.03] hover:opacity-90"
            title="Crear tarea"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Container */}
      <div className={cn("mx-4 mb-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border", hair, surface)}>
        {creating && (
          <div className="mx-2.5 mt-2.5 flex shrink-0 items-center gap-2.5 rounded-[12px] border border-[var(--note-hairline-strong)] bg-[var(--note-fill)] px-2.5 py-2">
            <span className="h-[18px] w-[18px] shrink-0 rounded-full border border-[var(--note-hairline-strong)]" />
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitCreate()
                if (e.key === "Escape") { setTitle(""); setCreating(false) }
              }}
              placeholder="Nombre de la tarea..."
              className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--note-text)] outline-none placeholder:text-[var(--note-muted)]"
            />
            <button
              onClick={commitCreate}
              className="shrink-0 text-[12px] font-medium text-[var(--note-muted)] transition-colors duration-150 hover:text-[var(--note-text)]"
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
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--note-fill)]">
                <ListChecks className="h-7 w-7 text-[var(--note-muted)]" />
              </div>
              <p className="text-[14px] text-[var(--note-muted)]">
                {tasks.length === 0 ? "No hay tareas" : "No hay resultados"}
              </p>
              <button
                onClick={startCreate}
                className="rounded-[18px] bg-[var(--note-fill)] px-4 py-2 text-[13px] text-[var(--note-muted)] transition-colors duration-150 hover:bg-[var(--note-fill-strong)] hover:text-[var(--note-text)]"
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
                className="group flex items-center gap-2.5 rounded-[12px] px-2.5 py-2 transition-colors duration-150 hover:bg-[var(--note-fill)]"
              >
                <button
                  onClick={() => toggle(t.id)}
                  className={cn(
                    "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-all duration-150",
                    t.done
                      ? "border-transparent bg-[var(--note-solid-bg)]"
                      : "border-[var(--note-hairline-strong)] hover:border-[var(--note-text)]"
                  )}
                  aria-label={t.done ? "Desmarcar" : "Completar"}
                >
                  {t.done && <Check className="h-3 w-3 text-[var(--note-solid-fg)]" />}
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
                    className="min-w-0 flex-1 border-b border-[var(--note-hairline-strong)] bg-transparent py-0.5 text-[14px] text-[var(--note-text)] outline-none"
                  />
                ) : (
                  <button
                    onClick={() => startEdit(t)}
                    className={cn(
                      "min-w-0 flex-1 truncate text-left text-[14px] transition-colors duration-150",
                      t.done ? "text-[var(--note-muted)] line-through" : "text-[var(--note-text)] hover:text-[var(--note-muted)]"
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
                    ? <Star className="h-[16px] w-[16px] text-[var(--note-text)]" />
                    : <StarOutline className="h-[16px] w-[16px] text-[var(--note-muted)]" />}
                </button>
                <button
                  onClick={() => remove(t.id)}
                  className="shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus:opacity-100"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-[16px] w-[16px] text-[var(--note-muted)] transition-colors duration-150 hover:text-[var(--note-text)]" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
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

  React.useEffect(() => {
    try { localStorage.setItem("sb-ws-tasks", JSON.stringify(tasks)) } catch {}
  }, [tasks])

  return (
    <div className="sb-note-dash flex min-h-full flex-col gap-3 lg:h-full lg:flex-row">
      <Editor />
      <TasksPanel tasks={tasks} setTasks={setTasks} />
    </div>
  )
}
