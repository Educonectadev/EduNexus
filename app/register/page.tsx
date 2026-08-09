"use client"

import * as React from "react"
import Link from "next/link"
import {
  SbBtn,
  SbInput,
  SbLabel,
  SbCard,
} from "@/components/ui/sb"
import { Logo } from "@/components/ui/logo"
import {
  Building2,
  MapPin,
  Phone,
  Globe,
  GraduationCap,
  User,
  Lock,
  Sparkles,
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "@/components/ui/proicons"
import { departments } from "@/lib/data/peru-geo"

const institutionTypes = [
  { value: "colegio", label: "Colegio" },
  { value: "instituto", label: "Instituto" },
  { value: "universidad", label: "Universidad" },
  { value: "academia", label: "Academia" },
  { value: "centro_tecnico", label: "Centro Técnico" },
]

const institutionLevels = [
  { value: "inicial", label: "Inicial (3-5 años)" },
  { value: "primaria", label: "Primaria (6-11 años)" },
  { value: "secundaria", label: "Secundaria (12-17 años)" },
  { value: "primaria_secundaria", label: "Primaria y Secundaria" },
  { value: "superior", label: "Superior / Universitario" },
  { value: "tecnico", label: "Técnico Productivo" },
]

const modalities = [
  { value: "presencial", label: "Presencial" },
  { value: "virtual", label: "Virtual" },
  { value: "hibrido", label: "Híbrido (Semipresencial)" },
]

const shifts = [
  { value: "mañana", label: "Mañana (7:00 - 1:00)" },
  { value: "tarde", label: "Tarde (1:00 - 7:00)" },
  { value: "noche", label: "Noche (6:00 - 10:00)" },
  { value: "completo", label: "Jornada Completa" },
  { value: "flexible", label: "Horario Flexible" },
]

const dependenceTypes = [
  { value: "nacional", label: "Nacional (MINEDU)" },
  { value: "regional", label: "Regional (UGEL)" },
  { value: "municipal", label: "Municipal" },
  { value: "privado", label: "Privado" },
  { value: "iglesia", label: "Iglesia / Religioso" },
  { value: "ong", label: "ONG / Fundación" },
]

type Mode = "free" | "demo"

const MODES: { id: Mode; title: string; days: number; desc: string; icon: any }[] = [
  { id: "free", title: "Gratis", days: 20, desc: "Tu institución real. Correo y contraseña propios.", icon: BadgeCheck },
  { id: "demo", title: "Demo", days: 15, desc: "Cuenta demo para probar EduNexus. Se marca como DEMO.", icon: Sparkles },
]

const defaultForm = {
  institutionName: "",
  type: "",
  level: "",
  modality: "",
  shift: "",
  dependence: "",
  department: "",
  province: "",
  district: "",
  address: "",
  reference: "",
  phone: "",
  phone2: "",
  website: "",
  directorName: "",
  directorDni: "",
  directorPhone: "",
  directorEmail: "",
  email: "",
  password: "",
  confirmPassword: "",
  totalStudents: "",
  totalTeachers: "",
  totalClassrooms: "",
  hasLab: false,
  hasLibrary: false,
  hasComputerRoom: false,
  hasPlayground: false,
  notes: "",
}

const defaultSchedule = {
  general_start: "07:00",
  general_end: "13:00",
  weekdays: [1, 2, 3, 4, 5] as number[],
  turnos: [] as any[],
}

export default function RegisterPage() {
  const [mode, setMode] = React.useState<Mode>("free")
  const [step, setStep] = React.useState(1)
  const [form, setForm] = React.useState(defaultForm)
  const [scheduleConfig, setScheduleConfig] = React.useState(defaultSchedule)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  const [instCode, setInstCode] = React.useState<string | null>(null)

  const totalSteps = 5
  const progress = (step / totalSteps) * 100

  const set = (k: keyof typeof defaultForm, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const stepValid = () => {
    if (step === 1) return form.institutionName && form.type && form.level
    if (step === 2) return form.department && form.province && form.district && form.address
    if (step === 3) return form.directorName && form.phone
    if (step === 4) return true
    if (step === 5) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return form.email && emailRegex.test(form.email) && form.password.length >= 8 && form.password === form.confirmPassword
    }
    return false
  }

  const stepError = (): string | null => {
    if (step === 1) {
      if (!form.institutionName) return "Ingresa el nombre de la institución"
      if (!form.type) return "Selecciona el tipo de institución"
      if (!form.level) return "Selecciona el nivel educativo"
    }
    if (step === 2) {
      if (!form.department) return "Selecciona el departamento"
      if (!form.province) return "Selecciona la provincia"
      if (!form.district) return "Selecciona el distrito"
      if (!form.address) return "Ingresa la dirección completa"
    }
    if (step === 3) {
      if (!form.directorName) return "Ingresa el nombre del director(a)"
      if (!form.phone) return "Ingresa el teléfono principal"
    }
    if (step === 4) return null
    if (step === 5) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Ingresa un correo válido"
      if (form.password.length < 8) return "La contraseña debe tener al menos 8 caracteres"
      if (form.password !== form.confirmPassword) return "Las contraseñas no coinciden"
    }
    return null
  }

  const next = () => {
    const err = stepError()
    if (err) { setError(err); return }
    setError(null)
    setStep((s) => Math.min(s + 1, totalSteps))
  }

  const selectedDept = departments.find((d) => d.name === form.department)
  const provincesList = selectedDept ? selectedDept.provinces.map((p) => p.name) : []
  const selectedProv = selectedDept?.provinces.find((p) => p.name === form.province)
  const districtsList = selectedProv ? selectedProv.districts : []

  const onSubmit = async () => {
    const err = stepError()
    if (err) { setError(err); return }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          institutionName: form.institutionName,
          type: form.type,
          level: form.level,
          modality: form.modality,
          shift: form.shift,
          dependence: form.dependence,
          department: form.department,
          province: form.province,
          district: form.district,
          address: form.address,
          reference: form.reference,
          phone: form.phone,
          phone2: form.phone2,
          website: form.website,
          fullName: form.directorName,
          directorDni: form.directorDni,
          directorPhone: form.directorPhone,
          directorEmail: form.directorEmail || form.email,
          totalStudents: form.totalStudents,
          totalTeachers: form.totalTeachers,
          totalClassrooms: form.totalClassrooms,
          hasLab: form.hasLab,
          hasLibrary: form.hasLibrary,
          hasComputerRoom: form.hasComputerRoom,
          hasPlayground: form.hasPlayground,
          scheduleConfig,
          email: form.email,
          password: form.password,
        }),
      })
      const result = await res.json()
      if (!res.ok) { setError(result.error); setLoading(false); return }
      setInstCode(result.institutionCode || null)
      setSuccess(true); setLoading(false)
      if (result.redirectTo) {
        setTimeout(() => { window.location.href = result.redirectTo }, 2500)
      }
    } catch { setError("Error de conexión"); setLoading(false) }
  }

  const modeInfo = MODES.find((m) => m.id === mode)!

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--sb-background)] p-4">
        <SbCard className="w-full max-w-md text-center p-8">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center"><Check className="text-emerald-400 h-6 w-6" /></div>
          <h2 className="text-2xl font-bold text-[var(--sb-on-surface)]">Institución Creada</h2>
          <p className="text-sm text-[var(--sb-on-surface-variant)]/60 mt-2">
            {mode === "demo"
              ? "Tu cuenta demo está lista. Durante 15 días hábiles podrás probar EduNexus con todos sus módulos."
              : "Tu cuenta ha sido creada exitosamente. Durante 20 días hábiles podrás usar EduNexus de forma gratuita."}
          </p>
          {instCode && (
            <div className="mt-4 rounded-xl bg-sb-surface-container p-4">
              <p className="text-[11px] text-[var(--sb-on-surface-variant)]/60 uppercase tracking-wider">Código de tu institución</p>
              <p className="mt-1 text-xl font-mono font-semibold text-[var(--sb-primary)]">{instCode}</p>
            </div>
          )}
          <Link href="/login" className="sb-btn filled rounded w-full mt-6 text-center"><span className="inline-flex items-center justify-center gap-2">Ir al Panel</span></Link>
          <p className="text-[11px] text-[var(--sb-on-surface-variant)]/40 mt-3">Te redirigiremos automáticamente a tu panel en unos segundos...</p>
        </SbCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--sb-background)] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <SbCard className="p-8">
          <div className="text-center mb-6">
            <Link href="/" className="inline-block">
              <Logo className="h-12 w-12 mx-auto" />
            </Link>
            <h2 className="text-2xl font-bold text-[var(--sb-on-surface)] mt-3">Registro de Institución</h2>
            <p className="text-sm text-[var(--sb-on-surface-variant)]/60 mt-1">Crea tu institución y empieza a gestionarla hoy</p>
          </div>

          {/* Modo seleccionador */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {MODES.map((m) => {
              const Icon = m.icon
              const isActive = mode === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { setMode(m.id); setError(null) }}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    isActive
                      ? "border-[var(--sb-primary)] bg-[var(--sb-primary)]/5 ring-1 ring-[var(--sb-primary)]"
                      : "border-[var(--sb-outline)]/30 bg-[var(--sb-surface-container)]/40 hover:border-[var(--sb-outline)]/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${isActive ? "text-[var(--sb-primary)]" : "text-sb-on-surface-variant/60"}`} />
                    <span className="text-sm font-semibold text-[var(--sb-on-surface)]">{m.title}</span>
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--sb-primary)]/15 text-[var(--sb-primary)]">{m.days} días</span>
                  </div>
                  <p className="text-[11px] text-sb-on-surface-variant/60 mt-1.5 text-left">{m.desc}</p>
                </button>
              )
            })}
          </div>

          {/* Progress */}
          <div className="mb-5">
            <div className="flex justify-between text-[11px] text-sb-on-surface-variant/60 mb-1.5">
              <span>Paso {step} de {totalSteps}</span>
              <span className="font-medium text-[var(--sb-primary)]">{["Datos Generales", "Ubicación", "Contacto y Director", "Infraestructura", "Acceso"][step - 1]}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[var(--sb-outline)]/10 overflow-hidden">
              <div className="h-full bg-[var(--sb-primary)] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {error && <div className="mb-4 p-3 text-sm text-red-400 bg-red-500/10 rounded-xl">{error}</div>}

          {/* Step 1: Datos Generales */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--sb-primary)]">
                <Building2 className="h-3.5 w-3.5" /> Datos Generales
              </div>
              <div>
                <SbLabel className="text-xs">Nombre de la Institución *</SbLabel>
                <SbInput id="institutionName" placeholder="IEP Ricardo Palma" value={form.institutionName} onChange={(e) => set("institutionName", e.target.value)} className="rounded-xl" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <SbLabel className="text-xs">Tipo de Institución *</SbLabel>
                  <select className="sb-select w-full rounded-xl" value={form.type} onChange={(e) => set("type", e.target.value)}>
                    <option value="">Seleccionar tipo...</option>
                    {institutionTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <SbLabel className="text-xs">Nivel Educativo *</SbLabel>
                  <select className="sb-select w-full rounded-xl" value={form.level} onChange={(e) => set("level", e.target.value)}>
                    <option value="">Seleccionar nivel...</option>
                    {institutionLevels.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <SbLabel className="text-xs">Modalidad</SbLabel>
                  <select className="sb-select w-full rounded-xl" value={form.modality} onChange={(e) => set("modality", e.target.value)}>
                    <option value="">Seleccionar modalidad...</option>
                    {modalities.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <SbLabel className="text-xs">Turno</SbLabel>
                  <select className="sb-select w-full rounded-xl" value={form.shift} onChange={(e) => set("shift", e.target.value)}>
                    <option value="">Seleccionar turno...</option>
                    {shifts.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <SbLabel className="text-xs">Dependencia</SbLabel>
                <select className="sb-select w-full rounded-xl" value={form.dependence} onChange={(e) => set("dependence", e.target.value)}>
                  <option value="">Seleccionar dependencia...</option>
                  {dependenceTypes.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Ubicación */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--sb-primary)]">
                <MapPin className="h-3.5 w-3.5" /> Ubicación
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <SbLabel className="text-xs">Departamento *</SbLabel>
                  <select className="sb-select w-full rounded-xl" value={form.department} onChange={(e) => { set("department", e.target.value); set("province", ""); set("district", "") }}>
                    <option value="">Seleccionar...</option>
                    {departments.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <SbLabel className="text-xs">Provincia *</SbLabel>
                  <select className="sb-select w-full rounded-xl" value={form.province} onChange={(e) => { set("province", e.target.value); set("district", "") }} disabled={!form.department}>
                    <option value="">{form.department ? "Seleccionar..." : "Elige departamento"}</option>
                    {provincesList.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <SbLabel className="text-xs">Distrito *</SbLabel>
                  <select className="sb-select w-full rounded-xl" value={form.district} onChange={(e) => set("district", e.target.value)} disabled={!form.province}>
                    <option value="">{form.province ? "Seleccionar..." : "Elige provincia"}</option>
                    {districtsList.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <SbLabel className="text-xs">Dirección Completa *</SbLabel>
                <SbInput placeholder="Av. Los Álamos 1234, Urb. Los Olivos" value={form.address} onChange={(e) => set("address", e.target.value)} className="rounded-xl" />
              </div>
              <div>
                <SbLabel className="text-xs">Referencia</SbLabel>
                <SbInput placeholder="Frente al parque, al lado de la farmacia" value={form.reference} onChange={(e) => set("reference", e.target.value)} className="rounded-xl" />
              </div>
              {form.department && form.province && form.district && (
                <div className="p-3 rounded-xl bg-[var(--sb-primary)]/5 border border-[var(--sb-primary)]/20">
                  <p className="text-sm text-[var(--sb-primary)] font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> {form.district}, {form.province}, {form.department}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Contacto y Director */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--sb-primary)]">
                <Phone className="h-3.5 w-3.5" /> Contacto y Director
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <SbLabel className="text-xs">Teléfono Principal *</SbLabel>
                  <SbInput placeholder="(01) 555-1234" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="rounded-xl" />
                </div>
                <div>
                  <SbLabel className="text-xs">Teléfono Secundario</SbLabel>
                  <SbInput placeholder="(01) 555-5678" value={form.phone2} onChange={(e) => set("phone2", e.target.value)} className="rounded-xl" />
                </div>
              </div>
              <div>
                <SbLabel className="text-xs">Sitio Web</SbLabel>
                <SbInput placeholder="https://iep-ricardo.edu.pe" value={form.website} onChange={(e) => set("website", e.target.value)} className="rounded-xl" />
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--sb-primary)] mt-2">
                <GraduationCap className="h-4 w-4" /> Director(a) / Rector(a)
              </div>
              <div>
                <SbLabel className="text-xs">Nombre Completo *</SbLabel>
                <SbInput placeholder="Juan Carlos Pérez López" value={form.directorName} onChange={(e) => set("directorName", e.target.value)} className="rounded-xl" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <SbLabel className="text-xs">DNI</SbLabel>
                  <SbInput placeholder="12345678" maxLength={8} value={form.directorDni} onChange={(e) => set("directorDni", e.target.value)} className="rounded-xl" />
                </div>
                <div>
                  <SbLabel className="text-xs">Teléfono</SbLabel>
                  <SbInput placeholder="999 888 777" value={form.directorPhone} onChange={(e) => set("directorPhone", e.target.value)} className="rounded-xl" />
                </div>
              </div>
              <div>
                <SbLabel className="text-xs">Email del Director(a)</SbLabel>
                <SbInput type="email" placeholder="director@colegio.edu.pe" value={form.directorEmail} onChange={(e) => set("directorEmail", e.target.value)} className="rounded-xl" />
              </div>
            </div>
          )}

          {/* Step 4: Infraestructura y Capacidad */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--sb-primary)]">
                <Building2 className="h-3.5 w-3.5" /> Infraestructura y Capacidad
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <SbLabel className="text-xs">Total Alumnos</SbLabel>
                  <SbInput type="number" placeholder="450" value={form.totalStudents} onChange={(e) => set("totalStudents", e.target.value)} className="rounded-xl" />
                </div>
                <div>
                  <SbLabel className="text-xs">Total Docentes</SbLabel>
                  <SbInput type="number" placeholder="25" value={form.totalTeachers} onChange={(e) => set("totalTeachers", e.target.value)} className="rounded-xl" />
                </div>
                <div>
                  <SbLabel className="text-xs">Aulas</SbLabel>
                  <SbInput type="number" placeholder="18" value={form.totalClassrooms} onChange={(e) => set("totalClassrooms", e.target.value)} className="rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "hasLab", label: "Laboratorio" },
                  { key: "hasLibrary", label: "Biblioteca" },
                  { key: "hasComputerRoom", label: "Sala de Cómputo" },
                  { key: "hasPlayground", label: "Patio Deportivo" },
                ].map((item) => {
                  const active = (form as any)[item.key]
                  return (
                    <label
                      key={item.key}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        active ? "border-[var(--sb-primary)] bg-[var(--sb-primary)]/5" : "border-[var(--sb-outline)]/30"
                      }`}
                    >
                      <div
                        className={`h-5 w-5 rounded-md border flex items-center justify-center ${
                          active ? "bg-[var(--sb-primary)] border-[var(--sb-primary)]" : "border-[var(--sb-outline)]"
                        }`}
                        onClick={() => setForm((f: any) => ({ ...f, [item.key]: !(f as any)[item.key] }))}
                      >
                        {active && <Check className="h-3 w-3 text-[var(--sb-on-surface)]" />}
                      </div>
                      <span className="text-sm">{item.label}</span>
                    </label>
                  )
                })}
              </div>
              <div>
                <SbLabel className="text-xs">Observaciones</SbLabel>
                <SbInput placeholder="Notas adicionales sobre la institución..." value={form.notes} onChange={(e) => set("notes", e.target.value)} className="rounded-xl" />
              </div>
              <div className="p-4 rounded-xl border border-[var(--sb-outline)]/30 bg-sb-surface-container/50 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--sb-primary)]">
                  <span>Configuración de Horarios</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <SbLabel className="text-[11px]">Hora Inicio Jornada</SbLabel>
                    <input type="time" value={scheduleConfig.general_start} onChange={(e) => setScheduleConfig({ ...scheduleConfig, general_start: e.target.value })} className="sb-select w-full rounded-lg text-[13px]" />
                  </div>
                  <div className="space-y-1.5">
                    <SbLabel className="text-[11px]">Hora Fin Jornada</SbLabel>
                    <input type="time" value={scheduleConfig.general_end} onChange={(e) => setScheduleConfig({ ...scheduleConfig, general_end: e.target.value })} className="sb-select w-full rounded-lg text-[13px]" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <SbLabel className="text-[11px]">Días de Clase</SbLabel>
                  <div className="flex gap-1.5">
                    {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => {
                      const dayNum = i + 1
                      const active = scheduleConfig.weekdays.includes(dayNum)
                      return (
                        <button
                          key={dayNum}
                          type="button"
                          onClick={() => {
                            const weekdays = active
                              ? scheduleConfig.weekdays.filter((x) => x !== dayNum)
                              : [...scheduleConfig.weekdays, dayNum].sort()
                            setScheduleConfig({ ...scheduleConfig, weekdays })
                          }}
                          className={`h-8 w-8 rounded-lg text-[11px] font-medium transition-all ${
                            active ? "bg-[var(--sb-primary)] text-[var(--sb-on-primary)]" : "bg-sb-surface-container-high text-sb-on-surface-variant/70"
                          }`}
                        >
                          {d}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Acceso */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--sb-primary)]">
                <Lock className="h-3.5 w-3.5" /> Acceso al Panel
              </div>
              <p className="text-[11px] text-sb-on-surface-variant/60">Con estas credenciales entrarás como director(a) a EduNexus (panel director). Guarda tu contraseña.</p>
              <div>
                <SbLabel className="text-xs">Correo Electrónico *</SbLabel>
                <SbInput type="email" placeholder="director@colegio.edu.pe" value={form.email} onChange={(e) => set("email", e.target.value)} className="rounded-xl" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <SbLabel className="text-xs">Contraseña *</SbLabel>
                  <SbInput type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={(e) => set("password", e.target.value)} className="rounded-xl" />
                </div>
                <div>
                  <SbLabel className="text-xs">Confirmar Contraseña *</SbLabel>
                  <SbInput type="password" placeholder="Repite la contraseña" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} className="rounded-xl" />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-sb-surface-container border border-[var(--sb-outline)]/20">
                <p className="text-[10px] uppercase tracking-wider text-sb-on-surface-variant/60 font-semibold">Resumen</p>
                <div className="mt-2 space-y-1 text-sm">
                  <p className="text-[var(--sb-on-surface)] font-medium">{form.institutionName}</p>
                  <p className="text-xs text-sb-on-surface-variant/70">
                    {institutionTypes.find((t) => t.value === form.type)?.label} · {institutionLevels.find((l) => l.value === form.level)?.label}
                    {form.modality ? ` · ${modalities.find((m) => m.value === form.modality)?.label}` : ""}
                  </p>
                  <p className="text-xs text-sb-on-surface-variant/70">{form.district}, {form.province}, {form.department}</p>
                  <p className="text-xs pt-1">
                    <span className="font-medium text-[var(--sb-primary)]">{modeInfo.title} — {modeInfo.days} días hábiles de prueba</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3 mt-6">
            <SbBtn variant="outlined" size="sm" rounded onClick={() => { setStep((s) => Math.max(s - 1, 1)); setError(null) }} disabled={step === 1} className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" /> Atrás
            </SbBtn>
            {step < totalSteps ? (
              <SbBtn variant="filled" size="sm" rounded onClick={next} className="flex items-center gap-1">
                Siguiente <ChevronRight className="h-4 w-4" />
              </SbBtn>
            ) : (
              <SbBtn variant="filled" size="sm" rounded onClick={onSubmit} disabled={loading} className="flex items-center gap-1">
                {loading ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creando...</span> : <>Crear Institución <Check className="h-4 w-4" /></>}
              </SbBtn>
            )}
          </div>

          <div className="mt-6 text-center text-sm text-[var(--sb-on-surface-variant)]/50">
            ¿Ya tienes cuenta? <Link href="/login" className="text-[var(--sb-primary)] hover:underline font-medium">Iniciar sesión</Link>
          </div>
        </SbCard>
      </div>
    </div>
  )
}