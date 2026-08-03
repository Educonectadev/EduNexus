"use client";

import { useEffect, useState, useRef } from "react";
import { Shield, Lock, Eye, FileCheck } from "lucide-react";

const securityFeatures = [
  {
    icon: Shield,
    title: "Protección de Datos Personales",
    description: "Cumplimiento total con la Ley N° 29733 de Protección de Datos Personales. Datos de estudiantes y personal almacenados exclusivamente en servidores dentro del territorio peruano.",
  },
  {
    icon: Lock,
    title: "Cifrado de Extremo a Extremo",
    description: "Cifrado AES-256 para datos en reposo y TLS 1.3 en tránsito. Las calificaciones, datos médicos e información personal están protegidos en todo momento.",
  },
  {
    icon: Eye,
    title: "Control de Acceso por Roles",
    description: "Arquitectura de cero confianza: cada solicitud es autenticada y autorizada. Directivos, docentes, padres y estudiantes ven únicamente la información que les corresponde.",
  },
  {
    icon: FileCheck,
    title: "Auditoría y Cumplimiento",
    description: "Registro completo de actividad: quién accedió, cuándo y qué modificó. Cumplimiento con normativas del MINEDU, RGPD y estándares internacionales ISO 27001.",
  },
];

const certifications = ["ISO 27001", "SOC 2", "MINEDU", "PDPL", "GDPR"];

export function SecuritySection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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

  return (
    <section id="security" ref={sectionRef} className="relative py-24 lg:py-32 bg-foreground/[0.02] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <div
            className={`transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
              <span className="w-8 h-px bg-foreground/30" />
              Seguridad
            </span>
            <h2 className="text-4xl lg:text-6xl font-display tracking-tight mb-8">
              La protección de los
              <br />
              estudiantes es prioridad.
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed mb-12">
              Los datos de menores de edad requieren la máxima protección. Nuestra plataforma 
              cumple con las más altas normativas nacionales e internacionales de seguridad 
              y privacidad de datos.
            </p>

            <div className="flex flex-wrap gap-3">
              {certifications.map((cert, index) => (
                <span
                  key={cert}
                  className={`px-4 py-2 border border-foreground/10 text-sm font-mono transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: `${index * 50 + 200}ms` }}
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            {securityFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className={`p-6 border border-foreground/10 hover:border-foreground/20 transition-all duration-500 group ${
                  isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-10 h-10 flex items-center justify-center border border-foreground/10 group-hover:bg-foreground group-hover:text-background transition-colors duration-300">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1 group-hover:translate-x-1 transition-transform duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
