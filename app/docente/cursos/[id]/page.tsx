"use client"

import * as React from "react"
import {
  ArrowLeft, BookOpen, Users, UserRound, GraduationCap, Mail, BadgeCheck,
  Phone, UserCheck, BookMarked, ClipboardList, Upload, Calendar, Clock,
  Star, X, MessageSquare,
} from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { SbTabs, SbBtn, SbBadge, SbEmpty } from "@/components/ui/sb"

interface Teacher {
  id: string
  user_id: string
  full_name: string
  email: string
}

interface Student {
  id: string
  code: string
  first_name: string
  last_name: string
  document_number: string
  gender: string
  grade: string
  section: string
}

interface Grade {
  id: string
  period: string
  score: number
  max_score: number
  notes: string | null
  created_at: string
}

interface ParentInfo {
  id: string
  first_name: string
  last_name: string
  document_number: string
  email: string | null
  phone: string | null
  occupation: string | null
  relationship: string
  is_primary: boolean
}

interface StudentFicha {
  student: {
    id: string
    code: string
    first_name: string
    last_name: string
    document_number: string
    dni: string
    gender: string
    grade: string
    section: string
    birth_date: string | null
    academic_condition: string
  }
  course: { id: string; name: string; code: string; grade: string; section: string } | null
  grades: Grade[]
  attendance: { present: number; late: number; absent: number; justified: number; total: number; rate: number }
  recentAttendance: { date: string; status: string }[]
  parents: ParentInfo[]
}

const staggerItem = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }

function getAvatarColor(name: string) {
  const colors = ["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-amber-500", "bg-pink-500", "bg-cyan-500", "bg-rose-500"]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

const PERIODS = ["Bimestre 1", "Bimestre 2", "Bimestre 3", "Bimestre 4"]

function calcAverage(grades: Grade[]) {
  if (grades.length === 0) return 0
  return Number((grades.reduce((a, g) => a + Number(g.score), 0) / grades.length).toFixed(1))
}

const ATT_LABEL: Record<string, string> = {
  present: "A tiempo", late: "Tardanza", absent: "Ausente", justified: "Justificado",
}
const ATT_CHIP: Record<string, string> = {
  present: "bg-emerald-500/10 text-emerald-600", late: "bg-amber-500/10 text-amber-600",
  absent: "bg-red-500/10 text-red-500", justified: "bg-blue-500/10 text-blue-600",
}
const ATT_DOT: Record<string, string> = {
  present: "bg-emerald-500", late: "bg-amber-500", absent: "bg-red-500", justified: "bg-blue-500",
}

export default function CursoDetallePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [course, setCourse] = React.useState<{ id: string; name: string; code: string; grade: string; section: string; student_count: number } | null>(null)
  const [teachers, setTeachers] = React.useState<Teacher[]>([])
  const [students, setStudents] = React.useState<Student[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState("alumnos")

  const [fichaOpen, setFichaOpen] = React.useState(false)
  const [ficha, setFicha] = React.useState<StudentFicha | null>(null)
  const [fichaLoading, setFichaLoading] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    fetch(`/api/docente/cursos/${id}`)
      .then(async r => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || "Error al cargar el curso")
        if (cancelled) return
        setCourse(data.course)
        setTeachers(data.teachers.filter((t: Teacher) => t.id))
        setStudents(data.students)
      })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  const openFicha = async (studentId: string) => {
    setFichaOpen(true)
    setFicha(null)
    setFichaLoading(true)
    try {
      const res = await fetch(`/api/docente/alumnos/${studentId}?course_id=${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al cargar ficha")
      setFicha(data)
    } catch (e: any) {
      setFicha(null)
    } finally {
      setFichaLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-black dark:bg-[#1a1a1c]">
        <div className="p-6 md:p-8 pb-24 md:pb-8 space-y-5">
          <div className="h-6 w-48 bg-[#E5E5E5] dark:bg-[#3f3f46] rounded animate-pulse" />
          <div className="bg-white dark:bg-[#17171a] rounded-[30px] p-5 animate-pulse space-y-3">
            <div className="h-11 w-11 rounded-[14px] bg-[#E5E5E5] dark:bg-[#3f3f46]" />
            <div className="h-4 w-40 rounded bg-[#E5E5E5] dark:bg-[#3f3f46]" />
            <div className="h-3 w-24 rounded bg-[#E5E5E5] dark:bg-[#3f3f46]" />
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-[#17171a] rounded-[30px] p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-[14px] bg-[#E5E5E5] dark:bg-[#3f3f46]" />
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-[#E5E5E5] dark:bg-[#3f3f46]" />
                  <div className="h-3 w-20 rounded bg-[#E5E5E5] dark:bg-[#3f3f46]" />
                </div>
              </div>
            </div>
        ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-black dark:bg-[#1a1a1c]">
        <div className="p-6 md:p-8 pb-24 md:pb-8">
          <SbEmpty icon={BookOpen} title="No se pudo cargar el curso" description={error} />
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-black dark:bg-[#1a1a1c]">
        <div className="p-6 md:p-8 pb-24 md:pb-8">
          <SbEmpty icon={BookOpen} title="Curso no encontrado" description="El curso no existe o no está asignado." />
        </div>
      </div>
    )
  }

  const initials = (name: string) =>
    name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase()

  const quickActions = [
    { label: "Asistencia", desc: "Tomar asistencia de este curso", icon: UserCheck, href: `/docente/asistencia?curso=${course.id}` },
    { label: "Calificaciones", desc: "Registrar notas del curso", icon: BookMarked, href: `/docente/calificaciones?curso=${course.id}` },
    { label: "Tareas", desc: "Crear y gestionar tareas", icon: ClipboardList, href: `/docente/tareas?curso=${course.id}` },
    { label: "Materiales", desc: "Subir material del curso", icon: Upload, href: `/docente/materiales?curso=${course.id}` },
  ]

  return (
    <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-black dark:bg-[#1a1a1c] sb-note">
      <div className="p-6 md:p-8 pb-24 md:pb-8">
      <Link href="/docente/cursos" className="inline-flex items-center gap-1.5 text-sm text-[#666] dark:text-[#a1a1aa] hover:text-[#000] dark:hover:text-[#f4f4f5] transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Mis Cursos
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
        <p className="text-[14px] font-medium mb-1 text-[#666] dark:text-[#a1a1aa]">Panel Docente</p>
        <h1 className="text-[36px] md:text-[48px] font-bold leading-tight text-[#000] dark:text-[#f4f4f5]">
          {course.name}
        </h1>
        <p className="text-[13px] mt-2 text-[#666] dark:text-[#a1a1aa]">
          {course.grade} - Sección {course.section} · Código {course.code}
        </p>
      </motion.div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        {quickActions.map((a, i) => {
          const Icon = a.icon
          return (
            <motion.div key={a.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.04 }}>
              <Link href={a.href} className="block p-5 rounded-[30px] bg-white dark:bg-[#17171a] hover:shadow-md transition-all">
                <div className="h-11 w-11 rounded-[14px] bg-[#F5F5F5] dark:bg-[#27272a] flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5 text-[#000] dark:text-[#f4f4f5]" />
                </div>
                <p className="text-[14px] font-semibold text-[#000] dark:text-[#f4f4f5]">{a.label}</p>
                <p className="text-[12px] text-[#666] dark:text-[#a1a1aa] mt-0.5">{a.desc}</p>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* Stats */}
      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-2 gap-3 mt-6">
        <motion.div variants={staggerItem} className="rounded-[30px] bg-white dark:bg-[#17171a] p-6">
          <div className="mb-5 h-10 w-10 rounded-[14px] bg-[#F5F5F5] dark:bg-[#27272a] flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-[#000] dark:text-[#f4f4f5]" />
          </div>
          <p className="text-[12px] font-medium text-[#666] dark:text-[#a1a1aa]">Alumnos</p>
          <p className="mt-1.5 text-[22px] font-bold text-[#000] dark:text-[#f4f4f5]">{students.length}</p>
        </motion.div>
        <motion.div variants={staggerItem} className="rounded-[30px] bg-white dark:bg-[#17171a] p-6">
          <div className="mb-5 h-10 w-10 rounded-[14px] bg-[#F5F5F5] dark:bg-[#27272a] flex items-center justify-center">
            <UserRound className="h-5 w-5 text-[#000] dark:text-[#f4f4f5]" />
          </div>
          <p className="text-[12px] font-medium text-[#666] dark:text-[#a1a1aa]">Docentes</p>
          <p className="mt-1.5 text-[22px] font-bold text-[#000] dark:text-[#f4f4f5]">{teachers.length}</p>
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <div className="mt-6">
      <SbTabs
        tabs={[
          { id: "alumnos", label: `Alumnos (${students.length})` },
          { id: "docentes", label: `Docentes (${teachers.length})` },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      </div>

      {activeTab === "alumnos" && (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.04 } } }} className="space-y-2 mt-4">
          {students.length === 0 ? (
            <SbEmpty icon={Users} title="Sin alumnos" description="Todavía no hay alumnos matriculados en este curso." />
          ) : (
            students.map(s => (
              <motion.button
                key={s.id}
                variants={staggerItem}
                onClick={() => openFicha(s.id)}
                className="w-full text-left bg-white dark:bg-[#17171a] rounded-[30px] p-4 flex items-center gap-3 hover:-translate-y-px hover:opacity-90 transition-all cursor-pointer group">
                <div className={`h-10 w-10 rounded-[14px] ${getAvatarColor(`${s.first_name} ${s.last_name}`)} flex items-center justify-center shrink-0`}>
                  <span className="text-white text-xs font-bold">{initials(`${s.first_name} ${s.last_name}`)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#000] dark:text-[#f4f4f5] truncate">{s.first_name} {s.last_name}</p>
                  <p className="text-xs text-[#666] dark:text-[#a1a1aa]">{s.code}{s.document_number ? ` · DNI ${s.document_number}` : ""}</p>
                </div>
                {s.gender && (
                  <SbBadge color={s.gender === "F" ? "bg-pink-500/10 text-pink-500" : "bg-blue-500/10 text-blue-500"}>
                    {s.gender === "F" ? "Femenino" : "Masculino"}
                  </SbBadge>
                )}
                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[#000] dark:text-[#f4f4f5] bg-[#F5F5F5] dark:bg-[#27272a] px-2.5 py-1 rounded-[12px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  Ver ficha
                </span>
              </motion.button>
            ))
          )}
        </motion.div>
      )}

      {activeTab === "docentes" && (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.04 } } }} className="space-y-2 mt-4">
          {teachers.length === 0 ? (
            <SbEmpty icon={UserRound} title="Sin docentes" description="Aún no hay docentes asignados a este curso." />
          ) : (
            teachers.map(t => (
              <motion.div key={t.id} variants={staggerItem} className="bg-white dark:bg-[#17171a] rounded-[30px] p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-[14px] ${getAvatarColor(t.full_name)} flex items-center justify-center shrink-0`}>
                  <span className="text-white text-xs font-bold">{initials(t.full_name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[#000] dark:text-[#f4f4f5] truncate">{t.full_name}</p>
                    <BadgeCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  </div>
                  <p className="text-xs text-[#666] dark:text-[#a1a1aa] flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {t.email}
                  </p>
                </div>
                <SbBadge color="bg-emerald-500/10 text-emerald-600">Docente del curso</SbBadge>
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      <div className="mt-6 bg-white dark:bg-[#17171a] rounded-[30px] p-4 flex items-start gap-3">
          <div className="h-8 w-8 rounded-[14px] bg-[#F5F5F5] dark:bg-[#27272a] flex items-center justify-center shrink-0">
            <BookOpen className="h-4 w-4 text-[#000] dark:text-[#f4f4f5]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#000] dark:text-[#f4f4f5]">Información del curso</p>
            <p className="text-xs text-[#666] dark:text-[#a1a1aa] mt-0.5">
              {course.name} · {course.grade} - Sección {course.section} · Código {course.code}
            </p>
          </div>
        </div>

      {/* ===== FICHA DEL ALUMNO ===== */}
      <AnimatePresence>
        {fichaOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setFichaOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.37, 0.35, 0, 1] }}
              className="relative bg-white dark:bg-[#17171a] rounded-[30px] w-full max-w-[560px] shadow-2xl shadow-black/30 max-h-[90vh] overflow-y-auto">
              {fichaLoading ? (
                <div className="p-10 flex flex-col items-center gap-3">
                  <div className="h-8 w-8 border-2 border-[#E5E5E5] dark:border-[#3f3f46] border-t-[#000] dark:border-t-[#f4f4f5] rounded-full animate-spin" />
                  <p className="text-sm text-[#666] dark:text-[#a1a1aa]">Cargando ficha...</p>
                </div>
              ) : !ficha ? (
                <div className="p-10 text-center">
                  <p className="text-sm text-[#666] dark:text-[#a1a1aa]">No se pudo cargar la ficha del alumno</p>
                  <SbBtn rounded className="mt-4" onClick={() => setFichaOpen(false)}>Cerrar</SbBtn>
                </div>
              ) : (
                <div>
                  <button onClick={() => setFichaOpen(false)}
                    className="absolute right-3 top-3 h-8 w-8 rounded-[14px] flex items-center justify-center bg-[#F5F5F5] dark:bg-[#27272a] text-[#666] dark:text-[#a1a1aa] hover:text-[#000] dark:hover:text-[#f4f4f5] transition-colors z-10">
                    <X className="h-4 w-4" />
                  </button>

                  {/* Header */}
                  <div className="p-6 pb-5 flex items-center gap-4 bg-[#F5F5F5] dark:bg-[#27272a]">
                    <div className={`h-16 w-16 rounded-[14px] ${getAvatarColor(`${ficha.student.first_name} ${ficha.student.last_name}`)} flex items-center justify-center shrink-0`}>
                      <span className="text-lg font-bold text-white">{initials(`${ficha.student.first_name} ${ficha.student.last_name}`)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-bold text-[#000] dark:text-[#f4f4f5] truncate">{ficha.student.first_name} {ficha.student.last_name}</p>
                      <p className="text-xs text-[#666] dark:text-[#a1a1aa] mt-0.5">{ficha.course?.name || "Sin curso"} · {ficha.student.grade} &quot;{ficha.student.section}&quot;</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {ficha.student.document_number && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-[12px] bg-[#E5E5E5] dark:bg-[#3f3f46] text-[#666] dark:text-[#a1a1aa]">DNI: {ficha.student.document_number}</span>
                        )}
                        {ficha.student.gender && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-[12px] bg-[#E5E5E5] dark:bg-[#3f3f46] text-[#666] dark:text-[#a1a1aa]">{ficha.student.gender === "F" ? "Femenino" : "Masculino"}</span>
                        )}
                        {ficha.student.academic_condition && ficha.student.academic_condition !== "studying" && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-[6px] bg-amber-500/10 text-amber-600">{ficha.student.academic_condition}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Notas */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-semibold text-[#666] dark:text-[#a1a1aa] uppercase tracking-wider flex items-center gap-1.5">
                          <BookMarked className="h-3.5 w-3.5" /> Notas en el curso
                        </p>
                        {ficha.grades.length > 0 && (
                          <span className="text-sm font-bold text-[#000] dark:text-[#f4f4f5]">{calcAverage(ficha.grades)}</span>
                        )}
                      </div>
                      {ficha.grades.length === 0 ? (
                        <div className="rounded-[14px] bg-[#F5F5F5] dark:bg-[#27272a] py-6 text-center">
                          <p className="text-xs text-[#666] dark:text-[#a1a1aa]">Sin calificaciones registradas</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2">
                          {PERIODS.map(p => {
                            const g = ficha.grades.find(x => x.period === p)
                            return (
                              <div key={p} className="rounded-[14px] bg-[#F5F5F5] dark:bg-[#27272a] p-3 text-center">
                                <p className="text-[9px] text-[#666] dark:text-[#a1a1aa] uppercase tracking-wider mb-1.5">B{p.split(" ")[1]}</p>
                                {g ? (
                                  <p className={`text-lg font-bold ${Number(g.score) >= 11 ? "text-emerald-600" : "text-red-500"}`}>{Number(g.score)}</p>
                                ) : (
                                  <p className="text-lg font-bold text-[#666] dark:text-[#a1a1aa]">—</p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Asistencia */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-semibold text-[#666] dark:text-[#a1a1aa] uppercase tracking-wider flex items-center gap-1.5">
                          <UserCheck className="h-3.5 w-3.5" /> Asistencia
                        </p>
                        <span className="text-[11px] font-medium text-[#666] dark:text-[#a1a1aa]">{ficha.attendance.total} registros</span>
                      </div>
                      {ficha.attendance.total === 0 ? (
                        <div className="rounded-[14px] bg-[#F5F5F5] dark:bg-[#27272a] py-6 text-center">
                          <p className="text-xs text-[#666] dark:text-[#a1a1aa]">Sin registros de asistencia</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex-1 h-2 rounded-[12px] bg-[#E5E5E5] dark:bg-[#3f3f46] overflow-hidden">
                              <div className={`h-full rounded-[12px] transition-all duration-700 ${ficha.attendance.rate >= 80 ? "bg-emerald-400" : ficha.attendance.rate >= 60 ? "bg-amber-400" : "bg-red-400"}`}
                                style={{ width: `${ficha.attendance.rate}%` }} />
                            </div>
                            <span className="text-sm font-bold text-[#000] dark:text-[#f4f4f5]">{ficha.attendance.rate}%</span>
                          </div>
                          <div className="grid grid-cols-4 gap-2 mb-3">
                            {[
                              { label: "A tiempo", value: ficha.attendance.present, color: "text-emerald-600", bg: "bg-emerald-500/8" },
                              { label: "Tardanzas", value: ficha.attendance.late, color: "text-amber-600", bg: "bg-amber-500/8" },
                              { label: "Faltas", value: ficha.attendance.absent, color: "text-red-500", bg: "bg-red-500/8" },
                              { label: "Justific.", value: ficha.attendance.justified, color: "text-blue-600", bg: "bg-blue-500/8" },
                            ].map(stat => (
                              <div key={stat.label} className={`rounded-[14px] ${stat.bg} p-2 text-center`}>
                                <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
                                <p className="text-[9px] text-[#666] dark:text-[#a1a1aa]">{stat.label}</p>
                              </div>
                            ))}
                          </div>
                          {ficha.recentAttendance.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap">
                              {ficha.recentAttendance.map(r => (
                                <span key={r.date} className="inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-[12px] bg-[#E5E5E5] dark:bg-[#3f3f46] text-[#666] dark:text-[#a1a1aa]">
                                  <span className={`h-1.5 w-1.5 rounded-[12px] ${ATT_DOT[r.status] || "bg-[#666] dark:bg-[#a1a1aa]"}`} />
                                  {new Date(r.date + "T00:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Padres */}
                    <div>
                      <p className="text-[10px] font-semibold text-[#666] dark:text-[#a1a1aa] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" /> Apoderados ({ficha.parents.length})
                      </p>
                      {ficha.parents.length === 0 ? (
                        <div className="rounded-[14px] bg-[#F5F5F5] dark:bg-[#27272a] py-5 text-center">
                          <p className="text-xs text-[#666] dark:text-[#a1a1aa]">Sin apoderados vinculados</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {ficha.parents.map(p => (
                            <div key={p.id} className="rounded-[14px] bg-[#F5F5F5] dark:bg-[#27272a] p-3.5 flex items-center gap-3">
                              <div className="h-9 w-9 rounded-[14px] bg-[#E5E5E5] dark:bg-[#3f3f46] flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-[#000] dark:text-[#f4f4f5]">{initials(`${p.first_name} ${p.last_name}`)}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#000] dark:text-[#f4f4f5] truncate capitalize">{p.first_name} {p.last_name}</p>
                                <p className="text-[10px] text-[#666] dark:text-[#a1a1aa] capitalize">
                                  {p.relationship}{p.is_primary ? " · Principal" : ""}{p.occupation ? ` · ${p.occupation}` : ""}
                                </p>
                                {p.phone && <p className="text-[10px] text-[#666] dark:text-[#a1a1aa] mt-0.5">{p.phone}</p>}
                              </div>
                              <div className="flex gap-1 shrink-0">
                                {p.phone && (
                                  <a href={`https://wa.me/${String(p.phone).replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                                    title="Escribir por WhatsApp"
                                    className="h-8 w-8 rounded-[14px] flex items-center justify-center bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors">
                                    <MessageSquare className="h-4 w-4" />
                                  </a>
                                )}
                                {p.phone && (
                                  <a href={`tel:${p.phone}`} title="Llamar"
                                    className="h-8 w-8 rounded-[14px] flex items-center justify-center bg-[#E5E5E5] dark:bg-[#3f3f46] text-[#666] dark:text-[#a1a1aa] hover:text-[#000] dark:hover:text-[#f4f4f5] transition-colors">
                                    <Phone className="h-4 w-4" />
                                  </a>
                                )}
                                {p.email && (
                                  <a href={`mailto:${p.email}`} title="Enviar correo"
                                    className="h-8 w-8 rounded-[14px] flex items-center justify-center bg-[#E5E5E5] dark:bg-[#3f3f46] text-[#666] dark:text-[#a1a1aa] hover:text-[#000] dark:hover:text-[#f4f4f5] transition-colors">
                                    <Mail className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2 pt-2 border-t border-[#E5E5E5] dark:border-[#27272a]">
                      <SbBtn variant="filled" rounded className="flex-1" onClick={() => router.push(`/docente/calificaciones?curso=${course.id}`)}>
                        <BookMarked className="h-4 w-4" /> Calificaciones
                      </SbBtn>
                      <SbBtn rounded className="flex-1" onClick={() => router.push(`/docente/asistencia?curso=${course.id}`)}>
                        <UserCheck className="h-4 w-4" /> Asistencia
                      </SbBtn>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}
