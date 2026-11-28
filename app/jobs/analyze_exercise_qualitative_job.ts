import Employee from '#models/employee'
import ExerciseResult from '#models/exercise_result'
import { resolveAiTextCompletionProvider } from '#services/ai/resolve_ai_text_provider'
import { CandidateNotificationsService } from '#services/candidate_notifications_service'
import { EntitlementsService } from '#services/entitlements_service'
import { ExerciseAccessService } from '#services/exercise_access_service'
import { NotificationService } from '#services/notification_service'
import { reportError } from '#services/error_tracking_service'
import {
  exerciceResultStatusValues,
  QUALITATIVE_ANALYSIS_STATUSES,
} from '#shared/constants/exercises'
import { NOTIFICATION_TYPES } from '#shared/constants/notifications'
import { buildEmployeeAiProfile, pseudonymizeForAi } from '#shared/helpers/ai/exercise_profile'
import { buildQualitativePromptForExerciseType } from '#shared/helpers/ai/prompts/exercises/index'
import { QUEUE_NAMES } from '#utils/queues/queue_names'
import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import { exponentialBackoff, fixedBackoff, Job } from '@adonisjs/queue'
import type { JobOptions } from '@adonisjs/queue/types'

export interface AnalyzeExerciseQualitativePayload {
  exerciseResultId: number
}

/** Nombre de nouveaux essais après le premier échec du fournisseur IA (#171). */
export const ANALYSIS_MAX_RETRIES = 2

/**
 * Délai progressif entre deux essais (#171) : ~30 s puis ~1 min (avec gigue),
 * plafonné à 5 min. En test, 1 ms : le driver `sync` attend réellement le
 * délai dans le process.
 */
export function analysisRetryBackoff(inTest: boolean = app.inTest) {
  return inTest ? fixedBackoff('1ms') : exponentialBackoff({ baseDelay: '30s', maxDelay: '5m' })
}

export default class AnalyzeExerciseQualitativeJob extends Job<AnalyzeExerciseQualitativePayload> {
  static options: JobOptions = {
    queue: QUEUE_NAMES.ai,
    retry: { maxRetries: ANALYSIS_MAX_RETRIES, backoff: analysisRetryBackoff() },
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
      await settleSkipped(result)
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

    // Droit B2C revérifié à l'exécution (#100) : forfait remboursé ou analyse
    // gratuite déjà consommée entre la mise en file et le traitement.
    const access = new ExerciseAccessService(
      new EntitlementsService(new CandidateNotificationsService(new NotificationService()))
    )
    const allowed = await access.shouldRunAiAnalysis(
      employee,
      result.type,
      Boolean(result.qualitativeAnalysis)
    )
    if (!allowed) {
      logger.warn(
        { exerciseResultId, employeeId: employee.id },
        'AnalyzeExerciseQualitativeJob: ignoré (analyse non autorisée)'
      )
      await settleSkipped(result)
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

    if (result.qualitativeAnalysisStatus !== QUALITATIVE_ANALYSIS_STATUSES.PENDING) {
      result.qualitativeAnalysisStatus = QUALITATIVE_ANALYSIS_STATUSES.PENDING
      await result.save()
    }

    // Un échec du fournisseur est relancé (#171) : le job échoue, la queue
    // réessaie avec un délai progressif, puis `failed()` pose le statut
    // `failed` au dernier essai. Aucun texte d'erreur dans `qualitativeAnalysis` :
    // il compterait comme « analyse existante » (politique B2C, relance au
    // déverrouillage).
    let text: string
    try {
      text = await provider.completeText(prompt)
    } catch (error) {
      logger.warn(
        { err: error, exerciseResultId, attempt: this.context.attempt },
        'AnalyzeExerciseQualitativeJob: échec IA, nouvel essai si possible'
      )
      throw error
    }

    result.qualitativeAnalysis = text
    result.qualitativeAnalysisStatus = QUALITATIVE_ANALYSIS_STATUSES.DONE
    await result.save()

    // Les notifications sont hors du `try` : leur échec ne doit pas écraser
    // une analyse valide déjà enregistrée.
    try {
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
      logger.error(
        { err: error, exerciseResultId },
        'AnalyzeExerciseQualitativeJob: notification impossible'
      )
    }

    logger.info({ exerciseResultId }, 'AnalyzeExerciseQualitativeJob: terminé')
  }

  /**
   * Essais épuisés (#171) : statut `failed` (relance manuelle par le conseiller
   * depuis la fiche) et envoi au suivi des erreurs. On transmet l'erreur
   * d'origine — le même objet que `watchQueueFailures`, que Sentry ne capture
   * qu'une fois — avec l'id du résultat seulement (ni nom ni payload).
   */
  async failed(error: Error) {
    const cause = error.cause ?? error
    const { exerciseResultId } = this.payload
    try {
      await ExerciseResult.query()
        .where('id', exerciseResultId)
        .whereNull('qualitative_analysis')
        .update({ qualitative_analysis_status: QUALITATIVE_ANALYSIS_STATUSES.FAILED })
    } catch (updateError) {
      logger.error(
        { err: updateError, exerciseResultId },
        'AnalyzeExerciseQualitativeJob: statut `failed` non enregistré'
      )
    }
    reportError(cause, {
      tags: { queue: QUEUE_NAMES.ai, job: 'AnalyzeExerciseQualitativeJob' },
      extra: { exerciseResultId },
    })
    logger.error({ err: cause, exerciseResultId }, 'AnalyzeExerciseQualitativeJob: échec définitif')
  }
}

/**
 * Analyse non lancée à l'exécution (brouillon, droit B2C retiré) : on ne laisse
 * pas un `pending` posé au `dispatch` en suspens.
 */
async function settleSkipped(result: ExerciseResult): Promise<void> {
  if (result.qualitativeAnalysisStatus !== QUALITATIVE_ANALYSIS_STATUSES.PENDING) return
  result.qualitativeAnalysisStatus = result.qualitativeAnalysis
    ? QUALITATIVE_ANALYSIS_STATUSES.DONE
    : null
  await result.save()
}
