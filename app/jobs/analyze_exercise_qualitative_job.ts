import ExerciseResult from '#models/exercise_result'
import { resolveAiTextCompletionProvider } from '#services/ai/resolve_ai_text_provider'
import { exerciceResultStatusValues } from '#shared/constants/exercises'
import { buildAnalyzeExercisePrompt } from '#shared/helpers/ai/prompts/analyze_exercise'
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

    const provider = resolveAiTextCompletionProvider()
    const prompt = buildAnalyzeExercisePrompt(result.type, result.data)

    try {
      const text = await provider.completeText(prompt)
      result.qualitativeAnalysis = text
      await result.save()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error('AnalyzeExerciseQualitativeJob: échec IA', { exerciseResultId, message })
      result.qualitativeAnalysis = "Erreur lors de la génération de l'analyse."
      await result.save()
    }
  }
}
