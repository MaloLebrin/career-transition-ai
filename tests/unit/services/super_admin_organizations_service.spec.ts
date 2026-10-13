import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { SuperAdminOrganizationsService } from '#services/super_admin_organizations_service'
import Organization from '#models/organization'
import User from '#models/user'
import OnboardingToken from '#models/onboarding_token'
import EmailAlreadyUsedException from '#exceptions/email_already_used_exception'
import { EmployeeFactory } from '#database/factories/employee_factory'
import { LIST_PAGE_SIZE } from '#shared/constants/pagination'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import {
  createAdmin,
  createAdvisor,
  createOrganization,
  createPlatformOrganization,
} from '#tests/support/actors'
import OrganizationNameAlreadyUsedException from '#exceptions/organization_name_already_used_exception'

test.group('SuperAdminOrganizationsService.createOrganizationWithOwner', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates organization + owner admin + token and sends email', async ({ assert }) => {
    const calls: any[] = []
    const service = new SuperAdminOrganizationsService({
      sendSetPasswordLink: async (payload: any) => {
        calls.push(payload)
      },
    } as any)

    const result = await service.createOrganizationWithOwner({
      organizationName: 'Cabinet New',
      organizationSlug: '',
      ownerName: 'Alice Owner',
      ownerEmail: 'alice.owner@example.com',
    })

    assert.exists(result.organization.id)
    assert.exists(result.owner.id)
    assert.exists(result.token.id)
    assert.equal(result.owner.role, 'admin')
    assert.equal(result.owner.organizationId, result.organization.id)
    assert.equal(result.token.userId, result.owner.id)

    const orgInDb = await Organization.find(result.organization.id)
    const userInDb = await User.find(result.owner.id)
    const tokenInDb = await OnboardingToken.find(result.token.id)
    assert.isNotNull(orgInDb)
    assert.isNotNull(userInDb)
    assert.isNotNull(tokenInDb)

    assert.equal(calls.length, 1)
    assert.equal(calls[0].user.id, result.owner.id)
    assert.equal(calls[0].token.id, result.token.id)
  })

  test('throws when owner email already exists', async ({ assert }) => {
    const org = await Organization.create({
      name: 'Existing Org',
      slug: `existing-org-${Date.now()}`,
    })
    await User.create({
      organizationId: org.id,
      email: 'existing@example.com',
      name: 'Existing',
      password: 'temp',
      role: 'advisor',
    })

    const service = new SuperAdminOrganizationsService({
      sendSetPasswordLink: async () => {},
    } as any)

    await assert.rejects(
      () =>
        service.createOrganizationWithOwner({
          organizationName: 'Cabinet Another',
          organizationSlug: '',
          ownerName: 'Owner',
          ownerEmail: 'existing@example.com',
        }),
      EmailAlreadyUsedException
    )
  })

  test('throws when organization name already exists', async ({ assert }) => {
    await Organization.create({ name: 'Dup Org', slug: `dup-org-${Date.now()}` })
    const service = new SuperAdminOrganizationsService({
      sendSetPasswordLink: async () => {},
    } as any)

    await assert.rejects(
      () =>
        service.createOrganizationWithOwner({
          organizationName: 'Dup Org',
          organizationSlug: '',
          ownerName: 'Owner',
          ownerEmail: 'new-owner@example.com',
        }),
      OrganizationNameAlreadyUsedException
    )
  })
})

test.group('SuperAdminOrganizationsService.list (#75)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const service = new SuperAdminOrganizationsService({} as any)
  const params = { page: 1, search: '', minEmployees: null }

  test('exclut la plateforme, compte membres et candidats et désigne le propriétaire', async ({
    assert,
  }) => {
    const platform = await createPlatformOrganization()
    const org = await createOrganization()
    await createAdvisor(org)
    const admin = await createAdmin(org)
    await EmployeeFactory.merge({ organizationId: org.id }).createMany(3)

    const { items, pagination } = await service.list(platform.id, params)

    assert.notInclude(
      items.map((i) => i.id),
      platform.id
    )
    const item = items.find((i) => i.id === org.id)!
    assert.equal(item.usersCount, 2)
    assert.equal(item.employeesCount, 3)
    assert.equal(item.ownerId, admin.id, 'le premier admin prime sur le premier compte')
    assert.equal(pagination.total, items.length)
  })

  test("à défaut d'admin, le propriétaire est le premier compte créé", async ({ assert }) => {
    const platform = await createPlatformOrganization()
    const org = await createOrganization()
    const first = await createAdvisor(org)
    await createAdvisor(org)

    const { items } = await service.list(platform.id, params)

    assert.equal(items.find((i) => i.id === org.id)!.ownerId, first.id)
    const advisors = await User.query()
      .where('organizationId', org.id)
      .where('role', USERS_ROLES.ADVISOR)
    assert.lengthOf(advisors, 2)
  })

  test('recherche par nom, slug ou identifiant, caractères spéciaux littéraux', async ({
    assert,
  }) => {
    const platform = await createPlatformOrganization()
    const alpha = await Organization.create({ name: 'Alpha Conseil', slug: 'alpha-conseil' })
    const beta = await Organization.create({ name: 'Beta RH', slug: 'cabinet-beta' })

    const byName = await service.list(platform.id, { ...params, search: 'alpha' })
    const bySlug = await service.list(platform.id, { ...params, search: 'CABINET-b' })
    const byId = await service.list(platform.id, { ...params, search: String(beta.id) })
    const percent = await service.list(platform.id, { ...params, search: '%' })

    assert.include(
      byName.items.map((i) => i.id),
      alpha.id
    )
    assert.notInclude(
      byName.items.map((i) => i.id),
      beta.id
    )
    assert.include(
      bySlug.items.map((i) => i.id),
      beta.id
    )
    assert.notInclude(
      bySlug.items.map((i) => i.id),
      alpha.id
    )
    assert.include(
      byId.items.map((i) => i.id),
      beta.id
    )
    assert.lengthOf(percent.items, 0)
  })

  test('un identifiant hors des bornes entières ne fait pas échouer la requête', async ({
    assert,
  }) => {
    const platform = await createPlatformOrganization()

    const { items } = await service.list(platform.id, { ...params, search: '99999999999999' })

    assert.lengthOf(items, 0)
  })

  test('minEmployees filtre sur le nombre de candidats', async ({ assert }) => {
    const platform = await createPlatformOrganization()
    const small = await createOrganization()
    const big = await createOrganization()
    await EmployeeFactory.merge({ organizationId: small.id }).createMany(1)
    await EmployeeFactory.merge({ organizationId: big.id }).createMany(3)

    const { items } = await service.list(platform.id, { ...params, minEmployees: 2 })

    assert.include(
      items.map((i) => i.id),
      big.id
    )
    assert.notInclude(
      items.map((i) => i.id),
      small.id
    )
    assert.isTrue(items.every((i) => i.employeesCount >= 2))
  })

  test('pagine à LIST_PAGE_SIZE par page', async ({ assert }) => {
    const platform = await createPlatformOrganization()
    const baseline = await service.list(platform.id, params)
    const before = baseline.pagination.total
    for (let i = 0; i < LIST_PAGE_SIZE + 1; i++) {
      await Organization.create({ name: `Cabinet ${String(i).padStart(3, '0')}`, slug: `c-${i}` })
    }

    const first = await service.list(platform.id, params)
    const second = await service.list(platform.id, { ...params, page: 2 })
    const total = before + LIST_PAGE_SIZE + 1

    assert.equal(first.pagination.total, total)
    assert.equal(first.pagination.lastPage, Math.ceil(total / LIST_PAGE_SIZE))
    assert.lengthOf(first.items, LIST_PAGE_SIZE)
    assert.lengthOf(second.items, Math.min(LIST_PAGE_SIZE, total - LIST_PAGE_SIZE))
  })
})
