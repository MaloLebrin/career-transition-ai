import env from '#start/env'
import app from '@adonisjs/core/services/app'

/**
 * Stripe Checkout (forfait particuliers, #102). Voir docs/STRIPE.md.
 *
 * `STRIPE_ENABLED` (config/billing.ts) ouvre le paiement ; dès qu'il est vrai en
 * production, les deux clés sont exigées au démarrage — un checkout qui
 * échouerait au premier clic est pire qu'un serveur qui refuse de démarrer.
 * Hors production, l'app démarre sans clés : seul un appel à la passerelle
 * échoue (`PaymentGatewayNotConfiguredError`), et les tests passent par
 * `swapFakeStripe()`.
 */
export const STRIPE_PRODUCTION_ENV = [
  'STRIPE_ENABLED',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
] as const

function isEnabled(value: string | undefined): boolean {
  return value === 'true' || value === '1'
}

/** Incohérences bloquantes en production quand le paiement est activé. */
export function stripeProductionErrors(
  read: (name: (typeof STRIPE_PRODUCTION_ENV)[number]) => string | undefined
): string[] {
  if (!isEnabled(read('STRIPE_ENABLED'))) return []

  const errors: string[] = []
  const secretKey = read('STRIPE_SECRET_KEY')?.trim()
  if (!secretKey) errors.push('STRIPE_SECRET_KEY manquante (STRIPE_ENABLED=true)')
  else if (!secretKey.startsWith('sk_')) errors.push('STRIPE_SECRET_KEY invalide (attendu sk_…)')

  const webhookSecret = read('STRIPE_WEBHOOK_SECRET')?.trim()
  if (!webhookSecret) errors.push('STRIPE_WEBHOOK_SECRET manquante (STRIPE_ENABLED=true)')
  else if (!webhookSecret.startsWith('whsec_')) {
    errors.push('STRIPE_WEBHOOK_SECRET invalide (attendu whsec_…)')
  }
  return errors
}

const errors = stripeProductionErrors((name) => {
  const value = env.get(name)
  return value === undefined ? undefined : String(value)
})
if (app.inProduction && errors.length > 0) {
  throw new Error(`Stripe : ${errors.join(' ; ')} (voir docs/STRIPE.md)`)
}

const stripeConfig = {
  secretKey: env.get('STRIPE_SECRET_KEY')?.trim() || null,
  webhookSecret: env.get('STRIPE_WEBHOOK_SECRET')?.trim() || null,
}

export default stripeConfig
