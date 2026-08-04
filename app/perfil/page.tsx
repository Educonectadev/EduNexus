"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { User, Mail, Calendar, Shield, Phone, Save, Key, Eye, EyeOff, Fingerprint, Building2, LogOut, Layers, Globe, Sparkles, Check } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/sb"
import { DesignSelector } from "@/components/ui/design-selector"
import { useDesign } from "@/contexts/design-context"

type V = "classic" | "minimal"

interface UserProfile {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
  role: string
  institutionId: string | null
  phone?: string
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
  { name: "Verde",  mode: "dark",  variant: "green", colors: ["#0a1f14", "#003d23", "#0a1f14"] },
  { name: "Rojo",   mode: "light", variant: "red",   colors: ["#e4bdb6", "#fdd2cb", "#ffddd6"] },
  { name: "Naranja",mode: "light", variant: "orange",colors: ["#e3c0aa", "#fdd6bf", "#ffe0cc"] },
]
const PERFIL_DESIGNS = [
  { id: "stepbro-money", label: "Clásico", desc: "Diseño del sistema original" },
  { id: "minimal", label: "Minimal", desc: "Aplica el estilo Minimal a todo el panel" },
]

const roleLabels: Record<string, string> = {
  dev: "Developer", super_admin: "Super Admin", admin: "Administrador", director: "Director",
  secretario: "Secretario", docente: "Docente", padre: "Apoderado",
}

const spring = { type: "spring", stiffness: 400, damping: 32, mass: 0.7 } as const
const fadeUp = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } } as const

interface PerfilData {
  profile: UserProfile | null
  initials: string
  fullName: string; setFullName: (s: string) => void
  phone: string; setPhone: (s: string) => void
  editMode: boolean; setEditMode: (b: boolean) => void
  saving: boolean; handleSave: () => void
  handleLogout: () => void
  showPassForm: boolean; setShowPassForm: (b: boolean) => void
  currentPassword: string; setCurrentPassword: (s: string) => void
  newPassword: string; setNewPassword: (s: string) => void
  confirmPassword: string; setConfirmPassword: (s: string) => void
  showCurrent: boolean; setShowCurrent: (b: boolean) => void
  showNew: boolean; setShowNew: (b: boolean) => void
  showConfirm: boolean; setShowConfirm: (b: boolean) => void
  changingPass: boolean; handleChangePassword: (e: React.FormEvent) => void
  themeVariant: string; resolvedTheme?: string; handleTheme: (t: ThemeOption) => void
}

const cardCls = (v: V) => v === "minimal"
  ? "rounded-xl border border-sb-outline-variant/40 bg-sb-surface-container-low/60 p-6"
  : "rounded-[26px] bg-sb-surface-container p-6"

const inputCls = (v: V) => v === "minimal"
  ? "w-full h-10 rounded-lg border border-sb-outline-variant/50 bg-transparent px-3.5 text-sm text-sb-on-surface outline-none transition-colors focus:border-sb-on-surface placeholder:text-sb-on-surface-variant/40"
  : "w-full h-10 rounded-xl bg-sb-surface-container-high px-3.5 text-sm text-sb-on-surface outline-none transition-colors focus:bg-sb-surface-container-highest placeholder:text-sb-on-surface-variant/40"

const btnPrimary = (v: V) => v === "minimal"
  ? "inline-flex items-center gap-2 rounded-lg bg-sb-on-surface px-5 py-2.5 text-xs font-semibold text-sb-surface transition-opacity hover:opacity-85 active:scale-[0.97] disabled:opacity-50"
  : "inline-flex items-center gap-2 rounded-full bg-sb-on-surface px-5 py-2.5 text-xs font-semibold text-sb-surface transition-transform active:scale-[0.97] disabled:opacity-50"

const btnGhost = "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-sb-on-surface-variant transition-colors hover:bg-sb-surface-container-high"

function getInitial(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback
  try { return localStorage.getItem(key) || fallback } catch { return fallback }
}

function SectionHeader({ icon: Icon, title, desc, action, v }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc?: string
  action?: React.ReactNode
  v: V
}) {
  if (v === "minimal") {
    return (
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-sb-outline-variant/30 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-sb-on-surface">{title}</h3>
          {desc && <p className="mt-0.5 text-xs text-sb-on-surface-variant/60">{desc}</p>}
        </div>
        {action}
      </div>
    )
  }
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sb-primary/10">
          <Icon className="h-4 w-4 text-sb-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-sb-on-surface">{title}</h3>
          {desc && <p className="mt-0.5 text-xs text-sb-on-surface-variant/60">{desc}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-sb-on-surface-variant/50">{children}</p>
)

function Avatar({ profile, initials, v }: { profile: UserProfile | null; initials: string; v: V }) {
  const img = profile?.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
  ) : (
    <div className="flex h-full w-full items-center justify-center">{initials}</div>
  )
  if (v === "minimal") {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-sb-surface-container-high text-base font-bold text-sb-on-surface-variant/60">
        {img}
      </div>
    )
  }
  return (
    <div className="relative shrink-0">
      <div className="h-20 w-20 overflow-hidden rounded-[22px] bg-sb-surface-container-high text-xl font-bold text-sb-on-surface-variant/60 ring-2 ring-sb-primary/30">
        {img}
      </div>
      <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-sb-primary text-sb-on-primary shadow-md">
        <Sparkles className="h-3 w-3" />
      </span>
    </div>
  )
}

function Hero({ d }: { d: PerfilData }) {
  return (
    <motion.section
      {...fadeUp} transition={{ ...spring, delay: 0.03 }}
      className="relative overflow-hidden rounded-[28px] bg-sb-surface-container p-6 md:p-8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-25"
        style={{ background: "radial-gradient(circle, var(--sb-primary), transparent 70%)" }}
      />
      <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <Avatar profile={d.profile} initials={d.initials} v="classic" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-bold tracking-tight">{d.profile?.fullName || "Sin nombre"}</h2>
            <span className="rounded-full bg-sb-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-sb-primary">
              {roleLabels[d.profile?.role || ""] || d.profile?.role || "—"}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-sb-on-surface-variant/70">{d.profile?.email}</p>
        </div>
        <button onClick={d.handleLogout} className={cn(btnGhost, "shrink-0 text-red-400/80 hover:bg-red-400/10 hover:text-red-400")}>
          <LogOut className="h-3.5 w-3.5" /> Salir
        </button>
      </div>
    </motion.section>
  )
}

function InfoSection({ v, d, className, delay }: { v: V; d: PerfilData; className?: string; delay: number }) {
  return (
    <motion.section {...fadeUp} transition={{ ...spring, delay }} className={cn(cardCls(v), className)}>
      <SectionHeader
        icon={User} v={v}
        title="Información personal"
        desc="Tus datos de contacto"
        action={!d.editMode ? (
          <button onClick={() => d.setEditMode(true)} className={btnGhost}><User className="h-3.5 w-3.5" /> Editar</button>
        ) : undefined}
      />

      {d.editMode ? (
        <div className="space-y-4">
          <div>
            <FieldLabel>Nombre completo</FieldLabel>
            <input value={d.fullName} onChange={e => d.setFullName(e.target.value)} className={inputCls(v)} placeholder="Tu nombre completo" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Teléfono</FieldLabel>
              <input value={d.phone} onChange={e => d.setPhone(e.target.value)} className={inputCls(v)} placeholder="+51 999 999 999" />
            </div>
            <div>
              <FieldLabel>Email</FieldLabel>
              <input value={d.profile?.email || ""} disabled className={cn(inputCls(v), "cursor-not-allowed opacity-50")} />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={d.handleSave} disabled={d.saving} className={btnPrimary(v)}>
              {d.saving ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sb-surface border-t-transparent" /> : <Save className="h-3.5 w-3.5" />}
              {d.saving ? "Guardando..." : "Guardar cambios"}
            </button>
            <button onClick={() => { d.setEditMode(false); d.setFullName(d.profile?.fullName || ""); d.setPhone("") }} className={btnGhost}>Cancelar</button>
          </div>
        </div>
      ) : v === "minimal" ? (
        <dl className="divide-y divide-sb-outline-variant/20">
          {[
            { icon: Mail, k: "Email", val: d.profile?.email },
            { icon: Phone, k: "Teléfono", val: d.profile?.phone || "—" },
            { icon: Calendar, k: "Miembro desde", val: d.profile?.createdAt ? new Date(d.profile.createdAt).toLocaleDateString("es-PE") : "—" },
            { icon: Shield, k: "ID", val: d.profile?.id?.slice(0, 16), mono: true },
          ].map(({ icon: Icon, k, val, mono }) => (
            <div key={k} className="flex items-center gap-4 py-3">
              <div className="w-32 shrink-0">
                <dt className="text-[10px] uppercase tracking-wider text-sb-on-surface-variant/40">{k}</dt>
              </div>
              <dd className={cn("flex-1 truncate text-sm", mono && "font-mono text-xs text-sb-on-surface-variant/70")}>{val}</dd>
            </div>
          ))}
          {d.profile?.role !== "dev" && d.profile?.institutionId && (
            <div className="flex items-center gap-4 py-3">
              <div className="w-32 shrink-0">
                <dt className="text-[10px] uppercase tracking-wider text-sb-on-surface-variant/40">Institución</dt>
              </div>
              <dd className="flex-1 truncate text-sm">{d.profile.institutionId}</dd>
            </div>
          )}
        </dl>
      ) : (
        <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {[
            { icon: Mail, k: "Email", v: d.profile?.email },
            { icon: Phone, k: "Teléfono", v: d.profile?.phone || "—" },
            { icon: Calendar, k: "Miembro desde", v: d.profile?.createdAt ? new Date(d.profile.createdAt).toLocaleDateString("es-PE") : "—" },
            { icon: Shield, k: "ID", v: d.profile?.id?.slice(0, 16), mono: true },
          ].map(({ icon: Icon, k, v, mono }) => (
            <div key={k} className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sb-surface-container-high">
                <Icon className="h-4 w-4 text-sb-on-surface-variant/50" />
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] uppercase tracking-wider text-sb-on-surface-variant/40">{k}</dt>
                <dd className={cn("truncate text-sm", mono && "font-mono text-xs text-sb-on-surface-variant/70")}>{v}</dd>
              </div>
            </div>
          ))}
          {d.profile?.role !== "dev" && d.profile?.institutionId && (
            <div className="flex items-center gap-3 sm:col-span-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sb-surface-container-high">
                <Building2 className="h-4 w-4 text-sb-on-surface-variant/50" />
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] uppercase tracking-wider text-sb-on-surface-variant/40">Institución</dt>
                <dd className="truncate text-sm">{d.profile.institutionId}</dd>
              </div>
            </div>
          )}
        </dl>
      )}
    </motion.section>
  )
}

function SessionSection({ v, d, className, delay }: { v: V; d: PerfilData; className?: string; delay: number }) {
  return (
    <motion.section {...fadeUp} transition={{ ...spring, delay }} className={cn(cardCls(v), "flex flex-col", className)}>
      <SectionHeader icon={Globe} title="Sesión" v={v} />
      {v === "minimal" ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-sb-outline-variant/40 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Esta sesión</p>
              <p className="mt-0.5 text-[11px] text-sb-on-surface-variant/50">Web — {typeof navigator !== "undefined" ? navigator.platform : "—"}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-[10px] font-medium text-emerald-400/80">Activa</span>
            </div>
          </div>
          <button onClick={d.handleLogout} className={cn(btnGhost, "text-red-400/80 hover:bg-red-400/10 hover:text-red-400")}>
            <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-2xl bg-sb-surface-container-high p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sb-surface-container-highest">
              <Globe className="h-4 w-4 text-sb-on-surface-variant/50" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Esta sesión</p>
              <p className="mt-0.5 text-[11px] text-sb-on-surface-variant/50">Web — {typeof navigator !== "undefined" ? navigator.platform : "—"}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-[10px] font-medium text-emerald-400/80">Activa</span>
            </div>
          </div>
          <button onClick={d.handleLogout} className={cn(btnGhost, "mt-auto self-start pt-4 text-red-400/80 hover:bg-red-400/10 hover:text-red-400")}>
            <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
          </button>
        </>
      )}
    </motion.section>
  )
}

function PasswordSection({ v, d, className, delay }: { v: V; d: PerfilData; className?: string; delay: number }) {
  const passInput = cn(inputCls(v), "pr-11")
  const toggle = "absolute right-3 top-[38px] text-sb-on-surface-variant/40 hover:text-sb-on-surface-variant"
  return (
    <motion.section {...fadeUp} transition={{ ...spring, delay }} className={cn(cardCls(v), className)}>
      <SectionHeader
        icon={Key} v={v}
        title="Contraseña"
        desc="Actualiza tu contraseña de acceso"
        action={!d.showPassForm ? (
          <button onClick={() => d.setShowPassForm(true)} className={btnGhost}><Key className="h-3.5 w-3.5" /> Cambiar</button>
        ) : undefined}
      />

      {d.showPassForm && (
        <form onSubmit={d.handleChangePassword} className="space-y-4">
          <div className="relative">
            <FieldLabel>Contraseña actual</FieldLabel>
            <input
              type={d.showCurrent ? "text" : "password"}
              value={d.currentPassword}
              onChange={e => d.setCurrentPassword(e.target.value)}
              className={passInput}
              placeholder="••••••••"
              required
            />
            <button type="button" onClick={() => d.setShowCurrent(!d.showCurrent)} className={toggle}>
              {d.showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative">
              <FieldLabel>Nueva contraseña</FieldLabel>
              <input
                type={d.showNew ? "text" : "password"}
                value={d.newPassword}
                onChange={e => d.setNewPassword(e.target.value)}
                className={passInput}
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button type="button" onClick={() => d.setShowNew(!d.showNew)} className={toggle}>
                {d.showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="relative">
              <FieldLabel>Confirmar contraseña</FieldLabel>
              <input
                type={d.showConfirm ? "text" : "password"}
                value={d.confirmPassword}
                onChange={e => d.setConfirmPassword(e.target.value)}
                className={passInput}
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button type="button" onClick={() => d.setShowConfirm(!d.showConfirm)} className={toggle}>
                {d.showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={d.changingPass} className={btnPrimary(v)}>
              {d.changingPass ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sb-surface border-t-transparent" /> : <Fingerprint className="h-3.5 w-3.5" />}
              {d.changingPass ? "Actualizando..." : "Actualizar contraseña"}
            </button>
            <button type="button" onClick={() => { d.setShowPassForm(false); d.setCurrentPassword(""); d.setNewPassword(""); d.setConfirmPassword("") }} className={btnGhost}>Cancelar</button>
          </div>
        </form>
      )}
    </motion.section>
  )
}

function ThemeSection({ v, d, className, delay }: { v: V; d: PerfilData; className?: string; delay: number }) {
  return (
    <motion.section {...fadeUp} transition={{ ...spring, delay }} className={cn(cardCls(v), className)}>
      <SectionHeader icon={Layers} title="Tema" desc="Modo y color de la app" v={v} />
      {v === "minimal" ? (
        <div className="space-y-1.5">
          {THEMES.map(t => {
            const isActive = (d.resolvedTheme === t.mode) && (d.themeVariant === t.variant)
            return (
              <button key={t.name} onClick={() => d.handleTheme(t)}
                className={cn("w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  isActive ? "bg-sb-surface-container-high text-sb-on-surface" : "text-sb-on-surface-variant/70 hover:bg-sb-surface-container-high/50")}>
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: t.colors[0] }} />
                <span className="flex-1">{t.name}</span>
                {isActive && <Check className="h-3.5 w-3.5 text-sb-on-surface" />}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {THEMES.map(t => {
            const isActive = (d.resolvedTheme === t.mode) && (d.themeVariant === t.variant)
            return (
              <motion.div key={t.name} layout className="flex flex-col items-center gap-1.5">
                <motion.button
                  aria-label={t.name}
                  onClick={() => d.handleTheme(t)}
                  whileTap={{ scale: 0.9 }}
                  animate={{ borderRadius: isActive ? 14 : "50%", scale: isActive ? 1.06 : 1 }}
                  transition={spring}
                  className="relative aspect-square w-full cursor-pointer overflow-hidden"
                  style={{ boxShadow: isActive ? "0 0 0 3px var(--sb-primary)" : "none" }}
                >
                  <motion.span
                    animate={{ borderRadius: isActive ? "14px 0 0 14px" : "50% 0 0 50%" }}
                    transition={spring}
                    className="absolute left-0 h-full w-1/2"
                    style={{ background: t.colors[0] }}
                  />
                  <span className="absolute right-0 top-0 h-1/2 w-1/2" style={{ background: t.colors[1], borderRadius: isActive ? "0 14px 0 0" : "0 50% 0 0", transition: "border-radius 0.3s" }} />
                  <span className="absolute bottom-0 right-0 h-1/2 w-1/2" style={{ background: t.colors[2], borderRadius: isActive ? "0 0 14px 0" : "0 0 50% 0", transition: "border-radius 0.3s" }} />
                </motion.button>
                <span className={cn("text-[10px]", isActive ? "font-semibold text-sb-on-surface" : "text-sb-on-surface-variant/50")}>{t.name}</span>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.section>
  )
}

function SystemDesignSection({ v, d, className, delay }: { v: V; d: PerfilData; className?: string; delay: number }) {
  return (
    <motion.section {...fadeUp} transition={{ ...spring, delay }} className={cn(cardCls(v), className)}>
      <SectionHeader icon={Layers} title="Diseño del sistema" desc="Identidad visual de la plataforma" v={v} />
      <DesignSelector />
    </motion.section>
  )
}

function ClassicLayout({ d }: { d: PerfilData }) {
  return (
    <div className="space-y-5">
      <Hero d={d} />
      <div className="grid gap-5 lg:grid-cols-3">
        <InfoSection v="classic" d={d} className="lg:col-span-2" delay={0.06} />
        <SessionSection v="classic" d={d} delay={0.09} />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <PasswordSection v="classic" d={d} className="lg:col-span-2" delay={0.12} />
        <ThemeSection v="classic" d={d} delay={0.15} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <SystemDesignSection v="classic" d={d} delay={0.18} />
      </div>
    </div>
  )
}

const M_SECTIONS = [
  { id: "info", label: "Información", icon: User },
  { id: "sesion", label: "Sesión", icon: Globe },
  { id: "password", label: "Contraseña", icon: Key },
  { id: "tema", label: "Tema", icon: Layers },
  { id: "diseno", label: "Diseño", icon: Sparkles },
] as const

function MBlock({ id, index, label, title, desc, children }: {
  id: string; index: number; label: string; title: string; desc?: string; children: React.ReactNode
}) {
  return (
    <section id={`perfil-${id}`} className="scroll-mt-28">
      <header className="mb-5 border-b border-sb-outline-variant/30 pb-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-sb-on-surface-variant/50">
          {String(index + 1).padStart(2, "0")} — {label}
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">{title}</h2>
        {desc && <p className="mt-1 text-xs text-sb-on-surface-variant/60">{desc}</p>}
      </header>
      {children}
    </section>
  )
}

function MProfileBar({ d }: { d: PerfilData }) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-sb-outline-variant/30 pb-6">
      <Avatar profile={d.profile} initials={d.initials} v="minimal" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-xl font-bold tracking-tight">{d.profile?.fullName || "Sin nombre"}</h2>
          <span className="rounded-md border border-sb-outline-variant/50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sb-on-surface-variant">
            {roleLabels[d.profile?.role || ""] || d.profile?.role || "—"}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-sb-on-surface-variant/70">{d.profile?.email}</p>
      </div>
      <button onClick={d.handleLogout} className={cn(btnGhost, "shrink-0 text-red-400/80 hover:bg-red-400/10 hover:text-red-400")}>
        <LogOut className="h-3.5 w-3.5" /> Salir
      </button>
    </div>
  )
}

function MinimalLayout({ d }: { d: PerfilData }) {
  const [active, setActive] = React.useState<string>("info")

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id.replace("perfil-", "")) })
      },
      { rootMargin: "-25% 0px -65% 0px" }
    )
    M_SECTIONS.forEach(s => { const el = document.getElementById(`perfil-${s.id}`); if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    document.getElementById(`perfil-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const toggle = "absolute right-3 top-[38px] text-sb-on-surface-variant/40 hover:text-sb-on-surface-variant"

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      {/* ===== Índice sticky ===== */}
      <aside className="lg:w-48 lg:shrink-0">
        <nav className="flex gap-1.5 overflow-x-auto pb-1 lg:sticky lg:top-24 lg:flex-col lg:overflow-visible lg:pb-0">
          {M_SECTIONS.map((s, i) => (
            <a
              key={s.id}
              href={`#perfil-${s.id}`}
              onClick={scrollTo(s.id)}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active === s.id
                  ? "bg-sb-surface-container-high font-semibold text-sb-on-surface"
                  : "text-sb-on-surface-variant/70 hover:bg-sb-surface-container-high/60 hover:text-sb-on-surface"
              )}
            >
              <span className={cn("font-mono text-[10px]", active === s.id ? "text-sb-primary" : "text-sb-on-surface-variant/40")}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {s.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* ===== Contenido editorial ===== */}
      <div className="min-w-0 flex-1">
        <MProfileBar d={d} />
        <div className="space-y-12 pt-8">
          <MBlock id="info" index={0} label="Información" title="Información personal" desc="Tus datos de contacto">
            {d.editMode ? (
              <div className="space-y-4">
                <div>
                  <FieldLabel>Nombre completo</FieldLabel>
                  <input value={d.fullName} onChange={e => d.setFullName(e.target.value)} className={inputCls("minimal")} placeholder="Tu nombre completo" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Teléfono</FieldLabel>
                    <input value={d.phone} onChange={e => d.setPhone(e.target.value)} className={inputCls("minimal")} placeholder="+51 999 999 999" />
                  </div>
                  <div>
                    <FieldLabel>Email</FieldLabel>
                    <input value={d.profile?.email || ""} disabled className={cn(inputCls("minimal"), "cursor-not-allowed opacity-50")} />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={d.handleSave} disabled={d.saving} className={btnPrimary("minimal")}>
                    {d.saving ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sb-surface border-t-transparent" /> : <Save className="h-3.5 w-3.5" />}
                    {d.saving ? "Guardando..." : "Guardar cambios"}
                  </button>
                  <button onClick={() => { d.setEditMode(false); d.setFullName(d.profile?.fullName || ""); d.setPhone("") }} className={btnGhost}>Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <dl className="grid gap-x-10 sm:grid-cols-2">
                  {[
                    { k: "Email", val: d.profile?.email },
                    { k: "Teléfono", val: d.profile?.phone || "—" },
                    { k: "Miembro desde", val: d.profile?.createdAt ? new Date(d.profile.createdAt).toLocaleDateString("es-PE") : "—" },
                    { k: "ID", val: d.profile?.id?.slice(0, 16), mono: true },
                    ...(d.profile?.role !== "dev" && d.profile?.institutionId ? [{ k: "Institución", val: d.profile.institutionId }] : []),
                  ].map(({ k, val, mono }) => (
                    <div key={k} className="flex items-baseline justify-between gap-6 border-b border-sb-outline-variant/15 py-3">
                      <dt className="shrink-0 text-[10px] uppercase tracking-wider text-sb-on-surface-variant/40">{k}</dt>
                      <dd className={cn("truncate text-sm", mono && "font-mono text-xs text-sb-on-surface-variant/70")}>{val}</dd>
                    </div>
                  ))}
                </dl>
                <button onClick={() => d.setEditMode(true)} className={cn(btnGhost, "mt-4")}><User className="h-3.5 w-3.5" /> Editar</button>
              </>
            )}
          </MBlock>

          <MBlock id="sesion" index={1} label="Sesión" title="Esta sesión">
            <div className="flex items-center gap-3 rounded-lg border border-sb-outline-variant/40 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Web — {typeof navigator !== "undefined" ? navigator.platform : "—"}</p>
                <p className="mt-0.5 text-[11px] text-sb-on-surface-variant/50">Navegador activo en este dispositivo</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-[10px] font-medium text-emerald-400/80">Activa</span>
              </div>
            </div>
            <button onClick={d.handleLogout} className={cn(btnGhost, "mt-3 text-red-400/80 hover:bg-red-400/10 hover:text-red-400")}>
              <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
            </button>
          </MBlock>

          <MBlock id="password" index={2} label="Contraseña" title="Actualiza tu contraseña">
            {d.showPassForm ? (
              <form onSubmit={d.handleChangePassword} className="space-y-4">
                <div className="relative">
                  <FieldLabel>Contraseña actual</FieldLabel>
                  <input
                    type={d.showCurrent ? "text" : "password"}
                    value={d.currentPassword}
                    onChange={e => d.setCurrentPassword(e.target.value)}
                    className={cn(inputCls("minimal"), "pr-11")}
                    placeholder="••••••••" required
                  />
                  <button type="button" onClick={() => d.setShowCurrent(!d.showCurrent)} className={toggle}>
                    {d.showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="relative">
                    <FieldLabel>Nueva contraseña</FieldLabel>
                    <input
                      type={d.showNew ? "text" : "password"}
                      value={d.newPassword}
                      onChange={e => d.setNewPassword(e.target.value)}
                      className={cn(inputCls("minimal"), "pr-11")}
                      placeholder="••••••••" required minLength={6}
                    />
                    <button type="button" onClick={() => d.setShowNew(!d.showNew)} className={toggle}>
                      {d.showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <FieldLabel>Confirmar contraseña</FieldLabel>
                    <input
                      type={d.showConfirm ? "text" : "password"}
                      value={d.confirmPassword}
                      onChange={e => d.setConfirmPassword(e.target.value)}
                      className={cn(inputCls("minimal"), "pr-11")}
                      placeholder="••••••••" required minLength={6}
                    />
                    <button type="button" onClick={() => d.setShowConfirm(!d.showConfirm)} className={toggle}>
                      {d.showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={d.changingPass} className={btnPrimary("minimal")}>
                    {d.changingPass ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sb-surface border-t-transparent" /> : <Fingerprint className="h-3.5 w-3.5" />}
                    {d.changingPass ? "Actualizando..." : "Actualizar contraseña"}
                  </button>
                  <button type="button" onClick={() => { d.setShowPassForm(false); d.setCurrentPassword(""); d.setNewPassword(""); d.setConfirmPassword("") }} className={btnGhost}>Cancelar</button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between gap-4 rounded-lg border border-sb-outline-variant/40 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Contraseña</p>
                  <p className="mt-0.5 text-[11px] text-sb-on-surface-variant/50">Última actualización no registrada</p>
                </div>
                <button onClick={() => d.setShowPassForm(true)} className={cn(btnGhost, "shrink-0")}><Key className="h-3.5 w-3.5" /> Cambiar</button>
              </div>
            )}
          </MBlock>

          <MBlock id="tema" index={3} label="Tema" title="Modo y color">
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
              {THEMES.map(t => {
                const isActive = (d.resolvedTheme === t.mode) && (d.themeVariant === t.variant)
                return (
                  <button key={t.name} onClick={() => d.handleTheme(t)} className="flex flex-col items-center gap-2">
                    <span
                      className={cn("block aspect-square w-full rounded-lg transition-all", isActive && "ring-2 ring-sb-primary ring-offset-2 ring-offset-sb-background")}
                      style={{ background: t.colors[0] }}
                    />
                    <span className={cn("text-[10px]", isActive ? "font-semibold text-sb-on-surface" : "text-sb-on-surface-variant/50")}>{t.name}</span>
                  </button>
                )
              })}
            </div>
          </MBlock>

          <MBlock id="diseno" index={4} label="Diseño" title="Identidad del sistema">
            <DesignSelector />
          </MBlock>
        </div>
      </div>
    </div>
  )
}

export default function PerfilPage() {
  const { toast } = useToast()
  const { setTheme, resolvedTheme } = useTheme()
  const { currentDesign, setDesign } = useDesign()
  const router = useRouter()
  const [themeVariant, setThemeVariant] = React.useState<string>(() => {
    const s = getInitial("sb-theme-variant", "")
    return THEMES.some(t => t.variant === s) ? s : ""
  })
  const [profile, setProfile] = React.useState<UserProfile | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [editMode, setEditMode] = React.useState(false)
  const [fullName, setFullName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [showPassForm, setShowPassForm] = React.useState(false)
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showCurrent, setShowCurrent] = React.useState(false)
  const [showNew, setShowNew] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [changingPass, setChangingPass] = React.useState(false)

  React.useEffect(() => {
    if (themeVariant) document.documentElement.setAttribute("data-theme", themeVariant)
    else document.documentElement.removeAttribute("data-theme")
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setProfile(d.user); setFullName(d.user.fullName || "") } })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [themeVariant])

  const handlePerfilDesign = (id: string) => {
    setDesign(id)
    toast(`Diseño aplicado: ${PERFIL_DESIGNS.find(d => d.id === id)?.label}`, "success")
  }

  const handleTheme = (t: ThemeOption) => {
    setTheme(t.mode)
    setThemeVariant(t.variant)
    localStorage.setItem("sb-theme-variant", t.variant)
    if (t.mode === "dark") document.documentElement.classList.add("dark")
    else document.documentElement.classList.remove("dark")
    if (t.variant) document.documentElement.setAttribute("data-theme", t.variant)
    else document.documentElement.removeAttribute("data-theme")
    toast(`Tema aplicado: ${t.name}`, "success")
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/auth/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ full_name: fullName, phone }) })
      if (res.ok) { setProfile(p => p ? { ...p, fullName, phone: phone || undefined } : p); setEditMode(false); toast("Perfil actualizado", "success") }
      else { const e = await res.json(); toast(e.error || "Error", "error") }
    } catch { toast("Error de conexión", "error") } finally { setSaving(false) }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { toast("Las contraseñas no coinciden", "error"); return }
    if (newPassword.length < 6) { toast("Mínimo 6 caracteres", "error"); return }
    setChangingPass(true)
    try {
      const res = await fetch("/api/auth/change-password", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) })
      if (res.ok) { toast("Contraseña actualizada", "success"); setShowPassForm(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword("") }
      else { const e = await res.json(); toast(e.error || "Error", "error") }
    } catch { toast("Error de conexión", "error") } finally { setChangingPass(false) }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  const initials = profile?.fullName
    ? profile.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : profile?.email?.slice(0, 2).toUpperCase() || "?"

  if (loading) return (
    <div className="flex items-center justify-center" style={{ height: "60vh" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid var(--sb-outline-variant)", borderTopColor: "var(--sb-primary)", animation: "spin 0.8s linear infinite" }} />
    </div>
  )

  const data: PerfilData = {
    profile, initials,
    fullName, setFullName, phone, setPhone,
    editMode, setEditMode, saving, handleSave, handleLogout,
    showPassForm, setShowPassForm,
    currentPassword, setCurrentPassword,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    showCurrent, setShowCurrent, showNew, setShowNew, showConfirm, setShowConfirm,
    changingPass, handleChangePassword,
    themeVariant, resolvedTheme, handleTheme,
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 md:px-8 py-8 md:py-12 text-sb-on-surface">
      {/* ===== Header ===== */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <motion.header {...fadeUp} transition={spring}>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-sb-primary">Cuenta</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Mi perfil</h1>
          <p className="mt-1.5 text-sm text-sb-on-surface-variant/70">Gestiona tu información y el aspecto de tu espacio.</p>
        </motion.header>

        {/* ===== Switch de diseño ===== */}
        <div className="flex rounded-full bg-sb-surface-container p-1">
          {PERFIL_DESIGNS.map(d => (
            <motion.button
              key={d.id}
              onClick={() => handlePerfilDesign(d.id)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                currentDesign.id === d.id ? "bg-sb-on-surface text-sb-surface" : "text-sb-on-surface-variant hover:text-sb-on-surface"
              )}
            >
              {d.label}
            </motion.button>
          ))}
        </div>
      </div>

      {currentDesign.id === "minimal" ? (
        <MinimalLayout d={data} />
      ) : (
        <ClassicLayout d={data} />
      )}
    </div>
  )
}
