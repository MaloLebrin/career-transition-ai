import DomainException from '#exceptions/domain_exception'

/** Demande de contact absente → 404 (`#services/contact_requests_service`). */
export class ContactRequestNotFoundError extends DomainException {
  constructor(message: string = 'Demande de contact introuvable.') {
    super(message, { status: 404, code: 'E_CONTACT_REQUEST_NOT_FOUND' })
  }
}
