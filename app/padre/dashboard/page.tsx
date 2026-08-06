"use client"

import * as React from "react"
import {
  GraduationCap, TrendingUp, ClipboardList, CreditCard, Calendar,
  BookOpen, CheckCircle2, Clock, AlertCircle,
} from "@/components/ui/proicons"
import { MinimalistDashboardView } from "@/components/dashboard/minimalist/minimalist-dashboard-view"
import { useAuthStore } from "@/stores/auth-store"

interface ChildData {
  id: string
  first_name: string
  last_name: string
  grade: string
  section: string
  course: string
  academic_condition?: string
  average: number
  attendance_pct: number
  grades: { subject: string; grade: number; term: string }[]
}

interface EventData {
  id: string
  title: string
  start_date: string
}

interface HomeworkData {
  id: string
  title: string
  status: string
  due_date: string
}

interface PaymentData {
  pending: { id: string; concept: string; amount: number }[]
}

export default function PadreDashboard() {
  const user = useAuthStore((s) => s.user)
  const [child, setChild] = React.useState<ChildData | null>(null)
  const [events, setEvents] = React.useState<EventData[]>([])
  const [homeworks, setHomeworks] = React.useState<HomeworkData[]>([])
  const [payments, setPayments] = React.useState<PaymentData | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [hijoRes, eventosRes, tareasRes, pagosRes] = await Promise.allSettled([
          fetch("/api/padre/hijo"),
          fetch("/api/padre/calendario"),
          fetch("/api/padre/tareas"),
          fetch("/api/padre/pagos"),
        ])

        if (hijoRes.status === "fulfilled" && hijoRes.value.ok) {
          const data = await hijoRes.value.json()
          const children = data.children || []
          if (children.length > 0) setChild(children[0])
        }

        if (eventosRes.status === "fulfilled" && eventosRes.value.ok) {
          const data = await eventosRes.value.json()
          if (Array.isArray(data)) setEvents(data)
        }

        if (tareasRes.status === "fulfilled" && tareasRes.value.ok) {
          const data = await tareasRes.value.json()
          if (Array.isArray(data)) setHomeworks(data)
        }

        if (pagosRes.status === "fulfilled" && pagosRes.value.ok) {
          const data = await pagosRes.value.json()
          if (data && data.pending) setPayments(data)
        }
      } catch {} finally { setLoading(false) }
    }
    loadData()
  }, [])

  const pendingTasks = homeworks.filter(t => t.status === "pending").length
  const pendingPayments = payments?.pending?.length || 0

  const metrics = loading ? [] : [
    { label: "Promedio", value: child?.average?.toString() || "—", icon: TrendingUp, trend: child?.academic_condition === "promoted" ? "Promovido" : undefined, trendUp: true },
    { label: "Asistencia", value: `${child?.attendance_pct || 0}%`, icon: CheckCircle2 },
    { label: "Tareas", value: pendingTasks, icon: ClipboardList, trend: pendingTasks > 0 ? "pendientes" : undefined, href: "/padre/tareas" },
    { label: "Pagos", value: pendingPayments, icon: CreditCard, trend: pendingPayments > 0 ? "pendientes" : undefined, href: "/padre/pagos" },
    { label: "Calendario", value: events.length, icon: Calendar, href: "/padre/calendario" },
  ]

  const quickActions = [
    { label: "Ver hijo", desc: child ? `${child.first_name} ${child.last_name}` : "Información académica", icon: GraduationCap, href: "/padre/hijo" },
    { label: "Asistencia", desc: "Registro de asistencia", icon: CheckCircle2, href: "/padre/asistencia" },
    { label: "Tareas", desc: `${pendingTasks} pendientes`, icon: ClipboardList, href: "/padre/tareas" },
    { label: "Pagos", desc: pendingPayments > 0 ? `${pendingPayments} pendientes` : "Todo al día", icon: CreditCard, href: "/padre/pagos" },
    { label: "Comunicados", desc: "Avisos de la institución", icon: BookOpen, href: "/padre/comunicados" },
    { label: "Calendario", desc: "Eventos escolares", icon: Calendar, href: "/padre/calendario" },
  ]

  const now = new Date()
  const recentGrades = (child?.grades || []).slice(0, 4)
  const upcomingEvents = events
    .filter(e => new Date(e.start_date) >= now)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 4)

  const activities = [
    ...recentGrades.map((g, i) => ({
      id: `grade-${i}`,
      title: `${g.subject}: ${g.grade}`,
      description: `Calificación en ${g.term}`,
      time: g.term,
      icon: BookOpen,
    })),
    ...upcomingEvents.map((e, i) => {
      const diffDays = Math.ceil((new Date(e.start_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return {
        id: `event-${i}`,
        title: e.title,
        description: new Date(e.start_date).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" }),
        time: diffDays === 0 ? "Hoy" : diffDays === 1 ? "Mañana" : `En ${diffDays} días`,
        icon: Calendar,
      }
    }),
  ]

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="animate-pulse space-y-5">
          <div className="h-8 w-48 rounded-xl bg-sb-surface-container" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px rounded-2xl overflow-hidden bg-sb-outline-variant/20">
            {[1,2,3,4,5].map(i => <div key={i} className="h-28 bg-sb-surface" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-sb-surface" />)}
            </div>
            <div className="lg:col-span-3 space-y-1">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-sb-surface rounded-2xl" />)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <MinimalistDashboardView
      userName={user?.full_name?.split(" ")[0] || "Padre"}
      metrics={metrics}
      quickActions={quickActions}
      activities={activities}
    />
  )
}
