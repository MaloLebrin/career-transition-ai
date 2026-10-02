import { STRIPE_WEBHOOK_PATH } from '#shared/constants/billing'
import router from '@adonisjs/core/services/router'

const StripeWebhooksController = () => import('#controllers/stripe_webhooks_controller')

/**
 * Webhooks entrants (#104) : hors `guest` / `auth`, sans throttle (la
 * signature Stripe authentifie chaque appel), exemptés de CSRF
 * (`config/shield.ts`).
 */
router.post(STRIPE_WEBHOOK_PATH, [StripeWebhooksController, 'handle']).as('webhooks.stripe')
