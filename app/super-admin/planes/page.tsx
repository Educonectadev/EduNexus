"use client"

import * as React from "react"
import { SbCard, SbBtn, SbBadge } from "@/components/ui/sb"
import { Check, X } from "lucide-react"

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Para instituciones pequeñas que están comenzando",
    features: [
      { name: "Hasta 50 alumnos", included: true },
      { name: "Hasta 5 docentes", included: true },
      { name: "Calificaciones", included: true },
      { name: "Asistencia digital", included: true },
      { name: "Gestión de documentos", included: true },
      { name: "Portal de padres", included: true },
      { name: "Tareas y revisiones", included: true },
      { name: "Certificados digitales", included: false },
      { name: "Chat en tiempo real", included: false },
      { name: "Clases virtuales", included: false },
      { name: "Carnets PDF", included: false },
      { name: "Asistente IA", included: false },
      { name: "Importación masiva", included: false },
      { name: "Exportar reportes", included: false },
      { name: "API acceso", included: false },
      { name: "White label", included: false },
    ],
    institutions: 45,
    color: "bg-sb-on-surface/10",
  },
  {
    id: "basico",
    name: "Básico",
    price: 149,
    description: "Para instituciones en crecimiento",
    features: [
      { name: "Hasta 200 alumnos", included: true },
      { name: "Hasta 15 docentes", included: true },
      { name: "Todo del plan Free", included: true },
      { name: "Certificados digitales", included: true },
      { name: "Chat en tiempo real", included: true },
      { name: "Importación masiva", included: true },
      { name: "Clases virtuales", included: false },
      { name: "Carnets PDF", included: false },
      { name: "Asistente IA", included: false },
      { name: "Exportar reportes", included: false },
      { name: "API acceso", included: false },
      { name: "White label", included: false },
    ],
    institutions: 68,
    color: "bg-blue-100",
  },
  {
    id: "pro",
    name: "Pro",
    price: 449,
    description: "Para instituciones establecidas",
    features: [
      { name: "Hasta 500 alumnos", included: true },
      { name: "Hasta 30 docentes", included: true },
      { name: "Todo del plan Básico", included: true },
      { name: "Clases virtuales (Zoom/Meet)", included: true },
      { name: "Carnets PDF descargables", included: true },
      { name: "Asistente IA del secretario", included: true },
      { name: "Exportación de reportes", included: true },
      { name: "API acceso", included: false },
      { name: "White label", included: false },
    ],
    institutions: 28,
    color: "bg-purple-100",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 0,
    description: "Para grandes instituciones y redes educativas",
    features: [
      { name: "Alumnos ilimitados", included: true },
      { name: "Docentes ilimitados", included: true },
      { name: "Todo del plan Pro", included: true },
      { name: "API de acceso", included: true },
      { name: "White label", included: true },
      { name: "Soporte prioritario", included: true },
      { name: "Integraciones custom", included: true },
    ],
    institutions: 7,
    color: "bg-amber-100",
  },
  {
    id: "diamante",
    name: "Diamante",
    price: 1499,
    description: "Para instituciones de élite que lo quieren todo",
    features: [
      { name: "Alumnos y docentes ilimitados", included: true },
      { name: "Todo del plan Enterprise", included: true },
      { name: "Certificados digitales", included: true },
      { name: "Clases virtuales (Zoom/Meet)", included: true },
      { name: "Asistente IA del secretario", included: true },
      { name: "Chat en tiempo real", included: true },
      { name: "Carnets PDF descargables", included: true },
      { name: "Importación masiva", included: true },
      { name: "Exportación de reportes", included: true },
      { name: "API de acceso", included: true },
      { name: "White label", included: true },
      { name: "Soporte prioritario", included: true },
      { name: "Integraciones custom", included: true },
    ],
    institutions: 0,
    color: "bg-cyan-100",
  },
]

export default function PlansPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Planes de Suscripción</h1>
        <p className="text-[var(--sb-muted-foreground)]">
          Gestiona los planes disponibles para las instituciones
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <SbCard key={plan.id} className="relative">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <SbBadge color="secondary">{plan.institutions} instituciones</SbBadge>
            </div>
            <p className="text-sm text-[var(--sb-muted-foreground)]">{plan.description}</p>
            <div className="pt-4">
              {plan.price === 0 ? (
                <span className="text-3xl font-bold">Gratis</span>
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">S/{plan.price}</span>
                  <span className="text-[var(--sb-muted-foreground)]">/mes</span>
                </div>
              )}
            </div>
            <ul className="space-y-3">
              {plan.features.map((feature) => (
                <li key={feature.name} className="flex items-center gap-2">
                  {feature.included ? (
                    <Check className="h-4 w-4 text-[var(--sb-success)]" />
                  ) : (
                    <X className="h-4 w-4 text-[var(--sb-muted-foreground)]" />
                  )}
                  <span
                    className={
                      feature.included ? "text-sm" : "text-sm text-[var(--sb-muted-foreground)]"
                    }
                  >
                    {feature.name}
                  </span>
                </li>
              ))}
            </ul>
            <SbBtn className="w-full mt-6" variant={plan.id === "pro" ? "default" : "outlined"}>
              {plan.price === 0 ? "Plan Actual" : "Editar Plan"}
            </SbBtn>
          </SbCard>
        ))}
      </div>
    </div>
  )
}
