import { buildCompletedPlanPayload, buildExerciseEndpoint } from '#shared/helpers/exercise_hooks'
import { router } from '@inertiajs/react'
import { useCallback, useRef, useState } from 'react'
import { Employee } from '~/types/employee'
import { EXERCISES_WITH_INERTIA_DRAFT, EXERCISE_SLUGS } from '../config/exercises'
import { ExerciseDraft, ExerciseType } from '../types'

type RequestPayload = NonNullable<Parameters<typeof router.post>[1]>
type PostOptions = NonNullable<Parameters<typeof router.post>[2]>

export type InertiaPostOutcome =
  | { status: 'success' }
  | { status: 'error'; errors: Record<string, string> }
  | { status: 'cancelled' }

/**
 * `router.post` en promesse (#170). La promesse se résout toujours dans `onFinish` :
 * une visite annulée ou interrompue ne la laisse jamais en attente.
 */
export function inertiaPost(
  url: string,
  data: RequestPayload,
  options: PostOptions = {}
): Promise<InertiaPostOutcome> {
  return new Promise((resolve) => {
    let outcome: InertiaPostOutcome = { status: 'cancelled' }
    router.post(url, data, {
      ...options,
      onSuccess: (page) => {
        outcome = { status: 'success' }
        return options.onSuccess?.(page)
      },
      onError: (errors) => {
        outcome = { status: 'error', errors }
        options.onError?.(errors)
      },
      onFinish: (visit) => {
        options.onFinish?.(visit)
        resolve(outcome)
      },
    })
  })
}

export type UseExercisesOptions = {
  employee: Employee | null
  /** Ex. `/dashboard/candidat/exercises` ou `/dashboard/conseiller/employees/:id/exercises`. */
  basePath: string
  onComplete: () => Promise<void> | void
}

/**
 * Enregistrement des exercices (brouillon et résultat final), candidat comme
 * conseiller : seul `basePath` change (#170).
 */
export function useExercises({ employee, basePath, onComplete }: UseExercisesOptions) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const draftsInFlight = useRef(0)

  const saveDraft = useCallback(
    async (type: ExerciseType, data: unknown) => {
      const slug = EXERCISE_SLUGS[type]
      if (!employee || !slug || !EXERCISES_WITH_INERTIA_DRAFT.has(type)) return

      const draft: ExerciseDraft = {
        employeeId: String(employee.id),
        type,
        lastUpdated: new Date().toISOString(),
        data,
      }
      draftsInFlight.current += 1
      setIsSavingDraft(true)
      // Visite asynchrone : un brouillon n'interrompt jamais le résultat final ni une navigation.
      await inertiaPost(
        buildExerciseEndpoint(basePath, slug, 'draft'),
        { ...draft },
        {
          async: true,
          preserveScroll: true,
          preserveState: true,
        }
      )
      draftsInFlight.current -= 1
      if (draftsInFlight.current === 0) setIsSavingDraft(false)
    },
    [employee, basePath]
  )

  const saveResult = useCallback(
    async (type: ExerciseType, data: unknown, quantScore: number, duration: number) => {
      const slug = EXERCISE_SLUGS[type]
      if (!employee || !slug) return

      setIsAnalyzing(true)
      const now = new Date().toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      const outcome = await inertiaPost(buildExerciseEndpoint(basePath, slug, 'result'), {
        type,
        status: 'completed',
        date: new Date().toISOString().split('T')[0],
        duration,
        data: data as never,
        quantitativeScore: quantScore,
        qualitativeAnalysis: '',
        plan: buildCompletedPlanPayload(employee.plan ?? [], type, now),
      })
      try {
        if (outcome.status === 'success') await onComplete()
      } finally {
        setIsAnalyzing(false)
      }
    },
    [employee, basePath, onComplete]
  )

  return { isAnalyzing, isSavingDraft, saveResult, saveDraft }
}
