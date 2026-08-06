"use client"

import * as React from "react"
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type, List, ListOrdered, Heading1, Heading2 } from "@/components/ui/proicons"
import { cn } from "@/lib/utils"

interface MiniWordEditorProps {
  content: string
  onChange?: (html: string) => void
  placeholder?: string
  readOnly?: boolean
  className?: string
  minHeight?: number
}

function execCmd(cmd: string, value?: string) {
  document.execCommand(cmd, false, value)
}

export function MiniWordEditor({
  content,
  onChange,
  placeholder = "Escribe aquí...",
  readOnly = false,
  className,
  minHeight = 200,
}: MiniWordEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = React.useState(false)
  const [activeStates, setActiveStates] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content
    }
  }, [])

  const handleInput = () => {
    if (editorRef.current) {
      onChange?.(editorRef.current.innerHTML)
    }
  }

  const checkActiveStates = () => {
    const states: Record<string, boolean> = {}
    states.bold = document.queryCommandState('bold')
    states.italic = document.queryCommandState('italic')
    states.underline = document.queryCommandState('underline')
    states.justifyLeft = document.queryCommandState('justifyLeft')
    states.justifyCenter = document.queryCommandState('justifyCenter')
    states.justifyRight = document.queryCommandState('justifyRight')
    states.insertUnorderedList = document.queryCommandState('insertUnorderedList')
    states.insertOrderedList = document.queryCommandState('insertOrderedList')
    setActiveStates(states)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b': e.preventDefault(); execCmd('bold'); checkActiveStates(); break
        case 'i': e.preventDefault(); execCmd('italic'); checkActiveStates(); break
        case 'u': e.preventDefault(); execCmd('underline'); checkActiveStates(); break
      }
    }
  }

  const ToolbarButton = ({
    icon: Icon,
    cmd,
    value,
    label,
  }: {
    icon: React.ComponentType<{ className?: string }>
    cmd: string
    value?: string
    label: string
  }) => {
    const isActive = cmd.startsWith('justify') ? activeStates[cmd] :
                     cmd === 'bold' ? activeStates.bold :
                     cmd === 'italic' ? activeStates.italic :
                     cmd === 'underline' ? activeStates.underline :
                     cmd === 'insertUnorderedList' ? activeStates.insertUnorderedList :
                     cmd === 'insertOrderedList' ? activeStates.insertOrderedList : false

    return (
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
          execCmd(cmd, value)
          checkActiveStates()
          editorRef.current?.focus()
        }}
        className={cn(
          "h-7 w-7 flex items-center justify-center rounded-lg transition-all duration-150",
          isActive
            ? "bg-sb-on-surface/10 text-sb-on-surface"
            : "text-sb-on-surface-variant/50 hover:text-sb-on-surface hover:bg-sb-on-surface/5"
        )}
        title={label}
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
    )
  }

  const ToolbarDivider = () => (
    <div className="w-px h-4 bg-sb-outline-variant/20 mx-0.5" />
  )

  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden transition-all duration-300",
        "bg-sb-surface-container-low",
        isFocused ? "ring-1 ring-sb-outline-variant" : "ring-1 ring-sb-outline-variant/50",
        className
      )}
    >
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-sb-outline-variant/20 bg-sb-surface-container/50">
          <ToolbarButton icon={Bold} cmd="bold" label="Negrita (Ctrl+B)" />
          <ToolbarButton icon={Italic} cmd="italic" label="Cursiva (Ctrl+I)" />
          <ToolbarButton icon={Underline} cmd="underline" label="Subrayado (Ctrl+U)" />
          <ToolbarDivider />
          <ToolbarButton icon={AlignLeft} cmd="justifyLeft" label="Alinear izquierda" />
          <ToolbarButton icon={AlignCenter} cmd="justifyCenter" label="Centrar" />
          <ToolbarButton icon={AlignRight} cmd="justifyRight" label="Alinear derecha" />
          <ToolbarDivider />
          <ToolbarButton icon={List} cmd="insertUnorderedList" label="Lista con viñetas" />
          <ToolbarButton icon={ListOrdered} cmd="insertOrderedList" label="Lista numerada" />
          <ToolbarDivider />
          <ToolbarButton icon={Heading1} cmd="formatBlock" value="h2" label="Título" />
          <ToolbarButton icon={Type} cmd="removeFormat" label="Limpiar formato" />
        </div>
      )}

      {/* Content */}
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={() => { setIsFocused(true); checkActiveStates() }}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        onMouseUp={checkActiveStates}
        data-placeholder={placeholder}
        className={cn(
          "px-4 py-3 text-sm leading-relaxed text-sb-on-surface outline-none overflow-auto",
          "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-sb-outline/40 [&:empty]:before:pointer-events-none",
          "[&_b]:text-sb-on-surface/80 [&_i]:text-sb-on-surface-variant/60 [&_u]:text-sb-on-surface/70",
          "[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-sb-on-surface/80 [&_h2]:mt-2 [&_h2]:mb-1",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-0.5",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-0.5",
          "[&_li]:text-sb-on-surface-variant",
          "[&_p]:mb-1.5",
        )}
        style={{ minHeight }}
      />
    </div>
  )
}
