"use client"

import * as React from "react"
import { Download, Trash2, FileText } from "lucide-react"
import { motion } from "framer-motion"
import type { Certificate } from "@/types"

interface CertificateCardProps {
  certificate: Certificate
  search?: string
  onDownload?: (cert: Certificate) => void
  onDelete?: (id: string) => void
  highlightMatch?: (text: string, query: string) => string
}

const statusConfig: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  emitido: { label: "Emitido", color: "text-emerald-600", dot: "bg-emerald-500", bg: "bg-emerald-500/8" },
  pendiente: { label: "Pendiente", color: "text-amber-600", dot: "bg-amber-500", bg: "bg-amber-500/8" },
  anulado: { label: "Anulado", color: "text-red-600", dot: "bg-red-500", bg: "bg-red-500/8" },
}

export function CertificateCard({
  certificate,
  search = "",
  onDownload,
  onDelete,
  highlightMatch,
}: CertificateCardProps) {
  const st = statusConfig[certificate.status] || statusConfig.pendiente
  const displayName = certificate.student_full_name || certificate.student_name

  const renderText = (text: string) => {
    if (highlightMatch && search) {
      return <span dangerouslySetInnerHTML={{ __html: highlightMatch(text, search) }} />
    }
    return text
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, filter: "blur(8px)", y: -10 }}
      className="bg-sb-surface rounded-2xl p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sb-surface-container flex items-center justify-center">
            <span className="text-[11px] font-semibold text-sb-on-surface-variant/50">
              {displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-sb-on-surface">{renderText(displayName)}</p>
            <p className="text-xs text-sb-on-surface-variant/40">{renderText(certificate.type)}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${st.color} ${st.bg}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
          {st.label}
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-sb-outline-variant/10">
        <span className="text-[11px] text-sb-on-surface-variant/40">
          {certificate.issue_date
            ? new Date(certificate.issue_date).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })
            : "—"}
        </span>
        <div className="flex items-center gap-1">
          {certificate.file_url ? (
            <a
              href={certificate.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-sb-on-surface-variant/40 hover:text-sb-on-surface hover:bg-sb-surface-container transition-colors"
            >
              <Download className="h-4 w-4" />
            </a>
          ) : onDownload ? (
            <button
              onClick={() => onDownload(certificate)}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-sb-on-surface-variant/40 hover:text-sb-on-surface hover:bg-sb-surface-container transition-colors"
              title="Descargar PDF"
            >
              <Download className="h-4 w-4" />
            </button>
          ) : null}
          {onDelete && (
            <button
              onClick={() => onDelete(certificate.id)}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-sb-on-surface-variant/30 hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
