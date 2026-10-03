import GenerateEmployeeSynthesisPdf from '#jobs/generate_employee_synthesis_pdf'
import { mapEmployee } from '#mappers/employee_mapper'
import Employee from '#models/employee'
import EmployeeSynthesis, { EMPLOYEE_SYNTHESIS_SHARE_STATUSES } from '#models/employee_synthesis'
import ExerciseResult from '#models/exercise_result'
import PdfExport from '#models/pdf_export'
import type User from '#models/user'
import { teamEmployeeScope } from '#services/team_employee_scope_service'
import { ACCOUNT_TYPES } from '#shared/constants/b2c'
import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'
import type { ResultsEntitlement } from '#shared/types/billing/entitlement'
import type { LatestPdfJob } from '#shared/types/pdf_export/latest_job'

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
  /** Fiche du candidat connecté (son organisation), 404 sinon. */
  public async getCandidateEmployee(user: User): Promise<Employee> {
    return Employee.query()
      .where('userId', user.id)
      .where('organizationId', user.organizationId)
      .firstOrFail()
  }

  /** Ligne de synthèse d'un candidat, sans la créer. */
  public async findRow(input: {
    organizationId: number
    employeeId: number
  }): Promise<EmployeeSynthesis | null> {
    return EmployeeSynthesis.query()
      .where('organizationId', input.organizationId)
      .where('employeeId', input.employeeId)
      .first()
  }

  /**
   * Le candidat peut-il voir sa synthèse (#101) ?
   * - B2B : seulement une fois **partagée** par son conseiller ;
   * - B2C : dès que le forfait est réglé — il n'a pas de conseiller pour partager.
   */
  public candidateCanView(
    employee: Employee,
    synthesis: EmployeeSynthesis | null,
    entitlement: ResultsEntitlement
  ): boolean {
    if (employee.accountType === ACCOUNT_TYPES.B2C) {
      return entitlement.hasPaidAccess
    }
    return synthesis?.shareStatus === EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED
  }

  /**
   * Dernier export PDF d'un candidat, dans la portée du lecteur : par
   * organisation (conseiller) ou par demandeur (candidat).
   */
  public async findLatestPdfExport(
    scope: { organizationId: number } | { userId: number },
    employeeId: number
  ): Promise<LatestPdfJob | null> {
    const query = PdfExport.query().where('employeeId', employeeId).orderBy('createdAt', 'desc')
    if ('organizationId' in scope) {
      query.where('organizationId', scope.organizationId)
    } else {
      query.where('userId', scope.userId)
    }
    const latest = await query.first()
    if (!latest) return null
    return {
      id: latest.id,
      status: latest.status,
      downloadUrl:
        latest.status === PDF_EXPORT_STATUSES.COMPLETED && latest.filePath
          ? `/dashboard/pdf-exports/${latest.id}/download`
          : null,
    }
  }

  /** Crée l'export en attente et enfile la génération (queue `pdfs`). */
  public async requestPdfExport(input: {
    user: User
    employee: Employee
    advisorUserId: number | null
  }): Promise<PdfExport> {
    const pdfExport = await PdfExport.create({
      userId: input.user.id,
      organizationId: input.employee.organizationId,
      employeeId: input.employee.id,
      advisorUserId: input.advisorUserId,
      status: PDF_EXPORT_STATUSES.PENDING,
    })
    await GenerateEmployeeSynthesisPdf.dispatch({ pdfExportId: pdfExport.id }).toQueue('pdfs')
    return pdfExport
  }

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
    /** Membre d'équipe qui consulte : applique le cloisonnement de l'organisation plateforme. */
    viewer?: Pick<User, 'id' | 'role' | 'organizationId'>
  }): Promise<EmployeeSynthesisPayload> {
    const employee = await Employee.query()
      .where('id', input.employeeId)
      .if(
        input.viewer !== undefined,
        (q) => q.where(teamEmployeeScope(input.viewer!)),
        (q) => q.where('organizationId', input.organizationId)
      )
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
