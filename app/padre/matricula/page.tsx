"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  GraduationCap, CreditCard, Calendar, Building2, FileText, Shield,
  User, Fingerprint, CheckCircle2, Clock, AlertTriangle,
} from "@/components/ui/proicons"

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
  active: { label: "Matriculado", bg: "bg-emerald-500/10", color: "text-emerald-600", dot: "bg-emerald-500" },
  enrolled: { label: "Matriculado", bg: "bg-emerald-500/10", color: "text-emerald-600", dot: "bg-emerald-500" },
  inactive: { label: "Matrícula retirada", bg: "bg-rose-500/10", color: "text-rose-600", dot: "bg-rose-500" },
}

const feeStatus: Record<string, { label: string; bg: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  paid: { label: "Pagado", bg: "bg-emerald-500/10", color: "text-emerald-600", icon: CheckCircle2 },
  partial: { label: "Parcial", bg: "bg-blue-500/10", color: "text-blue-600", icon: Clock },
  pending: { label: "Pendiente", bg: "bg-amber-500/10", color: "text-amber-600", icon: AlertTriangle },
  overdue: { label: "Vencido", bg: "bg-rose-500/10", color: "text-rose-600", icon: AlertTriangle },
}

const fmtCurrency = (v: string | number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(Number(v || 0))

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" }) : "—"

function getInitials(name: string) { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) }

function DetailRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="h-9 w-9 rounded-xl bg-sb-surface-container flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-sb-on-surface/50" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-sb-on-surface/50 uppercase tracking-wider">{label}</p>
        <p className="text-[13px] text-sb-on-surface/85 truncate">{value}</p>
      </div>
    </div>
  )
}

export default function MatriculaPage() {
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

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="animate-pulse space-y-5">
          <div className="h-7 w-52 rounded-xl bg-sb-surface-container" />
          <div className="h-32 rounded-2xl bg-sb-surface-container" />
          <div className="h-72 rounded-2xl bg-sb-surface-container" />
        </div>
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="space-y-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Ficha de Matrícula</h1>
          <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">Registro de matriculación de tu hijo</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
          <div className="bg-sb-surface rounded-2xl p-12 text-center">
            <div className="h-14 w-14 rounded-2xl bg-sb-surface-container flex items-center justify-center mx-auto mb-3">
              <FileText className="h-7 w-7 text-sb-on-surface-variant/20" />
            </div>
            <p className="text-sm font-medium text-sb-on-surface-variant/40">No se encontró ningún registro de matrícula</p>
            <p className="text-xs text-sb-on-surface-variant/30 mt-1">Tu registro aparecerá aquí cuando la institución matricule a tu hijo</p>
          </div>
        </motion.div>
      </div>
    )
  }

  const s = selected
  const stConf = statusConfig[s.status] || { label: s.status, bg: "bg-sb-surface-container", color: "text-sb-on-surface-variant", dot: "bg-sb-on-surface-variant/40" }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Ficha de Matrícula</h1>
        <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">Registro de matriculación de tu hijo</p>
      </motion.div>

      {children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {children.map(c => (
            <button key={c.enrollment_id} onClick={() => setSelected(c)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                s.enrollment_id === c.enrollment_id
                  ? 'bg-sb-on-surface text-sb-surface'
                  : 'bg-sb-surface-container text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high'
              }`}>
              <GraduationCap className="h-4 w-4" />
              {c.student.full_name || 'Alumno'} · {c.grade} {c.section} · {c.year}
            </button>
          ))}
        </div>
      )}

      {/* Constancia */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="bg-sb-surface rounded-2xl overflow-hidden border border-sb-outline-variant/10">
          {/* Header constancia */}
          <div className="relative overflow-hidden bg-sb-on-surface text-sb-surface px-6 py-5">
            <div className="absolute inset-0 opacity-[0.07]" style={{
              backgroundImage: "radial-gradient(circle at 15% 20%, #fff 0, transparent 40%), radial-gradient(circle at 90% 0%, #fff 0, transparent 45%)",
            }} />
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-sb-surface/15 border border-sb-surface/15 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-sb-surface/60 font-semibold">Constancia de matrícula</p>
                  <p className="text-base font-bold mt-0.5">{institution?.name || 'Institución Educativa'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-center px-4 py-1.5 rounded-xl bg-sb-surface/10 border border-sb-surface/15">
                  <p className="text-[9px] uppercase tracking-wider text-sb-surface/60 font-semibold">Año</p>
                  <p className="text-lg font-extrabold leading-tight">{s.year}</p>
                </div>
                <span className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold ${stConf.bg} ${stConf.color}`}>
                  <span className={`h-2 w-2 rounded-full ${stConf.dot}`} />
                  {stConf.label}
                </span>
              </div>
            </div>
          </div>

          {/* Alumno */}
          <div className="px-6 pt-5 pb-2 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-sb-on-surface text-sb-surface flex items-center justify-center shrink-0">
              <span className="text-sm font-bold">{getInitials(s.student.full_name || 'El')}</span>
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-sb-on-surface truncate">{s.student.full_name}</p>
              <p className="text-[11px] text-sb-on-surface-variant/50 mt-0.5">
                {institution?.code ? `${institution.code} · ` : ''}Código: {s.student.code || '—'}
              </p>
            </div>
          </div>

          {/* Detalles */}
          <div className="px-6 py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            <DetailRow icon={User} label="Alumno" value={s.student.full_name || '—'} />
            <DetailRow icon={Fingerprint} label="DNI" value={s.student.document_number || '—'} />
            <DetailRow icon={FileText} label="Código" value={s.student.code || '—'} />
            <DetailRow icon={Calendar} label="Fecha de nacimiento" value={fmtDate(s.student.birth_date)} />
            <DetailRow icon={GraduationCap} label="Grado" value={s.grade} />
            <DetailRow icon={Shield} label="Sección" value={s.section} />
            <DetailRow icon={Calendar} label="Año escolar" value={String(s.year)} />
            <DetailRow icon={Building2} label="Fecha de matrícula" value={fmtDate(s.enrolled_at)} />
          </div>

          {/* Pagos (matrícula / mensualidades) */}
          {s.fees.length > 0 && (
            <div className="px-6 pb-5 pt-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-sb-primary/10 flex items-center justify-center">
                  <CreditCard className="h-3.5 w-3.5 text-sb-primary" />
                </div>
                <p className="text-[10px] text-sb-on-surface-variant/50 uppercase tracking-wider font-semibold">Pagos asociados · Matrícula y mensualidades</p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-sb-outline-variant/10 divide-y divide-sb-outline-variant/10">
                {s.fees.map((f, i) => {
                  const fs = feeStatus[f.payment_status] || { label: f.payment_status, bg: "bg-sb-surface-container", color: "text-sb-on-surface-variant", icon: Clock }
                  const Icon = fs.icon
                  return (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <div className={`h-8 w-8 rounded-lg ${fs.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`h-4 w-4 ${fs.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-sb-on-surface/85 truncate">{f.concept_name || 'Cuota'}</p>
                        <p className="text-[11px] text-sb-on-surface-variant/50 mt-0.5">
                          {f.due_date ? `Vence: ${fmtDate(f.due_date)}` : f.paid_date ? `Pagado: ${fmtDate(f.paid_date)}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-sm font-bold text-sb-on-surface">{fmtCurrency(f.amount)}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold mt-0.5 ${fs.bg} ${fs.color}`}>
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
  )
}