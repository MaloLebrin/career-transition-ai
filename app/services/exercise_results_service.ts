import type { EmployeeDto } from '#dtos/employee_dto'
import AnalyzeExerciseQualitativeJob from '#jobs/analyze_exercise_qualitative_job'
import { mapEmployee } from '#mappers/employee_mapper'
import Employee from '#models/employee'
import ExerciseResult from '#models/exercise_result'
import SupportPlanStep from '#models/support_plan_step'
import { ExerciseAccessService } from '#services/exercise_access_service'
import { NotificationService } from '#services/notification_service'
import { exerciceResultStatusValues } from '#shared/constants/exercises'
import { NOTIFICATION_TYPES } from '#shared/constants/notifications'
import { getExerciseProgress } from '#shared/helpers/exercise_progress'
import type { CandidateExerciseState, ExerciseInitialDraft } from '#shared/types/exercise/access'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

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

@inject()
export class ExerciseResultsService {
  /**
   * L'accès aux exercices (plan B2B / forfait B2C) vit dans
   * `ExerciseAccessService` (#100) ; ce service ne décide que de l'analyse IA.
   */
  constructor(private access: ExerciseAccessService) {}

  /** Dernier brouillon d'un candidat pour un type d'exercice, ou `null`. */
  public async findLatestDraft(
    employeeId: number,
    type: ExerciseResult['type']
  ): Promise<ExerciseInitialDraft | null> {
    const draft = await ExerciseResult.query()
      .where('employeeId', employeeId)
      .andWhere('type', type)
      .andWhere('status', exerciceResultStatusValues.DRAFT)
      .orderBy('updatedAt', 'desc')
      .first()

    return draft ? toInitialDraft(draft, draft.data ?? {}) : null
  }

  /**
   * État repris par l'outil d'exercice côté candidat : le brouillon en cours,
   * sinon le résultat terminé pré-rempli à l'étape 2 (les outils attendent
   * `step` dans leurs données), sinon rien.
   */
  public async findDraftOrCompletedForCandidate(
    employeeId: number,
    type: ExerciseResult['type']
  ): Promise<CandidateExerciseState> {
    const draft = await this.findLatestDraft(employeeId, type)
    if (draft) {
      return {
        initialDraft: draft,
        exerciseProgressPercent: getExerciseProgress(
          String(type),
          draft.data,
          exerciceResultStatusValues.DRAFT
        ),
      }
    }

    const completed = await ExerciseResult.query()
      .where('employeeId', employeeId)
      .andWhere('type', type)
      .andWhere('status', exerciceResultStatusValues.COMPLETED)
      .orderBy('date', 'desc')
      .orderBy('updatedAt', 'desc')
      .first()
    if (!completed) {
      return { initialDraft: null, exerciseProgressPercent: 0 }
    }

    return {
      initialDraft: toInitialDraft(completed, { ...(completed.data ?? {}), step: 2 }),
      exerciseProgressPercent: getExerciseProgress(
        String(type),
        completed.data ?? {},
        completed.status
      ),
    }
  }

  public async saveResult(input: SaveResultInput): Promise<EmployeeDto> {
    const employee = await Employee.findOrFail(input.employeeId)

    const progressPercent = getExerciseProgress(String(input.type), input.data ?? {}, input.status)

    const existing = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .andWhere('type', input.type)
      .first()

    // Politique B2C (#100) : un exercice gratuit n'est analysé qu'une fois.
    const hadAnalysis = Boolean(existing?.qualitativeAnalysis)

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
      if (await this.access.shouldRunAiAnalysis(employee, input.type, hadAnalysis)) {
        await AnalyzeExerciseQualitativeJob.dispatch({
          exerciseResultId: resultRow.id,
        }).toQueue('ai')
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
   * Une analyse IA existante n'est jamais effacée : sinon un retour
   * completed → draft rouvrirait le droit à une analyse gratuite (B2C, #100).
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
      })
      await winnerDraft.save()
    }
  }

  /** @deprecated utiliser `findLatestDraft(employeeId, type)`. */
  public async fetchDraft(input: SaveDraftInput): Promise<ExerciseInitialDraft | null> {
    return this.findLatestDraft(input.employeeId, input.type)
  }
}

function toInitialDraft(row: ExerciseResult, data: Record<string, unknown>): ExerciseInitialDraft {
  return {
    employeeId: row.employeeId,
    type: row.type,
    lastUpdated: row.updatedAt.toISO() || new Date().toISOString(),
    data,
  }
}
