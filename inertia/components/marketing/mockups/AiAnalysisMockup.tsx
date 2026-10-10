import { Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import React from 'react'
import { useMockupStep } from '~/hooks/use_mockup_step'
import { MockupFrame } from './MockupFrame'

const LINES = ['w-full', 'w-11/12', 'w-4/5', 'w-full', 'w-2/3']
const THEMES = [
  { label: 'Autonomie', className: 'bg-tint-lake text-tint-lake-ink' },
  { label: 'Apprentissage', className: 'bg-tint-lavender text-tint-lavender-ink' },
  { label: 'Utilité sociale', className: 'bg-tint-meadow text-tint-meadow-ink' },
]

export interface AiAnalysisMockupProps {
  className?: string
  /** Mettre en scène la relecture par le conseiller (espace cabinet). */
  reviewed?: boolean
}

/** Analyse IA qui s'écrit ligne à ligne, puis ses thèmes saillants (et la validation conseiller). */
export const AiAnalysisMockup: React.FC<AiAnalysisMockupProps> = ({ className, reviewed }) => {
  const total = LINES.length + THEMES.length + (reviewed ? 1 : 0)
  const { ref, step } = useMockupStep(total, 700)

  return (
    <MockupFrame ref={ref} title="Analyse · Motivations" className={className}>
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-tint-blossom text-tint-blossom-ink">
          <Sparkles className="h-4 w-4" />
        </span>
        <p className="text-title-sm text-ink">Lecture assistée par l’IA</p>
      </div>
      <div className="space-y-2.5">
        {LINES.map((width, index) => (
          <div key={index} className="h-2.5 overflow-hidden rounded-full bg-surface-soft">
            <motion.div
              className={`h-full rounded-full bg-hairline-strong ${width}`}
              initial={false}
              animate={{ scaleX: step > index ? 1 : 0 }}
              style={{ originX: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {THEMES.map((theme, index) => (
          <motion.span
            key={theme.label}
            initial={false}
            animate={{
              opacity: step > LINES.length + index ? 1 : 0,
              y: step > LINES.length + index ? 0 : 6,
            }}
            className={`rounded-full px-3 py-1 text-caption ${theme.className}`}
          >
            {theme.label}
          </motion.span>
        ))}
      </div>
      {reviewed && (
        <motion.div
          initial={false}
          animate={{ opacity: step >= total ? 1 : 0 }}
          className="mt-5 flex items-center gap-2 rounded-xl border border-success/30 bg-success-soft px-3 py-2 text-sm text-success"
        >
          <span className="h-2 w-2 rounded-full bg-success" />
          Relue et validée par votre conseiller
        </motion.div>
      )}
    </MockupFrame>
  )
}
