'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  Table,
  Info,
} from 'lucide-react'
import { SbBtn } from '@/components/ui/sb'

type CsvRow = string[]
type ColumnKey = 'first_name' | 'last_name' | 'document_number' | 'grade' | 'section'

const COLUMN_KEYS: ColumnKey[] = [
  'first_name',
  'last_name',
  'document_number',
  'grade',
  'section',
]

const COLUMN_LABELS: Record<ColumnKey, string> = {
  first_name: 'Nombres',
  last_name: 'Apellidos',
  document_number: 'DNI',
  grade: 'Grado',
  section: 'Sección',
}

const listItem = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, filter: 'blur(8px)', y: -10 },
}

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.05 * i, duration: 0.3 },
  }),
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split('\n')
  return lines
    .map((line) => {
      const cells: string[] = []
      let current = ''
      let inQuotes = false
      for (const ch of line) {
        if (ch === '"') {
          inQuotes = !inQuotes
        } else if (ch === ',' && !inQuotes) {
          cells.push(current.trim())
          current = ''
        } else {
          current += ch
        }
      }
      cells.push(current.trim())
      return cells
    })
    .filter((row) => row.some((cell) => cell.length > 0))
}

function buildSampleCsv(): string {
  const header = ['Nombres', 'Apellidos', 'DNI', 'Grado', 'Sección'].join(',')
  const rows = [
    ['Juan', 'Pérez García', '12345678', '5', 'A'],
    ['María', 'López Fernández', '87654321', '5', 'A'],
    ['Carlos', 'Martínez Ríos', '11223344', '6', 'B'],
  ]
  return [header, ...rows.map((r) => r.join(','))].join('\n')
}

export default function ImportarPage() {
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<CsvRow[]>([])
  const [headerRow, setHeaderRow] = useState<CsvRow>([])
  const [mapping, setMapping] = useState<Record<ColumnKey, number | null>>({
    first_name: null,
    last_name: null,
    document_number: null,
    grade: null,
    section: null,
  })
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ created: number; errors: string[] } | null>(null)
  const [globalError, setGlobalError] = useState<string | null>(null)
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

      setMapping({
        first_name: null,
        last_name: null,
        document_number: null,
        grade: null,
        section: null,
      })
    }
    reader.onerror = () => {
      setGlobalError('Error al leer el archivo.')
    }
    reader.readAsText(f)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const f = e.dataTransfer.files[0]
      if (f && f.name.endsWith('.csv')) {
        processFile(f)
      } else {
        setGlobalError('Solo se aceptan archivos CSV.')
      }
    },
    [processFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => setDragOver(false), [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      if (f) processFile(f)
    },
    [processFile],
  )

  const previewRows = rows.slice(0, 5)

  const handleMappingChange = (key: ColumnKey, colIndex: number | null) => {
    setMapping((prev) => ({ ...prev, [key]: colIndex }))
  }

  const allMapped = COLUMN_KEYS.every((k) => mapping[k] !== null)

  const handleImport = async () => {
    if (!file || !allMapped) return
    setLoading(true)
    setGlobalError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('mapping', JSON.stringify(mapping))

    try {
      const res = await fetch('/api/secretario/import', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error ?? `Error del servidor (${res.status})`)
      }
      const data = await res.json()
      setResult({ created: data.created, errors: data.errors ?? [] })
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : 'Error al importar.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadSample = () => {
    const blob = new Blob([buildSampleCsv()], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla_estudiantes.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const mappedCount = COLUMN_KEYS.filter((k) => mapping[k] !== null).length

  return (
    <div className="space-y-5">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Importar estudiantes</h1>
          <p className="text-sm text-sb-on-surface-variant/50 mt-1">Sube un archivo CSV con los datos de los estudiantes para importarlos masivamente.</p>
        </motion.div>

        {/* Instructions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
          <div className="bg-sb-surface rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-sb-on-surface-variant/40" />
              <span className="text-xs font-semibold text-sb-on-surface-variant/60 uppercase tracking-wider">Instrucciones</span>
            </div>
            <ul className="space-y-1.5 text-sm text-sb-on-surface-variant/60">
              <li className="flex items-start gap-2"><span className="text-sb-on-surface-variant/20 mt-1">•</span>El archivo debe tener extensión <strong className="text-sb-on-surface">.csv</strong> y usar codificación UTF-8.</li>
              <li className="flex items-start gap-2"><span className="text-sb-on-surface-variant/20 mt-1">•</span>La primera fila debe contener los nombres de las columnas.</li>
              <li className="flex items-start gap-2"><span className="text-sb-on-surface-variant/20 mt-1">•</span>Los campos entre comillas dobles pueden contener comas y saltos de línea.</li>
              <li className="flex items-start gap-2"><span className="text-sb-on-surface-variant/20 mt-1">•</span>Selecciona qué columna del archivo corresponde a cada campo del sistema.</li>
              <li className="flex items-start gap-2"><span className="text-sb-on-surface-variant/20 mt-1">•</span>Los estudiantes duplicados por DNI serán omitidos (reportados como error).</li>
            </ul>
          </div>
        </motion.div>

        {/* Upload Area */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
            className={`rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 border-2 border-dashed ${dragOver ? 'border-sb-on-surface bg-sb-surface-container' : 'border-sb-outline-variant/40 bg-sb-surface hover:bg-sb-surface-container-low/30'}`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <Upload
              size={36}
              className={`mx-auto mb-3 ${dragOver ? 'text-sb-on-surface' : 'text-sb-on-surface-variant/20'}`}
            />
            <div className="font-medium text-sb-on-surface text-sm">
              {file ? file.name : 'Arrastra tu archivo CSV aquí o haz clic para seleccionar'}
            </div>
            <div className="text-sb-on-surface-variant/30 text-xs mt-1">
              Solo archivos .csv
            </div>
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {globalError && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, filter: 'blur(8px)' }}
              className="mb-6 bg-red-500/8 rounded-xl p-3 px-4 flex items-center gap-2 text-red-600 text-sm"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{globalError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview + Mapping */}
        <AnimatePresence>
          {file && rows.length > 0 && (
            <>
              {/* Preview Header */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, filter: 'blur(8px)' }}
                className="mb-4 flex items-center gap-2"
              >
                <Table className="h-4 w-4 text-sb-on-surface-variant/40" />
                <span className="text-xs font-semibold text-sb-on-surface-variant/60 uppercase tracking-wider">
                  Vista previa ({rows.length} filas)
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sb-on-surface/8 text-sb-on-surface">
                  {headerRow.length} columnas
                </span>
              </motion.div>

              {/* Table */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, filter: 'blur(8px)' }}
                transition={{ delay: 0.05 }}
                className="mb-6 overflow-x-auto rounded-xl bg-sb-surface"
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-sb-outline-variant/20">
                      {headerRow.map((col, i) => (
                        <th key={i} className="px-4 py-2.5 text-left text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, ri) => (
                      <tr key={ri} className="border-b border-sb-outline-variant/10 last:border-0">
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-4 py-2 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis text-sb-on-surface/80 text-xs">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>

              {/* Mapping */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, filter: 'blur(8px)' }}
                transition={{ delay: 0.1 }}
                className="mb-6"
              >
                <div className="bg-sb-surface rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-sb-on-surface-variant/60 uppercase tracking-wider">Mapeo de columnas</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sb-on-surface/8 text-sb-on-surface">{mappedCount}/{COLUMN_KEYS.length}</span>
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
                    {COLUMN_KEYS.map((key) => (
                      <div key={key} className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">
                          {COLUMN_LABELS[key]}
                        </label>
                        <select
                          value={mapping[key] ?? ''}
                          onChange={(e) =>
                            handleMappingChange(key, e.target.value ? Number(e.target.value) : null)
                          }
                          className="sbf-native-select w-full"
                        >
                          <option value="">— Seleccionar —</option>
                          {headerRow.map((col, i) => (
                            <option key={i} value={i}>
                              {col}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, filter: 'blur(8px)' }}
                transition={{ delay: 0.15 }}
                className="flex gap-2 flex-wrap items-center"
              >
                <SbBtn
                  variant="filled"
                  rounded
                  onClick={handleImport}
                  disabled={!allMapped || loading}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {loading ? 'Importando…' : 'Importar'}
                </SbBtn>

                <SbBtn rounded onClick={handleDownloadSample} className="flex items-center gap-2">
                  <Download className="h-3.5 w-3.5" />
                  Descargar plantilla CSV
                </SbBtn>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, filter: 'blur(8px)' }}
              className="mt-8"
            >
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-sb-on-surface tracking-tight">Resultado de la importación</h2>
                <p className="text-xs text-sb-on-surface-variant/40 mt-0.5">Resumen del proceso de importación.</p>
              </div>

              <div className="flex gap-3 flex-wrap mb-4">
                <div className="bg-sb-surface rounded-2xl p-5 flex-1 min-w-[180px] text-center">
                  <CheckCircle className="h-7 w-7 mx-auto mb-2 text-emerald-500" />
                  <div className="text-2xl font-bold text-sb-on-surface">{result.created}</div>
                  <div className="text-xs text-sb-on-surface-variant/40">Creados</div>
                </div>
                <div className="bg-sb-surface rounded-2xl p-5 flex-1 min-w-[180px] text-center">
                  <AlertCircle className={`h-7 w-7 mx-auto mb-2 ${result.errors.length > 0 ? 'text-red-500' : 'text-sb-on-surface-variant/20'}`} />
                  <div className="text-2xl font-bold text-sb-on-surface">{result.errors.length}</div>
                  <div className="text-xs text-sb-on-surface-variant/40">Errores</div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="bg-sb-surface rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-xs font-semibold text-sb-on-surface-variant/60 uppercase tracking-wider">Lista de errores</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {result.errors.map((err, i) => (
                      <div key={i} className="px-3 py-2 rounded-lg text-red-600 text-xs bg-red-500/5">
                        {err}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  )
}
