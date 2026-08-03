"use client"

import * as React from "react"
import { SbCard, SbBtn, SbBadge, SbTable, SbStatCard } from "@/components/ui/sb"
import { HeadphonesIcon, Plus, Clock, CheckCircle, AlertCircle } from "lucide-react"

const mockTickets = [
  { id: "T001", subject: "Error al cargar notas", institution: "Colegio San Martín", priority: "high", status: "open", created: "2024-01-15" },
  { id: "T002", subject: "Solicitud de reporte personalizado", institution: "IEP Santa María", priority: "medium", status: "in_progress", created: "2024-01-14" },
  { id: "T003", subject: "Problema con exportación PDF", institution: "Colegio Los Andes", priority: "low", status: "resolved", created: "2024-01-13" },
  { id: "T004", subject: "Capacitación para nuevos docentes", institution: "IEP San Juan", priority: "medium", status: "open", created: "2024-01-12" },
]

const priorityColors: Record<string, string> = {
  low: "bg-[var(--sb-muted)] text-[var(--sb-muted-foreground)]",
  medium: "bg-[var(--sb-warning)]/10 text-[var(--sb-warning)]",
  high: "bg-[var(--sb-danger)]/10 text-[var(--sb-danger)]",
  urgent: "bg-[var(--sb-danger)]/20 text-[var(--sb-danger)]",
}

const statusColors: Record<string, string> = {
  open: "bg-[var(--sb-info)]/10 text-[var(--sb-info)]",
  in_progress: "bg-[var(--sb-warning)]/10 text-[var(--sb-warning)]",
  resolved: "bg-[var(--sb-success)]/10 text-[var(--sb-success)]",
  closed: "bg-[var(--sb-muted)] text-[var(--sb-muted-foreground)]",
}

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Soporte</h1>
          <p className="text-[var(--sb-muted-foreground)]">
            Gestiona los tickets de soporte de las instituciones
          </p>
        </div>
        <SbBtn>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Ticket
        </SbBtn>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SbStatCard
          label="Total Tickets"
          value="24"
          icon={<HeadphonesIcon className="h-4 w-4" />}
          color="var(--sb-primary)"
        />
        <SbStatCard
          label="Abiertos"
          value="8"
          icon={<AlertCircle className="h-4 w-4" />}
          color="var(--sb-info)"
        />
        <SbStatCard
          label="En Progreso"
          value="6"
          icon={<Clock className="h-4 w-4" />}
          color="var(--sb-warning)"
        />
        <SbStatCard
          label="Resueltos"
          value="10"
          icon={<CheckCircle className="h-4 w-4" />}
          color="var(--sb-success)"
        />
      </div>

      <SbCard>
        <h3 className="font-semibold text-lg">Tickets Recientes</h3>
        <SbTable>
          <thead>
            <tr>
              <th>ID</th>
              <th>Asunto</th>
              <th>Institución</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {mockTickets.map((ticket) => (
              <tr key={ticket.id}>
                <td className="font-mono text-sm">{ticket.id}</td>
                <td className="font-medium">{ticket.subject}</td>
                <td>{ticket.institution}</td>
                <td>
                  <SbBadge className={priorityColors[ticket.priority]}>
                    {ticket.priority}
                  </SbBadge>
                </td>
                <td>
                  <SbBadge className={statusColors[ticket.status]}>
                    {ticket.status.replace("_", " ")}
                  </SbBadge>
                </td>
                <td>{ticket.created}</td>
                <td className="text-right">
                  <SbBtn variant="tonal" size="sm">
                    Ver
                  </SbBtn>
                </td>
              </tr>
            ))}
          </tbody>
        </SbTable>
      </SbCard>
    </div>
  )
}
