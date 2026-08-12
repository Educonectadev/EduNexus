"use client"

import * as React from "react"
import { CreditCard, Receipt, Wallet, CheckCircle, Check, X, Upload, RefreshCw, CalendarDays, Landmark, Coins, Building2, DollarSign, Loader2 } from "@/components/ui/proicons"
import { cn } from "@/lib/utils"
import { SbSectionHeader, SbModal, SbModalHeader, SbModalBody, SbBtn, SbInput, SbBadge, SbEmpty } from "@/components/ui/sb"

interface Payment {
  id: string
  plan_id: string | null
  month: number
  amount: number
  status: string
  payment_date: string | null
  method: string
  voucher_ref: string
  notes: string
}

interface Cuota {
  month: number
  monthName: string
  amount: number
  status: string
  payment: Payment | null
}

interface PaymentMethod {
  id: string
  type: string
  name: string
  bank_name: string | null
  account_number: string | null
  account_holder: string | null
  phone: string | null
}

interface PlanInfo {
  id: string | null
  name: string | null
  description: string | null
  price: number
  max_users: number | null
  max_students: number | null
  features: Record<string, boolean> | null
}

interface PlanPaymentsData {
  year: number
  currentYear: number
  plan: PlanInfo | null
  trial_ends_at: string | null
  cuotas: Cuota[]
  totals: {
    year: number
    paid: number
    pending: number
    paidCount: number
    pendingCount: number
  }
  paymentMethods: PaymentMethod[]
}

const fmt = (n: number | string) => "S/ " + Number(n || 0).toFixed(2)

const COMMON_METHODS = ["Transferencia bancaria", "Depósito", "Yape / Plin", "Efectivo", "Tarjeta de crédito/débito"]

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function PagosPlanClient() {
  const [data, setData] = React.useState<PlanPaymentsData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [year, setYear] = React.useState(new Date().getFullYear())
  const [editing, setEditing] = React.useState<Cuota | null>(null)
  const [form, setForm] = React.useState({ amount: "", payment_date: "", method: "", voucher_ref: "", notes: "" })
  const [saving, setSaving] = React.useState(false)
  const [confirmCancel, setConfirmCancel] = React.useState<Payment | null>(null)
  const [toast, setToast] = React.useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2600)
  }

  const fetchData = React.useCallback(async (y: number) => {
    try {
      const res = await fetch(`/api/plan-payments?year=${y}`)
      if (res.ok) setData(await res.json())
    } catch {}
  }, [])

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/plan-payments?year=${year}`)
        if (!cancelled && res.ok) setData(await res.json())
      } catch {}
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [year])

  const openEdit = (c: Cuota) => {
    setEditing(c)
    setForm({
      amount: String(c.amount || 0),
      payment_date: new Date().toISOString().slice(0, 10),
      method: c.payment?.method || "",
      voucher_ref: c.payment?.voucher_ref || "",
      notes: c.payment?.notes || "",
    })
  }

  const savePayment = async () => {
    if (!editing) return
    if (isNaN(Number(form.amount)) || Number(form.amount) <= 0) { showToast("Ingresa un monto válido", false); return }
    setSaving(true)
    try {
      const res = await fetch("/api/plan-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year,
          month: editing.month,
          amount: form.amount,
          payment_date: form.payment_date,
          method: form.method,
          voucher_ref: form.voucher_ref,
          notes: form.notes,
        }),
      })
      if (res.ok) {
        showToast(`Pago de ${MONTHS[editing.month - 1]} registrado`)
        setEditing(null)
        fetchData(year)
      } else {
        const err = await res.json()
        showToast(err.error || "Error al guardar", false)
      }
    } catch { showToast("Error de conexión", false) }
    finally { setSaving(false) }
  }

  const cancelPayment = async () => {
    if (!confirmCancel) return
    setSaving(true)
    try {
      const res = await fetch(`/api/plan-payments?id=${confirmCancel.id}`, { method: "DELETE" })
      if (res.ok) {
        showToast("Pago anulado")
        setConfirmCancel(null)
        fetchData(year)
      } else showToast("Error al anular", false)
    } catch { showToast("Error de conexión", false) }
    finally { setSaving(false) }
  }

  const plan = data?.plan
  const totals = data?.totals
  const featureList = plan?.features
    ? Object.entries(plan.features).filter(([, v]) => v).map(([k]) => k.replace(/_/g, " "))
    : []

  return (
    <div className="space-y-5">
      <SbSectionHeader
        title="Pagos del Plan"
        description="Cuotas mensuales del plan EduNexus adquirido por la institución. Es independiente de las matrículas y mensualidades que pagan los padres."
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
            <SbBtn variant="outlined" rounded className="gap-1.5 text-xs h-9 px-3" onClick={() => fetchData(year)} disabled={loading}>
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Actualizar
            </SbBtn>
          </div>
        }
      />

      {/* Resumen económico */}
      {totals && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="bg-sb-surface rounded-xl p-3.5 border border-sb-outline-variant/8">
            <p className="text-xl font-bold text-sb-on-surface">{fmt(totals.year)}</p>
            <p className="text-[11px] text-sb-on-surface-variant/50 mt-0.5">Total del año {data?.year}</p>
          </div>
          <div className="bg-sb-surface rounded-xl p-3.5 border border-sb-outline-variant/8">
            <p className="text-xl font-bold text-emerald-600">{fmt(totals.paid)}</p>
            <p className="text-[11px] text-sb-on-surface-variant/50 mt-0.5">{totals.paidCount} cuotas pagadas</p>
          </div>
          <div className="bg-sb-surface rounded-xl p-3.5 border border-sb-outline-variant/8">
            <p className="text-xl font-bold text-amber-600">{fmt(totals.pending)}</p>
            <p className="text-[11px] text-sb-on-surface-variant/50 mt-0.5">{totals.pendingCount} cuotas pendientes</p>
          </div>
          <div className="bg-sb-surface rounded-xl p-3.5 border border-sb-outline-variant/8">
            <p className="text-xl font-bold text-sb-on-surface">{plan?.price ? fmt(plan.price) : "—"}</p>
            <p className="text-[11px] text-sb-on-surface-variant/50 mt-0.5">Cuota mensual</p>
          </div>
        </div>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-20 bg-sb-surface rounded-xl border border-sb-outline-variant/8">
          <Loader2 className="h-6 w-6 text-sb-primary animate-spin" />
        </div>
      )}

      {!loading && !plan && (
        <div className="bg-sb-surface rounded-xl border border-sb-outline-variant/8 py-16">
          <SbEmpty icon={CreditCard} title="Sin plan contratado" description="La institución aún no tiene un plan activo. Un asesor de EduNexus se pondrá en contacto para activarlo." />
        </div>
      )}

      {/* Plan actual */}
      {plan && (
        <div className="bg-sb-surface rounded-xl border border-sb-outline-variant/8 overflow-hidden">
          <div className="p-5 bg-gradient-to-br from-sb-primary/[0.06] to-transparent border-b border-sb-outline-variant/8">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="h-11 w-11 rounded-xl bg-sb-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-sb-primary" />
              </div>
              <div className="flex-1 min-w-[180px]">
                <p className="text-base font-semibold text-sb-on-surface">{plan.name || "Plan"}</p>
                <p className="text-xs text-sb-on-surface-variant/50">{plan.max_students} estudiantes · {plan.max_users} usuarios</p>
              </div>
              <SbBadge color="bg-sb-primary/10 text-sb-primary" className="text-xs">
                {fmt(plan.price)} / mes
              </SbBadge>
            </div>
            {featureList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {featureList.slice(0, 10).map(f => (
                  <span key={f} className="text-[10px] px-2 py-1 rounded-full bg-sb-surface-container-high text-sb-on-surface-variant/60">
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Cuotas */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-sb-on-surface">Cuotas de {data?.year}</p>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sb-surface-container-high text-sb-on-surface-variant/50">
                Pagar mes por mes
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
              {data?.cuotas.map((c, i) => {
                const paid = c.status === "paid"
                const overdue = c.status === "overdue"
                return (
                  <button
                    key={i}
                    onClick={() => openEdit(c)}
                    className={cn(
                      "rounded-xl p-3 border text-left transition-all hover:shadow-sm group",
                      paid ? "bg-emerald-500/[0.06] border-emerald-500/20"
                        : overdue ? "bg-red-500/[0.05] border-red-500/20"
                        : "bg-sb-surface-container-low/60 border-sb-outline-variant/10 hover:border-sb-outline-variant/20"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-bold text-sb-on-surface">{MONTHS[i]}</span>
                      {paid ? (
                        <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600">
                          <CheckCircle className="h-3 w-3" /> PAGADO
                        </span>
                      ) : (
                        <span className={cn(
                          "text-[9px] font-semibold px-1.5 py-0.5 rounded-full",
                          overdue ? "text-red-600 bg-red-500/10" : "text-amber-600 bg-amber-500/10"
                        )}>
                          {overdue ? "VENCIDO" : "PENDIENTE"}
                        </span>
                      )}
                    </div>
                    <p className={cn("text-base font-bold leading-none", paid ? "text-sb-on-surface" : "text-sb-on-surface-variant/60")}>
                      {fmt(c.amount)}
                    </p>
                    {paid && c.payment?.payment_date && (
                      <p className="text-[9.5px] text-sb-on-surface-variant/40 mt-1.5">
                        {c.payment.payment_date.slice(0, 10)}
                        {c.payment.method && ` · ${c.payment.method}`}
                      </p>
                    )}
                    {!paid && (
                      <p className="text-[9.5px] text-sb-on-surface-variant/30 mt-1.5">Toca para registrar pago</p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal registrar pago */}
      <SbModal open={!!editing} onClose={() => setEditing(null)} maxWidth="440px">
        {editing && (
          <>
            <SbModalHeader title={`Pagar cuota · ${MONTHS[editing.month - 1]} ${data?.year}`} onClose={() => setEditing(null)} />
            <SbModalBody>
              <div className="space-y-4">
                <div className="rounded-xl bg-sb-surface-container-low/60 border border-sb-outline-variant/10 p-3.5 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-sb-primary/10 flex items-center justify-center">
                    <Receipt className="h-4 w-4 text-sb-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-sb-on-surface-variant/50">Cuota {MONTHS[editing.month - 1]} · {plan?.name}</p>
                    <p className="text-sm font-semibold text-sb-on-surface">{fmt(editing.amount)}</p>
                  </div>
                  <SbBadge color={editing.payment ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}>
                    {editing.payment ? "Ya registrada" : "Pendiente"}
                  </SbBadge>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-sb-on-surface-variant/50 mb-1.5">MONTO PAGADO</p>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/40" />
                    <SbInput
                      type="number"
                      min={0}
                      value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value })}
                      className="!pl-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] font-medium text-sb-on-surface-variant/50 mb-1.5">FECHA DE PAGO</p>
                    <SbInput
                      type="date"
                      value={form.payment_date}
                      onChange={e => setForm({ ...form, payment_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-sb-on-surface-variant/50 mb-1.5">MÉTODO</p>
                    <input
                      list="plan-payment-methods"
                      value={form.method}
                      onChange={e => setForm({ ...form, method: e.target.value })}
                      placeholder="Transferencia, depósito..."
                      className="sb-input w-full"
                    />
                    <datalist id="plan-payment-methods">
                      {COMMON_METHODS.map(m => <option key={m} value={m} />)}
                      {data?.paymentMethods.map(m => <option key={m.id} value={`${m.name}${m.bank_name ? ` (${m.bank_name})` : ""}`} />)}
                    </datalist>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-sb-on-surface-variant/50 mb-1.5">REFERENCIA / VOUCHER</p>
                  <div className="relative">
                    <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/40" />
                    <SbInput
                      value={form.voucher_ref}
                      onChange={e => setForm({ ...form, voucher_ref: e.target.value })}
                      placeholder="N° de operación, código de voucher..."
                      className="!pl-9"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-sb-on-surface-variant/50 mb-1.5">NOTA (opcional)</p>
                  <SbInput
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Observaciones..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <SbBtn variant="outlined" rounded onClick={() => setEditing(null)}>Cancelar</SbBtn>
                  <SbBtn variant="filled" rounded className="gap-1.5" onClick={savePayment} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Registrar pago
                  </SbBtn>
                </div>

                {editing.payment && (
                  <button
                    onClick={() => { setEditing(null); setConfirmCancel(editing.payment!) }}
                    className="w-full text-center text-[11px] text-red-500/70 hover:text-red-500 transition-colors py-1"
                  >
                    Anular este pago
                  </button>
                )}
              </div>
            </SbModalBody>
          </>
        )}
      </SbModal>

      {/* Confirmar anulación */}
      <SbModal open={!!confirmCancel} onClose={() => setConfirmCancel(null)} maxWidth="380px">
        {confirmCancel && (
          <>
            <SbModalHeader title="Anular pago" onClose={() => setConfirmCancel(null)} />
            <SbModalBody>
              <div className="space-y-4">
                <p className="text-sm text-sb-on-surface-variant/70">
                  ¿Seguro que deseas anular el pago de <b>{MONTHS[confirmCancel.month - 1]}</b> por <b>{fmt(confirmCancel.amount)}</b>? La cuota volverá a estado pendiente.
                </p>
                <div className="flex items-center justify-end gap-2">
                  <SbBtn variant="outlined" rounded onClick={() => setConfirmCancel(null)}>No</SbBtn>
                  <SbBtn variant="danger" rounded className="gap-1.5" onClick={cancelPayment} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    Sí, anular
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