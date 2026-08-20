"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  GraduationCap, CreditCard, Calendar, Building2, FileText, Shield,
  User, Fingerprint, CheckCircle2, Clock, AlertTriangle, Sun, Moon,
} from "@/components/ui/proicons"
import NotificationBell from "@/components/layout/notification-bell"
import { useAuthStore } from "@/stores/auth-store"
import { useTheme } from "next-themes"

interface Fee {
  concept_name: string
  amount: string | number
  paid_amount: string | number
  payment_status: string
  due_date: string | null
  paid_date: string | null
}

interface MatriculaChild {
  enrollment_id: string
  grade: string
  section: string
  year: string | number
  status: string
  enrolled_at: string | null
  student: {
    id: string
    code: string | null
    first_name: string
    last_name: string
    full_name: string
    document_number: string
    birth_date: string | null
    gender: string | null
  }
  fees: Fee[]
}

const statusConfig: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  active: { label: "Matriculado", bg: "bg-emerald-500/15", color: "text-emerald-400", dot: "bg-emerald-400" },
  enrolled: { label: "Matriculado", bg: "bg-emerald-500/15", color: "text-emerald-400", dot: "bg-emerald-400" },
  inactive: { label: "Matrícula retirada", bg: "bg-rose-500/15", color: "text-rose-400", dot: "bg-rose-400" },
}

const feeStatus: Record<string, { label: string; bg: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  paid: { label: "Pagado", bg: "bg-emerald-500/15", color: "text-emerald-400", icon: CheckCircle2 },
  partial: { label: "Parcial", bg: "bg-blue-500/15", color: "text-blue-400", icon: Clock },
  pending: { label: "Pendiente", bg: "bg-amber-500/15", color: "text-amber-400", icon: AlertTriangle },
  overdue: { label: "Vencido", bg: "bg-rose-500/15", color: "text-rose-400", icon: AlertTriangle },
}

const fmtCurrency = (v: string | number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(Number(v || 0))

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" }) : "—"

function getInitials(name: string) { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) }

export default function MatriculaPage() {
  return (
    <React.Suspense fallback={null}>
      <MatriculaInner />
    </React.Suspense>
  )
}

function MatriculaInner() {
  const user = useAuthStore((s) => s.user)
  const { theme, setTheme } = useTheme()
  const [children, setChildren] = React.useState<MatriculaChild[]>([])
  const [institution, setInstitution] = React.useState<{ name: string; code: string | null } | null>(null)
  const [selected, setSelected] = React.useState<MatriculaChild | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/padre/matricula")
      .then(r => r.json())
      .then(data => {
        const list = data.children || []
        setChildren(list)
        setInstitution(data.institution || null)
        if (list.length > 0) setSelected(list[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalPaid = selected?.fees.reduce((sum, f) => sum + (f.payment_status === "paid" ? Number(f.amount) : Number(f.paid_amount || 0)), 0) || 0
  const totalPending = selected?.fees.reduce((sum, f) => sum + (f.payment_status !== "paid" ? Number(f.amount) - Number(f.paid_amount || 0) : 0), 0) || 0
  const paidCount = selected?.fees.filter(f => f.payment_status === "paid").length || 0
  const pendingCount = selected?.fees.filter(f => f.payment_status !== "paid").length || 0

  if (loading) {
    return (
      <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-black dark:bg-[#1a1a1c]">
        <div className="p-6 md:p-8 pb-24 md:pb-8">
          <div className="animate-pulse space-y-5">
            <div className="h-7 w-52 rounded-xl bg-white/10" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-[20px] bg-white/5" />)}
            </div>
            <div className="h-80 rounded-[20px] bg-white/5" />
          </div>
        </div>
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-black dark:bg-[#1a1a1c]">
        <div className="p-6 md:p-8 pb-24 md:pb-8">
          <div className="flex items-start justify-between mb-6 gap-4">
            <div>
              <p className="text-[14px] font-medium mb-1 text-[#a1a1aa]">Panel Padre</p>
              <h1 className="text-[36px] md:text-[48px] font-bold leading-tight text-[#f4f4f5]">Ficha de Matrícula</h1>
              <p className="text-[13px] mt-2 text-[#a1a1aa]">Registro de matriculación de tu hijo</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 mt-1">
              {user && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5">
                  <div className="h-6 w-6 rounded-full flex items-center justify-center"><span className="text-[9px] font-semibold text-[#f4f4f5]">{user.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "D"}</span></div>
                  <span className="text-sm md:text-base font-medium text-[#f4f4f5] whitespace-nowrap">{user.full_name}</span>
                </div>
              )}
              <NotificationBell />
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Cambiar tema" title="Cambiar tema" className="h-10 w-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity relative">
                <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-[#f4f4f5]" />
                <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-[#f4f4f5]" />
              </button>
            </div>
          </div>
          <div className="rounded-[20px] bg-white dark:bg-[#17171a] p-12 text-center">
            <div className="h-16 w-16 rounded-3xl bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-7 w-7 text-[#666] dark:text-[#a1a1aa]" />
            </div>
            <p className="text-sm font-semibold text-[#000] dark:text-[#f4f4f5] mb-1">No se encontró ningún registro de matrícula</p>
            <p className="text-xs text-[#666] dark:text-[#a1a1aa]">Tu registro aparecerá aquí cuando la institución matricule a tu hijo</p>
          </div>
        </div>
      </div>
    )
  }

  const s = selected
  const stConf = statusConfig[s.status] || { label: s.status, bg: "bg-white/10", color: "text-[#a1a1aa]", dot: "bg-[#a1a1aa]" }

  return (
    <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-black dark:bg-[#1a1a1c]">
      <div className="p-6 md:p-8 pb-24 md:pb-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-6 gap-4">
          <div>
            <p className="text-[14px] font-medium mb-1 text-[#a1a1aa]">Panel Padre</p>
            <h1 className="text-[36px] md:text-[48px] font-bold leading-tight text-[#f4f4f5]">Ficha de Matrícula</h1>
            <p className="text-[13px] mt-2 text-[#a1a1aa]">Registro de matriculación de tu hijo</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5">
                <div className="h-6 w-6 rounded-full flex items-center justify-center"><span className="text-[9px] font-semibold text-[#f4f4f5]">{user.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "D"}</span></div>
                <span className="text-sm md:text-base font-medium text-[#f4f4f5] whitespace-nowrap">{user.full_name}</span>
              </div>
            )}
            <NotificationBell />
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Cambiar tema" title="Cambiar tema" className="h-10 w-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity relative">
              <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-[#f4f4f5]" />
              <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-[#f4f4f5]" />
            </button>
          </div>
        </motion.div>

        {children.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
            {children.map(c => (
              <button key={c.enrollment_id} onClick={() => setSelected(c)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  s.enrollment_id === c.enrollment_id
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-[#a1a1aa] hover:bg-white/10'
                }`}>
                <GraduationCap className="h-4 w-4" />
                {c.student.full_name || 'Alumno'} · {c.grade} {c.section}
              </button>
            ))}
          </div>
        )}

        {/* Stat cards */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="p-4 rounded-[20px] bg-white dark:bg-[#17171a] hover:shadow-lg transition-shadow">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-[11px] font-medium text-[#666] dark:text-[#a1a1aa] mb-1">Pagado</p>
            <p className="text-[28px] font-bold text-[#000] dark:text-[#f4f4f5] leading-none">{fmtCurrency(totalPaid)}</p>
          </div>
          <div className="p-4 rounded-[20px] bg-white dark:bg-[#17171a] hover:shadow-lg transition-shadow">
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 flex items-center justify-center mb-3">
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-[11px] font-medium text-[#666] dark:text-[#a1a1aa] mb-1">Por pagar</p>
            <p className="text-[28px] font-bold text-[#000] dark:text-[#f4f4f5] leading-none">{fmtCurrency(totalPending)}</p>
          </div>
          <div className="p-4 rounded-[20px] bg-white dark:bg-[#17171a] hover:shadow-lg transition-shadow">
            <div className="h-9 w-9 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-4 w-4 text-[#666] dark:text-[#a1a1aa]" />
            </div>
            <p className="text-[11px] font-medium text-[#666] dark:text-[#a1a1aa] mb-1">Pagos completados</p>
            <p className="text-[28px] font-bold text-[#000] dark:text-[#f4f4f5] leading-none">{paidCount}</p>
          </div>
          <div className="p-4 rounded-[20px] bg-white dark:bg-[#17171a] hover:shadow-lg transition-shadow">
            <div className="h-9 w-9 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center mb-3">
              <AlertTriangle className="h-4 w-4 text-[#666] dark:text-[#a1a1aa]" />
            </div>
            <p className="text-[11px] font-medium text-[#666] dark:text-[#a1a1aa] mb-1">Pendientes</p>
            <p className="text-[28px] font-bold text-[#000] dark:text-[#f4f4f5] leading-none">{pendingCount}</p>
          </div>
        </motion.div>

        {/* Constancia card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-white dark:bg-[#17171a] rounded-[20px] overflow-hidden">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#333] text-white px-6 py-5">
              <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 15% 20%, #fff 0, transparent 40%), radial-gradient(circle at 90% 0%, #fff 0, transparent 45%)" }} />
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-white/15 border border-white/15 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/60 font-semibold">Constancia de matrícula</p>
                    <p className="text-base font-bold mt-0.5">{institution?.name || 'Institución Educativa'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-center px-4 py-1.5 rounded-xl bg-white/10 border border-white/15">
                    <p className="text-[9px] uppercase tracking-wider text-white/60 font-semibold">Año</p>
                    <p className="text-lg font-extrabold leading-tight">{s.year}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold ${stConf.bg} ${stConf.color}`}>
                    <span className={`h-2 w-2 rounded-full ${stConf.dot}`} />
                    {stConf.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Student profile */}
            <div className="px-6 pt-5 pb-2 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-black dark:bg-white flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-white dark:text-black">{getInitials(s.student.full_name || 'El')}</span>
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-[#000] dark:text-[#f4f4f5] truncate">{s.student.full_name}</p>
                <p className="text-[11px] text-[#666] dark:text-[#a1a1aa] mt-0.5">
                  {institution?.code ? `${institution.code} · ` : ''}Código: {s.student.code || '—'}
                </p>
              </div>
            </div>

            {/* Details grid */}
            <div className="px-6 py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              {[
                { icon: User, label: "Alumno", value: s.student.full_name || '—' },
                { icon: Fingerprint, label: "DNI", value: s.student.document_number || '—' },
                { icon: FileText, label: "Código", value: s.student.code || '—' },
                { icon: Calendar, label: "Fecha de nacimiento", value: fmtDate(s.student.birth_date) },
                { icon: GraduationCap, label: "Grado", value: s.grade },
                { icon: Shield, label: "Sección", value: s.section },
                { icon: Calendar, label: "Año escolar", value: String(s.year) },
                { icon: Building2, label: "Fecha de matrícula", value: fmtDate(s.enrolled_at) },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5">
                  <div className="h-9 w-9 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0">
                    <row.icon className="h-4 w-4 text-[#666] dark:text-[#a1a1aa]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-[#666] dark:text-[#a1a1aa] uppercase tracking-wider font-medium">{row.label}</p>
                    <p className="text-[13px] font-medium text-[#000] dark:text-[#f4f4f5] truncate">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Payments */}
            {s.fees.length > 0 && (
              <div className="px-6 pb-5 pt-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
                    <CreditCard className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                  <p className="text-[11px] text-[#666] dark:text-[#a1a1aa] uppercase tracking-wider font-semibold">Pagos asociados · Matrícula y mensualidades</p>
                </div>
                <div className="space-y-2">
                  {s.fees.map((f, i) => {
                    const fs = feeStatus[f.payment_status] || { label: f.payment_status, bg: "bg-white/10", color: "text-[#a1a1aa]", icon: Clock }
                    const Icon = fs.icon
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-[16px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                        <div className={`h-9 w-9 rounded-xl ${fs.bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`h-4 w-4 ${fs.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-[#000] dark:text-[#f4f4f5] truncate">{f.concept_name || 'Cuota'}</p>
                          <p className="text-[11px] text-[#666] dark:text-[#a1a1aa] mt-0.5">
                            {f.due_date ? `Vence: ${fmtDate(f.due_date)}` : f.paid_date ? `Pagado: ${fmtDate(f.paid_date)}` : ''}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="text-[14px] font-bold text-[#000] dark:text-[#f4f4f5]">{fmtCurrency(f.amount)}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-semibold mt-0.5 ${fs.bg} ${fs.color}`}>
                            {fs.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}