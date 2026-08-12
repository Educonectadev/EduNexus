"use client"

import * as React from "react"
import { CalendarDays, RefreshCw, Check, X, ArrowLeftRight, Users, Loader2 } from "@/components/ui/proicons"
import { cn } from "@/lib/utils"
import { SbSectionHeader, SbBtn, SbSelect, SbModal, SbModalHeader, SbModalBody, SbBadge, SbEmpty } from "@/components/ui/sb"

interface Course {
  id: string
  name: string
  grade: string
  section: string
  teacher_id: string | null
  teacher_name: string
  student_count: number
}

interface Substitution {
  id: string
  course_id: string
  course_name: string
  grade: string
  section: string
  original_teacher_name: string
  substitute_teacher_name: string
  notes: string
  status: string
}

interface Teacher {
  id: string
  full_name: string
  role: string
  status: string
}

export default function SustitucionesPage() {
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10))
  const [courses, setCourses] = React.useState<Course[]>([])
  const [substitutions, setSubstitutions] = React.useState<Substitution[]>([])
  const [teachers, setTeachers] = React.useState<Teacher[]>([])
  const [loading, setLoading] = React.useState(true)
  const [savingCourseId, setSavingCourseId] = React.useState<string | null>(null)
  const [assignFor, setAssignFor] = React.useState<{ course: Course; teacherId: string; notes: string } | null>(null)
  const [toast, setToast] = React.useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2600)
  }

  const loadAll = async () => {
    setLoading(true)
    try {
      const [cRes, sRes, tRes] = await Promise.all([
        fetch("/api/secretario/cursos"),
        fetch(`/api/secretario/teacher-substitutions?date=${date}`),
        fetch("/api/secretario/personal"),
      ])
      if (cRes.ok) setCourses(await cRes.json())
      if (sRes.ok) {
        const sData = await sRes.json()
        setSubstitutions(sData.substitutions || [])
      }
      if (tRes.ok) {
        const all = await tRes.json()
        setTeachers((all as Teacher[]).filter(t => t.role === "docente" && t.status === "active"))
      }
    } catch {} finally { setLoading(false) }
  }

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [cRes, sRes, tRes] = await Promise.all([
          fetch("/api/secretario/cursos"),
          fetch(`/api/secretario/teacher-substitutions?date=${date}`),
          fetch("/api/secretario/personal"),
        ])
        if (cancelled) return
        if (cRes.ok) setCourses(await cRes.json())
        if (sRes.ok) {
          const sData = await sRes.json()
          setSubstitutions(sData.substitutions || [])
        }
        if (tRes.ok) {
          const all = await tRes.json()
          setTeachers((all as Teacher[]).filter(t => t.role === "docente" && t.status === "active"))
        }
      } catch {}
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [date])

  const subByCourse = React.useMemo(() => {
    const map: Record<string, Substitution> = {}
    for (const s of substitutions) if (s.status === "active") map[s.course_id] = s
    return map
  }, [substitutions])

  const saveSubstitution = async () => {
    if (!assignFor) return
    if (!assignFor.teacherId) { showToast("Selecciona el docente que sustituye", false); return }
    setSavingCourseId(assignFor.course.id)
    try {
      const res = await fetch("/api/secretario/teacher-substitutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: assignFor.course.id,
          date,
          substitute_teacher_id: assignFor.teacherId,
          notes: assignFor.notes,
        }),
      })
      if (res.ok) {
        showToast(`Sustitución guardada para "${assignFor.course.name}"`)
        setAssignFor(null)
        loadAll()
      } else {
        const err = await res.json()
        showToast(err.error || "Error al guardar", false)
      }
    } catch { showToast("Error de conexión", false) }
    finally { setSavingCourseId(null) }
  }

  const cancelSubstitution = async (id: string, courseName: string) => {
    try {
      const res = await fetch(`/api/secretario/teacher-substitutions?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        showToast(`Sustitución cancelada en "${courseName}"`)
        loadAll()
      } else showToast("Error al cancelar", false)
    } catch { showToast("Error de conexión", false) }
  }

  const activeSubs = substitutions.filter(s => s.status === "active")

  return (
    <div className="space-y-5">
      <SbSectionHeader
        title="Sustitución de Docentes"
        description="Cuando un docente falta, asigna un sustituto temporal por curso y fecha sin modificar la asignación original."
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-sb-surface rounded-xl px-3 h-9 border border-sb-outline-variant/10">
              <CalendarDays className="h-3.5 w-3.5 text-sb-on-surface-variant/50" />
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="bg-transparent text-xs font-medium text-sb-on-surface outline-none"
              />
            </div>
            <SbBtn variant="outlined" rounded className="gap-1.5 text-xs h-9 px-3" onClick={loadAll} disabled={loading}>
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Actualizar
            </SbBtn>
          </div>
        }
      />

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        <div className="bg-sb-surface rounded-xl p-3.5 border border-sb-outline-variant/8">
          <p className="text-xl font-bold text-sb-on-surface">{courses.length}</p>
          <p className="text-[11px] text-sb-on-surface-variant/50 mt-0.5">Cursos activos</p>
        </div>
        <div className="bg-sb-surface rounded-xl p-3.5 border border-sb-outline-variant/8">
          <p className="text-xl font-bold text-emerald-600">{activeSubs.length}</p>
          <p className="text-[11px] text-sb-on-surface-variant/50 mt-0.5">Sustituciones activas el {date}</p>
        </div>
        <div className="bg-sb-surface rounded-xl p-3.5 border border-sb-outline-variant/8">
          <p className="text-xl font-bold text-amber-600">{teachers.length}</p>
          <p className="text-[11px] text-sb-on-surface-variant/50 mt-0.5">Docentes disponibles para sustituir</p>
        </div>
      </div>

      {loading && !courses.length && (
        <div className="flex items-center justify-center py-20 bg-sb-surface rounded-xl border border-sb-outline-variant/8">
          <Loader2 className="h-6 w-6 text-sb-primary animate-spin" />
        </div>
      )}

      {!loading && courses.length === 0 && (
        <div className="bg-sb-surface rounded-xl border border-sb-outline-variant/8 py-16">
          <SbEmpty icon={Users} title="No hay cursos" description="Agrega cursos para poder gestionar sustituciones" />
        </div>
      )}

      {/* Lista de cursos */}
      {courses.length > 0 && (
        <div className="bg-sb-surface rounded-xl border border-sb-outline-variant/8 overflow-hidden">
          <div className="px-4 py-3 border-b border-sb-outline-variant/8 flex items-center justify-between">
            <p className="text-sm font-semibold text-sb-on-surface">Cursos · día {date}</p>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sb-surface-container-high text-sb-on-surface-variant/50">
              {activeSubs.length} con sustituto
            </span>
          </div>

          <div className="divide-y divide-sb-outline-variant/8">
            {courses.map((c, i) => {
              const sub = subByCourse[c.id]
              return (
                <div key={c.id} className="px-4 py-3 flex items-center gap-3 hover:bg-sb-surface-container-low/30 transition-colors">
                  <div className="h-9 w-9 rounded-xl bg-sb-surface-container-high flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-sb-on-surface-variant/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-sb-on-surface truncate">
                      {c.name}
                      <span className="text-sb-on-surface-variant/40 font-normal ml-1.5">{c.grade} {c.section}</span>
                    </p>
                    <p className="text-[11px] text-sb-on-surface-variant/50 truncate">
                      {sub ? (
                        <span className="flex items-center gap-1.5">
                          <span className="line-through opacity-50">{c.teacher_name}</span>
                          <ArrowLeftRight className="h-3 w-3 text-emerald-500" />
                          <span className="text-emerald-600 font-medium">{sub.substitute_teacher_name}</span>
                        </span>
                      ) : (
                        c.teacher_name
                      )}
                    </p>
                  </div>
                  <span className="text-[10px] text-sb-on-surface-variant/40 shrink-0 hidden sm:block">{c.student_count} alumnos</span>
                  {sub ? (
                    <SbBadge color="bg-emerald-500/10 text-emerald-600" className="shrink-0">
                      <Check className="h-3 w-3 mr-1" /> Sustituido
                    </SbBadge>
                  ) : (
                    <SbBadge color="bg-sb-surface-container-high text-sb-on-surface-variant/50" className="shrink-0">Normal</SbBadge>
                  )}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <SbBtn
                      variant={sub ? "tonal" : "filled"}
                      rounded
                      className="text-xs h-8 px-3"
                      onClick={() => setAssignFor({ course: c, teacherId: sub ? "" : "", notes: "" })}
                      disabled={savingCourseId === c.id}
                    >
                      {savingCourseId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowLeftRight className="h-3.5 w-3.5" />}
                      {sub ? "Cambiar" : "Asignar"}
                    </SbBtn>
                    {sub && (
                      <button
                        onClick={() => cancelSubstitution(sub.id, c.name)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500/70 hover:bg-red-500/10 transition-colors"
                        title="Cancelar sustitución"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal asignar sustituto */}
      <SbModal open={!!assignFor} onClose={() => setAssignFor(null)} maxWidth="440px">
        {assignFor && (
          <>
            <SbModalHeader title="Asignar sustituto" onClose={() => setAssignFor(null)} />
            <SbModalBody>
              <div className="space-y-4">
                <div className="rounded-xl bg-sb-surface-container-low/60 border border-sb-outline-variant/10 p-4">
                  <p className="text-[11px] text-sb-on-surface-variant/40 mb-1">CURSO · {date}</p>
                  <p className="text-sm font-semibold text-sb-on-surface">{assignFor.course.name}</p>
                  <p className="text-xs text-sb-on-surface-variant/50 mt-0.5">
                    {assignFor.course.grade} {assignFor.course.section}
                  </p>
                  <p className="text-xs text-sb-on-surface-variant/50 mt-2 flex items-center gap-1.5">
                    <span className="line-through opacity-60">{assignFor.course.teacher_name}</span>
                    <ArrowLeftRight className="h-3 w-3 text-sb-on-surface-variant/40" />
                    <span className="text-emerald-600">sustituto temporal</span>
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-sb-on-surface-variant/50 mb-1.5">DOCENTE QUE SUSTITUYE</p>
                  <SbSelect
                    value={assignFor.teacherId}
                    onChange={e => setAssignFor({ ...assignFor, teacherId: e.target.value })}
                    className="sb-select w-full"
                  >
                    <option value="">Seleccionar docente...</option>
                    {teachers
                      .filter(t => t.id !== assignFor.course.teacher_id)
                      .map(t => (
                        <option key={t.id} value={t.id}>{t.full_name}</option>
                      ))}
                  </SbSelect>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-sb-on-surface-variant/50 mb-1.5">NOTA (opcional)</p>
                  <input
                    value={assignFor.notes}
                    onChange={e => setAssignFor({ ...assignFor, notes: e.target.value })}
                    placeholder="Ej: docente de guardia, hospitalizado..."
                    className="sb-input w-full"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <SbBtn variant="outlined" rounded onClick={() => setAssignFor(null)}>Cancelar</SbBtn>
                  <SbBtn variant="filled" rounded className="gap-1.5" onClick={saveSubstitution} disabled={savingCourseId === assignFor.course.id}>
                    {savingCourseId === assignFor.course.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Guardar sustitución
                  </SbBtn>
                </div>
              </div>
            </SbModalBody>
          </>
        )}
      </SbModal>

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