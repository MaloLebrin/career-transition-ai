import { useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

/**
 * Étape courante d'un mockup vivant : avance de 0 à `steps` toutes les `interval` ms tant
 * que le mockup est visible, marque une pause sur l'état final puis recommence. En mouvement
 * réduit (et en test), renvoie directement l'état final.
 */
export function useMockupStep<T extends Element = HTMLDivElement>(steps: number, interval = 1200) {
  const ref = useRef<T>(null)
  const reduce = useReducedMotion()
  const inView = useInView(ref, { amount: 0.3 })
  const [step, setStep] = useState(reduce ? steps : 0)

  useEffect(() => {
    if (reduce) {
      setStep(steps)
      return
    }
    if (!inView) return
    const timer = window.setInterval(() => {
      setStep((current) => (current >= steps + 2 ? 0 : current + 1))
    }, interval)
    return () => window.clearInterval(timer)
  }, [reduce, inView, steps, interval])

  return { ref, step: Math.min(step, steps), animated: !reduce }
}
