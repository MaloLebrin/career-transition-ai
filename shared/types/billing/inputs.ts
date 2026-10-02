/** Entrées du service `EntitlementsService` (#94). */

export interface RevokeEntitlementInput {
  paymentId: number
  /** Motif consigné sur le paiement (`revoke_reason`), jamais vide. */
  reason: string
}
