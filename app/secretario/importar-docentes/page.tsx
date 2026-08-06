'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, Download, CheckCircle, AlertCircle, Table, Info, Users, Copy, Check, Key, Mail,
} from "@/components/ui/proicons"
import { SbBtn } from '@/components/ui/sb'
import { useAuthStore } from '@/stores/auth-store'

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

const listItem = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, filter: 'blur(8px)', y: -10 },
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

export default function ImportarDocentesPage() {
  const institutionId = useAuthStore((s) => s.institutionId)
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<CsvRow[]>([])
  const [headerRow, setHeaderRow] = useState<CsvRow>([])
  const [mapping, setMapping] = useState<Record<ColumnKey, number | null>>({
    full_name: null, dni: null, phone: null, email: null,
    subject: null, level: null, contract_type: null, status: null,
  })
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ created: number; skipped: number; errors: string[]; credentials: Array<{ name: string; email: string; password: string }> } | null>(null)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback((f: File) => {
    setFile(f)
    setResult(null)
    setGlobalError(null)
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
      setMapping({ full_name: null, dni: null, phone: null, email: null, subject: null, level: null, contract_type: null, status: null })
    }
    reader.onerror = () => setGlobalError('Error al leer el archivo.')
    reader.readAsText(f)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f && f.name.endsWith('.csv')) processFile(f)
    else setGlobalError('Solo se aceptan archivos CSV.')
  }, [processFile])

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(true) }, [])
  const handleDragLeave = useCallback(() => setDragOver(false), [])
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) processFile(f) }, [processFile])

  const previewRows = rows.slice(0, 5)
  const handleMappingChange = (key: ColumnKey, colIndex: number | null) => setMapping(prev => ({ ...prev, [key]: colIndex }))
  const allMapped = mapping.full_name !== null

  const handleImport = async () => {
    if (!file || !allMapped) return
    setLoading(true)
    setGlobalError(null)
    setResult(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/dev/docentes/import', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) setResult(data)
      else setGlobalError(data.error || 'Error al importar.')
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

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Importar Docentes</h1>
        <p className="text-sm text-sb-on-surface-variant/50 mt-1">Sube un archivo CSV con los datos del personal para contratarlo masivamente.</p>
      </div>

      {/* Info */}
      <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-sb-primary" />
          <h3 className="text-sm font-semibold text-sb-on-surface">Formato del CSV</h3>
        </div>
        <ul className="space-y-2 text-sm text-sb-on-surface-variant/70">
          <li className="flex items-start gap-2"><span className="text-sb-on-surface-variant/20 mt-1">•</span><strong className="text-sb-on-surface">Nombre Completo</strong> es obligatorio. Los demás son opcionales.</li>
          <li className="flex items-start gap-2"><span className="text-sb-on-surface-variant/20 mt-1">•</span>Si el DNI ya existe, la fila se omitirá automáticamente.</li>
          <li className="flex items-start gap-2"><span className="text-sb-on-surface-variant/20 mt-1">•</span>Si no se proporciona email, se genera uno automáticamente.</li>
          <li className="flex items-start gap-2"><span className="text-sb-on-surface-variant/20 mt-1">•</span>Las contraseñas se generan automáticamente y se muestran al finalizar.</li>
        </ul>
      </div>

      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-sb-primary bg-sb-primary/5' : 'border-sb-outline-variant/20 hover:border-sb-outline-variant/40 bg-sb-surface'}`}
      >
        <input ref={inputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
        <Upload className="h-10 w-10 text-sb-on-surface-variant/20 mx-auto mb-3" />
        <p className="text-sm text-sb-on-surface-variant/60">{file ? file.name : 'Arrastra tu archivo CSV aquí o haz clic para seleccionar'}</p>
        <p className="text-xs text-sb-on-surface-variant/30 mt-1">Solo archivos .csv</p>
      </div>

      {globalError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-500">{globalError}</p>
        </div>
      )}

      {/* Mapping & Preview */}
      {headerRow.length > 0 && !result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-5">
            <h3 className="text-sm font-semibold text-sb-on-surface mb-4">Mapeo de columnas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {COLUMN_KEYS.map(key => (
                <div key={key} className="flex items-center gap-3">
                  <label className="text-xs text-sb-on-surface-variant/60 w-28 shrink-0">{COLUMN_LABELS[key]}{key === 'full_name' ? ' *' : ''}</label>
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

          {/* Preview */}
          {previewRows.length > 0 && (
            <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 overflow-hidden">
              <div className="px-5 py-3 border-b border-sb-outline-variant/10 flex items-center gap-2">
                <Table className="h-4 w-4 text-sb-on-surface-variant/40" />
                <h3 className="text-sm font-semibold text-sb-on-surface">Vista previa ({rows.length} filas)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-sb-outline-variant/10">
                      <th className="px-4 py-2 text-left text-sb-on-surface-variant/50 font-medium">#</th>
                      {headerRow.map((h, i) => <th key={i} className="px-4 py-2 text-left text-sb-on-surface-variant/50 font-medium">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-b border-sb-outline-variant/5">
                        <td className="px-4 py-2 text-sb-on-surface-variant/30">{i + 1}</td>
                        {row.map((cell, j) => <td key={j} className="px-4 py-2 text-sb-on-surface">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 5 && <p className="text-xs text-sb-on-surface-variant/40 text-center py-2">y {rows.length - 5} filas más...</p>}
            </div>
          )}

          <div className="flex items-center gap-3">
            <SbBtn variant="filled" rounded onClick={handleImport} disabled={loading || !allMapped}>
              {loading ? 'Importando…' : `Importar ${rows.length} docentes`}
            </SbBtn>
            <SbBtn rounded onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4 mr-1.5" /> Descargar plantilla
            </SbBtn>
          </div>
        </motion.div>
      )}

      {/* Result */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-sb-surface rounded-2xl border border-sb-outline-variant/10 p-5">
            <h2 className="text-sm font-semibold text-sb-on-surface tracking-tight mb-4">Resultado de la importación</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
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
              <div className="bg-red-500/10 rounded-xl p-4 mb-4">
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
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {result.credentials.map((cred, i) => (
                    <div key={i} className="bg-sb-surface rounded-lg p-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-sb-on-surface">{cred.name}</p>
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
          </div>

          <div className="flex gap-3">
            <SbBtn variant="filled" rounded onClick={() => { setResult(null); setFile(null); setRows([]); setHeaderRow([]) }}>
              Importar otro archivo
            </SbBtn>
            <SbBtn rounded onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4 mr-1.5" /> Descargar plantilla
            </SbBtn>
          </div>
        </motion.div>
      )}
    </div>
  )
}
