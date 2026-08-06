"use client"

import * as React from "react"
import "@/frontend.css"
import { SbBtn } from "@/components/ui/sb"

const grades = ["1ero", "2do", "3ero", "4to", "5to", "6to"]

export default function UiPreviewPage() {
  const [grade, setGrade] = React.useState("")
  const [type, setType] = React.useState("")

  return (
    <div className="w-full space-y-6 py-2 md:py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-[22px] md:text-[24px] font-bold tracking-tight text-sb-on-surface">
            Vista previa de cambios
          </h2>
          <p className="text-[13px] text-sb-on-surface/70 mt-1">
            Diseño nuevo de selects aplicado en los paneles internos (secretario, director, docente, super-admin).
          </p>
        </div>
      </div>

      {/* Antes vs Después */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-sb-on-surface">Antes vs Después</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-4 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-sb-on-surface/60">ANTES (estilo viejo)</p>
            <div className="flex items-center gap-2">
              <select className="sb-select w-full rounded-xl text-sm h-10">
                <option value="">Seleccionar grado</option>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select className="px-4 py-3 bg-sb-surface-container border border-sb-outline-variant/10 rounded-xl text-sb-on-surface focus:outline-none focus:ring-2 focus:ring-sb-primary/30 w-full">
                <option value="">Seleccionar tipo</option>
                <option>Público</option>
                <option>Privado</option>
              </select>
            </div>
          </div>

          <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-4 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-sb-on-surface/60 mb-1">DESPUÉS (nuevo diseño)</p>
            <select
              value={grade}
              onChange={e => setGrade(e.target.value)}
              className={`sbf-native-select w-full ${grade ? "has-value" : ""}`}
            >
              <option value="">Todos los grados</option>
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className={`sbf-native-select w-full ${type ? "has-value" : ""}`}
            >
              <option value="">Seleccionar tipo</option>
              <option value="public">Público</option>
              <option value="private">Privado</option>
              <option value="semi">Semi-privado</option>
            </select>
          </div>
        </div>
      </section>

      {/* Variantes del nuevo diseño */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-sb-on-surface">Nuevo diseño — variantes</h2>
        <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-4 space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-sb-on-surface/60 mb-1.5">Con valor seleccionado (estado .has-value)</p>
            <select className="sbf-native-select w-full has-value">
              <option>5to grado - Sección A</option>
            </select>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-sb-on-surface/60 mb-1.5">Vacío (placeholder)</p>
            <select className="sbf-native-select w-full">
              <option value="">Seleccionar curso...</option>
              <option>Matemáticas</option>
              <option>Lenguaje</option>
            </select>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-sb-on-surface/60 mb-1.5">Compacto en línea (sin w-full)</p>
            <div className="flex flex-wrap items-center gap-3">
              <select className="sbf-native-select">
                <option value="">Todos los grados</option>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <span className="text-xs text-sb-on-surface/70">← así se ve en el filtro de Cursos</span>
            </div>
          </div>
        </div>
      </section>

      <p className="text-xs text-sb-on-surface/70">
        URL: <code className="bg-sb-surface-container px-1.5 py-0.5 rounded">/secretario/cursos</code>, <code className="bg-sb-surface-container px-1.5 py-0.5 rounded">/secretario/padres</code>, <code className="bg-sb-surface-container px-1.5 py-0.5 rounded">/director/personal</code>, <code className="bg-sb-surface-container px-1.5 py-0.5 rounded">/docente/tareas</code>, <code className="bg-sb-surface-container px-1.5 py-0.5 rounded">/super-admin/instituciones</code>…
      </p>

      {/* Botón negro (filled) */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-sb-on-surface">Botón negro "Nuevo curso"</h2>
        <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-4 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <SbBtn variant="filled" rounded>Nuevo curso</SbBtn>
            <SbBtn variant="filled" rounded>Guardar</SbBtn>
            <SbBtn variant="default">Cancelar</SbBtn>
          </div>
          <p className="text-xs text-sb-on-surface/70">
            Los <code className="bg-sb-surface-container px-1.5 py-0.5 rounded">variant="filled"</code> deben verse NEGROS con texto blanco en cualquier tema. Si acá los ves blancos, avisame qué dice el diagnóstico de abajo.
          </p>
        </div>
      </section>

      {/* Diagnóstico de tema */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-sb-on-surface">Diagnóstico del navegador</h2>
        <ThemeDiagnostic />
      </section>
    </div>
  )
}

function ThemeDiagnostic() {
  const [vals, setVals] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    const s = getComputedStyle(document.documentElement)
    const read = (v: string) => s.getPropertyValue(v).trim() || "no definido"
    setVals({
      tema: document.documentElement.classList.contains("dark") ? "oscuro (dark)" : "claro (light)",
      "var(--sb-on-surface)": read("--sb-on-surface"),
      "var(--sb-solid-bg)": read("--sb-solid-bg"),
      "var(--sb-solid-fg)": read("--sb-solid-fg"),
      "var(--foreground)": read("--foreground"),
    })
  }, [])

  return (
    <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-4 space-y-1.5 font-mono text-xs">
      {Object.entries(vals).map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4">
          <span className="text-sb-on-surface/70">{k}</span>
          <span className="text-sb-on-surface">{v}</span>
        </div>
      ))}
      <p className="text-[11px] text-sb-on-surface/70 pt-1">
        Si acá dice <code>var(--sb-on-surface) = #ffffff</code>, tu navegador está en tema oscuro con caché vieja.
      </p>
    </div>
  )
}