import type { Metadata } from "next";
import {
  PageHeader,
  PageSection,
  InfoCard,
  CTAInline,
} from "@/components/page-layout";
import { FooterSection } from "@/components/landing/footer-section";

export const metadata: Metadata = {
  title: "Trabaja con Nosotros - Educonecta",
  description:
    "Únete al equipo que está transformando la educación en el Perú. Buscamos personas apasionadas por la tecnología y la educación.",
};

const positions = [
  {
    department: "Ingeniería",
    title: "Ingeniero(a) de Software Senior",
    location: "Lima, Perú (Híbrido)",
    type: "Tiempo completo",
    description:
      "Buscamos un ingeniero de software con experiencia en arquitecturas de microservicios y bases de datos distribuidas. Trabajarás en el core de nuestra plataforma que sirve a millones de estudiantes.",
    requirements: [
      "5+ años de experiencia en desarrollo de software",
      "Dominio de TypeScript, Node.js y bases de datos SQL/NoSQL",
      "Experiencia con arquitecturas de microservicios",
      "Conocimiento de seguridad de aplicaciones web",
      "Inglés intermedio-avanzado",
    ],
  },
  {
    department: "Producto",
    title: "Product Manager - Educación",
    location: "Lima, Perú (Presencial)",
    type: "Tiempo completo",
    description:
      "Necesitamos un Product Manager que entienda la educación peruana y pueda traducir las necesidades de directores, docentes y padres en funcionalidades que transformen la experiencia educativa.",
    requirements: [
      "3+ años de experiencia en gestión de producto digital",
      "Experiencia en el sector educación o EdTech",
      "Capacidad de investigación con usuarios",
      "Experiencia metodologías ágiles",
      "Conocimiento del ecosistema educativo peruano",
    ],
  },
  {
    department: "Diseño",
    title: "Diseñador(a) UX/UI Senior",
    location: "Lima, Perú (Híbrido)",
    type: "Tiempo completo",
    description:
      "Buscamos un diseñador que pueda crear experiencias intuitivas para usuarios con diferentes niveles de alfabetización digital, desde directores de UGEL hasta padres de familia en zonas rurales.",
    requirements: [
      "4+ años de experiencia en diseño UX/UI",
      "Portafolio que demuestre diseño centrado en el usuario",
      "Experiencia diseñando para audiencias diversas",
      "Dominio de Figma y herramientas de prototipado",
      "Conocimiento de accesibilidad web (WCAG)",
    ],
  },
  {
    department: "Educación",
    title: "Especialista Pedagógico Digital",
    location: "Remoto (Perú)",
    type: "Tiempo completo",
    description:
      "Un puente entre la tecnología y la educación. Evaluarás necesidades pedagógicas, diseñarás flujos de uso y capacitarás a instituciones educativas en todo el país.",
    requirements: [
      "Licenciatura en Educación o Psicología Educativa",
      "3+ años de experiencia en gestión institucional educativa",
      "Experiencia en implementación de tecnologías educativas",
      "Capacidad de trabajo con equipos multidisciplinarios",
      "Disponibilidad para viajar a regiones",
    ],
  },
  {
    department: "Ventas",
    title: "Ejecutivo(a) de Cuentas Institucionales",
    location: "Lima, Perú",
    type: "Tiempo completo",
    description:
      "Representarán Educonecta ante las UGELES, ministerios y grandes redes de colegios. Venderás soluciones que transforman la educación, no solo software.",
    requirements: [
      "3+ años de experiencia en ventas B2B o institucional",
      "Experiencia en el sector educación o gobierno",
      "Excelentes habilidades de presentación y negociación",
      "Conocimiento del ecosistema educativo peruano",
      "Carrera de Derecho, Ingeniería o Administración",
    ],
  },
  {
    department: "Soporte",
    title: "Ingeniero(a) de Soporte Técnico Nivel 2",
    location: "Lima, Perú",
    type: "Tiempo completo",
    description:
      "Brindar soporte técnico avanzado a nuestras instituciones educativas. Diagnosticar, resolver y documentar incidencias complejas del sistema.",
    requirements: [
      "2+ años de experiencia en soporte técnico",
      "Conocimiento de bases de datos y consultas SQL",
      "Experiencia con sistemas de tickets (Jira, Zendesk)",
      "Capacidad de explicar problemas técnicos a usuarios no técnicos",
      "Certificaciones de soporte son un plus",
    ],
  },
];

const benefits = [
  { title: "Salario competitivo", description: "Remuneración por encima del mercado tech peruano" },
  { title: "Trabajo híbrido", description: "3 días oficina, 2 días casa (o 100% remoto en ciertos roles)" },
  { title: "Capacitación continua", description: "Presupuesto anual para cursos, certificaciones y conferencias" },
  { title: "Salud completa", description: "Seguro de salud integral para ti y tu familia" },
  { title: "Vacaciones flexibles", description: "Más allá de lo legal: 25 días de vacaciones al año" },
  { title: "Impacto real", description: "Tu trabajo llega a millones de estudiantes peruanos" },
  { title: "Acciones de la empresa", description: "Todos los empleados son parte de Educonecta" },
  { title: "Crecimiento", description: "Plan de carrera claro con revisiones semestrales" },
];

export default function TrabajaPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <PageHeader
        label="Trabaja con nosotros"
        title="Construye el futuro de la educación"
        description="Buscamos personas extraordinarias que quieran usar tecnología para resolver los problemas educativos más grandes de Latinoamérica."
      />

      {/* Beneficios */}
      <PageSection>
        <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
          <span className="w-8 h-px bg-foreground/30" />
          Beneficios
        </span>
        <h2 className="font-display text-4xl lg:text-6xl tracking-tight mb-12">
          Por qué trabajar en Educonecta
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-foreground/10">
          {benefits.map((b) => (
            <div key={b.title} className="bg-background p-8 group">
              <h3 className="font-display text-xl mb-2 group-hover:translate-x-2 transition-transform duration-300">
                {b.title}
              </h3>
              <p className="text-sm text-muted-foreground">{b.description}</p>
            </div>
          ))}
        </div>
      </PageSection>

      {/* Ofertas laborales */}
      <div className="bg-foreground text-background">
        <PageSection>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-background/50 mb-6">
            <span className="w-8 h-px bg-background/30" />
            Posiciones abiertas
          </span>
          <h2 className="font-display text-4xl lg:text-6xl tracking-tight mb-16">
            Únete al equipo
          </h2>

          <div className="space-y-0">
            {positions.map((pos) => (
              <div
                key={pos.title}
                className="py-10 border-b border-background/10 group cursor-pointer"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                  <div>
                    <span className="font-mono text-sm text-background/40 block mb-1">
                      {pos.department}
                    </span>
                    <h3 className="font-display text-2xl group-hover:translate-x-2 transition-transform duration-300">
                      {pos.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-background/60">
                    <span>{pos.location}</span>
                    <span className="px-3 py-1 border border-background/20 text-xs font-mono">
                      {pos.type}
                    </span>
                  </div>
                </div>
                <p className="text-background/60 leading-relaxed max-w-3xl mb-6">
                  {pos.description}
                </p>
                <ul className="space-y-2 mb-6">
                  {pos.requirements.map((req) => (
                    <li key={req} className="flex items-start gap-3 text-sm text-background/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-background/30 mt-2 shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
                <span className="text-sm font-mono text-background/40 group-hover:text-background transition-colors">
                  Aplicar →
                </span>
              </div>
            ))}
          </div>
        </PageSection>
      </div>

      {/* Proceso */}
      <PageSection>
        <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
          <span className="w-8 h-px bg-foreground/30" />
          Proceso
        </span>
        <h2 className="font-display text-4xl lg:text-6xl tracking-tight mb-16">
          Cómo es nuestro proceso
        </h2>

        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: "01", title: "Aplicación", desc: "Envía tu CV y cuéntanos por qué te interesa Educonecta." },
            { step: "02", title: "Entrevista inicial", desc: "Conversamos 30 minutos sobre tu experiencia y expectativas." },
            { step: "03", title: "Desafío técnico", desc: "Un caso práctico relevante al puesto (sin trampas ni tiempo imposible)." },
            { step: "04", title: "Oferta", desc: "Si todo va bien, te hacemos una oferta en menos de 48 horas." },
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
