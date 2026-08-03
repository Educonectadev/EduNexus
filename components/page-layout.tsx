"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function PageHeader({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="relative pt-32 lg:pt-40 pb-16 lg:pb-24">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Volver al inicio
        </Link>

        <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
          <span className="w-8 h-px bg-foreground/30" />
          {label}
        </span>

        <h1 className="font-display text-5xl md:text-6xl lg:text-8xl tracking-tight text-foreground mb-6">
          {title}
        </h1>

        {description && (
          <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-3xl">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export function PageSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`max-w-[1400px] mx-auto px-6 lg:px-12 py-16 lg:py-24 ${className}`}>
      {children}
    </div>
  );
}

export function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-8 border border-foreground/10 hover:border-foreground/20 transition-all duration-300 group">
      <h3 className="font-display text-2xl mb-4 group-hover:translate-x-2 transition-transform duration-300">
        {title}
      </h3>
      <div className="text-muted-foreground leading-relaxed space-y-4">
        {children}
      </div>
    </div>
  );
}

export function CTAInline() {
  return (
    <div className="border-t border-foreground/10">
      <PageSection>
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-4xl lg:text-5xl tracking-tight mb-6">
            ¿Tienes preguntas?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Nuestro equipo está listo para ayudarte. Contáctanos y te responderemos en menos de 24 horas.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contacto">
              <Button
                size="lg"
                className="bg-foreground hover:bg-foreground/90 text-background px-8 h-14 text-base rounded-full"
              >
                Contactar ahora
              </Button>
            </Link>
            <Link href="/">
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-base rounded-full border-foreground/20 hover:bg-foreground/5"
              >
                Volver al inicio
              </Button>
            </Link>
          </div>
        </div>
      </PageSection>
    </div>
  );
}
