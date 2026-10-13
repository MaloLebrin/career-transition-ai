import DomainException from '#exceptions/domain_exception'

/**
 * Erreurs métier des actions du conseiller sur une fiche candidat
 * (`#services/employees_service`).
 *
 * Elles étendent `DomainException` : `handler.ts` les traduit en flash +
 * redirect back sur une requête Inertia, en `{ message }` + statut sinon.
 */

/** Candidat absent ou hors du périmètre de l'équipe → 404, jamais 403. */
export class EmployeeNotFoundError extends DomainException {
  constructor(message: string = 'Candidat introuvable.') {
    super(message, { status: 404, code: 'E_EMPLOYEE_NOT_FOUND' })
  }
}

/** Renvoi d'invitation pour un candidat qui a déjà activé son compte → 409. */
export class EmployeeAlreadyOnboardedError extends DomainException {
  constructor(message: string = 'Ce candidat a déjà terminé son onboarding.') {
    super(message, { status: 409, code: 'E_EMPLOYEE_ALREADY_ONBOARDED' })
  }
}
