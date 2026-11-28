/** Options du contrôle d'unicité des e-mails de compte (`#services/user_email_service`). */
export interface UserEmailCheckOptions {
  /** Compte dont l'adresse change : il ne se compte pas comme doublon de lui-même. */
  exceptUserId?: number
  /** Message de l'erreur `EmailAlreadyUsedException`, à défaut le message générique. */
  message?: string
}
