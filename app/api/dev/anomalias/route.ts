import { NextResponse } from 'next/server'
import { runAnomalyScan, buildConstitution, getOpenAnomalies, ANOMALY_CHECKS, type Finding } from '@/lib/anomalies'
import { createNotify } from '@/lib/notify'

// ============================================================
// Auditoría DEV: constitución de colegios + detección de anomalías
// y cruces entre instituciones. Al detectar anomalías NUEVAS se
// registran en dev_anomaly_log y se notifica al dev (campana + push).
// La lógica vive en lib/anomalies.ts (compartida con el worker de
// server.ts que hace la revisión automática por horario).
// ============================================================

function notifyAnomaly(f: Finding) {
  return createNotify({
    institutionId: null as any,
    title: `Anomalía (${f.severity}): ${f.title}`,
    message: f.detail,
    type: 'anomalia',
    category: 'errores',
    priority: f.severity === 'alta' ? 'alta' : 'media',
    targetRole: 'dev',
  })
}

export async function GET() {
  try {
    const { nuevos, has } = await runAnomalyScan(notifyAnomaly)

    const { list, agg } = await buildConstitution(has)

    const { anomalias, resolvedCount } = await getOpenAnomalies()

    return NextResponse.json({
      ok: true,
      scan: { at: new Date().toISOString(), nuevos },
      checks: ANOMALY_CHECKS.length,
      constitution: { list, agg },
      anomalias,
      resolvedCount,
    })
  } catch (error: any) {
    console.error('Error en auditoría de anomalías:', error)
    return NextResponse.json({ error: 'Error en auditoría', details: error?.message }, { status: 500 })
  }
}