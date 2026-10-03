import { makeEntitlements, testNotifications } from '#tests/support/entitlements'
import { test } from '@japa/runner'
import { CandidatePaymentFactory } from '#database/factories/candidate_payment_factory'
import { ExerciseResultFactory } from '#database/factories/exercise_result_factory'
import { PdfExportFactory } from '#database/factories/pdf_export_factory'
import { StripeEventFactory } from '#database/factories/stripe_event_factory'
import type CandidatePayment from '#models/candidate_payment'
import type Employee from '#models/employee'
import Notification from '#models/notification'
import StripeEvent from '#models/stripe_event'
import { EntitlementsService } from '#services/entitlements_service'
import { pdfExportKey, storePdf } from '#services/pdf_storage_service'
import {
  PAYMENT_STATUSES,
  STRIPE_REFUND_REVOKE_REASON,
  STRIPE_WEBHOOK_EVENTS,
  STRIPE_WEBHOOK_PATH,
} from '#shared/constants/billing'
import { NOTIFICATION_TYPES } from '#shared/constants/notifications'
import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'
import { createB2cCandidate } from '#tests/support/actors'
import { restoreCloudinary, swapFakeCloudinary } from '#tests/support/fake_cloudinary'
import { FAKE_STRIPE_SIGNATURE, restoreStripe, swapFakeStripe } from '#tests/support/fake_stripe'
import { truncateDb } from '#tests/utils/db'
import app from '@adonisjs/core/services/app'
import type { ApiClient } from '@japa/api-client'

/**
 * `POST /webhooks/stripe` (#104) : signature vérifiée par la passerelle
 * factice, idempotence par `stripe_events`, transitions de paiement, droits.
 * Le driver de queue des tests est `sync` : le dispatch des analyses IA est
 * observé via un `EntitlementsService` remplacé dans le conteneur.
 */
class SpyEntitlements extends EntitlementsService {
  dispatched: number[] = []
  protected async dispatchAnalysis(exerciseResultId: number) {
    this.dispatched.push(exerciseResultId)
  }
}

let counter = 0
function event(type: string, object: Record<string, unknown>, id = `evt_test_${++counter}`) {
  return { id, type, livemode: false, data: { object } }
}

function deliver(client: ApiClient, body: unknown, signature = FAKE_STRIPE_SIGNATURE) {
  return client.post(STRIPE_WEBHOOK_PATH).header('stripe-signature', signature).json(body)
}

async function pendingPayment(employee: Employee, sessionId: string): Promise<CandidatePayment> {
  return CandidatePaymentFactory.merge({
    employeeId: employee.id,
    userId: employee.userId,
    organizationId: employee.organizationId,
    stripeCheckoutSessionId: sessionId,
  }).create()
}

let spy: SpyEntitlements

test.group('Webhook Stripe (#104)', (group) => {
  group.each.setup(() => truncateDb())
  group.each.setup(() => {
    swapFakeStripe()
    spy = new SpyEntitlements(testNotifications())
    app.container.swap(EntitlementsService, () => spy)
    return () => {
      app.container.restore(EntitlementsService)
      restoreStripe()
    }
  })

  test('signature invalide ou absente : 400, rien n’est journalisé', async ({ client, assert }) => {
    const body = event(STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED, { id: 'cs_x' })

    const bad = await deliver(client, body, 'not-the-signature')
    bad.assertStatus(400)
    const missing = await client.post(STRIPE_WEBHOOK_PATH).json(body)
    missing.assertStatus(400)

    assert.lengthOf(await StripeEvent.all(), 0)
  })

  test('checkout.session.completed : paiement payé, analyses IA des exercices verrouillés lancées, candidat prévenu', async ({
    client,
    assert,
  }) => {
    const { employee, user } = await createB2cCandidate({ emailVerified: true })
    const payment = await pendingPayment(employee, 'cs_test_1')
    const lockedResult = await ExerciseResultFactory.merge({ employeeId: employee.id }).create()
    await ExerciseResultFactory.merge({
      employeeId: employee.id,
      qualitativeAnalysis: 'analyse gratuite déjà faite',
    }).create()

    const response = await deliver(
      client,
      event(STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED, {
        id: 'cs_test_1',
        client_reference_id: String(payment.id),
        payment_status: 'paid',
        payment_intent: 'pi_test_1',
      })
    )

    response.assertStatus(200)
    response.assertBody({ received: true })
    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.PAID)
    assert.equal(payment.stripePaymentIntentId, 'pi_test_1')
    assert.isTrue(await makeEntitlements().hasResultsAccess(employee.id))
    assert.deepEqual(spy.dispatched, [lockedResult.id])

    const [notification] = await Notification.query().where('userId', user.id)
    assert.equal(notification.type, NOTIFICATION_TYPES.RESULTS_UNLOCKED)
    assert.deepEqual(notification.meta, { employeeId: employee.id, href: '/dashboard/candidat' })

    const [row] = await StripeEvent.all()
    assert.equal(row.type, STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED)
    assert.isTrue(row.isProcessed)
  })

  test('rejeu du même événement : 200 sans second traitement', async ({ client, assert }) => {
    const { employee, user } = await createB2cCandidate()
    const payment = await pendingPayment(employee, 'cs_test_2')
    await ExerciseResultFactory.merge({ employeeId: employee.id }).create()
    const body = event(STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED, {
      id: 'cs_test_2',
      client_reference_id: String(payment.id),
      payment_status: 'paid',
      payment_intent: 'pi_test_2',
    })

    const first = await deliver(client, body)
    const replay = await deliver(client, body)

    first.assertStatus(200)
    replay.assertStatus(200)
    assert.lengthOf(spy.dispatched, 1)
    assert.lengthOf(await Notification.query().where('userId', user.id), 1)
    assert.lengthOf(await StripeEvent.all(), 1)
  })

  test('webhook puis réconciliation (page de succès) : un seul déblocage', async ({
    client,
    assert,
  }) => {
    const { employee, user } = await createB2cCandidate({ emailVerified: true })
    const payment = await pendingPayment(employee, 'cs_test_3')

    await deliver(
      client,
      event(STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED, {
        id: 'cs_test_3',
        client_reference_id: String(payment.id),
        payment_status: 'paid',
        payment_intent: 'pi_test_3',
      })
    )
    const success = await client
      .get('/dashboard/candidat/billing/success?session_id=cs_test_3')
      .loginAs(user)
      .withInertia()
    success.assertStatus(200)

    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.PAID)
    assert.equal(payment.stripePaymentIntentId, 'pi_test_3')
    assert.lengthOf(await Notification.query().where('userId', user.id), 1)
  })

  test('async_payment_failed → failed ; checkout.session.expired → canceled', async ({
    client,
    assert,
  }) => {
    const { employee } = await createB2cCandidate()
    const failed = await pendingPayment(employee, 'cs_failed')
    const expired = await pendingPayment(employee, 'cs_expired')

    const a = await deliver(
      client,
      event(STRIPE_WEBHOOK_EVENTS.ASYNC_PAYMENT_FAILED, {
        id: 'cs_failed',
        client_reference_id: String(failed.id),
      })
    )
    const b = await deliver(
      client,
      event(STRIPE_WEBHOOK_EVENTS.CHECKOUT_EXPIRED, {
        id: 'cs_expired',
        client_reference_id: String(expired.id),
      })
    )

    a.assertStatus(200)
    b.assertStatus(200)
    await failed.refresh()
    await expired.refresh()
    assert.equal(failed.status, PAYMENT_STATUSES.FAILED)
    assert.equal(expired.status, PAYMENT_STATUSES.CANCELED)
    assert.isFalse(await makeEntitlements().hasResultsAccess(employee.id))
    assert.lengthOf(spy.dispatched, 0)
  })

  test('charge.refunded : accès retiré, téléchargement PDF 404, candidat prévenu', async ({
    client,
    assert,
  }) => {
    swapFakeCloudinary()
    try {
      const { employee, user } = await createB2cCandidate()
      const payment = await CandidatePaymentFactory.merge({
        employeeId: employee.id,
        userId: user.id,
        organizationId: employee.organizationId,
      })
        .apply('paid')
        .create()
      // L'état `paid` pose son propre intent : on fixe celui que l'événement référence.
      payment.stripePaymentIntentId = 'pi_refund'
      await payment.save()
      const pdfExport = await PdfExportFactory.merge({
        userId: user.id,
        organizationId: employee.organizationId,
        employeeId: employee.id,
        status: PDF_EXPORT_STATUSES.COMPLETED,
        fileName: 'Synthese.pdf',
        mimeType: 'application/pdf',
      }).create()
      const key = pdfExportKey(employee.organizationId, pdfExport.id)
      await storePdf(key, new TextEncoder().encode('%PDF-1.4 fake'))
      pdfExport.filePath = key
      await pdfExport.save()
      const download = `/dashboard/pdf-exports/${pdfExport.id}/download`

      const before = await client.get(download).loginAs(user).redirects(0)
      before.assertStatus(200)

      const response = await deliver(
        client,
        event(STRIPE_WEBHOOK_EVENTS.CHARGE_REFUNDED, {
          id: 'ch_test_1',
          payment_intent: 'pi_refund',
          refunded: true,
        })
      )

      response.assertStatus(200)
      await payment.refresh()
      assert.equal(payment.status, PAYMENT_STATUSES.REFUNDED)
      assert.isNotNull(payment.refundedAt)
      assert.isNotNull(payment.revokedAt)
      assert.equal(payment.revokeReason, STRIPE_REFUND_REVOKE_REASON)
      assert.isFalse(await makeEntitlements().hasResultsAccess(employee.id))

      const after = await client.get(download).loginAs(user).redirects(0)
      after.assertStatus(404)

      const [notification] = await Notification.query().where('userId', user.id)
      assert.equal(notification.type, NOTIFICATION_TYPES.RESULTS_ACCESS_REVOKED)
      assert.deepEqual(notification.meta, {
        employeeId: employee.id,
        href: '/dashboard/candidat/offre',
      })
    } finally {
      restoreCloudinary()
    }
  })

  test('charge.refunded partiel : ignoré, le droit reste ouvert, le paiement reste payé', async ({
    client,
    assert,
  }) => {
    const { employee, user } = await createB2cCandidate()
    const payment = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      userId: user.id,
      organizationId: employee.organizationId,
    })
      .apply('paid')
      .create()
    payment.stripePaymentIntentId = 'pi_partial'
    await payment.save()

    const response = await deliver(
      client,
      event(STRIPE_WEBHOOK_EVENTS.CHARGE_REFUNDED, {
        id: 'ch_partial',
        payment_intent: 'pi_partial',
        amount: 4900,
        amount_refunded: 1000,
        refunded: false,
      })
    )

    response.assertStatus(200)
    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.PAID)
    assert.isNull(payment.revokedAt)
    assert.isTrue(await makeEntitlements().hasResultsAccess(employee.id))
    assert.lengthOf(await Notification.query().where('userId', user.id), 0)
  })

  test('type non suivi ou paiement inconnu : 200, journalisé, sans effet', async ({
    client,
    assert,
  }) => {
    const ignored = await deliver(client, event('payment_intent.created', { id: 'pi_x' }))
    const unmatched = await deliver(
      client,
      event(STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED, {
        id: 'cs_unknown',
        client_reference_id: '424242',
        payment_status: 'paid',
      })
    )

    ignored.assertStatus(200)
    unmatched.assertStatus(200)
    const rows = await StripeEvent.all()
    assert.lengthOf(rows, 2)
    assert.isTrue(rows.every((row) => row.isProcessed))
    assert.lengthOf(spy.dispatched, 0)
    assert.lengthOf(await Notification.all(), 0)
  })

  test('une livraison interrompue (ligne sans processed_at) est reprise', async ({
    client,
    assert,
  }) => {
    const { employee } = await createB2cCandidate()
    const payment = await pendingPayment(employee, 'cs_resume')
    const open = await StripeEventFactory.merge({ stripeEventId: 'evt_resume' })
      .apply('pending')
      .create()

    const response = await deliver(
      client,
      event(
        STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED,
        { id: 'cs_resume', client_reference_id: String(payment.id), payment_status: 'paid' },
        'evt_resume'
      )
    )

    response.assertStatus(200)
    await payment.refresh()
    await open.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.PAID)
    assert.isTrue(open.isProcessed)
  })

  test('erreur interne : 500 (Stripe retentera), ligne laissée ouverte, puis reprise en 200', async ({
    client,
    assert,
  }) => {
    const { employee } = await createB2cCandidate()
    const payment = await pendingPayment(employee, 'cs_boom')
    const body = event(STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED, {
      id: 'cs_boom',
      client_reference_id: String(payment.id),
      payment_status: 'paid',
      payment_intent: 'pi_boom',
    })
    let broken = true
    spy.runUnlockEffects = async (...args) => {
      if (broken) throw new Error('base indisponible')
      return EntitlementsService.prototype.runUnlockEffects.apply(spy, args)
    }

    const failed = await deliver(client, body)

    failed.assertStatus(500)
    const [row] = await StripeEvent.all()
    assert.isFalse(row.isProcessed)

    broken = false
    const retry = await deliver(client, body)
    retry.assertStatus(200)
    await row.refresh()
    assert.isTrue(row.isProcessed)
  })

  test('completed unpaid : 200, paiement resté pending, aucun droit', async ({
    client,
    assert,
  }) => {
    const { employee } = await createB2cCandidate()
    const payment = await pendingPayment(employee, 'cs_unpaid')

    const response = await deliver(
      client,
      event(STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED, {
        id: 'cs_unpaid',
        client_reference_id: String(payment.id),
        payment_status: 'unpaid',
      })
    )

    response.assertStatus(200)
    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.PENDING)
    assert.isFalse(await makeEntitlements().hasResultsAccess(employee.id))
    assert.lengthOf(spy.dispatched, 0)
  })

  test('ordre inversé : expired après paid sans effet ; refund avant completed → 200 unmatched puis paiement ouvert', async ({
    client,
    assert,
  }) => {
    const { employee } = await createB2cCandidate()
    const paid = await pendingPayment(employee, 'cs_order_a')
    const paidObject = {
      id: 'cs_order_a',
      client_reference_id: String(paid.id),
      payment_status: 'paid',
      payment_intent: 'pi_order_a',
    }
    const completed = await deliver(
      client,
      event(STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED, paidObject)
    )
    const expired = await deliver(client, event(STRIPE_WEBHOOK_EVENTS.CHECKOUT_EXPIRED, paidObject))
    completed.assertStatus(200)
    expired.assertStatus(200)
    await paid.refresh()
    assert.equal(paid.status, PAYMENT_STATUSES.PAID)
    assert.isNull(paid.revokedAt)

    const { employee: other } = await createB2cCandidate()
    const late = await pendingPayment(other, 'cs_order_b')
    const refund = await deliver(
      client,
      event(STRIPE_WEBHOOK_EVENTS.CHARGE_REFUNDED, { payment_intent: 'pi_order_b', refunded: true })
    )
    refund.assertStatus(200)
    const lateCompleted = await deliver(
      client,
      event(STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED, {
        id: 'cs_order_b',
        client_reference_id: String(late.id),
        payment_status: 'paid',
        payment_intent: 'pi_order_b',
      })
    )
    lateCompleted.assertStatus(200)
    await late.refresh()
    assert.equal(late.status, PAYMENT_STATUSES.PAID)
  })

  test('client_reference_id incohérent : 200, le paiement visé par erreur n’est pas touché', async ({
    client,
    assert,
  }) => {
    const { employee } = await createB2cCandidate()
    const victim = await pendingPayment(employee, 'cs_victim')

    for (const reference of [String(victim.id), 'not-a-number']) {
      const response = await deliver(
        client,
        event(STRIPE_WEBHOOK_EVENTS.CHECKOUT_EXPIRED, {
          id: 'cs_elsewhere',
          client_reference_id: reference,
        })
      )
      response.assertStatus(200)
    }
    const paidWrong = await deliver(
      client,
      event(STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED, {
        id: 'cs_elsewhere',
        client_reference_id: String(victim.id),
        payment_status: 'paid',
      })
    )
    paidWrong.assertStatus(200)

    await victim.refresh()
    assert.equal(victim.status, PAYMENT_STATUSES.PENDING)
  })
})
