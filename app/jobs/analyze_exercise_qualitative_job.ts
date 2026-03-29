import ExerciseResult from '#models/exercise_result'
import { resolveAiTextCompletionProvider } from '#services/ai/resolve_ai_text_provider'
import { exerciceResultStatusValues } from '#shared/constants/exercises'
import logger from '@adonisjs/core/services/logger'
import { Job } from '@adonisjs/queue'
import type { JobOptions } from '@adonisjs/queue/types'

export interface AnalyzeExerciseQualitativePayload {
  exerciseResultId: number
}

function buildPrompt(type: string, data: unknown): string {
  return `Analyse professionnelle pour un accompagnement carrière : ${type}. Données : ${JSON.stringify(data)}.
  Produis une analyse courte (max 4 phrases), encourageante, vitaminée, avec un conseil concret basé sur les données reçues. 
  Sois expert et bienveillant.`
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
    const prompt = buildPrompt(result.type, result.data)

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
