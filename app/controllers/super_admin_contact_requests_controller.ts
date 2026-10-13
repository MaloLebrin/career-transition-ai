import { ContactRequestsService } from '#services/contact_requests_service'
import { parseContactRequestListParams } from '#shared/helpers/contact_request/list_params'
import { contactRequestStatusValidator } from '#validators/super_admin/contact_request_status_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

/** Boîte des demandes de contact / démo du site public, côté super admin (#73). */
@inject()
export default class SuperAdminContactRequestsController {
  constructor(private contactRequests: ContactRequestsService) {}

  /** GET /dashboard/super-admin/contact-requests */
  public async index({ inertia, request }: HttpContext) {
    const params = parseContactRequestListParams(request.qs())
    const { items, pagination } = await this.contactRequests.list(params)

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
}
