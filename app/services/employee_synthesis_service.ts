import { mapEmployee } from '#mappers/employee_mapper'
import Employee from '#models/employee'
import EmployeeSynthesis, { EMPLOYEE_SYNTHESIS_SHARE_STATUSES } from '#models/employee_synthesis'
import ExerciseResult from '#models/exercise_result'

export type EmployeeSynthesisPayload = {
  employee: ReturnType<typeof mapEmployee>
  synthesis: {
    shareStatus: EmployeeSynthesis['shareStatus']
    sharedAt: string | null
    expertCommentsShared: string | null
    expertNotesInternal: string | null
    executiveSummaryOverride: string | null
  }
  latestCompletedByType: Partial<Record<ExerciseResult['type'], number>>
}

export class EmployeeSynthesisService {
  public async getOrCreateRow(input: {
    organizationId: number
    employeeId: number
  }): Promise<EmployeeSynthesis> {
    return await EmployeeSynthesis.firstOrCreate(
      { organizationId: input.organizationId, employeeId: input.employeeId },
      {
        organizationId: input.organizationId,
        employeeId: input.employeeId,
        shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.DRAFT,
        sharedAt: null,
        sharedByUserId: null,
        expertCommentsShared: null,
        expertNotesInternal: null,
        executiveSummaryOverride: null,
      }
    )
  }

  public async buildForAdvisor(input: {
    organizationId: number
    employeeId: number
  }): Promise<EmployeeSynthesisPayload> {
    const employee = await Employee.query()
      .where('id', input.employeeId)
      .where('organizationId', input.organizationId)
      .preload('skills', (q) => q.pivotColumns(['level']))
      .preload('experiences')
      .preload('educations')
      .preload('exerciseResults')
      .preload('supportPlanSteps', (q) => q.preload('exercises'))
      .firstOrFail()

    const synthesisRow = await this.getOrCreateRow(input)

    const latestCompletedByType: Partial<Record<ExerciseResult['type'], number>> = {}
    for (const res of employee.exerciseResults || []) {
      if (res.status !== 'completed') continue
      const current = latestCompletedByType[res.type]
      if (!current) {
        latestCompletedByType[res.type] = res.id
        continue
      }
      const currentRow = employee.exerciseResults.find((r) => r.id === current)
      if (!currentRow || (res.date && (!currentRow.date || res.date > currentRow.date))) {
        latestCompletedByType[res.type] = res.id
      }
    }

    return {
      employee: mapEmployee(employee),
      synthesis: {
        shareStatus: synthesisRow.shareStatus,
        sharedAt: synthesisRow.sharedAt ? synthesisRow.sharedAt.toISO() : null,
        expertCommentsShared: synthesisRow.expertCommentsShared,
        expertNotesInternal: synthesisRow.expertNotesInternal,
        executiveSummaryOverride: synthesisRow.executiveSummaryOverride,
      },
      latestCompletedByType,
    }
  }

  public async buildForCandidate(input: { organizationId: number; employeeId: number }): Promise<
    Omit<EmployeeSynthesisPayload, 'synthesis'> & {
      synthesis: Omit<EmployeeSynthesisPayload['synthesis'], 'expertNotesInternal'>
    }
  > {
    const payload = await this.buildForAdvisor(input)
    return {
      ...payload,
      synthesis: {
        shareStatus: payload.synthesis.shareStatus,
        sharedAt: payload.synthesis.sharedAt,
        expertCommentsShared: payload.synthesis.expertCommentsShared,
        executiveSummaryOverride: payload.synthesis.executiveSummaryOverride,
      },
    }
  }
}
