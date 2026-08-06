'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, CreditCard, Zap, Building2, Star, Gem } from "@/components/ui/proicons"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan?: string
}

const plans = [
  {
    name: 'Free',
    price: 0,
    icon: <Star className="w-5 h-5" />,
    features: [
      'Calificaciones',
      'Asistencia digital',
      'Gestión de documentos',
      'Portal de padres',
      'Hasta 50 estudiantes'
    ],
    color: 'border-sb-on-surface/20'
  },
  {
    name: 'Básico',
    price: 149,
    icon: <Zap className="w-5 h-5" />,
    features: [
      'Todo del plan Free',
      'Certificados digitales',
      'Chat en tiempo real',
      'Importación masiva',
      'Hasta 200 estudiantes'
    ],
    color: 'border-blue-500'
  },
  {
    name: 'Pro',
    price: 449,
    icon: <CreditCard className="w-5 h-5" />,
    popular: true,
    features: [
      'Todo del plan Básico',
      'Clases virtuales (Zoom/Meet)',
      'Asistente IA del secretario',
      'Carnets PDF descargables',
      'Exportación de reportes',
      'Hasta 500 estudiantes'
    ],
    color: 'border-sb-primary'
  },
  {
    name: 'Enterprise',
    price: null,
    icon: <Building2 className="w-5 h-5" />,
    features: [
      'Todo del plan Pro',
      'API de acceso',
      'White label',
      'Soporte prioritario',
      'Estudiantes ilimitados'
    ],
    color: 'border-amber-500'
  },
  {
    name: 'Diamante',
    price: 1499,
    icon: <Gem className="w-5 h-5" />,
    features: [
      'Todo del plan Enterprise',
      'Alumnos y docentes ilimitados',
      'Certificados digitales',
      'Clases virtuales (Zoom/Meet)',
      'Asistente IA del secretario',
      'Chat en tiempo real',
      'Carnets PDF descargables',
      'Importación masiva',
      'Exportación de reportes',
      'API de acceso',
      'White label',
      'Soporte prioritario',
      'Integraciones custom'
    ],
    color: 'border-cyan-500'
  }
]

export function UpgradeModal({ isOpen, onClose, currentPlan }: UpgradeModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-sb-surface rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-sb-on-surface/10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-sb-on-surface">Mejora tu Plan</h2>
                <p className="text-sb-on-surface/60 mt-1">Desbloquea todas las funcionalidades</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-sb-on-surface/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-sb-on-surface" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl border-2 p-5 ${
                    plan.popular ? 'border-sb-primary bg-sb-primary/5' : plan.color
                  } ${currentPlan === plan.name ? 'ring-2 ring-sb-primary ring-offset-2' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-sb-on-primary bg-sb-primary text-xs font-medium rounded-full">
                      Popular
                    </div>
                  )}
                  {currentPlan === plan.name && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                      Actual
                    </div>
                  )}

                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                    plan.popular ? 'text-sb-on-primary bg-sb-primary' : 'bg-sb-on-surface/10 text-sb-on-surface'
                  }`}>
                    {plan.icon}
                  </div>

                  <h3 className="font-bold text-sb-on-surface text-lg">{plan.name}</h3>
                  <div className="mt-2 mb-4">
                    {plan.price !== null ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-sb-on-surface">${plan.price}</span>
                        <span className="text-sb-on-surface/60">/mes</span>
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-sb-on-surface">Personalizado</div>
                    )}
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-sb-on-surface/80">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`w-full py-2.5 rounded-xl font-medium transition-colors ${
                      currentPlan === plan.name
                        ? 'bg-sb-on-surface/10 text-sb-on-surface/50 cursor-not-allowed'
                        : plan.popular
                          ? 'text-sb-on-primary bg-sb-primary hover:opacity-90'
                          : 'bg-sb-on-surface/10 text-sb-on-surface hover:bg-sb-on-surface/20'
                    }`}
                    disabled={currentPlan === plan.name}
                  >
                    {currentPlan === plan.name ? 'Plan Actual' : 'Seleccionar'}
                  </button>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-sb-on-surface/10 text-center">
              <p className="text-sm text-sb-on-surface/60">
                ¿Necesitas algo especial? Contacta a soporte para un plan personalizado.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
