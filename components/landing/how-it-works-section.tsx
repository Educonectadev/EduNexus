"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "I",
    title: "Registra tu institución",
    description: "Crea tu cuenta en minutos. Ingresa los datos de tu colegio, número de UGEL y documentación básica. Nuestro equipo verifica y activa tu cuenta en menos de 24 horas.",
    code: `edconecta.registrar({
  colegio: 'IEP San Martín',
  ugel: 'Lima Norte',
  tipo: 'privado',
  nivel: 'primaria-secundaria'
})
// Cuenta activada en <24h`,
  },
  {
    number: "II",
    title: "Configura tu sistema",
    description: "Importa los datos de tus alumnos, docentes y personal administrativo. Configura los períodos lectivos, áreas curriculares y escalas de calificación según tu reglamento.",
    code: `edconecta.importar({
  alumnos: './padron-alumnos.csv',
  docentes: './plantilla-docentes.xlsx',
  personal: './administrativos.csv'
})
// 2,500 registros procesados`,
  },
  {
    number: "III",
    title: "Comienza a operar",
    description: "Tu colegio está listo. Los docentes registran notas, los padres siguen el progreso y la dirección gestiona todo desde un solo panel.",
    code: `edconecta.operando({
  modulos: ['académico', 'financiero'],
  usuarios: 1247,
  uptime: '99.99%'
})
// Sistema en producción`,
  },
];

function CodeBlock({ code, stepIndex }: { code: string; stepIndex: number }) {
  return (
    <div className="border border-background/10 overflow-hidden">
      <div className="px-4 lg:px-6 py-3 border-b border-background/10 flex items-center justify-between">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-background/20" />
          <div className="w-2.5 h-2.5 rounded-full bg-background/20" />
          <div className="w-2.5 h-2.5 rounded-full bg-background/20" />
        </div>
        <span className="text-[10px] lg:text-xs font-mono text-background/40">setup.ts</span>
      </div>

      <div className="p-4 lg:p-8 font-mono text-xs lg:text-sm min-h-[180px] lg:min-h-[280px]">
        <pre className="text-background/70">
          {code.split("\n").map((line, lineIndex) => (
            <div
              key={`${stepIndex}-${lineIndex}`}
              className="leading-loose code-line-reveal"
              style={{
                animationDelay: `${lineIndex * 60}ms`,
              }}
            >
              <span className="text-background/20 select-none w-6 lg:w-8 inline-block">
                {lineIndex + 1}
              </span>
              <span className="lg:hidden">{line}</span>
              <span className="hidden lg:inline-flex">
                {line.split("").map((char, charIndex) => (
                  <span
                    key={`${stepIndex}-${lineIndex}-${charIndex}`}
                    className="code-char-reveal"
                    style={{
                      animationDelay: `${lineIndex * 60 + charIndex * 8}ms`,
                    }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </pre>
      </div>

      <div className="px-4 lg:px-6 py-3 border-t border-background/10 flex items-center gap-2">
        <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[10px] lg:text-xs font-mono text-background/40">Sistema listo</span>
      </div>
    </div>
  );
}

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative py-20 lg:py-32 bg-foreground text-background overflow-hidden"
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 40px,
              currentColor 40px,
              currentColor 41px
            )`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-12 lg:mb-24">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-background/50 mb-6">
            <span className="w-8 h-px bg-background/30" />
            Implementación
          </span>
          <h2
            className={`text-3xl lg:text-6xl font-display tracking-tight transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Tres pasos.
            <br />
            <span className="text-background/50">Un sistema completo.</span>
          </h2>
        </div>

        {/* Mobile: steps + code stacked */}
        <div className="lg:hidden space-y-0">
          {steps.map((step, index) => (
            <button
              key={step.number}
              type="button"
              onClick={() => setActiveStep(index)}
              className={`w-full text-left transition-all duration-500 ${
                activeStep === index ? "opacity-100" : "opacity-40"
              }`}
            >
              <div className="py-6 border-b border-background/10">
                <div className="flex items-start gap-4">
                  <span className="font-display text-2xl text-background/30">{step.number}</span>
                  <div className="flex-1">
                    <h3 className="text-xl font-display mb-2">{step.title}</h3>
                    <p className="text-sm text-background/60 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>

              {activeStep === index && (
                <div className="py-4">
                  <CodeBlock code={step.code} stepIndex={index} />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Desktop: two columns */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-16 lg:gap-24">
          <div className="space-y-0">
            {steps.map((step, index) => (
              <button
                key={step.number}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`w-full text-left py-8 border-b border-background/10 transition-all duration-500 group ${
                  activeStep === index ? "opacity-100" : "opacity-40 hover:opacity-70"
                }`}
              >
                <div className="flex items-start gap-6">
                  <span className="font-display text-3xl text-background/30">{step.number}</span>
                  <div className="flex-1">
                    <h3 className="text-2xl lg:text-3xl font-display mb-3 group-hover:translate-x-2 transition-transform duration-300">
                      {step.title}
                    </h3>
                    <p className="text-background/60 leading-relaxed">{step.description}</p>

                    {activeStep === index && (
                      <div className="mt-4 h-px bg-background/20 overflow-hidden">
                        <div
                          className="h-full bg-background w-0"
                          style={{
                            animation: "progress 5s linear forwards",
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:sticky lg:top-32 self-start">
            <CodeBlock code={steps[activeStep].code} stepIndex={activeStep} />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }

        .code-line-reveal {
          opacity: 0;
          transform: translateX(-8px);
          animation: lineReveal 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        @keyframes lineReveal {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .code-char-reveal {
          opacity: 0;
          animation: charReveal 0.2s ease-out forwards;
        }

        @keyframes charReveal {
          to {
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
}
