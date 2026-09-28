import ContactRequest, { CONTACT_REQUEST_STATUSES } from '#models/contact_request'
import { ContactRequestMailService } from '#services/mail/contact_request_mail_service'
import type { CreateContactRequestInput } from '#shared/types/contact_request/inputs'
import { inject } from '@adonisjs/core'

/**
 * Demandes de contact / démo du formulaire public (`ContactDemoForm`).
 */
@inject()
export class ContactRequestsService {
  constructor(private mailService: ContactRequestMailService) {}

  /**
   * Enregistre la demande (statut `pending`) puis prévient l'équipe et le
   * demandeur. Un échec d'envoi n'annule pas la demande : elle reste en base.
   */
  public async create(input: CreateContactRequestInput): Promise<ContactRequest> {
    const contactRequest = await ContactRequest.create({
      ...input,
      status: CONTACT_REQUEST_STATUSES.PENDING,
    })

    await Promise.allSettled([
      this.mailService.sendAdminNotification(contactRequest),
      this.mailService.sendConfirmationToRequester(contactRequest),
    ])

    return contactRequest
  }
}
