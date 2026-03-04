import { router } from '@inertiajs/react'
import { useCallback, useState } from 'react'
import { EXERCISES_WITH_INERTIA_DRAFT, EXERCISE_SLUGS } from '../config/exercises'
import { apiService } from '../services/apiService'
import { analyzeExerciseResult } from '../services/geminiService'
import { Employee, ExerciseDraft, ExerciseResult, ExerciseType } from '../types'

export function useExercises(
  employee: Employee | null,
  onComplete: () => void,
  options?: {
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

      return await apiService.fetchExerciseDraft(employee.id, type)
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
        await router.post(`/dashboard/employees/${employee.id}/exercises/${slug}/draft`, draft, {
          preserveScroll: true,
          preserveState: true,
        })
      } else {
        // Fallback pour types non configurés (ex: futurs exercices).
        await apiService.saveExerciseDraft(draft)
      }
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

      const newResult: ExerciseResult = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        date: new Date().toISOString().split('T')[0],
        duration,
        data,
        quantitativeScore: quantScore,
        qualitativeAnalysis: analysis,
      }

      const updatedPlan = employee.plan.map((step) =>
        step.associatedExercise === type ? { ...step, completed: true, lastUpdated: now } : step
      )

      const slug = EXERCISE_SLUGS[type]
      if (slug) {
        await router.post(`/dashboard/employees/${employee.id}/exercises/${slug}/result`, {
          type,
          status: 'completed',
          date: newResult.date,
          duration,
          data,
          quantitativeScore: quantScore,
          qualitativeAnalysis: analysis,
          plan: updatedPlan.map((step) => ({
            id: step.id,
            completed: step.completed,
            lastUpdated: step.lastUpdated,
          })),
        })
      } else {
        // Fallback pour types non configurés.
        await apiService.saveExerciseResult(employee.id, newResult, updatedPlan)
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
