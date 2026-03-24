import { router } from '@inertiajs/react'
import { useCallback, useState } from 'react'
import {
  buildCompletedPlanPayload,
  buildExerciseEndpoint,
  resolveExerciseAnalysis,
} from '#shared/helpers/exercise_hooks'
import { EXERCISES_WITH_INERTIA_DRAFT, EXERCISE_SLUGS } from '../config/exercises'
import { analyzeExerciseResult } from '../services/geminiService'
import { Employee, ExerciseDraft, ExerciseType } from '../types'

type UseExercisesOptions = {
  exercisesBasePath?: string
  motivation?: { initialDraft?: ExerciseDraft | null }
  values?: { initialDraft?: ExerciseDraft | null }
  personality?: { initialDraft?: ExerciseDraft | null }
  lifeCurve?: { initialDraft?: ExerciseDraft | null }
  targeting?: { initialDraft?: ExerciseDraft | null }
  disc?: { initialDraft?: ExerciseDraft | null }
  skillMapping?: { initialDraft?: ExerciseDraft | null }
  circleOfControl?: { initialDraft?: ExerciseDraft | null }
}

export function useAdvisorExercises(
  employee: Employee | null,
  onComplete: () => Promise<void> | void,
  options?: UseExercisesOptions
) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const basePath =
    options?.exercisesBasePath ??
    (employee
      ? `/dashboard/conseiller/employees/${employee.id}/exercises`
      : '/dashboard/conseiller/exercises')

  const loadDraft = useCallback(
    async (type: ExerciseType) => {
      if (!employee) return null
      if (type === ExerciseType.MOTIVATION) return options?.motivation?.initialDraft ?? null
      if (type === ExerciseType.VALUES) return options?.values?.initialDraft ?? null
      if (type === ExerciseType.PERSONALITY) return options?.personality?.initialDraft ?? null
      if (type === ExerciseType.LIFE_CURVE) return options?.lifeCurve?.initialDraft ?? null
      if (type === ExerciseType.TARGETING) return options?.targeting?.initialDraft ?? null
      if (type === ExerciseType.DISC) return options?.disc?.initialDraft ?? null
      if (type === ExerciseType.SKILL_MAPPING) return options?.skillMapping?.initialDraft ?? null
      if (type === ExerciseType.CIRCLE_OF_CONTROL) {
        return options?.circleOfControl?.initialDraft ?? null
      }
      return null
    },
    [employee, options]
  )

  const saveDraft = async (type: ExerciseType, data: unknown) => {
    if (!employee) return
    setIsSavingDraft(true)
    try {
      const draft: ExerciseDraft = {
        employeeId: String(employee.id),
        type,
        lastUpdated: new Date().toISOString(),
        data,
      }
      const slug = EXERCISE_SLUGS[type]
      if (slug && EXERCISES_WITH_INERTIA_DRAFT.has(type)) {
        await router.post(buildExerciseEndpoint(basePath, slug, 'draft'), draft as any, {
          preserveScroll: true,
          preserveState: true,
        })
      }
    } catch (err) {
      console.error('Draft save error:', err)
    } finally {
      setIsSavingDraft(false)
    }
  }

  const saveResult = async (type: ExerciseType, data: unknown, quantScore: number, duration: number) => {
    if (!employee) return

    setIsAnalyzing(true)
    try {
      const slug = EXERCISE_SLUGS[type]
      const endpoint = slug ? buildExerciseEndpoint(basePath, slug, 'result') : null
      const analysis = await resolveExerciseAnalysis(type, data, analyzeExerciseResult)
      const now = new Date().toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })

      if (endpoint) {
        await router.post(endpoint, {
          type,
          status: 'completed',
          date: new Date().toISOString().split('T')[0],
          duration,
          data,
          quantitativeScore: quantScore,
          qualitativeAnalysis: analysis,
          plan: buildCompletedPlanPayload(employee.plan ?? [], type, now),
        })
      }
      await onComplete()
    } catch (err) {
      console.error('Exercise save error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return { isAnalyzing, isSavingDraft, saveResult, saveDraft, loadDraft }
}
