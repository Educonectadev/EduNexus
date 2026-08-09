"use client"

import * as React from "react"
import Link from "next/link"
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Mail, ArrowRight, ChevronLeft, CheckCircle2, KeyRound, Sun, Moon } from "@/components/ui/proicons"
import { useTheme } from "next-themes"
import Image from "next/image"
import { SbBtn, SbInput } from "@/components/ui/sb"

export default function ForgotPasswordPage() {
  const [loading, setLoading] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const { theme, setTheme } = useTheme()

  React.useEffect(() => { setMounted(true) }, [])

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) })

  const onSubmit = async (data: ForgotPasswordInput) => { setLoading(true); await new Promise(r => setTimeout(r, 1500)); setSuccess(true); setLoading(false) }

  return (
    <div className="min-h-screen flex bg-[var(--sb-background)]">
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--sb-primary)_0%,_transparent_50%)] opacity-[0.03] pointer-events-none" />

        <div className="relative z-10 w-full max-w-[400px] mx-auto lg:mx-0">
          <div className="flex items-center justify-between mb-10">
            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
              <Link href="/login" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--sb-on-surface-variant)]/60 hover:text-[var(--sb-on-surface)] transition-colors group">
                <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />Volver al login
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
                <span className="text-[var(--sb-on-primary)] font-bold text-sm">EC</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-[var(--sb-on-surface)]">EduNexus</span>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-[var(--sb-on-surface)]">Recuperar<br />contraseña</h1>
            <p className="text-[var(--sb-on-surface-variant)]/60 mt-3 text-sm leading-relaxed max-w-[340px]">Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="text-center py-6">
                  <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center"><CheckCircle2 className="h-7 w-7 text-emerald-500" /></div>
                  <h2 className="text-xl font-bold tracking-tight text-[var(--sb-on-surface)]">Correo enviado</h2>
                  <p className="text-[var(--sb-on-surface-variant)]/60 mt-2.5 text-sm leading-relaxed max-w-[280px] mx-auto">Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.</p>
                  <SbBtn variant="filled" rounded className="w-full h-11 text-sm font-semibold mt-8">
                    <Link href="/login" className="flex items-center justify-center gap-2">Volver al login<ArrowRight className="h-4 w-4" /></Link>
                  </SbBtn>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="mb-6 h-12 w-12 rounded-2xl bg-[var(--sb-primary)]/10 border border-[var(--sb-primary)]/10 flex items-center justify-center">
                    <KeyRound className="h-5 w-5 text-[var(--sb-on-surface)]" />
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[var(--sb-on-surface-variant)]/60">Correo electrónico</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--sb-on-surface-variant)]/40" />
                        <SbInput id="email" type="email" placeholder="tu@colegio.edu.pe" {...register("email")} style={{ paddingLeft: "36px" }} />
                      </div>
                      {errors.email && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-400 mt-1">{errors.email.message}</motion.p>}
                    </div>

                    <SbBtn type="submit" variant="filled" rounded className="w-full h-11 text-sm font-semibold" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="flex items-center justify-center gap-2">Enviar Instrucciones<ArrowRight className="h-4 w-4" /></span>}
                    </SbBtn>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {!success && (
              <p className="text-center text-xs text-[var(--sb-on-surface-variant)]/40 mt-6">
                ¿Recordaste tu contraseña? <Link href="/login" className="font-medium text-[var(--sb-on-surface-variant)]/60 hover:text-[var(--sb-on-surface)] transition-colors">Iniciar sesión</Link>
              </p>
            )}
          </motion.div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0">
          <Image src="/login-illustration.jpg" alt="Illustration" fill className="object-cover opacity-40 dark:opacity-30" priority />
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
