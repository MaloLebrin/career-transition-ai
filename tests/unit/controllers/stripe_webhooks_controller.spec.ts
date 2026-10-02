import StripeWebhooksController from '#controllers/stripe_webhooks_controller'
import { InvalidStripeSignatureError } from '#exceptions/billing_errors'
import type { StripeWebhooksService } from '#services/billing/stripe_webhooks_service'
import { test } from '@japa/runner'

/** Contrôleur fin (#104) : corps brut + signature → service, réponse JSON machine. */
function fakeService() {
  const calls: Array<[string | Buffer, string]> = []
  return {
    calls,
    handle: async (rawBody: string | Buffer, signature: string) => {
      calls.push([rawBody, signature])
      return { eventId: 'evt_1', type: 'x', outcome: 'processed', paymentId: 1 }
    },
  } as unknown as StripeWebhooksService & { calls: Array<[string | Buffer, string]> }
}

function makeCtx(raw: string | null, signature: string | undefined) {
  const state = { body: null as unknown }
  return {
    state,
    ctx: {
      request: { raw: () => raw, header: () => signature },
      response: {
        ok: (body: unknown) => {
          state.body = body
          return body
        },
      },
    } as any,
  }
}

test.group('StripeWebhooksController (#104)', () => {
  test('transmet le corps brut et la signature, répond { received: true }', async ({ assert }) => {
    const service = fakeService()
    const { ctx, state } = makeCtx('{"id":"evt_1"}', 'sig')

    await new StripeWebhooksController(service).handle(ctx)

    assert.deepEqual(service.calls, [['{"id":"evt_1"}', 'sig']])
    assert.deepEqual(state.body, { received: true })
  })

  test('sans signature ou sans corps : 400 avant tout traitement', async ({ assert }) => {
    const service = fakeService()

    await assert.rejects(
      () => new StripeWebhooksController(service).handle(makeCtx('{}', undefined).ctx),
      InvalidStripeSignatureError
    )
    await assert.rejects(
      () => new StripeWebhooksController(service).handle(makeCtx(null, 'sig').ctx),
      InvalidStripeSignatureError
    )
    assert.lengthOf(service.calls, 0)
  })
})
