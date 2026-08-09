import type { Metadata } from "next";
import {
  PageHeader,
  PageSection,
  CTAInline,
} from "@/components/page-layout";
import { FooterSection } from "@/components/landing/footer-section";

export const metadata: Metadata = {
  title: "Política de Privacidad - EduNexus",
  description:
    "Conoce cómo EduNexus recopila, usa y protege la información de los usuarios de su plataforma educativa.",
};

const sections = [
  {
    id: "1",
    title: "Información que recopilamos",
    content: `EduNexus recopila únicamente la información estrictamente necesaria para el funcionamiento de la plataforma:

**Información de instituciones:** Nombre del colegio, código UGEL, dirección, datos de representante legal, RUC y datos de contacto.

**Información de docentes y personal:** Nombres, DNI, correo electrónico institucional, cargo y áreas de responsabilidad.

**Information de estudiantes:** Nombres, fecha de nacimiento, DNI (cuando aplica), grado y sección, datos de padres o apoderados, y registros académicos (notas, asistencia, comportamiento).

**Información de padres/apoderados:** Nombres, DNI, correo electrónico, teléfono de contacto y relación con el estudiante.

**Datos de uso:** Información técnica sobre el uso de la plataforma (dispositivo, navegador, dirección IP) exclusivamente para fines de seguridad y mejora del servicio.`,
  },
  {
    id: "2",
    title: "Finalidad del tratamiento",
    content: `Los datos personales son tratados exclusivamente para:

- Gestión académica y administrativa de la institución educativa.
- Generación de reportes para el MINEDU y organismos competentes.
- Comunicación entre la institución, docentes, padres y estudiantes.
- Facturación y gestión de pensiones.
- Cumplimiento de obligaciones legales y tributarias.
- Mejora continua del servicio y experiencia del usuario.
- Seguridad de la plataforma y prevención de fraudes.

En ningún caso los datos serán utilizados para fines publicitarios o comerciales sin consentimiento expreso.`,
  },
  {
    id: "3",
    title: "Base legal del tratamiento",
    content: `El tratamiento de datos personales en EduNexus se fundamenta en:

- **Consentimiento expreso:** Los usuarios aceptan expresamente el tratamiento de sus datos al registrarse en la plataforma.
- **Obligación legal:** Cumplimiento de normativas del MINEDU, SUNAT y otros organismos estatales.
- **Interés legítimo:** Mejora del servicio y seguridad de la plataforma.
- **Ejecución de contrato:** Prestación del servicio contratado por la institución educativa.`,
  },
  {
    id: "4",
    title: "Almacenamiento y seguridad",
    content: `Todos los datos personales son almacenados exclusivamente en servidores ubicados en territorio peruano, operados por proveedores de infraestructura cloud certificados ISO 27001.

Medidas de seguridad implementadas:
- Cifrado AES-256 para datos en reposo.
- Cifrado TLS 1.3 para datos en tránsito.
- Acceso basado en roles (RBAC) con principio de mínimo privilegio.
- Auditoría continua de accesos y modificaciones.
- Copias de seguridad diarias con retención de 90 días.
- Pruebas de penetración trimestrales.
- Plan de respuesta a incidentes de seguridad.

El tiempo de retención de datos es el período activo del servicio más 5 años, cumpliendo con las obligaciones legales de conservación.`,
  },
  {
    id: "5",
    title: "Derechos de los usuarios",
    content: `De conformidad con la Ley N° 29733, los titulares de datos personales tienen derecho a:

- **Acceso:** Conocer qué datos personales son tratados y cómo se utilizan.
- **Rectificación:** Solicitar la corrección de datos inexactos o incompletos.
- **Eliminación:** Solicitar la supresión de datos cuando ya no sean necesarios.
- **Oposición:** Oponerse al tratamiento de datos para fines específicos.
- **Portabilidad:** Recibir los datos en un formato estructurado y de uso común.
- **Revocación del consentimiento:** Retirar el consentimiento en cualquier momento.

Para ejercer estos derechos, los usuarios pueden contactar a nuestro oficial de protección de datos a través de privacidad@edunexus.pe.`,
  },
  {
    id: "6",
    title: "Compartición de datos",
    content: `EduNexus NO vende, alquila ni comparte datos personales con terceros para fines comerciales.

Los datos pueden ser compartidos únicamente con:

- **La institución educativa:** Los directivos tienen acceso a la información de su institución.
- **MINEDU y UGELES:** Cuando la legislación lo requiera y exista solicitud formal.
- **Proveedores de servicios:** Empresas que prestan servicios técnicos necesarios para el funcionamiento (hosting, soporte), bajo estrictos acuerdos de confidencialidad.
- **Autoridades competentes:** Cuando exista orden judicial o requerimiento legal.`,
  },
  {
    id: "7",
    title: "Menores de edad",
    content: `Dado que EduNexus gestiona información de estudiantes menores de edad, adoptamos medidas especiales:

- El tratamiento de datos de menores requiere autorización del padre, madre o apoderado.
- Se aplican estándares reforzados de seguridad para datos de menores.
- Los datos de menores tienen acceso restringido solo a personal autorizado de la institución.
- No se recopilan datos de menores para fines distintos a la gestión educativa.
- Los padres pueden solicitar acceso, rectificación o eliminación de datos de sus hijos en cualquier momento.`,
  },
  {
    id: "8",
    title: "Cookies y tecnologías de rastreo",
    content: `EduNexus utiliza cookies estrictamente necesarias para el funcionamiento de la plataforma:

- **Cookies de sesión:** Para mantener al usuario autenticado.
- **Cookies de preferencias:** Para recordar configuraciones del usuario.
- **Cookies de seguridad:** Para prevenir ataques y fraudes.

No utilizamos cookies de rastreo publicitario ni compartimos información con redes de publicidad. Los usuarios pueden gestionar las cookies desde la configuración de su navegador.`,
  },
  {
    id: "9",
    title: "Cambios en esta política",
    content: `EduNexus se reserva el derecho de modificar esta Política de Privacidad en cualquier momento. Los cambios serán notificados:

- Por correo electrónico a todos los usuarios registrados.
- Mediante aviso visible en la plataforma.
- Con al menos 30 días de anticipación para cambios sustanciales.

El uso continuado de la plataforma después de los cambios constituye la aceptación de la política modificada.`,
  },
  {
    id: "10",
    title: "Contacto",
    content: `Para consultas sobre esta Política de Privacidad o para ejercer tus derechos:

- **Correo electrónico:** privacidad@edunexus.pe
- **Dirección:** Av. Javier Prado Este 4600, Santiago de Surco, Lima, Perú
- **Teléfono:** +51 (01) 555-0199
- **Responsable:** Oficina de Protección de Datos Personales, EduNexus S.A.C.`,
  },
];

export default function PrivacidadPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <PageHeader
        label="Privacidad"
        title="Política de Privacidad"
        description="Tu privacidad y la de los estudiantes es nuestra prioridad. Esta política describe cómo protegemos y tratamos la información."
      />

      <PageSection>
        <div className="flex flex-col lg:flex-row gap-16">
          {/* TOC */}
          <aside className="lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-32">
              <span className="font-mono text-xs text-muted-foreground block mb-4">
                Índice
              </span>
              <nav className="space-y-2">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    {s.id}. {s.title}
                  </a>
                ))}
              </nav>
              <p className="text-xs text-muted-foreground mt-8 font-mono">
                Última actualización: 15 de julio de 2025
              </p>
            </div>
          </aside>

          {/* Contenido */}
          <div className="flex-1">
            <div className="space-y-0">
              {sections.map((s) => (
                <section
                  key={s.id}
                  id={s.id}
                  className="py-10 border-b border-foreground/10"
                >
                  <h2 className="font-display text-2xl lg:text-3xl mb-6">
                    <span className="font-mono text-sm text-muted-foreground mr-3">
                      {s.id}.
                    </span>
                    {s.title}
                  </h2>
                  <div className="text-muted-foreground leading-relaxed whitespace-pre-line max-w-3xl">
                    {s.content.split("\n\n").map((paragraph, i) => (
                      <p key={i} className="mb-4">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </PageSection>

      <CTAInline />
      <FooterSection />
    </main>
  );
}
