"use client"

import * as React from "react"
import { getEffectivePermissions } from "@/lib/planPermissions"
import type { PlanPermission } from "@/lib/planPermissions"

interface PlanInfo {
  id: string
  name: string
  price: number
}

export function usePlanPermissions() {
  const [permissions, setPermissions] = React.useState<Record<string, boolean>>(getEffectivePermissions(null))
  const [plan, setPlan] = React.useState<PlanInfo | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    fetch("/api/auth/institution")
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (data.plan) {
          setPlan({ id: data.plan.id, name: data.plan.name, price: data.plan.price })
          setPermissions(getEffectivePermissions(data.plan.features))
        } else {
          setPlan(null)
          setPermissions(getEffectivePermissions(null))
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const can = React.useCallback((key: PlanPermission | string): boolean => {
    return permissions[key] !== false
  }, [permissions])

  return { permissions, plan, loading, can }
}
