import type { Metadata } from "next";
import {
  PageHeader,
  PageSection,
  CTAInline,
} from "@/components/page-layout";
import { FooterSection } from "@/components/landing/footer-section";

export const metadata: Metadata = {
  title: "Blog Educativo - Educonecta",
  description:
    "Noticias, guías y recursos sobre tecnología educativa, gestión escolar y la transformación digital de la educación en el Perú.",
};

const posts = [
  {
    date: "12 jul 2025",
    category: "Tendencias",
    title: "La inteligencia artificial en el aula: oportunidades y desafíos para el Perú",
    excerpt:
      "Cómo las escuelas peruanas están comenzando a utilizar IA para personalizar el aprendizaje, y qué necesitamos para que sea una herramienta equitativa.",
    readTime: "8 min de lectura",
  },
  {
    date: "5 jul 2025",
    category: "Guía práctica",
    title: "Cómo implementar un sistema de notas digitales en tu colegio en 3 pasos",
    excerpt:
      "Guía paso a paso para migrar del registro manual al sistema digital, incluyendo capacitación docente y comunicación con padres.",
    readTime: "6 min de lectura",
  },
  {
    date: "28 jun 2025",
    category: "Caso de éxito",
    title: "IEP San Martín de Porres: de 0 a 100% digital en 3 meses",
    excerpt:
      "Cómo una institución educativa de Lima Norte logró transformar completamente su gestión administrativa y académica con Educonecta.",
    readTime: "5 min de lectura",
  },
  {
    date: "21 jun 2025",
    category: "Legislación",
    title: "Nuevo reglamento MINEDU 2025: lo que todo director debe saber",
    excerpt:
      "Análisis de las principales cambios en el reglamento de gestión institucional y cómo Educonecta se adapta automáticamente a los nuevos requisitos.",
    readTime: "10 min de lectura",
  },
  {
    date: "14 jun 2025",
    category: "Tecnología",
    title: "Seguridad de datos de menores: guía completa para colegios",
    excerpt:
      "Todo lo que necesitas saber sobre la Ley de Protección de Datos Personales y cómo asegurar la información de tus estudiantes.",
    readTime: "7 min de lectura",
  },
  {
    date: "7 jun 2025",
    category: "Comunidad",
    title: "Encuentro Nacional de Directores Educativos 2025: resumen",
    excerpt:
      "Los 5 temas más debatidos en el encuentro anual de directores, y cómo la tecnología fue el eje central de las conversaciones.",
    readTime: "4 min de lectura",
  },
  {
    date: "31 may 2025",
    category: "Finanzas",
    title: "Cómo los colegios privados están optimizando su recaudación de pensiones",
    excerpt:
      "Estrategias comprobadas para reducir la morosidad y mejorar el flujo de caja en instituciones educativas privadas.",
    readTime: "6 min lectura",
  },
  {
    date: "24 may 2025",
    category: "Pedagogía",
    title: "Evaluación formativa en la era digital: más allá de las notas",
    excerpt:
      "Cómo las herramientas digitales están transformando la manera en que evaluamos el aprendizaje de los estudiantes.",
    readTime: "9 min de lectura",
  },
];

const categories = [
  "Todos",
  "Tendencias",
  "Guía práctica",
  "Caso de éxito",
  "Legislación",
  "Tecnología",
  "Comunidad",
  "Finanzas",
  "Pedagogía",
];

export default function BlogPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <PageHeader
        label="Blog educativo"
        title="Ideas que transforman la educación"
        description="Artículos, guías y recursos para directivos, docentes ypadres de familia interesados en la innovación educativa."
      />

      {/* Categorías */}
      <PageSection className="!py-0 !pb-8">
        <div className="flex flex-wrap gap-3">
          {categories.map((cat, i) => (
            <span
              key={cat}
              className={`px-4 py-2 text-sm font-mono border transition-colors cursor-pointer ${
                i === 0
                  ? "border-foreground bg-foreground text-background"
                  : "border-foreground/10 text-muted-foreground hover:border-foreground/30"
              }`}
            >
              {cat}
            </span>
          ))}
        </div>
      </PageSection>

      {/* Featured Post */}
      <PageSection className="!pt-0">
        <div className="grid lg:grid-cols-2 gap-12 items-center p-8 lg:p-12 border border-foreground/10 hover:border-foreground/20 transition-all group">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 text-xs font-mono border border-foreground/20">
                {posts[0].category}
              </span>
              <span className="text-sm text-muted-foreground">{posts[0].date}</span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl mb-4 group-hover:translate-x-2 transition-transform duration-300">
              {posts[0].title}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              {posts[0].excerpt}
            </p>
            <span className="font-mono text-sm text-muted-foreground">
              {posts[0].readTime}
            </span>
          </div>
          <div className="bg-foreground/[0.03] border border-foreground/10 h-64 lg:h-80 flex items-center justify-center">
            <span className="font-display text-6xl text-foreground/10">AI</span>
          </div>
        </div>
      </PageSection>

      {/* Posts Grid */}
      <div className="border-t border-foreground/10">
        <PageSection>
          <h2 className="font-display text-3xl lg:text-4xl mb-12">Últimos artículos</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-foreground/10">
            {posts.slice(1).map((post) => (
              <article
                key={post.title}
                className="bg-background p-8 group cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 text-xs font-mono border border-foreground/20">
                    {post.category}
                  </span>
                  <span className="text-sm text-muted-foreground">{post.date}</span>
                </div>
                <h3 className="font-display text-xl mb-3 group-hover:translate-x-2 transition-transform duration-300">
                  {post.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4 text-sm">
                  {post.excerpt}
                </p>
                <span className="font-mono text-xs text-muted-foreground">
                  {post.readTime}
                </span>
              </article>
            ))}
          </div>
        </PageSection>
      </div>

      {/* Newsletter */}
      <div className="bg-foreground text-background">
        <PageSection>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-4xl lg:text-5xl tracking-tight mb-6">
              No te pierdas nada
            </h2>
            <p className="text-lg text-background/60 mb-8">
              Recibe semanalmente los mejores artículos sobre tecnología educativa 
              directamente en tu correo.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="tu@colegio.edu.pe"
                className="flex-1 px-6 py-4 bg-background/10 border border-background/20 text-background placeholder:text-background/40 focus:outline-none focus:border-background/40"
              />
              <button className="px-8 py-4 bg-background text-foreground font-medium hover:bg-background/90 transition-colors">
                Suscribirme
              </button>
            </div>
            <p className="text-sm text-background/40 mt-4 font-mono">
              Sin spam. Puedes cancelar cuando quieras.
            </p>
          </div>
        </PageSection>
      </div>

      <CTAInline />
      <FooterSection />
    </main>
  );
}
