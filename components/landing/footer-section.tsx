"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AnimatedWave } from "./animated-wave";

const footerLinks = {
  Producto: [
    { name: "Plataforma", href: "/#features" },
    { name: "Cómo funciona", href: "/#how-it-works" },
    { name: "Precios", href: "/#pricing" },
    { name: "Integraciones", href: "/#integrations" },
  ],
  Instituciones: [
    { name: "Colegios Públicos", href: "/instituciones/colegios-publicos" },
    { name: "Colegios Privados", href: "/instituciones/colegios-privados" },
    { name: "UGELES", href: "/instituciones/ugeles" },
    { name: "MINEDU", href: "/instituciones/minedu" },
  ],
  Empresa: [
    { name: "Sobre nosotros", href: "/sobre-nosotros" },
    { name: "Blog educativo", href: "/blog" },
    { name: "Trabaja con nosotros", href: "/trabaja-con-nosotros", badge: "Activos" },
    { name: "Contacto", href: "/contacto" },
  ],
  Legal: [
    { name: "Privacidad", href: "/privacidad" },
    { name: "Términos", href: "/terminos" },
    { name: "Seguridad", href: "/seguridad" },
    { name: "PDPL", href: "/pdpl" },
  ],
};

const socialLinks = [
  { name: "LinkedIn", href: "#" },
  { name: "Facebook", href: "#" },
  { name: "YouTube", href: "#" },
];

export function FooterSection() {
  return (
    <footer className="relative border-t border-foreground/10">
      <div className="absolute inset-0 h-64 opacity-20 pointer-events-none overflow-hidden">
        <AnimatedWave />
      </div>
      
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="py-16 lg:py-24">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-12 lg:gap-8">
            <div className="col-span-2">
              <a href="#" className="inline-flex items-center gap-2 mb-6">
                <span className="text-2xl font-display">Educonecta</span>
                <span className="text-xs text-muted-foreground font-mono">PE</span>
              </a>

              <p className="text-muted-foreground leading-relaxed mb-8 max-w-xs">
                La plataforma educativa líder del Perú. Conectando colegios, 
                docentes, padres y estudiantes en todo el país.
              </p>

              <div className="flex gap-6">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group"
                  >
                    {link.name}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                ))}
              </div>
            </div>

            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className="text-sm font-medium mb-6">{title}</h3>
                <ul className="space-y-4">
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                      >
                        {link.name}
                        {"badge" in link && link.badge && (
                          <span className="text-xs px-2 py-0.5 bg-foreground text-background rounded-full">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="py-8 border-t border-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            2025 Educonecta. Todos los derechos reservados. Hecho en el Perú.
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Todos los sistemas operativos
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
