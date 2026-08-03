"use client"

import * as React from "react"
import { ArrowLeft, BookOpen, Users, UserRound, GraduationCap, Mail, BadgeCheck } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useParams } from "next/navigation"
import { SbSectionHeader, SbTabs, SbBtn, SbBadge, SbEmpty, SbCard } from "@/components/ui/sb"

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

const staggerItem = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }

function getAvatarColor(name: string) {
  const colors = ["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-amber-500", "bg-pink-500", "bg-cyan-500", "bg-rose-500"]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default function CursoDetallePage() {
  const params = useParams()
  const id = params.id as string

  const [course, setCourse] = React.useState<{ name: string; code: string; grade: string; section: string; student_count: number } | null>(null)
  const [teachers, setTeachers] = React.useState<Teacher[]>([])
  const [students, setStudents] = React.useState<Student[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState("alumnos")

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

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-6 w-48 bg-sb-surface-container rounded animate-pulse" />
        <div className="bg-sb-surface rounded-2xl p-5 animate-pulse space-y-3">
          <div className="h-11 w-11 rounded-2xl bg-sb-surface-container" />
          <div className="h-4 w-40 rounded bg-sb-surface-container" />
          <div className="h-3 w-24 rounded bg-sb-surface-container" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-sb-surface rounded-2xl p-5 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-sb-surface-container" />
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-sb-surface-container" />
                <div className="h-3 w-20 rounded bg-sb-surface-container" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <SbEmpty
        icon={BookOpen}
        title="No se pudo cargar el curso"
        description={error}
      />
    )
  }

  if (!course) {
    return <SbEmpty icon={BookOpen} title="Curso no encontrado" description="El curso no existe o no está asignado." />
  }

  const initials = (name: string) =>
    name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase()

  return (
    <div className="space-y-5">
      <Link href="/docente/cursos" className="inline-flex items-center gap-1.5 text-sm text-sb-on-surface-variant/50 hover:text-sb-on-surface transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Mis Cursos
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <SbSectionHeader
          title={course.name}
          description={`${course.grade} - Sección ${course.section} · Código ${course.code}`}
        />
      </motion.div>

      {/* Stats */}
      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-2 gap-3">
        <motion.div variants={staggerItem} className="bg-sb-surface rounded-2xl p-4">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center mb-3 bg-blue-500/8">
            <GraduationCap className="h-4.5 w-4.5 text-blue-600" />
          </div>
          <p className="text-xl font-bold tracking-tight text-sb-on-surface">{students.length}</p>
          <p className="text-[11px] text-sb-on-surface-variant/45 mt-0.5">Alumnos</p>
        </motion.div>
        <motion.div variants={staggerItem} className="bg-sb-surface rounded-2xl p-4">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center mb-3 bg-emerald-500/8">
            <UserRound className="h-4.5 w-4.5 text-emerald-600" />
          </div>
          <p className="text-xl font-bold tracking-tight text-sb-on-surface">{teachers.length}</p>
          <p className="text-[11px] text-sb-on-surface-variant/45 mt-0.5">Docentes</p>
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <SbTabs
        tabs={[
          { id: "alumnos", label: `Alumnos (${students.length})` },
          { id: "docentes", label: `Docentes (${teachers.length})` },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === "alumnos" && (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.04 } } }} className="space-y-2">
          {students.length === 0 ? (
            <SbEmpty icon={Users} title="Sin alumnos" description="Todavía no hay alumnos matriculados en este curso." />
          ) : (
            students.map(s => (
              <motion.div key={s.id} variants={staggerItem} className="bg-sb-surface rounded-2xl p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl ${getAvatarColor(`${s.first_name} ${s.last_name}`)} flex items-center justify-center shrink-0`}>
                  <span className="text-white text-xs font-bold">{initials(`${s.first_name} ${s.last_name}`)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sb-on-surface truncate">{s.first_name} {s.last_name}</p>
                  <p className="text-xs text-sb-on-surface-variant/50">{s.code}{s.document_number ? ` · DNI ${s.document_number}` : ""}</p>
                </div>
                {s.gender && (
                  <SbBadge color={s.gender === "F" ? "bg-pink-500/10 text-pink-500" : "bg-blue-500/10 text-blue-500"}>
                    {s.gender === "F" ? "Femenino" : "Masculino"}
                  </SbBadge>
                )}
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {activeTab === "docentes" && (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.04 } } }} className="space-y-2">
          {teachers.length === 0 ? (
            <SbEmpty icon={UserRound} title="Sin docentes" description="Aún no hay docentes asignados a este curso." />
          ) : (
            teachers.map(t => (
              <motion.div key={t.id} variants={staggerItem} className="bg-sb-surface rounded-2xl p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl ${getAvatarColor(t.full_name)} flex items-center justify-center shrink-0`}>
                  <span className="text-white text-xs font-bold">{initials(t.full_name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-sb-on-surface truncate">{t.full_name}</p>
                    <BadgeCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  </div>
                  <p className="text-xs text-sb-on-surface-variant/50 flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {t.email}
                  </p>
                </div>
                <SbBadge color="bg-emerald-500/10 text-emerald-600">Docente del curso</SbBadge>
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      <SbCard className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-sb-primary/10 flex items-center justify-center shrink-0">
            <BookOpen className="h-4 w-4 text-sb-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-sb-on-surface">Información del curso</p>
            <p className="text-xs text-sb-on-surface-variant/50 mt-0.5">
              {course.name} · {course.grade} - Sección {course.section} · Código {course.code}
            </p>
          </div>
        </div>
      </SbCard>
    </div>
  )
}
