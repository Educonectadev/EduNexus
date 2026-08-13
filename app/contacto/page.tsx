import type { Metadata } from "next";
import {
  PageHeader,
  PageSection,
  SideCard,
  CTAInline,
} from "@/components/page-layout";
import { FooterSection } from "@/components/landing/footer-section";

export const metadata: Metadata = {
  title: "Contacto - EduNexus",
  description:
    "Contáctanos para solicitar una demostración, resolver dudas o conocer más sobre nuestra plataforma educativa.",
};

const offices = [
  {
    city: "Lima (Sede Central)",
    address: "Av. Javier Prado Este 4600, Santiago de Surco, Lima",
    phone: "+51 (01) 555-0199",
    email: "contacto@edunexus.pe",
    hours: "Lunes a viernes: 8:00 a.m. - 6:00 p.m.",
  },
  {
    city: "Arequipa",
    address: "Calle Mercado 201, Cercado, Arequipa",
    phone: "+51 (054) 555-0199",
    email: "arequipa@edunexus.pe",
    hours: "Lunes a viernes: 8:00 a.m. - 5:00 p.m.",
  },
  {
    city: "Trujillo",
    address: "Av. España 680, Trujillo, La Libertad",
    phone: "+51 (044) 555-0199",
    email: "trujillo@edunexus.pe",
    hours: "Lunes a viernes: 8:00 a.m. - 5:00 p.m.",
  },
];

const contactReasons = [
  "Solicitar una demostración",
  "Consultar precios y planes",
  "Soporte técnico",
  "Prensa y medios",
  "Alianzas estratégicas",
  "Otro",
];

const faq = [
  {
    q: "¿Cuánto tiempo toma implementar EduNexus en un colegio?",
    a: "Un colegio puede estar operativo en menos de 24 horas. La importación de datos existentes toma entre 1 y 3 días dependiendo del volumen. Ofrecemos capacitación gratuita para todo el personal.",
  },
  {
    q: "¿Funciona para colegios públicos y privados?",
    a: "Sí, EduNexus está diseñado para ambos tipos de institución. Los colegios públicos tienen acceso a precios subsidiados y funcionalidades específicas para reportes al MINEDU.",
  },
  {
    q: "¿Necesitamos infraestructura tecnológica propia?",
    a: "No. EduNexus es 100% en la nube. Solo necesitas una computadora con acceso a internet. Todo el almacenamiento y procesamiento está en nuestros servidores dentro del Perú.",
  },
  {
    q: "¿Cómo se protegen los datos de los estudiantes?",
    a: "Cumplimos con la Ley N° 29733 de Protección de Datos Personales. Los datos se almacenan exclusivamente en servidores dentro del territorio peruano con cifrado AES-256.",
  },
  {
    q: "¿Ofrecen soporte en regiones?",
    a: "Sí. Tenemos soporte telefónico, chat y correo para todo el Perú. En ciudades principales contamos con presencia física. También ofrecemos soporte remoto inmediato.",
  },
];

export default function ContactoPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <PageHeader
        label="Contacto"
        title="Hablemos"
        description="Ya sea para una demostración, una consulta técnica o una alianza estratégica, estamos aquí para ayudarte."
        side={
          <div className="space-y-4">
            <SideCard label="Respuesta rápida">
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-mono text-xs text-foreground/40 mb-1">Email</p>
                  <p>contacto@edunexus.pe</p>
                </div>
                <div>
                  <p className="font-mono text-xs text-foreground/40 mb-1">Ventas</p>
                  <p>+51 (01) 555-0199</p>
                </div>
                <div>
                  <p className="font-mono text-xs text-foreground/40 mb-1">Soporte 24/7</p>
                  <p>soporte@edunexus.pe</p>
                </div>
              </div>
            </SideCard>
            <SideCard label="Tiempo de respuesta">
              <p className="text-sm leading-relaxed">
                Te respondemos en menos de <span className="font-display text-2xl text-foreground block mt-2">24h</span>
                en días hábiles.
              </p>
            </SideCard>
          </div>
        }
      />

      {/* Formulario + Oficinas */}
      <PageSection>
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Formulario */}
          <div>
            <h2 className="font-display text-3xl mb-8">Envíanos un mensaje</h2>
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-mono text-muted-foreground mb-2">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    className="w-full px-4 py-3 bg-foreground/[0.02] border border-foreground/10 focus:border-foreground/30 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-mono text-muted-foreground mb-2">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="correo@colegio.edu.pe"
                    className="w-full px-4 py-3 bg-foreground/[0.02] border border-foreground/10 focus:border-foreground/30 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-mono text-muted-foreground mb-2">
                    Institución
                  </label>
                  <input
                    type="text"
                    placeholder="IEP San Martín de Porres"
                    className="w-full px-4 py-3 bg-foreground/[0.02] border border-foreground/10 focus:border-foreground/30 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-mono text-muted-foreground mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    placeholder="+51 999 888 777"
                    className="w-full px-4 py-3 bg-foreground/[0.02] border border-foreground/10 focus:border-foreground/30 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-mono text-muted-foreground mb-2">
                  ¿En qué podemos ayudarte?
                </label>
                <select className="w-full px-4 py-3 bg-foreground/[0.02] border border-foreground/10 focus:border-foreground/30 focus:outline-none transition-colors text-foreground">
                  <option value="">Selecciona una opción</option>
                  {contactReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-mono text-muted-foreground mb-2">
                  Mensaje
                </label>
                <textarea
                  rows={5}
                  placeholder="Cuéntanos sobre tu institución y lo que necesitas..."
                  className="w-full px-4 py-3 bg-foreground/[0.02] border border-foreground/10 focus:border-foreground/30 focus:outline-none transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors"
              >
                Enviar mensaje
              </button>
            </form>
          </div>

          {/* Información de contacto */}
          <div className="space-y-12">
            <div>
              <h2 className="font-display text-3xl mb-8">Nuestras oficinas</h2>
              <div className="space-y-8">
                {offices.map((office) => (
                  <div
                    key={office.city}
                    className="p-6 border border-foreground/10 hover:border-foreground/20 transition-all group"
                  >
                    <h3 className="font-display text-xl mb-4 group-hover:translate-x-2 transition-transform duration-300">
                      {office.city}
                    </h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>{office.address}</p>
                      <p className="font-mono">{office.phone}</p>
                      <p className="font-mono">{office.email}</p>
                      <p>{office.hours}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-display text-xl mb-4">Soporte técnico 24/7</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Si eres un colegio ya registrado y necesitas soporte inmediato:
              </p>
              <div className="space-y-2">
                <p className="font-mono text-sm">soporte@edunexus.pe</p>
                <p className="font-mono text-sm">+51 (01) 555-0100</p>
                <p className="text-sm text-muted-foreground">Línea gratuita para colegios públicos</p>
              </div>
            </div>
          </div>
        </div>
      </PageSection>

      {/* FAQ */}
      <div className="bg-foreground/[0.02]">
        <PageSection>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            Preguntas frecuentes
          </span>
          <h2 className="font-display text-4xl lg:text-6xl tracking-tight mb-12">
            Respuestas rápidas
          </h2>

          <div className="space-y-0">
            {faq.map((item) => (
              <div
                key={item.q}
                className="py-8 border-b border-foreground/10"
              >
                <h3 className="font-display text-xl mb-3">{item.q}</h3>
                <p className="text-muted-foreground leading-relaxed max-w-3xl">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </PageSection>
      </div>

      <CTAInline />
      <FooterSection />
    </main>
  );
}
