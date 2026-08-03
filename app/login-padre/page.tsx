"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Mail, Lock, ArrowRight, Eye, EyeOff, ChevronLeft, Sun, Moon, Users, GraduationCap, Shield } from "lucide-react"
import { useTheme } from "next-themes"
import Image from "next/image"
import { SbBtn, SbInput } from "@/components/ui/sb"

export default function LoginPadrePage() {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [showPassword, setShowPassword] = React.useState(false)
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginInput) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      const result = await res.json()
      if (!res.ok) { setError(result.error); setLoading(false); return }
      if (result.user.role !== "padre") {
        setError("Esta cuenta no es de padre. Usa el login general."); setLoading(false); return
      }
      router.push("/padre/dashboard")
    } catch { setError("Error de conexión"); setLoading(false) }
  }

  return (
    <div className="min-h-screen flex bg-[var(--sb-background)]">
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--sb-primary)_0%,_transparent_50%)] opacity-[0.03] pointer-events-none" />

        <div className="relative z-10 w-full max-w-[420px] mx-auto lg:mx-0">
          <div className="flex items-center justify-between mb-10">
            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
              <Link href="/" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--sb-on-surface-variant)]/60 hover:text-[var(--sb-on-surface)] transition-colors group">
                <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />Volver al inicio
              </Link>
            </motion.div>
            <motion.button initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="relative p-2 rounded-xl hover:bg-[var(--sb-surface-container-high)] transition-colors" title="Cambiar tema">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute inset-0 m-auto h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </motion.button>
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}>
            <Link href="/" className="inline-flex items-center gap-2.5 mb-12 group">
              <div className="h-10 w-10 rounded-xl bg-[var(--sb-primary)] flex items-center justify-center shadow-lg shadow-[var(--sb-primary)]/25 group-hover:shadow-[var(--sb-primary)]/40 transition-shadow">
                <Users className="h-5 w-5 text-[var(--sb-on-primary)]" />
              </div>
              <span className="text-lg font-bold tracking-tight text-[var(--sb-on-surface)]">Portal de Padres</span>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-[var(--sb-on-surface)]">Bienvenido<br />padre de familia</h1>
            <p className="text-[var(--sb-on-surface-variant)]/60 mt-3 text-sm leading-relaxed max-w-[340px]">Ingresa tus credenciales para revisar el seguimiento académico de tu hijo.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: "auto", marginTop: 4 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} className="overflow-hidden">
                    <div className="px-4 py-3 text-sm text-red-400 bg-red-500/8 rounded-xl border border-red-500/15">{error}</div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--sb-on-surface-variant)]/60">Correo electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--sb-on-surface-variant)]/40" />
                  <SbInput id="email" type="email" placeholder="tu@email.com" {...register("email")} style={{ paddingLeft: "36px" }} />
                </div>
                {errors.email && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-400 mt-1">{errors.email.message}</motion.p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--sb-on-surface-variant)]/60">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--sb-on-surface-variant)]/40" />
                  <SbInput id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" {...register("password")} style={{ paddingLeft: "36px", paddingRight: "36px" }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--sb-on-surface-variant)]/40 hover:text-[var(--sb-on-surface)] transition-colors rounded-lg">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-400 mt-1">{errors.password.message}</motion.p>}
              </div>

              <div className="flex items-center justify-end pt-0.5">
                <Link href="/forgot-password" className="text-xs font-medium text-[var(--sb-on-surface-variant)]/50 hover:text-[var(--sb-on-surface)] transition-colors">¿Olvidaste tu contraseña?</Link>
              </div>

              <SbBtn type="submit" variant="filled" rounded className="w-full h-11 text-sm font-semibold" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="flex items-center justify-center gap-2">Iniciar Sesión<ArrowRight className="h-4 w-4" /></span>}
              </SbBtn>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--sb-outline-variant)]/20" />
              <span className="text-[10px] text-[var(--sb-on-surface-variant)]/40 font-medium">ACCESO SEGURO</span>
              <div className="h-px flex-1 bg-[var(--sb-outline-variant)]/20" />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { icon: GraduationCap, label: "Notas" },
                { icon: Shield, label: "Asistencia" },
                { icon: Users, label: "Hijos" },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[var(--sb-surface-container)]/50 border border-[var(--sb-outline-variant)]/10">
                  <item.icon className="h-4 w-4 text-[var(--sb-on-surface-variant)]/30" />
                  <span className="text-[10px] font-medium text-[var(--sb-on-surface-variant)]/40">{item.label}</span>
                </motion.div>
              ))}
            </div>

            <p className="text-center text-xs text-[var(--sb-on-surface-variant)]/40 mt-6">Las credenciales son proporcionadas por la institución.</p>
          </motion.div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0">
          <Image src="/login-illustration.jpg" alt="Illustration" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--sb-primary)]/60 to-black/60" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="relative z-10 text-center px-12">
          <div className="flex items-center justify-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Acompaña el proceso<br />educativo de tu hijo</h2>
          <p className="text-sm text-white/70 mt-3 max-w-[300px]">Revisa notas, asistencia, tareas y pagos desde cualquier lugar.</p>
        </motion.div>
      </div>
    </div>
  )
}
