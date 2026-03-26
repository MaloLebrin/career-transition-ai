import type { EmployeeDto } from '#dtos/employee_dto'
import AnalyzeExerciseQualitativeJob from '#jobs/analyze_exercise_qualitative_job'
import { mapEmployee } from '#domains/employees/mappers/employee_mapper'
import Employee from '#models/employee'
import ExerciseResult from '#models/exercise_result'
import SupportPlanStep from '#models/support_plan_step'
import SupportPlanStepExercise from '#models/support_plan_step_exercise'
import { exerciceResultStatusValues } from '#shared/constants/exercises'
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
        data: input.data,
        quantitativeScore: input.quantitativeScore ?? null,
        qualitativeAnalysis: input.qualitativeAnalysis ?? null,
      })
    }

    if (input.status === exerciceResultStatusValues.COMPLETED) {
      await AnalyzeExerciseQualitativeJob.dispatch({
        exerciseResultId: resultRow.id,
      }).toQueue('ai')
    }

    // Secure completion flags:
    // - never trust `input.plan` coming from the client (it can be forged)
    // - mark as completed only the unlocked support plan steps that are associated
    //   with the exercise type we just saved.
    const stepsToComplete = await SupportPlanStep.query()
      .where('employeeId', input.employeeId)
      .where('isLocked', false)
      .whereHas('exercises', (q) => q.where('exerciseType', input.type))

    for (const step of stepsToComplete) {
      step.completed = true
      await step.save()
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

    const existing = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .andWhere('type', input.type)
      .first()

    if (existing?.status === 'completed') {
      return
    }

    if (existing) {
      existing.merge({
        status: 'draft',
        date: null,
        duration: null,
        data: input.data,
        quantitativeScore: null,
        qualitativeAnalysis: null,
      })
      await existing.save()
    } else {
      await ExerciseResult.create({
        employeeId: employee.id,
        type: input.type,
        status: 'draft',
        date: null,
        duration: null,
        data: input.data,
        quantitativeScore: null,
        qualitativeAnalysis: null,
      })
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

