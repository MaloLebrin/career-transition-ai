import DomainException from '#exceptions/domain_exception'

/**
 * Erreurs métier de l'équipe d'un cabinet (`#services/team_members_service`,
 * `#services/advisor_service`, `#services/employees_service`).
 *
 * Elles étendent `DomainException` : `handler.ts` les traduit en flash +
 * redirect back sur une requête Inertia, en `{ message }` + statut sinon.
 */

/** Membre absent ou d'une autre organisation → 404, jamais 403. */
export class TeamMemberNotFoundError extends DomainException {
  constructor(message: string = 'Membre introuvable.') {
    super(message, { status: 404, code: 'E_TEAM_MEMBER_NOT_FOUND' })
  }
}

/** Son propre compte, ou le dernier administrateur actif du cabinet → 422. */
export class TeamMemberLockedError extends DomainException {
  constructor(
    message: string = 'Cette action est impossible sur votre compte ou sur le dernier administrateur.'
  ) {
    super(message, { status: 422, code: 'E_TEAM_MEMBER_LOCKED' })
  }
}

/** Destinataire d'une réassignation absent, désactivé ou identique à la source → 422. */
export class TeamReassignTargetInvalidError extends DomainException {
  constructor(message: string = 'Choisissez un autre membre actif du cabinet.') {
    super(message, { status: 422, code: 'E_TEAM_REASSIGN_TARGET_INVALID' })
  }
}

/** Plus de licence conseiller disponible (`MAX_LICENSES_ADVISORS`) → 409. */
export class AdvisorLicenseLimitReachedError extends DomainException {
  constructor(max: number) {
    super(`Limite de ${max} licences conseiller atteinte pour ce cabinet.`, {
      status: 409,
      code: 'E_ADVISOR_LICENSE_LIMIT',
    })
  }
}

/** Plus de licence candidat disponible (`MAX_LICENSES_CANDIDATES`) → 409. */
export class CandidateLicenseLimitReachedError extends DomainException {
  constructor(max: number) {
    super(`Limite de ${max} candidats atteinte pour ce cabinet (fiches archivées exclues).`, {
      status: 409,
      code: 'E_CANDIDATE_LICENSE_LIMIT',
    })
  }
}
