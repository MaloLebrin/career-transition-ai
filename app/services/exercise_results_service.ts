import type { EmployeeDto } from '#dtos/employee_dto'
import AnalyzeExerciseQualitativeJob from '#jobs/analyze_exercise_qualitative_job'
import { mapEmployee } from '#mappers/employee_mapper'
import Employee from '#models/employee'
import ExerciseResult from '#models/exercise_result'
import SupportPlanStep from '#models/support_plan_step'
import SupportPlanStepExercise from '#models/support_plan_step_exercise'
import { NotificationService } from '#services/notification_service'
import { exerciceResultStatusValues } from '#shared/constants/exercises'
import { NOTIFICATION_TYPES } from '#shared/constants/notifications'
import { getExerciseProgress } from '#shared/helpers/exercise_progress'
import env from '#start/env'
import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

/**
 * Le driver `sync` exécute le job dans le processus de la requête.
 * Hors tests, on ne l'attend pas : l'enregistrement répond tout de suite
 * et l'analyse continue dans le process (déploiement sans worker).
 * En test, on l'attend pour rester dans la transaction globale.
 * Le driver `database` ne fait qu'insérer le job : l'attente est courte.
 */
export function awaitsQualitativeAnalysisInline(
  driver: 'database' | 'sync' = env.get('QUEUE_DRIVER'),
  inTest: boolean = app.inTest
): boolean {
  return driver !== 'sync' || inTest
}

type SaveResultInput = {
  employeeId: number
  type: ExerciseResult['type']
  status: ExerciseResult['status']
  date?: string
  duration?: number
  data: Record<string, unknown>
  quantitativeScore?: number
  qualitativeAnalysis?: string
  plan: Array<{ id: number; completed: boolean; lastUpdated?: string }>
}

type SaveDraftInput = {
  employeeId: number
  type: ExerciseResult['type']
  data: Record<string, unknown>
}

export class ExerciseResultsService {
  /**
   * Candidate access rules:
   * An exercise is accessible if there exists at least one support plan step
   * linked to that exercise type for the employee, and that step is NOT locked.
   */
  public async getUnlockedExerciseSlugsForEmployee(
    employeeId: number
  ): Promise<Array<ExerciseResult['type']>> {
    const rows = await SupportPlanStepExercise.query()
      .whereHas('supportPlanStep', (query) => {
        query.where('employeeId', employeeId).where('isLocked', false)
      })
      .select('exerciseType')

    const unique = new Set<ExerciseResult['type']>()
    for (const row of rows) {
      unique.add(row.exerciseType)
    }
    return Array.from(unique)
  }

  public async canAccessExerciseForEmployee(
    employeeId: number,
    exerciseType: ExerciseResult['type']
  ): Promise<boolean> {
    const unlocked = await SupportPlanStepExercise.query()
      .where('exerciseType', exerciseType)
      .whereHas('supportPlanStep', (query) => {
        query.where('employeeId', employeeId).where('isLocked', false)
      })
      .first()

    return Boolean(unlocked)
  }

  public async saveResult(input: SaveResultInput): Promise<EmployeeDto> {
    const employee = await Employee.findOrFail(input.employeeId)

    const progressPercent = getExerciseProgress(String(input.type), input.data ?? {}, input.status)

    const existing = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .andWhere('type', input.type)
      .first()

    let resultRow: ExerciseResult
    if (existing) {
      existing.merge({
        status: input.status,
        date: input.date ? DateTime.fromISO(input.date) : existing.date,
        duration: input.duration ?? existing.duration,
        progressPercent,
        data: input.data,
        quantitativeScore: input.quantitativeScore ?? existing.quantitativeScore,
        qualitativeAnalysis: input.qualitativeAnalysis ?? existing.qualitativeAnalysis,
      })
      await existing.save()
      resultRow = existing
    } else {
      resultRow = await ExerciseResult.create({
        employeeId: employee.id,
        type: input.type,
        status: input.status,
        date: input.date ? DateTime.fromISO(input.date) : null,
        duration: input.duration ?? null,
        progressPercent,
        data: input.data,
        quantitativeScore: input.quantitativeScore ?? null,
        qualitativeAnalysis: input.qualitativeAnalysis ?? null,
      })
    }

    if (resultRow.status === exerciceResultStatusValues.COMPLETED) {
      const analysis = AnalyzeExerciseQualitativeJob.dispatch({
        exerciseResultId: resultRow.id,
      }).toQueue('ai')

      if (awaitsQualitativeAnalysisInline()) {
        await analysis
      } else {
        void Promise.resolve(analysis).catch((error: unknown) => {
          logger.error(
            {
              exerciseResultId: resultRow.id,
              message: error instanceof Error ? error.message : String(error),
            },
            'Analyse qualitative : lancement en arrière-plan échoué'
          )
        })
      }

      if (employee.advisorId) {
        const notifService = new NotificationService()
        await notifService.notify({
          userId: employee.advisorId,
          type: NOTIFICATION_TYPES.EXERCISE_COMPLETED,
          title: `Exercice terminé par ${employee.name}`,
          body: `L'exercice "${input.type}" vient d'être complété.`,
          meta: { employeeId: employee.id, exerciseType: input.type },
        })
      }
    }

    // Secure completion flags:
    // - never trust `input.plan` coming from the client (it can be forged)
    // - recompute completion for unlocked support plan steps that are associated
    //   with the exercise type we just saved:
    //   A step is completed iff all its associated exercises have a latest result
    //   with status = "completed". Steps without exercises are auto-completed.
    const stepsToRecompute = await SupportPlanStep.query()
      .where('employeeId', input.employeeId)
      .where('isLocked', false)
      .whereHas('exercises', (q) => q.where('exerciseType', input.type))
      .preload('exercises')

    if (stepsToRecompute.length > 0) {
      const allExerciseTypes = new Set<ExerciseResult['type']>()
      for (const step of stepsToRecompute) {
        for (const ex of step.exercises || []) {
          allExerciseTypes.add(ex.exerciseType)
        }
      }

      const exerciseTypesList = Array.from(allExerciseTypes)
      const latestResultByType = new Map<ExerciseResult['type'], ExerciseResult>()

      if (exerciseTypesList.length > 0) {
        const results = await ExerciseResult.query()
          .where('employeeId', input.employeeId)
          .whereIn('type', exerciseTypesList)

        for (const r of results) {
          latestResultByType.set(r.type, r)
        }
      }

      for (const step of stepsToRecompute) {
        const stepExerciseTypes = (step.exercises || []).map((e) => e.exerciseType)

        const newCompleted =
          stepExerciseTypes.length === 0
            ? true
            : stepExerciseTypes.every((t) => latestResultByType.get(t)?.status === 'completed')

        if (step.completed !== newCompleted) {
          step.completed = newCompleted
          await step.save()
        }
      }
    }

    const loaded = await Employee.query()
      .where('id', employee.id)
      .preload('experiences')
      .preload('educations')
      .preload('skills', (q) => q.pivotColumns(['level']))
      .preload('exerciseResults')
      .preload('supportPlanSteps', (q) => q.preload('exercises'))
      .firstOrFail()

    return mapEmployee(loaded)
  }

  /**
   * Saves or updates a draft for a given employee + exercise type.
   * Uses the same ExerciseResult table with status = "draft".
   * When the exercise is completed, saveResult will overwrite this record.
   */
  public async saveDraft(input: SaveDraftInput): Promise<void> {
    const employee = await Employee.findOrFail(input.employeeId)

    const progressPercent = getExerciseProgress(String(input.type), input.data ?? {}, 'draft')

    // First, try to update an existing draft (most common path).
    const existingDraft = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .andWhere('type', input.type)
      .andWhere('status', 'draft')
      .first()

    if (existingDraft) {
      existingDraft.merge({
        status: 'draft',
        date: null,
        duration: null,
        progressPercent,
        data: input.data,
        quantitativeScore: null,
        qualitativeAnalysis: null,
      })
      await existingDraft.save()
      return
    }

    // If the latest row is completed, never create a draft (avoid downgrading).
    const existingCompleted = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .andWhere('type', input.type)
      .andWhere('status', 'completed')
      .first()

    if (existingCompleted) {
      return
    }

    // Otherwise create a draft. Under concurrency, two requests can race here.
    // If the unique draft index triggers, fallback to updating the winning draft.
    //
    // L'insert tourne dans sa propre transaction : sur Postgres, une requête en
    // erreur invalide toute la transaction englobante (« current transaction is
    // aborted »). Sans ce point de sauvegarde, le repli ci-dessous échouerait
    // dès que `saveDraft` est appelé depuis une transaction ouverte (tests sous
    // `withGlobalTransaction()`, ou un futur appelant transactionnel).
    try {
      await db.transaction(async (trx) => {
        await ExerciseResult.create(
          {
            employeeId: employee.id,
            type: input.type,
            status: 'draft',
            date: null,
            duration: null,
            progressPercent,
            data: input.data,
            quantitativeScore: null,
            qualitativeAnalysis: null,
          },
          { client: trx }
        )
      })
    } catch (err: any) {
      const msg = String(err?.message ?? '')
      const looksLikeDraftUniqueViolation =
        msg.includes('exercise_results_one_draft_per_employee_type') ||
        msg.toLowerCase().includes('unique') ||
        msg.toLowerCase().includes('duplicate')

      if (!looksLikeDraftUniqueViolation) {
        throw err
      }

      const winnerDraft = await ExerciseResult.query()
        .where('employeeId', employee.id)
        .andWhere('type', input.type)
        .andWhere('status', 'draft')
        .first()

      if (!winnerDraft) {
        throw err
      }

      winnerDraft.merge({
        status: 'draft',
        date: null,
        duration: null,
        progressPercent,
        data: input.data,
        quantitativeScore: null,
        qualitativeAnalysis: null,
      })
      await winnerDraft.save()
    }
  }

  /**
   * Returns the latest draft for an employee + exercise type, or null.
   */
  public async fetchDraft(input: SaveDraftInput): Promise<{
    employeeId: number
    type: ExerciseResult['type']
    lastUpdated: string
    data: Record<string, unknown>
  } | null> {
    const draft = await ExerciseResult.query()
      .where('employeeId', input.employeeId)
      .andWhere('type', input.type)
      .andWhere('status', 'draft')
      .orderBy('updatedAt', 'desc')
      .first()

    if (!draft) {
      return null
    }

    return {
      employeeId: draft.employeeId,
      type: draft.type,
      lastUpdated: draft.updatedAt.toISO() || new Date().toISOString(),
      data: draft.data,
    }
  }
}
