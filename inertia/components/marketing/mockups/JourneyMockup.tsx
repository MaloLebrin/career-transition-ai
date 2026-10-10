import { B2C_FREE_EXERCISE_TYPES } from '#shared/constants/b2c'
import { EXERCISE_LIST } from '#shared/constants/exercises'
import { Check, FileText, Lock } from 'lucide-react'
import { motion } from 'motion/react'
import React from 'react'
import { useMockupStep } from '~/hooks/use_mockup_step'
import { exerciseIcon } from '../exercise_icons'
import { MARKETING_TINT_CYCLE, MARKETING_TINTS } from '../tints'
import { MockupFrame } from './MockupFrame'

const ROWS = EXERCISE_LIST.slice(0, 5)
const FREE = new Set<string>(B2C_FREE_EXERCISE_TYPES)

/**
 * Parcours d'exercices qui se complète sous les yeux : chaque exercice se coche à son tour,
 * puis la synthèse apparaît. Les noms viennent du catalogue réel (`EXERCISE_LIST`).
 */
export const JourneyMockup: React.FC<{ className?: string }> = ({ className }) => {
  const { ref, step } = useMockupStep(ROWS.length + 1)
  const done = Math.min(step, ROWS.length)

  return (
    <MockupFrame ref={ref} title="Mon parcours" className={className}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-title-sm text-ink">Mon parcours</p>
        <span className="text-caption text-muted" data-testid="journey-progress">
          {done} / {ROWS.length} terminés
        </span>
      </div>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-surface-soft">
        <motion.div
          className="h-full rounded-full bg-tint-meadow-bold"
          animate={{ width: `${(done / ROWS.length) * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <ul className="space-y-2">
        {ROWS.map((exercise, index) => {
          const Icon = exerciseIcon(exercise.slug)
          const tint = MARKETING_TINTS[MARKETING_TINT_CYCLE[index % MARKETING_TINT_CYCLE.length]]
          const isDone = index < done
          const isCurrent = index === done
          return (
            <li
              key={exercise.slug}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-300 ${
                isCurrent ? 'border-accent bg-accent-soft/40' : 'border-hairline'
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tint.surface} ${tint.ink}`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                {exercise.title}
              </span>
              {FREE.has(exercise.slug) && !isDone && (
                <span className="rounded-full bg-tint-sun px-2 py-0.5 text-caption text-tint-sun-ink">
                  Offert
                </span>
              )}
              {isDone ? (
                <motion.span
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-success text-on-ink"
                >
                  <Check className="h-3.5 w-3.5" />
                </motion.span>
              ) : (
                !FREE.has(exercise.slug) &&
                !isCurrent && <Lock className="h-4 w-4 text-muted-soft" />
              )}
            </li>
          )
        })}
      </ul>
      <motion.div
        className="mt-4 flex items-center gap-3 rounded-xl bg-ink px-4 py-3 text-on-ink"
        animate={{ opacity: step > ROWS.length ? 1 : 0.35, y: step > ROWS.length ? 0 : 6 }}
        transition={{ duration: 0.5 }}
      >
        <FileText className="h-5 w-5 text-accent-on-ink" />
        <span className="flex-1 text-sm font-medium">Synthèse de parcours</span>
        <span className="text-caption text-on-ink-soft">PDF</span>
      </motion.div>
    </MockupFrame>
  )
}
