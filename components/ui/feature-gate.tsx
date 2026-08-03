'use client'

import { ReactNode } from 'react'
import { Lock, CreditCard } from 'lucide-react'
import { motion } from 'framer-motion'

interface FeatureGateProps {
  allowed: boolean
  featureName: string
  requiredPlan?: string
  children: ReactNode
  onUpgrade?: () => void
}

export function FeatureGate({ 
  allowed, 
  featureName, 
  requiredPlan = 'Pro',
  children,
  onUpgrade 
}: FeatureGateProps) {
  if (allowed) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-sb-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-sb-surface rounded-2xl p-6 max-w-sm w-full mx-4 text-center shadow-lg"
        >
          <div className="w-12 h-12 bg-sb-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-sb-primary" />
          </div>
          <h3 className="font-bold text-sb-on-surface mb-1">{featureName}</h3>
          <p className="text-sm text-sb-on-surface/60 mb-4">
            Disponible en el plan {requiredPlan} o superior
          </p>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sb-on-primary bg-sb-primary rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              <CreditCard className="w-4 h-4" />
              Mejorar Plan
            </button>
          )}
        </motion.div>
      </div>
      <div className="pointer-events-none opacity-50">
        {children}
      </div>
    </div>
  )
}
