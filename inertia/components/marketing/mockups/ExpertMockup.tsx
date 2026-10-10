import { motion } from 'motion/react'
import React from 'react'
import { useMockupStep } from '~/hooks/use_mockup_step'
import { MockupFrame } from './MockupFrame'

const MESSAGES = [
  { from: 'me', text: 'J’aimerais être accompagné pour la suite de mon parcours.' },
  {
    from: 'expert',
    text: 'Avec plaisir. J’ai lu votre synthèse : vos motivations sont très claires.',
  },
  { from: 'expert', text: 'Je vous propose un premier échange sur vos pistes de ciblage.' },
]

/** Demande d'accompagnement : un fil de messages qui s'écrit avec l'expert. */
export const ExpertMockup: React.FC<{ className?: string }> = ({ className }) => {
  const { ref, step } = useMockupStep(MESSAGES.length, 1300)

  return (
    <MockupFrame ref={ref} title="Accompagnement" className={className}>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tint-lavender font-display text-sm font-bold text-tint-lavender-ink">
          EX
        </span>
        <div>
          <p className="text-title-sm text-ink">Votre expert</p>
          <p className="text-caption text-success">Assigné à votre parcours</p>
        </div>
      </div>
      <ul className="space-y-2.5">
        {MESSAGES.map((message, index) => (
          <motion.li
            key={index}
            initial={false}
            animate={{ opacity: step > index ? 1 : 0, y: step > index ? 0 : 8 }}
            transition={{ duration: 0.4 }}
            className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
              message.from === 'me'
                ? 'ml-auto bg-primary text-on-primary'
                : 'bg-surface-soft text-ink-soft'
            }`}
          >
            {message.text}
          </motion.li>
        ))}
      </ul>
    </MockupFrame>
  )
}
