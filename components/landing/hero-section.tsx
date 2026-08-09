"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "@/components/ui/proicons";
import { AnimatedSphere } from "./animated-sphere";
import { DemoModal } from "@/components/demo-modal";

const words = ["gestionar", "conectar", "transformar", "innovar"];

export function HeroSection() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isVisible] = useState(true);
  const [wordIndex, setWordIndex] = useState(0);
  const [demoOpen, setDemoOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const isLight = mounted ? theme === "light" : false;

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] lg:w-[800px] lg:h-[800px] pointer-events-none">
        <AnimatedSphere light={!isLight} />
      </div>
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        {[...Array(8)].map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute h-px bg-foreground/10"
            style={{
              top: `${12.5 * (i + 1)}%`,
              left: 0,
              right: 0,
            }}
          />
        ))}
        {[...Array(12)].map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute w-px bg-foreground/10"
            style={{
              left: `${8.33 * (i + 1)}%`,
              top: 0,
              bottom: 0,
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 py-32 lg:py-40">
        <div 
          className={`mb-8 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground">
            <span className="w-8 h-px bg-foreground/30" />
            Plataforma Educativa Nacional
          </span>
        </div>
        
        <div className="mb-12">
          <h1 
            className={`text-[clamp(3rem,12vw,10rem)] font-display leading-[0.9] tracking-tight transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="block">La plataforma</span>
            <span className="block">
              para{" "}
              <span className="relative inline-block">
                <span 
                  key={wordIndex}
                  className="inline-flex"
                >
                  {words[wordIndex].split("").map((char, i) => (
                    <span
                      key={`${wordIndex}-${i}`}
                      className="inline-block animate-char-in"
                      style={{
                        animationDelay: `${i * 50}ms`,
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </span>
                <span className="absolute -bottom-2 left-0 right-0 h-3 bg-primary/20" />
              </span>
            </span>
            <span className="block">la educación</span>
          </h1>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-end">
          <p 
            className={`text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-xl transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            El sistema integral de gestión escolar para colegios públicos y privados del Perú. 
            Automatiza matrículas, calificaciones, asistencia y comunicación en una sola plataforma.
          </p>
          
          <div 
            className={`flex flex-col sm:flex-row items-start gap-4 transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <a
              href="/register"
              className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-14 text-base rounded-full group shadow-lg shadow-primary/20 transition-colors"
            >
              Comenzar gratis
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </a>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setDemoOpen(true)}
              className="h-14 px-8 text-base rounded-full border-border hover:bg-muted/50 text-foreground"
            >
              Agendar demostración
            </Button>
          </div>
        </div>
        
      </div>
      
      <div 
        className={`absolute bottom-24 left-0 right-0 transition-all duration-700 delay-500 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex gap-16 marquee whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-16">
              {[
                { value: "18,000+", label: "colegios activos", company: "NACIONAL" },
                { value: "2.4M", label: "estudiantes gestionados", company: "PERÚ" },
                { value: "99.9%", label: "disponibilidad", company: "UPTIME" },
                { value: "25", label: "regiones conectadas", company: "EN TODO EL PAÍS" },
              ].map((stat) => (
                <div key={`${stat.company}-${i}`} className="flex items-baseline gap-4">
                  <span className="text-4xl lg:text-5xl font-display">{stat.value}</span>
                  <span className="text-sm text-muted-foreground">
                    {stat.label}
                    <span className="block font-mono text-xs mt-1">{stat.company}</span>
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      <DemoModal open={demoOpen} onOpenChange={setDemoOpen} />
    </section>
  );
}
