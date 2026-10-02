import { InvalidStripeSignatureError } from '#exceptions/billing_errors'
import { StripeWebhooksService } from '#services/billing/stripe_webhooks_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * `POST /webhooks/stripe` (#104). Route machine appelée par Stripe, hors UI
 * Inertia : la réponse JSON est ici légitime (règle CLAUDE.md « JSON réservé
 * à /dashboard/ai/*, exports et SSE » — et aux webhooks). Le corps brut,
 * conservé par le bodyparser (`updateRawBody`), sert à vérifier la signature.
 */
@inject()
export default class StripeWebhooksController {
  constructor(private webhooks: StripeWebhooksService) {}

  public async handle({ request, response }: HttpContext) {
    const rawBody = request.raw()
    const signature = request.header('stripe-signature')
    if (!rawBody || !signature) throw new InvalidStripeSignatureError()

    await this.webhooks.handle(rawBody, signature)
    return response.ok({ received: true })
  }
}
