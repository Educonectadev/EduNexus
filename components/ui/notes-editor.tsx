"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Columns, LayoutGrid, List, StickyNote } from "lucide-react"

type ViewMode = "note" | "list" | "grid" | "columns"

interface ViewOption {
  id: ViewMode
  icon: React.ComponentType<{ className?: string }>
  label: string
}

const viewOptions: ViewOption[] = [
  { id: "note", icon: StickyNote, label: "Nota" },
  { id: "list", icon: List, label: "Lista" },
  { id: "grid", icon: LayoutGrid, label: "Cuadrícula" },
  { id: "columns", icon: Columns, label: "Columnas" },
]

interface NotesEditorProps {
  title: string
  titlePlaceholder?: string
  content: string
  contentPlaceholder?: string
  onTitleChange?: (value: string) => void
  onContentChange?: (value: string) => void
  readOnly?: boolean
  className?: string
}

export function NotesEditor({
  title,
  titlePlaceholder = "Título de la nota",
  content,
  contentPlaceholder = "Escribe aquí...",
  onTitleChange,
  onContentChange,
  readOnly = false,
  className,
}: NotesEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<ViewMode>("note")

  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content
    }
  }, [])

  const handleInput = () => {
    if (editorRef.current) {
      onContentChange?.(editorRef.current.innerHTML)
    }
  }

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-3xl overflow-hidden transition-all duration-300",
        // stepbro: surface-container-low
        "bg-[var(--sb-surface-container-low)]",
        isFocused ? "ring-1 ring-[var(--sb-outline-variant)]" : "ring-1 ring-[var(--sb-outline-variant)]/50",
        className
      )}
    >
      {/* View Selector Bar — stepbro view-selector style */}
      <div className="flex items-center border-b border-[var(--sb-outline-variant)]/30">
        <div className="flex items-center p-1 m-1 rounded-2xl bg-[var(--sb-surface-container)]">
          {viewOptions.map((opt) => {
            const isActive = viewMode === opt.id
            const Icon = opt.icon
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setViewMode(opt.id)}
                className={cn(
                  "relative flex items-center justify-center h-9 px-3 gap-1.5 rounded-xl text-xs font-medium transition-all duration-200",
                  isActive
                    ? "bg-[var(--sb-surface-container-high)] text-[var(--sb-on-surface)]"
                    : "text-[var(--sb-on-surface-variant)] hover:text-[var(--sb-on-surface)] hover:bg-[var(--sb-surface-container-high)]/50"
                )}
                title={opt.label}
              >
                {isActive && (
                  <Icon className="h-3.5 w-3.5" style={{ fontVariationSettings: "'FILL' 1" }} />
                )}
                {!isActive && <Icon className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            )
          })}
        </div>

        {/* Right side — auto-save indicator */}
        <div className="ml-auto flex items-center gap-1.5 pr-3 text-[10px] text-[var(--sb-on-surface-variant)]/50">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/40" />
          Guardando
        </div>
      </div>

      {/* Content area */}
      <div className={cn(
        "flex",
        viewMode === "columns" && "min-h-[280px]"
      )}>
        {/* Title + Editor */}
        <div className={cn(
          "flex flex-col flex-1",
          viewMode === "columns" && "border-r border-[var(--sb-outline-variant)]/30"
        )}>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange?.(e.target.value)}
            placeholder={titlePlaceholder}
            readOnly={readOnly}
            className="w-full bg-transparent px-5 pt-5 pb-2 text-base font-medium text-[var(--sb-on-surface)] placeholder:text-[var(--sb-on-surface-variant)]/30 outline-none"
          />
          <div
            ref={editorRef}
            contentEditable={!readOnly}
            suppressContentEditableWarning
            onInput={handleInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            data-placeholder={contentPlaceholder}
            className={cn(
              "flex-1 px-5 pb-5 pt-1 text-sm leading-relaxed text-[var(--sb-on-surface-variant)] outline-none overflow-auto min-h-[180px]",
              "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-[var(--sb-outline)]/40 [&:empty]:before:pointer-events-none",
              "[&_b]:text-[var(--sb-on-surface)]/80 [&&_i]:text-[var(--sb-on-surface-variant)]/60",
              "[&_ul]:list-disc [&&_ul]:pl-5 [&&_ul]:space-y-1",
              "[&_ol]:list-decimal [&&_ol]:pl-5 [&&_ol]:space-y-1",
              "[&_li]:text-[var(--sb-on-surface-variant)]",
              "[&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-[var(--sb-on-surface)]/80 [&_h1]:mt-4 [&_h1]:mb-2",
              "[&_h2]:text-lg [&_h2]:font-medium [&_h2]:text-[var(--sb-on-surface)]/60 [&_h2]:mt-3 [&_h2]:mb-1.5",
              "[&_blockquote]:border-l-2 [&_blockquote]:border-[var(--sb-outline-variant)] [&_blockquote]:pl-3 [&_blockquote]:text-[var(--sb-on-surface-variant)]/60 [&_blockquote]:italic"
            )}
          />
        </div>

        {/* Side panel — only visible in columns view */}
        {viewMode === "columns" && (
          <div className="w-[260px] flex-shrink-0 p-4 space-y-4 hidden md:flex md:flex-col">
            {/* stepbro content-box style */}
            <div className="rounded-2xl bg-[var(--sb-surface-container)] p-4 space-y-3">
              <p className="text-[10px] text-[var(--sb-on-surface-variant)]/40 uppercase tracking-wider font-medium">Detalles</p>
              <div className="space-y-1.5">
                <label className="text-[10px] text-[var(--sb-on-surface-variant)]/50">Participantes</label>
                <div className="h-8 rounded-xl bg-[var(--sb-surface-container-high)] flex items-center px-3">
                  <span className="text-xs text-[var(--sb-on-surface-variant)]/40">Seleccionar...</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-[var(--sb-on-surface-variant)]/50">Etiquetas</label>
                <div className="flex gap-1.5 flex-wrap">
                  {["Urgente", "Reunión", "General"].map(tag => (
                    <span key={tag} className="text-[10px] text-[var(--sb-on-surface-variant)]/50 px-2 py-0.5 rounded-full bg-[var(--sb-surface-container-high)]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-[var(--sb-on-surface-variant)]/50">Prioridad</label>
                <div className="flex gap-1.5">
                  {["Baja", "Media", "Alta"].map((p, i) => (
                    <span
                      key={p}
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full cursor-pointer transition-colors",
                        i === 1 ? "bg-[var(--sb-surface-container-high)] text-[var(--sb-on-surface)]/70" : "bg-[var(--sb-surface-container-high)]/50 text-[var(--sb-on-surface-variant)]/50 hover:bg-[var(--sb-surface-container-high)]"
                      )}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}