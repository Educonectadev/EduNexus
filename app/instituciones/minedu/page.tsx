import type { Metadata } from "next";
import {
  PageHeader,
  PageSection,
  InfoCard,
  CTAInline,
} from "@/components/page-layout";
import { FooterSection } from "@/components/landing/footer-section";

export const metadata: Metadata = {
  title: "MINEDU - EduNexus",
  description:
    "Plataforma de soporte para el Ministerio de Educación del Perú. Datos consolidados de todo el sistema educativo nacional en tiempo real.",
};

const modules = [
  {
    title: "Datos Educativos Nacionales",
    description:
      "Consolidación de información de más de 18,000 colegios en 25 regiones. Datos actualizados en tiempo real sobre matrícula, asistencia, rendimiento y recursos humanos del sistema educativo peruano.",
    features: [
      "Base de datos unificada del sistema educativo nacional",
      "Actualización en tiempo real desde cada institución",
      "Validación automática de consistencia de datos",
      "API开放 para investigadores y organismos públicos",
      "Dashboard interactivo con filtros por región, UGEL y distrito",
    ],
  },
  {
    title: "Monitoreo de Indicadores Clave",
    description:
      "Seguimiento en tiempo real de los indicadores del Plan Estratégico de Desarrollo Educativo (PEDE). Alertas automáticas cuando un indicador cae por debajo del umbral esperado.",
    features: [
      "Tasa neta de matrícula por nivel y modalidad",
      "Índice de permanencia y eficiencia interna",
      "Tasa de aprobación por grado y área",
      "Indicadores de infraestructura y recursos",
      "Comparativas regionales e históricas",
    ],
  },
  {
    title: "Gestión de Programas Educativos",
    description:
      "Seguimiento de la implementación de programas nacionales: Doble Jornada Escolar, Qali Warma, AFA, PRONOEI y otros programas de inversión en educación.",
    features: [
      "Registro de instituciones beneficiarias por programa",
      "Seguimiento de avance y cumplimiento de metas",
      "Reportes de ejecución presupuestal por programa",
      "Alertas de incumplimiento de plazos",
      "Evaluación de impacto con datos reales",
    ],
  },
  {
    title: "Planeamiento Educativo",
    description:
      "Herramientas de análisis para la toma de decisiones a nivel nacional. Simulación de escenarios, proyecciones de matrícula y planificación de infraestructura.",
    features: [
      "Proyección de matrícula por región y nivel",
      "Análisis de brechas de infraestructura",
      "Simulación de escenarios presupuestales",
      "Planificación de dotación de docentes",
      "Mapa de cobertura educativa nacional",
    ],
  },
];

const dataPoints = [
  { value: "18,000+", label: "colegios reportando" },
  { value: "2.4M", label: "estudiantes activos" },
  { value: "25", label: "regiones cubiertas" },
  { value: "156,000+", label: "docentes registrados" },
  { value: "3,200", label: "UGELES conectadas" },
  { value: "99.9%", label: "disponibilidad" },
];

const benefits = [
  {
    title: "Decisiones basadas en datos",
    description:
      "En lugar de esperar reportes trimestrales, el MINEDU tiene acceso a datos actualizados diariamente. Las políticas públicas se diseñan con información real, no estimaciones.",
  },
  {
    title: "Detección temprana de problemas",
    description:
      "Alertas automáticas cuando un colegio, distrito o región muestra indicadores preocupantes. Permite intervenciones oportunas antes de que los problemas se agraven.",
  },
  {
    title: "Transparencia y rendición de cuentas",
    description:
      "Todos los datos son auditables y verificables. La ciudadanía y los órganos de control pueden acceder a información confiable sobre el estado de la educación nacional.",
  },
  {
    title: "Eficiencia en la inversión",
    description:
      "Al conocer exactamente dónde están las necesidades, la inversión pública en educación se分配 de manera más eficiente, reduciendo desperdicios y duplicidades.",
  },
];

export default function MineduPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <PageHeader
        label="MINEDU"
        title="Tecnología al servicio de la política educativa"
        description="EduNexus proporciona al Ministerio de Educación datos confiables, actualizados y auditables del sistema educativo nacional para fundamentar las decisiones de política pública."
      />

      {/* Datos */}
      <PageSection>
        <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
          <span className="w-8 h-px bg-foreground/30" />
          Nacional
        </span>
        <h2 className="font-display text-4xl lg:text-6xl tracking-tight mb-12">
          El pulso de la educación peruana
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-foreground/10 mb-16">
          {dataPoints.map((d) => (
            <div key={d.label} className="bg-background p-8 lg:p-10 text-center">
              <div className="font-display text-4xl lg:text-5xl mb-2">{d.value}</div>
              <div className="text-sm text-muted-foreground">{d.label}</div>
            </div>
          ))}
        </div>

        <div className="p-8 lg:p-12 bg-foreground/[0.02] border border-foreground/10">
          <h2 className="font-display text-3xl lg:text-4xl mb-4">
            Una plataforma para todo el sistema educativo
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-3xl">
            EduNexus conecta cada colegio del Perú con el MINEDU a través de las UGELES. 
            Los datos fluyen desde el aula hasta el despacho ministerial de forma automática, 
            confiable y segura. Cada directivo, docente y estudiante es un punto de información 
            que alimenta las decisiones que afectan a millones de peruanos.
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
            Herramientas para la gestión ministerial
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
            Impacto
          </span>
          <h2 className="font-display text-4xl lg:text-6xl tracking-tight mb-16">
            Datos que transforman políticas
          </h2>

          <div className="grid md:grid-cols-2 gap-px bg-background/10">
            {benefits.map((b) => (
              <div key={b.title} className="bg-foreground p-8 lg:p-10 group">
                <h3 className="font-display text-xl mb-3 group-hover:translate-x-2 transition-transform duration-300">
                  {b.title}
                </h3>
                <p className="text-sm text-background/60 leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </PageSection>
      </div>

      {/* Convenio */}
      <PageSection>
        <div className="p-8 lg:p-12 border border-foreground/10">
          <h2 className="font-display text-3xl lg:text-4xl mb-6">
            Modelo de implementación
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-3xl mb-8">
            La implementación a nivel nacional se realiza en fases, comenzando por las regiones 
            con mayor densidad educativa y expandiéndose progresivamente. Cada fase incluye 
            migración de datos, capacitación y soporte dedicado.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                phase: "Fase 1",
                title: "Regiones piloto",
                desc: "Lima, Arequipa y La Libertad. 6,000 colegios conectados en 3 meses.",
              },
              {
                phase: "Fase 2",
                title: "Expansión costera",
                desc: "12 regiones de la costa. 12,000 colegios adicionales en 6 meses.",
              },
              {
                phase: "Fase 3",
                title: "Cobertura total",
                desc: "Sierra y selva. Las 25 regiones del Perú conectadas en 12 meses.",
              },
            ].map((p) => (
              <div key={p.phase}>
                <span className="font-mono text-sm text-muted-foreground block mb-2">{p.phase}</span>
                <h3 className="font-display text-xl mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </PageSection>

      <CTAInline />
      <FooterSection />
    </main>
  );
}
