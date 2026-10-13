import DomainException from '#exceptions/domain_exception'

/** Compte désactivé par le super admin (#73) : connexion refusée → 403. */
export class AccountDisabledError extends DomainException {
  constructor(message: string = 'Ce compte est désactivé. Contactez votre administrateur.') {
    super(message, { status: 403, code: 'E_ACCOUNT_DISABLED' })
  }
}
