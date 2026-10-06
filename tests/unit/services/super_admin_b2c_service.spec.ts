import { CandidatePaymentFactory } from '#database/factories/candidate_payment_factory'
import { ExpertRequestFactory } from '#database/factories/expert_request_factory'
import CandidatePayment from '#models/candidate_payment'
import { ADMIN_LIST_PAGE_SIZE } from '#shared/constants/billing'
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

    const { items: rows, total, lastPage } = await service.listCandidates()
    assert.equal(total, 3)
    assert.equal(lastPage, 1)

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

    const queries = await countQueries(() => service.listCandidates(1), {
      table: 'candidate_payments',
    })

    assert.equal(queries, 1)
  })

  test('listCandidates : paginé (taille de page injectable, ADMIN_LIST_PAGE_SIZE par défaut), requêtes constantes d’une page à l’autre', async ({
    assert,
  }) => {
    await createSuperAdmin()
    const pageSize = 4
    const count = pageSize + 3
    for (let i = 0; i < count; i++) await createB2cCandidate({ paid: i % 2 === 0 })

    const first = await service.listCandidates(1, pageSize)
    const second = await service.listCandidates(2, pageSize)
    const beyond = await service.listCandidates(3, pageSize)

    assert.lengthOf(first.items, pageSize)
    assert.lengthOf(second.items, 3)
    assert.lengthOf(beyond.items, 0)
    assert.deepEqual([first.total, first.lastPage, second.page], [count, 2, 2])
    assert.lengthOf(new Set([...first.items, ...second.items].map((r) => r.id)), count)
    const total = await countQueries(() => service.listCandidates(1, pageSize))
    const totalSecond = await countQueries(() => service.listCandidates(2, pageSize))
    assert.equal(total, totalSecond)
    assert.isAtLeast(ADMIN_LIST_PAGE_SIZE, 10)
  })

  test('parsePage : entier ≥ 1, 1 par défaut', async ({ assert }) => {
    assert.equal(service.parsePage({ page: '4' }), 4)
    for (const page of [undefined, '0', '-2', 'abc']) {
      assert.equal(service.parsePage({ page }), 1)
    }
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

  test('stats (#139) : le CA du mois additionne les montants réellement encaissés (remises déduites, code à 100 % à 0 €)', async ({
    assert,
  }) => {
    await createSuperAdmin()
    const full = await createB2cCandidate({ paid: true })
    const discounted = await createB2cCandidate()
    await CandidatePaymentFactory.merge({
      employeeId: discounted.employee.id,
      organizationId: discounted.employee.organizationId,
    })
      .apply('discounted')
      .create()
    const free = await createB2cCandidate()
    await CandidatePaymentFactory.merge({
      employeeId: free.employee.id,
      organizationId: free.employee.organizationId,
    })
      .apply('free')
      .create()

    const stats = await service.stats()

    const [fullPayment] = await CandidatePayment.query().where('employeeId', full.employee.id)
    assert.equal(stats.paid, 3)
    assert.equal(stats.monthRevenueCents, fullPayment.amountCents + 3920)
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
