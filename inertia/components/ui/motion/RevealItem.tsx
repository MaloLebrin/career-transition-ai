import { motion, useReducedMotion, type Variants } from 'motion/react'
import React from 'react'

export interface RevealItemProps {
  children: React.ReactNode
  className?: string
}

const VARIANTS: Variants = {
  hidden: { opacity: 0, y: 20 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] } },
}

/** Élément d'un `RevealGroup` : fondu et glissement vers le haut quand le groupe entre. */
export const RevealItem: React.FC<RevealItemProps> = ({ children, className }) => {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>

  return (
    <motion.div className={className} variants={VARIANTS}>
      {children}
    </motion.div>
  )
}
