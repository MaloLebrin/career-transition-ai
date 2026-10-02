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

/** Demande inexistante → 404. */
export class ExpertRequestNotFoundError extends DomainException {
  constructor(message: string = 'Demande d’accompagnement introuvable.') {
    super(message, { status: 404, code: 'E_EXPERT_REQUEST_NOT_FOUND' })
  }
}

/** Demande déjà traitée (acceptée, refusée ou clôturée) → 409. */
export class ExpertRequestNotPendingError extends DomainException {
  constructor(message: string = 'Cette demande a déjà été traitée.') {
    super(message, { status: 409, code: 'E_EXPERT_REQUEST_NOT_PENDING' })
  }
}

/** Utilisateur choisi hors de l’équipe interne de la plateforme → 422. */
export class ExpertNotEligibleError extends DomainException {
  constructor(
    message: string = 'Cet utilisateur ne fait pas partie de l’équipe interne : choisissez un expert de la plateforme.'
  ) {
    super(message, { status: 422, code: 'E_EXPERT_NOT_ELIGIBLE' })
  }
}

/** Le candidat a déjà un conseiller ou un expert assigné → 409. */
export class ExpertAlreadyAssignedError extends DomainException {
  constructor(
    message: string = 'Ce candidat a déjà un conseiller ou un expert assigné : aucune demande d’accompagnement n’est possible.'
  ) {
    super(message, { status: 409, code: 'E_EXPERT_ALREADY_ASSIGNED' })
  }
}
