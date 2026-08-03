"use client"

import * as React from "react"
import { Users, Building2, GraduationCap, UserCheck, Search, ChevronRight, Phone, Hash, Mail, BadgeCheck, BookOpen, X, Filter, Briefcase } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { SbBtn, SbInput, SbBadge } from "@/components/ui/sb"
import { cn } from "@/lib/utils"

interface StaffMember {
  id: string; email: string; full_name: string; role: string; dni: string; phone: string; subject: string; status: string; created_at: string
}

interface Student {
  id: string; code: string; first_name: string; last_name: string; document_number: string; grade: string; section: string; status: string; gender: string; birth_date: string
}

const sectionMeta = [
  { key: "director", label: "Dirección", icon: Building2, color: "bg-blue-500/10 text-blue-500", desc: "Directivos de la institución" },
  { key: "secretario", label: "Secretaría", icon: Users, color: "bg-purple-500/10 text-purple-500", desc: "Personal administrativo" },
  { key: "alumnos", label: "Alumnos", icon: GraduationCap, color: "bg-emerald-500/10 text-emerald-500", desc: "Estudiantes matriculados" },
  { key: "padre", label: "Apoderados", icon: UserCheck, color: "bg-amber-500/10 text-amber-500", desc: "Padres y apoderados" },
] as const

type SectionKey = (typeof sectionMeta)[number]["key"]

function initials(name: string): string {
  return name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"
}

const roleBadge: Record<string, { label: string; color: string }> = {
  director: { label: "Director", color: "bg-blue-500/10 text-blue-500" },
  secretario: { label: "Secretario", color: "bg-purple-500/10 text-purple-500" },
  docente: { label: "Docente", color: "bg-emerald-500/10 text-emerald-500" },
  padre: { label: "Apoderado", color: "bg-amber-500/10 text-amber-500" },
}

export default function PlantelPage() {
  const [staffGroups, setStaffGroups] = React.useState<Record<string, StaffMember[]>>({})
  const [students, setStudents] = React.useState<Student[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set())
  const [searchFocused, setSearchFocused] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    fetchData()
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); inputRef.current?.focus(); inputRef.current?.select() }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch("/api/director/plantel")
      if (res.ok) {
        const data = await res.json()
        setStaffGroups(data.staff || {})
        setStudents(data.students || [])
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const toggleCollapse = (key: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  const q = search.toLowerCase()

  const filteredDirector = (staffGroups.director || []).filter(m =>
    !q || m.full_name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.dni?.includes(q)
  )
  const filteredSecretario = (staffGroups.secretario || []).filter(m =>
    !q || m.full_name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.dni?.includes(q)
  )
  const filteredPadre = (staffGroups.padre || []).filter(m =>
    !q || m.full_name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.dni?.includes(q)
  )
  const filteredStudents = students.filter(s =>
    !q || s.first_name?.toLowerCase().includes(q) || s.last_name?.toLowerCase().includes(q) ||
    s.document_number?.includes(q) || s.grade?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q)
  )

  const counts = {
    director: staffGroups.director?.length || 0,
    secretario: staffGroups.secretario?.length || 0,
    alumnos: students.length,
    padre: staffGroups.padre?.length || 0,
  }

  const total = counts.director + counts.secretario + counts.alumnos + counts.padre
  const hasAnyData = total > 0
  const hasResults = filteredDirector.length + filteredSecretario.length + filteredStudents.length + filteredPadre.length > 0

  const sections: { key: SectionKey; items: any[]; renderItem: (item: any) => React.ReactNode; count: number }[] = [
    {
      key: "director",
      items: filteredDirector,
      count: counts.director,
      renderItem: (m: StaffMember) => (
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-blue-500/70" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-sb-on-surface truncate">{m.full_name}</p>
            <p className="text-xs text-sb-on-surface-variant/40 truncate flex items-center gap-2 mt-0.5">
              <Mail className="h-3 w-3 shrink-0" />{m.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "secretario",
      items: filteredSecretario,
      count: counts.secretario,
      renderItem: (m: StaffMember) => <MemberRow member={m} />,
    },
    {
      key: "alumnos",
      items: filteredStudents,
      count: counts.alumnos,
      renderItem: (s: Student) => (
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="h-10 w-10 rounded-xl bg-sb-surface-container-high flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-sb-on-surface-variant/60">
              {(s.first_name?.[0] || "") + (s.last_name?.[0] || "") || "?"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-sb-on-surface truncate">{s.first_name} {s.last_name}</p>
              <span className="text-[10px] text-sb-on-surface-variant/30 font-mono">#{s.code?.slice(-6) || "—"}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-sb-on-surface-variant/50 mt-0.5">
              <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{s.grade} {s.section}</span>
              <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{s.document_number || "—"}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "padre",
      items: filteredPadre,
      count: counts.padre,
      renderItem: (m: StaffMember) => <MemberRow member={m} />,
    },
  ]

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-[22px] font-bold tracking-tight text-sb-on-surface">Plantel</h1>
        <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">
          Directivos, secretaría, alumnos y apoderados
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {sectionMeta.map(({ key, label, icon: Icon, color }) => {
          const count = counts[key as SectionKey]
          return (
            <div key={key} className="bg-sb-surface rounded-xl p-3.5 border border-sb-outline-variant/8 hover:border-sb-outline-variant/15 transition-all">
              <div className="flex items-center justify-between mb-2.5">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", color)}>
                  <Icon className="h-4 w-4" />
                </div>
                {count > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                    {count}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-sb-on-surface-variant/50 font-medium">{label}</p>
            </div>
          )
        })}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/30" />
        <input
          ref={inputRef}
          placeholder="Buscar por nombre, DNI, email, grado..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className={cn(
            "w-full h-11 pl-11 pr-20 bg-sb-surface rounded-xl border text-sm text-sb-on-surface placeholder:text-sb-on-surface-variant/30 outline-none transition-all",
            searchFocused ? "border-sb-primary/30 ring-1 ring-sb-primary/10" : "border-sb-outline-variant/10"
          )}
        />
        {search && (
          <button onClick={() => setSearch("")}
            className="absolute right-12 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-sb-surface-container-high transition-colors">
            <X className="h-3.5 w-3.5 text-sb-on-surface-variant/30" />
          </button>
        )}
        {search && hasAnyData && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-sb-on-surface-variant/30 font-medium">
            {filteredDirector.length + filteredSecretario.length + filteredStudents.length + filteredPadre.length} de {total}
          </div>
        )}
        {!search && !searchFocused && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-sb-on-surface-variant/20">
            <kbd className="px-1.5 py-0.5 rounded bg-sb-surface-container-high text-sb-on-surface-variant/30 font-mono">⌘K</kbd>
          </div>
        )}
      </motion.div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 border-2 border-sb-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && !hasAnyData && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="py-16">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-sb-on-surface flex items-center justify-center shrink-0">
                <Users className="h-7 w-7 text-sb-surface" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-sb-on-surface">Tu plantel está vacío</h2>
                <p className="text-sm text-sb-on-surface-variant/50">Los miembros aparecerán cuando se registren</p>
              </div>
            </div>

            <div className="bg-sb-surface rounded-xl border border-sb-outline-variant/8 divide-y divide-sb-outline-variant/8">
              {[
                { icon: GraduationCap, title: "Alumnos matriculados", desc: "Aparecen aquí cuando el secretario completa una matrícula", color: "text-emerald-500" },
                { icon: Briefcase, title: "Personal contratado", desc: "Docentes y secretarios que crees desde la sección Personal", color: "text-purple-500" },
                { icon: UserCheck, title: "Apoderados vinculados", desc: "Padres registrados y vinculados a sus hijos estudiantes", color: "text-amber-500" },
              ].map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                  className="flex items-start gap-4 px-5 py-4">
                  <div className="h-9 w-9 rounded-lg bg-sb-surface-container-high flex items-center justify-center shrink-0 mt-0.5">
                    <f.icon className={cn("h-4 w-4", f.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-sb-on-surface">{f.title}</p>
                    <p className="text-xs text-sb-on-surface-variant/40 mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {!loading && hasAnyData && !hasResults && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <Search className="h-8 w-8 mx-auto mb-3 text-sb-on-surface-variant/15" />
          <p className="text-sm font-medium text-sb-on-surface-variant/50">Sin resultados para &ldquo;{search}&rdquo;</p>
        </motion.div>
      )}

      {!loading && hasResults && (
        <div className="space-y-3">
          {sections.map(({ key, items, renderItem }) => {
            if (items.length === 0) return null
            const meta = sectionMeta.find(s => s.key === key)!
            const isCollapsed = collapsed.has(key)
            const Icon = meta.icon

            return (
              <motion.section key={key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <button onClick={() => toggleCollapse(key)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 group hover:bg-sb-surface-container-high/30 rounded-xl transition-colors">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", meta.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-sm font-semibold text-sb-on-surface">{meta.label}</h3>
                  </div>
                  <span className="text-[11px] text-sb-on-surface-variant/40 font-medium tabular-nums">{items.length}</span>
                  <ChevronRight className={cn("h-4 w-4 text-sb-on-surface-variant/20 transition-transform duration-200", !isCollapsed && "rotate-90")} />
                </button>

                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden">
                      <div className="bg-sb-surface rounded-xl border border-sb-outline-variant/8 divide-y divide-sb-outline-variant/8 mt-1.5">
                        {(items as any[]).map((item, i) => (
                          <div key={item.id || i}
                            className="flex items-center justify-between px-4 py-3 hover:bg-sb-surface-container-high/30 transition-colors">
                            {renderItem(item)}
                            <div className="shrink-0 ml-3">
                              <StatusBadge status={item.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MemberRow({ member }: { member: StaffMember }) {
  const badge = roleBadge[member.role as keyof typeof roleBadge] || { label: member.role, color: "bg-sb-surface-container-high text-sb-on-surface-variant/50" }
  return (
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div className="h-9 w-9 rounded-xl bg-sb-surface-container-high flex items-center justify-center shrink-0">
        <span className="text-[11px] font-semibold text-sb-on-surface-variant/50">{initials(member.full_name)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-sb-on-surface truncate">{member.full_name}</p>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${badge.color}`}>{badge.label}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-sb-on-surface-variant/40 mt-0.5 flex-wrap">
          <span className="flex items-center gap-1"><Mail className="h-3 w-3 shrink-0" />{member.email}</span>
          {member.dni && <span className="flex items-center gap-1"><Hash className="h-3 w-3 shrink-0" />{member.dni}</span>}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active"
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium",
      isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-sb-surface-container-high text-sb-on-surface-variant/30"
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-sb-on-surface-variant/20")} />
      {isActive ? "Activo" : "Inactivo"}
    </span>
  )
}
