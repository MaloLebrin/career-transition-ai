import { BILLING_CURRENCY, DEFAULT_RESULTS_PRICE_CENTS } from '#shared/constants/billing'
import env from '#start/env'

/**
 * Forfait particuliers (épic B2C #90).
 *
 * `paymentsEnabled` (`STRIPE_ENABLED`, faux par défaut) : tant qu'il est faux,
 * aucun paiement ne peut démarrer et l'interface annonce « bientôt
 * disponible » — les fusions partielles de l'épic restent sans effet en
 * production. Les clés Stripe elles-mêmes arrivent avec `config/stripe.ts` (#102).
 *
 * Lu à chaque requête (prop partagée `entitlement`) : les tests le basculent
 * avec `config.set()`.
 */
const billingConfig = {
  paymentsEnabled: env.get('STRIPE_ENABLED', false),
  /** Prix TTC du forfait, en centimes. */
  resultsPriceCents: env.get('B2C_RESULTS_PRICE_CENTS', DEFAULT_RESULTS_PRICE_CENTS),
  currency: BILLING_CURRENCY,
}

export default billingConfig
