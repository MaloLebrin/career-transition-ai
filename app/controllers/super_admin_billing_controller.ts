import { SuperAdminB2cService } from '#services/super_admin_b2c_service'
import { SuperAdminPaymentsService } from '#services/super_admin_payments_service'
import { BILLING_ADMIN_PATHS } from '#shared/constants/billing'
import { revokePaymentValidator } from '#validators/super_admin/revoke_payment_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

export const ACCESS_GRANTED_MESSAGE =
  'Accès au forfait ouvert : le particulier est prévenu et ses analyses IA sont lancées.'
export const ACCESS_REVOKED_MESSAGE = 'Accès au forfait retiré : le particulier est prévenu.'

/** Back-office super admin des particuliers et des paiements du forfait (#107). */
@inject()
export default class SuperAdminBillingController {
  constructor(
    private b2c: SuperAdminB2cService,
    private payments: SuperAdminPaymentsService
  ) {}

  /** GET /dashboard/super-admin/b2c?page= */
  public async candidates({ inertia, request }: HttpContext) {
    const [candidates, stats] = await Promise.all([
      this.b2c.listCandidates(this.b2c.parsePage(request.qs())),
      this.b2c.stats(),
    ])
    return inertia.render('dashboard/admin/b2c/Index', { candidates, stats })
  }

  /** GET /dashboard/super-admin/payments?status=&page= */
  public async index({ inertia, request }: HttpContext) {
    const result = await this.payments.list(this.payments.parseFilter(request.qs()))
    return inertia.render('dashboard/admin/payments/Index', { payments: result })
  }

  /** POST /dashboard/super-admin/b2c/:employeeId/entitlement/grant */
  public async grant({ auth, params, response, session }: HttpContext) {
    await this.payments.grant(auth.getUserOrFail(), Number(params.employeeId))
    session.flash('success', ACCESS_GRANTED_MESSAGE)
    return response.redirect(BILLING_ADMIN_PATHS.b2c)
  }

  /** POST /dashboard/super-admin/payments/:id/revoke */
  public async revoke({ auth, params, request, response, session }: HttpContext) {
    const { reason } = await request.validateUsing(revokePaymentValidator)
    await this.payments.revoke(auth.getUserOrFail(), { paymentId: Number(params.id), reason })
    session.flash('success', ACCESS_REVOKED_MESSAGE)
    return response.redirect().back()
  }
}
