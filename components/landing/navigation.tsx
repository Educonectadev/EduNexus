"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { DemoModal } from "@/components/demo-modal";

const navLinks = [
  { name: "Plataforma", href: "#features" },
  { name: "Cómo funciona", href: "#how-it-works" },
  { name: "Seguridad", href: "#security" },
  { name: "Precios", href: "#pricing" },
];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed z-50 transition-all duration-500 ${
        isScrolled 
          ? "top-4 left-4 right-4" 
          : "top-0 left-0 right-0"
      }`}
    >
      <nav 
        className={`mx-auto transition-all duration-500 ${
          isScrolled || isMobileMenuOpen
            ? "glass border border-border/50 rounded-2xl shadow-lg max-w-[1200px]"
            : "bg-transparent max-w-[1400px]"
        }`}
      >
        <div 
          className={`flex items-center justify-between transition-all duration-500 px-6 lg:px-8 ${
            isScrolled ? "h-14" : "h-20"
          }`}
        >
          <a href="#" className="flex items-center gap-2.5 group">
            <div className={`bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-all duration-500 ${isScrolled ? "h-7 w-7 rounded-lg" : "h-8 w-8 rounded-xl"}`}>
              <span className="text-white font-bold transition-all duration-500 ${isScrolled ? 'text-xs' : 'text-sm'}">EN</span>
            </div>
            <span className={`font-semibold tracking-tight transition-all duration-500 ${isScrolled ? "text-lg" : "text-xl"}`}>EduNexus</span>
          </a>

          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative p-2 rounded-xl hover:bg-muted/50 transition-colors"
              title="Cambiar tema"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute inset-0 m-auto h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>
            <a href="/login" className={`text-muted-foreground hover:text-foreground transition-all duration-500 ${isScrolled ? "text-xs" : "text-sm"}`}>
              Iniciar sesión
            </a>
            <Button
              size="sm"
              className={`bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg shadow-primary/20 transition-all duration-500 ${isScrolled ? "px-4 h-8 text-xs" : "px-6"}`}
              onClick={() => setDemoOpen(true)}
            >
              Solicitar demo
            </Button>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

      </nav>
      
      <div
        className={`md:hidden fixed inset-0 bg-background z-40 transition-all duration-500 ${
          isMobileMenuOpen 
            ? "opacity-100 pointer-events-auto" 
            : "opacity-0 pointer-events-none"
        }`}
        style={{ top: 0 }}
      >
        <div className="flex flex-col h-full px-8 pt-28 pb-8">
          <div className="flex-1 flex flex-col justify-center gap-8">
            {navLinks.map((link, i) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-5xl font-display text-foreground hover:text-muted-foreground transition-all duration-500 ${
                  isMobileMenuOpen 
                    ? "opacity-100 translate-y-0" 
                    : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: isMobileMenuOpen ? `${i * 75}ms` : "0ms" }}
              >
                {link.name}
              </a>
            ))}
          </div>
          
          <div className={`flex items-center gap-3 pt-8 border-t border-border/50 transition-all duration-500 ${
            isMobileMenuOpen 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: isMobileMenuOpen ? "300ms" : "0ms" }}
          >
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative p-3 rounded-xl hover:bg-muted/50 transition-colors shrink-0"
              title="Cambiar tema"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute inset-0 m-auto h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>
            <Button 
              variant="outline" 
              className="flex-1 rounded-full h-14 text-base"
              onClick={() => setIsMobileMenuOpen(false)}
              asChild
            >
              <a href="/login">Iniciar sesión</a>
            </Button>
            <Button 
              className="flex-1 bg-primary text-primary-foreground rounded-full h-14 text-base shadow-lg shadow-primary/20"
              onClick={() => { setIsMobileMenuOpen(false); setDemoOpen(true); }}
            >
              Solicitar demo
            </Button>
          </div>
        </div>
      </div>

      <DemoModal open={demoOpen} onOpenChange={setDemoOpen} />
    </header>
  );
}
