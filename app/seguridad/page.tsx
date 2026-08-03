import type { Metadata } from "next";
import {
  PageHeader,
  PageSection,
  InfoCard,
  CTAInline,
} from "@/components/page-layout";
import { FooterSection } from "@/components/landing/footer-section";

export const metadata: Metadata = {
  title: "Seguridad - Educonecta",
  description:
    "Conoce las medidas de seguridad que protegen la información de estudiantes, docentes e instituciones en Educonecta.",
};

const measures = [
  {
    title: "Cifrado de extremo a extremo",
    items: [
      "AES-256 para datos en reposo",
      "TLS 1.3 para datos en tránsito",
      "Cifrado de respaldos automático",
      "Gestión de claves con HSM",
    ],
  },
  {
    title: "Control de acceso",
    items: [
      "Autenticación multi-factor (MFA)",
      "Acceso basado en roles (RBAC)",
      "Principio de mínimo privilegio",
      "Sesiones con expiración automática",
    ],
  },
  {
    title: "Monitoreo y auditoría",
    items: [
      "Registro completo de actividad (logs)",
      "Alertas de comportamiento sospechoso",
      "Monitoreo 24/7 de la infraestructura",
      "Auditorías de seguridad trimestrales",
    ],
  },
  {
    title: "Protección de datos",
    items: [
      "Aislamiento de datos por institución",
      "Copias de seguridad diarias",
      "Retención de respaldos: 90 días",
      "Eliminación segura de datos",
    ],
  },
];

const certifications = [
  {
    name: "ISO 27001",
    description: "Sistema de Gestión de Seguridad de la Información certificado internacionalmente.",
  },
  {
    name: "SOC 2 Tipo II",
    description: "Controles de seguridad, disponibilidad y confidencialidad auditados externamente.",
  },
  {
    name: "PDPL",
    description: "Cumplimiento total con la Ley N° 29733 de Protección de Datos Personales del Perú.",
  },
  {
    name: "GDPR",
    description: "Cumplimiento con el Reglamento General de Protección de Datos de la Unión Europea.",
  },
];

export default function SeguridadPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <PageHeader
        label="Seguridad"
        title="Seguridad de nivel bancario para la educación"
        description="Los datos de más de 2.4 millones de estudiantes peruanos están protegidos con los más altos estándares internacionales de ciberseguridad."
      />

      {/* Resumen */}
      <PageSection>
        <div className="grid lg:grid-cols-4 gap-8 mb-16">
          {[
            { value: "0", label: "incidentes de seguridad" },
            { value: "AES-256", label: "cifrado de datos" },
            { value: "24/7", label: "monitoreo activo" },
            { value: "99.99%", label: "disponibilidad" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-8 border border-foreground/10">
              <div className="font-display text-4xl lg:text-5xl mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </PageSection>

      {/* Medidas */}
      <div className="bg-foreground text-background">
        <PageSection>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-background/50 mb-6">
            <span className="w-8 h-px bg-background/30" />
            Medidas de seguridad
          </span>
          <h2 className="font-display text-4xl lg:text-6xl tracking-tight mb-16">
            Múltiples capas de protección
          </h2>

          <div className="grid md:grid-cols-2 gap-px bg-background/10">
            {measures.map((m) => (
              <div key={m.title} className="bg-foreground p-8 lg:p-10">
                <h3 className="font-display text-2xl mb-6">{m.title}</h3>
                <ul className="space-y-3">
                  {m.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-background/70">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </PageSection>
      </div>

      {/* Certificaciones */}
      <PageSection>
        <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
          <span className="w-8 h-px bg-foreground/30" />
          Certificaciones
        </span>
        <h2 className="font-display text-4xl lg:text-6xl tracking-tight mb-12">
          Estándares internacionales
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {certifications.map((cert) => (
            <div key={cert.name} className="p-8 border border-foreground/10 hover:border-foreground/20 transition-all group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 flex items-center justify-center border border-foreground/10 group-hover:bg-foreground group-hover:text-background transition-colors duration-300">
                  <span className="font-mono text-sm font-bold">{cert.name.slice(0, 3)}</span>
                </div>
                <h3 className="font-display text-2xl group-hover:translate-x-2 transition-transform duration-300">
                  {cert.name}
                </h3>
              </div>
              <p className="text-muted-foreground">{cert.description}</p>
            </div>
          ))}
        </div>
      </PageSection>

      {/* Arquitectura */}
      <div className="bg-foreground/[0.02]">
        <PageSection>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            Arquitectura
          </span>
          <h2 className="font-display text-4xl lg:text-6xl tracking-tight mb-12">
            Diseñado para ser inquebrantable
          </h2>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                title: "Infraestructura en Perú",
                description: "Servidores exclusivamente en territorio peruano. Los datos nunca salen del país, cumpliendo con la legislación nacional.",
              },
              {
                title: "Arquitectura de microservicios",
                description: "Cada módulo opera de forma aislada. Un incidente en un componente no afecta a los demás, garantizando disponibilidad continua.",
              },
              {
                title: "Respuesta a incidentes",
                description: "Equipo dedicado de seguridad con tiempo de respuesta de 15 minutos para incidentes críticos. Protocolos documentados y probados.",
              },
            ].map((item) => (
              <InfoCard key={item.title} title={item.title}>
                <p>{item.description}</p>
              </InfoCard>
            ))}
          </div>
        </PageSection>
      </div>

      {/* Reporte */}
      <PageSection>
        <div className="p-8 lg:p-12 border border-foreground/10 text-center">
          <h2 className="font-display text-3xl mb-4">¿Encontraste una vulnerabilidad?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Tenemos un programa de divulgación responsable. Si identificas una vulnerabilidad de seguridad, 
            repórtala a nuestro equipo y recibirá atención inmediata.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:seguridad@educonecta.pe"
              className="px-8 py-4 bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors"
            >
              Reportar vulnerabilidad
            </a>
            <a
              href="mailto:seguridad@educonecta.pe"
              className="px-8 py-4 border border-foreground/20 text-foreground hover:border-foreground hover:bg-foreground/5 transition-all"
            >
              seguridad@educonecta.pe
            </a>
          </div>
        </div>
      </PageSection>

      <CTAInline />
      <FooterSection />
    </main>
  );
}
