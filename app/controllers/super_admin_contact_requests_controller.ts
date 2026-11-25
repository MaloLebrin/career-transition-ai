import { ContactBlocklistService } from '#services/contact_blocklist_service'
import { ContactRequestsService } from '#services/contact_requests_service'
import { SuperAdminUsersService } from '#services/super_admin_users_service'
import { parseContactRequestListParams } from '#shared/helpers/contact_request/list_params'
import { contactRequestStatusValidator } from '#validators/super_admin/contact_request_status_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

/** Boîte des demandes de contact / démo du site public, côté super admin (#73). */
@inject()
export default class SuperAdminContactRequestsController {
  constructor(
    private contactRequests: ContactRequestsService,
    private blocklist: ContactBlocklistService,
    private users: SuperAdminUsersService
  ) {}

  /** GET /dashboard/super-admin/contact-requests */
  public async index({ inertia, request, auth }: HttpContext) {
    const params = parseContactRequestListParams(request.qs())
    const { items, pagination } = await this.contactRequests.list(params, auth.getUserOrFail().id)

    return inertia.render('dashboard/admin/contact_requests/Index', {
      requests: items,
      pagination,
      filters: {
        search: params.search,
        status: params.status ?? 'all',
        type: params.type ?? 'all',
      },
    })
  }

  /** POST /dashboard/super-admin/contact-requests/:id/status */
  public async updateStatus({ params, request, response, session }: HttpContext) {
    const payload = await request.validateUsing(contactRequestStatusValidator)
    await this.contactRequests.updateStatus(Number(params.id), payload.status)
    session.flash('success', 'Demande mise à jour.')
    return response.redirect().back()
  }

  /** POST /dashboard/super-admin/contact-requests/:id/block-sender */
  public async blockSender({ params, response, session, auth }: HttpContext) {
    const contactRequest = await this.blocklist.blockSender(auth.getUserOrFail(), Number(params.id))
    session.flash(
      'success',
      `${contactRequest.email} est bloquée : ses prochaines demandes seront ignorées.`
    )
    return response.redirect().back()
  }

  /** POST /dashboard/super-admin/contact-requests/:id/unblock-sender */
  public async unblockSender({ params, response, session }: HttpContext) {
    const contactRequest = await this.blocklist.unblockSender(Number(params.id))
    session.flash('success', `${contactRequest.email} est débloquée.`)
    return response.redirect().back()
  }

  /** POST /dashboard/super-admin/contact-requests/:id/disable-account */
  public async disableAccount({ params, response, session, auth }: HttpContext) {
    const contactRequest = await this.blocklist.findRequest(Number(params.id))
    const user = await this.users.setDisabledForContactSender(
      auth.getUserOrFail(),
      contactRequest.email,
      true
    )
    session.flash('success', `Compte de ${user.name} désactivé.`)
    return response.redirect().back()
  }

  /** POST /dashboard/super-admin/contact-requests/:id/enable-account */
  public async enableAccount({ params, response, session, auth }: HttpContext) {
    const contactRequest = await this.blocklist.findRequest(Number(params.id))
    const user = await this.users.setDisabledForContactSender(
      auth.getUserOrFail(),
      contactRequest.email,
      false
    )
    session.flash('success', `Compte de ${user.name} réactivé.`)
    return response.redirect().back()
  }
}
