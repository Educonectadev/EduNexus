"use client"

import * as React from "react"
import { Save, Building2, Bell, Shield, CreditCard, Check, Mail, Phone, Clock, Pencil, X, Settings } from "@/components/ui/proicons"
import { motion, AnimatePresence } from "framer-motion"
import { SbBtn, SbInput, SbSwitch, useToast } from "@/components/ui/sb"
import { parsePlanFeatures } from "@/lib/planPermissions"

export default function ConfiguracionPage() {
  const { toast } = useToast()
  const [saving, setSaving] = React.useState(false)
  const [loadingForm, setLoadingForm] = React.useState(true)
  const [editing, setEditing] = React.useState(false)
  const [config, setConfig] = React.useState({
    institution_name: "", institution_email: "", institution_phone: "",
    notification_email: true, notification_sms: false, auto_approve_enrollment: false,
  })
  const [preview, setPreview] = React.useState<typeof config>(config)
  const [plan, setPlan] = React.useState<{ name: string; price: number; max_users: number; max_students: number; features: string[] | string } | null>(null)
  const [trial, setTrial] = React.useState<{ isExpired: boolean; remainingBusinessDays: number; daysLabel: string } | null>(null)
  const [isDemo, setIsDemo] = React.useState(false)
  const [trialDays, setTrialDays] = React.useState<number | null>(20)
  const [instCode, setInstCode] = React.useState("")

  const load = React.useCallback(() => {
    return fetch("/api/auth/institution").then(r => r.json()).then(data => {
      const next = {
        institution_name: data.name || "",
        institution_email: data.email || "",
        institution_phone: data.phone || "",
      }
      setConfig(c => ({ ...c, ...next }))
      setPreview(p => ({ ...p, ...next }))
      setInstCode(data.code || data.id || "")
      if (data.plan) setPlan(data.plan)
      if (data.isDemo !== undefined) setIsDemo(data.isDemo)
      if (data.trialDays !== undefined) setTrialDays(data.trialDays)
      if (data.trial && !data.trial.hasPaidPlan) setTrial(data.trial)
      return data
    })
  }, [])

  React.useEffect(() => {
    load().finally(() => setLoadingForm(false)).catch(() => {})
  }, [load])

  const startEditing = () => { setPreview({...config}); setEditing(true) }
  const cancelEditing = () => { setConfig({...preview}); setEditing(false) }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/auth/institution", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: config.institution_name,
          email: config.institution_email,
          phone: config.institution_phone,
        }),
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast(result.error || "No se pudo guardar", "error")
        return
      }
      setPreview({ ...config })
      setEditing(false)
      toast("Cambios guardados correctamente", "success")
    } catch {
      toast("Error de conexión al guardar", "error")
    } finally { setSaving(false) }
  }

  if (loadingForm) {
    return <div className="flex h-[60vh] items-center justify-center text-sb-on-surface-variant/40">Cargando...</div>
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-sb-primary/10 flex items-center justify-center">
            <Settings className="h-5 w-5 text-sb-primary" />
          </div>
          <div>
            <h1 className="text-[20px] font-bold tracking-tight text-sb-on-surface">Configuración</h1>
            <p className="text-[13px] text-sb-on-surface-variant/50">
              Ajustes generales de tu institución{instCode ? <span className="text-sb-on-surface-variant/70 font-medium"> · {instCode}</span> : ""}
            </p>
          </div>
        </div>
        {!editing ? (
          <SbBtn variant="filled" rounded className="flex items-center gap-2" onClick={startEditing}>
            <Pencil className="h-4 w-4" /> Editar
          </SbBtn>
        ) : (
          <div className="flex items-center gap-2">
            <SbBtn variant="outlined" rounded className="flex items-center gap-2" onClick={cancelEditing} disabled={saving}>
              <X className="h-4 w-4" /> Cancelar
            </SbBtn>
            <SbBtn variant="filled" rounded className="flex items-center gap-2" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? "Guardando..." : "Guardar"}
            </SbBtn>
          </div>
        )}
      </motion.div>

      {trial && !trial.isExpired && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-2xl p-4 border border-emerald-500/20 bg-emerald-500/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Clock className="h-4.5 w-4.5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-sb-on-surface">
                  {isDemo ? "Cuenta Demo · Prueba de 15 días" : "Periodo de prueba gratuito"}
                </p>
                <p className="text-[12px] text-sb-on-surface-variant/60 mt-0.5">
                  {trial.remainingBusinessDays} de {trialDays || "20"} día(s) hábil(es) restantes · contrata un plan cuando quieras
                </p>
              </div>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full">
              <Clock className="h-3 w-3" /> {trial.remainingBusinessDays}/{trialDays || "20"} días
            </span>
          </div>
        </motion.div>
      )}

      {plan && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-amber-500" />
            </div>
            <h3 className="text-sm font-semibold text-sb-on-surface">Plan contratado</h3>
          </div>
          <div className="bg-sb-surface rounded-xl p-4 border border-sb-outline-variant/8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-lg font-bold text-sb-on-surface">{plan.name}</p>
                <p className="text-xs text-sb-on-surface-variant/50">S/ {Number(plan.price).toFixed(2)} /mes</p>
              </div>
              <div className="text-right text-xs text-sb-on-surface-variant/40">
                <p>Hasta {plan.max_students.toLocaleString()} estudiantes</p>
                <p>{plan.max_users} usuarios admin</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 pt-3 border-t border-sb-outline-variant/10">
              {parsePlanFeatures(plan.features).labels.map((f: string, i: number) => (
                <span key={i} className="flex items-center gap-1 text-xs text-sb-on-surface-variant/60 bg-sb-surface-container-high px-2.5 py-1 rounded-lg">
                  <Check className="h-3 w-3 text-emerald-400" /> {f}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-blue-500" />
          </div>
          <h3 className="text-sm font-semibold text-sb-on-surface">Institución</h3>
        </div>

        <AnimatePresence mode="wait">
          {!editing ? (
            <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-sb-surface rounded-xl border border-sb-outline-variant/8 divide-y divide-sb-outline-variant/6 overflow-hidden">
              {[
                { icon: Building2, label: "Nombre", value: preview.institution_name || "—" },
                { icon: Mail, label: "Email", value: preview.institution_email || "—" },
                { icon: Phone, label: "Teléfono", value: preview.institution_phone || "—" },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-8 w-8 rounded-lg bg-sb-surface-container-high flex items-center justify-center shrink-0">
                    <row.icon className="h-3.5 w-3.5 text-sb-on-surface-variant/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-sb-on-surface-variant/40">{row.label}</p>
                    <p className="text-sm text-sb-on-surface truncate mt-0.5">{row.value}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-sb-surface rounded-xl p-4 space-y-4 border border-sb-outline-variant/8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Nombre</label>
                  <SbInput value={config.institution_name} onChange={e => setConfig({...config, institution_name: e.target.value})} placeholder="Nombre de la institución" />
                </div>
                <div>
                  <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Email</label>
                  <div className="relative">
                    <SbInput value={config.institution_email} onChange={e => setConfig({...config, institution_email: e.target.value})} placeholder="email@colegio.pe" style={{ paddingLeft: "36px" }} />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/30" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-sb-on-surface-variant/40 mb-1 block">Teléfono</label>
                <div className="relative" style={{ maxWidth: "320px" }}>
                  <SbInput value={config.institution_phone} onChange={e => setConfig({...config, institution_phone: e.target.value})} placeholder="999 888 777" style={{ paddingLeft: "36px" }} />
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/30" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Bell className="h-4 w-4 text-emerald-500" />
          </div>
          <h3 className="text-sm font-semibold text-sb-on-surface">Notificaciones</h3>
        </div>
        <div className="bg-sb-surface rounded-xl divide-y divide-sb-outline-variant/8 border border-sb-outline-variant/8">
          {[
            { key: "notification_email", label: "Notificaciones por email", desc: "Recibe alertas importantes en tu correo" },
            { key: "notification_sms", label: "Notificaciones por SMS", desc: "Alertas vía mensaje de texto" },
            { key: "auto_approve_enrollment", label: "Auto-aprobar matrículas", desc: "Aprobar matrículas automáticamente al registrar" },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between px-4 py-3.5 first:rounded-t-xl last:rounded-b-xl">
              <div>
                <p className="text-sm text-sb-on-surface/80">{item.label}</p>
                <p className="text-xs text-sb-on-surface-variant/40 mt-0.5">{item.desc}</p>
              </div>
              <SbSwitch checked={!!config[item.key as keyof typeof config]} onCheckedChange={() => setConfig({...config, [item.key]: !config[item.key as keyof typeof config]})} />
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Shield className="h-4 w-4 text-purple-500" />
          </div>
          <h3 className="text-sm font-semibold text-sb-on-surface">Seguridad</h3>
        </div>
        <div className="bg-sb-surface rounded-xl p-4 space-y-3 border border-sb-outline-variant/8">
          <p className="text-sm text-sb-on-surface-variant/60">Gestiona la seguridad de tu cuenta y datos.</p>
          <button className="text-xs text-sb-on-surface-variant/50 hover:text-sb-on-surface-variant/70 transition-colors">Cambiar contraseña →</button>
        </div>
      </motion.div>
    </div>
  )
}