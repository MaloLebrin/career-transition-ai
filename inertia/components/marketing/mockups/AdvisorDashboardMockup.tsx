import { FileText } from 'lucide-react'
import { motion } from 'motion/react'
import React from 'react'
import { EXERCISE_LIST } from '#shared/constants/exercises'
import { useMockupStep } from '~/hooks/use_mockup_step'
import { MockupFrame } from './MockupFrame'

const NAV_ITEMS = ['Bureau', 'Candidats', 'Exercices', 'Synthèses']

/** Candidats fictifs : initiales seulement, progression en nombre d'exercices terminés. */
const CANDIDATES = [
  { initials: 'C. D.', from: 2, to: 5, className: 'bg-tint-lake text-tint-lake-ink' },
  { initials: 'A. M.', from: 5, to: 8, className: 'bg-tint-apricot text-tint-apricot-ink' },
  { initials: 'L. B.', from: 0, to: 3, className: 'bg-tint-lavender text-tint-lavender-ink' },
]

const TOTAL = EXERCISE_LIST.length

/**
 * Tableau de bord conseiller qui vit : les parcours des candidats avancent, l'un d'eux
 * termine, puis sa synthèse assistée arrive « à relire ».
 */
export const AdvisorDashboardMockup: React.FC<{ className?: string }> = ({ className }) => {
  const { ref, step } = useMockupStep(2, 1600)

  return (
    <MockupFrame ref={ref} title="Tableau de bord conseiller" className={className}>
      <div className="grid grid-cols-12 gap-4">
        <ul className="col-span-3 hidden space-y-1 sm:block">
          {NAV_ITEMS.map((item, index) => (
            <li
              key={item}
              className={`rounded-lg px-2.5 py-1.5 text-caption ${
                index === 1 ? 'bg-accent-soft text-accent' : 'text-muted'
              }`}
            >
              {item}
            </li>
          ))}
        </ul>
        <div className="col-span-12 space-y-3 sm:col-span-9">
          <p className="text-title-sm text-ink">Candidats</p>
          <ul className="divide-y divide-hairline rounded-xl border border-hairline">
            {CANDIDATES.map((candidate) => {
              const done = step >= 1 ? candidate.to : candidate.from
              const finished = done >= TOTAL
              return (
                <li key={candidate.initials} className="flex items-center gap-3 px-3 py-2.5">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-caption font-semibold ${candidate.className}`}
                  >
                    {candidate.initials.replace(/[.\s]/g, '')}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-ink">{candidate.initials}</span>
                      <span className="text-caption text-muted">
                        {done} / {TOTAL}
                      </span>
                    </span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-surface-soft">
                      <motion.span
                        className={`block h-full rounded-full ${finished ? 'bg-success' : 'bg-tint-lake-bold'}`}
                        initial={false}
                        animate={{ width: `${(done / TOTAL) * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
          <motion.div
            initial={false}
            animate={{ opacity: step >= 2 ? 1 : 0, y: step >= 2 ? 0 : 8 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-3 rounded-xl bg-ink px-3 py-2.5 text-on-ink"
          >
            <FileText className="h-4 w-4 text-accent-on-ink" />
            <span className="flex-1 text-sm font-medium">Synthèse de A. M. prête à relire</span>
          </motion.div>
        </div>
      </div>
    </MockupFrame>
  )
}
