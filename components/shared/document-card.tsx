"use client"

import * as React from "react"
import { Download, Trash2, FileText, CheckCircle2, XCircle } from "@/components/ui/proicons"
import { motion } from "framer-motion"
import type { Document } from "@/types"

interface DocumentCardProps {
  document: Document
  search?: string
  onDownload?: (doc: Document) => void
  onDelete?: (doc: Document) => void
  onStatusChange?: (id: string, status: string) => void
  highlightMatch?: (text: string, query: string) => string
}

const statusConfig: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  pending: { label: "Pendiente", color: "text-amber-600", dot: "bg-amber-500", bg: "bg-amber-500/8" },
  approved: { label: "Aprobado", color: "text-emerald-600", dot: "bg-emerald-500", bg: "bg-emerald-500/8" },
  rejected: { label: "Rechazado", color: "text-red-600", dot: "bg-red-500", bg: "bg-red-500/8" },
  ready: { label: "Listo", color: "text-blue-600", dot: "bg-blue-500", bg: "bg-blue-500/8" },
}

export function DocumentCard({
  document,
  search = "",
  onDownload,
  onDelete,
  onStatusChange,
  highlightMatch,
}: DocumentCardProps) {
  const st = statusConfig[document.status] || statusConfig.pending

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
          <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${st.bg}`}>
            <FileText className={`h-5 w-5 ${st.color}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-sb-on-surface leading-tight">{renderText(document.type)}</p>
            {document.student_name && (
              <p className="text-xs text-sb-on-surface-variant/50 flex items-center gap-1.5 mt-1">
                <span className="w-1 h-1 rounded-full bg-sb-on-surface-variant/20" />
                {renderText(document.student_name)}
              </p>
            )}
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${st.color} ${st.bg}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
          {st.label}
        </span>
      </div>

      <p className="text-[11px] text-sb-on-surface-variant/40 flex items-center gap-1.5 mb-4">
        <span className="w-1 h-1 rounded-full bg-sb-on-surface-variant/20" />
        {new Date(document.created_at).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
      </p>

      <div className="flex items-center gap-2 pt-3 border-t border-sb-outline-variant/10">
        {onDownload && (
          <button
            onClick={() => onDownload(document)}
            className="h-9 w-9 flex items-center justify-center rounded-xl text-sb-on-surface-variant/30 hover:text-sb-on-surface hover:bg-sb-surface-container transition-all duration-200"
            title="Descargar PDF"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        )}

        {onStatusChange && document.status === "pending" && (
          <>
            <button
              onClick={() => onStatusChange(document.id, "approved")}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium h-9 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 transition-all duration-200"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Aprobar
            </button>
            <button
              onClick={() => onStatusChange(document.id, "rejected")}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium h-9 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/15 transition-all duration-200"
            >
              <XCircle className="h-3.5 w-3.5" />
              Rechazar
            </button>
          </>
        )}

        {onStatusChange && document.status === "approved" && (
          <button
            onClick={() => onStatusChange(document.id, "ready")}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium h-9 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/15 transition-all duration-200"
          >
            <Download className="h-3.5 w-3.5" />
            Marcar listo
          </button>
        )}

        {document.status === "ready" && (
          <div className="flex-1 text-center text-[11px] text-sb-on-surface-variant/40">
            Listo para entregar
          </div>
        )}

        {onDelete && (
          <button
            onClick={() => onDelete(document)}
            className="h-9 w-9 flex items-center justify-center rounded-xl text-sb-on-surface-variant/30 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  )
}
