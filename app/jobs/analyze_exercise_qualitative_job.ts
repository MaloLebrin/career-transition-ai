import Employee from '#models/employee'
import ExerciseResult from '#models/exercise_result'
import { resolveAiTextCompletionProvider } from '#services/ai/resolve_ai_text_provider'
import { exerciceResultStatusValues } from '#shared/constants/exercises'
import { buildEmployeeAiProfile } from '#shared/helpers/ai/exercise_profile'
import { buildQualitativePromptForExerciseType } from '#shared/helpers/ai/prompts/exercises/index'
import logger from '@adonisjs/core/services/logger'
import { Job } from '@adonisjs/queue'
import type { JobOptions } from '@adonisjs/queue/types'

export interface AnalyzeExerciseQualitativePayload {
  exerciseResultId: number
}

export default class AnalyzeExerciseQualitativeJob extends Job<AnalyzeExerciseQualitativePayload> {
  static options: JobOptions = {
    queue: 'ai',
    maxRetries: 2,
  }

  async execute() {
    const { exerciseResultId } = this.payload
    const result = await ExerciseResult.find(exerciseResultId)

    if (!result) {
      logger.warn('AnalyzeExerciseQualitativeJob: exercise_result introuvable', {
        exerciseResultId,
      })
      return
    }

    if (result.status !== exerciceResultStatusValues.COMPLETED) {
      logger.warn('AnalyzeExerciseQualitativeJob: ignoré (exercice non terminé)', {
        exerciseResultId,
        status: result.status,
      })
      return
    }

    const employee = await Employee.query()
      .where('id', result.employeeId)
      .preload('experiences')
      .preload('educations')
      .preload('skills', (q) => q.pivotColumns(['level']))
      .first()

    if (!employee) {
      logger.warn('AnalyzeExerciseQualitativeJob: employee introuvable', {
        exerciseResultId,
        employeeId: result.employeeId,
      })
      return
    }

    const provider = resolveAiTextCompletionProvider()
    const profile = buildEmployeeAiProfile(employee as any)
    const prompt = buildQualitativePromptForExerciseType(result.type, {
      profile,
      exerciseData: result.data,
    })

    try {
      const text = await provider.completeText(prompt)
      result.qualitativeAnalysis = text
      await result.save()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(error)
      logger.error('AnalyzeExerciseQualitativeJob: échec IA', { exerciseResultId, message })
      result.qualitativeAnalysis = "Erreur lors de la génération de l'analyse."
      await result.save()
    } finally {
      logger.info('AnalyzeExerciseQualitativeJob: terminé', { exerciseResultId })
    }
  }
}
