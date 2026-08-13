import type { Metadata } from "next";
import {
  PageHeader,
  PageSection,
  InfoCard,
  SideCard,
  CTAInline,
} from "@/components/page-layout";
import { FooterSection } from "@/components/landing/footer-section";

export const metadata: Metadata = {
  title: "Colegios Privados - EduNexus",
  description:
    "EduNexus para instituciones educativas privadas del Perú. Gestión académica, financiera y administrativa integral con integración SUNAT.",
};

const modules = [
  {
    title: "Gestión Académica Completa",
    description:
      "Configura tus propias escalas de calificación, áreas curriculares y reglamentos. Genera libretas, boletines y certificados con el diseño de tu institución.",
    features: [
      "Escalas de calificación personalizables",
      "Configuración de áreas y competencias propias",
      "Boletines y libretas con imagen institucional",
      "Historial académico digital del estudiante",
      "Análisis de rendimiento por docente y sección",
    ],
  },
  {
    title: "Gestión Financiera y Tesorería",
    description:
      "Control total de pensiones, cuotas, becas y descuentos. Facturación electrónica con SUNAT integrada. Conciliación bancaria automática.",
    features: [
      "Registro de pensiones por alumno y período",
      "Generación automática de cuotas mensuales",
      "Facturación electrónica SUNAT integrada",
      "Conciliación bancaria con Interbank, BCP y BBVA",
      "Reportes de recaudación y morosidad en tiempo real",
      "Gestión de becas y subsidios parciales",
    ],
  },
  {
    title: "Matrícula Digital",
    description:
      "Proceso de matrícula 100% online para padres. Validación automática de documentos, generación de kardex y seguimiento del estado de inscripción.",
    features: [
      "Formulario de matrícula online para padres",
      "Validación automática de DNI y documentos",
      "Generación de kardex y expediente digital",
      "Seguimiento del estado de matrícula",
      "Lista de espera automatizada",
    ],
  },
  {
    title: "Comunicación Institucional",
    description:
      "Canal directo entre el colegio, docentes, padres y estudiantes. Circulares, eventos, calificaciones y notificaciones en tiempo real.",
    features: [
      "Circulares y comunicados digitales",
      "Notificaciones push para eventos urgentes",
      "Calendario escolar compartido",
      "Chat seguro entre docentes y padres",
      "Portal de padres con acceso 24/7",
    ],
  },
];

const benefits = [
  {
    title: "Aumenta la recaudación",
    description:
      "La facturación electrónica SUNAT y los recordatorios automátivos reducen la morosidad en un 40%. Los padres pueden pagar con Yape, PLIN o transferencia bancaria.",
  },
  {
    title: "Reduce costos operativos",
    description:
      "Un solo sistema reemplaza planillas Excel, software contable, sistema de notas y plataforma de comunicación. Ahorro promedio de S/. 36,000 anuales.",
  },
  {
    title: "Retención de estudiantes",
    description:
      "La experiencia digital moderna que esperan los padres. Un colegio que usa tecnología demuestra compromiso con la innovación y la calidad educativa.",
  },
  {
    title: "Imagen profesional",
    description:
      "Boletines, certificados y documentos con el diseño de tu institución. Un sistema de gestión refuerza la marca del colegio.",
  },
  {
    title: "Cumplimiento MINEDU",
    description:
      "Aunque seas privado, también debes reportar al MINEDU. EduNexus genera automáticamente todos los reportes requeridos.",
  },
  {
    title: "Escalabilidad",
    description:
      "Desde un colegio de 50 alumnos hasta una red de 5,000. EduNexus crece con tu institución sin necesidad de cambiar de plataforma.",
  },
];

const pricing = [
  {
    name: "Básico",
    price: "S/. 199",
    period: "/mes",
    description: "Hasta 200 alumnos",
    features: ["Gestión académica", "Portal de padres", "Reportes MINEDU", "Soporte por correo"],
  },
  {
    name: "Profesional",
    price: "S/. 599",
    period: "/mes",
    description: "Hasta 1,500 alumnos",
    features: ["Todo en Básico", "Gestión financiera SUNAT", "Matrícula digital", "Comunicación integrada", "API", "Soporte 24/7"],
    popular: true,
  },
  {
    name: "Institucional",
    price: "Personalizado",
    period: "",
    description: "Redes y franquicias",
    features: ["Todo en Profesional", "Multi-colegio", "Servidor dedicado", "Personalización total", "Gerente asignado"],
  },
];

export default function ColegiosPrivadosPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <PageHeader
        label="Colegios privados"
        title="Potencia tu colegio con tecnología de vanguardia"
        description="EduNexus ofrece a los colegios privados del Perú una plataforma integral que combina gestión académica, financiera y comunicacional en un solo sistema."
        side={
          <div className="space-y-4">
            <SideCard label="Planes">
              <div className="space-y-3">
                {[
                  { n: "Básico", p: "S/. 199", s: "Hasta 200 alumnos" },
                  { n: "Profesional", p: "S/. 599", s: "Hasta 1,500 alumnos" },
                  { n: "Institucional", p: "Personalizado", s: "Redes y franquicias" },
                ].map((p) => (
                  <div key={p.n} className="flex items-baseline justify-between border-b border-foreground/5 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.n}</p>
                      <p className="text-xs text-muted-foreground/70">{p.s}</p>
                    </div>
                    <span className="font-display text-lg text-foreground">{p.p}</span>
                  </div>
                ))}
              </div>
            </SideCard>
            <SideCard label="Ahorro promedio">
              <p className="font-display text-3xl text-foreground">S/. 36,000</p>
              <p className="text-xs text-muted-foreground/70 mt-1">anuales por colegio</p>
            </SideCard>
          </div>
        }
      />

      {/* Reto */}
      <PageSection>
        <div className="p-8 lg:p-12 bg-foreground/[0.02] border border-foreground/10">
          <h2 className="font-display text-3xl lg:text-4xl mb-4">
            El reto del colegio privado moderno
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-3xl">
            Los colegios privados compiten por atraer y retener estudiantes. Los padres esperan 
            tecnología de vanguardia, transparencia en las calificaciones y facilidades de pago. 
            Al mismo tiempo, la carga administrativa de pensiones, facturación SUNAT y reportes 
            al MINEDU consume horas valiosas del personal. EduNexus resuelve ambos desafíos: 
            impressiona a los padres y libera a tu equipo del trabajo repetitivo.
          </p>
        </div>
      </PageSection>

      {/* Módulos */}
      <div className="border-t border-foreground/10">
        <PageSection>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            Módulos
          </span>
          <h2 className="font-display text-4xl lg:text-6xl tracking-tight mb-16">
            Todo integrado, nada separado
          </h2>

          <div className="space-y-0">
            {modules.map((mod) => (
              <div key={mod.title} className="py-12 border-b border-foreground/10">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
                  <div>
                    <h3 className="font-display text-3xl mb-4">{mod.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{mod.description}</p>
                  </div>
                  <ul className="space-y-3">
                    {mod.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 mt-2 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </PageSection>
      </div>

      {/* Beneficios */}
      <div className="bg-foreground text-background">
        <PageSection>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-background/50 mb-6">
            <span className="w-8 h-px bg-background/30" />
            Beneficios
          </span>
          <h2 className="font-display text-4xl lg:text-6xl tracking-tight mb-16">
            ROI que se justifica solo
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-background/10">
            {benefits.map((b) => (
              <div key={b.title} className="bg-foreground p-8 group">
                <h3 className="font-display text-xl mb-3 group-hover:translate-x-2 transition-transform duration-300">
                  {b.title}
                </h3>
                <p className="text-sm text-background/60 leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </PageSection>
      </div>

      {/* Precios */}
      <PageSection>
        <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
          <span className="w-8 h-px bg-foreground/30" />
          Precios
        </span>
        <h2 className="font-display text-4xl lg:text-6xl tracking-tight mb-16">
          Planes para cada tamaño
        </h2>

        <div className="grid md:grid-cols-3 gap-px bg-foreground/10">
          {pricing.map((plan) => (
            <div
              key={plan.name}
              className={`bg-background p-8 lg:p-10 ${
                plan.popular ? "border-2 border-foreground relative" : ""
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-8 px-3 py-1 bg-foreground text-primary-foreground text-xs font-mono uppercase tracking-widest">
                  Más Popular
                </span>
              )}
              <h3 className="font-display text-2xl mb-2">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
              <div className="flex items-baseline gap-1 mb-8 pb-8 border-b border-foreground/10">
                <span className="font-display text-4xl">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 mt-2 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </PageSection>

      <CTAInline />
      <FooterSection />
    </main>
  );
}
