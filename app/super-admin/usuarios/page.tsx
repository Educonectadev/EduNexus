"use client"

import * as React from "react"
import { SbBtn, SbInput, SbBadge, SbCard, SbTable } from "@/components/ui/sb"
import { Plus, Search, User } from "@/components/ui/proicons"

const mockUsers = [
  { id: "1", name: "Carlos Mendoza", email: "carlos@colegiosanmartin.edu.pe", role: "director", institution: "Colegio San Martín", status: "active" },
  { id: "2", name: "María García", email: "maria@iepsantamaria.edu.pe", role: "secretario", institution: "IEP Santa María", status: "active" },
  { id: "3", name: "Juan López", email: "juan@colegioandes.edu.pe", role: "docente", institution: "Colegio Los Andes", status: "active" },
  { id: "4", name: "Ana Martínez", email: "ana@iepsanjuan.edu.pe", role: "padre", institution: "IEP San Juan", status: "inactive" },
  { id: "5", name: "Pedro Sánchez", email: "pedro@colegionacional.edu.pe", role: "director", institution: "Colegio Nacional", status: "active" },
]

const roleColors: Record<string, string> = {
  director: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  secretario: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  docente: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  padre: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
}

export default function UsersPage() {
  const [search, setSearch] = React.useState("")

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona todos los usuarios de la plataforma
          </p>
        </div>
        <SbBtn>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </SbBtn>
      </div>

      <SbCard>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <SbInput
              placeholder="Buscar usuario..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <SbTable>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Institución</th>
              <th>Estado</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    {user.name}
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <SbBadge className={roleColors[user.role]}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </SbBadge>
                </td>
                <td>{user.institution}</td>
                <td>
                  <SbBadge
                    color={user.status === "active" ? "default" : "secondary"}
                  >
                    {user.status === "active" ? "Activo" : "Inactivo"}
                  </SbBadge>
                </td>
                <td className="text-right">
                  <SbBtn variant="tonal" size="sm">
                    Editar
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
