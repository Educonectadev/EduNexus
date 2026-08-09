"use client"

import * as React from "react"
import { Settings, Save, Building2, Bell, Shield, CreditCard, Check, Mail, Phone, Clock } from "@/components/ui/proicons"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { SbBtn, SbInput, SbSwitch } from "@/components/ui/sb"
import { parsePlanFeatures } from "@/lib/planPermissions"

export default function ConfiguracionPage() {
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [config, setConfig] = React.useState({
    institution_name: "", institution_email: "", institution_phone: "",
    notification_email: true, notification_sms: false, auto_approve_enrollment: false,
  })
  const [plan, setPlan] = React.useState<{ name: string; price: number; max_users: number; max_students: number; features: string[] | string } | null>(null)
  const [trial, setTrial] = React.useState<{ isExpired: boolean; remainingBusinessDays: number; daysLabel: string } | null>(null)

  React.useEffect(() => {
    fetch("/api/auth/institution").then(r => r.json()).then(data => {
      setConfig(c => ({ ...c, institution_name: data.name || "", institution_email: data.email || "", institution_phone: data.phone || "" }))
      if (data.plan) setPlan(data.plan)
      if (data.trial && !data.trial.hasPaidPlan) setTrial(data.trial)
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true); setSaved(false)
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
      if (res.ok) setSaved(true)
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-sb-on-surface">Configuración</h1>
          <p className="text-sm text-sb-on-surface-variant/50 mt-0.5">Ajustes generales de la institución</p>
        </div>
        <SbBtn variant="filled" rounded className="flex items-center gap-2" onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? "Guardando..." : "Guardar"}
        </SbBtn>
      </motion.div>

      {trial && !trial.isExpired && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-green-600" />
            </div>
            <h3 className="text-sm font-semibold text-sb-on-surface">Periodo de prueba</h3>
          </div>
          <div className="bg-sb-surface rounded-xl p-4 border border-sb-outline-variant/8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm text-sb-on-surface/80">Estás usando EduNexus de forma gratuita</p>
              <p className="text-xs text-sb-on-surface-variant/50 mt-0.5">{trial.remainingBusinessDays} día(s) hábil(es) restantes</p>
            </div>
            <button
              onClick={() => window.location.href = "/director/configuracion"}
              className="text-xs font-medium text-sb-on-surface bg-sb-surface-container-high hover:bg-sb-surface-container-highest px-4 py-2 rounded-lg transition-colors"
            >
              Ver días restantes
            </button>
          </div>
        </motion.div>
      )}

      {saved && (
        <div className="flex items-center gap-2 text-sm text-emerald-600">
          <Check className="h-4 w-4" /> Cambios guardados correctamente
        </div>
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
                <p>{plan.max_users} usuarios administrativos</p>
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
        <div className="bg-sb-surface rounded-xl p-4 space-y-4 border border-sb-outline-variant/8">
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
        </div>
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
