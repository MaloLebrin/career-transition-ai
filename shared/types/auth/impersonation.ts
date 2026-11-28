/**
 * Prop partagée `impersonation` (#143), présente seulement pendant une prise
 * d'identité : alimente le bandeau « Revenir à mon compte ».
 */
export type ImpersonationInfo = {
  /** Nom du super admin qui a pris l'identité. */
  impersonatorName: string
}
