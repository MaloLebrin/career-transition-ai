import Employee from '#models/employee'
import EmployeeSynthesis, { EMPLOYEE_SYNTHESIS_SHARE_STATUSES } from '#models/employee_synthesis'
import { EmployeeSynthesisService } from '#services/employee_synthesis_service'
import { EmployeeSynthesisPdfService } from '#services/employee_synthesis_pdf_service'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'

@inject()
export default class EmployeeSynthesesController {
  constructor(
    private synthesisService: EmployeeSynthesisService,
    private pdfService: EmployeeSynthesisPdfService
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

    return (ctx.inertia as any).render('dashboard/conseiller/employees/Synthesis', {
      employeeId: String(employeeId),
      employee: payload.employee,
      synthesis: payload.synthesis,
      latestCompletedByType: payload.latestCompletedByType,
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
    const expertCommentsShared = (ctx.request.input('expertCommentsShared') ?? null) as string | null
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

    await Employee.query()
      .where('id', employeeId)
      .where('organizationId', user.organizationId)
      .firstOrFail()

    const synthesis = await this.synthesisService.getOrCreateRow({
      organizationId: user.organizationId,
      employeeId,
    })

    synthesis.merge({
      shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED,
      sharedAt: DateTime.now(),
      sharedByUserId: user.id,
    })
    await synthesis.save()

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
      })
    }

    const payload = await this.synthesisService.buildForCandidate({
      organizationId: user.organizationId,
      employeeId: employee.id,
    })

    return (ctx.inertia as any).render('dashboard/candidat/Synthesis', {
      shared: true,
      employeeId: String(employee.id),
      employee: payload.employee,
      synthesis: payload.synthesis,
      latestCompletedByType: payload.latestCompletedByType,
    })
  }

  /**
   * Shareable PDF export for advisor.
   * GET /dashboard/conseiller/employees/:id/synthesis/pdf
   */
  public async downloadShareablePdfAdvisor(ctx: HttpContext) {
    const user = ctx.auth.user!
    const employeeId = Number(ctx.params.id)

    const synthesis = await EmployeeSynthesis.query()
      .where('organizationId', user.organizationId)
      .where('employeeId', employeeId)
      .first()

    if (!synthesis || synthesis.shareStatus !== EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED) {
      ctx.session.flash('error', 'La synthèse doit être partagée avant export PDF.')
      return ctx.response.redirect().back()
    }

    const payload = await this.synthesisService.buildForCandidate({
      organizationId: user.organizationId,
      employeeId,
    })

    const bytes = await this.pdfService.generateShareablePdf({ payload })
    const filename = `Synthese_${payload.employee.name.replace(/\s+/g, '_')}.pdf`
    ctx.response.header('Content-Type', 'application/pdf')
    ctx.response.header('Content-Disposition', `attachment; filename="${filename}"`)
    return ctx.response.send(Buffer.from(bytes))
  }

  /**
   * Shareable PDF export for candidate (only if shared).
   * GET /dashboard/candidat/synthesis/pdf
   */
  public async downloadShareablePdfCandidate(ctx: HttpContext) {
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
      return ctx.response.forbidden()
    }

    const payload = await this.synthesisService.buildForCandidate({
      organizationId: user.organizationId,
      employeeId: employee.id,
    })

    const bytes = await this.pdfService.generateShareablePdf({ payload })
    const filename = `Synthese_${payload.employee.name.replace(/\s+/g, '_')}.pdf`
    ctx.response.header('Content-Type', 'application/pdf')
    ctx.response.header('Content-Disposition', `attachment; filename="${filename}"`)
    return ctx.response.send(Buffer.from(bytes))
  }
}

