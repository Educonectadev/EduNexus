"use client"

import * as React from "react"
import { SbBtn, SbInput, SbLabel, SbSwitch, SbCard, SbTabs } from "@/components/ui/sb"
import { Save, Mail, Database, Globe, Shield } from "@/components/ui/proicons"

const tabs = [
  { id: "general", label: "General" },
  { id: "smtp", label: "SMTP" },
  { id: "database", label: "Base de Datos" },
  { id: "security", label: "Seguridad" },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState("general")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">
          Configuración general de la plataforma
        </p>
      </div>

      <SbTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "general" && (
        <div className="space-y-4">
          <SbCard>
            <h2 className="text-lg font-semibold mb-1">Configuración General</h2>
            <p className="text-sm text-muted-foreground mb-4">Ajustes generales de la plataforma</p>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <SbLabel>Nombre de la Aplicación</SbLabel>
                  <SbInput id="appName" defaultValue="Educonecta" />
                </div>
                <div className="space-y-2">
                  <SbLabel>URL de la Aplicación</SbLabel>
                  <SbInput id="appUrl" defaultValue="https://educonecta.pe" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <SbLabel>Modo Mantenimiento</SbLabel>
                  <p className="text-sm text-muted-foreground">
                    Activar modo mantenimiento para todos los usuarios
                  </p>
                </div>
                <SbSwitch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <SbLabel>Nuevos Registros</SbLabel>
                  <p className="text-sm text-muted-foreground">
                    Permitir nuevos registros de instituciones
                  </p>
                </div>
                <SbSwitch checked={true} />
              </div>

              <SbBtn>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </SbBtn>
            </div>
          </SbCard>
        </div>
      )}

      {activeTab === "smtp" && (
        <div className="space-y-4">
          <SbCard>
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Configuración SMTP
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Configuración del servidor de correo</p>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <SbLabel>Host SMTP</SbLabel>
                  <SbInput id="smtpHost" placeholder="smtp.gmail.com" />
                </div>
                <div className="space-y-2">
                  <SbLabel>Puerto SMTP</SbLabel>
                  <SbInput id="smtpPort" placeholder="587" />
                </div>
                <div className="space-y-2">
                  <SbLabel>Usuario SMTP</SbLabel>
                  <SbInput id="smtpUser" placeholder="correo@gmail.com" />
                </div>
                <div className="space-y-2">
                  <SbLabel>Contraseña SMTP</SbLabel>
                  <SbInput id="smtpPass" type="password" placeholder="••••••••" />
                </div>
              </div>

              <SbBtn>
                <Save className="mr-2 h-4 w-4" />
                Guardar Configuración SMTP
              </SbBtn>
            </div>
          </SbCard>
        </div>
      )}

      {activeTab === "database" && (
        <div className="space-y-4">
          <SbCard>
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <Database className="h-5 w-5" />
              Configuración de Base de Datos
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Configuración de Supabase</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <SbLabel>URL de Supabase</SbLabel>
                <SbInput id="supabaseUrl" placeholder="https://tu-proyecto.supabase.co" />
              </div>
              <div className="space-y-2">
                <SbLabel>Anon Key</SbLabel>
                <SbInput id="supabaseKey" placeholder="eyJhbGciOiJIUzI1NiIs..." />
              </div>
              <div className="space-y-2">
                <SbLabel>Service Role Key</SbLabel>
                <SbInput id="serviceRoleKey" type="password" placeholder="eyJhbGciOiJIUzI1NiIs..." />
              </div>

              <SbBtn>
                <Save className="mr-2 h-4 w-4" />
                Guardar Configuración
              </SbBtn>
            </div>
          </SbCard>
        </div>
      )}

      {activeTab === "security" && (
        <div className="space-y-4">
          <SbCard>
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Seguridad
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Configuración de seguridad y autenticación</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <SbLabel>Autenticación de Dos Factores</SbLabel>
                  <p className="text-sm text-muted-foreground">
                    Requerir 2FA para todos los administradores
                  </p>
                </div>
                <SbSwitch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <SbLabel>Bloqueo por Intentos Fallidos</SbLabel>
                  <p className="text-sm text-muted-foreground">
                    Bloquear cuenta después de 5 intentos fallidos
                  </p>
                </div>
                <SbSwitch checked={true} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <SbLabel>Tiempo de Sesión (minutos)</SbLabel>
                  <SbInput id="sessionTimeout" type="number" defaultValue="60" />
                </div>
                <div className="space-y-2">
                  <SbLabel>Longitud Mínima de Contraseña</SbLabel>
                  <SbInput id="passwordMinLength" type="number" defaultValue="8" />
                </div>
              </div>

              <SbBtn>
                <Save className="mr-2 h-4 w-4" />
                Guardar Configuración
              </SbBtn>
            </div>
          </SbCard>
        </div>
      )}
    </div>
  )
}
