import { animate, useInView, useReducedMotion } from 'motion/react'
import React, { useEffect, useRef, useState } from 'react'

export interface CountUpProps {
  value: number
  /** Mise en forme de la valeur (défaut : entier en français). */
  format?: (value: number) => string
  /** Durée du comptage, en secondes. */
  duration?: number
  className?: string
}

const formatInteger = (value: number) => Math.round(value).toLocaleString('fr-FR')

/**
 * Chiffre clé qui compte de 0 à sa valeur quand il entre dans la fenêtre. La valeur finale
 * est rendue d'emblée (SSR, lecteurs d'écran, `prefers-reduced-motion`) ; le comptage ne
 * démarre qu'une fois, au scroll.
 */
export const CountUp: React.FC<CountUpProps> = ({
  value,
  format = formatInteger,
  duration = 1.2,
  className = '',
}) => {
  const ref = useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const [current, setCurrent] = useState<number | null>(null)

  useEffect(() => {
    if (reduce || !inView) return
    const controls = animate(0, value, {
      duration,
      ease: 'easeOut',
      onUpdate: setCurrent,
      onComplete: () => setCurrent(null),
    })
    return () => controls.stop()
  }, [inView, reduce, value, duration])

  return (
    <span ref={ref} className={`tabular-nums ${className}`.trim()}>
      {format(current ?? value)}
    </span>
  )
}
