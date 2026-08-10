// Business-days (Mon-Fri) helpers for the free trial of institutions.

// Add N business days (Mon-Fri) to a date, ignoring weekends.
export function addBusinessDays(start: Date, days: number): Date {
  const result = new Date(start)
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    const day = result.getDay()
    if (day !== 0 && day !== 6) added += 1
  }
  result.setHours(23, 59, 59, 999)
  return result
}

// Remaining business days from today until trialEnd (0 if expired).
export function remainingBusinessDays(trialEnd: Date, from: Date = new Date()): number {
  let count = 0
  const cursor = new Date(from)
  while (cursor < trialEnd) {
    const day = cursor.getDay()
    if (day !== 0 && day !== 6) count += 1
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}

export interface TrialStatus {
  hasPaidPlan: boolean
  trialEndsAt: string | null
  isExpired: boolean
  remainingBusinessDays: number
  daysLabel: string
}

export function computeTrialStatus(info: {
  planId: string | null
  planTrialDays?: number | null
  trialEndsAt: string | Date | null
}): TrialStatus {
  // Un plan con trial_days > 0 es un plan de prueba (Gratis/Demo): cuenta días hábiles
  // hasta trial_ends_at y puede vencer. Un plan pago (sin trial_days) no vence.
  const isTrialPlan = !!info.planId && !!info.planTrialDays && info.planTrialDays > 0
  const hasPaidPlan = !!info.planId && !isTrialPlan
  const end = info.trialEndsAt ? new Date(info.trialEndsAt) : null
  const today = new Date()
  const isExpired = !hasPaidPlan && !!end && end < today

  let remainingBusinessDays = 0
  let daysLabel = ''
  if (end) {
    remainingBusinessDays = isExpired ? 0 : remainingBusinessDays(end)
    daysLabel = isExpired
      ? 'Trial vencido'
      : `Quedan ${remainingBusinessDays} días hábiles`
  }

  return {
    hasPaidPlan,
    trialEndsAt: end ? end.toISOString() : null,
    isExpired,
    remainingBusinessDays,
    daysLabel,
  }
}