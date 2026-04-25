import ContactRequest, { CONTACT_REQUEST_STATUSES } from '#models/contact_request'
import { ContactRequestMailService } from '#services/mail/contact_request_mail_service'
import { createContactRequestValidator } from '#validators/contact_request/create_contact_request_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ContactRequestsController {
  constructor(private mailService: ContactRequestMailService) {}

  public async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createContactRequestValidator)

    const contactRequest = await ContactRequest.create({
      ...payload,
      status: CONTACT_REQUEST_STATUSES.PENDING,
    })

    await Promise.allSettled([
      this.mailService.sendAdminNotification(contactRequest),
      this.mailService.sendConfirmationToRequester(contactRequest),
    ])

    return response.created({ success: true, id: contactRequest.id })
  }
}
