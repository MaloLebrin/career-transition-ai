import DomainException from '#exceptions/domain_exception'

/**
 * Erreurs métier des mots de passe (`#services/passwords_service`, #68).
 *
 * Elles étendent `DomainException` : `handler.ts` les traduit en flash +
 * redirect back sur une requête Inertia, en `{ message }` + statut sinon.
 */

/** Changement de mot de passe : le mot de passe actuel saisi est faux → 422. */
export class InvalidCurrentPasswordError extends DomainException {
  constructor(message: string = 'Le mot de passe actuel est incorrect.') {
    super(message, { status: 422, code: 'E_INVALID_CURRENT_PASSWORD' })
  }
}

/** Lien de réinitialisation inconnu, expiré ou déjà utilisé → 404. */
export class InvalidPasswordResetTokenError extends DomainException {
  constructor(
    message: string = 'Ce lien de réinitialisation est invalide ou a expiré. Faites une nouvelle demande.'
  ) {
    super(message, { status: 404, code: 'E_INVALID_PASSWORD_RESET_TOKEN' })
  }
}
