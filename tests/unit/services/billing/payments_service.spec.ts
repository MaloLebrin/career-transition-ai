import { makeEntitlements, testNotifications } from '#tests/support/entitlements'
import { CandidatePaymentFactory } from '#database/factories/candidate_payment_factory'
import type CandidatePayment from '#models/candidate_payment'
import type Employee from '#models/employee'
import { PaymentsService } from '#services/billing/payments_service'
import { EntitlementsService } from '#services/entitlements_service'
import { setErrorReporter, type ErrorContext } from '#services/error_tracking_service'
import {
  DUPLICATE_PAYMENT_REVOKE_REASON,
  PAYMENT_STATUSES,
  STRIPE_REFUND_REVOKE_REASON,
} from '#shared/constants/billing'
import { createB2cCandidate } from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

/** `EntitlementsService` observé : on compte les déblocages notifiés. */
class SpyEntitlements extends EntitlementsService {
  unlocked: Array<{ employeeId: number; paymentId: number }> = []
  revoked: Array<{ employeeId: number; paymentId: number }> = []
  async unlockResults(employee: Employee, payment: CandidatePayment) {
    this.unlocked.push({ employeeId: employee.id, paymentId: payment.id })
  }
  async revokeResults(employee: Employee, payment: CandidatePayment) {
    this.revoked.push({ employeeId: employee.id, paymentId: payment.id })
  }
}

test.group('PaymentsService.markPaid (#102)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('passe un paiement pending en paid, trace l’intent, ouvre le droit une fois', async ({
    assert,
  }) => {
    const spy = new SpyEntitlements(testNotifications())
    const service = new PaymentsService(spy)
    const { employee } = await createB2cCandidate()
    const payment = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    }).create()
    assert.isFalse(await spy.hasResultsAccess(employee.id))

    const changed = await service.markPaid(payment, { paymentIntentId: 'pi_test_1' })

    assert.isTrue(changed)
    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.PAID)
    assert.equal(payment.stripePaymentIntentId, 'pi_test_1')
    assert.isNotNull(payment.paidAt)
    assert.isTrue(await spy.hasResultsAccess(employee.id))
    assert.deepEqual(spy.unlocked, [{ employeeId: employee.id, paymentId: payment.id }])
  })

  test('idempotent : un second passage (webhook puis réconciliation) ne fait rien', async ({
    assert,
  }) => {
    const spy = new SpyEntitlements(testNotifications())
    const service = new PaymentsService(spy)
    const { employee } = await createB2cCandidate()
    const payment = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    }).create()
    const paidAt = DateTime.now().minus({ minutes: 5 }).startOf('second')

    assert.isTrue(await service.markPaid(payment, { paymentIntentId: 'pi_first', paidAt }))
    assert.isFalse(await service.markPaid(payment, { paymentIntentId: 'pi_second' }))

    await payment.refresh()
    assert.equal(payment.stripePaymentIntentId, 'pi_first')
    assert.equal(payment.paidAt?.toISO(), paidAt.toISO())
    assert.lengthOf(spy.unlocked, 1)
  })

  test('ne touche pas un paiement déjà remboursé ou annulé', async ({ assert }) => {
    const spy = new SpyEntitlements(testNotifications())
    const service = new PaymentsService(spy)
    const { employee } = await createB2cCandidate()
    const refunded = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    })
      .apply('refunded')
      .create()

    assert.isFalse(await service.markPaid(refunded, { paymentIntentId: 'pi_x' }))
    await refunded.refresh()
    assert.equal(refunded.status, PAYMENT_STATUSES.REFUNDED)
    assert.lengthOf(spy.unlocked, 0)
  })

  test('findByCheckoutSession retrouve le paiement par sa session', async ({ assert }) => {
    const service = new PaymentsService(makeEntitlements())
    const { employee } = await createB2cCandidate()
    const payment = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
      stripeCheckoutSessionId: 'cs_test_lookup',
    }).create()

    const found = await service.findByCheckoutSession('cs_test_lookup')
    assert.equal(found?.id, payment.id)
    assert.isNull(await service.findByCheckoutSession('cs_test_unknown'))
  })
})

test.group('PaymentsService — échec, annulation, remboursement (#104)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function pendingFor(spy: SpyEntitlements) {
    const { employee } = await createB2cCandidate()
    const payment = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    }).create()
    return { employee, payment, service: new PaymentsService(spy) }
  }

  test('markFailed et markCanceled ne partent que de pending', async ({ assert }) => {
    const spy = new SpyEntitlements(testNotifications())
    const { payment, service } = await pendingFor(spy)

    assert.isTrue(await service.markFailed(payment))
    assert.equal(payment.status, PAYMENT_STATUSES.FAILED)
    assert.isFalse(await service.markCanceled(payment))
    assert.isFalse(await service.markPaid(payment, { paymentIntentId: 'pi_late' }))
    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.FAILED)

    const { payment: other } = await pendingFor(spy)
    assert.isTrue(await service.markCanceled(other))
    assert.equal(other.status, PAYMENT_STATUSES.CANCELED)
    assert.lengthOf(spy.unlocked, 0)
  })

  test('refund : paid → refunded, dates et motif posés, droit retiré une seule fois', async ({
    assert,
  }) => {
    const spy = new SpyEntitlements(testNotifications())
    const { employee } = await createB2cCandidate()
    const payment = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    })
      .apply('paid')
      .create()
    const service = new PaymentsService(spy)
    const refundedAt = DateTime.now().minus({ hours: 1 }).startOf('second')

    assert.isTrue(await service.refund(payment, { refundedAt }))
    assert.isFalse(await service.refund(payment))

    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.REFUNDED)
    assert.equal(payment.refundedAt?.toISO(), refundedAt.toISO())
    assert.isNotNull(payment.revokedAt)
    assert.equal(payment.revokeReason, STRIPE_REFUND_REVOKE_REASON)
    assert.isFalse(payment.grantsAccess)
    assert.deepEqual(spy.revoked, [{ employeeId: employee.id, paymentId: payment.id }])
  })

  test('refund ignore un paiement pending ou déjà remboursé', async ({ assert }) => {
    const spy = new SpyEntitlements(testNotifications())
    const { payment, service } = await pendingFor(spy)
    const { employee } = await createB2cCandidate()
    const refunded = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    })
      .apply('refunded')
      .create()

    assert.isFalse(await service.refund(payment))
    assert.isFalse(await service.refund(refunded))
    assert.lengthOf(spy.revoked, 0)
  })

  test('findById et findByPaymentIntent', async ({ assert }) => {
    const service = new PaymentsService(makeEntitlements())
    const { employee } = await createB2cCandidate()
    const payment = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    })
      .apply('paid')
      .create()
    payment.stripePaymentIntentId = 'pi_lookup'
    await payment.save()

    const byId = await service.findById(payment.id)
    assert.equal(byId?.id, payment.id)
    assert.isNull(await service.findById(Number.NaN))
    assert.isNull(await service.findById(0))
    const byIntent = await service.findByPaymentIntent('pi_lookup')
    assert.equal(byIntent?.id, payment.id)
    assert.isNull(await service.findByPaymentIntent('pi_unknown'))
  })
})

/** Observe `unlockResults` / `revokeResults` et peut les faire échouer une fois. */
class FlakyEntitlements extends EntitlementsService {
  unlockCalls = 0
  revokeCalls = 0
  failUnlock = false
  failRevoke = false
  async unlockResults(_employee: Employee, _payment: CandidatePayment) {
    this.unlockCalls++
    if (this.failUnlock) {
      this.failUnlock = false
      throw new Error('file d’attente indisponible')
    }
  }
  async revokeResults(_employee: Employee, _payment: CandidatePayment) {
    this.revokeCalls++
    if (this.failRevoke) {
      this.failRevoke = false
      throw new Error('notification indisponible')
    }
  }
}

test.group('PaymentsService — effets rejouables (#109 M1)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function pending() {
    const { employee } = await createB2cCandidate()
    const payment = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    }).create()
    return { employee, payment }
  }

  test('unlock lève → rejeu du webhook → effets exécutés, puis une seule fois', async ({
    assert,
  }) => {
    const entitlements = new FlakyEntitlements(testNotifications())
    const service = new PaymentsService(entitlements)
    const { payment } = await pending()
    entitlements.failUnlock = true

    await assert.rejects(() => service.markPaid(payment, { paymentIntentId: 'pi_replay' }))
    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.PAID)
    assert.isNull(payment.unlockEffectsAt)
    assert.equal(entitlements.unlockCalls, 1)

    // Reprise du webhook : le paiement est déjà `paid`, les effets sont rejoués.
    assert.isFalse(await service.markPaid(payment, { paymentIntentId: 'pi_replay' }))
    await payment.refresh()
    assert.isNotNull(payment.unlockEffectsAt)
    assert.equal(entitlements.unlockCalls, 2)

    // Troisième livraison : marqueur posé, plus aucun effet.
    assert.isFalse(await service.markPaid(payment, { paymentIntentId: 'pi_replay' }))
    assert.equal(entitlements.unlockCalls, 2)
  })

  test('refund : un retrait dont les effets ont échoué est rejoué une seule fois', async ({
    assert,
  }) => {
    const entitlements = new FlakyEntitlements(testNotifications())
    const service = new PaymentsService(entitlements)
    const { employee } = await createB2cCandidate()
    const payment = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    })
      .apply('paid')
      .create()
    entitlements.failRevoke = true

    await assert.rejects(() => service.refund(payment))
    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.REFUNDED)
    assert.isNull(payment.revokeEffectsAt)

    assert.isFalse(await service.refund(payment))
    assert.equal(entitlements.revokeCalls, 2)
    await payment.refresh()
    assert.isNotNull(payment.revokeEffectsAt)
    assert.isFalse(await service.refund(payment))
    assert.equal(entitlements.revokeCalls, 2)
  })

  test('refund après une révocation manuelle : ni date ni motif écrasés, aucune notification', async ({
    assert,
  }) => {
    const entitlements = new FlakyEntitlements(testNotifications())
    const service = new PaymentsService(entitlements)
    const { employee } = await createB2cCandidate()
    const revokedAt = DateTime.now().minus({ hours: 5 }).startOf('second')
    const payment = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    })
      .apply('revoked')
      .create()
    payment.revokedAt = revokedAt
    await payment.save()

    assert.isTrue(await service.refund(payment))

    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.REFUNDED)
    assert.isNotNull(payment.refundedAt)
    assert.equal(payment.revokedAt?.toISO(), revokedAt.toISO())
    assert.equal(payment.revokeReason, 'Révocation de test')
    assert.equal(entitlements.revokeCalls, 0)
  })

  test('paiement encaissé alors qu’un droit est déjà actif : conservé, révoqué, signalé, sans effet', async ({
    assert,
  }) => {
    const entitlements = new FlakyEntitlements(testNotifications())
    const service = new PaymentsService(entitlements)
    const { employee } = await createB2cCandidate({ paid: true })
    const payment = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    }).create()
    const reported: ErrorContext[] = []
    const previous = setErrorReporter({ capture: (_error, context) => reported.push(context) })

    try {
      assert.isFalse(await service.markPaid(payment, { paymentIntentId: 'pi_dup' }))
    } finally {
      setErrorReporter(previous)
    }

    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.PAID)
    assert.equal(payment.stripePaymentIntentId, 'pi_dup')
    assert.isNotNull(payment.revokedAt)
    assert.equal(payment.revokeReason, DUPLICATE_PAYMENT_REVOKE_REASON)
    assert.equal(entitlements.unlockCalls, 0)
    assert.lengthOf(reported, 1)
    assert.equal(reported[0].tags?.step, 'duplicate_paid')
    // Le droit d'origine n'est pas touché.
    assert.isTrue(await entitlements.hasResultsAccess(employee.id))
  })

  test('sessionMatches : écart de session, de montant ou de devise → refusé et signalé', async ({
    assert,
  }) => {
    const service = new PaymentsService(new FlakyEntitlements(testNotifications()))
    const { payment } = await pending()
    const reported: ErrorContext[] = []
    const previous = setErrorReporter({ capture: (_error, context) => reported.push(context) })

    try {
      assert.isTrue(
        service.sessionMatches(payment, {
          sessionId: payment.stripeCheckoutSessionId,
          amountTotal: payment.amountCents,
          currency: 'EUR',
        })
      )
      assert.isTrue(service.sessionMatches(payment, {}))
      assert.isFalse(service.sessionMatches(payment, { sessionId: 'cs_autre' }))
      assert.isFalse(service.sessionMatches(payment, { amountTotal: 1 }))
      assert.isFalse(service.sessionMatches(payment, { currency: 'usd' }))
    } finally {
      setErrorReporter(previous)
    }
    assert.lengthOf(reported, 3)
  })

  test('sessionMatches (#139) : le sous-total Stripe est comparé au prix brut (encaissé + remise), avant comme après règlement', async ({
    assert,
  }) => {
    const service = new PaymentsService(new FlakyEntitlements(testNotifications()))
    // Un seul droit actif par fiche (index unique partiel) : une fiche par état réglé.
    const make = async (state?: 'discounted' | 'free') => {
      const { employee } = await createB2cCandidate()
      const factory = CandidatePaymentFactory.merge({
        employeeId: employee.id,
        organizationId: employee.organizationId,
      })
      return (state ? factory.apply(state) : factory).create()
    }
    const pending = await make()
    const discounted = await make('discounted')
    const free = await make('free')
    const reported: ErrorContext[] = []
    const previous = setErrorReporter({ capture: (_error, context) => reported.push(context) })

    try {
      // Session remisée annoncée par Stripe : sous-total 49 €, total 39,20 €.
      const announced = { amountSubtotal: 4900, amountTotal: 3920, currency: 'eur' }
      assert.isTrue(service.sessionMatches(pending, announced))
      assert.isTrue(service.sessionMatches(discounted, announced))
      assert.isTrue(service.sessionMatches(free, { amountSubtotal: 4900, amountTotal: 0 }))
      assert.equal(discounted.grossAmountCents, 4900)
      assert.equal(free.grossAmountCents, 4900)
      // Sous-total différent du prix catalogue : écart.
      assert.isFalse(service.sessionMatches(pending, { amountSubtotal: 4800, amountTotal: 4800 }))
      // Sans sous-total (événement allégé) : repli sur le total, un paiement remisé est refusé (côté sûr).
      assert.isTrue(service.sessionMatches(pending, { amountTotal: 4900 }))
      assert.isFalse(service.sessionMatches(pending, { amountTotal: 3920 }))
    } finally {
      setErrorReporter(previous)
    }
    assert.lengthOf(reported, 2)
  })

  test('markPaid (#139) : écrit montant encaissé, remise et code promo ; ne réécrit pas une ligne déjà réglée', async ({
    assert,
  }) => {
    const entitlements = new FlakyEntitlements(testNotifications())
    const service = new PaymentsService(entitlements)
    const { payment } = await pending()

    assert.isTrue(
      await service.markPaid(payment, {
        paymentIntentId: 'pi_promo',
        amountTotalCents: 3920,
        discountCents: 980,
        promotionCodeId: 'promo_test_20',
        promoCode: 'BIENVENUE20',
      })
    )
    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.PAID)
    assert.equal(payment.amountCents, 3920)
    assert.equal(payment.discountCents, 980)
    assert.equal(payment.promoCode, 'BIENVENUE20')
    assert.equal(payment.stripePromotionCodeId, 'promo_test_20')
    assert.equal(payment.grossAmountCents, 4900)

    // Rejeu (webhook après réconciliation) avec d'autres valeurs : rien ne bouge.
    assert.isFalse(
      await service.markPaid(payment, {
        paymentIntentId: 'pi_promo',
        amountTotalCents: 4900,
        discountCents: 0,
        promoCode: null,
      })
    )
    await payment.refresh()
    assert.equal(payment.amountCents, 3920)
    assert.equal(payment.promoCode, 'BIENVENUE20')
    assert.equal(entitlements.unlockCalls, 1)
  })

  test('markPaid (#139) : code à 100 % — 0 € encaissé, sans PaymentIntent, droit ouvert ; sans montant transmis la ligne garde son prix', async ({
    assert,
  }) => {
    const entitlements = new FlakyEntitlements(testNotifications())
    const service = new PaymentsService(entitlements)
    const { payment: free } = await pending()
    const { payment: plain } = await pending()

    assert.isTrue(
      await service.markPaid(free, {
        paymentIntentId: null,
        amountTotalCents: 0,
        discountCents: 4900,
        promotionCodeId: 'promo_free',
        promoCode: 'OFFERT100',
      })
    )
    await free.refresh()
    assert.equal(free.amountCents, 0)
    assert.equal(free.discountCents, 4900)
    assert.isNull(free.stripePaymentIntentId)
    assert.isTrue(free.grantsAccess)

    assert.isTrue(await service.markPaid(plain, { paymentIntentId: 'pi_plain' }))
    await plain.refresh()
    assert.equal(plain.amountCents, 4900)
    assert.equal(plain.discountCents, 0)
    assert.isNull(plain.promoCode)
    assert.isNull(plain.stripePromotionCodeId)
  })

  test('doublon (#139) : le règlement remisé est conservé sur la ligne révoquée', async ({
    assert,
  }) => {
    const service = new PaymentsService(new FlakyEntitlements(testNotifications()))
    const { employee } = await createB2cCandidate({ paid: true })
    const payment = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    }).create()
    const previous = setErrorReporter({ capture: () => {} })

    try {
      assert.isFalse(
        await service.markPaid(payment, {
          paymentIntentId: 'pi_dup_promo',
          amountTotalCents: 3920,
          discountCents: 980,
          promotionCodeId: 'promo_dup',
          promoCode: 'BIENVENUE20',
        })
      )
    } finally {
      setErrorReporter(previous)
    }
    await payment.refresh()
    assert.equal(payment.revokeReason, DUPLICATE_PAYMENT_REVOKE_REASON)
    assert.equal(payment.amountCents, 3920)
    assert.equal(payment.discountCents, 980)
    assert.equal(payment.promoCode, 'BIENVENUE20')
  })
})
