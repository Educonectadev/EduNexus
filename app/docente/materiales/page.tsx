"use client"

import * as React from "react"
import { FileText, Upload, Download, Search, Image, File } from "lucide-react"
import { motion } from "framer-motion"
import { SbInput, SbBtn } from "@/components/ui/sb"

interface Material { id: string; name: string; type: string; subject: string; size: string; date: string }

const defaultMaterials: Material[] = [
  { id: "1", name: "Guía de álgebra - Cap. 3.pdf", type: "pdf", subject: "Matemática", size: "2.4 MB", date: "2026-07-20" },
  { id: "2", name: "Presentación independencia.pptx", type: "pptx", subject: "Historia", size: "5.1 MB", date: "2026-07-18" },
  { id: "3", name: "Video explicativo - Ecuaciones.mp4", type: "video", subject: "Matemática", size: "45 MB", date: "2026-07-15" },
  { id: "4", name: "Fórmulas químicas.docx", type: "doc", subject: "Ciencia", size: "890 KB", date: "2026-07-12" },
  { id: "5", name: "Diagrama del sistema solar.png", type: "image", subject: "Ciencia", size: "1.2 MB", date: "2026-07-10" },
]

const fileIcons: Record<string, typeof File> = { pdf: FileText, pptx: FileText, video: FileText, doc: File, image: Image }
const fileColors: Record<string, string> = { pdf: "text-red-400 bg-red-500/10", pptx: "text-orange-400 bg-orange-500/10", video: "text-blue-400 bg-blue-500/10", doc: "text-blue-400 bg-blue-500/10", image: "text-emerald-400 bg-emerald-500/10" }

export default function MaterialesPage() {
  const [materials] = React.useState<Material[]>(defaultMaterials)
  const [search, setSearch] = React.useState("")

  const filtered = materials.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.subject.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="w-full space-y-6 py-2">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--sb-on-surface)]">Materiales</h2>
        <SbBtn variant="filled" rounded className="flex items-center gap-2"><Upload className="h-4 w-4" /> Subir</SbBtn>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--sb-on-surface-variant)]/30" />
        <SbInput placeholder="Buscar materiales..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: "36px" }} />
      </div>

      <div className="bg-[var(--sb-surface-container)] rounded-2xl divide-y divide-[var(--sb-outline-variant)]/15">
        {filtered.map((m, i) => {
          const Icon = fileIcons[m.type] || File
          return (
            <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-4 px-5 py-4">
              <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${fileColors[m.type] || "bg-[var(--sb-surface-container-high)]"}`}><Icon className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-[var(--sb-on-surface)]/80 truncate">{m.name}</p><p className="text-xs text-[var(--sb-on-surface-variant)]/40">{m.subject} · {m.size}</p></div>
              <button className="p-2 rounded-xl hover:bg-[var(--sb-surface-container-high)] transition-colors shrink-0"><Download className="h-4 w-4 text-[var(--sb-on-surface-variant)]/40" /></button>
            </motion.div>
          )
        })}
        {!materials.length && <div className="px-5 py-10 text-center text-sm text-[var(--sb-on-surface-variant)]/30">Sin materiales</div>}
      </div>
    </div>
  )
}
