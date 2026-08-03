import type { Metadata } from "next";
import {
  PageHeader,
  PageSection,
  CTAInline,
} from "@/components/page-layout";
import { FooterSection } from "@/components/landing/footer-section";

export const metadata: Metadata = {
  title: "PDPL - Ley de Protección de Datos Personales - Educonecta",
  description:
    "Cómo Educonecta cumple con la Ley N° 29733 de Protección de Datos Personales y sus normas reglamentarias.",
};

const articles = [
  {
    id: "I",
    title: "Disposiciones Generales",
    description:
      "La Ley N° 29733 tiene por finalidad proteger los datos personales, así como los derechos de las personas a su autodeterminación informativa y privacidad. Educonecta cumple plenamente con todos los principios establecidos en esta ley.",
    details: [
      "Principio de legalidad: todo tratamiento de datos tiene base legal.",
      "Principio de finalidad: los datos se recopilan para fines específicos y legítimos.",
      "Principio de proporcionalidad: solo se recopila la información necesaria.",
      "Principio de calidad: los datos se mantienen exactos y actualizados.",
      "Principio de seguridad: medidas técnicas y organizativas para proteger los datos.",
      "Principio de confidencialidad: acceso restringido a información personal.",
    ],
  },
  {
    id: "II",
    title: "Derechos ARCO",
    description:
      "La ley establece los derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO). Educonecta facilita el ejercicio de estos derechos a todos los titulares de datos.",
    details: [
      "Derecho de Acceso: los usuarios pueden solicitar información sobre sus datos tratados.",
      "Derecho de Rectificación: los usuarios pueden corregir datos inexactos.",
      "Derecho de Cancelación: los usuarios pueden solicitar la eliminación de datos innecesarios.",
      "Derecho de Oposición: los usuarios pueden oponerse al tratamiento de sus datos.",
      "Plazo de respuesta: máximo 8 días hábiles para atender solicitudes.",
      "Canal de contacto: privacidad@educonecta.pe para todos los reclamos.",
    ],
  },
  {
    id: "III",
    title: "Consentimiento",
    description:
      "El consentimiento es la base fundamental del tratamiento de datos en Educonecta. Recopilamos consentimiento expreso, informado y específico de cada titular.",
    details: [
      "Consentimiento explícito: los usuarios aceptan expresamente el tratamiento.",
      "Información clara: se describe detalladamente qué datos se recopilan y para qué.",
      "Consentimiento granular: los usuarios pueden aceptar o rechazar fines específicos.",
      "Revocación: los usuarios pueden retirar su consentimiento en cualquier momento.",
      "Menores de edad: se requiere autorización del padre, madre o apoderado.",
      "Registro: mantenemos un registro de todos los consentimientos otorgados.",
    ],
  },
  {
    id: "IV",
    title: "Responsable del Tratamiento",
    description:
      "Educonecta S.A.C. actúa como Responsable del Tratamiento de datos personales. Hemos designado un oficial de protección de datos responsable de supervisar el cumplimiento de la ley.",
    details: [
      "Razón social: Educonecta S.A.C.",
      "RUC: 20XXXXXXXXX",
      "Domicilio: Av. Javier Prado Este 4600, Santiago de Surco, Lima.",
      "Oficial de Protección de Datos: privacidad@educonecta.pe.",
      "Delegado de seguridad: seguridad@educonecta.pe.",
      "Registro en la Autoridad Nacional de Protección de Datos: activo.",
    ],
  },
  {
    id: "V",
    title: "Transferencias Internacionales",
    description:
      "Educonecta NO realiza transferencias internacionales de datos personales. Toda la información se almacena y procesa exclusivamente en servidores ubicados dentro del territorio peruano.",
    details: [
      "Servidores: exclusivamente en data centers certificados en Perú.",
      "No hay transferencia a terceros países bajo ninguna circunstancia.",
      "Proveedores cloud: solo aquellos con centros de operaciones en Perú.",
      "Copias de seguridad: almacenadas en territorio nacional.",
      "Auditorías: verificación periódica de la localización de datos.",
      "Compromiso contractual: todos los proveedores firman acuerdos de confidencialidad.",
    ],
  },
  {
    id: "VI",
    title: "Medidas de Seguridad",
    description:
      "La ley exige medidas de seguridad técnicas y administrativas para proteger los datos. Educonecta implementa un marco de seguridad robusto y certificado.",
    details: [
      "Cifrado AES-256 para datos en reposo en todas las bases de datos.",
      "Cifrado TLS 1.3 para toda comunicación en tránsito.",
      "Autenticación multi-factor (MFA) para acceso administrativo.",
      "Acceso basado en roles con principio de mínimo privilegio.",
      "Registro completo de auditoría de accesos y modificaciones.",
      "Pruebas de penetración trimestrales por firmas externas independientes.",
    ],
  },
  {
    id: "VII",
    title: "Registro de Operaciones",
    description:
      "Educonecta mantiene un registro detallado de todas las operaciones de tratamiento de datos, cumpliendo con el deber de documentación exigido por la ley.",
    details: [
      "Registro de actividades de tratamiento por cada categoría de datos.",
      "Historial completo de accesos por usuario y período.",
      "Logs de modificaciones, eliminaciones y exportaciones.",
      "Registro de consentimientos otorgados y revocados.",
      "Documentación de incidentes de seguridad (si los hubiera).",
      "Retención de registros: mínimo 5 años para fines de auditoría.",
    ],
  },
  {
    id: "VIII",
    title: "Notificación de Incidentes",
    description:
      "En caso de incidentes de seguridad que afecten datos personales, Educonecta cumple con los protocolos de notificación establecidos en la ley y su reglamento.",
    details: [
      "Notificación a la Autoridad Nacional: dentro de las 72 horas del incidente.",
      "Notificación a los titulares: cuando el incidente pueda afectar sus derechos.",
      "Descripción del incidente: naturaleza, datos afectados y medidas adoptadas.",
      "Medidas correctivas: acciones inmediatas para contener y remediar el incidente.",
      "Registro documentado: historia completa del incidente y su resolución.",
      "Mejora continua: ajustes al plan de seguridad tras cada incidente.",
    ],
  },
];

export default function PDPLPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <PageHeader
        label="PDPL"
        title="Protección de Datos Personales"
        description="Educonecta cumple plenamente con la Ley N° 29733 de Protección de Datos Personales y su Reglamento, adoptando las más altas medidas para resguardar la información de la comunidad educativa."
      />

      {/* Resumen */}
      <PageSection>
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {[
            {
              number: "2.4M+",
              title: "Titulares protegidos",
              description: "Estudiantes, docentes y padres de familia cuyos datos están bajo nuestra custodia.",
            },
            {
              number: "100%",
              title: "Cumplimiento legal",
              description: "Implementación total de la Ley N° 29733 y su Reglamento aprobado por D.S. N° 003-2011-JUS.",
            },
            {
              number: "72h",
              title: "Protocolo de respuesta",
              description: "Tiempo máximo para notificar a la Autoridad Nacional en caso de incidentes de seguridad.",
            },
          ].map((stat) => (
            <div key={stat.title} className="p-8 border border-foreground/10">
              <div className="font-display text-4xl mb-2">{stat.number}</div>
              <h3 className="font-display text-xl mb-2">{stat.title}</h3>
              <p className="text-sm text-muted-foreground">{stat.description}</p>
            </div>
          ))}
        </div>
      </PageSection>

      {/* Contenido */}
      <div className="border-t border-foreground/10">
        <PageSection>
          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
              <span className="w-8 h-px bg-foreground/30" />
              Contenido de la normativa
            </span>
            <h2 className="font-display text-4xl lg:text-6xl tracking-tight mb-16">
              Artículos relevantes
            </h2>

            <div className="space-y-0">
              {articles.map((article) => (
                <section
                  key={article.id}
                  id={article.id}
                  className="py-10 border-b border-foreground/10"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <span className="font-mono text-sm text-muted-foreground mt-1 shrink-0">
                      Art. {article.id}
                    </span>
                    <div>
                      <h3 className="font-display text-2xl lg:text-3xl mb-4">
                        {article.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed mb-6">
                        {article.description}
                      </p>
                      <ul className="space-y-3">
                        {article.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 mt-2 shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </div>
        </PageSection>
      </div>

      {/* Derechos ARCO */}
      <div className="bg-foreground text-background">
        <PageSection>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-background/50 mb-6">
            <span className="w-8 h-px bg-background/30" />
            Tus derechos
          </span>
          <h2 className="font-display text-4xl lg:text-6xl tracking-tight mb-12">
            Ejercita tus derechos ARCO
          </h2>

          <div className="grid md:grid-cols-4 gap-px bg-background/10 mb-12">
            {[
              { letter: "A", title: "Acceso", description: "Conoce qué datos tenemos sobre ti y cómo los usamos." },
              { letter: "R", title: "Rectificación", description: "Corrige datos inexactos o incompletos." },
              { letter: "C", title: "Cancelación", description: "Solicita la eliminación de datos innecesarios." },
              { letter: "O", title: "Oposición", description: "Opponte al tratamiento de tus datos para fines específicos." },
            ].map((d) => (
              <div key={d.letter} className="bg-foreground p-8 text-center">
                <span className="font-display text-6xl text-background/20 block mb-4">{d.letter}</span>
                <h3 className="font-display text-xl mb-2">{d.title}</h3>
                <p className="text-sm text-background/60">{d.description}</p>
              </div>
            ))}
          </div>

          <div className="p-8 border border-background/20 text-center">
            <h3 className="font-display text-2xl mb-4">¿Quieres ejercer tus derechos?</h3>
            <p className="text-background/60 mb-6 max-w-xl mx-auto">
              Envía un correo a nuestra oficina de protección de datos con tu solicitud. 
              Responderemos en un máximo de 8 días hábiles.
            </p>
            <a
              href="mailto:privacidad@educonecta.pe"
              className="inline-flex px-8 py-4 bg-background text-foreground font-medium hover:bg-background/90 transition-colors"
            >
              privacidad@educonecta.pe
            </a>
          </div>
        </PageSection>
      </div>

      <CTAInline />
      <FooterSection />
    </main>
  );
}
