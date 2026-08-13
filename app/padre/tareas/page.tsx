"use client"

import * as React from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  Bold,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Edit3,
  FileText,
  Filter,
  FolderOpen,
  Italic,
  LayoutDashboard,
  Link2,
  List,
  ListOrdered,
  Plus,
  Settings,
  Star,
  Trash2,
  X,
} from "@/components/ui/proicons"

interface Homework {
  id: string
  title: string
  subject: string
  description: string
  due_date: string
  status: string
  priority: string
  assigned_by: string
  grade?: number
  local?: boolean
}

type TaskFilter = "all" | "pending" | "delivered" | "graded"

const navItems = [
  { title: "Inicio", href: "/padre/dashboard", icon: LayoutDashboard, active: true },
  { title: "Tareas", href: "/padre/tareas", icon: ClipboardList },
  { title: "Proyectos", href: "/padre/comunicados", icon: FolderOpen },
  { title: "Semanas", href: "/padre/calendario", icon: Calendar },
]

const filters: { key: TaskFilter; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "pending", label: "Pendientes" },
  { key: "delivered", label: "Entregadas" },
  { key: "graded", label: "Calificadas" },
]

const emptyForm = {
  title: "",
  subject: "",
  due_date: "",
  description: "",
}

export default function TareasPage() {
  const [tasks, setTasks] = React.useState<Homework[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<TaskFilter>("all")
  const [editorValue, setEditorValue] = React.useState("")
  const [formOpen, setFormOpen] = React.useState(false)
  const [detailTask, setDetailTask] = React.useState<Homework | null>(null)
  const [editingTask, setEditingTask] = React.useState<Homework | null>(null)
  const [form, setForm] = React.useState(emptyForm)

  React.useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 4500)

    fetch("/api/padre/tareas", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setTasks(Array.isArray(data) ? data : []))
      .catch(() => setTasks([]))
      .finally(() => {
        window.clearTimeout(timeout)
        setLoading(false)
      })

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [])

  const visibleTasks = filter === "all" ? tasks : tasks.filter((task) => task.status === filter)
  const counts = {
    all: tasks.length,
    pending: tasks.filter((task) => task.status === "pending").length,
    delivered: tasks.filter((task) => task.status === "delivered").length,
    graded: tasks.filter((task) => task.status === "graded").length,
  }

  const openCreateTask = () => {
    setEditingTask(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEditTask = (task: Homework) => {
    setEditingTask(task)
    setForm({
      title: task.title,
      subject: task.subject || "",
      due_date: task.due_date || "",
      description: task.description || "",
    })
    setFormOpen(true)
  }

  const saveTask = () => {
    if (!form.title.trim()) return

    if (editingTask) {
      const updatedTask: Homework = {
        ...editingTask,
        title: form.title.trim(),
        subject: form.subject.trim(),
        due_date: form.due_date,
        description: form.description.trim(),
      }
      setTasks((current) => current.map((task) => (task.id === editingTask.id ? updatedTask : task)))
      setDetailTask((current) => (current?.id === editingTask.id ? updatedTask : current))
    } else {
      setTasks((current) => [
        {
          id: `local-${Date.now()}`,
          title: form.title.trim(),
          subject: form.subject.trim() || "Personal",
          due_date: form.due_date || new Date().toISOString().slice(0, 10),
          description: form.description.trim(),
          status: "pending",
          priority: "medium",
          assigned_by: "Tarea personal",
          local: true,
        },
        ...current,
      ])
    }

    setFormOpen(false)
    setEditingTask(null)
    setForm(emptyForm)
  }

  const markCompleted = (taskId: string) => {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, status: "delivered" } : task)),
    )
    setDetailTask((current) => (current?.id === taskId ? { ...current, status: "delivered" } : current))
  }

  const deleteTask = (taskId: string) => {
    setTasks((current) => current.filter((task) => task.id !== taskId))
    setDetailTask((current) => (current?.id === taskId ? null : current))
  }

  return (
    <div className="min-h-[100dvh] overflow-hidden bg-black text-white">
      <div className="grid h-[100dvh] grid-cols-1 gap-2 overflow-hidden p-2 md:grid-cols-[72px_minmax(0,1fr)] xl:grid-cols-[238px_minmax(640px,1fr)_minmax(420px,32vw)]">
        <aside className="hidden h-full flex-col rounded-[18px] border border-white/[0.04] bg-[#111112] md:flex xl:rounded-none xl:border-0">
          <div className="flex items-center gap-2.5 px-5 pb-4 pt-5 md:justify-center md:px-0 xl:justify-start xl:px-5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-white/[0.06] bg-black">
              <ClipboardList className="h-4 w-4 text-white" />
            </div>
            <div className="hidden min-w-0 flex-1 xl:block">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-[14px] font-medium leading-none text-white">Educonecta</p>
                <ChevronDown className="h-4 w-4 text-[#8a8a8a]" />
              </div>
              <p className="mt-1 text-[12px] leading-none text-[#666666]">sb Tasks</p>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1 px-3 py-2 xl:px-4">
            {navItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "group flex h-10 items-center gap-3 rounded-[11px] px-3 text-[14px] transition-colors duration-150",
                  "md:justify-center xl:justify-start",
                  item.active
                    ? "bg-[#050505] text-white"
                    : "text-[#8a8a8a] hover:bg-[#181819] hover:text-white",
                )}
                title={item.title}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="hidden xl:inline">{item.title}</span>
              </Link>
            ))}
          </nav>

          <div className="px-3 pb-4 xl:px-4">
            <Link
              href="/perfil"
              className="flex h-10 items-center gap-3 rounded-[11px] px-3 text-[14px] text-[#8a8a8a] transition-colors duration-150 hover:bg-[#181819] hover:text-white md:justify-center xl:justify-start"
              title="Opciones"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden xl:inline">Opciones</span>
            </Link>
          </div>
        </aside>

        <main className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-2 overflow-hidden md:grid-rows-1 xl:col-span-1">
          <section className="flex min-h-0 flex-col rounded-[22px] border border-white/[0.06] bg-black">
            <EditorToolbar />
            <textarea
              value={editorValue}
              onChange={(event) => setEditorValue(event.target.value)}
              placeholder="Empieza a escribir..."
              className="min-h-0 flex-1 resize-none bg-transparent px-5 pb-5 pt-3 text-[15px] leading-7 text-white outline-none placeholder:text-[#687080] md:px-7 md:pb-7"
            />
          </section>

          <MobileNav onCreateTask={openCreateTask} />
        </main>

        <aside className="hidden min-h-0 flex-col gap-4 overflow-hidden xl:flex">
          <TaskPanel
            counts={counts}
            filter={filter}
            loading={loading}
            tasks={visibleTasks}
            onCreateTask={openCreateTask}
            onDeleteTask={deleteTask}
            onEditTask={openEditTask}
            onFilterChange={setFilter}
            onMarkCompleted={markCompleted}
            onOpenTask={setDetailTask}
          />
        </aside>
      </div>

      <div className="fixed inset-x-2 bottom-[74px] top-[52vh] z-20 flex xl:hidden">
        <TaskPanel
          compact
          counts={counts}
          filter={filter}
          loading={loading}
          tasks={visibleTasks}
          onCreateTask={openCreateTask}
          onDeleteTask={deleteTask}
          onEditTask={openEditTask}
          onFilterChange={setFilter}
          onMarkCompleted={markCompleted}
          onOpenTask={setDetailTask}
        />
      </div>

      <TaskForm
        editing={!!editingTask}
        form={form}
        open={formOpen}
        onChange={setForm}
        onClose={() => setFormOpen(false)}
        onSave={saveTask}
      />

      <TaskDetail
        task={detailTask}
        onClose={() => setDetailTask(null)}
        onDelete={deleteTask}
        onEdit={openEditTask}
        onMarkCompleted={markCompleted}
      />
    </div>
  )
}

function EditorToolbar() {
  const controls = [
    { label: "Negrita", icon: Bold },
    { label: "Cursiva", icon: Italic },
    { label: "Lista", icon: List },
    { label: "Lista numerada", icon: ListOrdered },
    { label: "Cita", icon: FileText },
  ]

  return (
    <div className="flex h-[50px] shrink-0 items-center gap-1.5 border-b border-white/[0.06] px-3 md:px-4">
      <button className="mr-1 flex h-9 w-[150px] items-center justify-between rounded-[12px] border border-white/[0.08] bg-[#050505] px-3 text-[13px] text-[#b8b8b8] transition-colors duration-150 hover:bg-[#181819] sm:w-[180px]">
        Texto
        <ChevronDown className="h-4 w-4 text-[#8a8a8a]" />
      </button>
      {controls.map((control) => (
        <button
          key={control.label}
          className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[#a0a0a0] transition-colors duration-150 hover:bg-[#181819] hover:text-white sm:h-9 sm:w-9"
          title={control.label}
        >
          <control.icon className="h-4 w-4" />
        </button>
      ))}
      <div className="ml-auto flex items-center gap-1">
        <button className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[#a0a0a0] transition-colors duration-150 hover:bg-[#181819] hover:text-white sm:h-9 sm:w-9" title="Documento">
          <FileText className="h-4 w-4" />
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[#a0a0a0] transition-colors duration-150 hover:bg-[#181819] hover:text-white sm:h-9 sm:w-9" title="Conexiones">
          <Link2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function TaskPanel({
  compact,
  counts,
  filter,
  loading,
  tasks,
  onCreateTask,
  onDeleteTask,
  onEditTask,
  onFilterChange,
  onMarkCompleted,
  onOpenTask,
}: {
  compact?: boolean
  counts: Record<TaskFilter, number>
  filter: TaskFilter
  loading: boolean
  tasks: Homework[]
  onCreateTask: () => void
  onDeleteTask: (id: string) => void
  onEditTask: (task: Homework) => void
  onFilterChange: (filter: TaskFilter) => void
  onMarkCompleted: (id: string) => void
  onOpenTask: (task: Homework) => void
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="flex h-10 shrink-0 items-center justify-between px-1">
        <h1 className="text-[23px] font-semibold tracking-[-0.01em] text-white">Tareas</h1>
        <div className="flex items-center gap-2">
          <FilterMenu counts={counts} filter={filter} onFilterChange={onFilterChange} />
          <button className="flex h-9 w-9 items-center justify-center rounded-[11px] border border-white/[0.06] bg-[#050505] text-[#b8b8b8] transition-colors duration-150 hover:bg-[#181819] hover:text-white" title="Favoritos">
            <Star className="h-4 w-4" />
          </button>
          <button onClick={onCreateTask} className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white text-black transition-transform duration-150 hover:scale-[1.03]" title="Crear tarea">
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className={cn("min-h-0 flex-1 overflow-hidden rounded-[23px] border border-white/[0.06] bg-black", compact && "shadow-2xl shadow-black/40")}>
        {loading ? (
          <div className="flex h-full items-center justify-center text-[13px] text-[#666666]">Cargando tareas...</div>
        ) : tasks.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="flex h-full flex-col items-center justify-center px-6 text-center">
            <ClipboardList className="mb-4 h-12 w-12 text-[#555555]" />
            <p className="mb-4 text-[14px] font-medium text-[#a8a8a8]">No hay tareas</p>
            <button onClick={onCreateTask} className="rounded-full bg-[#181819] px-4 py-2 text-[13px] font-medium text-[#b8b8b8] transition-colors duration-150 hover:bg-[#202021] hover:text-white">
              Crear tarea
            </button>
          </motion.div>
        ) : (
          <div className="h-full overflow-y-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="space-y-1.5">
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onDelete={() => onDeleteTask(task.id)}
                  onEdit={() => onEditTask(task)}
                  onMarkCompleted={() => onMarkCompleted(task.id)}
                  onOpen={() => onOpenTask(task)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function FilterMenu({
  counts,
  filter,
  onFilterChange,
}: {
  counts: Record<TaskFilter, number>
  filter: TaskFilter
  onFilterChange: (filter: TaskFilter) => void
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-[11px] border border-white/[0.06] bg-[#050505] text-[#b8b8b8] transition-colors duration-150 hover:bg-[#181819] hover:text-white"
        title="Filtros"
      >
        <Filter className="h-4 w-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 z-40 w-44 rounded-[14px] border border-white/[0.08] bg-[#050505] p-1.5"
          >
            {filters.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  onFilterChange(item.key)
                  setOpen(false)
                }}
                className={cn(
                  "flex h-9 w-full items-center justify-between rounded-[10px] px-2.5 text-[13px] transition-colors duration-150",
                  filter === item.key ? "bg-[#181819] text-white" : "text-[#8a8a8a] hover:bg-[#181819] hover:text-white",
                )}
              >
                {item.label}
                <span className="text-[11px] text-[#666666]">{counts[item.key]}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TaskRow({
  task,
  onDelete,
  onEdit,
  onMarkCompleted,
  onOpen,
}: {
  task: Homework
  onDelete: () => void
  onEdit: () => void
  onMarkCompleted: () => void
  onOpen: () => void
}) {
  const completed = task.status === "delivered" || task.status === "graded"

  return (
    <button onClick={onOpen} className="group w-full rounded-[14px] px-3 py-3 text-left transition-colors duration-150 hover:bg-[#111112]">
      <div className="flex items-start gap-3">
        <span
          onClick={(event) => {
            event.stopPropagation()
            onMarkCompleted()
          }}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-150",
            completed ? "border-white bg-white text-black" : "border-white/15 text-transparent hover:border-white/50",
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-[14px] font-medium text-white", completed && "text-[#777777] line-through")}>{task.title}</p>
          <div className="mt-1 flex items-center gap-2 text-[12px] text-[#666666]">
            <span className="truncate">{task.subject || "Sin curso"}</span>
            <span className="h-1 w-1 rounded-full bg-[#444444]" />
            <span>{formatDate(task.due_date)}</span>
          </div>
        </div>
        <div className="flex opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <span
            onClick={(event) => {
              event.stopPropagation()
              onEdit()
            }}
            className="flex h-7 w-7 items-center justify-center rounded-[9px] text-[#8a8a8a] hover:bg-[#181819] hover:text-white"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </span>
          <span
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
            }}
            className="flex h-7 w-7 items-center justify-center rounded-[9px] text-[#8a8a8a] hover:bg-[#181819] hover:text-white"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </button>
  )
}

function MobileNav({ onCreateTask }: { onCreateTask: () => void }) {
  return (
    <nav className="flex h-[62px] shrink-0 items-center justify-between rounded-[20px] border border-white/[0.06] bg-[#111112] px-2 md:hidden">
      {navItems.slice(0, 4).map((item) => (
        <Link key={item.title} href={item.href} className={cn("flex h-11 w-11 items-center justify-center rounded-[13px] text-[#8a8a8a]", item.active && "bg-[#050505] text-white")}>
          <item.icon className="h-5 w-5" />
        </Link>
      ))}
      <button onClick={onCreateTask} className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-white text-black">
        <Plus className="h-5 w-5" />
      </button>
    </nav>
  )
}

function TaskForm({
  editing,
  form,
  open,
  onChange,
  onClose,
  onSave,
}: {
  editing: boolean
  form: typeof emptyForm
  open: boolean
  onChange: (form: typeof emptyForm) => void
  onClose: () => void
  onSave: () => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="w-full max-w-[440px] rounded-[22px] border border-white/[0.08] bg-[#050505] p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-medium text-white">{editing ? "Editar tarea" : "Crear tarea"}</h2>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[#8a8a8a] hover:bg-[#181819] hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} placeholder="Nombre de la tarea" className="h-11 w-full rounded-[13px] border border-white/[0.08] bg-black px-3 text-[14px] text-white outline-none placeholder:text-[#666666]" />
              <input value={form.subject} onChange={(event) => onChange({ ...form, subject: event.target.value })} placeholder="Curso o categoria" className="h-11 w-full rounded-[13px] border border-white/[0.08] bg-black px-3 text-[14px] text-white outline-none placeholder:text-[#666666]" />
              <input type="date" value={form.due_date} onChange={(event) => onChange({ ...form, due_date: event.target.value })} className="h-11 w-full rounded-[13px] border border-white/[0.08] bg-black px-3 text-[14px] text-[#b8b8b8] outline-none" />
              <textarea value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} placeholder="Descripcion" className="h-24 w-full resize-none rounded-[13px] border border-white/[0.08] bg-black px-3 py-3 text-[14px] text-white outline-none placeholder:text-[#666666]" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={onClose} className="h-10 rounded-[12px] bg-[#111112] px-4 text-[13px] text-[#a8a8a8] hover:bg-[#181819]">Cancelar</button>
              <button onClick={onSave} disabled={!form.title.trim()} className="h-10 rounded-[12px] bg-white px-4 text-[13px] font-medium text-black disabled:opacity-40">
                {editing ? "Guardar" : "Crear tarea"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function TaskDetail({
  task,
  onClose,
  onDelete,
  onEdit,
  onMarkCompleted,
}: {
  task: Homework | null
  onClose: () => void
  onDelete: (id: string) => void
  onEdit: (task: Homework) => void
  onMarkCompleted: (id: string) => void
}) {
  return (
    <AnimatePresence>
      {task && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="w-full max-w-[500px] rounded-[22px] border border-white/[0.08] bg-[#050505] p-4">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-[17px] font-medium text-white">{task.title}</h2>
                <p className="mt-1 text-[13px] text-[#666666]">{task.subject || "Sin curso"} · {formatDate(task.due_date)}</p>
              </div>
              <button onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[#8a8a8a] hover:bg-[#181819] hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="min-h-24 rounded-[16px] border border-white/[0.06] bg-black p-3 text-[14px] leading-6 text-[#b8b8b8]">
              {task.description || "Sin descripcion."}
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button onClick={() => onMarkCompleted(task.id)} className="h-10 rounded-[12px] bg-[#111112] px-4 text-[13px] text-[#a8a8a8] hover:bg-[#181819]">Completar</button>
              <button onClick={() => onEdit(task)} className="h-10 rounded-[12px] bg-[#111112] px-4 text-[13px] text-[#a8a8a8] hover:bg-[#181819]">Editar</button>
              <button onClick={() => onDelete(task.id)} className="h-10 rounded-[12px] bg-white px-4 text-[13px] font-medium text-black">Eliminar</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function formatDate(value: string) {
  if (!value) return "Sin fecha"
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return "Sin fecha"
  return date.toLocaleDateString("es-PE", { day: "2-digit", month: "short" })
}
