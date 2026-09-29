import DomainException from '#exceptions/domain_exception'

/**
 * Erreurs métier des droits RGPD en libre-service du candidat
 * (`#services/candidate_data_requests_service`, #70).
 *
 * Elles étendent `DomainException` : `handler.ts` les traduit en flash +
 * redirect back sur une requête Inertia, en `{ message }` + statut sinon.
 */

/** Compte candidat sans fiche dans son organisation → 404. */
export class CandidateProfileNotFoundError extends DomainException {
  constructor(message: string = 'Profil candidat introuvable.') {
    super(message, { status: 404, code: 'E_CANDIDATE_PROFILE_NOT_FOUND' })
  }
}

/** Demande d'effacement déjà enregistrée, en attente de traitement → 409. */
export class ErasureAlreadyRequestedError extends DomainException {
  constructor(
    message: string = 'Votre demande d’effacement est déjà enregistrée : elle sera traitée sous un mois.'
  ) {
    super(message, { status: 409, code: 'E_ERASURE_ALREADY_REQUESTED' })
  }
}
