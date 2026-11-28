/** Mise à jour du profil conseiller / admin (payload de `userProfileUpdateValidator`, #143). */
export interface UpdateProfileInput {
  name: string
  email: string
}

/**
 * Résultat de la mise à jour du profil (#143) : le nom change tout de suite,
 * l'e-mail seulement après le clic sur le lien envoyé à la nouvelle adresse.
 */
export interface UpdateProfileResult {
  /** Adresse à laquelle un lien de confirmation vient d'être envoyé, `null` si l'e-mail n'a pas changé. */
  pendingEmail: string | null
}

/**
 * Issue du clic sur un lien `/auth/verify-email/:token` (#98, #143) :
 * - `verified` : l'adresse actuelle est confirmée ;
 * - `email_changed` : la nouvelle adresse remplace l'ancienne ;
 * - `email_taken` : la nouvelle adresse a été prise par un autre compte entre-temps ;
 * - `invalid` : lien inconnu, expiré ou déjà utilisé.
 */
export type EmailVerificationOutcome = 'verified' | 'email_changed' | 'email_taken' | 'invalid'

export interface EmailVerificationResult {
  outcome: EmailVerificationOutcome
}
