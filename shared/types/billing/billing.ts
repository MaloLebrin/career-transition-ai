/**
 * Prop partagée `billing` (#101) : ce que l'interface a besoin de savoir du
 * forfait pour afficher un prix ou « Bientôt disponible », quel que soit le
 * rôle connecté. Le prix réel facturé reste côté serveur (`config/billing.ts`).
 */
export interface BillingInfo {
  /** `STRIPE_ENABLED`. */
  paymentsEnabled: boolean
  /** Prix TTC du forfait, en centimes. */
  resultsPriceCents: number
  /** Code ISO 4217 en minuscules (`eur`). */
  currency: string
}
