import { Download } from 'lucide-react'
import { motion } from 'motion/react'
import React from 'react'
import { useMockupStep } from '~/hooks/use_mockup_step'
import { MockupFrame } from './MockupFrame'

const BARS = [
  { label: 'Défi', value: 88, className: 'bg-tint-apricot-bold' },
  { label: 'Autonomie', value: 76, className: 'bg-tint-lake-bold' },
  { label: 'Reconnaissance', value: 64, className: 'bg-tint-lavender-bold' },
  { label: 'Sécurité', value: 42, className: 'bg-tint-sun-bold' },
  { label: 'Relations', value: 35, className: 'bg-tint-blossom-bold' },
]

/** Synthèse de parcours : les barres de motivations montent, puis l'export PDF est prêt. */
export const SynthesisMockup: React.FC<{ className?: string }> = ({ className }) => {
  const { ref, step } = useMockupStep(2, 1400)

  return (
    <MockupFrame ref={ref} title="Synthèse de parcours" className={className}>
      <p className="mb-4 text-title-sm text-ink">Ce qui vous fait avancer</p>
      <ul className="space-y-3">
        {BARS.map((bar, index) => (
          <li key={bar.label} className="grid grid-cols-[7rem_1fr] items-center gap-3">
            <span className="truncate text-sm text-ink-soft">{bar.label}</span>
            <span className="h-3 overflow-hidden rounded-full bg-surface-soft">
              <motion.span
                className={`block h-full rounded-full ${bar.className}`}
                initial={false}
                animate={{ width: step >= 1 ? `${bar.value}%` : '4%' }}
                transition={{ duration: 0.8, delay: index * 0.08, ease: 'easeOut' }}
              />
            </span>
          </li>
        ))}
      </ul>
      <motion.div
        initial={false}
        animate={{ opacity: step >= 2 ? 1 : 0.3 }}
        className="mt-5 flex items-center justify-between rounded-xl bg-surface-soft px-4 py-3"
      >
        <span className="text-sm font-medium text-ink">synthese-parcours.pdf</span>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
          <Download className="h-4 w-4" />
          Prêt
        </span>
      </motion.div>
    </MockupFrame>
  )
}
