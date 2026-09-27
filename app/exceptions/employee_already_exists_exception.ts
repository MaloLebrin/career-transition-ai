import DomainException from '#exceptions/domain_exception'

export const EMPLOYEE_ALREADY_EXISTS_MESSAGES = {
  ACTIVE: 'Un utilisateur avec cet email possède déjà un compte actif dans cette organisation.',
  PENDING:
    "Un candidat avec cet email existe déjà dans cette organisation. Renvoyez-lui le lien d'activation depuis sa fiche.",
} as const

/**
 * Levée à la création d'un candidat quand une fiche existe déjà pour cet email
 * (ou ce compte) dans l'organisation. Le contrôleur la reconnaît par sa classe,
 * jamais par le texte du message.
 */
export default class EmployeeAlreadyExistsException extends DomainException {
  constructor(options: { onboarded: boolean }) {
    super(
      options.onboarded
        ? EMPLOYEE_ALREADY_EXISTS_MESSAGES.ACTIVE
        : EMPLOYEE_ALREADY_EXISTS_MESSAGES.PENDING,
      { status: 409, code: 'E_EMPLOYEE_ALREADY_EXISTS' }
    )
  }
}
