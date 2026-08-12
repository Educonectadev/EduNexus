"use client"

import * as React from "react"
import { Plus, Minus, LayoutGrid, RefreshCw, CalendarDays } from "@/components/ui/proicons"
import { cn } from "@/lib/utils"
import { SbSectionHeader, SbModal, SbModalBody, SbModalHeader, SbBtn, SbInput } from "@/components/ui/sb"

interface VacancyStudent {
  name: string
  dni: string | null
  code: string | null
}

interface VacancyCell {
  id: string | null
  section: string
  capacity: number | null
  occupied: number
  available: number | null
  students: VacancyStudent[]
}

interface GradeRow {
  grade: string
  level: string
  sections: VacancyCell[]
}

interface VacanciesData {
  year: number
  grades: GradeRow[]
}

export default function VacantesPage() {
  const [data, setData] = React.useState<VacanciesData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [year, setYear] = React.useState(new Date().getFullYear())
  const [editing, setEditing] = React.useState<{ grade: string; section: string; capacity: number | null; id: string | null; occupied: number; available: number | null; students: VacancyStudent[] } | null>(null)
  const [capacityInput, setCapacityInput] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [toast, setToast] = React.useState<{ msg: string; ok: boolean } | null>(null)

  const fetchData = async (y: number = year) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/secretario/vacancies?year=${y}`)
      if (res.ok) setData(await res.json())
    } catch {} finally { setLoading(false) }
  }

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/secretario/vacancies?year=${year}`)
        if (!cancelled && res.ok) setData(await res.json())
      } catch {}
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [year])

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2500)
  }

  const openEdit = (cell: VacancyCell, grade: string) => {
    setEditing({ grade, section: cell.section, capacity: cell.capacity, id: cell.id, occupied: cell.occupied, available: cell.available, students: cell.students || [] })
    setCapacityInput(cell.capacity == null ? "" : String(cell.capacity))
  }

  const saveCapacity = async () => {
    if (!editing) return
    const capacity = parseInt(capacityInput, 10)
    if (isNaN(capacity) || capacity < 0) { showToast("Ingresa una capacidad válida", false); return }

    setSaving(true)
    try {
      const res = await fetch("/api/secretario/vacancies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: editing.grade, section: editing.section, year, capacity }),
      })
      if (res.ok) {
        showToast(`Vacantes de ${editing.grade} ${editing.section} actualizadas a ${capacity}`)
        setEditing(null)
        fetchData(year)
      } else {
        const err = await res.json()
        showToast(err.error || "Error al guardar", false)
      }
    } catch {
      showToast("Error de conexión", false)
    } finally { setSaving(false) }
  }

  const removeCapacity = async () => {
    if (!editing?.id) return
    setSaving(true)
    try {
      const res = await fetch(`/api/secretario/vacancies?id=${editing.id}`, { method: "DELETE" })
      if (res.ok) {
        showToast(`Vacantes de ${editing.grade} ${editing.section} eliminadas`)
        setEditing(null)
        fetchData(year)
      } else showToast("Error al eliminar", false)
    } catch { showToast("Error de conexión", false) }
    finally { setSaving(false) }
  }

  const allSections = data?.grades?.[0]?.sections.map(s => s.section) || []

  return (
    <div className="space-y-5">
      <SbSectionHeader
        title="Vacantes por Grado y Sección"
        description="Define cuántas vacantes tiene cada grado y sección. Las vacantes disponibles se calculan contra las matrículas activas del año."
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-sb-surface rounded-xl px-3 h-9 border border-sb-outline-variant/10">
              <CalendarDays className="h-3.5 w-3.5 text-sb-on-surface-variant/50" />
              <SbInput
                type="number"
                value={year}
                min={2020}
                max={2100}
                onChange={e => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                className="w-20 !bg-transparent !border-0 !h-8 !px-0"
              />
            </div>
            <SbBtn variant="outlined" rounded className="gap-1.5 text-xs h-9 px-3" onClick={() => fetchData()} disabled={loading}>
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Actualizar
            </SbBtn>
          </div>
        }
      />

      {/* Resumen global */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {[
            { label: "Grados", value: data.grades.length, color: "text-violet-600" },
            { label: "Secciones", value: allSections.length, color: "text-blue-600" },
            {
              label: "Vacantes configuradas",
              value: data.grades.reduce((a, g) => a + g.sections.filter(s => s.capacity != null).length, 0),
              color: "text-emerald-600",
            },
            {
              label: "Disponibles totales",
              value: data.grades.reduce((a, g) => a + g.sections.reduce((b, s) => b + (s.available ?? 0), 0), 0),
              color: "text-amber-600",
            },
          ].map(s => (
            <div key={s.label} className="bg-sb-surface rounded-xl p-3.5 border border-sb-outline-variant/8">
              <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
              <p className="text-[11px] text-sb-on-surface-variant/50 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-20 bg-sb-surface rounded-xl border border-sb-outline-variant/8">
          <div className="h-6 w-6 border-2 border-sb-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && data && data.grades.length === 0 && (
        <div className="bg-sb-surface rounded-xl border border-sb-outline-variant/8 py-16 text-center">
          <LayoutGrid className="h-9 w-9 mx-auto mb-3 text-sb-on-surface-variant/15" />
          <p className="text-sm font-medium text-sb-on-surface-variant/50">No hay grados ni secciones configuradas</p>
          <p className="text-xs text-sb-on-surface-variant/30 mt-1">Agrégalos en Gestión Académica</p>
        </div>
      )}

      {/* Matriz por grado */}
      {data && data.grades.length > 0 && (
        <div className="space-y-3">
          {data.grades.map((g, gi) => (
            <div key={gi} className="bg-sb-surface rounded-xl border border-sb-outline-variant/8 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-sb-outline-variant/8">
                <div>
                  <p className="text-sm font-semibold text-sb-on-surface">{g.grade}</p>
                  <p className="text-[11px] text-sb-on-surface-variant/40">{g.level || "—"}</p>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sb-surface-container-high text-sb-on-surface-variant/50">
                  {g.sections.filter(s => s.capacity != null).length}/{g.sections.length} secciones con vacantes
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2 p-3">
                {g.sections.map((cell, ci) => {
                  const hasCap = cell.capacity != null
                  const low = hasCap && cell.available != null && cell.available <= 2
                  const full = hasCap && cell.available === 0
                  return (
                    <button
                      key={ci}
                      onClick={() => openEdit(cell, g.grade)}
                      className={cn(
                        "rounded-xl p-3 border text-left transition-all hover:shadow-sm group",
                        hasCap
                          ? full ? "bg-red-500/[0.06] border-red-500/20"
                            : low ? "bg-amber-500/[0.06] border-amber-500/25"
                            : "bg-emerald-500/[0.04] border-emerald-500/20"
                          : "bg-sb-surface-container-low/60 border-sb-outline-variant/10 hover:border-sb-outline-variant/20"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[13px] font-bold text-sb-on-surface">Sección {cell.section}</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-sb-on-surface-variant/40">
                          <Plus className="h-3.5 w-3.5" />
                        </span>
                      </div>
                      {hasCap ? (
                        <>
                          <p className="text-lg font-bold text-sb-on-surface leading-none">
                            {cell.available}
                            <span className="text-[11px] font-medium text-sb-on-surface-variant/50 ml-1">disponibles</span>
                          </p>
                          <p className="text-[10px] text-sb-on-surface-variant/40 mt-1">
                            {cell.occupied} matriculados / {cell.capacity} vacantes
                          </p>
                        </>
                      ) : (
                        <p className="text-lg font-bold text-sb-on-surface-variant/30 leading-none">Sin límite</p>
                      )}
                      <p className="text-[9.5px] text-sb-on-surface-variant/30 mt-1">Toca para editar</p>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal editar capacidad */}
      <SbModal open={!!editing} onClose={() => setEditing(null)} maxWidth="380px">
        {editing && (
          <>
            <SbModalHeader title={`Vacantes · ${editing.grade} Sección ${editing.section}`} onClose={() => setEditing(null)} />
            <SbModalBody>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-sb-surface-container-high flex items-center justify-center">
                    <LayoutGrid className="h-4 w-4 text-sb-on-surface-variant/60" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-sb-on-surface-variant/60">Capacidad total de vacantes</p>
                    <p className="text-[10px] text-sb-on-surface-variant/40">Número máximo de alumnos en esta sección · año {year}</p>
                  </div>
                </div>
                <SbInput
                  type="number"
                  min={0}
                  value={capacityInput}
                  onChange={e => setCapacityInput(e.target.value)}
                  placeholder="Ej: 10"
                  className="!text-base !h-11 text-center font-semibold"
                />

                {/* Descomposición: cómo se usa la capacidad */}
                <div className="rounded-xl border border-sb-outline-variant/10 overflow-hidden">
                  <div className="grid grid-cols-3 text-center">
                    <div className="bg-sb-surface-container-low/60 py-2.5 border-r border-sb-outline-variant/10">
                      <p className="text-lg font-bold text-sb-on-surface">{editing.capacity ?? 0}</p>
                      <p className="text-[10px] text-sb-on-surface-variant/40">Capacidad</p>
                    </div>
                    <div className="bg-amber-500/[0.06] py-2.5 border-r border-sb-outline-variant/10">
                      <p className="text-lg font-bold text-amber-600">{editing.occupied}</p>
                      <p className="text-[10px] text-amber-600/70">Ocupados</p>
                    </div>
                    <div className="bg-emerald-500/[0.06] py-2.5">
                      <p className="text-lg font-bold text-emerald-600">{editing.capacity == null ? "—" : Math.max(0, editing.capacity - editing.occupied)}</p>
                      <p className="text-[10px] text-emerald-600/70">Disponibles</p>
                    </div>
                  </div>
                  <p className="text-center text-[10px] text-sb-on-surface-variant/40 py-2 bg-sb-surface-container-low/30">
                    {editing.capacity == null ? "Sin límite definido" : "Capacidad − Ocupados = Disponibles"}
                  </p>
                </div>

                {/* Alumnos matriculados */}
                {editing.occupied > 0 ? (
                  <div className="rounded-xl border border-sb-outline-variant/10 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-sb-surface-container-low/50 border-b border-sb-outline-variant/10">
                      <p className="text-[11px] font-semibold text-sb-on-surface-variant/60">
                        {editing.occupied} matriculado{editing.occupied === 1 ? "" : "s"} en esta sección
                      </p>
                      <span className="text-[9px] text-sb-on-surface-variant/30">matrículas activas {year}</span>
                    </div>
                    <div className="max-h-36 overflow-y-auto divide-y divide-sb-outline-variant/8">
                      {editing.students.map((st, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5">
                          <span className="h-4 w-4 rounded-full text-[9px] font-semibold flex items-center justify-center bg-sb-surface-container-high text-sb-on-surface-variant/50 shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-[11px] text-sb-on-surface truncate">{st.name}</span>
                          <span className="text-[9px] text-sb-on-surface-variant/30 ml-auto shrink-0">{st.dni || st.code || ""}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-sb-surface-container-low/40 border border-sb-outline-variant/10 px-3 py-2.5 text-center">
                    <p className="text-[11px] text-sb-on-surface-variant/50">Sin alumnos matriculados todavía</p>
                    <p className="text-[9.5px] text-sb-on-surface-variant/30 mt-0.5">
                      Por eso de {editing.capacity ?? 0} vacantes quedan {editing.capacity ?? 0} disponibles
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <SbBtn variant="filled" rounded className="flex-1 gap-2" onClick={saveCapacity} disabled={saving}>
                    <Plus className="h-4 w-4" /> {saving ? "Guardando..." : "Guardar vacantes"}
                  </SbBtn>
                  {editing.id && (
                    <SbBtn variant="danger" rounded className="gap-2" onClick={removeCapacity} disabled={saving}>
                      <Minus className="h-4 w-4" /> Quitar
                    </SbBtn>
                  )}
                </div>
              </div>
            </SbModalBody>
          </>
        )}
      </SbModal>

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg border",
          toast.ok ? "bg-emerald-600 text-white border-emerald-500" : "bg-red-600 text-white border-red-500"
        )}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}