"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Mail, Lock, ArrowRight, Eye, EyeOff, ChevronLeft, Sun, Moon } from "@/components/ui/proicons"
import { Logo } from "@/components/ui/logo"
import { useTheme } from "next-themes"
import Image from "next/image"
import { SbBtn, SbInput } from "@/components/ui/sb"

export default function LoginPage() {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [showPassword, setShowPassword] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  React.useEffect(() => { setMounted(true) }, [])

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginInput) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      const result = await res.json()
      if (!res.ok) { setError(result.error); setLoading(false); return }
      const roleRouteMap: Record<string, string> = { dev: "/dev", super_admin: "/super-admin/dashboard", director: "/director/dashboard", secretario: "/secretario/dashboard", docente: "/docente/dashboard", padre: "/padre/dashboard" }
      router.push(roleRouteMap[result.user.role] || "/director/dashboard")
    } catch { setError("Error de conexión"); setLoading(false) }
  }

  return (
    <div className="min-h-screen flex bg-[var(--sb-background)]">
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--sb-primary)_0%,_transparent_50%)] opacity-[0.03] pointer-events-none" />

        <div className="relative z-10 w-full max-w-[400px] mx-auto lg:mx-0">
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
              <Logo className="h-10 w-10" />
              <span className="text-lg font-bold tracking-tight text-[var(--sb-on-surface)]">EduNexus</span>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-[var(--sb-on-surface)]">Bienvenido<br />de vuelta</h1>
            <p className="text-[var(--sb-on-surface-variant)]/60 mt-3 text-sm leading-relaxed max-w-[340px]">Ingresa tus credenciales para acceder a tu panel de administración.</p>
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
                  <SbInput id="email" type="email" placeholder="tu@colegio.edu.pe" {...register("email")} style={{ paddingLeft: "36px" }} />
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

            <p className="text-center text-xs text-[var(--sb-on-surface-variant)]/40 mt-6">Solo usuarios autorizados por la institución pueden acceder.</p>
            <div className="mt-4 text-center">
              <Link href="/login-padre" className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--sb-primary)] hover:underline">
                ¿Eres padre de familia? Ingresa aquí
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0">
          <Image src="/login-illustration.jpg" alt="Illustration" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-black/50 dark:bg-black/30" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="relative z-10 text-center px-12">
          <h2 className="text-2xl font-bold tracking-tight text-white">Gestión educativa inteligente</h2>
          <p className="text-sm text-white/70 mt-3 max-w-[300px]">Administra matrículas, notas, asistencia y más en una sola plataforma.</p>
        </motion.div>
      </div>
    </div>
  )
}
