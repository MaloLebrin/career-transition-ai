import { ResultsLockedError } from '#exceptions/billing_errors'
import Employee from '#models/employee'
import { EMPLOYEE_SYNTHESIS_SHARE_STATUSES } from '#models/employee_synthesis'
import PdfExport from '#models/pdf_export'
import { CandidateNotificationsService } from '#services/candidate_notifications_service'
import { EmployeeSynthesisService } from '#services/employee_synthesis_service'
import { EntitlementsService } from '#services/entitlements_service'
import { ACCOUNT_TYPES, EXERCISE_LOCK_REASONS } from '#shared/constants/b2c'
import type { HttpContext } from '@adonisjs/core/http'
import { teamEmployeeScope } from '#services/team_employee_scope_service'
import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import GenerateEmployeeSynthesisPdf from '#jobs/generate_employee_synthesis_pdf'
import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'

const SHARE_REQUIRED_MESSAGE = 'La synthèse doit être partagée avant génération PDF.'

@inject()
export default class EmployeeSynthesesController {
  constructor(
    private synthesisService: EmployeeSynthesisService,
    private candidateNotifications: CandidateNotificationsService,
    private entitlements: EntitlementsService
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
      viewer: user,
    })

    return (ctx.inertia as any).render('dashboard/conseiller/employees/Synthesis', {
      employeeId: String(employeeId),
      employee: payload.employee,
      synthesis: payload.synthesis,
      latestCompletedByType: payload.latestCompletedByType,
      latestPdfJob: await this.synthesisService.findLatestPdfExport(
        { organizationId: user.organizationId },
        employeeId
      ),
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
    await Employee.query().where('id', employeeId).where(teamEmployeeScope(user)).firstOrFail()

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
      .where(teamEmployeeScope(user))
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

    await Employee.query().where('id', employeeId).where(teamEmployeeScope(user)).firstOrFail()

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
   *
   * B2B : visible une fois partagée par le conseiller. B2C (#101) : visible dès
   * que le forfait est réglé, verrouillée sinon (`lockedReason: 'payment'`).
   */
  public async showCandidate(ctx: HttpContext) {
    const user = ctx.auth.user!

    const employee = await this.synthesisService.getCandidateEmployee(user)
    const scope = { organizationId: user.organizationId, employeeId: employee.id }
    const synthesis = await this.synthesisService.findRow(scope)
    const entitlement = await this.entitlements.forEmployee(employee)

    if (!this.synthesisService.candidateCanView(employee, synthesis, entitlement)) {
      return (ctx.inertia as any).render('dashboard/candidat/Synthesis', {
        shared: false,
        lockedReason:
          employee.accountType === ACCOUNT_TYPES.B2C ? EXERCISE_LOCK_REASONS.PAYMENT : null,
        employeeId: String(employee.id),
        employee: null,
        synthesis: null,
        latestCompletedByType: {},
        latestPdfJob: null,
      })
    }

    const payload = await this.synthesisService.buildForCandidate(scope)

    return (ctx.inertia as any).render('dashboard/candidat/Synthesis', {
      shared: true,
      lockedReason: null,
      employeeId: String(employee.id),
      employee: payload.employee,
      synthesis: payload.synthesis,
      latestCompletedByType: payload.latestCompletedByType,
      latestPdfJob: await this.synthesisService.findLatestPdfExport(
        { userId: user.id },
        employee.id
      ),
    })
  }

  /**
   * Async PDF generation for advisor.
   * POST /dashboard/conseiller/employees/:id/synthesis/pdf
   */
  public async generateShareablePdfAdvisor(ctx: HttpContext) {
    const user = ctx.auth.user!
    const employeeId = Number(ctx.params.id)

    const synthesis = await this.synthesisService.findRow({
      organizationId: user.organizationId,
      employeeId,
    })

    if (!synthesis || synthesis.shareStatus !== EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED) {
      ctx.session.flash('error', SHARE_REQUIRED_MESSAGE)
      return ctx.response.redirect().back()
    }

    // Ensure employee exists and is org-scoped
    const employee = await Employee.query()
      .where('id', employeeId)
      .where(teamEmployeeScope(user))
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
   * Async PDF generation for candidate.
   * POST /dashboard/candidat/synthesis/pdf
   *
   * B2B : seulement si la synthèse est partagée. B2C (#101) : réservé au
   * forfait (`ResultsLockedError`, 403), sans condition de partage ensuite.
   */
  public async generateShareablePdfCandidate(ctx: HttpContext) {
    const user = ctx.auth.user!

    const employee = await this.synthesisService.getCandidateEmployee(user)
    const synthesis = await this.synthesisService.findRow({
      organizationId: user.organizationId,
      employeeId: employee.id,
    })
    const entitlement = await this.entitlements.forEmployee(employee)

    if (!this.synthesisService.candidateCanView(employee, synthesis, entitlement)) {
      if (employee.accountType === ACCOUNT_TYPES.B2C) {
        throw new ResultsLockedError('La synthèse et son export PDF sont réservés au forfait.')
      }
      ctx.session.flash('error', SHARE_REQUIRED_MESSAGE)
      return ctx.response.redirect().back()
    }

    await this.synthesisService.requestPdfExport({
      user,
      employee,
      advisorUserId: employee.advisorId ?? null,
    })

    ctx.session.flash('success', 'Génération PDF lancée.')
    return ctx.response.redirect().back()
  }
}
