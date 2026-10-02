import { test } from '@japa/runner'
import { CandidatePaymentFactory } from '#database/factories/candidate_payment_factory'
import CandidatePayment from '#models/candidate_payment'
import Notification from '#models/notification'
import { EntitlementsService } from '#services/entitlements_service'
import { BILLING_ADMIN_PATHS, PAYMENT_STATUSES } from '#shared/constants/billing'
import { NOTIFICATION_TYPES } from '#shared/constants/notifications'
import { createAdmin, createB2cCandidate, createSuperAdmin } from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { assertFieldErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'

/**
 * Back-office super admin des paiements (#107) :
 * - `GET  /dashboard/super-admin/payments?status=&page=` → liste filtrée, paginée ;
 * - `POST /dashboard/super-admin/payments/:id/revoke` → accès retiré avec motif.
 */
const PAGE = 'dashboard/admin/payments/Index'

test.group('Super admin — paiements (#107)', (group) => {
  group.each.setup(() => truncateDb())

  test('liste tous les paiements, les plus récents d’abord, avec candidat et droit', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const paid = await createB2cCandidate({ paid: true })
    const other = await createB2cCandidate()
    const pending = await CandidatePaymentFactory.merge({
      employeeId: other.employee.id,
      userId: other.user.id,
      organizationId: other.employee.organizationId,
    }).create()

    const response = await client
      .get(BILLING_ADMIN_PATHS.payments)
      .loginAs(superAdmin)
      .withInertia()

    const props = assertPage(assert, response, PAGE, ['payments'])
    const payments = props.payments as {
      items: Array<Record<string, unknown>>
      filter: { status: string | null; page: number }
      total: number
      lastPage: number
    }
    assert.equal(payments.total, 2)
    assert.equal(payments.lastPage, 1)
    assert.deepEqual(payments.filter, { status: null, page: 1 })
    assert.equal(payments.items[0].id, pending.id)
    assert.include(payments.items[0], { status: PAYMENT_STATUSES.PENDING, grantsAccess: false })
    assert.deepEqual(payments.items[0].candidate, {
      id: other.employee.id,
      name: other.employee.name,
      email: other.employee.email,
    })
    assert.include(payments.items[1], { status: PAYMENT_STATUSES.PAID, grantsAccess: true })
    assert.equal((payments.items[1].candidate as { id: number }).id, paid.employee.id)
  })

  test('filtre par statut ; un statut inconnu est ignoré', async ({ client, assert }) => {
    const superAdmin = await createSuperAdmin()
    await createB2cCandidate({ paid: true })
    const other = await createB2cCandidate()
    await CandidatePaymentFactory.merge({
      employeeId: other.employee.id,
      organizationId: other.employee.organizationId,
    })
      .apply('refunded')
      .create()

    const refunded = await client
      .get(`${BILLING_ADMIN_PATHS.payments}?status=refunded`)
      .loginAs(superAdmin)
      .withInertia()
    const refundedProps = assertPage(assert, refunded, PAGE).payments as {
      items: unknown[]
      filter: { status: string | null }
    }
    assert.lengthOf(refundedProps.items, 1)
    assert.equal(refundedProps.filter.status, PAYMENT_STATUSES.REFUNDED)

    const unknown = await client
      .get(`${BILLING_ADMIN_PATHS.payments}?status=bogus&page=0`)
      .loginAs(superAdmin)
      .withInertia()
    const unknownProps = assertPage(assert, unknown, PAGE).payments as {
      items: unknown[]
      filter: { status: string | null; page: number }
    }
    assert.lengthOf(unknownProps.items, 2)
    assert.deepEqual(unknownProps.filter, { status: null, page: 1 })
  })

  test('revoke : revoked_at et motif posés, accès retiré, candidat prévenu', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const { user, employee } = await createB2cCandidate({ paid: true })
    const [payment] = await CandidatePayment.query().where('employeeId', employee.id)

    const response = await client
      .post(BILLING_ADMIN_PATHS.revoke(payment.id))
      .loginAs(superAdmin)
      .header('referer', BILLING_ADMIN_PATHS.payments)
      .form({ reason: 'Paiement contesté par la banque.' })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', BILLING_ADMIN_PATHS.payments)
    response.assertFlashMessage('success', 'Accès au forfait retiré : le particulier est prévenu.')
    await payment.refresh()
    assert.isNotNull(payment.revokedAt)
    assert.include(payment.revokeReason ?? '', 'Paiement contesté par la banque.')
    assert.equal(payment.status, PAYMENT_STATUSES.PAID)
    assert.isFalse(await new EntitlementsService().hasResultsAccess(employee.id))
    const [notification] = await Notification.query().where('userId', user.id)
    assert.equal(notification.type, NOTIFICATION_TYPES.RESULTS_ACCESS_REVOKED)
  })

  test('revoke : motif obligatoire (validation) ; paiement inconnu ou déjà révoqué → 404', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const { employee } = await createB2cCandidate({ paid: true })
    const [payment] = await CandidatePayment.query().where('employeeId', employee.id)

    const invalid = await client
      .post(BILLING_ADMIN_PATHS.revoke(payment.id))
      .loginAs(superAdmin)
      .withInertia()
      .header('referer', BILLING_ADMIN_PATHS.payments)
      .form({ reason: '' })
      .redirects(0)
    assertFieldErrors(assert, invalid, ['reason'])
    await payment.refresh()
    assert.isNull(payment.revokedAt)

    const missing = await client
      .post(BILLING_ADMIN_PATHS.revoke(999_999))
      .loginAs(superAdmin)
      .header('Accept', 'application/json')
      .form({ reason: 'Motif valable.' })
      .redirects(0)
    missing.assertStatus(404)
  })

  test('réservé aux super admins (403)', async ({ client }) => {
    const admin = await createAdmin()
    const get = await client.get(BILLING_ADMIN_PATHS.payments).loginAs(admin).redirects(0)
    get.assertStatus(403)
    const post = await client
      .post(BILLING_ADMIN_PATHS.revoke(1))
      .loginAs(admin)
      .form({ reason: 'Motif valable.' })
      .redirects(0)
    post.assertStatus(403)
  })
})
