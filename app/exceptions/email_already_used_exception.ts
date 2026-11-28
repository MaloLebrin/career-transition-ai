import DomainException from '#exceptions/domain_exception'

/**
 * Adresse déjà portée par un autre compte, quelle que soit son organisation
 * et sans tenir compte de la casse (#169). Levée par `UserEmailService.assertAvailable`
 * (`#services/user_email_service`), seul contrôle d'unicité des e-mails de compte.
 */
export default class EmailAlreadyUsedException extends DomainException {
  constructor(message: string = 'Cet email est déjà utilisé.') {
    super(message, {
      status: 409,
      code: 'E_EMAIL_ALREADY_USED',
    })
  }
}
