import type { InitialDraftPromise } from '#shared/types/exercise/tool'
import { useCallback, useEffect, useRef, useState } from 'react'

/** Délai sans modification avant l'envoi du brouillon (#170). */
export const EXERCISE_DRAFT_DEBOUNCE_MS = 1500

/**
 * Attente maximale d'un brouillon modifié en continu : une saisie ininterrompue
 * est tout de même enregistrée toutes les 10 s (au plus 6 envois par minute).
 */
export const EXERCISE_DRAFT_MAX_WAIT_MS = 10_000

export type ExerciseDraftOptions<T> = {
  debounceMs?: number
  maxWaitMs?: number
  /** `false` : les modifications ne sont pas enregistrées (ex. étape hors brouillon). */
  enabled?: boolean
  /** Seule la première promesse reçue est lue : les pages en recréent une à chaque rendu. */
  initialDraftPromise?: InitialDraftPromise<T>
  /**
   * Appelée une seule fois quand le brouillon initial est connu (`null` sans brouillon).
   * L'état produit devient la référence : il n'est pas renvoyé au serveur.
   */
  onHydrate?: (data: Partial<T> | null) => void
}

export type ExerciseDraftControls = {
  /** Le brouillon initial a été appliqué : l'enregistrement automatique est actif. */
  hydrated: boolean
  /** Envoie tout de suite le brouillon en attente. */
  flush: () => void
  /** Abandonne le brouillon en attente (à appeler avant d'enregistrer le résultat final). */
  cancel: () => void
}

type Pending<T> = { data: T; key: string }

/**
 * Enregistrement automatique d'un brouillon d'exercice (#170) : envoi différé
 * (`debounceMs`, plafonné par `maxWaitMs`), dédoublonné par clé JSON, envoi du
 * brouillon en attente au démontage, hydratation unique depuis `initialDraftPromise`.
 */
export function useExerciseDraft<T>(
  data: T,
  save: (data: T) => unknown,
  options: ExerciseDraftOptions<T> = {}
): ExerciseDraftControls {
  const {
    debounceMs = EXERCISE_DRAFT_DEBOUNCE_MS,
    maxWaitMs = EXERCISE_DRAFT_MAX_WAIT_MS,
    enabled = true,
  } = options

  const saveRef = useRef(save)
  const dataRef = useRef(data)
  const onHydrateRef = useRef(options.onHydrate)
  const [initialDraftPromise] = useState(() => options.initialDraftPromise)
  const [hydrated, setHydrated] = useState(!initialDraftPromise)

  const lastSentKeyRef = useRef<string | null>(null)
  const pendingRef = useRef<Pending<T> | null>(null)
  const pendingSinceRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Déclaré avant l'effet de planification : les refs sont à jour quand il s'exécute.
  useEffect(() => {
    saveRef.current = save
    dataRef.current = data
    onHydrateRef.current = options.onHydrate
  })

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  const cancel = useCallback(() => {
    clearTimer()
    pendingRef.current = null
    pendingSinceRef.current = null
  }, [clearTimer])

  const flush = useCallback(() => {
    const pending = pendingRef.current
    cancel()
    if (!pending || pending.key === lastSentKeyRef.current) return
    lastSentKeyRef.current = pending.key
    try {
      Promise.resolve(saveRef.current(pending.data)).catch(() => {})
    } catch {
      // Un brouillon perdu ne doit jamais casser l'exercice : le suivant le rattrapera.
    }
  }, [cancel])

  // Hydratation unique : sans promesse, l'état initial sert directement de référence.
  useEffect(() => {
    if (!initialDraftPromise) {
      onHydrateRef.current?.(null)
      return
    }
    let cancelled = false
    initialDraftPromise
      .then(
        (draft) => draft?.data ?? null,
        () => null
      )
      .then((draftData) => {
        if (cancelled) return
        onHydrateRef.current?.(draftData)
        setHydrated(true)
      })
    return () => {
      cancelled = true
    }
  }, [initialDraftPromise])

  const key = JSON.stringify(data)
  useEffect(() => {
    if (!hydrated) return
    // Premier état après hydratation : il reflète ce que le serveur connaît déjà.
    if (lastSentKeyRef.current === null) {
      lastSentKeyRef.current = key
      return
    }
    if (!enabled) return
    if (key === lastSentKeyRef.current) {
      cancel()
      return
    }

    pendingRef.current = { data: dataRef.current, key }
    const now = Date.now()
    pendingSinceRef.current ??= now
    const remaining = maxWaitMs - (now - pendingSinceRef.current)
    clearTimer()
    timerRef.current = setTimeout(flush, Math.max(0, Math.min(debounceMs, remaining)))
  }, [key, hydrated, enabled, debounceMs, maxWaitMs, cancel, clearTimer, flush])

  // Démontage (navigation, retour) : le brouillon en attente part tout de suite.
  useEffect(() => flush, [flush])

  return { hydrated, flush, cancel }
}
