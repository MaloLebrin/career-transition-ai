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
  plan: Array<{ id: string; completed: boolean; lastUpdated?: string }>
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
      .preload('supportPlanSteps')
      .preload('appointments')
      .firstOrFail()

    return mapEmployee(loaded)
  }

  // These methods are placeholders to keep API parity with the frontend;
  // persistence for drafts can be implemented later (e.g. dedicated table).
  public async saveDraft(_input: SaveDraftInput): Promise<void> {
    return
  }

  public async fetchDraft(_input: SaveDraftInput): Promise<Record<string, unknown> | null> {
    return null
  }
}

