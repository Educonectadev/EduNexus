"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Send, CheckCircle, Building2, User, Mail, Phone, 
  Users, MessageSquare, ArrowLeft, GraduationCap
} from "lucide-react"
import Link from "next/link"

export default function DemoPage() {
  const [form, setForm] = React.useState({
    full_name: '',
    email: '',
    phone: '',
    institution_name: '',
    institution_type: 'private',
    level: 'all',
    estimated_students: '',
    message: '',
  })
  const [submitting, setSubmitting] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name || !form.email) {
      setError('Nombre y email son requeridos')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          estimated_students: parseInt(form.estimated_students) || 0,
        })
      })
      const data = await res.json()
      if (res.ok) {
        setSubmitted(true)
      } else {
        setError(data.error || 'Error al enviar')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-sb-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-sb-surface rounded-2xl p-8 max-w-md w-full text-center shadow-lg border border-sb-outline-variant/8"
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-sb-on-surface mb-2">Solicitud enviada</h2>
          <p className="text-sb-on-surface/60 mb-6">
            Nos contactaremos contigo pronto para coordinar la demostración del sistema.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-sb-on-surface text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sb-background py-12 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sb-on-surface-variant/50 hover:text-sb-on-surface mb-4 text-[13px]">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
          <h1 className="text-2xl font-bold text-sb-on-surface">Solicitar Demostración</h1>
          <p className="text-sb-on-surface/60 mt-2 text-[14px]">
            Descubre cómo Educonecta puede transformar la gestión de tu institución educativa
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-sb-surface rounded-2xl p-6 shadow-sm border border-sb-outline-variant/8 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-[13px]">
              {error}
            </div>
          )}

          {/* Personal Info */}
          <div>
            <p className="text-[11px] font-semibold text-sb-on-surface-variant/50 uppercase tracking-widest mb-3">Datos personales</p>
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/40" />
                <input
                  type="text"
                  placeholder="Nombre completo *"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-sb-background border border-sb-on-surface/10 rounded-xl text-[13px] text-sb-on-surface placeholder:text-sb-on-surface/40 focus:outline-none focus:ring-2 focus:ring-sb-primary/20"
                  required
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/40" />
                <input
                  type="email"
                  placeholder="Email corporativo *"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-sb-background border border-sb-on-surface/10 rounded-xl text-[13px] text-sb-on-surface placeholder:text-sb-on-surface/40 focus:outline-none focus:ring-2 focus:ring-sb-primary/20"
                  required
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/40" />
                <input
                  type="tel"
                  placeholder="Teléfono (opcional)"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-sb-background border border-sb-on-surface/10 rounded-xl text-[13px] text-sb-on-surface placeholder:text-sb-on-surface/40 focus:outline-none focus:ring-2 focus:ring-sb-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Institution Info */}
          <div>
            <p className="text-[11px] font-semibold text-sb-on-surface-variant/50 uppercase tracking-widest mb-3">Institución</p>
            <div className="space-y-3">
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/40" />
                <input
                  type="text"
                  placeholder="Nombre del colegio"
                  value={form.institution_name}
                  onChange={(e) => setForm({ ...form, institution_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-sb-background border border-sb-on-surface/10 rounded-xl text-[13px] text-sb-on-surface placeholder:text-sb-on-surface/40 focus:outline-none focus:ring-2 focus:ring-sb-primary/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.institution_type}
                  onChange={(e) => setForm({ ...form, institution_type: e.target.value })}
                  className="px-4 py-3 bg-sb-background border border-sb-on-surface/10 rounded-xl text-[13px] text-sb-on-surface focus:outline-none focus:ring-2 focus:ring-sb-primary/20"
                >
                  <option value="private">Privado</option>
                  <option value="public">Público</option>
                </select>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  className="px-4 py-3 bg-sb-background border border-sb-on-surface/10 rounded-xl text-[13px] text-sb-on-surface focus:outline-none focus:ring-2 focus:ring-sb-primary/20"
                >
                  <option value="all">Todos los niveles</option>
                  <option value="initial">Inicial</option>
                  <option value="primary">Primaria</option>
                  <option value="secondary">Secundaria</option>
                </select>
              </div>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-on-surface-variant/40" />
                <input
                  type="number"
                  placeholder="Cantidad estimada de alumnos"
                  value={form.estimated_students}
                  onChange={(e) => setForm({ ...form, estimated_students: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-sb-background border border-sb-on-surface/10 rounded-xl text-[13px] text-sb-on-surface placeholder:text-sb-on-surface/40 focus:outline-none focus:ring-2 focus:ring-sb-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Message */}
          <div>
            <p className="text-[11px] font-semibold text-sb-on-surface-variant/50 uppercase tracking-widest mb-3">Mensaje</p>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-sb-on-surface-variant/40" />
              <textarea
                placeholder="Cuéntanos tus necesidades o preguntas (opcional)"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={3}
                className="w-full pl-10 pr-4 py-3 bg-sb-background border border-sb-on-surface/10 rounded-xl text-[13px] text-sb-on-surface placeholder:text-sb-on-surface/40 focus:outline-none focus:ring-2 focus:ring-sb-primary/20 resize-none"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-sb-on-surface text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar solicitud
              </>
            )}
          </button>

          <p className="text-[11px] text-sb-on-surface-variant/40 text-center">
            Al enviar, aceptas que nos contactemos contigo para coordinar la demostración.
          </p>
        </form>
      </motion.div>
    </div>
  )
}
