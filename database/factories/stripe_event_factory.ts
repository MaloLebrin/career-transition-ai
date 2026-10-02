import StripeEvent from '#models/stripe_event'
import { STRIPE_WEBHOOK_EVENTS } from '#shared/constants/billing'
import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'

/** Par défaut : événement `checkout.session.completed` déjà traité. État `pending` : traitement interrompu. */
export const StripeEventFactory = factory
  .define(StripeEvent, ({ faker }) => {
    return {
      stripeEventId: `evt_test_${faker.string.alphanumeric(24)}`,
      type: STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED as string,
      livemode: false,
      processedAt: DateTime.now() as DateTime | null,
    }
  })
  .state('pending', (event) => {
    event.processedAt = null
  })
  .build()
