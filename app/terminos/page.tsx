import type { Metadata } from "next";
import {
  PageHeader,
  PageSection,
  CTAInline,
} from "@/components/page-layout";
import { FooterSection } from "@/components/landing/footer-section";

export const metadata: Metadata = {
  title: "Términos y Condiciones - EduNexus",
  description:
    "Términos y condiciones de uso de la plataforma EduNexus para instituciones educativas, docentes, padres y estudiantes.",
};

const sections = [
  {
    id: "1",
    title: "Aceptación de los términos",
    content: `Al acceder y utilizar la plataforma EduNexus, las instituciones educativas, sus representantes, docentes, personal administrativo, padres de familia y estudiantes aceptan íntegramente los presentes Términos y Condiciones.

Si no estás de acuerdo con alguno de estos términos, no debes utilizar la plataforma. El uso continuado de EduNexus constituye la aceptación de estos términos y de nuestra Política de Privacidad.

EduNexus S.A.C. se reserva el derecho de modificar estos términos en cualquier momento, notificando a los usuarios con al menos 30 días de anticipación.`,
  },
  {
    id: "2",
    title: "Definiciones",
    content: `Para efectos de estos Términos:

**Plataforma:** El sistema integral de gestión escolar EduNexus, incluyendo todas sus funcionalidades, módulos, API y servicios asociados.

**Institución:** La institución educativa (colegio público o privado) que contrata los servicios de EduNexus.

**Administrador:** El representante de la institución con acceso de administrador a la plataforma.

**Usuario:** Cualquier persona que acceda a la plataforma, incluyendo administradores, docentes, personal administrativo, padres de familia y estudiantes.

**Contenido:** Toda información, datos, documentos, calificaciones, reportes y material cargado o generado en la plataforma.

**Servicio:** El conjunto de funcionalidades y servicios ofrecidos a través de la plataforma.`,
  },
  {
    id: "3",
    title: "Registro y cuentas",
    content: `Para utilizar EduNexus, la institución debe completar un proceso de registro que incluye:

- Datos de la institución (nombre, RUC, código UGEL, dirección).
- Datos del representante legal o director.
- Verificación de identidad y autoridad.

Cada institución designa un Administrador Principal quien será responsable de:

- Gestionar las cuentas de docentes y personal.
- Asignar permisos y roles a los usuarios.
- Garantizar el uso adecuado de la plataforma.
- Mantener actualizados los datos de la institución.

La institución es responsable de todas las actividades realizadas bajo sus cuentas de usuario.`,
  },
  {
    id: "4",
    title: "Uso de la plataforma",
    content: `EduNexus se proporciona para fines educativos y de gestión institucional. Está prohibido:

- Utilizar la plataforma para fines distintos a la gestión educativa.
- Intentar acceder a información de otras instituciones.
- Realizar ingeniería inversa, descompilar o modificar el software.
- Utilizar la plataforma para actividades ilegales o fraudulentas.
- Compartir credenciales de acceso con terceros no autorizados.
- Realizar acciones que puedan dañar, sobrecargar o comprometer la plataforma.
- Utilizar bots, scrapers o cualquier herramienta automatizada no autorizada.

El incumplimiento de estas condiciones puede resultar en la suspensión o terminación de la cuenta sin previo aviso.`,
  },
  {
    id: "5",
    title: "Propiedad intelectual",
    content: `Todo el contenido, diseño, código fuente, algoritmos, bases de datos, interfaz de usuario y documentación de EduNexus son propiedad exclusiva de EduNexus S.A.C. y están protegidos por las leyes de propiedad intelectual del Perú e internacionales.

La plataforma concede una licencia limitada, no exclusiva, intransferible y revocable para utilizar el servicio según estos términos.

Los contenidos cargados por las instituciones (calificaciones, documentos, etc.) permanecen propiedad de la institución. EduNexus no reclama propiedad sobre dichos contenidos.`,
  },
  {
    id: "6",
    title: "Disponibilidad del servicio",
    content: `EduNexus se compromete a mantener un nivel de disponibilidad del 99.9% mensual, excluyendo:

- Mantenimiento programado notificado con 48 horas de anticipación.
- Fuerza mayor o circunstancias fuera de nuestro control.
- Problemas de conectividad del usuario.
- Actualizaciones de seguridad urgentes.

En caso de incumplimiento del SLA, la institución podrá solicitar un crédito de servicio equivalente al 10% del pago mensual por cada hora de inactividad que exceda el 0.1% mensual, hasta un máximo del 30% del pago mensual.`,
  },
  {
    id: "7",
    title: "Pagos y facturación",
    content: `Los precios de EduNexus están expresados en Soles (PEN) y pueden ser consultados en la sección de Precios de nuestra plataforma.

- Los pagos se realizan mensual o anualmente según el plan contratado.
- La facturación electrónica se emite automáticamente vía SUNAT.
- Los pagos vencidos generan intereses del 1.5% mensual.
- La institución puede cancelar el servicio con 30 días de anticipación.
- No se realizan reembolsos por meses parciales ya facturados.

EduNexus se reserva el derecho de modificar los precios con 60 días de anticipación, aplicándose a renovaciones futuras.`,
  },
  {
    id: "8",
    title: "Limitación de responsabilidad",
    content: `EduNexus no será responsable por:

- Pérdida de datos causada por problemas de conectividad del usuario.
- Decisiones académicas o administrativas tomadas basándose en la plataforma.
- Daños indirectos, consecuentes o punitivos derivados del uso del servicio.
- Interrupciones del servicio por mantenimiento o causas de fuerza mayor.
- El uso indebido de la plataforma por parte de los usuarios.

La responsabilidad total de EduNexus en ningún caso excederá el monto pagado por la institución en los 12 meses anteriores al reclamo.`,
  },
  {
    id: "9",
    title: "Terminación del servicio",
    content: `Cualquiera de las partes puede terminar el contrato con 30 días de anticipación por escrito.

EduNexus puede suspender o terminar el servicio inmediatamente en caso de:

- Incumplimiento grave de estos términos.
- Uso fraudulento o ilegal de la plataforma.
- Falta de pago por más de 60 días.

Al terminar el servicio:

- La institución puede descargar todos sus datos en formatos estándar (CSV, PDF) durante 90 días.
- Después de 90 días, los datos serán eliminados de forma segura.
- Las obligaciones de confidencialidad y protección de datos sobreviven a la terminación.`,
  },
  {
    id: "10",
    title: "Legislación aplicable",
    content: `Estos Términos y Condiciones se rigen por las leyes de la República del Perú. Cualquier disputa será resuelta por los tribunales competentes de la ciudad de Lima, Perú.

Antes de iniciar cualquier proceso legal, las partes se comprometen a intentar resolver las diferencias de manera amistosa a través de negociación directa y, de ser necesario, mediación.

Si alguna disposición de estos términos fuera declarada inválida, las disposiciones restantes mantendrán su plena vigencia y efecto.`,
  },
];

export default function TerminosPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <PageHeader
        label="Términos"
        title="Términos y Condiciones"
        description="Lee detenidamente los términos que rigen el uso de la plataforma EduNexus."
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
                  <div className="text-muted-foreground leading-relaxed max-w-3xl">
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
