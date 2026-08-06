"use client"

import * as React from "react"
import { SbCard, SbBtn, SbBadge } from "@/components/ui/sb"
import { Check, X, Loader2, RefreshCw, Users, GraduationCap, HardDrive } from "@/components/ui/proicons"

interface Plan {
  id: string
  name: string
  description: string | null
  price: number
  max_users: number
  max_students: number
  max_teachers: number
  max_storage_mb: number
  features: string
  status: string
}

function parseFeatures(features: any): { labels: string[]; permissions: Record<string, boolean> } {
  if (!features) return { labels: [], permissions: {} }
  try {
    const parsed = typeof features === "string" ? JSON.parse(features) : features
    if (Array.isArray(parsed)) return { labels: parsed, permissions: {} }
    return {
      labels: parsed.labels || [],
      permissions: parsed.permissions || {},
    }
  } catch {
    return { labels: [], permissions: {} }
  }
}

function formatMb(mb: number) {
  if (mb >= 999999) return "Ilimitado"
  if (mb >= 1000) return `${(mb / 1000).toFixed(0)} GB`
  return `${mb} MB`
}

export default function PlansPage() {
  const [plans, setPlans] = React.useState<Plan[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchPlans = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/dev/planes")
      if (!res.ok) throw new Error("Error al cargar planes")
      const data = await res.json()
      setPlans(data)
    } catch (e: any) {
      setError(e.message || "Error de conexión")
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/dev/planes")
        if (!res.ok) throw new Error("Error al cargar planes")
        const data = await res.json()
        if (!cancelled) setPlans(data)
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Error de conexión")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planes de Suscripción</h1>
          <p className="text-[var(--sb-muted-foreground)]">
            Planes activos con sus funciones y límites
          </p>
        </div>
        <SbBtn variant="outlined" onClick={() => fetchPlans()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Recargar
        </SbBtn>
      </div>

      {error && (
        <SbCard className="border-red-200 text-red-600 text-sm p-4">{error}</SbCard>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-[var(--sb-muted-foreground)]">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Cargando planes...
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {plans.map((plan) => {
            const { labels, permissions } = parseFeatures(plan.features)
            const onCount = Object.values(permissions).filter(Boolean).length
            const offCount = Object.values(permissions).length - onCount
            return (
              <SbCard key={plan.id} className="relative flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  <SbBadge color={plan.status === "active" ? "success" : "secondary"}>
                    {plan.status === "active" ? "Activo" : "Inactivo"}
                  </SbBadge>
                </div>
                <p className="text-sm text-[var(--sb-muted-foreground)]">{plan.description}</p>
                <div className="pt-4">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-bold">Gratis</span>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">S/{Number(plan.price).toFixed(2)}</span>
                      <span className="text-[var(--sb-muted-foreground)]">/mes</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 py-4 text-center">
                  <div className="rounded-lg bg-[var(--sb-surface-container-high)] p-2">
                    <Users className="h-4 w-4 mx-auto text-[var(--sb-primary)]" />
                    <p className="text-sm font-semibold mt-1">{plan.max_users >= 999999 ? "∞" : plan.max_users}</p>
                    <p className="text-[10px] text-[var(--sb-muted-foreground)]">Usuarios</p>
                  </div>
                  <div className="rounded-lg bg-[var(--sb-surface-container-high)] p-2">
                    <GraduationCap className="h-4 w-4 mx-auto text-[var(--sb-primary)]" />
                    <p className="text-sm font-semibold mt-1">{plan.max_students >= 999999 ? "∞" : plan.max_students.toLocaleString()}</p>
                    <p className="text-[10px] text-[var(--sb-muted-foreground)]">Alumnos</p>
                  </div>
                  <div className="rounded-lg bg-[var(--sb-surface-container-high)] p-2">
                    <HardDrive className="h-4 w-4 mx-auto text-[var(--sb-primary)]" />
                    <p className="text-sm font-semibold mt-1">{formatMb(plan.max_storage_mb)}</p>
                    <p className="text-[10px] text-[var(--sb-muted-foreground)]">Almacenamiento</p>
                  </div>
                </div>

                <ul className="space-y-2.5 flex-1">
                  {labels.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[var(--sb-success)] shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 pt-3 border-t border-[var(--sb-outline-variant)] text-[11px] text-[var(--sb-muted-foreground)] flex items-center justify-between">
                  <span className="text-emerald-600">{onCount} funciones</span>
                  {offCount > 0 && <span className="text-[var(--sb-muted-foreground)]">{offCount} premium</span>}
                  {offCount === 0 && <span className="text-[var(--sb-muted-foreground)]">Todo incluido</span>}
                </div>

                <SbBtn className="w-full mt-4" variant="outlined">
                  Gestionar en Dev
                </SbBtn>
              </SbCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
