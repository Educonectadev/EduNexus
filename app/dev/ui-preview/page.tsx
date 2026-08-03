"use client"

import * as React from "react"
import "@/frontend.css"
import { SbBtn } from "@/components/ui/sb"

const grades = ["1ero", "2do", "3ero", "4to", "5to", "6to"]

export default function UiPreviewPage() {
  const [grade, setGrade] = React.useState("")
  const [type, setType] = React.useState("")

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-sb-on-surface">Vista previa de cambios</h1>
        <p className="text-sm text-sb-on-surface-variant/70">Diseño nuevo de selects aplicado en los paneles internos (secretario, director, docente, super-admin).</p>
      </div>

      {/* Antes vs Después */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-sb-on-surface">Antes vs Después</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-sb-outline-variant/40 p-4 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sb-on-surface-variant/40">ANTES (estilo viejo)</p>
            <div className="flex items-center gap-2">
              <select className="sb-select w-full rounded-xl text-sm h-10">
                <option value="">Seleccionar grado</option>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select className="px-4 py-3 bg-sb-background border border-sb-on-surface/10 rounded-xl text-sb-on-surface focus:outline-none focus:ring-2 focus:ring-sb-primary/20 w-full">
                <option value="">Seleccionar tipo</option>
                <option>Público</option>
                <option>Privado</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-sb-outline-variant/40 p-4 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sb-on-surface-variant/40">DESPUÉS (nuevo diseño)</p>
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
        <div className="rounded-2xl border border-sb-outline-variant/40 p-4 space-y-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sb-on-surface-variant/40 mb-1.5">Con valor seleccionado (estado .has-value)</p>
            <select className="sbf-native-select w-full has-value">
              <option>5to grado - Sección A</option>
            </select>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sb-on-surface-variant/40 mb-1.5">Vacío (placeholder)</p>
            <select className="sbf-native-select w-full">
              <option value="">Seleccionar curso...</option>
              <option>Matemáticas</option>
              <option>Lenguaje</option>
            </select>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sb-on-surface-variant/40 mb-1.5">Compacto en línea (sin w-full)</p>
            <div className="flex items-center gap-3">
              <select className="sbf-native-select">
                <option value="">Todos los grados</option>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <span className="text-xs text-sb-on-surface-variant/50">← así se ve en el filtro de Cursos</span>
            </div>
          </div>
        </div>
      </section>

      <p className="text-xs text-sb-on-surface-variant/50">
        URL: <code className="bg-sb-surface px-1.5 py-0.5 rounded">/secretario/cursos</code>, <code className="bg-sb-surface px-1.5 py-0.5 rounded">/secretario/padres</code>, <code className="bg-sb-surface px-1.5 py-0.5 rounded">/director/personal</code>, <code className="bg-sb-surface px-1.5 py-0.5 rounded">/docente/tareas</code>, <code className="bg-sb-surface px-1.5 py-0.5 rounded">/super-admin/instituciones</code>…
      </p>

      {/* Botón negro (filled) */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-sb-on-surface">Botón negro "Nuevo curso"</h2>
        <div className="rounded-2xl border border-sb-outline-variant/40 p-4 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <SbBtn variant="filled" rounded>Nuevo curso</SbBtn>
            <SbBtn variant="filled" rounded>Guardar</SbBtn>
            <SbBtn variant="default">Cancelar</SbBtn>
          </div>
          <p className="text-xs text-sb-on-surface-variant/50">
            Los <code className="bg-sb-surface px-1.5 py-0.5 rounded">variant="filled"</code> deben verse NEGROS con texto blanco en cualquier tema. Si acá los ves blancos, avisame qué dice el diagnóstico de abajo.
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
    <div className="rounded-2xl border border-sb-outline-variant/40 p-4 space-y-1.5 font-mono text-xs">
      {Object.entries(vals).map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4">
          <span className="text-sb-on-surface-variant/70">{k}</span>
          <span className="text-sb-on-surface">{v}</span>
        </div>
      ))}
      <p className="text-[10px] text-sb-on-surface-variant/50 pt-1">
        Si acá dice <code>var(--sb-on-surface) = #ffffff</code>, tu navegador está en tema oscuro con caché vieja.
      </p>
    </div>
  )
}
