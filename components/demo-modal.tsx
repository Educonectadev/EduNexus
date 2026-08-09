"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ArrowRight, Check } from "@/components/ui/proicons";

type Step = "form" | "success";

interface DemoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoModal({ open, onOpenChange }: DemoModalProps) {
  const [step, setStep] = useState<Step>("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    institution_name: "",
    phone: "",
    institution_type: "",
    estimated_students: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          estimated_students: parseInt(form.estimated_students) || 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep("success");
      } else {
        setError(data.error || "Error al enviar");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (value: boolean) => {
    onOpenChange(value);
    if (!value) {
      setTimeout(() => {
        setStep("form");
        setForm({ full_name: "", email: "", institution_name: "", phone: "", institution_type: "", estimated_students: "" });
        setError("");
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md rounded-none border-foreground/20 p-0 overflow-hidden">
        {step === "form" ? (
          <form onSubmit={handleSubmit} className="p-8">
            <DialogHeader className="mb-6 text-left">
              <DialogTitle className="font-display text-2xl">
                Solicitar demo gratuita
              </DialogTitle>
              <DialogDescription>
                Completa el formulario y un asesor se contactará contigo en menos de 24 horas.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-1.5">
                  Nombre completo
                </label>
                <input
                  type="text"
                  name="full_name"
                  required
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Juan Pérez"
                  className="w-full px-4 py-2.5 bg-foreground/[0.02] border border-foreground/10 focus:border-foreground/30 focus:outline-none transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="juan@colegio.edu.pe"
                  className="w-full px-4 py-2.5 bg-foreground/[0.02] border border-foreground/10 focus:border-foreground/30 focus:outline-none transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-1.5">
                  Institución educativa
                </label>
                <input
                  type="text"
                  name="institution_name"
                  required
                  value={form.institution_name}
                  onChange={handleChange}
                  placeholder="IEP San Martín de Porres"
                  className="w-full px-4 py-2.5 bg-foreground/[0.02] border border-foreground/10 focus:border-foreground/30 focus:outline-none transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-1.5">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+51 999 888 777"
                  className="w-full px-4 py-2.5 bg-foreground/[0.02] border border-foreground/10 focus:border-foreground/30 focus:outline-none transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-1.5">
                  Tipo de institución
                </label>
                <select
                  name="institution_type"
                  required
                  value={form.institution_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-foreground/[0.02] border border-foreground/10 focus:border-foreground/30 focus:outline-none transition-colors text-sm text-foreground"
                >
                  <option value="">Seleccionar...</option>
                  <option value="publico">Colegio público</option>
                  <option value="privado">Colegio privado</option>
                  <option value="ugel">UGEL</option>
                  <option value="minedu">MINEDU</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-1.5">
                  Número de estudiantes (aprox.)
                </label>
                <input
                  type="text"
                  name="estimated_students"
                  value={form.estimated_students}
                  onChange={handleChange}
                  placeholder="Ej: 500"
                  className="w-full px-4 py-2.5 bg-foreground/[0.02] border border-foreground/10 focus:border-foreground/30 focus:outline-none transition-colors text-sm"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-xs mt-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6 py-3 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="inline-block w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              ) : (
                <>
                  Enviar solicitud
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              Sin compromiso. Primer mes gratis para colegios nuevos.
            </p>
          </form>
        ) : (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center mx-auto mb-6">
              <Check className="w-6 h-6 text-background" />
            </div>
            <h3 className="font-display text-2xl mb-3">¡Solicitud enviada!</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Un asesor de EduNexus se contactará contigo en las próximas 24 horas 
              para agendar tu demostración personalizada.
            </p>
            <button
              onClick={() => handleClose(false)}
              className="px-6 py-2.5 border border-foreground/20 text-sm hover:bg-foreground/5 transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
