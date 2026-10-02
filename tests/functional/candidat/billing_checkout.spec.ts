import { test } from '@japa/runner'
import billingConfig from '#config/billing'
import CandidatePayment from '#models/candidate_payment'
import { BILLING_PATHS, PAYMENT_STATUSES } from '#shared/constants/billing'
import { EXERCICE_RESULTS_TYPES } from '#shared/constants/exercises'
import { createAdvisor, createB2cCandidate, createCandidate } from '#tests/support/actors'
import { type FakeStripeGateway, restoreStripe, swapFakeStripe } from '#tests/support/fake_stripe'
import { assertPage } from '#tests/support/inertia_page'
import { assertFieldErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'

/**
 * Forfait particuliers — Stripe Checkout (#102), `BillingController` :
 * - `GET  /dashboard/candidat/offre`              → page de l'offre ;
 * - `POST /dashboard/candidat/offre/checkout`     → redirection externe vers Stripe ;
 * - `GET  /dashboard/candidat/billing/success`    → réconciliation ;
 * - `GET  /dashboard/candidat/billing/cancel`.
 *
 * Passerelle factice (`swapFakeStripe`) : aucun appel réseau.
 */

const OFFER_PAGE = 'dashboard/candidat/billing/Offer'
const SUCCESS_PAGE = 'dashboard/candidat/billing/Success'
const CONSENTS = { acceptTerms: 'on', waiveWithdrawal: 'on' }

let stripe: FakeStripeGateway
let previousPaymentsEnabled: boolean

function enablePayments(enabled: boolean) {
  billingConfig.paymentsEnabled = enabled
}

test.group('Candidat B2C — offre et checkout (#102)', (group) => {
  group.each.setup(() => truncateDb())
  group.each.setup(() => {
    stripe = swapFakeStripe()
    previousPaymentsEnabled = billingConfig.paymentsEnabled
    enablePayments(true)
    return () => {
      restoreStripe()
      enablePayments(previousPaymentsEnabled)
    }
  })

  test('GET offre : décrit le forfait pour un particulier non payé', async ({ client, assert }) => {
    const { user } = await createB2cCandidate({ emailVerified: true })

    const response = await client.get(BILLING_PATHS.offer).loginAs(user).withInertia()

    const props = assertPage(assert, response, OFFER_PAGE, ['offer'])
    assert.deepEqual(props.offer, {
      hasPaidAccess: false,
      emailVerified: true,
      paymentsEnabled: true,
      priceCents: billingConfig.resultsPriceCents,
      currency: billingConfig.currency,
      termsVersion: (props.offer as { termsVersion: string }).termsVersion,
    })
  })

  test('GET offre : 404 pour un candidat B2B, 403 pour un conseiller', async ({ client }) => {
    const { user } = await createCandidate()
    const b2b = await client.get(BILLING_PATHS.offer).loginAs(user).redirects(0)
    b2b.assertStatus(404)

    const advisor = await client
      .get(BILLING_PATHS.offer)
      .loginAs(await createAdvisor())
      .redirects(0)
    advisor.assertStatus(403)
  })

  test('POST checkout : paiement pending créé et redirection externe (Inertia 409 + X-Inertia-Location)', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createB2cCandidate({ emailVerified: true })

    const response = await client
      .post(BILLING_PATHS.checkout)
      .loginAs(user)
      .withInertia()
      .form(CONSENTS)
      .redirects(0)

    response.assertStatus(409)
    const location = response.header('x-inertia-location')
    assert.match(location ?? '', /^https:\/\/checkout\.stripe\.test\/pay\/cs_test_fake_/)

    const [payment] = await CandidatePayment.query().where('employeeId', employee.id)
    assert.equal(payment.status, PAYMENT_STATUSES.PENDING)
    assert.equal(payment.stripeCheckoutSessionId, stripe.lastSessionId())
    assert.isNotNull(payment.withdrawalWaivedAt)
    assert.lengthOf(stripe.created, 1)
    assert.equal(stripe.created[0].customerEmail, user.email)
  })

  test('POST checkout : cases non cochées → erreurs de validation, rien n’est créé', async ({
    client,
    assert,
  }) => {
    const { user } = await createB2cCandidate({ emailVerified: true })

    const response = await client
      .post(BILLING_PATHS.checkout)
      .loginAs(user)
      .withInertia()
      .header('referer', BILLING_PATHS.offer)
      .form({ acceptTerms: 'on' })
      .redirects(0)

    assertFieldErrors(assert, response, ['waiveWithdrawal'])
    assert.lengthOf(await CandidatePayment.all(), 0)
    assert.lengthOf(stripe.created, 0)
  })

  test('POST checkout : e-mail non vérifié → 403, flash en Inertia', async ({ client, assert }) => {
    const { user } = await createB2cCandidate()

    const response = await client
      .post(BILLING_PATHS.checkout)
      .loginAs(user)
      .withInertia()
      .header('referer', BILLING_PATHS.offer)
      .form(CONSENTS)
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', BILLING_PATHS.offer)
    response.assertFlashMessage(
      'error',
      'Confirmez votre adresse e-mail avant de régler le forfait : le lien vous a été envoyé par e-mail.'
    )
    assert.lengthOf(await CandidatePayment.all(), 0)
  })

  test('POST checkout : déjà payé → 409 ; paiement désactivé → 503', async ({ client, assert }) => {
    const paid = await createB2cCandidate({ emailVerified: true, paid: true })
    const already = await client
      .post(BILLING_PATHS.checkout)
      .loginAs(paid.user)
      .header('Accept', 'application/json')
      .form(CONSENTS)
      .redirects(0)
    already.assertStatus(409)

    enablePayments(false)
    const { user } = await createB2cCandidate({ emailVerified: true })
    const disabled = await client
      .post(BILLING_PATHS.checkout)
      .loginAs(user)
      .header('Accept', 'application/json')
      .form(CONSENTS)
      .redirects(0)
    disabled.assertStatus(503)
    assert.lengthOf(await CandidatePayment.query().where('status', PAYMENT_STATUSES.PENDING), 0)
  })

  test('GET success : réconcilie une session payée et débloque les résultats', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createB2cCandidate({ emailVerified: true })
    await client
      .post(BILLING_PATHS.checkout)
      .loginAs(user)
      .withInertia()
      .form(CONSENTS)
      .redirects(0)
    const sessionId = stripe.lastSessionId()!
    stripe.pay(sessionId)

    const response = await client
      .get(`${BILLING_PATHS.success}?session_id=${sessionId}`)
      .loginAs(user)
      .withInertia()

    const props = assertPage(assert, response, SUCCESS_PAGE, ['paid'])
    assert.isTrue(props.paid)
    const [payment] = await CandidatePayment.query().where('employeeId', employee.id)
    assert.equal(payment.status, PAYMENT_STATUSES.PAID)
    assert.isNotNull(payment.paidAt)

    // Débloqué : la page d'un exercice du forfait est accessible.
    const exercise = await client
      .get(`/dashboard/candidat/exercises/${EXERCICE_RESULTS_TYPES.DISC}`)
      .loginAs(user)
      .withInertia()
    assert.isTrue(assertPage(assert, exercise, 'dashboard/employee/exercises/Home').accessGranted)
  })

  test('GET success : session impayée → page « en cours », rien n’est débloqué', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createB2cCandidate({ emailVerified: true })
    await client
      .post(BILLING_PATHS.checkout)
      .loginAs(user)
      .withInertia()
      .form(CONSENTS)
      .redirects(0)

    const response = await client
      .get(`${BILLING_PATHS.success}?session_id=${stripe.lastSessionId()}`)
      .loginAs(user)
      .withInertia()

    const props = assertPage(assert, response, SUCCESS_PAGE)
    assert.isFalse(props.paid)
    const [payment] = await CandidatePayment.query().where('employeeId', employee.id)
    assert.equal(payment.status, PAYMENT_STATUSES.PENDING)
  })

  test('GET success : session inconnue → 404 ; sans session_id → retour à l’offre', async ({
    client,
  }) => {
    const { user } = await createB2cCandidate({ emailVerified: true })

    const unknown = await client
      .get(`${BILLING_PATHS.success}?session_id=cs_test_unknown`)
      .loginAs(user)
      .header('Accept', 'application/json')
      .redirects(0)
    unknown.assertStatus(404)

    const missing = await client.get(BILLING_PATHS.success).loginAs(user).redirects(0)
    missing.assertStatus(302)
    missing.assertHeader('location', BILLING_PATHS.offer)
  })

  test('GET cancel : flash et retour à l’offre', async ({ client }) => {
    const { user } = await createB2cCandidate({ emailVerified: true })

    const response = await client.get(BILLING_PATHS.cancel).loginAs(user).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', BILLING_PATHS.offer)
    response.assertFlashMessage(
      'error',
      'Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.'
    )
  })

  test('visiteur non connecté : redirigé vers la connexion', async ({ client }) => {
    const response = await client.get(BILLING_PATHS.offer).redirects(0)
    response.assertStatus(302)
    response.assertHeader('location', '/auth/login')
  })
})
