import Employee from '#models/employee'
import EmployeeSynthesis, { EMPLOYEE_SYNTHESIS_SHARE_STATUSES } from '#models/employee_synthesis'
import PdfExport from '#models/pdf_export'
import { CandidateNotificationsService } from '#services/candidate_notifications_service'
import { EmployeeSynthesisService } from '#services/employee_synthesis_service'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import GenerateEmployeeSynthesisPdf from '#jobs/generate_employee_synthesis_pdf'
import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'

@inject()
export default class EmployeeSynthesesController {
  constructor(
    private synthesisService: EmployeeSynthesisService,
    private candidateNotifications: CandidateNotificationsService
  ) {}

  /**
   * Advisor view (Inertia): synthesis + editable notes.
   * GET /dashboard/conseiller/employees/:id/synthesis
   */
  public async showAdvisor(ctx: HttpContext) {
    const user = ctx.auth.user!
    const employeeId = Number(ctx.params.id)

    const payload = await this.synthesisService.buildForAdvisor({
      organizationId: user.organizationId,
      employeeId,
    })

    const recentPdfExports = await PdfExport.query()
      .where('organizationId', user.organizationId)
      .orderBy('createdAt', 'desc')
      .limit(50)

    const latestForEmployee = recentPdfExports.find((e) => e.employeeId === employeeId)

    return (ctx.inertia as any).render('dashboard/conseiller/employees/Synthesis', {
      employeeId: String(employeeId),
      employee: payload.employee,
      synthesis: payload.synthesis,
      latestCompletedByType: payload.latestCompletedByType,
      latestPdfJob: latestForEmployee
        ? {
            id: latestForEmployee.id,
            status: latestForEmployee.status,
            downloadUrl:
              latestForEmployee.status === PDF_EXPORT_STATUSES.COMPLETED &&
              latestForEmployee.filePath
                ? `/dashboard/pdf-exports/${latestForEmployee.id}/download`
                : null,
          }
        : null,
    })
  }

  /**
   * Advisor save (Inertia form): internal notes + shared comments + optional executive summary.
   * PUT /dashboard/conseiller/employees/:id/synthesis
   */
  public async updateAdvisor(ctx: HttpContext) {
    const user = ctx.auth.user!
    const employeeId = Number(ctx.params.id)

    // org scoping safety (middleware should already protect, but we keep the scope constraint)
    await Employee.query()
      .where('id', employeeId)
      .where('organizationId', user.organizationId)
      .firstOrFail()

    const synthesis = await this.synthesisService.getOrCreateRow({
      organizationId: user.organizationId,
      employeeId,
    })

    const expertNotesInternal = (ctx.request.input('expertNotesInternal') ?? null) as string | null
    const expertCommentsShared = (ctx.request.input('expertCommentsShared') ?? null) as
      | string
      | null
    const executiveSummaryOverride = (ctx.request.input('executiveSummaryOverride') ?? null) as
      | string
      | null

    synthesis.merge({
      expertNotesInternal,
      expertCommentsShared,
      executiveSummaryOverride,
    })
    await synthesis.save()

    ctx.session.flash('success', 'Synthèse mise à jour.')
    return ctx.response.redirect().back()
  }

  /**
   * Advisor share/unshare (Inertia form).
   * POST /dashboard/conseiller/employees/:id/synthesis/share
   * POST /dashboard/conseiller/employees/:id/synthesis/unshare
   */
  public async share(ctx: HttpContext) {
    const user = ctx.auth.user!
    const employeeId = Number(ctx.params.id)

    const employee = await Employee.query()
      .where('id', employeeId)
      .where('organizationId', user.organizationId)
      .firstOrFail()

    const synthesis = await this.synthesisService.getOrCreateRow({
      organizationId: user.organizationId,
      employeeId,
    })

    const wasShared = synthesis.shareStatus === EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED
    synthesis.merge({
      shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED,
      sharedAt: DateTime.now(),
      sharedByUserId: user.id,
    })
    await synthesis.save()
    if (!wasShared) await this.candidateNotifications.synthesisShared(employee)

    ctx.session.flash('success', 'Synthèse partagée au talent.')
    return ctx.response.redirect().back()
  }

  public async unshare(ctx: HttpContext) {
    const user = ctx.auth.user!
    const employeeId = Number(ctx.params.id)

    await Employee.query()
      .where('id', employeeId)
      .where('organizationId', user.organizationId)
      .firstOrFail()

    const synthesis = await this.synthesisService.getOrCreateRow({
      organizationId: user.organizationId,
      employeeId,
    })

    synthesis.merge({
      shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.DRAFT,
      sharedAt: null,
      sharedByUserId: null,
    })
    await synthesis.save()

    ctx.session.flash('success', 'Partage désactivé.')
    return ctx.response.redirect().back()
  }

  /**
   * Candidate view (Inertia): only shareable content.
   * GET /dashboard/candidat/synthesis
   */
  public async showCandidate(ctx: HttpContext) {
    const user = ctx.auth.user!

    const employee = await Employee.query()
      .where('userId', user.id)
      .where('organizationId', user.organizationId)
      .firstOrFail()

    const synthesis = await EmployeeSynthesis.query()
      .where('organizationId', user.organizationId)
      .where('employeeId', employee.id)
      .first()

    if (!synthesis || synthesis.shareStatus !== EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED) {
      return (ctx.inertia as any).render('dashboard/candidat/Synthesis', {
        shared: false,
        employeeId: String(employee.id),
        employee: null,
        synthesis: null,
        latestCompletedByType: {},
        latestPdfJob: null,
      })
    }

    const payload = await this.synthesisService.buildForCandidate({
      organizationId: user.organizationId,
      employeeId: employee.id,
    })

    const recentPdfExports = await PdfExport.query()
      .where('userId', user.id)
      .orderBy('createdAt', 'desc')
      .limit(50)

    const latestForEmployee = recentPdfExports.find((e) => e.employeeId === employee.id)

    return (ctx.inertia as any).render('dashboard/candidat/Synthesis', {
      shared: true,
      employeeId: String(employee.id),
      employee: payload.employee,
      synthesis: payload.synthesis,
      latestCompletedByType: payload.latestCompletedByType,
      latestPdfJob: latestForEmployee
        ? {
            id: latestForEmployee.id,
            status: latestForEmployee.status,
            downloadUrl:
              latestForEmployee.status === PDF_EXPORT_STATUSES.COMPLETED &&
              latestForEmployee.filePath
                ? `/dashboard/pdf-exports/${latestForEmployee.id}/download`
                : null,
          }
        : null,
    })
  }

  /**
   * Async PDF generation for advisor.
   * POST /dashboard/conseiller/employees/:id/synthesis/pdf
   */
  public async generateShareablePdfAdvisor(ctx: HttpContext) {
    const user = ctx.auth.user!
    const employeeId = Number(ctx.params.id)

    const synthesis = await EmployeeSynthesis.query()
      .where('organizationId', user.organizationId)
      .where('employeeId', employeeId)
      .first()

    if (!synthesis || synthesis.shareStatus !== EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED) {
      ctx.session.flash('error', 'La synthèse doit être partagée avant génération PDF.')
      return ctx.response.redirect().back()
    }

    // Ensure employee exists and is org-scoped
    const employee = await Employee.query()
      .where('id', employeeId)
      .where('organizationId', user.organizationId)
      .firstOrFail()

    const pdfExport = await PdfExport.create({
      userId: user.id,
      organizationId: user.organizationId,
      employeeId: employee.id,
      advisorUserId: user.id,
      status: PDF_EXPORT_STATUSES.PENDING,
    })

    await GenerateEmployeeSynthesisPdf.dispatch({ pdfExportId: pdfExport.id }).toQueue('pdfs')

    ctx.session.flash('success', 'Génération PDF lancée.')
    return ctx.response.redirect().back()
  }

  /**
   * Async PDF generation for candidate (only if shared).
   * POST /dashboard/candidat/synthesis/pdf
   */
  public async generateShareablePdfCandidate(ctx: HttpContext) {
    const user = ctx.auth.user!

    const employee = await Employee.query()
      .where('userId', user.id)
      .where('organizationId', user.organizationId)
      .firstOrFail()

    const synthesis = await EmployeeSynthesis.query()
      .where('organizationId', user.organizationId)
      .where('employeeId', employee.id)
      .first()

    if (!synthesis || synthesis.shareStatus !== EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED) {
      ctx.session.flash('error', 'La synthèse doit être partagée avant génération PDF.')
      return ctx.response.redirect().back()
    }

    const pdfExport = await PdfExport.create({
      userId: user.id,
      organizationId: user.organizationId,
      employeeId: employee.id,
      advisorUserId: employee.advisorId ?? null,
      status: PDF_EXPORT_STATUSES.PENDING,
    })

    await GenerateEmployeeSynthesisPdf.dispatch({ pdfExportId: pdfExport.id }).toQueue('pdfs')

    ctx.session.flash('success', 'Génération PDF lancée.')
    return ctx.response.redirect().back()
  }
}
