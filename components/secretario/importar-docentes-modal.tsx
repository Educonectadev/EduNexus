'use client'

import { useRef, useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Upload, Download, CheckCircle, AlertCircle, Table, Info, Key, Copy, Check, Users,
} from "@/components/ui/proicons"
import { SbModal, SbModalBody, SbModalHeader, SbBtn } from '@/components/ui/sb'

type CsvRow = string[]
type ColumnKey = 'full_name' | 'dni' | 'phone' | 'email' | 'subject' | 'level' | 'contract_type' | 'status'

const COLUMN_KEYS: ColumnKey[] = ['full_name', 'dni', 'phone', 'email', 'subject', 'level', 'contract_type', 'status']

const COLUMN_LABELS: Record<ColumnKey, string> = {
  full_name: 'Nombre Completo',
  dni: 'DNI',
  phone: 'Teléfono',
  email: 'Email',
  subject: 'Especialidad',
  level: 'Nivel',
  contract_type: 'Tipo Contrato',
  status: 'Estado',
}

function parseCsv(text: string): CsvRow[] {
  const lines: CsvRow[] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += ch
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === ',') { current.push(field.trim()); field = '' }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++
        current.push(field.trim())
        if (current.some(f => f !== '')) lines.push(current)
        current = []
        field = ''
      } else field += ch
    }
  }
  current.push(field.trim())
  if (current.some(f => f !== '')) lines.push(current)
  return lines
}

function buildSampleCsv(): string {
  const header = COLUMN_KEYS.map(k => COLUMN_LABELS[k]).join(',')
  const rows = [
    ['Juan Carlos Pérez López', '70123456', '987654321', '', 'Matemáticas', 'secundaria', 'nombrado', 'active'],
    ['María Ana García Torres', '70234567', '976543210', '', 'Lenguaje', 'primaria', 'contratado', 'active'],
  ]
  return [header, ...rows.map(r => r.join(','))].join('\n')
}

const EMPTY_MAPPING: Record<ColumnKey, number | null> = {
  full_name: null, dni: null, phone: null, email: null,
  subject: null, level: null, contract_type: null, status: null,
}

export default function ImportarDocentesModal({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported?: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<CsvRow[]>([])
  const [headerRow, setHeaderRow] = useState<CsvRow>([])
  const [mapping, setMapping] = useState<Record<ColumnKey, number | null>>(EMPTY_MAPPING)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ created: number; skipped: number; errors: string[]; credentials: Array<{ name: string; email: string; password: string }> } | null>(null)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setFile(null); setRows([]); setHeaderRow([]); setMapping(EMPTY_MAPPING); setResult(null); setGlobalError(null)
  }

  const handleClose = () => { reset(); onClose() }

  const processFile = useCallback((f: File) => {
    setFile(f); setResult(null); setGlobalError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsed = parseCsv(text)
      if (parsed.length < 2) {
        setGlobalError('El archivo CSV debe tener al menos una fila de encabezado y una fila de datos.')
        return
      }
      const [header, ...dataRows] = parsed
      setHeaderRow(header)
      setRows(dataRows)
      // Auto-detect column mapping by header name (fast import, no manual steps)
      const findCol = (keys: string[]) => {
        const hit = header.findIndex(h => {
          const hl = h.trim().toLowerCase()
          return keys.some(k => hl.includes(k))
        })
        return hit === -1 ? null : hit
      }
      setMapping({
        full_name: findCol(['nombre', 'name', 'full']),
        dni: findCol(['dni', 'documento']),
        phone: findCol(['teléfono', 'telefono', 'phone']),
        email: findCol(['email', 'correo']),
        subject: findCol(['especialidad', 'asignatura', 'subject']),
        level: findCol(['nivel', 'level']),
        contract_type: findCol(['contrato', 'contract']),
        status: findCol(['estado', 'status']),
      })
    }
    reader.onerror = () => setGlobalError('Error al leer el archivo.')
    reader.readAsText(f)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f && f.name.endsWith('.csv')) processFile(f)
    else setGlobalError('Solo se aceptan archivos CSV.')
  }, [processFile])

  const handleMappingChange = (key: ColumnKey, colIndex: number | null) => setMapping(prev => ({ ...prev, [key]: colIndex }))
  const allMapped = mapping.full_name !== null

  const handleImport = async () => {
    if (!file || !allMapped) return
    setLoading(true); setGlobalError(null); setResult(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/secretario/docentes/import', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        setResult(data)
        onImported?.()
      } else setGlobalError(data.error || 'Error al importar.')
    } catch (err) { setGlobalError(err instanceof Error ? err.message : 'Error al importar.') }
    finally { setLoading(false) }
  }

  const handleDownloadTemplate = () => {
    const blob = new Blob([buildSampleCsv()], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'plantilla_docentes.csv'
    a.click()
  }

  const handleCopy = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }

  const previewRows = rows.slice(0, 5)

  return (
    <SbModal open={open} onClose={handleClose} maxWidth="640px">
      <SbModalBody noPadding className="max-h-[85vh] overflow-y-auto">
        <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4">
          <h3 className="text-lg font-semibold text-sb-on-surface">Importar Personal</h3>
          <p className="text-xs text-sb-on-surface-variant/50 mt-1">Sube un archivo CSV para contratar docentes o secretarios masivamente.</p>
        </div>
        <div className="px-4 sm:px-6 space-y-4 pb-2">
          <div className="bg-sb-surface rounded-xl border border-sb-outline-variant/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-sb-primary" />
              <h4 className="text-xs font-semibold text-sb-on-surface">Formato del CSV</h4>
            </div>
            <ul className="space-y-1 text-xs text-sb-on-surface-variant/60">
              <li className="flex items-start gap-2"><span className="text-sb-on-surface-variant/20 mt-0.5">•</span><strong className="text-sb-on-surface">Nombre Completo</strong> es obligatorio. Los demás son opcionales.</li>
              <li className="flex items-start gap-2"><span className="text-sb-on-surface-variant/20 mt-0.5">•</span>Si el DNI ya existe, la fila se omitirá.</li>
              <li className="flex items-start gap-2"><span className="text-sb-on-surface-variant/20 mt-0.5">•</span>Las contraseñas se generan automáticamente.</li>
            </ul>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => inputRef.current?.click()}
            className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-sb-primary bg-sb-primary/5' : 'border-sb-outline-variant/20 hover:border-sb-outline-variant/40 bg-sb-surface'}`}
          >
            <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f) }} />
            <Upload className="h-10 w-10 text-sb-on-surface-variant/20 mx-auto mb-3" />
            <p className="text-sm text-sb-on-surface-variant/60">{file ? file.name : 'Arrastra tu archivo CSV aquí o haz clic para seleccionar'}</p>
            <p className="text-xs text-sb-on-surface-variant/30 mt-1">Solo archivos .csv</p>
          </div>

          {globalError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 px-4 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-500">{globalError}</p>
            </div>
          )}

          {headerRow.length > 0 && !result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="bg-sb-surface rounded-xl border border-sb-outline-variant/10 p-4">
                <h4 className="text-xs font-semibold text-sb-on-surface mb-1">Mapeo de columnas</h4>
                <p className="text-[11px] text-sb-on-surface-variant/50 mb-3">
                  {mapping.full_name !== null
                    ? "Detectadas automáticamente. Ajusta solo si es necesario."
                    : "Selecciona la columna de nombre para importar."}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {COLUMN_KEYS.map(key => (
                    <div key={key} className="flex items-center gap-3">
                      <label className="text-xs text-sb-on-surface-variant/60 w-24 sm:w-28 shrink-0">{COLUMN_LABELS[key]}{key === 'full_name' ? ' *' : ''}</label>
                      <select
                        className="sbf-native-select flex-1"
                        value={mapping[key] ?? ''}
                        onChange={e => handleMappingChange(key, e.target.value === '' ? null : parseInt(e.target.value))}
                      >
                        <option value="">No mapear</option>
                        {headerRow.map((h, i) => <option key={i} value={i}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {previewRows.length > 0 && (
                <div className="bg-sb-surface rounded-xl border border-sb-outline-variant/10 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-sb-outline-variant/10 flex items-center gap-2">
                    <Table className="h-3.5 w-3.5 text-sb-on-surface-variant/40" />
                    <h4 className="text-xs font-semibold text-sb-on-surface">Vista previa ({rows.length} filas)</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-sb-outline-variant/10">
                          <th className="px-3 py-2 text-left text-sb-on-surface-variant/50 font-medium">#</th>
                          {headerRow.map((h, i) => <th key={i} className="px-3 py-2 text-left text-sb-on-surface-variant/50 font-medium">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, i) => (
                          <tr key={i} className="border-b border-sb-outline-variant/5">
                            <td className="px-3 py-2 text-sb-on-surface-variant/30">{i + 1}</td>
                            {row.map((cell, j) => <td key={j} className="px-3 py-2 text-sb-on-surface">{cell}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {rows.length > 5 && <p className="text-xs text-sb-on-surface-variant/40 text-center py-2">y {rows.length - 5} filas más...</p>}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <SbBtn variant="filled" rounded onClick={handleImport} disabled={loading || !allMapped} className="w-full sm:w-auto">
                  {loading ? 'Importando…' : `Importar ${rows.length} personas`}
                </SbBtn>
                <SbBtn rounded onClick={handleDownloadTemplate} className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-1.5" /> Descargar plantilla
                </SbBtn>
              </div>
            </motion.div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/10 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-emerald-500">{result.created}</p>
                  <p className="text-xs text-emerald-500/70 mt-1">Importados</p>
                </div>
                <div className="bg-amber-500/10 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-amber-500">{result.skipped}</p>
                  <p className="text-xs text-amber-500/70 mt-1">Omitidos</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="bg-red-500/10 rounded-xl p-3">
                  <p className="text-xs font-medium text-red-500 mb-2">Errores:</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.map((err, i) => <p key={i} className="text-[11px] text-red-500/70">{err}</p>)}
                  </div>
                </div>
              )}

              {result.credentials.length > 0 && (
                <div className="bg-sb-surface-container-high rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Key className="h-4 w-4 text-sb-primary" />
                    <p className="text-xs font-medium text-sb-on-surface">Credenciales generadas</p>
                  </div>
                  <p className="text-[11px] text-sb-on-surface/50 mb-3">Guarda estas credenciales. Las contraseñas no se vuelven a mostrar.</p>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {result.credentials.map((cred, i) => (
                      <div key={i} className="bg-sb-surface rounded-lg p-2.5 flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-sb-on-surface truncate">{cred.name}</p>
                          <p className="text-[11px] text-sb-on-surface/50 font-mono">{cred.email}</p>
                          <p className="text-[11px] text-sb-on-surface/50 font-mono">{cred.password}</p>
                        </div>
                        <button onClick={() => handleCopy(`${cred.email}\n${cred.password}`)} className="p-1.5 rounded-lg hover:bg-sb-surface-container-high transition-colors shrink-0">
                          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-sb-on-surface-variant/50" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <SbBtn variant="filled" rounded onClick={() => { reset() }}>
                <Upload className="h-4 w-4 mr-1.5" /> Importar otro archivo
              </SbBtn>
            </div>
          )}
        </div>
      </SbModalBody>
      <div className="px-4 sm:px-6 py-4 flex items-center gap-2 border-t border-sb-outline-variant/10">
        <SbBtn rounded onClick={handleClose}>Cerrar</SbBtn>
        <div className="flex-1" />
        <SbBtn rounded onClick={handleDownloadTemplate} className="flex items-center gap-2">
          <Download className="h-3.5 w-3.5" /> Plantilla
        </SbBtn>
      </div>
    </SbModal>
  )
}
