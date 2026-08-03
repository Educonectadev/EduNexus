"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { CreditCard, CheckCircle2, Clock, AlertTriangle, Receipt, ArrowUpRight, TrendingDown, Eye, CreditCard as CreditCardIcon, Download, Printer } from "lucide-react"
import { SbDropdown, SbDropdownItem } from "@/components/ui/sb"

interface PaymentSummary {
  total_paid: number
  total_pending: number
  next_payment: string
  monthly: number
}

interface PaymentPending {
  id: string
  concept: string
  amount: number
  due_date: string
  status: string
  type: string
}

interface PaymentHistory {
  id: string
  concept: string
  amount: number
  due_date: string
  status: string
  paid_date?: string
  payment_method?: string
  receipt_number?: string
}

interface PaymentData {
  summary: PaymentSummary
  pending: PaymentPending[]
  history: PaymentHistory[]
}

const staggerItem = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }

export default function PagosPage() {
  const [data, setData] = React.useState<PaymentData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [tab, setTab] = React.useState<'pending' | 'history'>('pending')

  React.useEffect(() => {
    fetch("/api/padre/pagos")
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="animate-pulse space-y-5">
          <div className="h-7 w-48 rounded-xl bg-sb-surface-container" />
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-sb-surface-container" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Pagos</h1>
        <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">Historial y pagos pendientes</p>
      </motion.div>

      {/* Summary */}
      {data?.summary && (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Pagado', value: `S/ ${(data.summary.total_paid || 0).toLocaleString()}`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/8' },
            { label: 'Por Pagar', value: `S/ ${(data.summary.total_pending || 0).toLocaleString()}`, icon: TrendingDown, color: 'text-amber-600', bg: 'bg-amber-500/8' },
            { label: 'Mensualidad', value: `S/ ${data.summary.monthly || 0}`, icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-500/8' },
            { label: 'Próximo Pago', value: data.summary.next_payment ? new Date(data.summary.next_payment + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : '—', icon: AlertTriangle, color: 'text-sb-on-surface', bg: 'bg-sb-on-surface/8' },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <motion.div key={stat.label} variants={staggerItem} className="bg-sb-surface rounded-2xl p-4">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-3 ${stat.bg}`}>
                  <Icon className={`h-4.5 w-4.5 ${stat.color}`} />
                </div>
                <p className="text-xl font-bold tracking-tight text-sb-on-surface">{stat.value}</p>
                <p className="text-[11px] text-sb-on-surface-variant/45 mt-0.5">{stat.label}</p>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="flex gap-2">
        {([
          { key: 'pending' as const, label: 'Pendientes' },
          { key: 'history' as const, label: 'Historial' },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-sb-on-surface text-sb-surface'
                : 'bg-sb-surface-container text-sb-on-surface-variant/60 hover:bg-sb-surface-container-high'
            }`}
          >
            {t.label}
            {t.key === 'pending' && data && (data.pending || []).length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                tab === t.key ? 'bg-white/20' : 'bg-amber-500/10 text-amber-600'
              }`}>
                {(data.pending || []).length}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Content */}
      {data && (
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-sb-surface rounded-2xl overflow-hidden"
        >
          {tab === 'pending' ? (
            (data.pending || []).length > 0 ? (
              <div className="space-y-px">
                {(data.pending || []).map((p) => {
                  const daysLeft = Math.ceil((new Date(p.due_date).getTime() - Date.now()) / (1000*60*60*24))
                  return (
                    <div key={p.id} className="p-5 hover:bg-sb-surface-container-low/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Receipt className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-sb-on-surface">{p.concept}</p>
                            <p className="text-[10px] text-sb-on-surface-variant/40">
                              Vence: {new Date(p.due_date + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-amber-600">S/ {p.amount}</p>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-sb-outline-variant/15">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          daysLeft <= 3 ? 'bg-red-500/10 text-red-500' :
                          daysLeft <= 7 ? 'bg-amber-500/10 text-amber-600' :
                          'bg-sb-surface-container text-sb-on-surface-variant/40'
                        }`}>
                          {daysLeft <= 0 ? 'Vencido' : daysLeft === 1 ? 'Vence mañana' : `Faltan ${daysLeft} días`}
                        </span>
                        <SbDropdown align="right" trigger={
                          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-semibold hover:bg-blue-500/15 transition-colors">
                            Ver opciones <ArrowUpRight className="h-3 w-3" />
                          </button>
                        }>
                          <SbDropdownItem icon={Eye} onClick={() => console.log("Ver detalle", p.id)}>
                            Ver detalle
                          </SbDropdownItem>
                          <SbDropdownItem icon={CreditCardIcon} onClick={() => console.log("Pagar ahora", p.id)}>
                            Pagar ahora
                          </SbDropdownItem>
                          <SbDropdownItem icon={Download} onClick={() => console.log("Descargar comprobante", p.id)}>
                            Descargar comprobante
                          </SbDropdownItem>
                          <SbDropdownItem icon={Printer} onClick={() => console.log("Imprimir", p.id)}>
                            Imprimir
                          </SbDropdownItem>
                        </SbDropdown>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="px-5 py-12 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500/20 mx-auto mb-3" />
                <p className="text-sm font-medium text-sb-on-surface-variant/40">No hay pagos pendientes</p>
                <p className="text-xs text-sb-on-surface-variant/30 mt-1">Todo al día</p>
              </div>
            )
          ) : (
            <div className="space-y-px">
              {(data.history || []).map((p) => (
                <div key={p.id} className="px-5 py-4 hover:bg-sb-surface-container-low/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-sb-on-surface truncate">{p.concept}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-sb-on-surface-variant/40">{p.payment_method}</span>
                          {p.receipt_number && (
                            <>
                              <span className="text-sb-outline-variant/30">·</span>
                              <span className="text-[10px] text-sb-on-surface-variant/30 font-mono">{p.receipt_number}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-bold text-sb-on-surface">S/ {p.amount}</p>
                      {p.paid_date && (
                        <p className="text-[10px] text-sb-on-surface-variant/30">
                          {new Date(p.paid_date + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(data.history || []).length === 0 && (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm text-sb-on-surface-variant/30">No hay pagos registrados</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
