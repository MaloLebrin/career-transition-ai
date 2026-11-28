import { useCallback, useRef, useState } from 'react'

export type ExerciseTimer = {
  /** (Re)démarre le chronomètre maintenant. */
  restart: () => void
  /** Secondes écoulées depuis le démarrage, 0 s'il n'a pas démarré. */
  elapsedSeconds: () => number
}

/**
 * Durée passée sur un exercice (#170), envoyée avec le résultat final.
 * `autoStart: false` : le chronomètre attend `restart()` (ex. écran d'accueil).
 */
export function useExerciseTimer({
  autoStart = true,
}: { autoStart?: boolean } = {}): ExerciseTimer {
  const [startedAt] = useState(() => (autoStart ? Date.now() : null))
  const startRef = useRef<number | null>(startedAt)

  const restart = useCallback(() => {
    startRef.current = Date.now()
  }, [])

  const elapsedSeconds = useCallback(() => {
    if (startRef.current === null) return 0
    return Math.max(0, Math.floor((Date.now() - startRef.current) / 1000))
  }, [])

  return { restart, elapsedSeconds }
}
