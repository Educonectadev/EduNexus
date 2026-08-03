"use client"

import { useDesign } from "@/contexts/design-context"
import { cn } from "@/lib/utils"

export function DesignSelector() {
  const { currentDesign, setDesign, availableDesigns } = useDesign()

  return (
    <div data-scope="perfil">
      <div className="grid gap-2">
        {availableDesigns.map((design) => {
          const active = currentDesign.id === design.id
          return (
            <button
              key={design.id}
              onClick={() => setDesign(design.id)}
              className={cn(
                "w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all active:scale-[0.98] cursor-pointer",
                active
                  ? "bg-sb-primary/10 border border-sb-primary/30"
                  : "bg-sb-surface-container-high/50 border border-transparent hover:bg-sb-surface-container-high"
              )}
            >
              {/* Preview swatch */}
              <div
                className={cn(
                  "shrink-0 flex items-center justify-center overflow-hidden rounded-lg border transition-all",
                  active ? "border-sb-primary/40" : "border-sb-outline-variant/50"
                )}
              >
                <DesignPreview designId={design.id} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      active ? "text-sb-primary" : "text-sb-on-surface"
                    )}
                  >
                    {design.name}
                  </span>
                  {active && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sb-primary text-sb-on-primary leading-none">
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-xs text-sb-on-surface-variant/70 mt-0.5 leading-relaxed">
                  {design.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DesignPreview({ designId }: { designId: string }) {
  const isMinimal = designId === "minimal"

  if (isMinimal) {
    return (
      <svg width="72" height="56" viewBox="0 0 72 56" className="block" aria-hidden>
        <rect x="0" y="0" width="72" height="56" rx={4} fill="#ffffff" />
        <rect x="0" y="0" width="72" height="1" fill="#e4e4e7" />
        <rect x="0" y="0" width="18" height="56" rx={4} fill="#ffffff" />
        <rect x="0" y="0" width="1" height="56" fill="#e4e4e7" />
        <rect x="3" y="8" width="12" height="3" rx={1} fill="#161618" />
        <rect x="3" y="15" width="10" height="2" rx={1} fill="#d4d4d8" />
        <rect x="3" y="20" width="10" height="2" rx={1} fill="#d4d4d8" />
        <rect x="3" y="25" width="10" height="2" rx={1} fill="#d4d4d8" />
        <rect x="22" y="6" width="46" height="12" rx={3} fill="#f6f6f7" />
        <rect x="22" y="6" width="46" height="12" rx={3} fill="none" stroke="#e4e4e7" strokeWidth="0.5" />
        <rect x="22" y="22" width="22" height="10" rx={3} fill="#ffffff" />
        <rect x="22" y="22" width="22" height="10" rx={3} fill="none" stroke="#e4e4e7" strokeWidth="0.5" />
        <rect x="46" y="22" width="22" height="10" rx={3} fill="#ffffff" />
        <rect x="46" y="22" width="22" height="10" rx={3} fill="none" stroke="#e4e4e7" strokeWidth="0.5" />
        <rect x="22" y="36" width="46" height="3" rx={1} fill="#161618" />
        <rect x="22" y="43" width="46" height="8" rx={3} fill="#ffffff" />
        <rect x="22" y="43" width="46" height="8" rx={3} fill="none" stroke="#e4e4e7" strokeWidth="0.5" />
      </svg>
    )
  }

  /* Stepbro Money preview */
  return (
    <svg width="72" height="56" viewBox="0 0 72 56" className="block" aria-hidden>
      <rect x="0" y="0" width="72" height="56" rx={8} fill="#fffbfe" />
      <rect x="0" y="0" width="18" height="56" rx={8} fill="#f0ecf1" />
      <rect x="4" y="10" width="4" height="4" rx={2} fill="#1c1b1f" />
      <rect x="10" y="10" width="6" height="2" rx={1} fill="#cac4d0" />
      <rect x="10" y="16" width="6" height="2" rx={1} fill="#cac4d0" />
      <rect x="10" y="22" width="6" height="2" rx={1} fill="#cac4d0" />
      <rect x="22" y="6" width="46" height="12" rx={6} fill="#f7f2f8" />
      <rect x="22" y="22" width="22" height="10" rx={6} fill="#fffbfe" />
      <rect x="46" y="22" width="22" height="10" rx={6} fill="#fffbfe" />
      <rect x="22" y="36" width="46" height="4" rx={2} fill="#1c1b1f" />
      <rect x="22" y="44" width="46" height="8" rx={6} fill="#f7f2f8" />
      <rect x="0" y="0" width="72" height="56" rx={8} fill="none" stroke="#cac4d0" strokeWidth="0.5" />
    </svg>
  )
}
