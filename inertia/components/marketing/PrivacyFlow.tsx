import { Lock, Sparkles, UserRound, type LucideIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import React from 'react'

interface FlowNode {
  icon: LucideIcon
  title: string
  caption: string
  className: string
}

const NODES: FlowNode[] = [
  {
    icon: UserRound,
    title: 'Vos réponses',
    caption: 'Nom, e-mail, exercices',
    className: 'bg-tint-sky text-tint-sky-ink',
  },
  {
    icon: Lock,
    title: 'Pseudonymisation',
    caption: 'Nom et e-mail retirés',
    className: 'bg-tint-lake text-tint-lake-ink',
  },
  {
    icon: Sparkles,
    title: 'Analyse IA',
    caption: 'Sur des réponses anonymes',
    className: 'bg-tint-blossom text-tint-blossom-ink',
  },
]

const DOT_TRANSITION = (index: number) => ({
  duration: 1.6,
  repeat: Infinity,
  ease: 'easeInOut' as const,
  delay: index * 0.4,
})

/** Schéma du parcours des données avant l'IA : un flux animé entre trois étapes. */
export const PrivacyFlow: React.FC = () => {
  const reduce = useReducedMotion()

  return (
    <ol
      aria-label="Parcours de vos données avant l’analyse"
      className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
    >
      {NODES.map((node, index) => {
        const Icon = node.icon
        return (
          <React.Fragment key={node.title}>
            <li className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-hairline bg-surface p-4 text-center shadow-card">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-lg ${node.className}`}
                aria-hidden="true"
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-title-sm text-ink">{node.title}</span>
              <span className="text-caption text-muted">{node.caption}</span>
            </li>
            {index < NODES.length - 1 && (
              <li aria-hidden="true" className="relative mx-auto h-8 w-2 sm:h-2 sm:w-10">
                <span className="absolute inset-y-0 left-1/2 w-px bg-hairline sm:inset-x-0 sm:inset-y-auto sm:top-1/2 sm:left-0 sm:h-px sm:w-full" />
                {!reduce && (
                  <>
                    <motion.span
                      className="absolute left-0 h-2 w-2 rounded-full bg-accent sm:hidden"
                      animate={{ top: ['0%', '75%'], opacity: [0, 1, 0] }}
                      transition={DOT_TRANSITION(index)}
                    />
                    <motion.span
                      className="absolute top-0 hidden h-2 w-2 rounded-full bg-accent sm:block"
                      animate={{ left: ['0%', '80%'], opacity: [0, 1, 0] }}
                      transition={DOT_TRANSITION(index)}
                    />
                  </>
                )}
              </li>
            )}
          </React.Fragment>
        )
      })}
    </ol>
  )
}
