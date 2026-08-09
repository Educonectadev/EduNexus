import type { Metadata } from "next";
import {
  PageHeader,
  PageSection,
  InfoCard,
  CTAInline,
} from "@/components/page-layout";
import { FooterSection } from "@/components/landing/footer-section";

export const metadata: Metadata = {
  title: "Colegios Públicos - EduNexus",
  description:
    "EduNexus para instituciones educativas públicas del Perú. Gestión académica gratuita, reportes al MINEDU automatizados y soporte completo.",
};

const modules = [
  {
    title: "Gestión Académica",
    description:
      "Registro de calificaciones según las escalas del MINEDU, cálculo automático de promedios, generación de libretas de notas y reportes de rendimiento por sección, grado y UGEL.",
    features: [
      "Escalas de calificación preconfiguradas (vigesimal, decenal, cualitativa)",
      "Cálculo automático de promedios por área y grado",
      "Generación de libretas de notas en formato MINEDU",
      "Reportes de rendimiento por sección y grado",
      "Historial académico completo del estudiante",
    ],
  },
  {
    title: "Asistencia y Puntualidad",
    description:
      "Control diario de asistencia con reportes automáticos para la UGEL. Registro de tardanzas, inasistencias justificadas y no justificadas.",
    features: [
      "Registro diario de asistencia por sección",
      "Alertas automáticas por inasistencia reiterada",
      "Reportes mensuales para UGEL y MINEDU",
      "Estadísticas de puntualidad por docente",
      "Justificación digital de inasistencias",
    ],
  },
  {
    title: "Reportes MINEDU",
    description:
      "Generación automática de todos los reportes requeridos por el Ministerio de Educación. Sin duplicar información ni perder tiempo en planillas.",
    features: [
      "RENAES: reporte de matrícula automatizado",
      "REUNIS: estadísticas unificadas en tiempo real",
      "Planilla de personal docente y administrativo",
      "Reporte de infraestructura y servicios",
      "Exportación en formatos oficiales del MINEDU",
    ],
  },
  {
    title: "Portal de Padres",
    description:
      "Acceso 24/7 para padres y apoderados. Consulta de notas, asistencia, comunicados y calificaciones sin necesidad de ir al colegio.",
    features: [
      "Consulta de notas en tiempo real",
      "Historial de asistencia del estudiante",
      "Recepción de comunicados y circulares",
      "Calendario de eventos del colegio",
      "Chat directo con docentes",
    ],
  },
];

const advantages = [
  {
    title: "Plan gratuito para colegios públicos",
    description:
      "Los colegios de gestión pública acceden a EduNexus sin costo. Financiado mediante convenios con UGELES y el MINEDU.",
  },
  {
    title: "Cumplimiento automático del MINEDU",
    description:
      "Todos los reportes, formatos y plazos del Ministerio se generan automáticamente. Nunca perderás una fecha límite.",
  },
  {
    title: "Soporte en 25 regiones",
    description:
      "Equipo de soporte técnico capacitado en las realidades de cada región. Atención presencial en las principales ciudades y remota para zonas alejadas.",
  },
  {
    title: "Capacitación incluida",
    description:
      "Programa de capacitación gratuito para directivos, docentes y personal administrativo. Capacitación presencial en la sede del colegio.",
  },
  {
    title: "Datos protegidos en Perú",
    description:
      "Todos los datos de tus estudiantes están almacenados en servidores dentro del territorio peruano, cumpliendo la Ley de Protección de Datos Personales.",
  },
  {
    title: "Sin inversión en infraestructura",
    description:
      "EduNexus es 100% en la nube. Solo necesitas una computadora con internet. Sin servidores, sin mantenimiento, sin costos ocultos.",
  },
];

const stats = [
  { value: "12,400+", label: "colegios públicos activos" },
  { value: "1.8M", label: "estudiantes gestionados" },
  { value: "98,000+", label: "docentes capacitados" },
  { value: "25", label: "regiones conectadas" },
];

export default function ColegiosPublicosPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <PageHeader
        label="Colegios públicos"
        title="Gestión inteligente para la educación pública"
        description="EduNexus está diseñado para las necesidades específicas de los colegios del Estado peruano. Automatiza reportes, simplifica la gestión y cumple con el MINEDU sin esfuerzo."
      />

      {/* Stats */}
      <PageSection>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {stats.map((s) => (
            <div key={s.label} className="text-center p-8 border border-foreground/10">
              <div className="font-display text-4xl lg:text-5xl mb-2">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="p-8 lg:p-12 bg-foreground/[0.02] border border-foreground/10">
          <h2 className="font-display text-3xl lg:text-4xl mb-4">
            ¿Por qué colegios públicos eligen EduNexus?
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-3xl">
            Los colegios públicos enfrentan desafíos únicos: personal reducido, presupuestos limitados 
            y una carga administrativa enorme por los reportes del MINEDU. EduNexus fue creado para 
            resolver exactamente estos problemas. Nuestra plataforma elimina el trabajo manual repetitivo, 
            reduce errores y garantiza el cumplimiento oportuno de todos los reportes oficiales.
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
            Todo lo que tu colegio necesita
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

      {/* Ventajas */}
      <div className="bg-foreground text-background">
        <PageSection>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-background/50 mb-6">
            <span className="w-8 h-px bg-background/30" />
            Ventajas
          </span>
          <h2 className="font-display text-4xl lg:text-6xl tracking-tight mb-16">
            Diseñado para la realidad del Estado
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-background/10">
            {advantages.map((a) => (
              <div key={a.title} className="bg-foreground p-8 group">
                <h3 className="font-display text-xl mb-3 group-hover:translate-x-2 transition-transform duration-300">
                  {a.title}
                </h3>
                <p className="text-sm text-background/60 leading-relaxed">{a.description}</p>
              </div>
            ))}
          </div>
        </PageSection>
      </div>

      {/* Proceso de adopción */}
      <PageSection>
        <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
          <span className="w-8 h-px bg-foreground/30" />
          Proceso
        </span>
        <h2 className="font-display text-4xl lg:text-6xl tracking-tight mb-16">
          Cómo empezar
        </h2>

        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: "01", title: "Solicitud", desc: "Tu UGEL presenta la solicitud de incorporación o el colegio se registra directamente." },
            { step: "02", title: "Verificación", desc: "Validamos los datos de la institución con los registros del MINEDU en 48 horas." },
            { step: "03", title: "Capacitación", desc: "Nuestro equipo capacita a directivos y docentes de forma gratuita, presencial o remota." },
            { step: "04", title: "Operación", desc: "El colegio comienza a operar. Soporte permanente y actualizaciones automáticas." },
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
