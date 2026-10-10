import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import React from 'react'

export interface TiltCardProps {
  children: React.ReactNode
  className?: string
  /** Inclinaison maximale, en degrés. */
  max?: number
}

const SPRING = { stiffness: 220, damping: 22 }

/**
 * Carte qui s'incline vers le pointeur au survol (souris seulement : rien au toucher ni en
 * mouvement réduit), puis revient à plat.
 */
export const TiltCard: React.FC<TiltCardProps> = ({ children, className, max = 5 }) => {
  const reduce = useReducedMotion()
  const rotateX = useSpring(useMotionValue(0), SPRING)
  const rotateY = useSpring(useMotionValue(0), SPRING)

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || event.pointerType !== 'mouse') return
    const rect = event.currentTarget.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    rotateY.set(x * max * 2)
    rotateX.set(-y * max * 2)
  }

  const reset = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.div
      className={className}
      data-tilt
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
    >
      {children}
    </motion.div>
  )
}
