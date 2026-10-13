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

/** Colonne de l'icône : 2.75rem (h-11 / w-11), le connecteur se centre dessus. */
const ROW_CLASS = 'grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-x-4'

/**
 * Schéma du parcours des données avant l'IA : trois étapes empilées dans une
 * carte, reliées par un flux animé. Vertical à toutes les tailles : la colonne
 * qui l'accueille est trop étroite pour trois cartes côte à côte sans couper
 * « Pseudonymisation ».
 */
export const PrivacyFlow: React.FC = () => {
  const reduce = useReducedMotion()

  return (
    <ol
      aria-label="Parcours de vos données avant l’analyse"
      className="flex flex-col rounded-2xl border border-hairline bg-surface p-6 shadow-card"
    >
      {NODES.map((node, index) => {
        const Icon = node.icon
        return (
          <React.Fragment key={node.title}>
            <li className={ROW_CLASS}>
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-lg ${node.className}`}
                aria-hidden="true"
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-title-sm text-ink">{node.title}</span>
                <span className="text-caption text-muted">{node.caption}</span>
              </span>
            </li>
            {index < NODES.length - 1 && (
              <li aria-hidden="true" className={`${ROW_CLASS} h-8`}>
                <span className="relative h-full w-full">
                  <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-hairline" />
                  {!reduce && (
                    <motion.span
                      className="absolute left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-accent"
                      animate={{ top: ['0%', '75%'], opacity: [0, 1, 0] }}
                      transition={DOT_TRANSITION(index)}
                    />
                  )}
                </span>
              </li>
            )}
          </React.Fragment>
        )
      })}
    </ol>
  )
}
