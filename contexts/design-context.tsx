"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"

export interface Design {
  id: string
  name: string
  description: string
}

const AVAILABLE_DESIGNS: Design[] = [
  {
    id: "stepbro-money",
    name: "Stepbro Money",
    description: "Diseño original — Blanco y negro, glassmorphism, esquinas redondeadas.",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Plano, líneas finas, sin sombras ni blur.",
  },
]

const STORAGE_KEY = "sb-design"

function clearInlineVars() {
  const root = document.documentElement
  for (const key of Array.from(root.style)) {
    if (key.startsWith("--")) root.style.removeProperty(key)
  }
  root.removeAttribute("data-design")
}

function applyMinimal() {
  clearInlineVars()
  document.documentElement.setAttribute("data-design", "minimal")
}

interface DesignContextValue {
  currentDesign: Design
  setDesign: (id: string) => void
  availableDesigns: Design[]
}

const DesignContext = createContext<DesignContextValue | null>(null)

export function DesignProvider({ children }: { children: ReactNode }) {
  const [currentDesign, setCurrentDesign] = useState<Design>(() => {
    if (typeof window === "undefined") return AVAILABLE_DESIGNS[0]
    const stored = localStorage.getItem(STORAGE_KEY)
    return AVAILABLE_DESIGNS.find((d) => d.id === stored) || AVAILABLE_DESIGNS[0]
  })

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "minimal") applyMinimal()
    else clearInlineVars()
  }, [])

  const setDesign = useCallback((id: string) => {
    const found = AVAILABLE_DESIGNS.find((d) => d.id === id)
    if (!found) return
    setCurrentDesign(found)
    if (id === "minimal") applyMinimal()
    else clearInlineVars()
    localStorage.setItem(STORAGE_KEY, id)
  }, [])

  return (
    <DesignContext.Provider value={{ currentDesign, setDesign, availableDesigns: AVAILABLE_DESIGNS }}>
      {children}
    </DesignContext.Provider>
  )
}

export function useDesign(): DesignContextValue {
  const ctx = useContext(DesignContext)
  if (!ctx) throw new Error("useDesign must be used within a DesignProvider")
  return ctx
}
