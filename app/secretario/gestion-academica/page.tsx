"use client"

import * as React from "react"
import { GraduationCap, Layers, Plus, Pencil, Trash2, ChevronDown, Sparkles, BookOpen, School } from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import { SbBtn, SbModal, SbModalBody, SbModalHeader, SbModalFooter, useToast } from "@/components/ui/sb"

interface Grade { id: string; name: string; level: string; year_number: number; sort_order: number; is_active: number }
interface Section { id: string; name: string; sort_order: number; is_active: number }

const LEVELS = ["Inicial", "Primaria", "Secundaria"]
const LEVEL_COLORS: Record<string, string> = { Inicial: "bg-orange-500/8 text-orange-600", Primaria: "bg-blue-500/8 text-blue-600", Secundaria: "bg-violet-500/8 text-violet-600" }
const LEVEL_ICONS: Record<string, typeof School> = { Inicial: School, Primaria: BookOpen, Secundaria: GraduationCap }

const staggerItem = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }
const listItem = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 260, damping: 24 } },
  exit: { opacity: 0, x: -18, filter: "blur(6px)", transition: { duration: 0.18 } },
}

export default function GestionAcademicaPage() {
  const [grades, setGrades] = React.useState<Grade[]>([])
  const [sections, setSections] = React.useState<Section[]>([])
  const [institutionLevels, setInstitutionLevels] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<"grades" | "sections">("grades")
  const [activeLevel, setActiveLevel] = React.useState<string>("")
  const { toast } = useToast()

  const [addOpen, setAddOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [generateOpen, setGenerateOpen] = React.useState(false)

  const [newGradeLevel, setNewGradeLevel] = React.useState("Primaria")
  const [newGradeYear, setNewGradeYear] = React.useState(1)
  const [editName, setEditName] = React.useState("")
  const [generateCount, setGenerateCount] = React.useState(6)
  const [generateLevel, setGenerateLevel] = React.useState("Primaria")
  const [selectedItem, setSelectedItem] = React.useState<Grade | Section | null>(null)
  const [saving, setSaving] = React.useState(false)

  const fetchAll = async () => {
    try {
      const [gRes, sRes, iRes] = await Promise.all([
        fetch('/api/secretario/academic-grades'), fetch('/api/secretario/academic-sections'), fetch('/api/secretario/academic-levels'),
      ])
      if (gRes.ok) setGrades(await gRes.json())
      if (sRes.ok) setSections(await sRes.json())
      if (iRes.ok) { const data = await iRes.json(); const levels = data.levels || LEVELS; setInstitutionLevels(levels); setActiveLevel(prev => prev || levels[0] || "") }
      else { setInstitutionLevels(LEVELS); setActiveLevel(prev => prev || LEVELS[0] || "") }
    } catch {} finally { setLoading(false) }
  }

  React.useEffect(() => { const t = setTimeout(fetchAll, 0); return () => clearTimeout(t) }, [])

  const handleAddGrade = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/secretario/academic-grades', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: newGradeLevel, year_number: newGradeYear }),
      })
      if (res.ok) { const data = await res.json(); setGrades(prev => [...prev, data].sort((a, b) => a.sort_order - b.sort_order)); setAddOpen(false); toast(`${data.name} agregado`, "success") }
      else { const data = await res.json(); toast(data.error || "Error", "error") }
    } catch { toast("Error de conexión", "error") } finally { setSaving(false) }
  }

  const handleGenerateGrades = async () => {
    setSaving(true)
    const maxYear = generateLevel === "Inicial" ? 3 : generateLevel === "Primaria" ? 6 : 5
    const years = Array.from({ length: Math.min(generateCount, maxYear) }, (_, i) => i + 1)
    let created = 0
    let errors: string[] = []
    for (const year of years) {
      try {
        const res = await fetch('/api/secretario/academic-grades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ level: generateLevel, year_number: year }) })
        if (res.ok) { created++ }
        else { const d = await res.json(); errors.push(`${year}°: ${d.error || res.statusText}`) }
      } catch (e: any) { errors.push(`${year}°: ${e?.message || 'Error de conexión'}`) }
    }
    setGenerateOpen(false)
    if (created > 0) toast(`${created} grados generados para ${generateLevel}`, "success")
    if (errors.length > 0) toast(errors.join("; "), "error")
    fetchAll(); setSaving(false)
  }

  const handleEdit = async () => {
    if (!selectedItem || !editName.trim()) return
    setSaving(true)
    try {
      const endpoint = activeTab === "grades" ? '/api/secretario/academic-grades' : '/api/secretario/academic-sections'
      const res = await fetch(`${endpoint}?id=${selectedItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editName.trim() }) })
      if (res.ok) {
        const updater = (prev: any[]) => prev.map(i => i.id === selectedItem.id ? { ...i, name: editName.trim() } : i)
        if (activeTab === "grades") setGrades(updater); else setSections(updater)
        setEditOpen(false); setSelectedItem(null); toast("Actualizado", "success")
      } else { const data = await res.json(); toast(data.error || "Error", "error") }
    } catch { toast("Error de conexión", "error") } finally { setSaving(false) }
  }

  const handleToggleActive = async (item: Grade | Section) => {
    const endpoint = activeTab === "grades" ? '/api/secretario/academic-grades' : '/api/secretario/academic-sections'
    const newActive = item.is_active ? 0 : 1
    const res = await fetch(`${endpoint}?id=${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: newActive }) })
    if (res.ok) {
      if (activeTab === "grades") setGrades((prev: Grade[]) => prev.map(i => i.id === item.id ? { ...i, is_active: newActive } as Grade : i))
      else setSections((prev: Section[]) => prev.map(i => i.id === item.id ? { ...i, is_active: newActive } as Section : i))
    }
  }

  const handleMove = async (item: Grade | Section, direction: "up" | "down") => {
    const list = activeTab === "grades" ? grades : sections
    const idx = list.findIndex(i => i.id === item.id)
    if (direction === "up" && idx === 0) return
    if (direction === "down" && idx === list.length - 1) return
    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    const items = [...list]; [items[idx], items[swapIdx]] = [items[swapIdx], items[idx]]
    items.forEach((item, i) => item.sort_order = i)
    const endpoint = activeTab === "grades" ? '/api/secretario/academic-grades' : '/api/secretario/academic-sections'
    await Promise.all(items.map(item => fetch(`${endpoint}?id=${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: item.sort_order }) })))
    if (activeTab === "grades") setGrades(items as Grade[]); else setSections(items as Section[])
  }

  const handleDelete = async () => {
    if (!selectedItem) return
    setSaving(true)
    try {
      const endpoint = activeTab === "grades" ? '/api/secretario/academic-grades' : '/api/secretario/academic-sections'
      const res = await fetch(`${endpoint}?id=${selectedItem.id}`, { method: 'DELETE' })
      if (res.ok) {
        const filterFn = (prev: any[]) => prev.filter(i => i.id !== selectedItem.id)
        if (activeTab === "grades") setGrades(filterFn); else setSections(filterFn)
        setDeleteOpen(false); setSelectedItem(null); toast("Eliminado", "success")
      } else { const data = await res.json(); toast(data.error || "Error", "error") }
    } catch { toast("Error de conexión", "error") } finally { setSaving(false) }
  }

  const handleGenerateSections = async () => {
    setSaving(true)
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
    let created = 0
    for (const letter of letters.slice(0, generateCount)) {
      try { const res = await fetch('/api/secretario/academic-sections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: letter }) }); if (res.ok) created++ } catch {}
    }
    setGenerateOpen(false); toast(`${created} secciones (A-${letters[generateCount - 1]}) generadas`, "success"); fetchAll(); setSaving(false)
  }

  const generateName = (level: string, year: number) => {
    const suffixes: Record<string, string> = { Inicial: 'de Inicial', Primaria: 'de Primaria', Secundaria: 'de Secundaria' }
    const yearMap: Record<number, string> = { 1: '1°', 2: '2°', 3: '3°', 4: '4°', 5: '5°', 6: '6°' }
    return `${yearMap[year] || year} ${suffixes[level] || level}`
  }

  const getMaxYear = (level: string) => level === "Inicial" ? 3 : level === "Primaria" ? 6 : 5
  const filteredGrades = activeTab === "grades" && activeLevel ? grades.filter(g => g.level === activeLevel) : []

  return (
    <div className="space-y-5">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Gestión Académica</h1>
            <p className="text-sm text-sb-on-surface-variant/50 mt-1">Administra grados y secciones de la institución</p>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === "grades" ? (
              <>
                <SbBtn rounded onClick={() => { setGenerateLevel(institutionLevels[0] || "Primaria"); setGenerateCount(6); setGenerateOpen(true) }} className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" /> Generar grados
                </SbBtn>
                <SbBtn variant="filled" rounded onClick={() => { setNewGradeLevel(institutionLevels[0] || "Primaria"); setNewGradeYear(1); setAddOpen(true) }} className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" /> Agregar grado
                </SbBtn>
              </>
            ) : (
              <>
                <SbBtn rounded onClick={() => { setGenerateCount(6); setGenerateOpen(true) }} className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" /> Generar A-Z
                </SbBtn>
                <SbBtn variant="filled" rounded onClick={() => setAddOpen(true)} className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" /> Agregar sección
                </SbBtn>
              </>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
          <div className="flex gap-1 p-1 bg-sb-surface rounded-xl w-fit">
            <button onClick={() => setActiveTab("grades")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === "grades" ? "bg-sb-on-surface text-sb-surface" : "text-sb-on-surface-variant/60 hover:bg-sb-surface-container"}`}>
              <GraduationCap className="h-3.5 w-3.5" /> Grados <span className="text-[10px] opacity-60">{grades.length}</span>
            </button>
            <button onClick={() => setActiveTab("sections")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === "sections" ? "bg-sb-on-surface text-sb-surface" : "text-sb-on-surface-variant/60 hover:bg-sb-surface-container"}`}>
              <Layers className="h-3.5 w-3.5" /> Secciones <span className="text-[10px] opacity-60">{sections.length}</span>
            </button>
          </div>
        </motion.div>

        {/* Level Filters */}
        {activeTab === "grades" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-1.5 overflow-x-auto pb-1 mb-6">
            {institutionLevels.map(level => {
              const count = grades.filter(g => g.level === level).length
              return (
                <button key={level} onClick={() => setActiveLevel(level)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${activeLevel === level ? "bg-sb-on-surface text-sb-surface" : "bg-sb-surface text-sb-on-surface-variant/60 hover:bg-sb-surface-container"}`}>
                  {level}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeLevel === level ? "bg-white/20" : "bg-sb-surface-container"}`}>{count}</span>
                </button>
              )
            })}
          </motion.div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-sb-surface rounded-xl animate-pulse" />)}
          </div>
        ) : activeTab === "grades" ? (
          filteredGrades.length === 0 ? (
            <div className="bg-sb-surface rounded-2xl py-16 text-center">
              <GraduationCap className="h-12 w-12 mx-auto mb-3 text-sb-on-surface-variant/10" />
              <p className="text-sm font-medium text-sb-on-surface-variant/40">No hay grados para {activeLevel}</p>
              <p className="text-xs text-sb-on-surface-variant/25 mt-1">Agrega el primero o usa «Generar grados»</p>
            </div>
          ) : (
            <motion.div key={activeLevel} initial="hidden" animate="show" variants={container} className="space-y-1.5">
              <AnimatePresence>
                {filteredGrades.map((item, i) => {
                  const LevelIcon = LEVEL_ICONS[item.level] || GraduationCap
                  return (
                    <motion.div key={item.id} variants={listItem} exit="exit" layout
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${item.is_active ? "bg-sb-surface" : "bg-sb-surface/50"}`}>
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => handleMove(item, "up")} disabled={i === 0} className="text-sb-on-surface-variant/20 hover:text-sb-on-surface-variant/60 disabled:opacity-20"><ChevronDown className="h-3 w-3 rotate-180" /></button>
                        <button onClick={() => handleMove(item, "down")} disabled={i === filteredGrades.length - 1} className="text-sb-on-surface-variant/20 hover:text-sb-on-surface-variant/60 disabled:opacity-20"><ChevronDown className="h-3 w-3" /></button>
                      </div>
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${LEVEL_COLORS[item.level] || "bg-sb-surface-container"}`}>
                        <LevelIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium ${item.is_active ? "text-sb-on-surface" : "text-sb-on-surface-variant/50"}`}>{item.name}</span>
                        <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${LEVEL_COLORS[item.level] || ""}`}>Año {item.year_number}</span>
                      </div>
                      <button onClick={() => handleToggleActive(item)} className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all ${item.is_active ? "bg-emerald-500/8 text-emerald-600" : "bg-sb-surface-container text-sb-on-surface-variant/40"}`}>
                        {item.is_active ? "Activo" : "Inactivo"}
                      </button>
                      <button onClick={() => { setSelectedItem(item); setEditName(item.name); setEditOpen(true) }} className="h-8 w-8 flex items-center justify-center rounded-lg text-sb-on-surface-variant/40 hover:text-sb-on-surface hover:bg-sb-surface-container transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { setSelectedItem(item); setDeleteOpen(true) }} className="h-8 w-8 flex items-center justify-center rounded-lg text-sb-on-surface-variant/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          )
        ) : (
          sections.length === 0 ? (
            <div className="bg-sb-surface rounded-2xl py-16 text-center">
              <Layers className="h-12 w-12 mx-auto mb-3 text-sb-on-surface-variant/10" />
              <p className="text-sm font-medium text-sb-on-surface-variant/40">No hay secciones configuradas</p>
              <p className="text-xs text-sb-on-surface-variant/25 mt-1">Usa «Generar A-Z» para crearlas</p>
            </div>
          ) : (
            <motion.div initial="hidden" animate="show" variants={container} className="space-y-1.5">
              <div className="flex flex-wrap gap-2 mb-4">
                {sections.filter(s => s.is_active).map(s => (
                  <span key={s.id} className="h-10 w-10 rounded-xl bg-sb-on-surface/8 text-sb-on-surface flex items-center justify-center text-sm font-bold">{s.name}</span>
                ))}
              </div>
              <AnimatePresence>
                {sections.map((item, i) => (
                  <motion.div key={item.id} variants={listItem} exit="exit" layout
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${item.is_active ? "bg-sb-surface" : "bg-sb-surface/50"}`}>
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => handleMove(item, "up")} disabled={i === 0} className="text-sb-on-surface-variant/20 hover:text-sb-on-surface-variant/60 disabled:opacity-20"><ChevronDown className="h-3 w-3 rotate-180" /></button>
                      <button onClick={() => handleMove(item, "down")} disabled={i === sections.length - 1} className="text-sb-on-surface-variant/20 hover:text-sb-on-surface-variant/60 disabled:opacity-20"><ChevronDown className="h-3 w-3" /></button>
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-sb-on-surface/8 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-sb-on-surface">{item.name}</span>
                    </div>
                    <div className="flex-1">
                      <span className={`text-sm font-medium ${item.is_active ? "text-sb-on-surface" : "text-sb-on-surface-variant/50"}`}>Sección {item.name}</span>
                    </div>
                    <button onClick={() => handleToggleActive(item)} className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all ${item.is_active ? "bg-emerald-500/8 text-emerald-600" : "bg-sb-surface-container text-sb-on-surface-variant/40"}`}>
                      {item.is_active ? "Activo" : "Inactivo"}
                    </button>
                    <button onClick={() => { setSelectedItem(item); setEditName(item.name); setEditOpen(true) }} className="h-8 w-8 flex items-center justify-center rounded-lg text-sb-on-surface-variant/40 hover:text-sb-on-surface hover:bg-sb-surface-container transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { setSelectedItem(item); setDeleteOpen(true) }} className="h-8 w-8 flex items-center justify-center rounded-lg text-sb-on-surface-variant/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )
        )}

      {/* Add Grade Modal */}
      <SbModal open={addOpen && activeTab === "grades"} onClose={() => setAddOpen(false)} maxWidth="420px">
        <SbModalHeader title="Nuevo grado" onClose={() => setAddOpen(false)} />
        <SbModalBody>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2 block">Nivel</label>
              <div className="flex gap-1.5">
                {institutionLevels.map(level => (
                  <button key={level} onClick={() => { setNewGradeLevel(level); setNewGradeYear(1) }} className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${newGradeLevel === level ? "bg-sb-on-surface text-sb-surface" : "bg-sb-surface-container text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high"}`}>{level}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2 block">Año</label>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: getMaxYear(newGradeLevel) }, (_, i) => i + 1).map(year => (
                  <button key={year} onClick={() => setNewGradeYear(year)} className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${newGradeYear === year ? "bg-sb-on-surface text-sb-surface" : "bg-sb-surface-container text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high"}`}>{year}°</button>
                ))}
              </div>
            </div>
            <div className="bg-sb-surface-container/50 rounded-xl p-3">
              <p className="text-[10px] text-sb-on-surface-variant/40">Vista previa</p>
              <p className="text-base font-semibold text-sb-on-surface mt-1">{generateName(newGradeLevel, newGradeYear)}</p>
            </div>
          </motion.div>
        </SbModalBody>
        <SbModalFooter>
          <SbBtn rounded onClick={() => setAddOpen(false)}>Cancelar</SbBtn>
          <SbBtn variant="filled" rounded onClick={handleAddGrade} disabled={saving}>{saving ? "Guardando..." : "Agregar"}</SbBtn>
        </SbModalFooter>
      </SbModal>

      {/* Add Section Modal */}
      <SbModal open={addOpen && activeTab === "sections"} onClose={() => setAddOpen(false)} maxWidth="400px">
        <SbModalHeader title="Nueva sección" onClose={() => setAddOpen(false)} />
        <SbModalBody>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2 block">Nombre de la sección</label>
            <input placeholder="Ej: A, B, C..." value={editName} onChange={e => setEditName(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && handleEdit()} autoFocus className="sb-input rounded-xl text-sm h-10 w-full" />
            <p className="text-[10px] text-sb-on-surface-variant/30 mt-1.5">Usa una letra del abecedario (A-Z)</p>
          </motion.div>
        </SbModalBody>
        <SbModalFooter>
          <SbBtn rounded onClick={() => setAddOpen(false)}>Cancelar</SbBtn>
          <SbBtn variant="filled" rounded onClick={async () => { if (!editName.trim()) return; setSaving(true); const res = await fetch('/api/secretario/academic-sections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editName.trim().toUpperCase() }) }); if (res.ok) { setAddOpen(false); setEditName(""); fetchAll(); toast("Sección agregada", "success") } else { const d = await res.json(); toast(d.error || "Error", "error") }; setSaving(false) }} disabled={saving || !editName.trim()}>{saving ? "Guardando..." : "Agregar"}</SbBtn>
        </SbModalFooter>
      </SbModal>

      {/* Generate Grades Modal */}
      <SbModal open={generateOpen && activeTab === "grades"} onClose={() => setGenerateOpen(false)} maxWidth="420px">
        <SbModalHeader title="Generar grados" onClose={() => setGenerateOpen(false)} />
        <SbModalBody>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <p className="text-sm text-sb-on-surface-variant/60">Selecciona el nivel y la cantidad de años a generar.</p>
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2 block">Nivel</label>
              <div className="flex gap-1.5">
                {institutionLevels.map(level => (
                  <button key={level} onClick={() => { setGenerateLevel(level); setGenerateCount(getMaxYear(level)) }} className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${generateLevel === level ? "bg-sb-on-surface text-sb-surface" : "bg-sb-surface-container text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high"}`}>{level}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2 block">Cantidad de años</label>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: getMaxYear(generateLevel) }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => setGenerateCount(n)} className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${generateCount === n ? "bg-sb-on-surface text-sb-surface" : "bg-sb-surface-container text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high"}`}>{n} {n === 1 ? "año" : "años"}</button>
                ))}
              </div>
            </div>
            <div className="bg-sb-surface-container/50 rounded-xl p-3">
              <p className="text-[10px] text-sb-on-surface-variant/40 mb-1.5">Se generarán:</p>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: Math.min(generateCount, getMaxYear(generateLevel)) }, (_, i) => i + 1).map(year => (
                  <span key={year} className="text-[11px] px-2 py-0.5 rounded-full bg-sb-on-surface/8 text-sb-on-surface">{generateName(generateLevel, year)}</span>
                ))}
              </div>
            </div>
          </motion.div>
        </SbModalBody>
        <SbModalFooter>
          <SbBtn rounded onClick={() => setGenerateOpen(false)}>Cancelar</SbBtn>
          <SbBtn variant="filled" rounded onClick={handleGenerateGrades} disabled={saving}>{saving ? "Generando..." : "Generar"}</SbBtn>
        </SbModalFooter>
      </SbModal>

      {/* Generate Sections Modal */}
      <SbModal open={generateOpen && activeTab === "sections"} onClose={() => setGenerateOpen(false)} maxWidth="420px">
        <SbModalHeader title="Generar secciones A-Z" onClose={() => setGenerateOpen(false)} />
        <SbModalBody>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <p className="text-sm text-sb-on-surface-variant/60">Se generarán secciones con letras del abecedario.</p>
            <div>
              <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2 block">Cantidad de secciones</label>
              <div className="flex flex-wrap gap-1.5">
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <button key={n} onClick={() => setGenerateCount(n)} className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${generateCount === n ? "bg-sb-on-surface text-sb-surface" : "bg-sb-surface-container text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high"}`}>A-{String.fromCharCode(64 + n)}</button>
                ))}
              </div>
            </div>
            <div className="bg-sb-surface-container/50 rounded-xl p-3">
              <p className="text-[10px] text-sb-on-surface-variant/40">Se generarán:</p>
              <p className="text-base font-semibold text-sb-on-surface mt-1">{Array.from({ length: generateCount }, (_, i) => String.fromCharCode(65 + i)).join(", ")}</p>
            </div>
          </motion.div>
        </SbModalBody>
        <SbModalFooter>
          <SbBtn rounded onClick={() => setGenerateOpen(false)}>Cancelar</SbBtn>
          <SbBtn variant="filled" rounded onClick={handleGenerateSections} disabled={saving}>{saving ? "Generando..." : "Generar"}</SbBtn>
        </SbModalFooter>
      </SbModal>

      {/* Edit Modal */}
      <SbModal open={editOpen} onClose={() => setEditOpen(false)} maxWidth="400px">
        <SbModalHeader title={`Editar ${activeTab === "grades" ? "grado" : "sección"}`} onClose={() => setEditOpen(false)} />
        <SbModalBody>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2 block">Nombre</label>
            <input value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleEdit()} autoFocus className="sb-input rounded-xl text-sm h-10 w-full" />
          </motion.div>
        </SbModalBody>
        <SbModalFooter>
          <SbBtn rounded onClick={() => setEditOpen(false)}>Cancelar</SbBtn>
          <SbBtn variant="filled" rounded onClick={handleEdit} disabled={saving || !editName.trim()}>{saving ? "Guardando..." : "Guardar"}</SbBtn>
        </SbModalFooter>
      </SbModal>

      {/* Delete Modal */}
      <SbModal open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="380px">
        <SbModalBody>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center"><Trash2 className="h-6 w-6 text-red-500" /></div>
              <div>
                <p className="text-lg font-semibold text-sb-on-surface">Eliminar</p>
                <p className="text-xs text-sb-on-surface-variant/50">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <div className="bg-sb-surface-container/50 rounded-xl p-4">
              <p className="text-sm text-sb-on-surface">Se eliminará <strong>{selectedItem?.name}</strong> de la lista de {activeTab === "grades" ? "grados" : "secciones"}.</p>
            </div>
          </motion.div>
        </SbModalBody>
        <SbModalFooter>
          <SbBtn rounded onClick={() => setDeleteOpen(false)}>Cancelar</SbBtn>
          <SbBtn variant="danger" rounded onClick={handleDelete} disabled={saving}>{saving ? "Eliminando..." : "Eliminar"}</SbBtn>
        </SbModalFooter>
      </SbModal>
    </div>
  )
}
