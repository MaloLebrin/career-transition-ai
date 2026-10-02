import Employee from '#models/employee'
import ExerciseResult from '#models/exercise_result'
import { resolveAiTextCompletionProvider } from '#services/ai/resolve_ai_text_provider'
import { CandidateNotificationsService } from '#services/candidate_notifications_service'
import { NotificationService } from '#services/notification_service'
import { exerciceResultStatusValues } from '#shared/constants/exercises'
import { NOTIFICATION_TYPES } from '#shared/constants/notifications'
import { buildEmployeeAiProfile, pseudonymizeForAi } from '#shared/helpers/ai/exercise_profile'
import { buildQualitativePromptForExerciseType } from '#shared/helpers/ai/prompts/exercises/index'
import { QUEUE_NAMES } from '#utils/queues/queue_names'
import logger from '@adonisjs/core/services/logger'
import { Job } from '@adonisjs/queue'
import type { JobOptions } from '@adonisjs/queue/types'

export interface AnalyzeExerciseQualitativePayload {
  exerciseResultId: number
}

export default class AnalyzeExerciseQualitativeJob extends Job<AnalyzeExerciseQualitativePayload> {
  static options: JobOptions = {
    queue: QUEUE_NAMES.ai,
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
    // Données pseudonymisées avant envoi au fournisseur IA (RGPD, docs/RGPD.md) :
    // ni nom ni e-mail du candidat dans le prompt, y compris dans le texte libre.
    const identity = { name: employee.name, email: employee.email }
    const prompt = buildQualitativePromptForExerciseType(result.type, {
      profile: pseudonymizeForAi(buildEmployeeAiProfile(employee as any), identity),
      exerciseData: pseudonymizeForAi(result.data, identity),
    })

    try {
      const text = await provider.completeText(prompt)
      result.qualitativeAnalysis = text
      await result.save()

      const notifService = new NotificationService()
      if (employee.advisorId) {
        await notifService.notify({
          userId: employee.advisorId,
          type: NOTIFICATION_TYPES.AI_SYNTHESIS_READY,
          title: `Analyse IA disponible : ${employee.name}`,
          body: `L'analyse de l'exercice "${result.type}" est prête.`,
          meta: { exerciseResultId: result.id, employeeId: employee.id, exerciseType: result.type },
        })
      }
      // Particulier B2C (#100) : prévenu directement, avec ou sans expert assigné.
      await new CandidateNotificationsService(notifService).aiAnalysisReady(employee, result)
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
