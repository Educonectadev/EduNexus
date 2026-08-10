"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { User, Mail, Calendar, Shield, Phone, Save, Key, Eye, EyeOff, CheckCircle, Fingerprint, Building2, Globe, AlertTriangle, Pencil, Lock, Palette, Moon, Sun } from "@/components/ui/proicons"

interface UserProfile {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
  role: string
  institutionId: string | null
  phone?: string
  dni?: string
  createdAt?: string
}

interface ThemeOption { name: string; mode: "light" | "dark"; variant: string; colors: [string, string, string] }
const THEMES: ThemeOption[] = [
  { name: "Claro",   mode: "light", variant: "",      colors: ["#e4e2e6", "#ffffff", "#f7f2f7"] },
  { name: "Oscuro",  mode: "dark",  variant: "",      colors: ["#1b1b1f", "#000000", "#1b1b1f"] },
  { name: "OLED",    mode: "dark",  variant: "oled",  colors: ["#000000", "#000000", "#000000"] },
  { name: "Azul",    mode: "light", variant: "blue",  colors: ["#b3c8ec", "#c9ddf7", "#d4e6ff"] },
  { name: "Rojo",    mode: "light", variant: "red",   colors: ["#e4bdb6", "#fdd2cb", "#ffddd6"] },
  { name: "Naranja", mode: "light", variant: "orange",colors: ["#e3c0aa", "#fdd6bf", "#ffe0cc"] },
  { name: "Violeta", mode: "dark",  variant: "violet",colors: ["#1e1029", "#2d1740", "#1e1029"] },
]

const roleLabels: Record<string, string> = {
  dev: "Developer", admin: "Administrador", director: "Director",
  secretario: "Secretario", apoderado: "Apoderado",
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
}

const sectionHeader = (icon: React.ReactNode, color: string, title: string) => (
  <div className="flex items-center gap-3">
    <div className={`h-8 w-8 rounded-xl ${color} flex items-center justify-center shrink-0`}>
      {icon}
    </div>
    <p className="text-[11px] text-sb-on-surface/60 uppercase tracking-wider font-semibold">{title}</p>
  </div>
)

export default function DevPerfilPage() {
  const { setTheme, resolvedTheme } = useTheme()
  const [themeVariant, setThemeVariant] = React.useState<string>("")
  const [profile, setProfile] = React.useState<UserProfile | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [editMode, setEditMode] = React.useState(false)
  const [fullName, setFullName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [dni, setDni] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [showPassForm, setShowPassForm] = React.useState(false)
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showCurrent, setShowCurrent] = React.useState(false)
  const [showNew, setShowNew] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [changingPass, setChangingPass] = React.useState(false)
  const [toast, setToast] = React.useState<{ message: string; type: string } | null>(null)
  const [toastKey, setToastKey] = React.useState(0)

  const showToast = (message: string, type: string) => {
    setToast({ message, type })
    setToastKey(k => k + 1)
    setTimeout(() => setToast(null), 3000)
  }

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sb-theme-variant") || ""
      setThemeVariant(saved)
      if (saved) document.documentElement.setAttribute("data-theme", saved)
      else document.documentElement.removeAttribute("data-theme")
    }
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setProfile(d.user); setFullName(d.user.fullName || ""); setPhone(d.user.phone || ""); setDni(d.user.dni || "") } })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleTheme = (t: ThemeOption) => {
    setTheme(t.mode)
    setThemeVariant(t.variant)
    localStorage.setItem("sb-theme-variant", t.variant)
    if (t.variant) document.documentElement.setAttribute("data-theme", t.variant)
    else document.documentElement.removeAttribute("data-theme")
    showToast(`Tema aplicado: ${t.name}`, "success")
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/auth/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ full_name: fullName, phone, dni }) })
      if (res.ok) { setProfile(p => p ? { ...p, fullName, phone: phone || undefined, dni: dni || undefined } : p); setEditMode(false); showToast("Perfil actualizado", "success") }
      else { const e = await res.json(); showToast(e.error || "Error", "error") }
    } catch { showToast("Error de conexión", "error") } finally { setSaving(false) }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { showToast("Las contraseñas no coinciden", "error"); return }
    if (newPassword.length < 6) { showToast("Mínimo 6 caracteres", "error"); return }
    setChangingPass(true)
    try {
      const res = await fetch("/api/auth/change-password", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) })
      if (res.ok) { showToast("Contraseña actualizada", "success"); setShowPassForm(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword("") }
      else { const e = await res.json(); showToast(e.error || "Error", "error") }
    } catch { showToast("Error de conexión", "error") } finally { setChangingPass(false) }
  }

  const initials = profile?.fullName
    ? profile.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : profile?.email?.slice(0, 2).toUpperCase() || "?"

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 rounded-full border-2 border-sb-outline-variant border-t-sb-primary animate-spin" />
        <span className="text-[13px] text-sb-on-surface/50">Cargando perfil...</span>
      </div>
    </div>
  )

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full max-w-[920px] mx-auto space-y-5 md:space-y-6 py-2 md:py-4">
      {/* Toast */}
      {toast && (
        <motion.div
          key={toastKey}
          initial={{ opacity: 0, y: -14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -14, scale: 0.96 }}
          className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 px-4 py-3 rounded-xl text-[13px] font-medium shadow-lg text-center sm:text-left ${
            toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          <div className="flex items-center justify-center sm:justify-start gap-2">
            {toast.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
            {toast.message}
          </div>
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <h2 className="text-[22px] md:text-[24px] font-bold tracking-tight text-sb-on-surface">Mi Perfil</h2>
        <p className="text-[13px] text-sb-on-surface/70 mt-1">Información personal y configuración de cuenta</p>
      </motion.div>

      {/* Profile Header */}
      <motion.div variants={fadeUp} className="relative overflow-hidden rounded-3xl bg-sb-on-surface p-6 md:p-8 text-sb-surface">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle at 15% 25%, #fff 0, transparent 40%), radial-gradient(circle at 85% 0%, #fff 0, transparent 45%), radial-gradient(circle at 65% 100%, #fff 0, transparent 40%)",
        }} />
        <div className="absolute right-[-40px] top-[-40px] h-52 w-52 rounded-full blur-3xl bg-sb-primary/30" />
        <div className="absolute bottom-[-60px] left-[10%] h-40 w-40 rounded-full blur-3xl bg-violet-500/20" />

        <div className="relative flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover shrink-0 ring-2 ring-sb-surface/20" />
          ) : (
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-sb-surface/15 backdrop-blur-sm border border-sb-surface/15 flex items-center justify-center shrink-0">
              <span className="text-2xl md:text-3xl font-bold">{initials}</span>
            </div>
          )}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <h3 className="text-xl md:text-2xl font-bold tracking-tight truncate">{profile?.fullName || "Sin nombre"}</h3>
              <span className="w-fit sm:w-auto px-3 py-1 rounded-full bg-sb-primary text-sb-on-primary text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 mx-auto sm:mx-0">
                <Shield className="h-3 w-3" />
                {roleLabels[profile?.role || ""] || profile?.role || "—"}
              </span>
            </div>
            <p className="text-[13px] md:text-sm text-sb-surface/80 mt-1.5 truncate font-mono">{profile?.email}</p>
          </div>
          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-4 sm:gap-1.5 text-[11px] md:text-xs text-sb-surface/70 shrink-0">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("es-PE") : "—"}
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <Fingerprint className="h-3.5 w-3.5" />
              {profile?.id?.slice(0, 12)}...
            </span>
          </div>
        </div>
      </motion.div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-4 sm:p-5">
          {sectionHeader(<Shield className="h-4 w-4 text-sb-primary" />, "bg-sb-primary/10", "Información de cuenta")}
          <div className="space-y-2 mt-4">
            <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-sb-surface-container/60 transition-colors">
              <div className="h-8 w-8 rounded-lg bg-sb-surface-container flex items-center justify-center shrink-0">
                <Calendar className="h-3.5 w-3.5 text-sb-on-surface/50" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-sb-on-surface/50 uppercase tracking-wider">Miembro desde</p>
                <p className="text-[13px] text-sb-on-surface/80">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" }) : "—"}</p>
              </div>
            </div>
            {profile?.role !== "dev" && profile?.institutionId && (
              <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-sb-surface-container/60 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-sb-surface-container flex items-center justify-center shrink-0">
                  <Building2 className="h-3.5 w-3.5 text-sb-on-surface/50" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-sb-on-surface/50 uppercase tracking-wider">Institución</p>
                  <p className="text-[13px] text-sb-on-surface/80 truncate font-mono">{profile.institutionId}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-sb-surface-container/60 transition-colors">
              <div className="h-8 w-8 rounded-lg bg-sb-surface-container flex items-center justify-center shrink-0">
                <Fingerprint className="h-3.5 w-3.5 text-sb-on-surface/50" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-sb-on-surface/50 uppercase tracking-wider">ID de usuario</p>
                <p className="text-[12px] text-sb-on-surface/70 font-mono truncate">{profile?.id}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-4 sm:p-5">
          {sectionHeader(<Globe className="h-4 w-4 text-emerald-500" />, "bg-emerald-500/10", "Sesión activa")}
          <div className="relative overflow-hidden p-3.5 sm:p-4 rounded-xl bg-sb-surface-container-high border border-emerald-500/10 mt-4">
            <div className="absolute right-[-16px] top-[-16px] h-20 w-20 rounded-full bg-emerald-500/10 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Globe className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-sb-on-surface/80">Esta sesión</p>
                <p className="text-[11px] text-sb-on-surface/60 mt-0.5 truncate">Web — {typeof navigator !== "undefined" ? navigator.platform : "—"}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-full bg-emerald-500/10">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-500 font-semibold">Activa</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Personal Data */}
      <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-sb-outline-variant/10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-sb-on-surface/60">Datos personales</p>
              <p className="text-[12px] text-sb-on-surface/70 mt-0.5">Edita tu información de perfil</p>
            </div>
          </div>
          {!editMode && (
            <button onClick={() => setEditMode(true)} className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-[12px] font-medium bg-sb-on-surface text-sb-surface hover:opacity-90 transition-opacity">
              <Pencil className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Editar</span>
            </button>
          )}
        </div>

        <div className="p-4 sm:p-5">
          {editMode ? (
            <div className="space-y-4">
              {[
                { label: "Nombre completo", value: fullName, set: setFullName, placeholder: "Tu nombre completo", icon: User },
                { label: "Teléfono", value: phone, set: setPhone, placeholder: "+51 999 999 999", icon: Phone },
                { label: "DNI", value: dni, set: setDni, placeholder: "12345678", icon: Fingerprint, maxLength: 8 },
              ].map((field) => (
                <div key={field.label}>
                  <p className="text-[11px] text-sb-on-surface/60 uppercase tracking-wider mb-2">{field.label}</p>
                  <div className="relative">
                    <field.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface/50" />
                    <input
                      value={field.value}
                      onChange={e => field.set(e.target.value)}
                      placeholder={field.placeholder}
                      maxLength={field.maxLength}
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-sb-surface-container text-[14px] text-sb-on-surface placeholder:text-sb-on-surface/50 focus:outline-none focus:ring-2 focus:ring-sb-primary/30"
                    />
                  </div>
                </div>
              ))}
              <div>
                <p className="text-[11px] text-sb-on-surface/60 uppercase tracking-wider mb-2">Email</p>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface/50" />
                  <input value={profile?.email || ""} disabled
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-sb-surface-container text-[14px] text-sb-on-surface/70 cursor-not-allowed" />
                </div>
                <p className="text-[10px] text-sb-on-surface/60 mt-1">El email no se puede cambiar</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 h-11 sm:h-10 px-5 rounded-xl bg-sb-on-surface text-sb-surface text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                  {saving ? <div className="w-4 h-4 border-2 border-sb-surface/30 border-t-sb-surface rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
                <button onClick={() => { setEditMode(false); setFullName(profile?.fullName || ""); setPhone(profile?.phone || ""); setDni(profile?.dni || "") }}
                  className="h-11 sm:h-10 px-4 rounded-xl text-[13px] font-medium text-sb-on-surface/70 hover:bg-sb-surface-container-high transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Nombre", value: profile?.fullName || "—", icon: User },
                { label: "Email", value: profile?.email || "—", icon: Mail },
                { label: "Teléfono", value: profile?.phone || "—", icon: Phone },
                { label: "DNI", value: profile?.dni || "—", icon: Fingerprint },
              ].map((field, i) => (
                <div key={field.label} className="flex items-center gap-3 p-3 rounded-xl bg-sb-surface-container/60">
                  <div className="h-8 w-8 rounded-lg bg-sb-surface-container-high flex items-center justify-center shrink-0">
                    <field.icon className="h-3.5 w-3.5 text-sb-on-surface/50" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-sb-on-surface/50 uppercase tracking-wider">{field.label}</p>
                    <p className="text-[13px] text-sb-on-surface/80 truncate break-all">{field.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Password */}
      <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-sb-outline-variant/10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <Lock className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-sb-on-surface/60">Contraseña</p>
              <p className="text-[12px] text-sb-on-surface/70 mt-0.5">Actualiza tu contraseña de acceso</p>
            </div>
          </div>
          {!showPassForm && (
            <button onClick={() => setShowPassForm(true)} className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-[12px] font-medium bg-sb-on-surface text-sb-surface hover:opacity-90 transition-opacity">
              <Key className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cambiar</span>
            </button>
          )}
        </div>

        <div className="p-4 sm:p-5">
          {showPassForm ? (
            <form onSubmit={handleChangePassword} className="space-y-4">
              {[
                { label: "Contraseña actual", value: currentPassword, set: setCurrentPassword, show: showCurrent, setShow: setShowCurrent, icon: Key },
                { label: "Nueva contraseña", value: newPassword, set: setNewPassword, show: showNew, setShow: setShowNew, icon: Fingerprint },
                { label: "Confirmar nueva contraseña", value: confirmPassword, set: setConfirmPassword, show: showConfirm, setShow: setShowConfirm, icon: CheckCircle },
              ].map((field) => (
                <div key={field.label}>
                  <p className="text-[11px] text-sb-on-surface/60 uppercase tracking-wider mb-2">{field.label}</p>
                  <div className="relative">
                    <field.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface/50" />
                    <input
                      type={field.show ? "text" : "password"}
                      value={field.value}
                      onChange={e => field.set(e.target.value)}
                      className="w-full h-11 pl-10 pr-12 rounded-xl bg-sb-surface-container text-[14px] text-sb-on-surface placeholder:text-sb-on-surface/50 focus:outline-none focus:ring-2 focus:ring-sb-primary/30"
                      placeholder="••••••••"
                      required
                      minLength={field.label.includes("actual") ? undefined : 6}
                    />
                    <button type="button" onClick={() => field.setShow(!field.show)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-sb-surface-container transition-colors">
                      {field.show ? <EyeOff className="h-4 w-4 text-sb-on-surface/50" /> : <Eye className="h-4 w-4 text-sb-on-surface/50" />}
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button type="submit" disabled={changingPass}
                  className="flex-1 flex items-center justify-center gap-2 h-11 sm:h-10 px-5 rounded-xl bg-sb-on-surface text-sb-surface text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                  {changingPass ? <div className="w-4 h-4 border-2 border-sb-surface/30 border-t-sb-surface rounded-full animate-spin" /> : <Key className="h-4 w-4" />}
                  {changingPass ? "Actualizando..." : "Actualizar contraseña"}
                </button>
                <button type="button" onClick={() => { setShowPassForm(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword("") }}
                  className="h-11 sm:h-10 px-4 rounded-xl text-[13px] font-medium text-sb-on-surface/70 hover:bg-sb-surface-container-high transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3.5 rounded-xl bg-sb-surface-container/60">
              <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <Key className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-sb-on-surface/80">Seguridad de acceso</p>
                <p className="text-[11px] text-sb-on-surface/60 mt-0.5">Actualiza tu contraseña periódicamente para mantener tu cuenta segura.</p>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 w-fit">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-emerald-500 font-semibold">Protegida</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Theme */}
      <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
              <Palette className="h-4 w-4 text-violet-500" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-sb-on-surface/60">Tema de la app</p>
              <p className="text-[12px] text-sb-on-surface/70 mt-0.5">Modo claro, oscuro o con acento</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            {resolvedTheme === "dark" ? <Moon className="h-3.5 w-3.5 text-sb-on-surface/50" /> : <Sun className="h-3.5 w-3.5 text-sb-on-surface/50" />}
            <span className="text-[11px] text-sb-on-surface/60 font-medium">{resolvedTheme === "dark" ? "Modo oscuro" : "Modo claro"}</span>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-7 sm:overflow-visible sm:pb-0">
          {THEMES.map(t => {
            const isActive = (resolvedTheme === t.mode) && (themeVariant === t.variant)
            return (
              <motion.div
                key={t.name}
                layout
                className="flex flex-col items-center gap-2 shrink-0 w-[52px] sm:w-auto"
              >
                <motion.button
                  animate={{ borderRadius: isActive ? "14px" : "50%", scale: isActive ? 1.08 : 1 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22, mass: 0.6 }}
                  onClick={() => handleTheme(t)}
                  className={`relative w-full aspect-square overflow-hidden border-none cursor-pointer ${
                    isActive ? "ring-4 ring-sb-primary" : "hover:ring-2 hover:ring-sb-outline-variant/30"
                  }`}
                  style={{ borderRadius: isActive ? 14 : "50%" }}
                >
                  <span className="absolute left-0 top-0 w-1/2 h-full" style={{ background: t.colors[0], borderRadius: isActive ? "14px 0 0 14px" : "50% 0 0 50%" }} />
                  <span className="absolute right-0 top-0 w-1/2 h-1/2" style={{ background: t.colors[1], borderRadius: isActive ? "0 14px 0 0" : "0 50% 0 0" }} />
                  <span className="absolute right-0 bottom-0 w-1/2 h-1/2" style={{ background: t.colors[2], borderRadius: isActive ? "0 0 14px 0" : "0 0 50% 0" }} />
                </motion.button>
                <span className={`text-[10px] ${isActive ? "text-sb-on-surface font-semibold" : "text-sb-on-surface/70"}`}>
                  {t.name}
                </span>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}