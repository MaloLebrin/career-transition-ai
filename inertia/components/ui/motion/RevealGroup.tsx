import { motion, useReducedMotion, type Variants } from 'motion/react'
import React from 'react'

export interface RevealGroupProps {
  children: React.ReactNode
  className?: string
  /** Écart entre deux `RevealItem` voisins, en secondes. */
  stagger?: number
  /** Retard avant le premier élément, en secondes. */
  delay?: number
}

/**
 * Groupe d'apparitions échelonnées au scroll : chaque `RevealItem` enfant entre à son tour,
 * une seule fois. Sous `prefers-reduced-motion`, rendu statique.
 */
export const RevealGroup: React.FC<RevealGroupProps> = ({
  children,
  className,
  stagger = 0.08,
  delay = 0,
}) => {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>

  const variants: Variants = {
    hidden: {},
    shown: { transition: { staggerChildren: stagger, delayChildren: delay } },
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.15 }}
      variants={variants}
    >
      {children}
    </motion.div>
  )
}
