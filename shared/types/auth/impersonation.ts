/**
 * Prop partagée `impersonation` (#143), présente seulement pendant une prise
 * d'identité : alimente le bandeau « Revenir à mon compte ».
 */
export type ImpersonationInfo = {
  /** Nom du super admin qui a pris l'identité. */
  impersonatorName: string
}

/**
 * Valeur de session d'une prise d'identité (#143) : le compte d'origine et le
 * compte pris, pour n'honorer la clé que sur la session de ce dernier.
 */
export type ImpersonationSession = {
  impersonatorId: number
  targetId: number
}
