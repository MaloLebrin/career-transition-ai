import DomainException from '#exceptions/domain_exception'

/**
 * Erreurs métier des demandes d'accompagnement par un expert
 * (`#services/expert_requests_service`, #103).
 *
 * Elles étendent `DomainException` : `handler.ts` les traduit en flash +
 * redirect back sur une requête Inertia, en `{ message }` + statut sinon.
 */

/** Candidat d'un cabinet : l'accompagnement passe par son conseiller → 403. */
export class ExpertRequestNotAvailableError extends DomainException {
  constructor(
    message: string = 'La demande d’accompagnement est réservée aux particuliers : votre conseiller vous accompagne déjà.'
  ) {
    super(message, { status: 403, code: 'E_EXPERT_REQUEST_NOT_AVAILABLE' })
  }
}

/** Particulier dont le forfait n'est pas réglé → 403. */
export class ExpertRequestRequiresPaymentError extends DomainException {
  constructor(
    message: string = 'L’accompagnement par un expert est réservé au forfait : réglez-le d’abord.'
  ) {
    super(message, { status: 403, code: 'E_EXPERT_REQUEST_REQUIRES_PAYMENT' })
  }
}

/** Une demande est déjà en attente → 409. */
export class ExpertRequestAlreadyPendingError extends DomainException {
  constructor(
    message: string = 'Votre demande d’accompagnement est déjà enregistrée : un expert vous contactera.'
  ) {
    super(message, { status: 409, code: 'E_EXPERT_REQUEST_ALREADY_PENDING' })
  }
}
