import { test } from '@japa/runner'
import { ExerciseResultFactory } from '#database/factories/exercise_result_factory'
import { ExpertRequestFactory } from '#database/factories/expert_request_factory'
import CandidatePayment from '#models/candidate_payment'
import Notification from '#models/notification'
import { EntitlementsService } from '#services/entitlements_service'
import { BILLING_ADMIN_PATHS, PAYMENT_PROVIDERS, PAYMENT_STATUSES } from '#shared/constants/billing'
import { NOTIFICATION_TYPES } from '#shared/constants/notifications'
import {
  createAdmin,
  createAdvisor,
  createB2cCandidate,
  createCandidate,
  createInHouseExpert,
  createSuperAdmin,
} from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { truncateDb } from '#tests/utils/db'
import app from '@adonisjs/core/services/app'

/**
 * Back-office super admin des particuliers (#107) :
 * - `GET  /dashboard/super-admin/b2c` → liste des B2C + indicateurs ;
 * - `POST /dashboard/super-admin/b2c/:employeeId/entitlement/grant` → octroi manuel.
 */
const PAGE = 'dashboard/admin/b2c/Index'

/** Dispatch des analyses IA observé (le driver `sync` des tests exécuterait le job inline). */
class SpyEntitlements extends EntitlementsService {
  dispatched: number[] = []
  protected async dispatchAnalysis(exerciseResultId: number) {
    this.dispatched.push(exerciseResultId)
  }
}

let spy: SpyEntitlements

test.group('Super admin — particuliers (#107)', (group) => {
  group.each.setup(() => truncateDb())
  group.each.setup(() => {
    spy = new SpyEntitlements()
    app.container.swap(EntitlementsService, () => spy)
    return () => app.container.restore(EntitlementsService)
  })

  test('liste les particuliers avec droit, expert, demande en attente, et les indicateurs', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const expert = await createInHouseExpert()
    const paid = await createB2cCandidate({ paid: true, expert, emailVerified: true })
    const free = await createB2cCandidate()
    await ExpertRequestFactory.merge({
      employeeId: free.employee.id,
      organizationId: free.employee.organizationId,
    }).create()
    await createCandidate() // B2B : absent de la liste

    const response = await client.get(BILLING_ADMIN_PATHS.b2c).loginAs(superAdmin).withInertia()

    const props = assertPage(assert, response, PAGE, ['candidates', 'stats'])
    const candidates = props.candidates as Array<Record<string, unknown>>
    assert.sameMembers(
      candidates.map((c) => c.id),
      [paid.employee.id, free.employee.id]
    )
    const paidRow = candidates.find((c) => c.id === paid.employee.id)!
    assert.include(paidRow, {
      hasPaidAccess: true,
      emailVerified: true,
      pendingExpertRequest: false,
    })
    assert.deepEqual(paidRow.expert, { id: expert.id, name: expert.name })
    assert.isNumber(paidRow.activePaymentId)
    const freeRow = candidates.find((c) => c.id === free.employee.id)!
    assert.include(freeRow, {
      hasPaidAccess: false,
      emailVerified: false,
      pendingExpertRequest: true,
      activePaymentId: null,
      expert: null,
    })

    const stats = props.stats as Record<string, unknown>
    assert.include(stats, { candidates: 2, paid: 1, pendingExpertRequests: 1, currency: 'eur' })
    assert.isAbove(Number(stats.monthRevenueCents), 0)
  })

  test('grant : paiement manuel à 0 €, accès ouvert, analyses IA lancées, candidat prévenu', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const { user, employee } = await createB2cCandidate()
    const locked = await ExerciseResultFactory.merge({ employeeId: employee.id }).create()

    const response = await client
      .post(BILLING_ADMIN_PATHS.grant(employee.id))
      .loginAs(superAdmin)
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', BILLING_ADMIN_PATHS.b2c)
    response.assertFlashMessage(
      'success',
      'Accès au forfait ouvert : le particulier est prévenu et ses analyses IA sont lancées.'
    )
    const [payment] = await CandidatePayment.query().where('employeeId', employee.id)
    assert.equal(payment.provider, PAYMENT_PROVIDERS.MANUAL)
    assert.equal(payment.status, PAYMENT_STATUSES.PAID)
    assert.equal(payment.amountCents, 0)
    assert.equal(payment.grantedByUserId, superAdmin.id)
    assert.isTrue(await new EntitlementsService().hasResultsAccess(employee.id))
    assert.deepEqual(spy.dispatched, [locked.id])
    const [notification] = await Notification.query().where('userId', user.id)
    assert.equal(notification.type, NOTIFICATION_TYPES.RESULTS_UNLOCKED)
  })

  test('grant : 409 si déjà payé, 404 pour un candidat B2B ou inconnu', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const paid = await createB2cCandidate({ paid: true })
    const b2b = await createCandidate()

    const conflict = await client
      .post(BILLING_ADMIN_PATHS.grant(paid.employee.id))
      .loginAs(superAdmin)
      .header('Accept', 'application/json')
      .redirects(0)
    conflict.assertStatus(409)

    for (const employeeId of [b2b.employee.id, 999_999]) {
      const missing = await client
        .post(BILLING_ADMIN_PATHS.grant(employeeId))
        .loginAs(superAdmin)
        .header('Accept', 'application/json')
        .redirects(0)
      missing.assertStatus(404)
    }
    assert.lengthOf(await CandidatePayment.query().where('employeeId', b2b.employee.id), 0)
  })

  test('réservé aux super admins (403)', async ({ client }) => {
    const { employee } = await createB2cCandidate()
    for (const actor of [await createAdmin(), await createAdvisor()]) {
      const get = await client.get(BILLING_ADMIN_PATHS.b2c).loginAs(actor).redirects(0)
      get.assertStatus(403)
      const post = await client
        .post(BILLING_ADMIN_PATHS.grant(employee.id))
        .loginAs(actor)
        .redirects(0)
      post.assertStatus(403)
    }
  })
})
