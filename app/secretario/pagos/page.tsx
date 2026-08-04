"use client"

import * as React from "react"
import {
  DollarSign, CreditCard, TrendingDown, AlertCircle, CheckCircle,
  Clock, Search, Plus, Trash2, Edit3, Save, User, BookOpen,
  Calendar, Settings2, X, Command, Landmark, Smartphone, Coins, ArrowLeftRight,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { SbBtn, SbBadge, SbInput, SbSelect, SbModal, SbModalBody, SbModalHeader, SbModalFooter, useToast } from "@/components/ui/sb"

type PaymentStatus = "pending" | "paid" | "overdue" | "partial"
type ConceptType = "monthly" | "one_time"

interface Payment {
  id: string; student_id: string; student_name: string; student_grade: string;
  concept_id: string; concept_name: string; amount: number; paid_amount: number;
  balance: number; due_date: string; status: PaymentStatus; paid_date?: string;
  reference?: string; created_at: string; updated_at: string;
}

interface PaymentConcept { id: string; name: string; amount: number; type: ConceptType; is_active: boolean }
interface SearchResult { id: string; full_name: string; grade: string; section: string }

type MethodType = "efectivo" | "deposito" | "transferencia" | "yape" | "plin" | "otro"
interface PaymentMethod {
  id: string; type: MethodType; name: string; bank_name?: string;
  account_number?: string; account_holder?: string; phone?: string; details?: string; is_active: number;
}

const methodConfig: Record<MethodType, { icon: typeof Landmark; label: string; color: string; bg: string }> = {
  efectivo: { icon: Coins, label: "Efectivo", color: "text-emerald-600", bg: "bg-emerald-500/10" },
  deposito: { icon: Landmark, label: "Depósito bancario", color: "text-blue-600", bg: "bg-blue-500/10" },
  transferencia: { icon: ArrowLeftRight, label: "Transferencia", color: "text-cyan-600", bg: "bg-cyan-500/10" },
  yape: { icon: Smartphone, label: "Yape", color: "text-purple-600", bg: "bg-purple-500/10" },
  plin: { icon: Smartphone, label: "Plin", color: "text-pink-600", bg: "bg-pink-500/10" },
  otro: { icon: CreditCard, label: "Otro", color: "text-sb-on-surface-variant/60", bg: "bg-sb-on-surface/8" },
}
interface PaymentsResponse {
  payments: Payment[]; summary: {
    pending: { count: number; total: number }; paid: { count: number; total: number };
    overdue: { count: number; total: number }; partial: { count: number; total: number };
  }; total_debt: number
}

const statusConfig: Record<PaymentStatus, { label: string; color: string; dot: string }> = {
  pending: { label: "Pendiente", color: "bg-amber-500/10 text-amber-600", dot: "bg-amber-500" },
  paid: { label: "Pagado", color: "bg-emerald-500/10 text-emerald-600", dot: "bg-emerald-500" },
  overdue: { label: "Vencido", color: "bg-red-500/10 text-red-600", dot: "bg-red-500" },
  partial: { label: "Parcial", color: "bg-blue-500/10 text-blue-600", dot: "bg-blue-500" },
}

function fmt(n: number | string) { return "S/ " + Number(n || 0).toFixed(2) }

function parseDate(dateStr: string) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

function formatDate(dateStr: string) {
  const d = parseDate(dateStr)
  if (!d) return "—"
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })
}

function isOverdue(dueDate: string, status: PaymentStatus) {
  if (status === "paid") return false
  const d = parseDate(dueDate)
  if (!d) return false
  return d < new Date(new Date().toDateString())
}

function getEffectiveStatus(p: Payment): PaymentStatus {
  if (p.status === "paid") return "paid"
  if (p.status === "partial") return "partial"
  if (isOverdue(p.due_date, p.status)) return "overdue"
  return "pending"
}

const staggerItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
}

const listItem = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, filter: "blur(8px)", y: -10 },
}

export default function PagosPage() {
  const { toast } = useToast()
  const [payments, setPayments] = React.useState<Payment[]>([])
  const [concepts, setConcepts] = React.useState<PaymentConcept[]>([])
  const [summary, setSummary] = React.useState<PaymentsResponse["summary"]>({
    pending: { count: 0, total: 0 }, paid: { count: 0, total: 0 },
    overdue: { count: 0, total: 0 }, partial: { count: 0, total: 0 },
  })
  const [totalDebt, setTotalDebt] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

  const [activeTab, setActiveTab] = React.useState("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchInput, setSearchInput] = React.useState("")
  const [gradeFilter, setGradeFilter] = React.useState("")
  const [isFocused, setIsFocused] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const debounceRef = React.useRef<NodeJS.Timeout | undefined>(undefined)

  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null)
  const [detailModal, setDetailModal] = React.useState(false)
  const [registerModal, setRegisterModal] = React.useState(false)
  const [debtModal, setDebtModal] = React.useState(false)
  const [conceptModal, setConceptModal] = React.useState(false)
  const [methodModal, setMethodModal] = React.useState(false)
  const [methods, setMethods] = React.useState<PaymentMethod[]>([])

  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([])
  const [searching, setSearching] = React.useState(false)
  const [studentSearch, setStudentSearch] = React.useState("")

  const [grades, setGrades] = React.useState<string[]>([])

  const fetchPayments = React.useCallback(async () => {
    try {
      const res = await fetch("/api/secretario/payments")
      if (!res.ok) throw new Error("Error al cargar pagos")
      const data: PaymentsResponse = await res.json()
      setPayments(data.payments)
      setSummary(data.summary)
      setTotalDebt(data.total_debt)
      const gs = [...new Set(data.payments.map(p => p.student_grade).filter(Boolean))].sort()
      setGrades(gs)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido")
    } finally { setLoading(false) }
  }, [])

  const fetchConcepts = React.useCallback(async () => {
    try {
      const res = await fetch("/api/secretario/payment-concepts")
      if (res.ok) setConcepts(await res.json())
    } catch {}
  }, [])

  const fetchMethods = React.useCallback(async () => {
    try {
      const res = await fetch("/api/secretario/payment-methods")
      if (res.ok) setMethods(await res.json())
    } catch {}
  }, [])

  React.useEffect(() => { fetchPayments(); fetchConcepts(); fetchMethods() }, [fetchPayments, fetchConcepts, fetchMethods])

  // Keyboard shortcut: Ctrl/Cmd + K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  React.useEffect(() => () => clearTimeout(debounceRef.current), [])

  const onSearchChange = (val: string) => {
    setSearchInput(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearchQuery(val), 300)
  }

  const clearSearch = () => { setSearchInput(""); setSearchQuery("") }

  const filteredPayments = React.useMemo(() => {
    let list = payments
    if (activeTab === "pending") list = list.filter(p => getEffectiveStatus(p) === "pending")
    else if (activeTab === "paid") list = list.filter(p => p.status === "paid")
    else if (activeTab === "overdue") list = list.filter(p => getEffectiveStatus(p) === "overdue")
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(p => p.student_name.toLowerCase().includes(q))
    }
    if (gradeFilter) list = list.filter(p => p.student_grade === gradeFilter)
    return list
  }, [payments, activeTab, searchQuery, gradeFilter])

  const totalRecaudado = summary?.paid?.total || 0
  const pendingCount = (summary?.pending?.count || 0) + (summary?.overdue?.count || 0) + (summary?.partial?.count || 0)

  const handleSearchStudent = async (q: string) => {
    setStudentSearch(q)
    if (q.trim().length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/secretario/busqueda?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(Array.isArray(data) ? data : data.students || [])
      }
    } catch {} finally { setSearching(false) }
  }

  const handleRegisterPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body = {
      student_id: form.get("student_id") as string,
      concept_id: form.get("concept_id") as string,
      amount: parseFloat(form.get("amount") as string),
      paid_amount: parseFloat(form.get("paid_amount") as string) || 0,
      due_date: form.get("due_date") as string,
      status: (form.get("status") as PaymentStatus) || "pending",
    }
    try {
      const res = await fetch("/api/secretario/payments", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Error al registrar pago")
      toast("Pago registrado correctamente", "success")
      setRegisterModal(false)
      fetchPayments()
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error al registrar", "error")
    }
  }

  const handleGenerateDebt = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const conceptId = form.get("concept_id") as string
    const studentIds = (form.get("student_ids") as string || "").split(",").filter(Boolean)
    const dueDate = form.get("due_date") as string
    if (!conceptId || studentIds.length === 0 || !dueDate) {
      toast("Completa todos los campos", "warning"); return
    }
    const concept = concepts.find(c => c.id === conceptId)
    if (!concept) { toast("Concepto no encontrado", "error"); return }
    try {
      const results = await Promise.all(
        studentIds.map(student_id =>
          fetch("/api/secretario/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              student_id, concept_id: conceptId, amount: concept.amount,
              paid_amount: 0, due_date: dueDate, status: "pending",
            }),
          })
        )
      )
      const ok = results.filter(r => r.ok).length
      toast(`${ok} deudas generadas correctamente`, "success")
      setDebtModal(false)
      fetchPayments()
    } catch {
      toast("Error al generar deudas", "error")
    }
  }

  const handleUpdatePayment = async (paymentId: string, data: Partial<Payment>) => {
    try {
      const res = await fetch(`/api/secretario/payments/${paymentId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Error al actualizar pago")
      toast("Pago actualizado correctamente", "success")
      setDetailModal(false)
      fetchPayments()
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error al actualizar", "error")
    }
  }

  const handleSaveConcept = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const editingId = form.get("editing_id") as string
    const body = {
      name: form.get("name") as string,
      amount: parseFloat(form.get("amount") as string),
      type: form.get("type") as ConceptType,
    }
    try {
      const url = editingId
        ? `/api/secretario/payment-concepts?id=${editingId}`
        : "/api/secretario/payment-concepts"
      const method = editingId ? "PUT" : "POST"
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: editingId ? JSON.stringify({ ...body, is_active: true }) : JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Error al guardar concepto")
      toast(editingId ? "Concepto actualizado" : "Concepto creado", "success")
      setConceptModal(false)
      fetchConcepts()
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error al guardar", "error")
    }
  }

  const handleDeleteConcept = async (id: string) => {
    if (!confirm("¿Eliminar este concepto?")) return
    try {
      const res = await fetch(`/api/secretario/payment-concepts?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar concepto")
      toast("Concepto eliminado", "success")
      fetchConcepts()
    } catch {
      toast("Error al eliminar concepto", "error")
    }
  }

  const handleSaveMethod = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const editingId = form.get("method_editing_id") as string
    const body = {
      type: form.get("method_type") as MethodType,
      name: form.get("method_name") as string,
      bank_name: (form.get("method_bank") as string) || undefined,
      account_number: (form.get("method_account") as string) || undefined,
      account_holder: (form.get("method_holder") as string) || undefined,
      phone: (form.get("method_phone") as string) || undefined,
      details: (form.get("method_details") as string) || undefined,
    }
    if (!body.type || !body.name.trim()) { toast("Completa tipo y nombre", "warning"); return }
    try {
      const url = editingId
        ? `/api/secretario/payment-methods/${editingId}`
        : "/api/secretario/payment-methods"
      const method = editingId ? "PUT" : "POST"
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Error al guardar método")
      toast(editingId ? "Método actualizado" : "Método de pago creado", "success")
      setMethodModal(false)
      fetchMethods()
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error al guardar", "error")
    }
  }

  const handleToggleMethod = async (m: PaymentMethod) => {
    try {
      const res = await fetch(`/api/secretario/payment-methods/${m.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: m.is_active ? 0 : 1 }),
      })
      if (!res.ok) throw new Error("Error al actualizar método")
      fetchMethods()
    } catch {
      toast("Error al actualizar método", "error")
    }
  }

  const handleDeleteMethod = async (id: string) => {
    if (!confirm("¿Eliminar este método de pago?")) return
    try {
      const res = await fetch(`/api/secretario/payment-methods/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar método")
      toast("Método eliminado", "success")
      fetchMethods()
    } catch {
      toast("Error al eliminar método", "error")
    }
  }

  const tabs = [
    { id: "all", label: "Todos", count: payments.length },
    { id: "pending", label: "Pendientes", count: pendingCount },
    { id: "paid", label: "Pagados", count: summary?.paid?.count || 0 },
    { id: "overdue", label: "Vencidos", count: summary?.overdue?.count || 0 },
  ]

  return (
    <div className="space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-sb-on-surface tracking-tight">Pagos / Colegiatura</h1>
            <p className="text-sm text-sb-on-surface-variant/50 mt-1">Administra pagos, deudas y conceptos de cobro</p>
          </div>
          <div className="flex items-center gap-2 min-w-0 max-w-full overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <SbBtn rounded className="flex items-center gap-1.5 whitespace-nowrap shrink-0 px-3! py-2! text-xs! sm:px-4! sm:text-sm" onClick={() => setConceptModal(true)}>
              <Settings2 className="h-3.5 w-3.5 shrink-0" />
              Conceptos
            </SbBtn>
            <SbBtn rounded className="flex items-center gap-1.5 whitespace-nowrap shrink-0 px-3! py-2! text-xs! sm:px-4! sm:text-sm" onClick={() => setMethodModal(true)}>
              <CreditCard className="h-3.5 w-3.5 shrink-0" />
              Métodos de pago
            </SbBtn>
            <SbBtn rounded className="flex items-center gap-1.5 whitespace-nowrap shrink-0 px-3! py-2! text-xs! sm:px-4! sm:text-sm" onClick={() => setDebtModal(true)}>
              <TrendingDown className="h-3.5 w-3.5 shrink-0" />
              Generar deuda
            </SbBtn>
            <SbBtn variant="filled" rounded className="flex items-center gap-1.5 whitespace-nowrap shrink-0 px-3! py-2! text-xs! sm:px-4! sm:text-sm" onClick={() => setRegisterModal(true)}>
              <Plus className="h-3.5 w-3.5 shrink-0" />
              Registrar pago
            </SbBtn>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
        >
          {[
            { label: "Total recaudado", value: fmt(totalRecaudado), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-500/8" },
            { label: "Deuda total", value: fmt(totalDebt), icon: TrendingDown, color: "text-red-600", bg: "bg-red-500/8" },
            { label: "Pendientes", value: pendingCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-500/8" },
            { label: "Pagados", value: summary?.paid?.count || 0, icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-500/8" },
          ].map((s) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.label}
                variants={staggerItem}
                className="bg-sb-surface rounded-2xl p-4"
              >
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-3 ${s.bg}`}>
                  <Icon className={`h-4.5 w-4.5 ${s.color}`} />
                </div>
                <p className="text-xl font-bold tracking-tight text-sb-on-surface">{s.value}</p>
                <p className="text-[11px] text-sb-on-surface-variant/45 mt-0.5">{s.label}</p>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Search Bar - Premium */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <div className={`bg-sb-surface rounded-2xl transition-all duration-300 ${isFocused ? 'ring-2 ring-sb-on-surface/10 shadow-lg shadow-sb-on-surface/5' : ''}`}>
            <div className="flex items-center gap-2 p-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sb-on-surface-variant/30" />
                <input
                  ref={inputRef}
                  placeholder="Buscar por nombre del estudiante..."
                  value={searchInput}
                  onChange={e => onSearchChange(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="w-full h-12 pl-12 pr-20 bg-transparent text-sm text-sb-on-surface placeholder:text-sb-on-surface-variant/30 focus:outline-none"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {searchInput && (
                    <button onClick={clearSearch} className="h-7 w-7 flex items-center justify-center rounded-lg text-sb-on-surface-variant/30 hover:text-sb-on-surface-variant hover:bg-sb-surface-container transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-sb-surface-container/50 text-sb-on-surface-variant/30">
                    <Command className="h-3 w-3" />
                    <span className="text-[10px] font-medium">K</span>
                  </div>
                </div>
              </div>
              {grades.length > 0 && (
                <select
                  value={gradeFilter}
                  onChange={e => setGradeFilter(e.target.value)}
                  className="sbf-native-select"
                >
                  <option value="">Todos los grados</option>
                  {grades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tabs + Results Count */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6"
        >
          <div className="flex gap-1 p-1 bg-sb-surface rounded-xl min-w-0 max-w-full overflow-x-auto sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? "bg-sb-on-surface text-sb-surface"
                    : "text-sb-on-surface-variant/60 hover:bg-sb-surface-container"
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 text-[10px] ${activeTab === tab.id ? "text-sb-surface/60" : "text-sb-on-surface-variant/30"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {(searchQuery || gradeFilter) && !loading && (
              <p className="text-xs text-sb-on-surface-variant/40">
                {filteredPayments.length} resultado{filteredPayments.length !== 1 ? "s" : ""}
                {searchQuery && <> para "<span className="text-sb-on-surface font-medium">{searchQuery}</span>"</>}
              </p>
            )}
            {(searchQuery || gradeFilter) && (
              <button onClick={() => { clearSearch(); setGradeFilter("") }} className="text-[10px] text-sb-on-surface-variant/30 hover:text-sb-on-surface-variant/60 transition-colors">
                Limpiar
              </button>
            )}
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          {loading ? (
            <div className="bg-sb-surface rounded-2xl h-64 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full border-2 border-sb-on-surface/20 border-t-sb-on-surface animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-sb-surface rounded-2xl h-32 flex items-center justify-center">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="bg-sb-surface rounded-2xl py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-sb-surface-container flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-7 w-7 text-sb-on-surface-variant/20" />
              </div>
              <p className="text-sm font-medium text-sb-on-surface-variant/40">
                {(searchQuery || gradeFilter || activeTab !== "all") ? "Sin resultados para esta búsqueda" : "Sin pagos registrados"}
              </p>
              <p className="text-xs text-sb-on-surface-variant/25 mt-1">
                {(searchQuery || gradeFilter || activeTab !== "all") ? "Intenta con otros filtros" : "Registra tu primer pago"}
              </p>
              {(searchQuery || gradeFilter || activeTab !== "all") && (
                <button onClick={() => { clearSearch(); setGradeFilter(""); setActiveTab("all") }} className="mt-3 text-xs text-sb-on-surface hover:underline">
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="bg-sb-surface rounded-2xl overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[1.5fr_1fr_100px_100px_100px_100px_110px] gap-4 px-5 py-3 border-b border-sb-outline-variant/10">
                <span className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">Estudiante</span>
                <span className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">Concepto</span>
                <span className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider text-right">Monto</span>
                <span className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider text-right">Pagado</span>
                <span className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider text-right">Saldo</span>
                <span className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider">Vencimiento</span>
                <span className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider text-right">Estado</span>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-sb-outline-variant/8">
                <AnimatePresence>
                  {filteredPayments.map((p, i) => {
                    const effectiveStatus = getEffectiveStatus(p)
                    const cfg = statusConfig[effectiveStatus]
                    return (
                      <motion.div
                        key={p.id}
                        variants={listItem}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        transition={{ delay: i * 0.02, duration: 0.3 }}
                        onClick={() => { setSelectedPayment(p); setDetailModal(true) }}
                        className="grid grid-cols-[1.5fr_1fr_100px_100px_100px_100px_110px] gap-4 px-5 py-4 items-center hover:bg-sb-surface-container-low/50 transition-colors cursor-pointer"
                      >
                        {/* Student */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-xl bg-sb-surface-container flex items-center justify-center shrink-0">
                            <span className="text-[11px] font-semibold text-sb-on-surface-variant/50">
                              {p.student_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-sb-on-surface truncate">{p.student_name}</p>
                            <p className="text-[11px] text-sb-on-surface-variant/40">{p.student_grade}</p>
                          </div>
                        </div>

                        {/* Concept */}
                        <span className="text-sm text-sb-on-surface/70 truncate">{p.concept_name}</span>

                        {/* Amount */}
                        <span className="text-sm font-semibold text-sb-on-surface text-right">{fmt(p.amount)}</span>

                        {/* Paid */}
                        <span className="text-sm text-sb-on-surface/60 text-right">{fmt(p.paid_amount)}</span>

                        {/* Balance */}
                        <span className={`text-sm font-medium text-right ${p.balance > 0 ? "text-sb-on-surface" : "text-emerald-600"}`}>
                          {fmt(p.balance)}
                        </span>

                        {/* Due Date */}
                        <span className="text-xs text-sb-on-surface-variant/50">{formatDate(p.due_date)}</span>

                        {/* Status */}
                        <div className="flex justify-end">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${cfg.color}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}
        </motion.div>

      {/* ===== DETAIL MODAL ===== */}
      <SbModal open={detailModal} onClose={() => setDetailModal(false)} maxWidth="480px">
        <SbModalHeader title="Detalle de pago" onClose={() => setDetailModal(false)} />
        <SbModalBody>
          {selectedPayment && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3 pb-4 border-b border-sb-outline-variant/10">
                <div className="h-12 w-12 rounded-2xl bg-sb-surface-container flex items-center justify-center">
                  <User className="h-5 w-5 text-sb-on-surface-variant/50" />
                </div>
                <div>
                  <p className="text-base font-medium text-sb-on-surface">{selectedPayment.student_name}</p>
                  <p className="text-xs text-sb-on-surface-variant/50">{selectedPayment.student_grade}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Concepto", value: selectedPayment.concept_name, icon: BookOpen },
                  { label: "Monto total", value: fmt(selectedPayment.amount), icon: DollarSign },
                  { label: "Monto pagado", value: fmt(selectedPayment.paid_amount), icon: CheckCircle },
                  { label: "Saldo pendiente", value: fmt(selectedPayment.balance), icon: AlertCircle },
                  { label: "Vencimiento", value: formatDate(selectedPayment.due_date), icon: Calendar },
                  { label: "Estado", value: statusConfig[getEffectiveStatus(selectedPayment)].label, icon: Clock },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.03 }}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-sb-surface-container/50"
                  >
                    <item.icon className="h-4 w-4 text-sb-on-surface-variant/30 shrink-0" />
                    <div>
                      <p className="text-[10px] text-sb-on-surface-variant/40">{item.label}</p>
                      <p className="text-sm font-medium text-sb-on-surface">{item.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {selectedPayment.paid_date && (
                <div className="flex items-center gap-2 text-xs text-sb-on-surface-variant/50 bg-sb-surface-container/50 rounded-xl p-3">
                  <Calendar className="h-3.5 w-3.5" />
                  Pagado el {formatDate(selectedPayment.paid_date)}
                  {selectedPayment.reference && <> · Ref: {selectedPayment.reference}</>}
                </div>
              )}

              {getEffectiveStatus(selectedPayment) !== "paid" && (
                <div className="border-t border-sb-outline-variant/10 pt-4">
                  <p className="text-xs font-medium text-sb-on-surface-variant/60 mb-3">Registrar pago</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Monto"
                      id="detail-paid-amount"
                      defaultValue={selectedPayment.balance > 0 ? selectedPayment.balance.toFixed(2) : ""}
                      className="sb-input rounded-xl text-sm flex-1 h-10"
                    />
                    <input
                      type="text"
                      placeholder="Referencia"
                      id="detail-reference"
                      className="sb-input rounded-xl text-sm flex-1 h-10"
                    />
                    <button
                      onClick={() => {
                        const amt = parseFloat((document.getElementById("detail-paid-amount") as HTMLInputElement)?.value || "0")
                        const ref = (document.getElementById("detail-reference") as HTMLInputElement)?.value || ""
                        if (!amt || amt <= 0) { toast("Ingresa un monto válido", "warning"); return }
                        const newPaid = selectedPayment.paid_amount + amt
                        const newStatus: PaymentStatus = newPaid >= selectedPayment.amount ? "paid" : "partial"
                        handleUpdatePayment(selectedPayment.id, {
                          paid_amount: newPaid,
                          status: newStatus,
                          paid_date: new Date().toISOString().split("T")[0],
                          reference: ref || undefined,
                        })
                      }}
                      className="sb-btn filled rounded-xl text-xs flex items-center gap-2 h-10"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Pagar
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </SbModalBody>
      </SbModal>

      {/* ===== REGISTER PAYMENT MODAL ===== */}
      <SbModal open={registerModal} onClose={() => setRegisterModal(false)} maxWidth="520px">
        <SbModalHeader title="Registrar pago" onClose={() => setRegisterModal(false)} />
        <form onSubmit={handleRegisterPayment}>
          <SbModalBody>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2 block">Estudiante</label>
                <div className="relative">
                  <input
                    placeholder="Buscar estudiante..."
                    value={studentSearch}
                    onChange={e => handleSearchStudent(e.target.value)}
                    className="sb-input rounded-xl text-sm pl-10 h-10 w-full"
                    autoComplete="off"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/30" />
                </div>
                <AnimatePresence>
                  {searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="mt-1 border border-sb-outline-variant/15 rounded-xl overflow-hidden bg-sb-surface"
                    >
                      {searchResults.map(r => (
                        <button key={r.id} type="button" onClick={() => {
                          setStudentSearch(r.full_name + " - " + r.grade)
                          setSearchResults([])
                          const hiddenInput = document.getElementById("reg-student-id") as HTMLInputElement
                          if (hiddenInput) hiddenInput.value = r.id
                        }}
                          className="w-full text-left px-3 py-2.5 text-sm text-sb-on-surface hover:bg-sb-surface-container-low transition-colors border-b border-sb-outline-variant/10 last:border-b-0"
                        >
                          {r.full_name} <span className="text-sb-on-surface-variant/40">· {r.grade}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                <input type="hidden" name="student_id" id="reg-student-id" />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2 block">Concepto</label>
                <select name="concept_id" required className="sbf-native-select w-full">
                  <option value="">Seleccionar concepto</option>
                  {concepts.filter(c => c.is_active).map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({fmt(c.amount)})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2 block">Monto total</label>
                  <input type="number" step="0.01" name="amount" required placeholder="0.00" className="sb-input rounded-xl text-sm h-10 w-full" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2 block">Monto pagado</label>
                  <input type="number" step="0.01" name="paid_amount" placeholder="0.00" className="sb-input rounded-xl text-sm h-10 w-full" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2 block">Fecha de vencimiento</label>
                <input type="date" name="due_date" required className="sb-input rounded-xl text-sm h-10 w-full" />
              </div>

              <input type="hidden" name="status" value="pending" />
            </motion.div>
          </SbModalBody>
          <SbModalFooter>
            <SbBtn rounded onClick={() => setRegisterModal(false)}>Cancelar</SbBtn>
            <SbBtn variant="filled" rounded type="submit">Registrar pago</SbBtn>
          </SbModalFooter>
        </form>
      </SbModal>

      {/* ===== GENERATE DEBT MODAL ===== */}
      <SbModal open={debtModal} onClose={() => setDebtModal(false)} maxWidth="560px">
        <SbModalHeader title="Generar deuda" onClose={() => setDebtModal(false)} />
        <form onSubmit={handleGenerateDebt}>
          <SbModalBody>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2 block">Concepto</label>
                <select name="concept_id" required className="sbf-native-select w-full">
                  <option value="">Seleccionar concepto</option>
                  {concepts.filter(c => c.is_active).map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({fmt(c.amount)}) - {c.type === "monthly" ? "Mensual" : "Único"}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2 block">Estudiantes (IDs separados por coma)</label>
                <input
                  name="student_ids"
                  placeholder="id1,id2,id3 o usa el buscador"
                  className="sb-input rounded-xl text-sm h-10 w-full mb-2"
                />
                <div className="relative">
                  <input
                    placeholder="Buscar y agregar estudiante..."
                    onChange={e => handleSearchStudent(e.target.value)}
                    className="sb-input rounded-xl text-sm pl-10 h-10 w-full"
                    autoComplete="off"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/30" />
                </div>
                <AnimatePresence>
                  {searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="mt-1 border border-sb-outline-variant/15 rounded-xl overflow-hidden bg-sb-surface"
                    >
                      {searchResults.map(r => (
                        <button key={r.id} type="button" onClick={() => {
                          const input = document.querySelector("[name='student_ids']") as HTMLInputElement
                          const existing = input.value ? input.value.split(",").map(s => s.trim()).filter(Boolean) : []
                          if (!existing.includes(r.id)) {
                            existing.push(r.id)
                            input.value = existing.join(",")
                          }
                          setSearchResults([])
                        }}
                          className="w-full text-left px-3 py-2.5 text-sm text-sb-on-surface hover:bg-sb-surface-container-low transition-colors border-b border-sb-outline-variant/10 last:border-b-0"
                        >
                          {r.full_name} <span className="text-sb-on-surface-variant/40">· {r.grade}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-sb-on-surface-variant/40 uppercase tracking-wider mb-2 block">Fecha de vencimiento</label>
                <input type="date" name="due_date" required className="sb-input rounded-xl text-sm h-10 w-full" />
              </div>
            </motion.div>
          </SbModalBody>
          <SbModalFooter>
            <SbBtn rounded onClick={() => setDebtModal(false)}>Cancelar</SbBtn>
            <SbBtn variant="filled" rounded type="submit">Generar deudas</SbBtn>
          </SbModalFooter>
        </form>
      </SbModal>

      {/* ===== CONCEPTS MODAL ===== */}
      <SbModal open={conceptModal} onClose={() => setConceptModal(false)} maxWidth="560px">
        <SbModalHeader title="Conceptos de pago" onClose={() => setConceptModal(false)} />
        <SbModalBody>
          {concepts.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-sb-on-surface-variant/10 mx-auto mb-3" />
              <p className="text-sm font-medium text-sb-on-surface-variant/40">No hay conceptos creados</p>
            </div>
          ) : (
            <div className="space-y-2 mb-6">
              <AnimatePresence>
                {concepts.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-sb-surface-container/50 hover:bg-sb-surface-container transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${c.is_active ? "bg-sb-on-surface/8" : "bg-sb-surface-container"}`}>
                        <BookOpen className={`h-4 w-4 ${c.is_active ? "text-sb-on-surface/60" : "text-sb-on-surface-variant/30"}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${c.is_active ? "text-sb-on-surface" : "text-sb-on-surface-variant/40"}`}>{c.name}</p>
                        <div className="flex items-center gap-2 text-[11px] text-sb-on-surface-variant/40">
                          <span>{fmt(c.amount)}</span>
                          <span>·</span>
                          <span>{c.type === "monthly" ? "Mensual" : "Único"}</span>
                          {!c.is_active && <><span>·</span><span className="text-red-500/60">Inactivo</span></>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const editing = concepts.find(x => x.id === c.id)
                          if (editing) {
                            const form = document.getElementById("concept-form") as HTMLFormElement
                            if (form) {
                              ;(form.querySelector("[name='editing_id']") as HTMLInputElement).value = editing.id
                              ;(form.querySelector("[name='name']") as HTMLInputElement).value = editing.name
                              ;(form.querySelector("[name='amount']") as HTMLInputElement).value = editing.amount.toString()
                              ;(form.querySelector("[name='type']") as HTMLSelectElement).value = editing.type
                            }
                          }
                        }}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-sb-on-surface-variant/40 hover:text-sb-on-surface hover:bg-sb-surface-container transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteConcept(c.id)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-sb-on-surface-variant/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          <div className="pt-4 border-t border-sb-outline-variant/10">
            <p className="text-xs font-medium text-sb-on-surface-variant/60 mb-3">Nuevo concepto</p>
            <form id="concept-form" onSubmit={handleSaveConcept}>
              <input type="hidden" name="editing_id" />
              <div className="space-y-3">
                <input name="name" placeholder="Nombre del concepto" required className="sb-input rounded-xl text-sm h-10 w-full" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" step="0.01" name="amount" placeholder="Monto" required className="sb-input rounded-xl text-sm h-10 w-full" />
                  <select name="type" required className="sbf-native-select w-full">
                    <option value="monthly">Mensual</option>
                    <option value="one_time">Único</option>
                  </select>
                </div>
                <SbBtn variant="filled" rounded className="w-full flex items-center justify-center gap-2 h-10" type="submit">
                  <Save className="h-3.5 w-3.5" />
                  Guardar concepto
                </SbBtn>
              </div>
            </form>
          </div>
        </SbModalBody>
      </SbModal>

      {/* ===== PAYMENT METHODS MODAL ===== */}
      <SbModal open={methodModal} onClose={() => setMethodModal(false)} maxWidth="620px">
        <SbModalHeader title="Métodos de pago" onClose={() => setMethodModal(false)} />
        <SbModalBody>
          <p className="text-xs text-sb-on-surface-variant/40 mb-4 leading-relaxed">
            Estas son las formas de pago que verán los padres en su portal. Configura tus cuentas bancarias, Yape, Plin, etc.
          </p>

          {methods.length === 0 ? (
            <div className="text-center py-12 mb-4">
              <CreditCard className="h-12 w-12 text-sb-on-surface-variant/10 mx-auto mb-3" />
              <p className="text-sm font-medium text-sb-on-surface-variant/40">No hay métodos de pago configurados</p>
            </div>
          ) : (
            <div className="space-y-2 mb-6">
              <AnimatePresence>
                {methods.map((m, i) => {
                  const cfg = methodConfig[m.type] || methodConfig.otro
                  const Icon = cfg.icon
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.03 }}
                      className={`flex items-center justify-between p-3.5 rounded-xl bg-sb-surface-container/50 hover:bg-sb-surface-container transition-colors ${m.is_active ? "" : "opacity-50"}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                          <Icon className={`h-4 w-4 ${cfg.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-sb-on-surface truncate">{m.name}</p>
                          <p className="text-[11px] text-sb-on-surface-variant/40 truncate">
                            {cfg.label}
                            {m.bank_name && ` · ${m.bank_name}`}
                            {m.account_number && ` · ${m.account_number}`}
                            {m.phone && ` · ${m.phone}`}
                            {!m.is_active && " · Inactivo"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleMethod(m)}
                          title={m.is_active ? "Desactivar" : "Activar"}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-sb-on-surface-variant/40 hover:text-sb-on-surface hover:bg-sb-surface-container transition-colors"
                        >
                          <CheckCircle className={`h-3.5 w-3.5 ${m.is_active ? "text-emerald-500" : ""}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMethod(m.id)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-sb-on-surface-variant/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}

          <div className="pt-4 border-t border-sb-outline-variant/10">
            <p className="text-xs font-medium text-sb-on-surface-variant/60 mb-3">Nuevo método de pago</p>
            <form id="method-form" onSubmit={handleSaveMethod}>
              <input type="hidden" name="method_editing_id" />
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <select name="method_type" required className="sbf-native-select w-full">
                    <option value="">Tipo</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="deposito">Depósito bancario</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="yape">Yape</option>
                    <option value="plin">Plin</option>
                    <option value="otro">Otro</option>
                  </select>
                  <input name="method_name" placeholder="Nombre (ej: BCP)" required className="sb-input rounded-xl text-sm h-10 w-full" />
                </div>
                <input name="method_bank" placeholder="Banco (opcional)" className="sb-input rounded-xl text-sm h-10 w-full" />
                <div className="grid grid-cols-2 gap-3">
                  <input name="method_account" placeholder="Nº cuenta / CCI (opcional)" className="sb-input rounded-xl text-sm h-10 w-full" />
                  <input name="method_holder" placeholder="Titular (opcional)" className="sb-input rounded-xl text-sm h-10 w-full" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input name="method_phone" placeholder="Teléfono Yape/Plin (opcional)" className="sb-input rounded-xl text-sm h-10 w-full" />
                  <input name="method_details" placeholder="Detalle / horario (opcional)" className="sb-input rounded-xl text-sm h-10 w-full" />
                </div>
                <SbBtn variant="filled" rounded className="w-full flex items-center justify-center gap-2 h-10" type="submit">
                  <Save className="h-3.5 w-3.5" />
                  Guardar método de pago
                </SbBtn>
              </div>
            </form>
          </div>
        </SbModalBody>
      </SbModal>
    </div>
  )
}
