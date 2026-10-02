import { CandidatePaymentFactory } from '#database/factories/candidate_payment_factory'
import { ExpertRequestFactory } from '#database/factories/expert_request_factory'
import CandidatePayment from '#models/candidate_payment'
import { PlatformOrganizationService } from '#services/platform_organization_service'
import { SuperAdminB2cService } from '#services/super_admin_b2c_service'
import {
  createAdvisor,
  createB2cCandidate,
  createCandidate,
  createInHouseExpert,
  createSuperAdmin,
} from '#tests/support/actors'
import { countQueries } from '#tests/utils/query_counter'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const service = new SuperAdminB2cService(new PlatformOrganizationService())

test.group('SuperAdminB2cService (#107)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('listCandidates : particuliers de la plateforme seulement, droit, expert, demande en attente', async ({
    assert,
  }) => {
    await createSuperAdmin()
    const expert = await createInHouseExpert()
    const paid = await createB2cCandidate({ paid: true, expert, emailVerified: true })
    const free = await createB2cCandidate()
    await ExpertRequestFactory.merge({
      employeeId: free.employee.id,
      organizationId: free.employee.organizationId,
    }).create()
    await createCandidate()
    const revoked = await createB2cCandidate()
    await CandidatePaymentFactory.merge({
      employeeId: revoked.employee.id,
      organizationId: revoked.employee.organizationId,
    })
      .apply('paid')
      .apply('revoked')
      .create()

    const rows = await service.listCandidates()

    assert.sameMembers(
      rows.map((r) => r.id),
      [paid.employee.id, free.employee.id, revoked.employee.id]
    )
    const paidRow = rows.find((r) => r.id === paid.employee.id)!
    assert.include(paidRow, {
      hasPaidAccess: true,
      emailVerified: true,
      pendingExpertRequest: false,
    })
    assert.deepEqual(paidRow.expert, { id: expert.id, name: expert.name })
    assert.isNotNull(paidRow.activePaymentId)
    const freeRow = rows.find((r) => r.id === free.employee.id)!
    assert.include(freeRow, {
      hasPaidAccess: false,
      pendingExpertRequest: true,
      activePaymentId: null,
    })
    const revokedRow = rows.find((r) => r.id === revoked.employee.id)!
    assert.include(revokedRow, { hasPaidAccess: false, activePaymentId: null })
  })

  test('listCandidates : une seule requête sur candidate_payments quel que soit le nombre de candidats', async ({
    assert,
  }) => {
    await createSuperAdmin()
    for (let i = 0; i < 5; i++) await createB2cCandidate({ paid: i % 2 === 0 })

    const queries = await countQueries(() => service.listCandidates(), {
      table: 'candidate_payments',
    })

    assert.equal(queries, 1)
  })

  test('stats : inscrits, payés (distincts, non révoqués), CA Stripe du mois, demandes en attente', async ({
    assert,
  }) => {
    await createSuperAdmin()
    const paid = await createB2cCandidate({ paid: true })
    const manual = await createB2cCandidate()
    await CandidatePaymentFactory.merge({
      employeeId: manual.employee.id,
      organizationId: manual.employee.organizationId,
    })
      .apply('paid')
      .apply('manual')
      .create()
    const old = await createB2cCandidate()
    const oldPaid = await CandidatePaymentFactory.merge({
      employeeId: old.employee.id,
      organizationId: old.employee.organizationId,
    })
      .apply('paid')
      .create()
    const oldRevoked = await CandidatePaymentFactory.merge({
      employeeId: old.employee.id,
      organizationId: old.employee.organizationId,
    })
      .apply('paid')
      .apply('revoked')
      .create()
    // L'état `paid` pose paid_at à hier : on recule les deux anciens paiements de deux mois.
    for (const payment of [oldPaid, oldRevoked]) {
      payment.paidAt = DateTime.now().minus({ months: 2 })
      await payment.save()
    }
    await ExpertRequestFactory.merge({
      employeeId: paid.employee.id,
      organizationId: paid.employee.organizationId,
    }).create()
    await ExpertRequestFactory.merge({
      employeeId: manual.employee.id,
      organizationId: manual.employee.organizationId,
    })
      .apply('declined')
      .create()
    await createCandidate()

    const stats = await service.stats()

    assert.equal(stats.candidates, 3)
    assert.equal(stats.paid, 3)
    assert.equal(stats.pendingExpertRequests, 1)
    assert.equal(stats.currency, 'eur')
    // Seul le paiement Stripe payé ce mois-ci compte ; l'octroi manuel (0 €) et les anciens non.
    const [recent] = await CandidatePayment.query().where('employeeId', paid.employee.id)
    assert.equal(stats.monthRevenueCents, recent.amountCents)
  })

  test('homeStats : organisations, utilisateurs et bloc B2C', async ({ assert }) => {
    await createSuperAdmin()
    // Comptes relatifs : la suite `unit` partage la base avec d'autres suites.
    const before = await service.homeStats()
    await createAdvisor()

    const stats = await service.homeStats()

    assert.equal(stats.organizations, before.organizations + 1)
    assert.equal(stats.users, before.users + 1)
    assert.deepEqual(stats.b2c, await service.stats())
  })
})
