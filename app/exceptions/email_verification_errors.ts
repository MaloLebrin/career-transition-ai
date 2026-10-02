import DomainException from '#exceptions/domain_exception'

/**
 * Erreurs métier de la vérification d'e-mail (`#services/email_verification_service`, #98).
 *
 * Elles étendent `DomainException` : `handler.ts` les traduit en flash +
 * redirect back sur une requête Inertia, en `{ message }` + statut sinon.
 */

/** Renvoi du lien demandé pour une adresse déjà vérifiée → 409. */
export class EmailAlreadyVerifiedError extends DomainException {
  constructor(message: string = 'Votre adresse e-mail est déjà vérifiée.') {
    super(message, { status: 409, code: 'E_EMAIL_ALREADY_VERIFIED' })
  }
}
