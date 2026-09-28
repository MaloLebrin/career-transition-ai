import { ContactRequestsService } from '#services/contact_requests_service'
import { createContactRequestValidator } from '#validators/contact_request/create_contact_request_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ContactRequestsController {
  constructor(private contactRequestsService: ContactRequestsService) {}

  /**
   * POST /contact-requests — soumis par `useForm` (Inertia) : redirection vers
   * la page d'origine, jamais de JSON (règle `inertia-no-fetch-json`).
   */
  public async store({ request, response, session }: HttpContext) {
    const payload = await request.validateUsing(createContactRequestValidator)

    await this.contactRequestsService.create(payload)

    session.flash('success', 'Votre message a bien été envoyé.')
    return response.redirect().back()
  }
}
