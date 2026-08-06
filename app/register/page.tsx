"use client"

import * as React from "react"
import Link from "next/link"
import { registerSchema, type RegisterInput } from "@/lib/validations/auth"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "@/components/ui/proicons"
import { SbBtn, SbInput, SbCard } from "@/components/ui/sb"

export default function RegisterPage() {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      const result = await res.json()
      if (!res.ok) { setError(result.error); setLoading(false); return }
      setSuccess(true); setLoading(false)
    } catch { setError("Error de conexión"); setLoading(false) }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--sb-background)] p-4">
        <SbCard className="w-full max-w-md text-center p-8">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center"><span className="text-emerald-400 text-2xl">✓</span></div>
          <h2 className="text-2xl font-bold text-[var(--sb-on-surface)]">Cuenta Creada</h2>
          <p className="text-sm text-[var(--sb-on-surface-variant)]/60 mt-2">Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión.</p>
          <SbBtn variant="filled" rounded className="w-full mt-6"><Link href="/login">Ir al Login</Link></SbBtn>
        </SbCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--sb-background)] p-4">
      <SbCard className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Link href="/" className="mx-auto mb-4 inline-block">
            <div className="h-12 w-12 rounded-xl bg-[var(--sb-primary)] flex items-center justify-center"><span className="text-[var(--sb-on-primary)] font-bold text-lg">EC</span></div>
          </Link>
          <h2 className="text-2xl font-bold text-[var(--sb-on-surface)]">Solicitar Acceso</h2>
          <p className="text-sm text-[var(--sb-on-surface-variant)]/60 mt-1">Crea tu cuenta para acceder a Educonecta</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="p-3 text-sm text-red-400 bg-red-500/10 rounded-xl">{error}</div>}

          {[
            { id: "fullName", label: "Nombre Completo", type: "text", placeholder: "Juan Pérez", error: errors.fullName },
            { id: "email", label: "Correo Electrónico", type: "email", placeholder: "correo@ejemplo.com", error: errors.email },
            { id: "institutionCode", label: "Código de Institución", type: "text", placeholder: "CSM001", error: errors.institutionCode },
            { id: "password", label: "Contraseña", type: "password", placeholder: "••••••••", error: errors.password },
            { id: "confirmPassword", label: "Confirmar Contraseña", type: "password", placeholder: "••••••••", error: errors.confirmPassword },
          ].map(f => (
            <div key={f.id}>
              <label className="text-[11px] text-[var(--sb-on-surface-variant)]/40 mb-1 block">{f.label}</label>
              <SbInput id={f.id} type={f.type} placeholder={f.placeholder} {...register(f.id as keyof RegisterInput)} />
              {f.error && <p className="text-xs text-red-400 mt-1">{f.error.message}</p>}
            </div>
          ))}

          <SbBtn type="submit" variant="filled" rounded className="w-full h-11" disabled={loading}>
            {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creando cuenta...</span> : "Solicitar Acceso"}
          </SbBtn>

          <p className="text-center text-sm text-[var(--sb-on-surface-variant)]/50">
            ¿Ya tienes cuenta? <Link href="/login" className="text-[var(--sb-on-surface)] hover:underline font-medium">Iniciar sesión</Link>
          </p>
        </form>
      </SbCard>
    </div>
  )
}
