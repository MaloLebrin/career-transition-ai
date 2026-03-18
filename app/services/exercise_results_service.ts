import ExerciseResult from '#models/exercise_result'
import SupportPlanStep from '#models/support_plan_step'
import Employee from '#models/employee'
import { mapEmployee } from '#mappers/employee_mapper'
import type { EmployeeDto } from '#dtos/employee_dto'
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
  public async saveResult(input: SaveResultInput): Promise<EmployeeDto> {
    const employee = await Employee.findOrFail(input.employeeId)

    const existing = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .andWhere('type', input.type)
      .first()

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
    } else {
      await ExerciseResult.create({
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

    // Update support plan steps completion flags
    for (const planItem of input.plan) {
      const step = await SupportPlanStep.find(planItem.id)
      if (step) {
        step.completed = planItem.completed
        step.updatedAt = DateTime.fromISO(planItem.lastUpdated ?? DateTime.now().toISO()!)
        await step.save()
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

    const existing = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .andWhere('type', input.type)
      .first()

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
