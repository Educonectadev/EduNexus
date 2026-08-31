export const ALL_PERMISSIONS = [
  { key: 'can_grades', label: 'Calificaciones', default: true },
  { key: 'can_attendance', label: 'Asistencia digital', default: true },
  { key: 'can_documents', label: 'Gestión de documentos', default: true },
  { key: 'can_parents_portal', label: 'Portal de padres', default: true },
  { key: 'can_homework', label: 'Tareas y revisiones', default: true },
  { key: 'can_certificates', label: 'Certificados digitales', default: false },
  { key: 'can_virtual_classes', label: 'Clases virtuales (Zoom/Meet)', default: false },
  { key: 'can_ai_assistant', label: 'Asistente IA del secretario', default: true },
  { key: 'can_chat', label: 'Chat en tiempo real docente-padre', default: false },
  { key: 'can_carnets', label: 'Carnets PDF descargables', default: false },
  { key: 'can_bulk_import', label: 'Importación masiva', default: true },
  { key: 'can_export_reports', label: 'Exportar reportes', default: true },
  { key: 'can_api_access', label: 'API de acceso', default: false },
  { key: 'can_white_label', label: 'White label', default: false },
  { key: 'can_priority_support', label: 'Soporte prioritario', default: false },
] as const

export type PlanPermission = typeof ALL_PERMISSIONS[number]['key']

export function parsePlanFeatures(features: any): { permissions: Record<string, boolean>; labels: string[] } {
  if (!features) return { permissions: {}, labels: [] }
  if (Array.isArray(features)) {
    return { permissions: {}, labels: features }
  }
  if (typeof features === 'string') {
    try {
      const parsed = JSON.parse(features)
      if (Array.isArray(parsed)) return { permissions: {}, labels: parsed }
      return {
        permissions: parsed.permissions || {},
        labels: parsed.labels || [],
      }
    } catch {
      return { permissions: {}, labels: [features] }
    }
  }
  return {
    permissions: features.permissions || {},
    labels: features.labels || [],
  }
}

export function getEffectivePermissions(planFeatures: any): Record<string, boolean> {
  const { permissions } = parsePlanFeatures(planFeatures)
  const result: Record<string, boolean> = {}
  for (const p of ALL_PERMISSIONS) {
    result[p.key] = permissions[p.key] ?? p.default
  }
  return result
}
