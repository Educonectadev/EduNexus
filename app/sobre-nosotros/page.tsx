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
  title: "Sobre Nosotros - EduNexus",
  description:
    "Conoce la historia, misión y equipo detrás de EduNexus, la plataforma educativa que está transformando la gestión escolar en todo el Perú.",
};

const timeline = [
  {
    year: "2019",
    title: "El origen",
    description:
      "Un grupo de educadores y tecnólogos peruanos identificó la necesidad urgente de digitalizar la gestión escolar. Nació EduNexus como un proyecto piloto en 12 colegios de Lima.",
  },
  {
    year: "2020",
    title: "Crecimiento durante la crisis",
    description:
      "La pandemia aceleró la demanda. En 6 meses, más de 500 colegios se unieron a la plataforma. Desarrollamos módulos de educación virtual y comunicación en tiempo real.",
  },
  {
    year: "2021",
    title: "Expansión nacional",
    description:
      "Llegamos a las 25 regiones del Perú. Firmamos convenios con UGELES y comenzamos la integración directa con los sistemas del MINEDU.",
  },
  {
    year: "2022",
    title: "Madurez de plataforma",
    description:
      "Lanzamos la API para desarrolladores, integraciones con SUNAT y sistemas bancarios. Más de 10,000 colegios ya confiaban en nosotros.",
  },
  {
    year: "2023",
    title: "Liderazgo nacional",
    description:
      "EduNexus se consolidó como la plataforma educativa #1 del Perú con 15,000+ colegios. Recibimos certificación ISO 27001 y comenzamos operaciones en Latinoamérica.",
  },
  {
    year: "2024",
    title: "El futuro es hoy",
    description:
      "2,400,000 de estudiantes gestionados, 18,000+ colegios activos. Implementamos inteligencia artificial para predicción de rendimiento académico.",
  },
];

const values = [
  {
    title: "Educación sin barreras",
    description:
      "Creemos que cada estudiante del Perú, sin importar su ubicación económica o geográfica, merece acceso a una educación de calidad respaldada por tecnología de clase mundial.",
  },
  {
    title: "Datos seguros, familias tranquilas",
    description:
      "La protección de los datos de menores de edad es nuestra prioridad absoluta. Cada byte de información está custodiado con los más altos estándares de seguridad internacional.",
  },
  {
    title: "Hecho en Perú, para el Perú",
    description:
      "Entendemos la realidad educativa peruana porque somos peruanos. Nuestra plataforma está diseñada para funcionar desde Lima hasta la selva más remota.",
  },
  {
    title: "Transparencia total",
    description:
      "Cada acción, cada dato, cada reporte es auditable. Los padres, docentes y directivos siempre tienen visibilidad completa sobre lo que ocurre en su institución.",
  },
  {
    title: "Innovación constante",
    description:
      "No nos conformamos con lo actual. Invertimos el 30% de nuestros ingresos en investigación y desarrollo para que tu colegio siempre tenga lo más avanzado.",
  },
  {
    title: "Comunidad educativa",
    description:
      "Más que un software, somos un ecosistema. Conectamos directivos, docentes, padres y estudiantes en una red de conocimiento y colaboración sin precedentes.",
  },
];

const team = [
  { name: "Lic. Ana García Torres", role: "CEO & Fundadora", detail: "Ex-directora de UGEL Lima" },
  { name: "Ing. Carlos Mendoza", role: "CTO", detail: "Ex-Google Perú, 15 años en EdTech" },
  { name: "Dra. María López", role: "Directora Pedagógica", detail: "PhD Educación, PUCP" },
  { name: "Ing. Roberto Sánchez", role: "Director de Seguridad", detail: "Ex-MINEDU, CISO certificado" },
  { name: "Psic. Lucía Fernández", role: "Directora de Producto", detail: "Especialista en UX educativo" },
  { name: "Ing. Diego RAMÍREZ", role: "Director de Operaciones", detail: "Infraestructura cloud Peru" },
];

export default function SobreNosotrosPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <PageHeader
        label="Sobre nosotros"
        title="Transformando la educación peruana"
        description="Somos un equipo de educadores y tecnólogos que cree que la tecnología puede cerrar las brechas educativas más grandes de América Latina."
        side={
          <div className="space-y-4">
            <SideCard label="Cifras clave">
              <div className="space-y-4">
                {[
                  { v: "2.4M+", l: "estudiantes" },
                  { v: "18,000+", l: "colegios" },
                  { v: "25", l: "regiones" },
                  { v: "5", l: "años operando" },
                ].map((s) => (
                  <div key={s.l} className="flex items-baseline justify-between border-b border-foreground/5 pb-3 last:border-0 last:pb-0">
                    <span className="text-sm">{s.l}</span>
                    <span className="font-display text-2xl text-foreground">{s.v}</span>
                  </div>
                ))}
              </div>
            </SideCard>
            <SideCard label="Sede">
              <p className="text-sm leading-relaxed">
                Av. Javier Prado Este 4600<br />
                Santiago de Surco, Lima
              </p>
            </SideCard>
          </div>
        }
      />

      {/* Misión y Visión */}
      <PageSection>
        <div className="grid lg:grid-cols-2 gap-12">
          <InfoCard title="Nuestra Misión">
            <p>
              Democratizar la gestión educativa en el Perú mediante tecnología accesible, 
              segura y poderosa. Queremos que cada colegio del país, desde una escuela rural 
              en Ayacucho hasta un instituto moderno en San Isidro, tenga las herramientas 
              que necesita para brindar la mejor educación posible.
            </p>
          </InfoCard>
          <InfoCard title="Nuestra Visión">
            <p>
              Ser la plataforma educativa de referencia en Latinoamérica para 2030. 
              Aspiramos a un continente donde ningún colegio pierda tiempo en trámites 
              burocráticos cuando podría estar enfocado en lo que realmente importa: 
              enseñar y formar a las futuras generaciones.
            </p>
          </InfoCard>
        </div>
      </PageSection>

      {/* Valores */}
      <div className="bg-foreground/[0.02]">
        <PageSection>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            Valores
          </span>
          <h2 className="font-display text-4xl lg:text-6xl tracking-tight mb-16">
            Lo que nos mueve
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-foreground/10">
            {values.map((value) => (
              <div key={value.title} className="bg-background p-8 lg:p-10 group">
                <h3 className="font-display text-2xl mb-4 group-hover:translate-x-2 transition-transform duration-300">
                  {value.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </PageSection>
      </div>

      {/* Timeline */}
      <PageSection>
        <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
          <span className="w-8 h-px bg-foreground/30" />
          Nuestra historia
        </span>
        <h2 className="font-display text-4xl lg:text-6xl tracking-tight mb-16">
          De un piloto a todo el Perú
        </h2>

        <div className="space-y-0">
          {timeline.map((item, index) => (
            <div
              key={item.year}
              className="flex gap-8 py-10 border-b border-foreground/10 group"
            >
              <div className="shrink-0 w-20">
                <span className="font-mono text-2xl text-muted-foreground group-hover:text-foreground transition-colors">
                  {item.year}
                </span>
              </div>
              <div>
                <h3 className="font-display text-2xl mb-3 group-hover:translate-x-2 transition-transform duration-300">
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed max-w-2xl">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </PageSection>

      {/* Equipo */}
      <div className="bg-foreground text-background">
        <PageSection>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-background/50 mb-6">
            <span className="w-8 h-px bg-background/30" />
            Equipo
          </span>
          <h2 className="font-display text-4xl lg:text-6xl tracking-tight mb-16">
            Las personas detrás de EduNexus
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-background/10">
            {team.map((member) => (
              <div key={member.name} className="bg-foreground p-8 group">
                <div className="w-16 h-16 rounded-full bg-background/10 border border-background/20 flex items-center justify-center mb-6">
                  <span className="font-display text-2xl text-background/60">
                    {member.name.charAt(0)}
                  </span>
                </div>
                <h3 className="font-display text-xl mb-1">{member.name}</h3>
                <p className="font-mono text-sm text-background/60 mb-2">{member.role}</p>
                <p className="text-sm text-background/40">{member.detail}</p>
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
