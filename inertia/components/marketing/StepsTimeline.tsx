import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react'
import React, { useRef } from 'react'
import { RevealGroup } from '~/components/ui/motion/RevealGroup'
import { RevealItem } from '~/components/ui/motion/RevealItem'

export interface TimelineStep {
  title: string
  description: string
}

/** Étapes numérotées le long d'une ligne qui se trace au fil du scroll. */
export const StepsTimeline: React.FC<{ steps: TimelineStep[] }> = ({ steps }) => {
  const ref = useRef<HTMLOListElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 60%'] })
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  return (
    <div className="relative">
      <span className="absolute top-2 bottom-2 left-5 w-px bg-hairline" aria-hidden="true" />
      <motion.span
        className="absolute top-2 bottom-2 left-5 w-px origin-top bg-accent"
        style={{ scaleY: reduce ? 1 : progress }}
        aria-hidden="true"
      />
      <RevealGroup stagger={0.15}>
        <ol ref={ref} className="relative space-y-10">
          {steps.map((step, index) => (
            <li key={step.title}>
              <RevealItem className="flex gap-5">
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline bg-surface font-display text-sm font-bold text-ink shadow-card">
                  {index + 1}
                </span>
                <div className="space-y-1 pt-1.5">
                  <h3 className="text-title-md">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{step.description}</p>
                </div>
              </RevealItem>
            </li>
          ))}
        </ol>
      </RevealGroup>
    </div>
  )
}
