"use client";

import { useEffect, useState } from "react";

const testimonials = [
  {
    quote: "Educonecta transformó completamente la gestión de nuestro colegio. Lo que antes tomaba horas de trabajo manual ahora se resuelve en minutos. Los padres están encantados con el portal de seguimiento.",
    author: "María Elena Condori",
    role: "Directora",
    company: "IEP San Martín de Porres, Lima",
    metric: "Reducción del 80% en carga administrativa",
  },
  {
    quote: "Como UGEL, necesitábamos una solución que pudiera centralizar la información de todos los colegios de nuestra jurisdicción. Educonecta nos dio visibilidad en tiempo real del rendimiento académico regional.",
    author: "Carlos Mendoza Quispe",
    role: "Jefe de UGEL",
    company: "UGEL Trujillo, La Libertad",
    metric: "1,200 colegios conectados en 6 meses",
  },
  {
    quote: "La integración con SUNAT para facturación electrónica y la gestión de pensiones nos ahorró contratar a dos personas administrativas. El sistema se paga solo con lo que ahorramos.",
    author: "Rosa Huamán Delgado",
    role: "Administradora",
    company: "I.E.P. Rosa de América, Arequipa",
    metric: "Ahorro de S/. 48,000 anuales",
  },
  {
    quote: "Lo que más valoro es la seguridad. Saber que los datos de mis hijos están protegidos y que puedo revisar sus notas y asistencia desde mi celular me da mucha tranquilidad como padre de familia.",
    author: "Fernando Torres Ríos",
    role: "Padre de familia",
    company: "Colegio San Ignacio, Cusco",
    metric: "98% satisfacción de padres",
  },
];

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % testimonials.length);
        setIsAnimating(false);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeTestimonial = testimonials[activeIndex];

  return (
    <section className="relative py-32 lg:py-40 border-t border-foreground/10 lg:pb-14">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center gap-4 mb-16">
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Testimonios
          </span>
          <div className="flex-1 h-px bg-foreground/10" />
          <span className="font-mono text-xs text-muted-foreground">
            {String(activeIndex + 1).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}
          </span>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
          <div className="lg:col-span-8">
            <blockquote
              className={`transition-all duration-300 ${
                isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
              }`}
            >
              <p className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-foreground">
                &ldquo;{activeTestimonial.quote}&rdquo;
              </p>
            </blockquote>

            <div
              className={`mt-12 flex items-center gap-6 transition-all duration-300 delay-100 ${
                isAnimating ? "opacity-0" : "opacity-100"
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center">
                <span className="font-display text-2xl text-foreground">
                  {activeTestimonial.author.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">{activeTestimonial.author}</p>
                <p className="text-muted-foreground">
                  {activeTestimonial.role}, {activeTestimonial.company}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-center">
            <div
              className={`p-8 border border-foreground/10 transition-all duration-300 ${
                isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
              }`}
            >
              <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase block mb-4">
                Resultado Clave
              </span>
              <p className="font-display text-3xl md:text-4xl text-foreground">
                {activeTestimonial.metric}
              </p>
            </div>

            <div className="flex gap-2 mt-8">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setIsAnimating(true);
                    setTimeout(() => {
                      setActiveIndex(idx);
                      setIsAnimating(false);
                    }, 300);
                  }}
                  className={`h-2 transition-all duration-300 ${
                    idx === activeIndex
                      ? "w-8 bg-foreground"
                      : "w-2 bg-foreground/20 hover:bg-foreground/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-24 pt-12 border-t border-foreground/10">
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase mb-8 text-center">
            Instituciones que confían en Educonecta
          </p>
        </div>
      </div>
      
      <div className="w-full">
        <div className="flex gap-16 items-center marquee">
          {[...Array(2)].map((_, setIdx) => (
            <div key={setIdx} className="flex gap-16 items-center shrink-0">
              {["San Martín de Porres", "Rosa de América", "San Ignacio", "Inca Garcilaso", "Santa María", "Los Andes", "San Pablo", "La Salle"].map(
                (company) => (
                  <span
                    key={`${setIdx}-${company}`}
                    className="font-display text-xl md:text-2xl text-foreground/30 whitespace-nowrap hover:text-foreground transition-colors duration-300"
                  >
                    {company}
                  </span>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
