import { router } from '@inertiajs/react'
import { useCallback, useState } from 'react'
import { EXERCISES_WITH_INERTIA_DRAFT, EXERCISE_SLUGS } from '../config/exercises'
import { analyzeExerciseResult } from '../services/geminiService'
import { Employee, ExerciseDraft, ExerciseResult, ExerciseType } from '../types'

export function useExercises(
  employee: Employee | null,
  onComplete: () => void,
  options?: {
    /** Base URL for draft/result (e.g. /dashboard/candidat/exercises or /dashboard/conseiller/employees/:id/exercises). If not set, uses /dashboard/employees/:id/exercises. */
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
) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const basePath =
    options?.exercisesBasePath ??
    (employee
      ? `/dashboard/conseiller/employees/${employee.id}/exercises`
      : '/dashboard/candidat/exercises')

  const loadDraft = useCallback(
    async (type: ExerciseType) => {
      if (!employee) return null

      if (type === ExerciseType.MOTIVATION && options?.motivation?.initialDraft) {
        return options.motivation.initialDraft
      }
      if (type === ExerciseType.VALUES && options?.values?.initialDraft) {
        return options.values.initialDraft
      }
      if (type === ExerciseType.PERSONALITY && options?.personality?.initialDraft) {
        return options.personality.initialDraft
      }
      if (type === ExerciseType.LIFE_CURVE && options?.lifeCurve?.initialDraft) {
        return options.lifeCurve.initialDraft
      }
      if (type === ExerciseType.TARGETING && options?.targeting?.initialDraft) {
        return options.targeting.initialDraft
      }
      if (type === ExerciseType.DISC && options?.disc?.initialDraft) {
        return options.disc.initialDraft
      }
      if (type === ExerciseType.SKILL_MAPPING && options?.skillMapping?.initialDraft) {
        return options.skillMapping.initialDraft
      }
      if (type === ExerciseType.CIRCLE_OF_CONTROL && options?.circleOfControl?.initialDraft) {
        return options.circleOfControl.initialDraft
      }

      // Les brouillons sont désormais passés via props initiales (Inertia).
      // On évite les fetchs asynchrones ici.
      return null
    },
    [employee, options]
  )

  const saveDraft = async (type: ExerciseType, data: any) => {
    if (!employee) return
    setIsSavingDraft(true)
    try {
      const draft: ExerciseDraft = {
        employeeId: employee.id,
        type,
        lastUpdated: new Date().toISOString(),
        data,
      }
      const slug = EXERCISE_SLUGS[type]
      if (slug && EXERCISES_WITH_INERTIA_DRAFT.has(type)) {
        await router.post(`${basePath}/${slug}/draft`, draft as any, {
          preserveScroll: true,
          preserveState: true,
        })
      }
      // Fallback retiré : tout passe par Inertia.
    } catch (err) {
      console.error('Draft save error:', err)
    } finally {
      setIsSavingDraft(false)
    }
  }

  const saveResult = async (
    type: ExerciseType,
    data: any,
    quantScore: number,
    duration: number
  ) => {
    if (!employee) return

    setIsAnalyzing(true)
    try {
      const analysis = await analyzeExerciseResult(type, data)
      const now = new Date().toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })

      const slug = EXERCISE_SLUGS[type]
      if (slug) {
        await router.post(`${basePath}/${slug}/result`, {
          type,
          status: 'completed',
          date: new Date().toISOString().split('T')[0],
          duration,
          data,
          quantitativeScore: quantScore,
          qualitativeAnalysis: analysis,
          plan: employee.plan
            .map((step) =>
              step.associatedExercises?.includes(type)
                ? { ...step, completed: true, lastUpdated: now }
                : step
            )
            .map((step) => ({
              id: step.id,
              completed: step.completed,
              lastUpdated: step.lastUpdated,
            })),
        })
      }
      onComplete()
    } catch (err) {
      console.error('Exercise save error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return { isAnalyzing, isSavingDraft, saveResult, saveDraft, loadDraft }
}
