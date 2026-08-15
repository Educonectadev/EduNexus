"use client"

import * as React from "react"
import Link from "next/link"
import { Calendar, MapPin, ChevronRight, Clock } from "@/components/ui/proicons"

export interface ScheduleItem {
  id: string
  start_time: string
  end_time: string
  course_name: string
  grade: string
  section: string
  classroom?: string
}

interface TodayScheduleProps {
  items: ScheduleItem[]
  loading?: boolean
}

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

function classStatus(item: ScheduleItem): { label: string; cls: string } | null {
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const start = toMin(item.start_time)
  const end = toMin(item.end_time)
  if (nowMin >= start && nowMin < end) {
    return { label: "En curso", cls: "td-class-status--now" }
  }
  if (end <= nowMin) {
    return { label: "Finalizada", cls: "td-class-status--done" }
  }
  return { label: "Próxima", cls: "td-class-status--next" }
}

export function TodaySchedule({ items, loading }: TodayScheduleProps) {
  const sorted = React.useMemo(
    () => [...items].sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [items]
  )

  return (
    <section className="td-card" aria-label="Horario de hoy">
      <header className="td-card-head">
        <div className="td-card-title-wrap">
          <Calendar className="td-card-title-icon" />
          <h3 className="td-card-title">Horario de hoy</h3>
        </div>
        <Link href="/docente/horarios" className="td-card-link">
          Ver semana <ChevronRight className="td-card-link-icon" />
        </Link>
      </header>

      {loading ? (
        <div className="td-schedule-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="td-schedule-item td-schedule-item--skeleton" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="td-empty">
          <div className="td-empty-icon">
            <Calendar className="td-empty-icon-svg" />
          </div>
          <p className="td-empty-text">No tienes clases programadas para hoy.</p>
        </div>
      ) : (
        <div className="td-schedule-list">
          {sorted.map((it) => {
            const status = classStatus(it)
            return (
              <div key={it.id} className="td-schedule-item">
                <div className="td-schedule-time">
                  <span className="td-schedule-time-start">
                    {it.start_time.slice(0, 5)}
                  </span>
                  <span className="td-schedule-time-sep">—</span>
                  <span className="td-schedule-time-end">
                    {it.end_time.slice(0, 5)}
                  </span>
                </div>
                <div className="td-schedule-body">
                  <p className="td-schedule-course">{it.course_name}</p>
                  <p className="td-schedule-meta">
                    {it.grade} {it.section && <>· {it.section}</>}
                    {it.classroom && (
                      <>
                        {" · "}
                        <MapPin className="td-schedule-meta-icon" /> {it.classroom}
                      </>
                    )}
                  </p>
                </div>
                {status && (
                  <span className={`td-class-status ${status.cls}`}>{status.label}</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default TodaySchedule
