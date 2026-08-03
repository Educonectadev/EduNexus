"use client"

import { AIAssistantContent } from "@/components/secretario/ai-assistant"

export default function AsistentePage() {
  return (
    <div className="-mx-6 -mt-6 h-[calc(100vh-3.5rem)] md:pb-0 pb-32 flex flex-col">
      <div className="px-6 pt-6 pb-4 shrink-0">
        <h1 className="text-xl font-bold tracking-tight text-sb-on-surface">Asistente IA</h1>
        <p className="text-sm text-sb-on-surface-variant/50 mt-1">
          Tu asistente virtual para tareas administrativas
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <AIAssistantContent />
      </div>
    </div>
  )
}
