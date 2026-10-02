import { makeEntitlements, testNotifications } from '#tests/support/entitlements'
import { CandidatePaymentFactory } from '#database/factories/candidate_payment_factory'
import { ExerciseResultFactory } from '#database/factories/exercise_result_factory'
import Notification from '#models/notification'
import { NOTIFICATION_TYPES } from '#shared/constants/notifications'
import { EntitlementAlreadyGrantedError, PaymentNotFoundError } from '#exceptions/billing_errors'
import CandidatePayment from '#models/candidate_payment'
import { EntitlementsService } from '#services/entitlements_service'
import { ACCOUNT_TYPES, B2C_FREE_EXERCISE_TYPES } from '#shared/constants/b2c'
import { setErrorReporter, type ErrorContext } from '#services/error_tracking_service'
import { PAYMENT_PROVIDERS, PAYMENT_STATUSES, REVOKE_REASON_MAX } from '#shared/constants/billing'
import {
  createAdvisor,
  createB2cCandidate,
  createCandidate,
  createSuperAdmin,
} from '#tests/support/actors'
import config from '@adonisjs/core/services/config'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

/** #94 — un droit d'accès = un paiement `paid` non révoqué ; les B2B ont toujours accès. */
test.group('EntitlementsService — lecture des droits', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const service = makeEntitlements()

  async function paymentFor(actor: Awaited<ReturnType<typeof createB2cCandidate>>, state: string) {
    return CandidatePaymentFactory.merge({
      employeeId: actor.employee.id,
      userId: actor.user.id,
      organizationId: actor.employee.organizationId,
    })
      .apply(state as 'paid')
      .create()
  }

  test('B2C sans paiement : verrouillé, exercices gratuits exposés', async ({ assert }) => {
    const { employee } = await createB2cCandidate()

    const entitlement = await service.forEmployee(employee)

    assert.deepEqual(entitlement, {
      accountType: ACCOUNT_TYPES.B2C,
      hasPaidAccess: false,
      freeExerciseTypes: [...B2C_FREE_EXERCISE_TYPES],
      paymentsEnabled: false,
    })
    assert.isFalse(await service.hasResultsAccess(employee.id))
  })

  test('B2C payé : accès ouvert', async ({ assert }) => {
    const actor = await createB2cCandidate({ paid: true })

    assert.isTrue(await service.hasResultsAccess(actor.employee.id))
    const entitlement = await service.forEmployee(actor.employee)
    assert.isTrue(entitlement.hasPaidAccess)
  })

  test('pending, refunded ou revoked n’ouvrent aucun droit', async ({ assert }) => {
    for (const state of ['pending', 'refunded', 'revoked']) {
      const actor = await createB2cCandidate()
      await paymentFor(actor, state)

      assert.isFalse(await service.hasResultsAccess(actor.employee.id), state)
    }
  })

  test('le paiement d’un autre candidat ne compte pas', async ({ assert }) => {
    const paid = await createB2cCandidate({ paid: true })
    const other = await createB2cCandidate()

    assert.isTrue(await service.hasResultsAccess(paid.employee.id))
    assert.isFalse(await service.hasResultsAccess(other.employee.id))
  })

  test('B2B : accès porté par le cabinet, sans paiement', async ({ assert }) => {
    const { employee } = await createCandidate()

    const entitlement = await service.forEmployee(employee)

    assert.equal(entitlement.accountType, ACCOUNT_TYPES.B2B)
    assert.isTrue(entitlement.hasPaidAccess)
  })

  test('paymentsEnabled reflète config/billing', async ({ assert }) => {
    const { employee } = await createB2cCandidate()
    const previous = config.get<boolean>('billing.paymentsEnabled')
    config.set('billing.paymentsEnabled', true)
    try {
      const entitlement = await service.forEmployee(employee)
      assert.isTrue(entitlement.paymentsEnabled)
    } finally {
      config.set('billing.paymentsEnabled', previous)
    }
  })

  test('forUser : candidat → ses droits ; conseiller ou candidat sans fiche → null', async ({
    assert,
  }) => {
    const { user } = await createB2cCandidate({ paid: true })
    const advisor = await createAdvisor()

    const forCandidate = await service.forUser(user)
    assert.isTrue(forCandidate?.hasPaidAccess)
    assert.isNull(await service.forUser(advisor))
  })
})

test.group('EntitlementsService — octroi et révocation manuels', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const service = makeEntitlements()

  test('grantManual crée un paiement manual payé à 0 € et ouvre l’accès', async ({ assert }) => {
    const { employee, user } = await createB2cCandidate()
    const superAdmin = await createSuperAdmin()

    const payment = await service.grantManual(employee, superAdmin)

    assert.equal(payment.provider, PAYMENT_PROVIDERS.MANUAL)
    assert.equal(payment.status, PAYMENT_STATUSES.PAID)
    assert.equal(payment.amountCents, 0)
    assert.equal(payment.userId, user.id)
    assert.equal(payment.organizationId, employee.organizationId)
    assert.equal(payment.grantedByUserId, superAdmin.id)
    assert.isNotNull(payment.paidAt)
    assert.isNull(payment.stripeCheckoutSessionId)
    assert.isTrue(await service.hasResultsAccess(employee.id))
  })

  test('grantManual refuse un candidat qui a déjà accès (409)', async ({ assert }) => {
    const { employee } = await createB2cCandidate({ paid: true })
    const superAdmin = await createSuperAdmin()

    await assert.rejects(
      () => service.grantManual(employee, superAdmin),
      EntitlementAlreadyGrantedError as any
    )
    const payments = await CandidatePayment.query().where('employeeId', employee.id)
    assert.lengthOf(payments, 1)
  })

  test('revoke pose revoked_at et le motif, l’accès est retiré', async ({ assert }) => {
    const { employee } = await createB2cCandidate({ paid: true })
    const superAdmin = await createSuperAdmin()
    const payment = (await service.findActivePayment(employee.id))!

    const revoked = await service.revoke(
      { paymentId: payment.id, reason: 'Remboursement hors Stripe' },
      superAdmin
    )

    assert.isNotNull(revoked.revokedAt)
    assert.equal(revoked.revokeReason, 'Remboursement hors Stripe')
    assert.equal(revoked.revokedByUserId, superAdmin.id)
    assert.equal(revoked.status, PAYMENT_STATUSES.PAID)
    assert.isFalse(await service.hasResultsAccess(employee.id))
  })

  test('revoke borne le motif à REVOKE_REASON_MAX et trace l’auteur sans suffixe', async ({
    assert,
  }) => {
    const { employee } = await createB2cCandidate({ paid: true })
    const superAdmin = await createSuperAdmin()
    const payment = (await service.findActivePayment(employee.id))!

    const revoked = await service.revoke(
      { paymentId: payment.id, reason: ` ${'x'.repeat(REVOKE_REASON_MAX + 50)} ` },
      superAdmin
    )

    assert.lengthOf(revoked.revokeReason ?? '', REVOKE_REASON_MAX)
    assert.equal(revoked.revokedByUserId, superAdmin.id)
    await revoked.refresh()
    assert.isNotNull(revoked.revokeEffectsAt)
  })

  test('un effet de bord qui lève ne fait échouer ni l’octroi ni la révocation (signalé)', async ({
    assert,
  }) => {
    class Failing extends EntitlementsService {
      protected async onResultsUnlocked(): Promise<void> {
        throw new Error('jobs indisponibles')
      }
      protected async onResultsRevoked(): Promise<void> {
        throw new Error('notification indisponible')
      }
    }
    const failing = new Failing(testNotifications())
    const { employee } = await createB2cCandidate()
    const superAdmin = await createSuperAdmin()
    const reported: ErrorContext[] = []
    const previous = setErrorReporter({ capture: (_error, context) => reported.push(context) })

    try {
      const payment = await failing.grantManual(employee, superAdmin)
      assert.isTrue(await failing.hasResultsAccess(employee.id))
      await payment.refresh()
      assert.isNull(payment.unlockEffectsAt)

      await failing.revoke({ paymentId: payment.id, reason: 'Erreur' }, superAdmin)
      assert.isFalse(await failing.hasResultsAccess(employee.id))
    } finally {
      setErrorReporter(previous)
    }
    assert.lengthOf(reported, 2)
  })

  test('l’index unique partiel interdit deux paiements actifs pour un candidat', async ({
    assert,
  }) => {
    const { employee } = await createB2cCandidate({ paid: true })

    await assert.rejects(async () => {
      await db.transaction(async (trx) => {
        await CandidatePaymentFactory.merge({
          employeeId: employee.id,
          organizationId: employee.organizationId,
        })
          .apply('paid')
          .client(trx)
          .create()
      })
    }, /candidate_payments_one_active_per_employee/)
  })

  test('revoke d’un paiement inconnu, pending ou déjà révoqué → 404', async ({ assert }) => {
    const actor = await createB2cCandidate()
    const superAdmin = await createSuperAdmin()
    const pending = await CandidatePaymentFactory.merge({
      employeeId: actor.employee.id,
      organizationId: actor.employee.organizationId,
    }).create()
    const revoked = await CandidatePaymentFactory.merge({
      employeeId: actor.employee.id,
      organizationId: actor.employee.organizationId,
    })
      .apply('revoked')
      .create()

    for (const paymentId of [999_999, pending.id, revoked.id]) {
      await assert.rejects(
        () => service.revoke({ paymentId, reason: 'x' }, superAdmin),
        PaymentNotFoundError as any
      )
    }
  })

  test('après révocation, un nouvel octroi manuel est possible', async ({ assert }) => {
    const { employee } = await createB2cCandidate({ paid: true })
    const superAdmin = await createSuperAdmin()
    const payment = (await service.findActivePayment(employee.id))!
    await service.revoke({ paymentId: payment.id, reason: 'Erreur' }, superAdmin)

    await service.grantManual(employee, superAdmin)

    assert.isTrue(await service.hasResultsAccess(employee.id))
  })
})

/** Dispatch observé : le driver `sync` des tests exécuterait le job inline. */
class SpyDispatchEntitlements extends EntitlementsService {
  dispatched: number[] = []
  protected async dispatchAnalysis(exerciseResultId: number) {
    this.dispatched.push(exerciseResultId)
  }
}

test.group('EntitlementsService — déblocage et retrait (#104)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('unlockResults lance l’analyse des exercices complétés sans analyse et prévient le particulier', async ({
    assert,
  }) => {
    const service = new SpyDispatchEntitlements(testNotifications())
    const { employee, user } = await createB2cCandidate()
    const locked = await ExerciseResultFactory.merge({ employeeId: employee.id }).create()
    await ExerciseResultFactory.merge({
      employeeId: employee.id,
      qualitativeAnalysis: 'déjà analysé',
    }).create()
    const other = await createB2cCandidate()
    await ExerciseResultFactory.merge({ employeeId: other.employee.id }).create()
    const payment = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    })
      .apply('paid')
      .create()

    await service.unlockResults(employee, payment)

    assert.deepEqual(service.dispatched, [locked.id])
    const [notification] = await Notification.query().where('userId', user.id)
    assert.equal(notification.type, NOTIFICATION_TYPES.RESULTS_UNLOCKED)
    assert.deepEqual(notification.meta, { employeeId: employee.id, href: '/dashboard/candidat' })
    assert.lengthOf(await Notification.query().where('userId', other.user.id), 0)
  })

  test('grantManual déclenche le même déblocage ; revoke prévient du retrait', async ({
    assert,
  }) => {
    const service = new SpyDispatchEntitlements(testNotifications())
    const { employee, user } = await createB2cCandidate()
    const result = await ExerciseResultFactory.merge({ employeeId: employee.id }).create()
    const superAdmin = await createSuperAdmin()

    const payment = await service.grantManual(employee, superAdmin)
    assert.deepEqual(service.dispatched, [result.id])

    await service.revoke({ paymentId: payment.id, reason: 'Erreur de saisie' }, superAdmin)

    const rows = await Notification.query().where('userId', user.id).orderBy('id')
    assert.deepEqual(
      rows.map((n) => n.type),
      [NOTIFICATION_TYPES.RESULTS_UNLOCKED, NOTIFICATION_TYPES.RESULTS_ACCESS_REVOKED]
    )
  })
})
