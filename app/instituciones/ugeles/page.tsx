import type { Metadata } from "next";
import {
  PageHeader,
  PageSection,
  InfoCard,
  CTAInline,
} from "@/components/page-layout";
import { FooterSection } from "@/components/landing/footer-section";

export const metadata: Metadata = {
  title: "UGELES - Educonecta",
  description:
    "Panel de gestión para Unidades de Gestión Educativa Local. Monitoreo en tiempo real de todos los colegios de tu jurisdicción.",
};

const capabilities = [
  {
    title: "Dashboard Regional en Tiempo Real",
    description:
      "Visualiza el estado de todos los colegios de tu jurisdicción en un solo panel. Matrícula, asistencia, rendimiento académico y reportes MINEDU actualizados al instante.",
    features: [
      "Mapa interactivo de colegios por distrito",
      "Indicadores clave de rendimiento por IE",
      "Alertas automáticas por anomalías",
      "Comparativos entre instituciones",
      "Exportación de reportes consolidados",
    ],
  },
  {
    title: "Supervisión Académica",
    description:
      "Monitorea el rendimiento académico de todos los colegios de tu jurisdicción. Identifica instituciones que requieren apoyo y toma decisiones basadas en datos.",
    features: [
      "Ranking de rendimiento por institución",
      "Tasas de aprobación y repitencia por IE",
      "Análisis de rendimiento por área y grado",
      "Seguimiento de indicadores del MINEDU",
      "Alertas de colegios con bajo rendimiento",
    ],
  },
  {
    title: "Gestión de Personal",
    description:
      "Control centralizado del personal docente y administrativo de todas las instituciones. Seguimiento de plazas, evaluaciones y planillas.",
    features: [
      "Directorio unificado de docentes por IE",
      "Seguimiento de evaluaciones de desempeño",
      "Control de planillas y beneficios",
      "Gestión de plazas y contrataciones",
      "Reportes para la DRE y el MINEDU",
    ],
  },
  {
    title: "Reportes Automatizados",
    description:
      "Generación automática de todos los reportes que la UGEL debe enviar a la DRE y al MINEDU. Sin duplicar información ni perder plazos.",
    features: [
      "RENAES consolidado de todas las IE",
      "REUNIS con datos actualizados en tiempo real",
      "Planilla consolidada de personal",
      "Reporte de infraestructura y servicios",
      "Estadísticas de matrícula y asistencia",
    ],
  },
  {
    title: "Comunicación Centralizada",
    description:
      "Envía circulares, alertas y comunicados a todas las instituciones de tu jurisdicción desde un solo lugar. Seguimiento de lectura y acuse.",
    features: [
      "Envío masivo de circulares a IE",
      "Confirmación de lectura por institución",
      "Alertas urgentes con notificación push",
      "Biblioteca de documentos compartidos",
      "Calendario regional de eventos",
    ],
  },
];

const impact = [
  {
    before: "Reportes manuales en Excel, tardanza de 3-5 días",
    after: "Reportes automáticos en tiempo real",
    metric: "95% reducción en tiempo de reportes",
  },
  {
    before: "Visibilidad limitada al visitar cada colegio",
    after: "Dashboard centralizado de todas las IE",
    metric: "100% visibilidad sin salir de la oficina",
  },
  {
    before: "Comunicación por WhatsApp y correo fragmentado",
    after: "Canal centralizado con confirmación de lectura",
    metric: "100% deIEs comunicadas en minutos",
  },
  {
    before: "Detección tardía de problemas en colegios",
    after: "Alertas tempranas por indicadores anómalos",
    metric: "Intervención 30 días más temprana",
  },
];

export default function UgelesPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <PageHeader
        label="UGELES"
        title="Visibilidad total de tu jurisdicción"
        description="Un panel centralizado que te da control absoluto sobre todos los colegios de tu jurisdicción. Datos en tiempo real, reportes automáticos y comunicación directa."
      />

      {/* Reto */}
      <PageSection>
        <div className="p-8 lg:p-12 bg-foreground/[0.02] border border-foreground/10">
          <h2 className="font-display text-3xl lg:text-4xl mb-4">
            El desafío de gestionar cientos de colegios
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-3xl">
            Una UGEL típica supervisa entre 50 y 300 instituciones educativas. Cada una reporta 
            información de forma diferente, en diferentes formatos y plazos. Sin una herramienta 
            centralizada, la supervisión depende de visitas presenciales y llamadas telefónicas. 
            Educonecta transforma esta realidad: un solo panel para monitorear, comunicar y 
            supervisar todas las instituciones de tu jurisdicción.
          </p>
        </div>
      </PageSection>

      {/* Capacidades */}
      <div className="border-t border-foreground/10">
        <PageSection>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            Capacidades
          </span>
          <h2 className="font-display text-4xl lg:text-6xl tracking-tight mb-16">
            Herramientas diseñadas para UGELES
          </h2>

          <div className="space-y-0">
            {capabilities.map((cap) => (
              <div key={cap.title} className="py-12 border-b border-foreground/10">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
                  <div>
                    <h3 className="font-display text-3xl mb-4">{cap.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{cap.description}</p>
                  </div>
                  <ul className="space-y-3">
                    {cap.features.map((f) => (
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

      {/* Impacto */}
      <div className="bg-foreground text-background">
        <PageSection>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-background/50 mb-6">
            <span className="w-8 h-px bg-background/30" />
            Transformación
          </span>
          <h2 className="font-display text-4xl lg:text-6xl tracking-tight mb-16">
            Antes y después de Educonecta
          </h2>

          <div className="space-y-0">
            {impact.map((item) => (
              <div key={item.metric} className="py-8 border-b border-background/10">
                <div className="grid md:grid-cols-3 gap-8 items-center">
                  <div>
                    <span className="font-mono text-xs text-background/40 block mb-2">Antes</span>
                    <p className="text-background/60">{item.before}</p>
                  </div>
                  <div>
                    <span className="font-mono text-xs text-background/40 block mb-2">Después</span>
                    <p className="text-background/80">{item.after}</p>
                  </div>
                  <div className="md:text-right">
                    <span className="font-display text-xl text-green-400">{item.metric}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PageSection>
      </div>

      {/* Implementación */}
      <PageSection>
        <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
          <span className="w-8 h-px bg-foreground/30" />
          Implementación
        </span>
        <h2 className="font-display text-4xl lg:text-6xl tracking-tight mb-16">
          Desplegado en 30 días
        </h2>

        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: "01", title: "Convenio", desc: "Firma del convenio UGEL-Educonecta y designación del coordinador." },
            { step: "02", title: "Migración", desc: "Importación de datos de todas las instituciones de la jurisdicción." },
            { step: "03", title: "Capacitación", desc: "Capacitación a supervisores y personal de la UGEL. Onboarding de IE." },
            { step: "04", title: "Operación", desc: "Sistema en producción. Soporte dedicado y seguimiento mensual." },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <span className="font-display text-5xl text-foreground/10 block mb-4">{s.step}</span>
              <h3 className="font-display text-xl mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </PageSection>

      <CTAInline />
      <FooterSection />
    </main>
  );
}
