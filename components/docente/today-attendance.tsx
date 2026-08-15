"use client"

import * as React from "react"
import Link from "next/link"
import { UserCheck, LogIn, LogOut, Clock, ArrowRight } from "@/components/ui/proicons"

interface TeacherAttendance {
  check_in?: string | null
  check_out?: string | null
  status?: string | null
}

interface TodayAttendanceProps {
  teacherAttendance: TeacherAttendance | null
  scheduleStart?: string | null
  scheduleEnd?: string | null
  // Resumen de asistencia de alumnos del día (presentes/ausentes/tardanzas)
  studentSummary?: {
    present: number
    absent: number
    late: number
    justified?: number
    total: number
  } | null
  loading?: boolean
  onCheckIn?: () => void
  onCheckOut?: () => void
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  present: { label: "A tiempo", cls: "td-att-pill--present" },
  late: { label: "Tardanza", cls: "td-att-pill--late" },
  absent: { label: "Ausente", cls: "td-att-pill--absent" },
  justified: { label: "Justificado", cls: "td-att-pill--justified" },
  early_leave: { label: "Salida anticipada", cls: "td-att-pill--early" },
}

export function TodayAttendance({
  teacherAttendance,
  scheduleStart,
  scheduleEnd,
  studentSummary,
  loading,
  onCheckIn,
  onCheckOut,
}: TodayAttendanceProps) {
  const checkedIn = teacherAttendance?.check_in
  const checkedOut = teacherAttendance?.check_out
  const statusKey = teacherAttendance?.status || ""
  const status = statusConfig[statusKey]

  return (
    <section className="td-card" aria-label="Asistencia de hoy">
      <header className="td-card-head">
        <div className="td-card-title-wrap">
          <Clock className="td-card-title-icon" />
          <h3 className="td-card-title">Asistencia de hoy</h3>
        </div>
        {status && (
          <span className={`td-att-pill ${status.cls}`}>
            <span className="td-att-dot" /> {status.label}
          </span>
        )}
      </header>

      {/* Resumen del docente: entrada / salida */}
      <div className="td-att-grid">
        <div className="td-att-cell">
          <div className="td-att-cell-head">
            <LogIn className={`td-att-cell-icon ${checkedIn ? "td-att-cell-icon--ok" : ""}`} />
            <span className="td-att-cell-label">Entrada</span>
          </div>
          <p className={`td-att-time ${checkedIn ? "" : "td-att-time--muted"}`}>
            {checkedIn ? checkedIn.slice(0, 5) : "--:--"}
          </p>
          {scheduleStart && (
            <p className="td-att-prog">Prog. {scheduleStart.slice(0, 5)}</p>
          )}
        </div>
        <div className="td-att-cell">
          <div className="td-att-cell-head">
            <LogOut className={`td-att-cell-icon ${checkedOut ? "td-att-cell-icon--ok-warn" : ""}`} />
            <span className="td-att-cell-label">Salida</span>
          </div>
          <p className={`td-att-time ${checkedOut ? "" : "td-att-time--muted"}`}>
            {checkedOut ? checkedOut.slice(0, 5) : "--:--"}
          </p>
          {scheduleEnd && (
            <p className="td-att-prog">Prog. {scheduleEnd.slice(0, 5)}</p>
          )}
        </div>
      </div>

      {/* Acciones del docente */}
      {!checkedIn && (
        <button
          type="button"
          onClick={onCheckIn}
          className="td-att-cta"
          disabled={loading}
        >
          <LogIn className="td-att-cta-icon" /> Marcar entrada
        </button>
      )}
      {checkedIn && !checkedOut && (
        <button
          type="button"
          onClick={onCheckOut}
          className="td-att-cta"
          disabled={loading}
        >
          <LogOut className="td-att-cta-icon" /> Marcar salida
        </button>
      )}
      {checkedIn && checkedOut && (
        <Link href="/docente/asistencia" className="td-att-cta td-att-cta--ghost">
          Ver detalle de asistencia <ArrowRight className="td-att-cta-icon" />
        </Link>
      )}

      {/* Resumen de alumnos */}
      <div className="td-att-students">
        <div className="td-att-students-head">
          <UserCheck className="td-card-title-icon" />
          <h4 className="td-att-students-title">Alumnos</h4>
          <Link href="/docente/asistencia" className="td-card-link td-card-link--xs">
            Tomar asistencia <ArrowRight className="td-card-link-icon" />
          </Link>
        </div>

        {studentSummary && studentSummary.total > 0 ? (
          <div className="td-att-students-grid">
            <div className="td-att-stat td-att-stat--present">
              <span className="td-att-stat-value">{studentSummary.present}</span>
              <span className="td-att-stat-label">Presentes</span>
            </div>
            <div className="td-att-stat td-att-stat--absent">
              <span className="td-att-stat-value">{studentSummary.absent}</span>
              <span className="td-att-stat-label">Ausentes</span>
            </div>
            <div className="td-att-stat td-att-stat--late">
              <span className="td-att-stat-value">{studentSummary.late}</span>
              <span className="td-att-stat-label">Tardanzas</span>
            </div>
          </div>
        ) : (
          <div className="td-att-students-empty">
            <p className="td-att-students-empty-text">
              Aún no se ha registrado asistencia de alumnos hoy.
            </p>
            <Link href="/docente/asistencia" className="td-att-students-cta">
              <UserCheck className="td-att-cta-icon" /> Tomar asistencia
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

export default TodayAttendance
