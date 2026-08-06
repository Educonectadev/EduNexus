"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { User, Mail, Calendar, Shield, Phone, Save, Key, Eye, EyeOff, CheckCircle, Fingerprint, Building2, Globe } from "@/components/ui/proicons"

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

interface ThemeOption {
  name: string; mode: "light" | "dark"; variant: string; colors: [string, string, string]
}
const THEMES: ThemeOption[] = [
  { name: "Claro",  mode: "light", variant: "",     colors: ["#e4e2e6", "#ffffff", "#f7f2f7"] },
  { name: "Oscuro", mode: "dark",  variant: "",     colors: ["#1b1b1f", "#000000", "#1b1b1f"] },
  { name: "OLED",   mode: "dark",  variant: "oled",  colors: ["#000000", "#000000", "#000000"] },
  { name: "Azul",   mode: "light", variant: "blue",  colors: ["#b3c8ec", "#c9ddf7", "#d4e6ff"] },
  { name: "Rojo",   mode: "light", variant: "red",   colors: ["#e4bdb6", "#fdd2cb", "#ffddd6"] },
  { name: "Naranja",mode: "light", variant: "orange",colors: ["#e3c0aa", "#fdd6bf", "#ffe0cc"] },
  { name: "Violeta",mode: "dark",  variant: "violet",colors: ["#1e1029", "#2d1740", "#1e1029"] },
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

  const showToast = (message: string, type: string) => {
    setToast({ message, type })
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
    showToast(`Tema: ${t.name}`, "success")
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
    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full max-w-[900px] mx-auto space-y-6 py-2">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 px-4 py-3 rounded-xl text-[13px] font-medium shadow-lg text-center sm:text-left ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <motion.div variants={fadeUp}>
        <h2 className="text-[20px] sm:text-[26px] font-bold tracking-tight text-sb-on-surface">Mi Perfil</h2>
        <p className="text-[12px] sm:text-[14px] text-sb-on-surface/60 mt-1">Información personal y configuración de cuenta</p>
      </motion.div>

      {/* Profile Header */}
      <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-5">
        {profile?.avatarUrl ? (
          <img src={profile.avatarUrl} alt="" className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shrink-0" />
        ) : (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-sb-surface-container-high flex items-center justify-center shrink-0">
            <span className="text-[20px] sm:text-[22px] font-bold text-sb-on-surface/40">{initials}</span>
          </div>
        )}
        <div className="flex-1 text-center sm:text-left min-w-0">
          <h3 className="text-[16px] sm:text-[18px] font-semibold text-sb-on-surface truncate">{profile?.fullName || "Sin nombre"}</h3>
          <p className="text-[12px] sm:text-[13px] text-sb-on-surface/50 mt-0.5 truncate">{profile?.email}</p>
        </div>
        <span className="px-3 py-1.5 rounded-full bg-sb-primary/10 text-sb-primary text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider shrink-0">
          {roleLabels[profile?.role || ""] || profile?.role || "—"}
        </span>
      </motion.div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-4 sm:p-5">
          <p className="text-[11px] text-sb-on-surface/40 uppercase tracking-wider mb-4">Información de cuenta</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-sb-on-surface/30 shrink-0" />
              <span className="text-[12px] sm:text-[13px] text-sb-on-surface/60">Miembro desde {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("es-PE") : "—"}</span>
            </div>
            {profile?.role !== "dev" && profile?.institutionId && (
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-sb-on-surface/30 shrink-0" />
                <span className="text-[12px] sm:text-[13px] text-sb-on-surface/60 truncate">Institución: {profile.institutionId}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-sb-on-surface/30 shrink-0" />
              <span className="text-[11px] sm:text-[12px] text-sb-on-surface/50 font-mono truncate">ID: {profile?.id?.slice(0, 16)}...</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-4 sm:p-5">
          <p className="text-[11px] text-sb-on-surface/40 uppercase tracking-wider mb-4">Sesión activa</p>
          <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-sb-surface-container-high">
            <Globe className="h-5 w-5 text-sb-on-surface/30 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] sm:text-[13px] font-medium text-sb-on-surface/80">Esta sesión</p>
              <p className="text-[10px] sm:text-[11px] text-sb-on-surface/40 mt-0.5 truncate">Web — {typeof navigator !== "undefined" ? navigator.platform : "—"}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] sm:text-[11px] text-emerald-500 font-medium">Activa</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Personal Data */}
      <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] text-sb-on-surface/40 uppercase tracking-wider">Datos personales</p>
            <p className="text-[12px] text-sb-on-surface/40 mt-1">Edita tu información de perfil</p>
          </div>
          {!editMode && (
            <button onClick={() => setEditMode(true)} className="px-3 py-1.5 rounded-lg text-[12px] text-sb-on-surface/50 hover:bg-sb-surface-container-high transition-colors">
              Editar
            </button>
          )}
        </div>

        {editMode ? (
          <div className="space-y-4">
            {[
              { label: "Nombre completo", value: fullName, set: setFullName, placeholder: "Tu nombre completo", icon: User },
              { label: "Teléfono", value: phone, set: setPhone, placeholder: "+51 999 999 999", icon: Phone },
              { label: "DNI", value: dni, set: setDni, placeholder: "12345678", icon: Fingerprint, maxLength: 8 },
            ].map((field) => (
              <div key={field.label}>
                <p className="text-[11px] text-sb-on-surface/40 uppercase tracking-wider mb-2">{field.label}</p>
                <div className="relative">
                  <field.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface/30" />
                  <input
                    value={field.value}
                    onChange={e => field.set(e.target.value)}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-sb-surface-container-high border border-sb-outline-variant/10 text-[14px] text-sb-on-surface focus:outline-none focus:ring-2 focus:ring-sb-primary/20 transition-all"
                  />
                </div>
              </div>
            ))}
            <div>
              <p className="text-[11px] text-sb-on-surface/40 uppercase tracking-wider mb-2">Email</p>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface/30" />
                <input value={profile?.email || ""} disabled
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-sb-surface-container-high border border-sb-outline-variant/10 text-[14px] text-sb-on-surface/50 cursor-not-allowed" />
              </div>
              <p className="text-[10px] text-sb-on-surface/20 mt-1">El email no se puede cambiar</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sb-on-surface text-white text-[13px] font-medium hover:bg-sb-on-surface/90 transition-all disabled:opacity-50">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
              <button onClick={() => { setEditMode(false); setFullName(profile?.fullName || ""); setPhone(profile?.phone || ""); setDni(profile?.dni || "") }}
                className="px-4 py-2.5 rounded-xl text-[13px] text-sb-on-surface/50 hover:bg-sb-surface-container-high transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {[
              { label: "Nombre", value: profile?.fullName || "—" },
              { label: "Email", value: profile?.email || "—" },
              { label: "Teléfono", value: profile?.phone || "—" },
              { label: "DNI", value: profile?.dni || "—" },
            ].map((field) => (
              <div key={field.label} className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3">
                <span className="text-[11px] text-sb-on-surface/40 uppercase tracking-wider sm:w-20 shrink-0">{field.label}</span>
                <span className="text-[14px] text-sb-on-surface/80 break-all sm:break-normal">{field.value}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Password */}
      <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] text-sb-on-surface/40 uppercase tracking-wider">Contraseña</p>
            <p className="text-[12px] text-sb-on-surface/40 mt-1">Actualiza tu contraseña de acceso</p>
          </div>
          {!showPassForm && (
            <button onClick={() => setShowPassForm(true)} className="px-3 py-1.5 rounded-lg text-[12px] text-sb-on-surface/50 hover:bg-sb-surface-container-high transition-colors">
              Cambiar
            </button>
          )}
        </div>

        {showPassForm && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            {[
              { label: "Contraseña actual", value: currentPassword, set: setCurrentPassword, show: showCurrent, setShow: setShowCurrent, icon: Key },
              { label: "Nueva contraseña", value: newPassword, set: setNewPassword, show: showNew, setShow: setShowNew, icon: Fingerprint },
              { label: "Confirmar nueva contraseña", value: confirmPassword, set: setConfirmPassword, show: showConfirm, setShow: setShowConfirm, icon: CheckCircle },
            ].map((field) => (
              <div key={field.label}>
                <p className="text-[11px] text-sb-on-surface/40 uppercase tracking-wider mb-2">{field.label}</p>
                <div className="relative">
                  <field.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface/30" />
                  <input
                    type={field.show ? "text" : "password"}
                    value={field.value}
                    onChange={e => field.set(e.target.value)}
                    className="w-full h-11 pl-10 pr-12 rounded-xl bg-sb-surface-container-high border border-sb-outline-variant/10 text-[14px] text-sb-on-surface focus:outline-none focus:ring-2 focus:ring-sb-primary/20 transition-all"
                    placeholder="••••••••"
                    required
                    minLength={field.label.includes("actual") ? undefined : 6}
                  />
                  <button type="button" onClick={() => field.setShow(!field.show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-sb-surface-container transition-colors">
                    {field.show ? <EyeOff className="h-4 w-4 text-sb-on-surface/30" /> : <Eye className="h-4 w-4 text-sb-on-surface/30" />}
                  </button>
                </div>
              </div>
            ))}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button type="submit" disabled={changingPass}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sb-on-surface text-white text-[13px] font-medium hover:bg-sb-on-surface/90 transition-all disabled:opacity-50">
                {changingPass ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Key className="h-4 w-4" />}
                {changingPass ? "Actualizando..." : "Actualizar contraseña"}
              </button>
              <button type="button" onClick={() => { setShowPassForm(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword("") }}
                className="px-4 py-2.5 rounded-xl text-[13px] text-sb-on-surface/50 hover:bg-sb-surface-container-high transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        )}
      </motion.div>

      {/* Theme */}
      <motion.div variants={fadeUp} className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-4 sm:p-5">
        <p className="text-[11px] text-sb-on-surface/40 uppercase tracking-wider mb-4">Tema de la app</p>
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
                  animate={{
                    borderRadius: isActive ? "14px" : "50%",
                    scale: isActive ? 1.08 : 1,
                  }}
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
                <span className={`text-[10px] ${isActive ? "text-sb-on-surface font-semibold" : "text-sb-on-surface/40"}`}>
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
