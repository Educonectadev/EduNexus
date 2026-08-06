"use client";

import { useState } from "react";
import { ArrowRight, Check } from "@/components/ui/proicons";
import { DemoModal } from "@/components/demo-modal";

const plans = [
  {
    name: "Básico",
    description: "Para colegios pequeños (hasta 200 alumnos)",
    price: { monthly: 199, annual: 149 },
    features: [
      "Hasta 200 estudiantes",
      "Gestión de notas y asistencia",
      "Portal de padres básico",
      "Reportes del MINEDU",
      "Soporte por correo",
      "Actualizaciones incluidas",
    ],
    cta: "Comenzar gratis",
    popular: false,
  },
  {
    name: "Profesional",
    description: "Para colegios medianos (hasta 1,500 alumnos)",
    price: { monthly: 599, annual: 449 },
    features: [
      "Hasta 1,500 estudiantes",
      "Todos los módulos académicos",
      "Gestión financiera completa",
      "Comunicación integrada",
      "Integración con SUNAT",
      "Soporte prioritario 24/7",
      "API para desarrolladores",
      "Capacitación incluida",
    ],
    cta: "Solicitar demo",
    popular: true,
  },
  {
    name: "Institucional",
    description: "Para UGELES y redes de colegios",
    price: { monthly: null, annual: null },
    features: [
      "Estudiantes ilimitados",
      "Todo en Profesional",
      "Panel de control multi-colegio",
      "Integración directa con MINEDU",
      "Servidor dedicado en Perú",
      "Soporte con gerente asignado",
      "Personalización completa",
      "Capacitación presencial",
      "SLA garantizado 99.99%",
    ],
    cta: "Contactar ventas",
    popular: false,
  },
];

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <section id="pricing" className="relative py-32 lg:py-40 border-t border-foreground/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="max-w-3xl mb-20">
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase block mb-6">
            Precios
          </span>
          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight text-foreground mb-6">
            Inversión que se
            <br />
            <span className="text-stroke">justifica sola</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl">
            Planes adaptados a cada tipo de institución educativa. 
            Sin costos ocultos, sin sorpresas. Soporte y actualizaciones siempre incluidos.
          </p>
        </div>

        <div className="flex items-center gap-4 mb-16">
          <span
            className={`text-sm transition-colors ${
              !isAnnual ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Mensual
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative w-14 h-7 bg-foreground/10 rounded-full p-1 transition-colors hover:bg-foreground/20"
          >
            <div
              className={`w-5 h-5 bg-foreground rounded-full transition-transform duration-300 ${
                isAnnual ? "translate-x-7" : "translate-x-0"
              }`}
            />
          </button>
          <span
            className={`text-sm transition-colors ${
              isAnnual ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Anual
          </span>
          {isAnnual && (
            <span className="ml-2 px-2 py-1 bg-foreground text-primary-foreground text-xs font-mono">
              Ahorra 25%
            </span>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-foreground/10">
          {plans.map((plan, idx) => (
            <div
              key={plan.name}
              className={`relative p-8 lg:p-12 bg-background ${
                plan.popular ? "md:-my-4 md:py-12 lg:py-16 border-2 border-foreground" : ""
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-8 px-3 py-1 bg-foreground text-primary-foreground text-xs font-mono uppercase tracking-widest">
                  Más Popular
                </span>
              )}

              <div className="mb-8">
                <span className="font-mono text-xs text-muted-foreground">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-3xl text-foreground mt-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </div>

              <div className="mb-8 pb-8 border-b border-foreground/10">
                {plan.price.monthly !== null ? (
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-sm text-muted-foreground">S/.</span>
                    <span className="font-display text-5xl lg:text-6xl text-foreground">
                      {isAnnual ? plan.price.annual : plan.price.monthly}
                    </span>
                    <span className="text-muted-foreground">/mes</span>
                  </div>
                ) : (
                  <span className="font-display text-4xl text-foreground">Personalizado</span>
                )}
              </div>

              <ul className="space-y-4 mb-10">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setDemoOpen(true)}
                className={`w-full py-4 flex items-center justify-center gap-2 text-sm font-medium transition-all group ${
                  plan.popular
                    ? "bg-foreground text-primary-foreground hover:bg-foreground/90"
                    : "border border-foreground/20 text-foreground hover:border-foreground hover:bg-foreground/5"
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          Todos los planes incluyen actualizaciones automáticas, certificados SSL y protección DDoS.{" "}
          <a href="#" className="underline underline-offset-4 hover:text-foreground transition-colors">
            Comparar todos los planes
          </a>
        </p>
      </div>

      <DemoModal open={demoOpen} onOpenChange={setDemoOpen} />
    </section>
  );
}
