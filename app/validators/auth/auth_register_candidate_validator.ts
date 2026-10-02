import vine from '@vinejs/vine'

/** Longueur minimale du mot de passe d'un compte créé en libre-service (alignée sur #68). */
export const CANDIDATE_PASSWORD_MIN_LENGTH = 8

/**
 * Inscription d'un particulier (#93) : pas de rôle ni d'organisation dans le
 * payload — le service impose `employee` et l'organisation plateforme. La case
 * CGU est obligatoire (`accepted` : `on`, `1`, `true`, `yes`).
 */
export const registerCandidateValidator = vine.create({
  email: vine.string().trim().email().maxLength(255),
  password: vine.string().trim().minLength(CANDIDATE_PASSWORD_MIN_LENGTH).maxLength(255),
  name: vine.string().trim().minLength(1).maxLength(255),
  acceptTerms: vine.accepted(),
})
