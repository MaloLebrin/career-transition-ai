import { ExpertRequestsService } from '#services/expert_requests_service'
import { EXPERT_REQUEST_PATHS } from '#shared/constants/expert_request'
import { createExpertRequestValidator } from '#validators/expert_request/create_expert_request_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

export const EXPERT_REQUEST_SENT_MESSAGE =
  'Votre demande est envoyée : un expert vous contactera prochainement.'

/** Demande d'accompagnement par un expert (#103), côté candidat. */
@inject()
export default class ExpertRequestsController {
  constructor(private expertRequests: ExpertRequestsService) {}

  /** GET /dashboard/candidat/accompagnement */
  public async index({ auth, inertia }: HttpContext) {
    return inertia.render('dashboard/candidat/expert/Index', {
      support: await this.expertRequests.supportViewFor(auth.getUserOrFail()),
    })
  }

  /** POST /dashboard/candidat/expert-requests */
  public async store({ auth, request, response, session }: HttpContext) {
    const payload = await request.validateUsing(createExpertRequestValidator)
    await this.expertRequests.createForUser(auth.getUserOrFail(), payload)
    session.flash('success', EXPERT_REQUEST_SENT_MESSAGE)
    return response.redirect(EXPERT_REQUEST_PATHS.page)
  }
}
