'use client'

import { CreditCard } from 'lucide-react'

interface PlanBadgeProps {
  planName: string
  size?: 'sm' | 'md' | 'lg'
}

const planColors: Record<string, { bg: string; text: string; border: string }> = {
  'SuperBasico Prueba': { bg: 'bg-sb-on-surface/10', text: 'text-sb-on-surface/70', border: 'border-sb-on-surface/20' },
  'Básico': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  'Pro': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  'Enterprise': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
}

export function PlanBadge({ planName, size = 'md' }: PlanBadgeProps) {
  const colors = planColors[planName] || planColors['SuperBasico Prueba']
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-lg border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]}`}>
      <CreditCard className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {planName}
    </span>
  )
}
