import type { AccountType } from '#shared/constants/b2c'
import type { ExerciceResultType } from '#shared/constants/exercises'

/**
 * Droits d'accès aux résultats d'un candidat (épic #90).
 *
 * Calculé côté serveur (`EntitlementsService`, #94) et partagé aux pages
 * Inertia : le front n'en déduit que l'affichage, le verrouillage réel reste
 * dans les services.
 */
export type ResultsEntitlement = {
  accountType: AccountType
  /** B2B : toujours `true` (l'accès est porté par le cabinet). B2C : forfait réglé. */
  hasPaidAccess: boolean
  /** Exercices accessibles sans paiement (`B2C_FREE_EXERCISE_TYPES`). */
  freeExerciseTypes: ExerciceResultType[]
  /** `STRIPE_ENABLED` : permet d'afficher le bouton de paiement ou « bientôt disponible ». */
  paymentsEnabled: boolean
}
