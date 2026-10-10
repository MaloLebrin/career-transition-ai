import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import React, { useRef } from 'react'

export interface ParallaxProps {
  children: React.ReactNode
  className?: string
  /** Amplitude du décalage vertical, en pixels (de +offset à −offset pendant la traversée). */
  offset?: number
}

/** Léger décalage vertical lié au scroll (mockups, illustrations). Statique en mouvement réduit. */
export const Parallax: React.FC<ParallaxProps> = ({ children, className, offset = 40 }) => {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset])

  return (
    <motion.div ref={ref} className={className} style={reduce ? undefined : { y }}>
      {children}
    </motion.div>
  )
}
