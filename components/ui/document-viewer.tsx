"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Download, FileText, FileImage, File, Loader2, EyeOff } from "@/components/ui/proicons"

interface DocumentViewerProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  url?: string
  blob?: Blob | null
  fileType?: string
  fileName?: string
  downloadUrl?: string
  kind?: "pdf" | "docx" | "image" | "other"
}

function getKind(fileType: string, url?: string) {
  const t = (fileType || url?.split(".").pop() || "").toLowerCase()
  if (t.includes("pdf")) return "pdf"
  if (t.includes("docx") || t.includes("word") || t === "doc") return "docx"
  if (t.includes("image") || ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(t)) return "image"
  return "other"
}

const docxHtmlStyle = `
  .docx-preview, .docx-preview * { font-family: 'DM Sans', system-ui, sans-serif; color: var(--sb-on-surface) !important; border-color: var(--sb-outline-variant) !important; background-color: transparent; }
  .docx-preview { font-size: 14px; line-height: 1.7; }
  .docx-preview h1 { font-size: 20px; font-weight: 700; margin: 18px 0 10px; }
  .docx-preview h2 { font-size: 17px; font-weight: 700; margin: 16px 0 8px; }
  .docx-preview h3 { font-size: 15px; font-weight: 600; margin: 14px 0 6px; }
  .docx-preview p { margin: 8px 0; }
  .docx-preview table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  .docx-preview td, .docx-preview th { border: 1px solid var(--sb-outline-variant) !important; padding: 8px 10px; font-size: 13px; vertical-align: top; }
  .docx-preview th { background: var(--sb-surface-container) !important; font-weight: 600; }
  .docx-preview ul, .docx-preview ol { padding-left: 22px; margin: 8px 0; }
  .docx-preview li { margin: 4px 0; }
  .docx-preview strong { font-weight: 700; }
  .docx-preview a { text-decoration: underline; }
  .docx-preview img { max-width: 100%; height: auto; border-radius: 8px; }
`

export function DocumentViewer({
  open,
  onClose,
  title,
  subtitle,
  url,
  blob,
  fileType = "",
  fileName = "documento",
  downloadUrl,
  kind: kindOverride,
}: DocumentViewerProps) {
  const [html, setHtml] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(false)

  const kind = React.useMemo(() => kindOverride || getKind(fileType, url), [kindOverride, fileType, url])
  const [objectUrl, setObjectUrl] = React.useState<string>("")

  React.useEffect(() => {
    if (!open || !blob) { setObjectUrl(""); return }
    if (kind === "pdf" || kind === "image") {
      const obj = URL.createObjectURL(blob)
      setObjectUrl(obj)
      return () => URL.revokeObjectURL(obj)
    }
  }, [open, blob, kind])

  const load = async () => {
    if (!open) return
    setLoading(true)
    setError(false)
    setHtml("")
    try {
      if (kind === "docx") {
        const mammothMod: any = await import("mammoth")
        const mammoth = mammothMod.default || mammothMod
        const input = blob
          ? { arrayBuffer: await blob.arrayBuffer() }
          : { arrayBuffer: await (await fetch(url as string)).arrayBuffer() }
        const result = await mammoth.convertToHtml(input)
        setHtml(result.value || "")
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, url, blob, fileType, kind])

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, "_blank")
      return
    }
    if (blob) {
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = fileName
      a.click()
    } else if (url) {
      window.open(url, "_blank")
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[80] bg-black/40"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[80] sm:w-[720px] sm:max-w-[92vw] sm:h-[82vh] bg-sb-surface rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-sb-outline-variant/10 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-sb-surface-container flex items-center justify-center shrink-0">
                  {kind === "pdf" && <FileText className="h-4.5 w-4.5 text-red-500" />}
                  {kind === "docx" && <FileText className="h-4.5 w-4.5 text-blue-500" />}
                  {kind === "image" && <FileImage className="h-4.5 w-4.5 text-emerald-500" />}
                  {kind === "other" && <File className="h-4.5 w-4.5 text-sb-on-surface-variant/50" />}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-sb-on-surface truncate">{title || fileName}</h2>
                  {subtitle && <p className="text-[10px] text-sb-on-surface-variant/40 truncate">{subtitle}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleDownload}
                  className="h-8 w-8 flex items-center justify-center rounded-xl text-sb-on-surface-variant/40 hover:text-sb-on-surface hover:bg-sb-surface-container transition-colors"
                  title="Descargar"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={onClose}
                  className="h-8 w-8 flex items-center justify-center rounded-xl text-sb-on-surface-variant/40 hover:text-sb-on-surface hover:bg-sb-surface-container transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto min-h-0">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-6 w-6 text-sb-on-surface-variant/30 animate-spin" />
                  <p className="text-xs text-sb-on-surface-variant/40">Preparando vista previa...</p>
                </div>
              ) : error ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <EyeOff className="h-8 w-8 text-sb-on-surface-variant/20" />
                  <p className="text-sm text-sb-on-surface-variant/40">No se pudo previsualizar este archivo</p>
                  <p className="text-xs text-sb-on-surface-variant/30 max-w-xs">Puedes descargarlo para verlo en su aplicación original.</p>
                </div>
              ) : kind === "pdf" ? (
                <iframe src={url || objectUrl || undefined} className="w-full h-full" title={title || fileName} />
              ) : kind === "docx" ? (
                <div className="h-full overflow-y-auto p-6 sm:p-8 bg-sb-surface-container-low/40">
                  {html ? (
                    <>
                      <style>{docxHtmlStyle}</style>
                      <div className="max-w-[640px] mx-auto bg-sb-surface rounded-2xl p-6 sm:p-8 shadow-sm border border-sb-outline-variant/10">
                        <div className="docx-preview" dangerouslySetInnerHTML={{ __html: html }} />
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-sb-on-surface-variant/30">
                      Sin contenido para mostrar
                    </div>
                  )}
                </div>
              ) : kind === "image" ? (
                <div className="h-full flex items-center justify-center p-6 bg-sb-surface-container-low/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url || objectUrl} alt={title || fileName} className="max-w-full max-h-full object-contain rounded-xl shadow-sm" />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <File className="h-8 w-8 text-sb-on-surface-variant/20" />
                  <p className="text-sm text-sb-on-surface-variant/40">Este tipo de archivo no tiene vista previa</p>
                  <button
                    onClick={handleDownload}
                    className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sb-surface-container text-xs font-medium text-sb-on-surface hover:bg-sb-surface-container-high transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Descargar
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
