"use client"

import * as React from "react"
import { motion } from "framer-motion"
import type { LucideIcon } from "@/components/ui/proicons"
import { Check, X, Sparkles } from "@/components/ui/proicons"
import { SbModal, SbModalBody, SbModalFooter } from "@/components/ui/sb"

export interface OnboardingStep {
  icon: LucideIcon
  title: string
  description: string
}

interface OnboardingModalProps {
  open: boolean
  onClose: () => void
  title: string
  description: string
  steps: OnboardingStep[]
  primaryLabel?: string
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
}

const stepItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const } },
}

export function OnboardingModal({
  open,
  onClose,
  title,
  description,
  steps,
  primaryLabel = "Entendido, ¡empezar!",
}: OnboardingModalProps) {
  return (
    <SbModal open={open} onClose={onClose} maxWidth="560px">
      <SbModalBody>
        <div className="relative overflow-hidden -mx-6 -mt-4 px-6 pt-6 pb-4 mb-4">
          <div className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full bg-sb-primary/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-40 w-40 rounded-full bg-blue-500/5 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sb-primary/10 to-sb-primary/20 flex items-center justify-center shrink-0 ring-1 ring-sb-outline-variant/10"
            >
              <Sparkles className="h-6 w-6 text-sb-primary" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-sb-on-surface leading-tight">{title}</h3>
              <p className="text-[13px] text-sb-on-surface-variant/60 mt-1 leading-snug">{description}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-sb-surface-container-high transition-colors shrink-0">
              <X className="h-4 w-4 text-sb-on-surface-variant/50" />
            </button>
          </div>
        </div>

        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.title}
                variants={stepItem}
                className="flex items-start gap-3 p-3 rounded-2xl bg-sb-surface-container-low hover:bg-sb-surface-container transition-colors"
              >
                <div className="h-9 w-9 rounded-xl bg-sb-surface-container-high flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-[18px] w-[18px] text-sb-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-sb-on-surface">{step.title}</p>
                  <p className="text-[12px] text-sb-on-surface-variant/60 mt-0.5 leading-snug">{step.description}</p>
                </div>
                <Check className="h-4 w-4 text-emerald-500 mt-1 shrink-0" />
              </motion.div>
            )
          })}
        </motion.div>
      </SbModalBody>
      <SbModalFooter>
        <button
          onClick={onClose}
          className="flex-1 h-11 rounded-2xl bg-sb-primary text-sb-on-primary text-[13px] font-semibold hover:opacity-90 transition-opacity"
        >
          {primaryLabel}
        </button>
      </SbModalFooter>
    </SbModal>
  )
}
