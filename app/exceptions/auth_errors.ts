import DomainException from '#exceptions/domain_exception'

/** Compte désactivé par le super admin (#73) : connexion refusée → 403. */
export class AccountDisabledError extends DomainException {
  constructor(message: string = 'Ce compte est désactivé. Contactez votre administrateur.') {
    super(message, { status: 403, code: 'E_ACCOUNT_DISABLED' })
  }
}

/**
 * Prise d'identité refusée (#143) : un autre super admin (pas d'imbrication,
 * le retour ne saurait plus vers quel compte revenir) ou un compte désactivé
 * (la session serait coupée aussitôt, et le super admin avec) → 409.
 */
export class ImpersonationNotAllowedError extends DomainException {
  constructor(message: string = 'Impossible de prendre l’identité de ce compte.') {
    super(message, { status: 409, code: 'E_IMPERSONATION_NOT_ALLOWED' })
  }
}

/** « Revenir à mon compte » sans prise d'identité en cours (#143) → 409. */
export class NotImpersonatingError extends DomainException {
  constructor(message: string = 'Aucune prise d’identité en cours.') {
    super(message, { status: 409, code: 'E_NOT_IMPERSONATING' })
  }
}
