"use client"

import * as React from "react"
import {
  GraduationCap, Users, FileText, ClipboardList, Plus, Search,
  BookOpen, Calendar, Clock, AlertCircle, DollarSign,
  UserPlus, CheckCircle, CreditCard, FileSignature, HelpCircle,
} from "@/components/ui/proicons"
import { MinimalistDashboardView } from "@/components/dashboard/minimalist/minimalist-dashboard-view"
import { OnboardingModal } from "@/components/ui/onboarding-modal"
import { useAuthStore } from "@/stores/auth-store"

interface Stats {
  active_students: number; total_students: number; enrollments: number; pending: number
  courses: number; schedules: number; parents: number; documents: number
  certificates: number; total_debt: number; absent_today: number
}

interface ActivityItem {
  id: string
  type: string
  title: string
  description: string
  time: string | null
}

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  matricula: UserPlus,
  asistencia: CheckCircle,
  pago: CreditCard,
  documento: FileSignature,
}

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Ahora"
  if (mins < 60) return `Hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `Hace ${days}d`
  return new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short" })
}

export default function SecretarioDashboard() {
  const user = useAuthStore((s) => s.user)

  const [stats, setStats] = React.useState<Stats>({
    active_students: 0, total_students: 0, enrollments: 0, pending: 0,
    courses: 0, schedules: 0, parents: 0, documents: 0,
    certificates: 0, total_debt: 0, absent_today: 0,
  })
  const [loading, setLoading] = React.useState(true)
  const [activitiesData, setActivitiesData] = React.useState<ActivityItem[]>([])
  const [onboardingOpen, setOnboardingOpen] = React.useState(() => {
    try {
      return !localStorage.getItem("educo_onboarding_secretario")
    } catch {
      return false
    }
  })

  const closeOnboarding = () => {
    try { localStorage.setItem("educo_onboarding_secretario", "1") } catch {}
    setOnboardingOpen(false)
  }

  React.useEffect(() => {
    const fetchAll = async () => {
      try {
        const s = await fetch("/api/secretario/stats").then(r => r.json()).catch(() => ({}))
        setStats({
          active_students: s.active_students || 0,
          total_students: s.total_students || 0,
          enrollments: s.enrollments || 0,
          pending: s.pending || 0,
          courses: s.courses || 0,
          schedules: s.schedules || 0,
          parents: s.parents || 0,
          documents: s.documents || 0,
          certificates: s.certificates || 0,
          total_debt: s.total_debt || 0,
          absent_today: s.absent_today || 0,
        })
      } catch {} finally { setLoading(false) }
    }

    const fetchActivity = async () => {
      try {
        const res = await fetch("/api/secretario/activity")
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.activities)) setActivitiesData(data.activities)
        }
      } catch {}
    }

    fetchAll()
    fetchActivity()
    const interval = setInterval(fetchActivity, 30000)
    return () => clearInterval(interval)
  }, [])

  const metrics = loading ? [] : [
    { label: "Alumnos", value: stats.active_students, icon: GraduationCap, trend: stats.total_students ? `${((stats.active_students / stats.total_students) * 100).toFixed(0)}%` : undefined, trendUp: true },
    { label: "Matriculas", value: stats.enrollments, icon: BookOpen },
    { label: "Documentos", value: stats.documents, icon: FileText },
    { label: "Certificados", value: stats.certificates, icon: FileSignature },
    { label: "Pendientes", value: stats.pending, icon: AlertCircle, trend: "revisar" },
    { label: "Ausentes", value: stats.absent_today, icon: Clock, trend: "hoy" },
    { label: "Deuda", value: `S/ ${stats.total_debt.toFixed(0)}`, icon: DollarSign },
  ]

  const quickActions = [
    { label: "Matricular alumno", desc: "Registrar nuevo alumno", icon: Plus, href: "/secretario/matriculas" },
    { label: "Tomar asistencia", desc: "Registrar asistencia del dia", icon: ClipboardList, href: "/secretario/asistencia" },
    { label: "Registrar notas", desc: "Ingresar calificaciones", icon: GraduationCap, href: "/secretario/notas" },
    { label: "Registrar pago", desc: "Pago de colegiatura", icon: DollarSign, href: "/secretario/pagos" },
    { label: "Generar documento", desc: "Constancia o certificado", icon: FileText, href: "/secretario/documentos" },
    { label: "Buscar alumno", desc: "Expediente completo", icon: Search, href: "/secretario/busqueda" },
  ]

  const activities = activitiesData.map(a => ({
    id: a.id,
    title: a.title,
    description: a.description,
    time: a.time ? timeAgo(a.time) : "Ahora",
    icon: activityIcons[a.type] || UserPlus,
  }))

  return (
    <>
      <MinimalistDashboardView
        userName={user?.full_name?.split(" ")[0] || "Usuario"}
        metrics={metrics}
        quickActions={quickActions}
        activities={activities}
      />

      <button
        onClick={() => setOnboardingOpen(true)}
        title="¿Cómo funciona el sistema?"
        className="fixed bottom-24 right-5 z-40 h-11 w-11 rounded-2xl bg-sb-primary text-sb-on-primary flex items-center justify-center shadow-lg shadow-sb-primary/25 hover:scale-105 active:scale-95 transition-transform"
      >
        <HelpCircle className="h-5 w-5" />
      </button>

      <OnboardingModal
        open={onboardingOpen}
        onClose={closeOnboarding}
        title="Bienvenido al Panel de Secretaría"
        description="Te mostramos rápidamente cómo funciona el sistema para que gestiones a tus alumnos sin complicaciones."
        primaryLabel="Entendido, ¡empezar!"
        steps={[
          { icon: GraduationCap, title: "Matrículas", description: "Registra nuevos alumnos y gestiona sus matrículas por grado y sección." },
          { icon: ClipboardList, title: "Asistencia", description: "Toma la asistencia diaria por aula y consulta los historiales." },
          { icon: BookOpen, title: "Notas", description: "Ingresa las calificaciones y controla el avance académico de cada alumno." },
          { icon: FileText, title: "Documentos y certificados", description: "Genera constancias, certificados y carnets en PDF con un clic." },
          { icon: CreditCard, title: "Pagos", description: "Registra las colegiaturas y controla la deuda de cada alumno." },
          { icon: Search, title: "Búsqueda de alumnos", description: "Encuentra el expediente completo de cualquier alumno al instante." },
        ]}
      />
    </>
  )
}
