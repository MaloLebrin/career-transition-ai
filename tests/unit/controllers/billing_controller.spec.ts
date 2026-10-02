import BillingController, {
  MISSING_SESSION_MESSAGE,
  PAYMENT_CANCELED_MESSAGE,
  PAYMENT_SUCCESS_MESSAGE,
} from '#controllers/billing_controller'
import type { CheckoutService } from '#services/billing/checkout_service'
import { BILLING_PATHS } from '#shared/constants/billing'
import { test } from '@japa/runner'

/** Contrôleur fin (#102) : tout passe par `CheckoutService`, remplacé ici par un faux. */
function fakeCheckout(overrides: Partial<Record<keyof CheckoutService, unknown>> = {}) {
  const calls: Record<string, unknown[]> = { offerFor: [], start: [], reconcile: [] }
  return {
    calls,
    offerFor: async (user: unknown) => {
      calls.offerFor.push(user)
      return { hasPaidAccess: false, priceCents: 4900 }
    },
    start: async (user: unknown) => {
      calls.start.push(user)
      return { paymentId: 1, url: 'https://checkout.stripe.test/pay/cs_1' }
    },
    reconcile: async (user: unknown, sessionId: string) => {
      calls.reconcile.push([user, sessionId])
      return { paymentId: 1, paid: true }
    },
    ...overrides,
  } as unknown as CheckoutService & { calls: Record<string, unknown[]> }
}

function makeCtx(input: Record<string, unknown> = {}, validated: Record<string, unknown> = {}) {
  const user = { id: 7 }
  const flashes: Array<[string, string]> = []
  const state = {
    redirectedTo: '',
    location: '',
    rendered: null as null | { page: string; props: unknown },
  }
  const ctx = {
    auth: { getUserOrFail: () => user },
    request: {
      input: (key: string) => input[key],
      validateUsing: async () => validated,
    },
    session: { flash: (key: string, value: string) => flashes.push([key, value]) },
    response: {
      redirect: (url: string) => {
        state.redirectedTo = url
      },
    },
    inertia: {
      render: (page: string, props: unknown) => {
        state.rendered = { page, props }
        return state.rendered
      },
      location: (url: string) => {
        state.location = url
      },
    },
  } as any
  return { ctx, user, flashes, state }
}

test.group('BillingController (#102)', () => {
  test('offer rend la page avec l’offre du candidat connecté', async ({ assert }) => {
    const checkout = fakeCheckout()
    const { ctx, user, state } = makeCtx()

    await new BillingController(checkout).offer(ctx)

    assert.deepEqual(checkout.calls.offerFor, [user])
    assert.equal(state.rendered?.page, 'dashboard/candidat/billing/Offer')
    assert.deepEqual(state.rendered?.props, { offer: { hasPaidAccess: false, priceCents: 4900 } })
  })

  test('checkout valide les consentements puis redirige hors Inertia vers Stripe', async ({
    assert,
  }) => {
    const checkout = fakeCheckout()
    const { ctx, user, state } = makeCtx({}, { acceptTerms: true, waiveWithdrawal: true })

    await new BillingController(checkout).checkout(ctx)

    assert.deepEqual(checkout.calls.start, [user])
    assert.equal(state.location, 'https://checkout.stripe.test/pay/cs_1')
  })

  test('success réconcilie la session et rend la page payée', async ({ assert }) => {
    const checkout = fakeCheckout()
    const { ctx, user, state, flashes } = makeCtx({ session_id: ' cs_test_1 ' })

    await new BillingController(checkout).success(ctx)

    assert.deepEqual(checkout.calls.reconcile, [[user, 'cs_test_1']])
    assert.deepEqual(state.rendered, {
      page: 'dashboard/candidat/billing/Success',
      props: { paid: true },
    })
    assert.deepEqual(flashes, [['success', PAYMENT_SUCCESS_MESSAGE]])
  })

  test('success : paiement encore en attente → page non payée', async ({ assert }) => {
    const checkout = fakeCheckout({
      reconcile: async () => ({ paymentId: 1, paid: false }),
    })
    const { ctx, state, flashes } = makeCtx({ session_id: 'cs_test_1' })

    await new BillingController(checkout).success(ctx)

    assert.deepEqual(state.rendered?.props, { paid: false })
    assert.deepEqual(flashes, [])
  })

  test('success sans session_id : retour à l’offre avec une erreur, sans appel au service', async ({
    assert,
  }) => {
    const checkout = fakeCheckout()
    const { ctx, state, flashes } = makeCtx()

    await new BillingController(checkout).success(ctx)

    assert.lengthOf(checkout.calls.reconcile, 0)
    assert.equal(state.redirectedTo, BILLING_PATHS.offer)
    assert.deepEqual(flashes, [['error', MISSING_SESSION_MESSAGE]])
  })

  test('cancel : flash et retour à l’offre', async ({ assert }) => {
    const { ctx, state, flashes } = makeCtx()

    await new BillingController(fakeCheckout()).cancel(ctx)

    assert.equal(state.redirectedTo, BILLING_PATHS.offer)
    assert.deepEqual(flashes, [['error', PAYMENT_CANCELED_MESSAGE]])
  })
})
